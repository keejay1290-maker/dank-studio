# 🏛️ ARCHITECTURAL PERFECTION SKILL

This skill enforces the **DANKVAULT_STABLE_V2_FINALIZE** standard for absolute geometric fidelity.

## 📐 THE ARCHITECTURAL CONSTANTS
- **Standard Wall Width**: 8.0 meters (`staticobj_wall_milcnc_4`).
- **Optimal Overlap**: 0.8 (Ensures 20% surface intersection to prevent microscopic gaps).
- **Height Step**: 3.5 meters (Standard floor height).
- **Safety Limit**: 1200 Objects (Hard server limit).

## 🧩 GEOMETRIC RULES
1.  **Dynamic Tiling (Arc-Length Parameterization)**: 
    - `nPanels = Math.ceil((2 * Math.PI * radius) / (8.0 * 0.8))`
    - This formula MUST be recalculated at every latitude/ring to ensure consistent density.
2.  **YPR Conversion Protocol**:
    - All builds must store and export rotations as `ypr: [yaw, pitch, roll]` in **Degrees**.
    - Yaw must align to the longitude tangent.
    - Pitch must align to the sphere normal.

## 🛡️ THE GOVERNOR (1200 LIMIT)
- If a generator predicts a total count `N > 1200`:
  - **Auto-Scale**: Reduce the `radius` of the build using the factor `(1200 / N) * 0.95`.
  - **Gap Integrity**: Ensure that even after scaling, the `nPanels` recalculates to maintain zero gaps.

## ✅ VERIFICATION CHECKLIST
- [ ] Are panels overlapping by at least 15%?
- [ ] Is the rotation format 1:1 with `Editor\Custom` JSON files?
- [ ] Is the build radius capped to fit within 1200 objects?
- [ ] Are all "test" placeholders removed?
