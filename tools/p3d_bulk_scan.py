"""
DANK STUDIO — Comprehensive ODOL P3D Bounding Box Scanner v2
Correct ODOL v54 format: bbox stored as [min_vec3, max_vec3]
= [xmin, ymin, zmin, xmax, ymax, zmax]

Scans both structures/ and structures_bliss/ directories.
Output: tools/p3d_catalogue.json
"""

import struct, os, json, math

DZ      = r"C:\Users\Shadow\Documents\DayZ Projects\DZ\structures"
DZ_B    = r"C:\Users\Shadow\Documents\DayZ Projects\DZ\structures_bliss"

# Skip variants that share geometry with the primary file
SKIP_SUFFIXES = (
    "_nolc", "_d", "_d_2", "_ladder", "_ghost1", "_ghost2",
    "_strobili1", "_strobili2", "_vaccinium1", "_vaccinium2",
    "_vacciniumredgreen", "_viminibus", "_vaccinumtall",
    "_grass_l", "_grass_r", "_graffiti",
)

# ── Per-directory config: (base_dir, rel_path, prefix, special_map_or_None) ─
# classname = prefix + "_" + stem   (unless special_map overrides it)
SCAN_DIRS = [
    # ── WALLS ──────────────────────────────────────────────────────────────────
    (DZ,   "walls",                              "staticobj",         None),
    (DZ_B, "walls",                              "staticobj",         None),

    # ── PIPES ──────────────────────────────────────────────────────────────────
    (DZ,   "industrial/pipes",                   "staticobj",         None),
    (DZ_B, "industrial/pipes",                   "staticobj",         None),

    # ── HARBOUR (pier tubes) ───────────────────────────────────────────────────
    (DZ,   "industrial/harbour",                 "staticobj",         None),
    (DZ_B, "industrial/harbour",                 "staticobj",         None),

    # ── CONTAINERS ─────────────────────────────────────────────────────────────
    (DZ,   "industrial/containers",              "land",              None),
    (DZ_B, "industrial/containers",              "land",              None),

    # ── TANKS ──────────────────────────────────────────────────────────────────
    (DZ,   "industrial/tanks",                   "land",              None),
    (DZ_B, "industrial/dieselpowerplant",        "land",              None),

    # ── SMOKESTACKS ────────────────────────────────────────────────────────────
    (DZ,   "industrial/smokestacks",             "land",              None),
    (DZ_B, "industrial/smokestacks",             "land",              None),

    # ── INDUSTRIAL MISC ────────────────────────────────────────────────────────
    (DZ,   "industrial/misc",                    "staticobj",         None),
    (DZ_B, "industrial/misc",                    "staticobj",         None),

    # ── MILITARY MISC (special classname lookup) ───────────────────────────────
    (DZ,   "military/misc",                      "staticobj_mil",     {
        "roadblock_cncblock":       "staticobj_roadblock_cncblock",
        "roadblock_cncblocks_long": "staticobj_roadblock_cncblocks_long",
        "roadblock_cncblocks_short":"staticobj_roadblock_cncblocks_short",
        "roadblock_pillbox":        "staticobj_roadblock_pillbox",
        "roadblock_bags_long":      "staticobj_roadblock_bags_long",
        "roadblock_bags_curve":     "staticobj_roadblock_bags_curve",
        "roadblock_bags_endl":      "staticobj_roadblock_bags_endl",
        "roadblock_bags_endr":      "staticobj_roadblock_bags_endr",
        "roadblock_wood_long":      "staticobj_roadblock_wood_long",
        "roadblock_wood_small":     "staticobj_roadblock_wood_small",
        "roadblock_woodencrate":    "staticobj_roadblock_woodencrate",
        "roadblock_table":          "staticobj_roadblock_table",
        "misc_barbedwire":          "staticobj_misc_barbedwire",
        "misc_razorwire":           "staticobj_misc_razorwire",
        "misc_dragonteeth":         "staticobj_misc_dragonteeth",
        "misc_dragonteeth_big":     "staticobj_misc_dragonteeth_big",
        "misc_flagpole":            "staticobj_misc_flagpole",
        "misc_gunrack":             "staticobj_misc_gunrack",
        "misc_concreteblock1":      "staticobj_misc_concreteblock1",
        "misc_concreteblock2":      "staticobj_misc_concreteblock2",
        "misc_hedgehog_concrete":   "staticobj_misc_hedgehog_concrete",
        "misc_hedgehog_iron":       "staticobj_misc_hedgehog_iron",
        "misc_bagfence_3m":         "staticobj_misc_bagfence_3m",
        "misc_bagfence_corner":     "staticobj_misc_bagfence_corner",
        "misc_bagfence_round":      "staticobj_misc_bagfence_round",
        "misc_cover_big":           "staticobj_misc_cover_big",
        "misc_cover_small":         "staticobj_misc_cover_small",
        "misc_supplybox1":          "staticobj_misc_supplybox1",
        "misc_supplybox2":          "staticobj_misc_supplybox2",
        "misc_supplybox3":          "staticobj_misc_supplybox3",
        "mil_guardshed":            "land_mil_guardshed",
        "mil_artilery_rampart":     "land_mil_artilery_rampart",
        "mil_artillery_nest":       "land_mil_artillery_nest",
        "mil_fortified_nest_big":   "land_mil_fortified_nest_big",
        "mil_fortified_nest_small": "land_mil_fortified_nest_small",
        "mil_fortified_nest_watchtower": "land_mil_fortified_nest_watchtower",
        "misc_obstacle_bridge":     "staticobj_misc_obstacle_bridge",
        "misc_obstacle_crawl":      "staticobj_misc_obstacle_crawl",
        "misc_obstacle_ramp":       "staticobj_misc_obstacle_ramp",
    }),
    (DZ_B, "military/misc",                     "staticobj_mil",     {
        "misc_dragonteeth_multiple":          "staticobj_misc_dragonteeth_multiple",
        "misc_dragonteeth_multiple_redwhite": "staticobj_misc_dragonteeth_multiple_redwhite",
        "misc_dragonteeth_single":            "staticobj_misc_dragonteeth_single",
        "misc_dragonteeth_single_redwhite":   "staticobj_misc_dragonteeth_single_redwhite",
        "misc_deconshower_large":             "staticobj_misc_deconshower_large",
    }),

    # ── MILITARY IMPROVISED (hbarriers, tents) ─────────────────────────────────
    (DZ,   "military/improvised",               "staticobj_mil",     {
        "hbarrier_1m":         "staticobj_mil_hbarrier_1m",
        "hbarrier_4m":         "staticobj_mil_hbarrier_4m",
        "hbarrier_6m":         "staticobj_mil_hbarrier_6m",
        "hbarrier_big":        "staticobj_mil_hbarrier_big",
        "hbarrier_round":      "staticobj_mil_hbarrier_round",
        "roadblock_bags_long": "staticobj_roadblock_bags_long",
        "mil_guardshed":       "land_mil_guardshed",
        "mil_tent_big1_1":     "land_mil_tent_big1_1",
        "mil_tent_big2_1":     "land_mil_tent_big2_1",
        "mil_tent_big3":       "land_mil_tent_big3",
        "mil_tent_big4":       "land_mil_tent_big4",
        "mil_fortified_nest_big":       "land_mil_fortified_nest_big",
        "mil_fortified_nest_small":     "land_mil_fortified_nest_small",
        "mil_fortified_nest_watchtower":"land_mil_fortified_nest_watchtower",
    }),

    # ── MILITARY HOUSES ────────────────────────────────────────────────────────
    (DZ,   "military/houses",                   "land",              None),
    (DZ_B, "military/houses",                   "land",              None),

    # ── MILITARY BUNKERS (bliss) ───────────────────────────────────────────────
    (DZ_B, "military/bunkers",                  "land",              None),

    # ── MILITARY AIRFIELD ──────────────────────────────────────────────────────
    (DZ,   "military/airfield",                 "land",              None),

    # ── MILITARY TISY ──────────────────────────────────────────────────────────
    (DZ,   "military/tisy",                     "land",              None),

    # ── CASTLES ────────────────────────────────────────────────────────────────
    (DZ,   "specific/castles",                  "land",              None),

    # ── TOWERS ─────────────────────────────────────────────────────────────────
    (DZ,   "specific/towers",                   "land",              None),

    # ── STATUES / MONUMENTS ────────────────────────────────────────────────────
    (DZ,   "specific/statues",                  "staticobj",         {
        "monument_war1":      "staticobj_monument_war1",
        "monument_war2":      "staticobj_monument_war2",
        "monument_soldiers":  "staticobj_monument_soldiers",
        "monument_t34":       "staticobj_monument_t34",
        "monument_wall":      "staticobj_monument_wall",
        "monument_mig21":     "land_monument_mig21",
        "modelmonument_mig21":"land_modelmonument_mig21",
        "model_plane_mig21":  "land_model_plane_mig21",
        "statue_general":     "land_statue_general",
    }),

    # ── PRISON ─────────────────────────────────────────────────────────────────
    (DZ,   "specific/prison",                   "land",              None),

    # ── WRECKS ─────────────────────────────────────────────────────────────────
    (DZ_B, "wrecks/ships",                      "staticobj",         None),
    (DZ_B, "wrecks/vehicles",                   "staticobj",         None),
]


