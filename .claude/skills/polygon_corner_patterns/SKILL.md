# 🔷 POLYGON CORNER PATTERNS — Filling Convex Vertex Notches

**When to use:** Any polygon (pentagon, hexagon, triangle, star fort) where two straight walls meet at a convex angle and leave a visible notch/gap at the vertex.

---

## THE PROBLEM

Two drawWall segments meeting at a convex vertex leave a notch because panels end at/near the vertex but don't fill the angular gap between the two wall faces.

Visible as: triangular empty notch at each corner of a pentagon, hexagon, etc.

---

## THE FIX — Outward-Facing Filler Panel

At each vertex, push one panel per floor level facing radially outward from the polygon centre:

```ts
// After drawing all polygon sides, add corner fillers
for (let ri = 0; ri < rings; ri++) {
  const rr = polygonRadius * (1 - ri * shrinkFactor);

  for (let i = 0; i < nSides; i++) {
    const aV  = (i / nSides) * Math.PI * 2 + rotationOffset;
    const yaw = 90 - aV * 180 / Math.PI;   // outward-facing (same as drawRing outward formula)

    for (let y = 0; y < h; y += step)
      pts.push({ x: rr * Math.cos(aV), y, z: rr * Math.sin(aV), yaw, name: MAT });
  }
}
```

**Key formula:** `yaw = 90 - aV * 180 / Math.PI`
- aV=0 → yaw=90 (faces +X East) ✓
- aV=π/2 → yaw=0 (faces +Z North) ✓
- aV=π → yaw=-90 (faces -X West) ✓

---

## PENTAGON EXAMPLE (used for The Pentagon)

```ts
for (let ri = 0; ri < rings; ri++) {
  const rr = r * (1 - ri * 0.16);

  // Draw 5 pentagon sides
  for (let i = 0; i < 5; i++) {
    const a1 = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const a2 = ((i + 1) / 5) * Math.PI * 2 - Math.PI / 2;
    for (let y = 0; y < h; y += stp)
      drawWall(pts, rr*Math.cos(a1), y, rr*Math.sin(a1), rr*Math.cos(a2), y, rr*Math.sin(a2), MILCNC);
  }

  // Fill the 5 vertex notches
  for (let i = 0; i < 5; i++) {
    const aV  = (i / 5) * Math.PI * 2 - Math.PI / 2;  // note: same offset as sides
    const yaw = 90 - aV * 180 / Math.PI;
    for (let y = 0; y < h; y += stp)
      pts.push({ x: rr * Math.cos(aV), y, z: rr * Math.sin(aV), yaw, name: MILCNC });
  }
}
```

---

## TRIANGLE (Azkaban)

Triangle vertices at angles `i/3 * 2π` for i=0,1,2:
```ts
for (let i = 0; i < 3; i++) {
  const aV  = (i / 3) * Math.PI * 2;
  const yaw = 90 - aV * 180 / Math.PI;
  for (let y = 0; y < h; y += step)
    pts.push({ x: r * Math.cos(aV), y, z: r * Math.sin(aV), yaw, name: IND10 });
}
```

---

## COST

- Pentagon: 5 fillers × rings × floorRows ≈ +100 panels total — always worth it
- Triangle: 3 × rows ≈ +20 panels — trivial
