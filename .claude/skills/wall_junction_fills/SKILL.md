---
name: Wall Junction & Corner Fills
description: How to fill corner notches on rectangles, junction gaps where flat walls meet towers, and thin single-face walls
type: feedback
---

## PROBLEM 1: Rectangle Corner Notches (drawRect)

`drawRect` draws 4 walls but leaves empty triangular notches at each corner. Fix: add 4 diagonal panels immediately after each drawRect call.

```ts
drawRect(pts, cx, cy, cz, hw, hd, MAT);
pts.push({ x: cx-hw, y: cy, z: cz-hd, yaw: 225, name: MAT });
pts.push({ x: cx+hw, y: cy, z: cz-hd, yaw: 135, name: MAT });
pts.push({ x: cx+hw, y: cy, z: cz+hd, yaw:  45, name: MAT });
pts.push({ x: cx-hw, y: cy, z: cz+hd, yaw: 315, name: MAT });
```

For a helper wrapping castleWalls or any loop that draws drawRect per row:
```ts
function castleWalls(cx: number, cz: number, hw: number, hd: number, wallH: number) {
  for (let y = 0; y <= wallH; y += step) {
    drawRect(pts, cx, y, cz, hw, hd, CASTLE);
    pts.push({ x: cx-hw, y, z: cz-hd, yaw: 225, name: CASTLE });
    pts.push({ x: cx+hw, y, z: cz-hd, yaw: 135, name: CASTLE });
    pts.push({ x: cx+hw, y, z: cz+hd, yaw:  45, name: CASTLE });
    pts.push({ x: cx-hw, y, z: cz+hd, yaw: 315, name: CASTLE });
  }
}
```

**Why:** `drawRect` ends each wall panel at the corner point, but panels have width — the last panel's edge doesn't fully reach the perpendicular wall's face. The 45°/135°/225°/315° diagonal panel sits exactly at the corner and fills the triangular notch visible from outside.

**How to apply:** Any time you call `drawRect` in a loop (per floor level), add the 4 diagonal fills in the same loop body.

---

## PROBLEM 2: Flat Wall Meeting Round Tower (Gatehouse/Castle Junctions)

When a flat passage wall ends where a circular tower begins, the wall endpoint floats visually away from the tower surface. The tower is round, the wall is straight — they don't touch at the tangent point.

Fix: at each junction add filler panels per floor row facing into the gap:

```ts
// Per floor row, at each of the 4 wall-end/tower junctions:
for (let y = 0; y < wallH; y += step) {
  // Left tower at x=-w/2, passage wall end at x=-w/2+tR, depth z=±passDepth
  pts.push({ x: -w/2 + tR, y, z: -passDepth, yaw:  90, name: STONE2 }); // faces east
  pts.push({ x: -w/2 + tR, y, z:  passDepth, yaw:  90, name: STONE2 });
  // Right tower at x=+w/2
  pts.push({ x:  w/2 - tR, y, z: -passDepth, yaw: -90, name: STONE2 }); // faces west
  pts.push({ x:  w/2 - tR, y, z:  passDepth, yaw: -90, name: STONE2 });
}
```

Also add a curtain wall connecting the two towers above the arch opening:
```ts
for (let y = passH; y < towerH; y += step) {
  drawWall(pts, -w/2, y, -passDepth, w/2, y, -passDepth, STONE2);
  drawWall(pts, -w/2, y,  passDepth, w/2, y,  passDepth, STONE2);
}
```

**Why:** The `drawRing` for the tower and the `drawWall` for the passage both end at the tangent intersection but leave a visible seam. The filler panels cover the seam from both approach angles.

---

## PROBLEM 3: Thin Single-Face Wall

Many walls are a single line of panels (`drawWall` from A to B at constant z). From the side, these look paper-thin.

Fix: add a parallel rear face 4*S back, and close the two open ends:
```ts
// Front face:
drawWall(pts, x1, y, z,     x2, y, z,     MAT);
// Rear face:
drawWall(pts, x1, y, z+4*S, x2, y, z+4*S, MAT);
// West end cap:
drawWall(pts, x1, y, z,     x1, y, z+4*S, MAT);
// East end cap:
drawWall(pts, x2, y, z,     x2, y, z+4*S, MAT);
```

**Why:** A 2D wall with no depth looks like a floating panel from any non-frontal view. 4*S gives enough depth to read as a solid wall without doubling the panel count.

**How to apply:** Any wall generator that currently uses a single `drawWall` line per floor row — add the rear face and end caps in the same floor loop.