# ── ODOL bbox extraction ──────────────────────────────────────────────────────

def extract_bbox(path):
    """
    Extract bounding box from ODOL v54 P3D file.
    ODOL bbox format: [xmin, ymin, zmin, xmax, ymax, zmax] (two Vector3s).
    Known location: offset 92 (0x5C) in most v54 files.
    Falls back to scanning first 4096 bytes.
    Returns (w, h, d) tuple or None.
    """
    try:
        with open(path, "rb") as f:
            data = f.read(4096)
    except Exception:
        return None

    if data[:4] != b"ODOL":
        return None

    def try_at(offset):
        if offset + 24 > len(data):
            return None
        try:
            xmin, ymin, zmin, xmax, ymax, zmax = struct.unpack_from("<6f", data, offset)
        except struct.error:
            return None
        if not all(math.isfinite(v) for v in [xmin, ymin, zmin, xmax, ymax, zmax]):
            return None
        # Min must be < max for all axes
        if xmin >= xmax or zmin >= zmax:
            return None
        # ymin can be >=0 for ground-aligned objects; just need ymin < ymax
        if ymin >= ymax:
            return None
        # Plausible architectural dimensions: 0.05m to 220m
        w = xmax - xmin
        h = ymax - ymin
        d = zmax - zmin
        if not (0.05 < w < 220 and 0.05 < h < 220 and 0.05 < d < 220):
            return None
        # Reject if any value is out of range entirely
        if any(abs(v) > 250 for v in [xmin, ymin, zmin, xmax, ymax, zmax]):
            return None
        return round(w, 3), round(h, 3), round(d, 3)

    # Fast path: known ODOL v54 bbox offset
    result = try_at(92)
    if result:
        return result
    # Also try 116 (sometimes bbox repeats or header varies slightly)
    result = try_at(116)
    if result:
        return result

    # Full scan
    best = None
    best_score = 0.0
    for i in range(4, min(len(data) - 24, 2048), 4):
        dims = try_at(i)
        if dims is None:
            continue
        w, h, d = dims
        # Prefer results that look symmetric (centered models)
        # and have realistic proportions
        xmin, ymin, zmin, xmax, ymax, zmax = struct.unpack_from("<6f", data, i)
        sym_x = min(abs(xmin), abs(xmax)) / max(abs(xmin), abs(xmax)) if max(abs(xmin), abs(xmax)) > 0 else 0
        sym_z = min(abs(zmin), abs(zmax)) / max(abs(zmin), abs(zmax)) if max(abs(zmin), abs(zmax)) > 0 else 0
        score = sym_x + sym_z
        if score > best_score:
            best_score = score
            best = dims

    return best


