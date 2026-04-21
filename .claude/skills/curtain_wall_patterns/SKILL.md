# 🧱 CURTAIN WALL PATTERNS — Thickness, Towers, Battlements

**When to use:** Any long defensive wall (The Wall, castle perimeter, fortress walls).

---

## DUAL-FACE CURTAIN WALL (standard)

A wall with visible front + rear face and correct IND10 flush step:

```ts
const stp = 9.758;   // IND10 flush row height (no S — length param controls scale)
const depth = 4;     // wall thickness in metres

for (let y = 0; y < h; y += stp) {
  drawWall(pts, -L/2, y, 0,     L/2, y, 0,     IND10);  // front face
  drawWall(pts, -L/2, y, depth, L/2, y, depth, IND10);  // rear face
}
// Battlements atop both faces
drawWall(pts, -L/2, h, 0,     L/2, h, 0,     CASTLE);
drawWall(pts, -L/2, h, depth, L/2, h, depth, CASTLE);
```

---

## INTERVAL TOWERS along a wall

```ts
const spacing = Math.max(40, L / 5);
for (let x = -L/2 + spacing * 0.5; x < L/2; x += spacing) {
  for (let y = 0; y < h + 14; y += 2)   // project above parapet
    drawRect(pts, x, y, depth/2, 6, 6, CASTLE);
}
```

---

## STONE WALL (scaled, STONE2)

When wall uses scale param instead of length:

```ts
const step = 1.572 * S;  // STONE2 flush
for (let y = 0; y < wallH; y += step)
  drawWall(pts, -wallL/2, y, 0, wallL/2, y, 0, STONE2);
drawWall(pts, -wallL/2, wallH, 0, wallL/2, wallH, 0, CASTLE);  // battlement crown
```

---

## MATERIAL CHOICE FOR WALL TYPES

| Wall type | Front face | Battlements | Towers |
|---|---|---|---|
| Ice / modern (GoT Wall) | IND10 | CASTLE | CASTLE |
| Medieval stone | STONE2 | CASTLE | CASTLE |
| Dark fortress | CNC8 or STONE | CNC8 | CNC8 |
| Military/prison | IND10 or CNC8 | CNC8 | MILCNC |
