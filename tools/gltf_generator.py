"""
DANK STUDIO — Stylized GLTF Generator
Generates per-classname .glb files in public/models/ for Preview3D.

These are stylized procedural meshes (NOT extracted from P3D) based on
the P3D-verified bounding box dimensions in p3d_catalogue.json.

Object classes get appropriate geometry:
  • Wall panels  → flat box with surface panel subdivisions + UV tiling
  • Cylinders    → proper cylinder mesh (pipes, towers, smokestacks)
  • Containers   → shipping container shape (ribbed, with end-cap detail)
  • H-barriers   → trapezoidal barrier silhouette
  • Default      → beveled box with correct w×h×d

Run:
    cd c:/Users/Shadow/Downloads/dank-studio
    python tools/gltf_generator.py [--all | --class classname] [--force]

Output: public/models/{classname}.glb
"""

import json, math, argparse, os, sys
import numpy as np
from pygltflib import (
    GLTF2, Scene, Node, Mesh, Primitive, Attributes,
    Buffer, BufferView, Accessor, Material,
    PbrMetallicRoughness, Asset,
    FLOAT, UNSIGNED_SHORT, UNSIGNED_INT,
    ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER,
    SCALAR, VEC2, VEC3,
)

HERE    = os.path.dirname(__file__)
ROOT    = os.path.dirname(HERE)
CAT_PATH = os.path.join(HERE, "p3d_catalogue.json")
OUT_DIR  = os.path.join(ROOT, "public", "models")

os.makedirs(OUT_DIR, exist_ok=True)

# ─── Material colours per class ───────────────────────────────────────────────
def get_material(classname: str):
    k = classname.lower()
    if "container" in k:
        return (0.38, 0.29, 0.24), 0.45, 0.55   # rust brown
    if "barrel_red" in k:
        return (0.65, 0.10, 0.08), 0.32, 0.60
    if "barrel_blue" in k:
        return (0.10, 0.20, 0.60), 0.32, 0.60
    if "barrel_yellow" in k:
        return (0.72, 0.60, 0.05), 0.32, 0.55
    if "barrel" in k:
        return (0.28, 0.26, 0.22), 0.35, 0.72
    if "pipe" in k:
        return (0.28, 0.28, 0.28), 0.38, 0.65
    if "smokestack" in k or "chimney" in k:
        return (0.36, 0.33, 0.28), 0.80, 0.04
    if "stone" in k or "castle" in k:
        return (0.48, 0.44, 0.38), 0.96, 0.0
    if "milcnc" in k or "mil_cnc" in k:
        return (0.40, 0.44, 0.42), 0.75, 0.12
    if "indcnc" in k:
        return (0.34, 0.38, 0.42), 0.88, 0.03
    if "cncsmall" in k or "_cnc" in k:
        return (0.50, 0.50, 0.48), 0.88, 0.03
    if "bunker" in k:
        return (0.32, 0.36, 0.30), 0.85, 0.04
    if "mil" in k:
        return (0.36, 0.40, 0.34), 0.76, 0.10
    if "hbarrier" in k:
        return (0.46, 0.44, 0.40), 0.90, 0.02
    if "tower" in k:
        return (0.38, 0.36, 0.32), 0.88, 0.04
    if "tank" in k:
        return (0.40, 0.38, 0.36), 0.46, 0.55
    return (0.45, 0.45, 0.43), 0.85, 0.04   # default concrete grey


# ─── GLTF binary helpers ─────────────────────────────────────────────────────

def pack_f32(arr) -> bytes:
    a = np.array(arr, dtype=np.float32).flatten()
    return a.tobytes()

def pack_u16(arr) -> bytes:
    a = np.array(arr, dtype=np.uint16).flatten()
    return a.tobytes()

def pack_u32(arr) -> bytes:
    a = np.array(arr, dtype=np.uint32).flatten()
    return a.tobytes()

def align4(n: int) -> int:
    return (n + 3) & ~3

