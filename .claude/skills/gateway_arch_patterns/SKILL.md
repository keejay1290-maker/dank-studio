# 🚪 GATEWAY ARCH PATTERNS — Flat Arches Over Openings

**When to use:** Any gate passage, doorway arch, window arch, or vaulted opening.

---

## FLAT ARCH (individual panel pushes)

A pointed or round arch spanning a gate. Panels pushed individually — NOT drawWall, because each panel needs a different Y and must face front/rear.

```ts
const archW   = halfSpanWidth;   // horizontal half-span
const archBot = passageHeight * 0.35;  // where arch springs from
const nArch   = 10;              // panel count (each side of arch)

for (let s = 0; s <= nArch; s++) {
  const a  = (s / nArch) * Math.PI;         // 0 → π (east rim → west rim)
  const ax = Math.cos(a) * archW;
  // Round arch: sin curve. Pointed arch: multiply sin by 1.2–1.4
  const ay = archBot + Math.sin(a) * archW * 0.65;

  pts.push({ x: ax, y: ay, z: -depth, yaw:   0, name: STONE2 }); // front face
  pts.push({ x: ax, y: ay, z: +depth, yaw: 180, name: STONE2 }); // rear face
}
```

**Pointed arch** (gothic): multiply `sin(a)` factor by 1.2–1.5. The higher the multiplier, the more pointed.  
**Round arch** (romanesque): `sin(a) * archW * 0.5` gives a true semicircle.

---

## ARCH OVER A GATE — COMPLETE PATTERN

```ts
const passH   = h * 0.65;    // passage height (below arch spring)
const archW   = w/2 - tR;    // half span between tower inner edges

// Gate passage walls (left and right sides of the tunnel)
for (let y = 0; y < passH; y += step) {
  drawWall(pts, -archW, y, -depth, -archW, y, depth, STONE2);
  drawWall(pts,  archW, y, -depth,  archW, y, depth, STONE2);
}

// Arch panels — pointed style
for (let s = 0; s <= 10; s++) {
  const a  = (s / 10) * Math.PI;
  const ax = Math.cos(a) * archW;
  const ay = passH * 0.3 + Math.sin(a) * archW * 0.65;
  pts.push({ x: ax, y: ay, z: -depth, yaw:   0, name: STONE2 });
  pts.push({ x: ax, y: ay, z: +depth, yaw: 180, name: STONE2 });
}

// Parapet walkway across top of gate passage
for (let y = passH; y <= passH + cstep * 2; y += cstep)
  drawWall(pts, -archW, y, 0, archW, y, 0, CASTLE);
```

---

## COMMON MISTAKES

| Bug | Cause | Fix |
|---|---|---|
| Arch only visible from one side | Only one panel per position | Add both `z: -depth, yaw:0` and `z: +depth, yaw:180` |
| Arch looks like a flat line | All panels at same Y | Vary Y with `sin(a) * height` |
| Arch panels wrong material | Using wrong yaw constant | Use string const: `STONE2`, `CASTLE`, not raw classnames |
