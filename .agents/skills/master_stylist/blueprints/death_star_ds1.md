# DS-1 Death Star — Build Blueprint

## 1. Silhouette (Macro Identity)
- **Primary mass:** mathematically perfect sphere. No tapering, flattening, or asymmetry.
- **Concave superlaser dish:** ONE large indented dish carved into the upper hemisphere. This is a true concave depression, not a flat disc on the surface.
- **Equatorial trench:** continuous thin horizontal notch encircling the sphere, dividing it into two hemispheres.
- **Secondary trenches:** shallow arcs running parallel to the equator or curving around the sphere.
- **Surface clusters:** small raised greeble groupings that do not break the macro silhouette.

Hierarchy (dominant → micro): sphere → dish → equatorial trench → secondary trenches → surface clusters.

## 2. Dish Geometry (the signature feature)
- **Shape:** large parabolic depression in the upper hemisphere, smooth and uninterrupted (no panels inside the dish).
- **Inner recess:** smaller circular recess concentric with the dish, with stepped/tiered geometry narrowing toward the center (focusing-aperture look).
- **Radial features:** ring of evenly spaced spoke-like structures around the inner recess, embedded into the dish surface, following the curvature.
- **Boundary:** sharp clean edge where dish meets sphere; surrounding panel grid compresses and curves around it.
- **Diameter:** ~0.22 of total sphere diameter.

## 3. Trenches
- **Equatorial:** continuous horizontal gap, vertical inner walls, flat base, rectangular cross-section. Interior densely greebled with orthogonal stacked forms (strictly right angles, no curves).
- **Secondary:** shallower and narrower than equatorial. Long arcs, sometimes parallel to the equator, sometimes curving. Some terminate abruptly, some merge into clusters. Form a subtle sector grid.
- **Interaction:** trenches shift the panel grid where they cross. Trenches near the dish bend or terminate at its boundary.

## 4. Panel Pattern (Skin Logic)
- **Geometry:** rectangular/square plates following sphere curvature. Slight height offsets between adjacent panels create shadow relief.
- **Flow:** panels wrap in latitudinal arcs. Around major features (dish, trench, clusters), the grid bends/compresses/stretches.
- **Density bands:** the sphere divides into horizontal bands of varying density.
  - **High density** near: secondary trenches, surface clusters, dish boundary.
  - **Low density** near: poles, smooth bands between trenches.
- **Micro-trenches** form thin gridlines between plates.

## 5. Surface Clusters
- Layered rectangular forms rising slightly above the panel field.
- Often align with trench intersections or panel grid transitions.
- Do not break the sphere silhouette.

## Build Rules (Math / Geometry)
- **Panel ring overlap:** 20% (not 10% — increased for gap-free coverage; see commit 955064d).
- **Panel count per ring:** `floor((2 * PI * R * cos(lat)) / (panelWidth * (1 - overlap)))` — calculated per latitude, not constant.
- **Polar caps:** required to close pole gaps (see `drawDome` in [src/lib/draw.ts](src/lib/draw.ts)).
- **Panel orientation (YPR):**
  - `Yaw   = -theta * (180/PI) + 90`
  - `Pitch = (phi - PI/2) * (180/PI)`
  - Aligns panel normal to sphere center.
- **Dish depth:** must use spherical projection (panels follow a smaller-radius inner sphere), not flat layering on the outer surface.

## Known Issues (current build)
- Spacing still gappy in places — panels don't fully line up between rings.
- Dish is currently flat / not properly indented.
- Rotations look much better since the YPR fix.

## Fidelity Checklist
- [ ] Perfect sphere silhouette, no gaps
- [ ] Concave dish with inner stepped recess + radial spokes
- [ ] Continuous equatorial trench with orthogonal greebling inside
- [ ] Secondary trench arcs forming sector grid
- [ ] Panel density bands (high near features, low at poles)
- [ ] Surface clusters at trench intersections
- [ ] Sharp dish boundary with panel grid bending around it