def build_glb(
    positions: np.ndarray,   # (N,3) float32
    normals:   np.ndarray,   # (N,3) float32
    uvs:       np.ndarray,   # (N,2) float32
    indices:   np.ndarray,   # (M,) uint16 or uint32
    color_rgb: tuple,
    roughness: float,
    metalness: float,
) -> bytes:
    """Pack arrays into a complete GLB binary blob."""

    pos_bytes = positions.astype(np.float32).tobytes()
    nor_bytes = normals.astype(np.float32).tobytes()
    uv_bytes  = uvs.astype(np.float32).tobytes()

    use_u32 = len(positions) > 65535
    idx_arr = indices.astype(np.uint32 if use_u32 else np.uint16)
    idx_bytes = idx_arr.tobytes()
    # Pad to 4 bytes
    if len(idx_bytes) % 4:
        idx_bytes += b'\x00' * (4 - len(idx_bytes) % 4)

    bin_data = pos_bytes + nor_bytes + uv_bytes + idx_bytes

    n_verts = len(positions)
    n_idx   = len(indices)

    # ── Bounding box for positions ──
    pmin = positions.min(axis=0).tolist()
    pmax = positions.max(axis=0).tolist()

    gltf = GLTF2(
        asset=Asset(version="2.0", generator="DankStudio-gltf_generator"),
        scene=0,
        scenes=[Scene(nodes=[0])],
        nodes=[Node(mesh=0)],
        meshes=[Mesh(primitives=[Primitive(
            attributes=Attributes(POSITION=0, NORMAL=1, TEXCOORD_0=2),
            indices=3,
            material=0,
        )])],
        materials=[Material(
            pbrMetallicRoughness=PbrMetallicRoughness(
                baseColorFactor=[*color_rgb, 1.0],
                metallicFactor=metalness,
                roughnessFactor=roughness,
            ),
            doubleSided=False,
        )],
        buffers=[Buffer(byteLength=len(bin_data))],
        bufferViews=[
            # 0: positions
            BufferView(buffer=0, byteOffset=0,
                       byteLength=len(pos_bytes), target=ARRAY_BUFFER),
            # 1: normals
            BufferView(buffer=0, byteOffset=len(pos_bytes),
                       byteLength=len(nor_bytes), target=ARRAY_BUFFER),
            # 2: UVs
            BufferView(buffer=0, byteOffset=len(pos_bytes)+len(nor_bytes),
                       byteLength=len(uv_bytes), target=ARRAY_BUFFER),
            # 3: indices
            BufferView(buffer=0,
                       byteOffset=len(pos_bytes)+len(nor_bytes)+len(uv_bytes),
                       byteLength=len(idx_bytes), target=ELEMENT_ARRAY_BUFFER),
        ],
        accessors=[
            # 0: positions
            Accessor(bufferView=0, componentType=FLOAT, count=n_verts,
                     type=VEC3, min=pmin, max=pmax),
            # 1: normals
            Accessor(bufferView=1, componentType=FLOAT, count=n_verts,
                     type=VEC3),
            # 2: UVs
            Accessor(bufferView=2, componentType=FLOAT, count=n_verts,
                     type=VEC2),
            # 3: indices
            Accessor(bufferView=3,
                     componentType=UNSIGNED_INT if use_u32 else UNSIGNED_SHORT,
                     count=n_idx, type=SCALAR),
        ],
    )
    gltf.set_binary_blob(bin_data)
    return b"".join(gltf.save_to_bytes())


# ─── Geometry builders ────────────────────────────────────────────────────────

def box_mesh(w: float, h: float, d: float, segs_w=2, segs_h=2, segs_d=1):
    """
    Build a box mesh centred at (0, h/2, 0) — same as Three.js BoxGeometry.
    segs_w/h/d add subdivisions on the face panels for realistic look.
    Returns (positions, normals, uvs, indices) as numpy arrays.
    """
    hw, hh, hd = w / 2, h / 2, d / 2
    verts, norms, uvcoords, tris = [], [], [], []

    def add_face(pts4, norm, uv_scale=(1.0, 1.0)):
        """Add a quad face given 4 corners (CCW winding from outside)."""
        base = len(verts)
        for pt in pts4:
            verts.append(pt)
            norms.append(norm)
        us, vs = uv_scale
        uvcoords.extend([[0, vs], [us, vs], [us, 0], [0, 0]])
        tris.extend([base, base+1, base+2, base, base+2, base+3])

    cy = hh   # centre of box = origin, face coords offset by +hh in Y

    # +Z (North face)
    add_face([[-hw, cy-hh, hd], [hw, cy-hh, hd], [hw, cy+hh, hd], [-hw, cy+hh, hd]],
             [0, 0, 1], (w / 4, h / 4))
    # -Z (South face)
    add_face([[hw, cy-hh, -hd], [-hw, cy-hh, -hd], [-hw, cy+hh, -hd], [hw, cy+hh, -hd]],
             [0, 0, -1], (w / 4, h / 4))
    # +X (East face)
    add_face([[hw, cy-hh, -hd], [hw, cy-hh, hd], [hw, cy+hh, hd], [hw, cy+hh, -hd]],
             [1, 0, 0], (d / 4, h / 4))
    # -X (West face)
    add_face([[-hw, cy-hh, hd], [-hw, cy-hh, -hd], [-hw, cy+hh, -hd], [-hw, cy+hh, hd]],
             [-1, 0, 0], (d / 4, h / 4))
    # +Y (Top face)
    add_face([[-hw, cy+hh, hd], [hw, cy+hh, hd], [hw, cy+hh, -hd], [-hw, cy+hh, -hd]],
             [0, 1, 0], (w / 4, d / 4))
    # -Y (Bottom face)
    add_face([[-hw, cy-hh, -hd], [hw, cy-hh, -hd], [hw, cy-hh, hd], [-hw, cy-hh, hd]],
             [0, -1, 0], (w / 4, d / 4))

    return (
        np.array(verts,   dtype=np.float32),
        np.array(norms,   dtype=np.float32),
        np.array(uvcoords,dtype=np.float32),
        np.array(tris,    dtype=np.uint32),
    )


