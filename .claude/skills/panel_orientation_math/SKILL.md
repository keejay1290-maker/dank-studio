# 🧭 PANEL ORIENTATION MATH — Yaw/Pitch for Curved & Angled Surfaces

**When to use:** Placing panels on arches, barrel vaults, shell roofs, ring fins, tapered columns, or any surface where panels must face radially/tangentially outward.

---

## CORE CONVENTIONS (from HANDOVER)

```
yaw=0   → face +Z (North)    yaw=90  → face +X (East)
yaw=180 → face -Z (South)    yaw=-90 → face -X (West)

pitch=0   → panel stands vertical
pitch=-90 → panel lies flat, face pointing UP (floor tile)
pitch=+90 → panel lies flat, face pointing DOWN (ceiling tile)
```

Renderer: `rot = new THREE.Euler(pitch*DEG, yaw*DEG, roll*DEG, "YXZ")`

---

## OUTWARD-FACING PANEL ON A HORIZONTAL RING

For a panel at angle `a` (radians) on a ring in the XZ plane, facing **outward**:

```ts
// Position: (cx + cos(a)*r,  cy,  cz + sin(a)*r)
// Face direction: radially outward = (cos(a), 0, sin(a))

const yaw = Math.atan2(Math.cos(a), Math.sin(a)) * 180 / Math.PI;
// Equivalently: yaw = 90 - a * 180/Math.PI
```

Spot-checks: a=0 → yaw=90 (faces +X) ✓  |  a=π/2 → yaw=0 (faces +Z) ✓  |  a=π → yaw=-90 (faces -X) ✓

> `drawRing` places panels **tangentially** (yaw = -a°+90). Outward = tangential + 90°.

---

## OUTER FACE OF A RADIAL FIN (drawWall approach)

For a fin whose tip points at angle `a`, the outer face must face outward.  
Use these **Start/End** endpoints so `drawWall`'s auto-yaw comes out correct:

```ts
const cA = Math.cos(a), sA = Math.sin(a);
// Start: tip shifted +tangent direction
// End:   tip shifted -tangent direction
drawWall(pts,
  cA*r + sA*hw, y, sA*r - cA*hw,   // Start
  cA*r - sA*hw, y, sA*r + cA*hw,   // End
  material);
// Resulting yaw = 90 - a° → faces outward ✓
```

Where `hw` = half-width of the fin face.

Verified: a=0 → yaw=90 (East) ✓ | a=π/2 → yaw=0 (North) ✓ | a=2π/3 → yaw=-30 ✓

---

## ARCH / BARREL VAULT RIB PANEL (XY plane arc)

For an arch rib at angle `a` (0=right base, π/2=apex, π=left base) in the XY plane:

```ts
// Position: (xMid + cos(a)*span,  podY + sin(a)*apex,  z)
// Outward normal in XY: (cos(a), sin(a), 0)

const yaw   = Math.atan2(Math.cos(a), 1e-9) * 180 / Math.PI;  // ±90° by sign of cos(a)
const pitch = -Math.atan2(Math.sin(a), Math.abs(Math.cos(a)) + 1e-9) * 180 / Math.PI;
```

| Position on arch | a | yaw | pitch | Result |
|---|---|---|---|---|
| Right base | 0 | +90 | 0 | Vertical, faces East |
| 45° up-right | π/4 | +90 | -45 | Tilted 45° up |
| Apex (top) | π/2 | ±90 | -90 | Flat, face up |
| 45° up-left | 3π/4 | -90 | -45 | Tilted 45° up |
| Left base | π | -90 | 0 | Vertical, faces West |

**Without this:** all panels get `yaw:0` → shell only visible from one direction. Confirmed bug in Sydney Opera House — all CNC8 ribs had `yaw:0`.

---

## STACKED COLUMN MOVING INWARD (tapered legs)

For a column that tapers inward as height increases (Space Needle legs, etc.):

```ts
// Each level: one panel facing outward at the current radial position
const faceYaw = 90 - a * 180 / Math.PI;   // outward-facing yaw at angle a
for (let y = 0; y < legHeight; y += panelH * S) {
  const t = y / legHeight;
  const r = (rBase - t * (rBase - rTop)) * S;
  pts.push({ x: Math.cos(a)*r, y, z: Math.sin(a)*r, yaw: faceYaw, name: material });
}
```

This creates a blocky staircase-style column that VISUALLY tapers. Far better than a single diagonal `drawWall` which produces angled panels with gaps.

**Panel choice:** CNC4 (2.324m tall) for thin legs, MILCNC (4.744m tall) for thick fins/buttresses.

---

## DIAGONAL drawWall — WHEN IT GOES WRONG

`drawWall(pts, x0,y0,z0, x1,y1,z1, mat)` with all three dimensions changing creates panels at a diagonal pitch+yaw. At large angles this produces:
- Visible gaps between panels (effective height < natural height due to tilt)
- Panels visually "floating" away from the structure edge
- Confusing yaw angles that don't match the expected face direction

**Fix:** Replace with per-height stacked panels (see above) or, for wide surfaces, per-height horizontal drawWall segments.
