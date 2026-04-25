#!/usr/bin/env python3
"""Mechanically split shapes.ts into category files.

Each category file gets a standard header (imports) and the slice of shapes.ts
content for its line range. shapes.ts becomes a barrel that re-exports from
all category files.

Run this ONCE; commit the output. Verify with `npx tsc --noEmit` and
`node tools/validate_builds.mjs` afterward.
"""
import os, sys

SHAPES = "src/lib/generators/shapes.ts"
OUT_DIR = "src/lib/generators"

# (file_basename, start_line_inclusive, end_line_inclusive)
# Lines based on shapes.ts AFTER the _constants extraction.
SECTIONS = [
    ("category_scifi.ts",         27,   1383),  # SCI-FI
    ("category_monuments.ts",     1384, 2388),  # MONUMENTS
    ("category_fantasy.ts",       2389, 2947),  # FANTASY + IRON THRONE
    ("category_containers.ts",    2948, 3822),  # CONTAINER BUILDS
    ("category_structures.ts",    3823, 4158),  # STRUCTURES / MILITARY
    ("category_naval.ts",         4159, 4764),  # NAVAL / INDUSTRIAL
    ("category_geometric.ts",     4765, 4925),  # GEOMETRIC / UNIQUE
    ("category_primitives.ts",    4926, 5536),  # PRIMITIVES
    ("category_landmarks_extra.ts", 5537, 9999), # ALHAMBRA / HAGIA / RIVENDELL / ISENGARD / NEW LANDMARKS / MEGA
]

HEADER = """// AUTO-SPLIT from shapes.ts by tools/split_shapes.py — do not hand-edit headers.
// Add new generators normally inside this file; they will export through the
// shapes.ts barrel.
import type {{ Point3D }} from "../../types";
import {{
  drawWall, drawRing, drawRect, drawDisk, drawSphere, drawDome,
  drawSphereBudgeted, _drawSphereRings, applyLimit,
}} from "../../draw";
import {{
  CASTLE, STONE, STONE2, CNC8, CNC4, MILCNC, IND10,
  _CD, _CH, _CW, _C_PALETTE, _cpick,
}} from "../_constants";
import type {{ GenParams }} from "../_constants";

// ─────────────────────────────────────────────────────────────────────────────
// {category}
// ─────────────────────────────────────────────────────────────────────────────

"""

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src = os.path.join(root, SHAPES)
    with open(src, encoding="utf-8") as f:
        lines = f.readlines()

    # Make subdir for category files so import paths are clear
    cat_dir = os.path.join(root, OUT_DIR, "categories")
    os.makedirs(cat_dir, exist_ok=True)

    barrel_lines = [
        "// shapes.ts — Barrel re-export from category files.",
        "// Generators are now organised under generators/categories/*.ts.",
        "// Shared constants + types live in generators/_constants.ts.",
        "",
        "export type { GenParams } from \"./_constants\";",
        "export {",
        "  CASTLE, STONE, STONE2, CNC8, CNC4, MILCNC, IND10,",
        "  _CD, _CH, _CW, _C_PALETTE, _cpick,",
        "} from \"./_constants\";",
        "",
    ]

    # Header section (lines 1..26) preserved as comment in shapes.ts
    header_block = "".join(lines[:26])

    for fname, start, end in SECTIONS:
        end_ix = min(end, len(lines))
        body = "".join(lines[start - 1 : end_ix])
        category_label = fname.replace("category_", "").replace(".ts", "").upper()
        out_path = os.path.join(cat_dir, fname)
        with open(out_path, "w", encoding="utf-8", newline="\n") as f:
            f.write(HEADER.format(category=category_label))
            f.write(body)
        rel = f"./categories/{fname[:-3]}"
        barrel_lines.append(f"export * from \"{rel}\";")
        print(f"wrote {out_path} ({end_ix - start + 1} lines)")

    # Replace shapes.ts with barrel
    shapes_path = os.path.join(root, SHAPES)
    with open(shapes_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(header_block.rstrip() + "\n\n")
        f.write("\n".join(barrel_lines) + "\n")
    print(f"rewrote {shapes_path} as barrel")

if __name__ == "__main__":
    main()