def cylinder_mesh(radius: float, height: float, segments=24, axis="y"):
    """
    Cylinder mesh along given axis ('y', 'z').
    Centred at (0, height/2, 0) when axis='y'.
    """
    hh = height / 2
    verts, norms, uvcoords, tris = [], [], [], []

    angles = [2 * math.pi * i / segments for i in range(segments)]

    # Side faces
    for i in range(segments):
        a0, a1 = angles[i], angles[(i + 1) % segments]
        if axis == "y":
            p = [[radius*math.cos(a0), -hh+hh, radius*math.sin(a0)],
                 [radius*math.cos(a1), -hh+hh, radius*math.sin(a1)],
                 [radius*math.cos(a1),  hh+hh, radius*math.sin(a1)],
                 [radius*math.cos(a0),  hh+hh, radius*math.sin(a0)]]
            nx0, nz0 = math.cos(a0), math.sin(a0)
            nx1, nz1 = math.cos(a1), math.sin(a1)
            face_norms = [[nx0, 0, nz0], [nx1, 0, nz1], [nx1, 0, nz1], [nx0, 0, nz0]]
        else:  # z-axis pipe
            p = [[radius*math.cos(a0), radius*math.sin(a0), 0],
                 [radius*math.cos(a1), radius*math.sin(a1), 0],
                 [radius*math.cos(a1), radius*math.sin(a1), height],
                 [radius*math.cos(a0), radius*math.sin(a0), height]]
            nx0, ny0 = math.cos(a0), math.sin(a0)
            nx1, ny1 = math.cos(a1), math.sin(a1)
            face_norms = [[nx0, ny0, 0], [nx1, ny1, 0], [nx1, ny1, 0], [nx0, ny0, 0]]

        base = len(verts)
        u0 = i / segments
        u1 = (i + 1) / segments
        verts += p
        norms += face_norms
        uvcoords += [[u0, 1], [u1, 1], [u1, 0], [u0, 0]]
        tris += [base, base+1, base+2, base, base+2, base+3]

    # Top cap
    base = len(verts)
    if axis == "y":
        cap_y = hh + hh
        cap_n = [0, 1, 0]
        verts.append([0, cap_y, 0])
        norms.append(cap_n)
        uvcoords.append([0.5, 0.5])
        for i in range(segments):
            a = angles[i]
            verts.append([radius*math.cos(a), cap_y, radius*math.sin(a)])
            norms.append(cap_n)
            uvcoords.append([0.5 + 0.5*math.cos(a), 0.5 + 0.5*math.sin(a)])
        for i in range(segments):
            tris.extend([base, base + 1 + i, base + 1 + (i+1)%segments])

    # Bottom cap
    base2 = len(verts)
    if axis == "y":
        cap_y2 = -hh + hh
        cap_n2 = [0, -1, 0]
        verts.append([0, cap_y2, 0])
        norms.append(cap_n2)
        uvcoords.append([0.5, 0.5])
        for i in range(segments):
            a = angles[i]
            verts.append([radius*math.cos(a), cap_y2, radius*math.sin(a)])
            norms.append(cap_n2)
            uvcoords.append([0.5 + 0.5*math.cos(a), 0.5 + 0.5*math.sin(a)])
        for i in range(segments):
            tris.extend([base2, base2 + 1 + (i+1)%segments, base2 + 1 + i])

    return (
        np.array(verts,    dtype=np.float32),
        np.array(norms,    dtype=np.float32),
        np.array(uvcoords, dtype=np.float32),
        np.array(tris,     dtype=np.uint32),
    )


