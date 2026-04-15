"""
DANK STUDIO — Blender P3D -> GLTF Batch Converter
Uses Arma 3 Object Builder addon (bpy.ops.a3ob.import_p3d).

Run:
    blender --background --python tools/p3d_blender_convert.py -- [options]

Options:
    --all              Convert all objects in p3d_catalogue.json
    --class NAME       Convert one specific classname
    --limit N          Process at most N objects
    --force            Overwrite existing GLB files

Output: public/models/{classname}.glb  (real P3D mesh, ~10-400KB each)

The real meshes replace the stylized-box GLBs from gltf_generator.py.
Preview3D.tsx loads them via useGLTF when available.
"""

import sys, os, json, argparse

# Blender passes its own args before "--"; our args come after
args_raw = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
parser = argparse.ArgumentParser()
parser.add_argument("--all",   action="store_true")
parser.add_argument("--class", dest="cls")
parser.add_argument("--limit", type=int, default=0)
parser.add_argument("--force", action="store_true")
args = parser.parse_args(args_raw)

try:
    import bpy
except ImportError:
    print("ERROR: Must be run inside Blender:")
    print('  blender --background --python tools/p3d_blender_convert.py -- --all')
    sys.exit(1)

# ── Enable addon ──────────────────────────────────────────────────────────────
bpy.ops.preferences.addon_enable(module="Arma3ObjectBuilder")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR   = os.path.dirname(SCRIPT_DIR)
CAT_PATH   = os.path.join(SCRIPT_DIR, "p3d_catalogue.json")
OUT_DIR    = os.path.join(ROOT_DIR, "public", "models")
DZ_STRUCT  = r"C:\Users\Shadow\Documents\DayZ Projects\DZ\structures"
DZ_BLISS   = r"C:\Users\Shadow\Documents\DayZ Projects\DZ\structures_bliss"

os.makedirs(OUT_DIR, exist_ok=True)

with open(CAT_PATH, encoding="utf-8") as f:
    catalogue = json.load(f)


def resolve_p3d(entry: dict) -> str | None:
    """Map catalogue 'file' field to absolute P3D path."""
    rel = entry.get("file", "")
    if not rel:
        return None
    # rel is like "structures/walls/wall_cncsmall_8.p3d"
    # or "structures_bliss/walls/..."
    if rel.startswith("structures_bliss/"):
        # Strip the "structures_bliss/" prefix, join with DZ_BLISS
        inner = rel[len("structures_bliss/"):]
        full = os.path.join(DZ_BLISS, inner.replace("/", os.sep))
    else:
        # Strip the "structures/" prefix (or whichever category dir)
        # The catalogue stores e.g. "structures/walls/wall_cncsmall_8.p3d"
        parts = rel.split("/")
        # parts[0] = "structures", rest = subpath
        inner = os.sep.join(parts[1:]) if len(parts) > 1 else parts[0]
        full = os.path.join(DZ_STRUCT, inner)
    return full if os.path.exists(full) else None


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    # Clean up orphan data
    for block in bpy.data.meshes:
        if block.users == 0:
            bpy.data.meshes.remove(block)


def convert_one(classname: str, p3d_path: str, out_path: str) -> bool:
    clear_scene()

    # Import P3D — load only LOD 0 (visual resolution = 1.0, 2.0, 3.0, 4.0)
    try:
        result = bpy.ops.a3ob.import_p3d(
            filepath=p3d_path,
            # Import settings: keep defaults; we'll filter LODs after
        )
    except Exception as e:
        print(f"    IMPORT FAIL: {e}")
        return False

    if result != {"FINISHED"}:
        print(f"    IMPORT RESULT: {result}")
        return False

    # Filter: keep only the visual LOD (lowest resolution index → highest detail)
    # The addon names LODs by their resolution in the object name
    all_objs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    if not all_objs:
        print(f"    NO MESH imported")
        return False

    # Sort by name — the first LOD (LOD_0.000 or similar) is usually highest detail
    # Keep only the first one
    all_objs.sort(key=lambda o: o.name)
    keep = all_objs[:1]
    remove = all_objs[1:]

    for obj in bpy.context.scene.objects:
        obj.select_set(obj in keep)

    bpy.ops.object.delete({"selected_objects": remove})

    # Ensure the kept object is selected and active
    bpy.context.view_layer.objects.active = keep[0]
    keep[0].select_set(True)

    # Apply any pending transforms
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # Export to GLB
    try:
        bpy.ops.export_scene.gltf(
            filepath=out_path,
            export_format="GLB",
            use_selection=True,
            export_apply=True,
            export_normals=True,
            export_texcoords=True,
            export_materials="EXPORT",
            export_colors=False,
        )
    except Exception as e:
        print(f"    EXPORT FAIL: {e}")
        return False

    return os.path.exists(out_path) and os.path.getsize(out_path) > 100


# ── Main ─────────────────────────────────────────────────────────────────────
if args.cls:
    targets = {args.cls: catalogue[args.cls]} if args.cls in catalogue else {}
    if not targets:
        print(f"ERROR: '{args.cls}' not in catalogue")
        sys.exit(1)
elif args.all:
    targets = catalogue
else:
    print("Usage: blender --background --python tools/p3d_blender_convert.py -- --all [--force] [--limit N]")
    sys.exit(0)

ok = skip = fail = 0

print(f"\nP3D -> GLTF conversion: {len(targets)} targets")
print(f"Output: {OUT_DIR}")
print()

for i, (cls, entry) in enumerate(sorted(targets.items())):
    if args.limit and i >= args.limit:
        break

    out_path = os.path.join(OUT_DIR, f"{cls}.glb")
    if os.path.exists(out_path) and not args.force:
        skip += 1
        continue

    p3d_path = resolve_p3d(entry)
    if not p3d_path:
        print(f"  MISS  {cls}")
        fail += 1
        continue

    print(f"  [{i+1:3d}] {cls}")
    if convert_one(cls, p3d_path, out_path):
        kb = os.path.getsize(out_path) // 1024
        print(f"         OK  {kb}KB  ({p3d_path})")
        ok += 1
    else:
        fail += 1

print(f"\nDone: {ok} converted, {skip} skipped (existing), {fail} failed/missing")
