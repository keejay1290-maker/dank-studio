# 🌐 DANK STUDIO — SPHERE & ROTATION MATH

**Audience:** Any AI editing `draw.ts` or any `gen_*` function that uses spherical geometry (death_star, sphere, dome, planet, etc.)

**Why this skill exists:** We hit three bugs in this area that wasted a full context window. All three are documented here so you don't repeat them.

---

## 🔢 THE PANEL-COUNT FORMULA (memorize this)

For a sphere of radius `r` tiled with rectangular panels of face-width `W` and height `H`:

```
total_panels ≈ 20.9 · r² / (W · H)
```

Derived from:
- Ring count: `nRings = π·r / (H · 0.75)`  (arc-length ÷ 75%-overlap step)
- Average panels per ring: `(2/π) · 2π·r/W = 4r/W` (sin-average over φ from 0 to π)
- Product: `nRings · avg ≈ 4π·r² / (W·H·0.75) ≈ 16.76 r²/(WH)` — plus the 25% overlap and caps, round up to **~20.9**.

### Budget table (hard limit 1200)

| Panel class                          | W    | H   | max r for 1200 budget |
| ------------------------------------ | ---- | --- | --------------------- |
| `staticobj_wall_indcnc_10`   (IND10) | 8.75 | 10  | **r ≤ 71**            |
| `staticobj_wall_indcnc4_8`           | 8.00 | 8   | r ≤ 60                |
| `staticobj_wall_indcnch_10`          | 8.75 | 5   | r ≤ 50                |
| `staticobj_wall_stone`               | 8.00 | 3.5 | r ≤ 40                |
| `staticobj_wall_cncsmall_8`  (CNC8)  | 8.00 | 3   | r ≤ 37                |

**Never call `drawSphere` with a radius that blows the budget** — use `drawSphereBudgeted(pts, cx,cy,cz, r, 1150)` and let it pick the panel class.

---

## 📏 TWO BUGS THAT CAUSE GAPS

### Bug 1 — Ring step uses `panelW` instead of `panelH`

**Wrong:**
```ts
const ringStep = panelW * 0.8;   // ❌ wrong — face width has nothing to do with ring spacing
```

**Right:**
```ts
const panelH   = getObjectDef(wallClass)?.height ?? panelW;
const ringStep = panelH * 0.75;  // ✅ 25% vertical overlap → flush coverage
```

**Why:** A tangent rectangular panel's VERTICAL extent on the sphere surface is `panelH` (height), not `panelW` (width, which is the horizontal/tangential dimension). Using panelW for vertical spacing creates massive meridian gaps — for CNC8 (W=8, H=3), the rings end up 7.6m apart vertically but the panels are only 3m tall → 4.6m bare stripes between every ring.

### Bug 2 — Horizontal panels use `round()` instead of `floor()`

**Wrong:**
```ts
const nPanels = Math.round(circ / panelW);   // ❌ scale can go below 1 → gaps
```

**Right:**
```ts
const nPanels = Math.max(4, Math.floor(circ / panelW));   // ✅ scale always ≥ 1
```

**Why:** `scale = circ / (nPanels · panelW)`. With `round()` the rounded-up case gives `nPanels > circ/panelW` → `scale < 1` → panels get SHRUNK → bare arcs visible between them. With `floor()`, `nPanels ≤ circ/panelW` → `scale ≥ 1` → panels overlap tangentially → no seams.

### Bug 3 — `applyLimit` sub-samples uniformly

**Symptom:** Death star with `R=72, CNC8` panels generates ~7000 panels, `applyLimit(1200)` removes every 6th → VISIBLE STRIPED HOLES everywhere.

**Fix:** Size the sphere to fit in budget BEFORE generating. Use the formula above. For death_star we switched from CNC8 to IND10 panels → 5× coverage → ~1160 panels → no culling needed.

**`applyLimit` is a safety net, not a sizing tool.** If a sphere relies on it, you have a bug.

---

## 🧭 ROTATION CONVENTIONS

### DayZ (in-game)
- **Left-handed.** X = East, Y = Up, Z = North.
- **Yaw** 0° = facing North (+Z), rotates **clockwise** viewed from above.
  - 90° = East, 180° = South, 270° = West.
- **Pitch** 0° = upright (panel vertical).
  - -90° = lying flat face-up, +90° = lying flat face-down.

### Three.js (our preview)
- **Right-handed.** X = right, Y = up, Z = toward viewer.
- `rotation.y` is **CCW from above** (mathematical convention).

### Bridging the two — the Euler

```ts
// In components/Preview3D.tsx, BuildObject component:
const yawRad   = (pt.yaw   ?? 0) * Math.PI / 180;
const pitchRad = (pt.pitch ?? 0) * Math.PI / 180;
const rollRad  = (pt.roll  ?? 0) * Math.PI / 180;
return new THREE.Euler(pitchRad, yawRad, rollRad, "YXZ");
//                                ^^^^^^ MUST be POSITIVE, never -yawRad
```

**Proof `+yawRad` is correct:** The Y-rotation matrix maps the default +Z face direction to `(sin θ, 0, cos θ)`. At θ=+π/2 → `(1,0,0)` = +X = East. DayZ yaw=90° also = East. ✅ matches.

The previous code had `-yawRad` which mirrored every panel to face the opposite direction. Symmetric builds (Eiffel, Taj) hid it; spheres exposed it spectacularly.

### Computing yaw for a tangent panel on a sphere

For a panel at position (`x, y, z`) relative to the sphere centre, facing radially outward:

```ts
const yaw   = Math.atan2(x - cx, z - cz) * 180 / Math.PI;
//                       ^east^^  ^north^  — NOT the usual atan2(z, x)!
const pitch = (phi - Math.PI / 2) * 180 / Math.PI;
//            φ=0 (N pole) → pitch=-90  (face up)
//            φ=π/2 (equator) → pitch=0 (face outward horizontally)
//            φ=π (S pole) → pitch=+90  (face down)
```

The `atan2(x, z)` order (not the conventional `atan2(z, x)`) gives DayZ-compatible clockwise yaw from North.

---

## 🎯 OVERLAP TUNING

Current defaults:
- `drawSphere` / `drawDome`: `ringStep = panelH * 0.75` (25% vertical overlap)
- Death star (custom): same 25% ring overlap

If you still see vertical gaps after correct `panelH`, try tightening to `0.70` or `0.65`. Each 5% costs roughly +7% panel count.

If you see horizontal gaps, the floor() rule was broken somewhere — search for `Math.round(circ` or `Math.ceil(circ`.

---

## 🧪 HOW TO TEST A SPHERE FIX

1. `npm run dev` from `artifacts/dank-studio`
2. Pick the affected build in the Library tab
3. Orbit around the full sphere. Look for:
   - **Striped gaps along meridians** → horizontal `round`/`ceil` bug or scale < 1
   - **Bare rings at specific latitudes** → `panelW` used for `ringStep` instead of `panelH`
   - **Small holes at the poles** → polar cap panels missing (`pts.push` at y±r with pitch ±90)
   - **Evenly-spaced holes everywhere** → `applyLimit` is firing → shrink or switch panel class
4. Check the panel count counter top-right of the preview. If > 1200, you're being culled.