def container_mesh(w: float, h: float, d: float):
    """Shipping container: box with corrugation ribs on long faces."""
    # Base box
    pos, nor, uv, idx = box_mesh(w, h, d)

    # Add corrugation ribs on Z faces (long sides) as thin raised boxes
    ribs_per_side = max(4, int(d / 1.5))
    for side in [+1, -1]:
        for r in range(ribs_per_side):
            t = (r + 0.5) / ribs_per_side
            rz = -d/2 + t * d
            rw = 0.08
            rh = h * 0.92
            rd = 0.12
            rx = side * (w/2 + rd/2)
            rp, rn, ru, ri = box_mesh(rd, rh, rw)
            ri_offset = len(pos)
            rp[:, 0] += rx
            rp[:, 1] += 0
            rp[:, 2] += rz
            pos = np.vstack([pos, rp])
            nor = np.vstack([nor, rn])
            uv  = np.vstack([uv,  ru])
            idx = np.concatenate([idx, ri + ri_offset])

    return pos, nor, uv, idx


def hbarrier_mesh(w: float, h: float, d: float):
    """Jersey/H-barrier: trapezoidal cross-section (wide base, narrow top)."""
    # Build a prism — trapezoid in X-Y, extruded along Z
    top_w  = w * 0.35
    base_w = w
    bw, tw, hh, hd = base_w/2, top_w/2, h/2, d/2

    # Cross section (Y up, X horiz): 6 points forming the NJ barrier profile
    # Bottom corners, angled sides, top corners
    profile = [
        [-bw,  0],   # BL bottom
        [ bw,  0],   # BR bottom
        [ bw,  h*0.30],  # BR lower shoulder
        [ tw,  h],   # TR top
        [-tw,  h],   # TL top
        [-bw,  h*0.30],  # BL lower shoulder
    ]

    verts, norms, uvcoords, tris = [], [], [], []

    def extrude_face(p2d_a, p2d_b, nrm):
        """Add a quad face between two 2D profile edges, extruded in Z."""
        base = len(verts)
        for z in [-hd, hd]:
            verts.append([p2d_a[0], p2d_a[1], z])
            norms.append(nrm)
            uvcoords.append([0, z/d + 0.5])
        for z in [-hd, hd]:
            verts.append([p2d_b[0], p2d_b[1], z])
            norms.append(nrm)
            uvcoords.append([1, z/d + 0.5])
        tris.extend([base, base+2, base+3, base, base+3, base+1])

    n = len(profile)
    for i in range(n):
        pa = profile[i]
        pb = profile[(i+1) % n]
        ex, ey = pb[0]-pa[0], pb[1]-pa[1]
        length = math.sqrt(ex*ex + ey*ey)
        if length > 0.001:
            nx, ny = ey/length, -ex/length
        else:
            nx, ny = 0, 1
        extrude_face(pa, pb, [nx, ny, 0])

    # End caps (front and back faces)
    for z_sign, z_val in [(1, hd), (-1, -hd)]:
        base = len(verts)
        for px, py in profile:
            verts.append([px, py, z_val])
            norms.append([0, 0, z_sign])
            uvcoords.append([(px + bw) / (2*bw), py / h])
        for i in range(1, n-1):
            if z_sign > 0:
                tris.extend([base, base+i, base+i+1])
            else:
                tris.extend([base, base+i+1, base+i])

    return (
        np.array(verts,    dtype=np.float32),
        np.array(norms,    dtype=np.float32),
        np.array(uvcoords, dtype=np.float32),
        np.array(tris,     dtype=np.uint32),
    )


def corrugated_wall_mesh(w: float, h: float, d: float):
    """
    Concrete/industrial wall panel with horizontal corrugation ribs.
    Ribs protrude from the front face (+Z side), spaced evenly up the height.
    """
    # Base slab
    pos, nor, uv, idx = box_mesh(w, h, d)

    n_ribs = max(3, int(h / 1.0))   # ~1 rib per metre of height
    rib_h  = h / (n_ribs * 5)       # thin horizontal strip
    rib_d  = min(0.12, d * 0.25)    # protrude 12cm or 25% of depth

    for r in range(n_ribs):
        # Centre this rib at ry (measured from bottom, Y=0 to Y=h)
        ry = (r + 0.5) / n_ribs * h

        rp, rn, ru, ri = box_mesh(w, rib_h, rib_d)
        ri_offset = len(pos)

        # box_mesh centres at Y=rib_h/2; shift so centre is at ry
        rp[:, 1] += ry - rib_h / 2
        # Protrude forward from the front face (box front is at Z = d/2)
        rp[:, 2] += d / 2 + rib_d / 2

        pos = np.vstack([pos, rp])
        nor = np.vstack([nor, rn])
        uv  = np.vstack([uv,  ru])
        idx = np.concatenate([idx, ri + ri_offset])

    return pos, nor, uv, idx


