# 📖 THE ANTIGRAVITY ARCHITECTURAL REFERENCE
# "The Book of Procedural Mastery"

## 📐 SECTION 1: SPATIAL MATHEMATICS
- **Quaternion Rotation**: `[x, y, z, w]` rotations ensure gimbal-lock-free tilting for structures like the Leaning Tower of Pisa or the Millennium Falcon bank.
- **Parametric Curve Tiling**: For pointed arches:
  - `x(t) = R * (1 - cos(t))`
  - `y(t) = R * sin(t)`
  - Step `dt = ObjectWidth / ArcLength(R, t)`.

## 🏰 SECTION 2: ARCHITECTURAL GENOTYPES
### GOTHIC (e.g. Hogwarts, Azkaban)
- **The Ribbed Vault**: 4 Arches intersecting at a central keystone.
- **The Pinnacle**: High-aspect ratio tapering boxes at the corner of every main buttress.

### SCI-FI (e.g. Death Star, Starship)
- **Greebling**: Adding high-frequency surface noise (small blocks at random offsets) to break up flat planes.
- **Hull Plating**: Staggered `drawWall` calls with 0.1m height offsets to create "Shadow Lines."

## 🛠️ SECTION 3: THE PERFECTION TOOLS
- `audit_syntax.ps1`: My "Internal Compiler" (Prevents code breaks).
- `audit_geometry.py`: My "Density Scanner" (Prevents blobs and gaps).
- `mathjs` & `three.js`: My "Precision Engines".