# ── Main scan ─────────────────────────────────────────────────────────────────

def scan():
    catalogue = {}   # classname → entry
    seen_paths = set()
    failed = []
    total_ok = 0

    for (base, rel, prefix, special_map) in SCAN_DIRS:
        full_dir = os.path.join(base, rel.replace("/", os.sep))
        if not os.path.isdir(full_dir):
            continue

        p3d_files = sorted(f for f in os.listdir(full_dir) if f.lower().endswith(".p3d"))
        label = ("structures_bliss/" if base == DZ_B else "structures/") + rel
        print(f"\n[{label}] — {len(p3d_files)} files")

        for fname in p3d_files:
            stem = fname[:-4].lower()

            # Skip LOD/variant duplicates
            if any(stem.endswith(s) for s in SKIP_SUFFIXES):
                continue

            path = os.path.join(full_dir, fname)
            if path in seen_paths:
                continue
            seen_paths.add(path)

            # Determine classname
            if special_map and stem in special_map:
                classname = special_map[stem]
            else:
                classname = f"{prefix}_{stem}"

            # Extract bbox
            dims = extract_bbox(path)

            rel_path = label + "/" + fname

            if dims:
                w, h, d = dims
                entry = {
                    "w": w, "h": h, "d": d,
                    "file": rel_path,
                    "verified": True,
                }
                # Note orientation hint for long thin objects
                longest = max(w, h, d)
                if longest > 5 * min(w, h, d):
                    if d == longest:
                        entry["note"] = "horizontal pipe (long axis = depth/Z)"
                    elif w == longest:
                        entry["note"] = "horizontal (long axis = width/X)"
                    elif h == longest:
                        entry["note"] = "vertical (long axis = height/Y)"

                # Don't overwrite a verified entry with a duplicate from bliss
                if classname not in catalogue or not catalogue[classname].get("verified"):
                    catalogue[classname] = entry
                total_ok += 1
                print(f"  OK  {classname:58s} {w:.3f} x {h:.3f} x {d:.3f}")
            else:
                if classname not in catalogue:
                    catalogue[classname] = {"w": None, "h": None, "d": None, "file": rel_path, "verified": False}
                failed.append((classname, rel_path))
                print(f"  FAIL {classname}")

    print(f"\n{'='*70}")
    print(f"Verified entries : {total_ok}")
    print(f"Failed extractions: {len(failed)}")
    print(f"Total catalogue  : {len(catalogue)}")

    # Save
    out_path = os.path.join(os.path.dirname(__file__), "p3d_catalogue.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(catalogue, f, indent=2, sort_keys=True)
    print(f"\nSaved: {out_path}")

    # Also dump a readable summary sorted by classname
    summary_path = os.path.join(os.path.dirname(__file__), "p3d_catalogue_summary.txt")
    with open(summary_path, "w", encoding="utf-8") as f:
        f.write("DANK STUDIO — Verified DayZ Object Dimensions (from ODOL P3D)\n")
        f.write("=" * 70 + "\n\n")
        f.write(f"{'CLASSNAME':<55} {'W':>7} {'H':>7} {'D':>7}  NOTE\n")
        f.write("-" * 90 + "\n")
        for cls in sorted(catalogue.keys()):
            e = catalogue[cls]
            if e["verified"]:
                note = e.get("note", "")
                f.write(f"{cls:<55} {e['w']:>7.3f} {e['h']:>7.3f} {e['d']:>7.3f}  {note}\n")
        f.write("\n\n--- FAILED (no bbox extracted) ---\n")
        for cls, path in sorted(failed):
            f.write(f"  {cls}  ({path})\n")
    print(f"Summary: {summary_path}")

    return catalogue


if __name__ == "__main__":
    scan()