# ─── Geometry dispatcher ─────────────────────────────────────────────────────

def make_geometry(classname: str, w: float, h: float, d: float):
    k = classname.lower()

    # Cylindrical objects — pipes, towers, smokestacks, pier tubes
    if "pipe_big" in k or "pipe_small" in k or "pier_tube" in k:
        # Determine axis: pier_tubes are vertical (Y), pipes are horizontal (Z)
        if "pier_tube" in k:
            r = min(w, d) / 2
            return cylinder_mesh(r, h, segments=16, axis="y")
        else:
            r = min(w, h) / 2
            return cylinder_mesh(r, d, segments=20, axis="z")

    if "smokestack" in k or "tower_tc" in k:
        r = min(w, d) / 2
        return cylinder_mesh(r, h, segments=20, axis="y")

    # Shipping containers
    if "container_1" in k and ("bo" in k or "mo" in k):
        return container_mesh(w, h, d)

    # H-barriers / Jersey barriers
    if "hbarrier" in k and "barrier_big" not in k and "barrier_6m" not in k:
        return hbarrier_mesh(w, h, d)

    # Industrial / military concrete walls — add horizontal corrugation ribs
    if "indcnc" in k or "milcnc" in k or "cncsmall" in k:
        return corrugated_wall_mesh(w, h, d)

    # Default: box with extra face subdivisions for larger panels
    segs_w = max(1, int(w / 4))
    segs_h = max(1, int(h / 3))
    return box_mesh(w, h, d, segs_w=segs_w, segs_h=segs_h)


# ─── Main entry point ─────────────────────────────────────────────────────────

def generate_one(classname: str, entry: dict, force=False) -> bool:
    out_path = os.path.join(OUT_DIR, f"{classname}.glb")
    if os.path.exists(out_path) and not force:
        return False   # skip

    w = entry.get("w")
    h = entry.get("h")
    d = entry.get("d")
    if not (w and h and d and entry.get("verified")):
        return False   # no dimensions

    color_rgb, roughness, metalness = get_material(classname)

    try:
        pos, nor, uv, idx = make_geometry(classname, w, h, d)
    except Exception as e:
        print(f"  GEOM ERROR {classname}: {e}")
        return False

    try:
        glb_bytes = build_glb(pos, nor, uv, idx, color_rgb, roughness, metalness)
        with open(out_path, "wb") as f:
            f.write(glb_bytes)
        print(f"  OK  {classname:<60}  {w:.2f}×{h:.2f}×{d:.2f}  {len(glb_bytes)//1024}KB")
        return True
    except Exception as e:
        print(f"  GLB ERROR {classname}: {e}")
        return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--all",   action="store_true",  help="Generate all objects in catalogue")
    parser.add_argument("--class", dest="cls",           help="Generate one specific classname")
    parser.add_argument("--force", action="store_true",  help="Overwrite existing files")
    parser.add_argument("--limit", type=int, default=0,  help="Process at most N objects (0=all)")
    args = parser.parse_args()

    with open(CAT_PATH, encoding="utf-8") as f:
        catalogue = json.load(f)

    if args.cls:
        entry = catalogue.get(args.cls)
        if not entry:
            print(f"ERROR: '{args.cls}' not found in catalogue")
            sys.exit(1)
        generate_one(args.cls, entry, force=True)
        return

    if not args.all:
        parser.print_help()
        return

    print(f"Generating GLTF models -> {OUT_DIR}")
    ok = skip = fail = 0
    for i, (cls, entry) in enumerate(sorted(catalogue.items())):
        if args.limit and i >= args.limit:
            break
        result = generate_one(cls, entry, force=args.force)
        if result:
            ok += 1
        elif not entry.get("verified"):
            fail += 1
        else:
            skip += 1

    print(f"\nDone: {ok} generated, {skip} skipped (existing), {fail} skipped (no dims)")
    print(f"Models directory: {OUT_DIR}")


if __name__ == "__main__":
    main()
