"""
DANK STUDIO — DayZ PAA Texture Extractor
Converts DayZ .paa textures to PNG using ImageToPAA.exe from DayZ Tools.
Outputs to public/textures/ for use in Preview3D.

Run:
    python tools/extract_textures.py

Output: public/textures/*.png  (real DayZ textures, ~200KB-2MB each)
"""

import os, subprocess, sys

HERE    = os.path.dirname(__file__)
ROOT    = os.path.dirname(HERE)
OUT_DIR = os.path.join(ROOT, "public", "textures")
os.makedirs(OUT_DIR, exist_ok=True)

IMAGETOPAA = r"C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\ImageToPAA\ImageToPAA.exe"
DZ_BASE    = r"C:\Users\Shadow\Documents\DayZ Projects\DZ"

# ── Texture definitions ────────────────────────────────────────────────────────
# Format: (output_name, relative_path_under_DZ_BASE)
TEXTURES = [
    # Industrial concrete — indcnc walls (IND10, INDC4, INDCH)
    ("indcnc_co",           r"structures\data\concrete\concrete_wall_co.paa"),
    ("indcnc_nohq",         r"structures\data\concrete\concrete_wall_nohq.paa"),

    # Small/old concrete — cncsmall walls
    ("cncsmall_co",         r"structures\data\concrete\concrete_old_co.paa"),
    ("cncsmall_nohq",       r"structures\data\concrete\concrete_old_co.paa"),

    # Military concrete — milcnc
    ("milcnc_co",           r"structures\data\concrete\concretemil_old_co.paa"),

    # Rough bare concrete — castle walls, bunkers
    ("concrete_rough_co",   r"structures\data\concrete\concrete_bare_rough_co.paa"),

    # Stone walls
    ("stone_co",            r"structures\walls\data\wall_stone_co.paa"),
    ("stone_nohq",          r"structures\walls\data\wall_stone_nohq.paa"),

    # Metal — pipes, barrels
    ("metal_co",            r"structures\data\metal\metal01_co.paa"),
    ("metal_clean_co",      r"structures\data\metal\metalclean1_co.paa"),

    # Rusty metal — containers, tanks
    ("rust_co",             r"structures\data\metal\metal_red_dirty_co.paa"),

    # Shipping containers
    ("container_co",        r"structures\industrial\containers\data\containers_colors_03_co.paa"),
    ("container_alt_co",    r"structures\industrial\containers\data\containers_colors_04_co.paa"),

    # Brick
    ("brick_co",            r"structures\data\bricks\bricks_broken_dirt_co.paa"),

    # Military/bunker
    ("mil_co",              r"structures\data\concrete\concretemil_old_co.paa"),

    # Barrel textures
    ("barrel_red_co",       r"gear\containers\data\barrel_red_co.paa"),
    ("barrel_blue_co",      r"gear\containers\data\barrel_blue_co.paa"),
    ("barrel_green_co",     r"gear\containers\data\barrel_green_co.paa"),

    # Pipes/smokestacks
    ("pipe_co",             r"structures\industrial\coalplant\data\coalplant_pipes_co.paa"),

    # H-barriers (same concrete_old as cncsmall)
    ("hbarrier_co",         r"structures\data\concrete\concrete_bare_rough_co.paa"),
]


def convert(src: str, dst: str) -> bool:
    if not os.path.exists(src):
        print(f"  MISS  {os.path.basename(src)}")
        return False
    if os.path.exists(dst):
        print(f"  SKIP  {os.path.basename(dst)} (exists)")
        return True
    try:
        result = subprocess.run(
            [IMAGETOPAA, src, dst],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0 and os.path.exists(dst):
            kb = os.path.getsize(dst) // 1024
            print(f"  OK    {os.path.basename(dst)}  ({kb}KB)")
            return True
        else:
            print(f"  FAIL  {os.path.basename(src)}: {result.stderr.strip()}")
            return False
    except Exception as e:
        print(f"  ERR   {os.path.basename(src)}: {e}")
        return False


if not os.path.exists(IMAGETOPAA):
    print("ERROR: ImageToPAA.exe not found at:", IMAGETOPAA)
    sys.exit(1)

print(f"Extracting DayZ textures -> {OUT_DIR}\n")
ok = fail = 0
for name, rel in TEXTURES:
    src = os.path.join(DZ_BASE, rel)
    dst = os.path.join(OUT_DIR, f"{name}.png")
    if convert(src, dst):
        ok += 1
    else:
        fail += 1

print(f"\nDone: {ok} extracted, {fail} failed/missing")
print(f"Textures: {OUT_DIR}")
