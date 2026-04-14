# 📖 DS-1 TECHNICAL DOSSIER: Death Star Perfection

## 📐 DIMENSIONAL RATIOS (Normalized)
| Feature | Canon Spec | Build Ratio |
| :--- | :--- | :--- |
| **Total Diameter** | 160 km | 1.00 |
| **Superlaser Dish Ø** | 35.5 km | ~0.22 |
| **Dish Latitude** | North | +0.80 rad (approx) |
| **Trench Width** | 100 m | ~0.005 |

## 📐 ARCHITECTURAL RULES
1.  **Skin Density**: Panels must overlap by exactly 10% to eliminate 'Lattice Gaps'.
2.  **Rotation (YPR)**:
    -   `Yaw = -theta * (180/PI) + 90`
    -   `Pitch = (phi - PI/2) * (180/PI)`
    -   This orientates the panel normal perfectly to the sphere center.
3.  **The Concave Dish**:
    -   Depth must be achieved through **Spherical Projection**, not flat layering.
    -   Dish Emitter focal point: Center of the concavity.

## 🏚️ VISUAL FIDELITY (GREEBLING)
-   **Staggered Overlap**: Panels should be slightly offset vertically to create shadow lines of 'Industrial Plating'.
-   **Color Contrast**: The Equatorial Trench should use darker industrial materials.
