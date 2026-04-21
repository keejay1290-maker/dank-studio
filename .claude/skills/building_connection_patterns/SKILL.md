# 🔗 BUILDING CONNECTION PATTERNS — Filling Gaps Between Elements

**When to use:** Any time two separate building elements (wall end + tower, bridge + tower, road + gate) don't visually connect. "Empty corners" are usually connection gaps.

---

## DIAGNOSING A GAP

Two elements float apart when their closest edges don't touch. Calculate the gap:

```
Gap = |elementA_edge - elementB_edge|

elementA_edge = endPoint of wall/element
elementB_edge = nearestPoint on circle/ring = centerX ± radius
```

**Example — Helms Deep west end:**
```
Wall west end:        x = -wallL/2       = -30*S
Hornburg east edge:   x = hx + hornR     = (-44*S) + 9*S = -35*S
Gap:                  |-30*S - (-35*S)|  = 5*S  → needs connector
```

---

## CONNECTOR WALL

Once gap is identified, add a drawWall per floor row that bridges it:

```ts
// Declare shared constants BEFORE both elements (avoids "used before declaration" error)
const hx    = -wallL/2 - 14*S;   // element B centre
const hornR = 9 * S;              // element B radius

// Connector — same material and step as the main wall
for (let y = 0; y < wallH; y += step)
  drawWall(pts, hx + hornR, y, 0, -wallL/2, y, 0, STONE2);
drawWall(pts, hx + hornR, wallH, 0, -wallL/2, wallH, 0, CASTLE); // battlement

// Then declare element B (no redeclaration needed since hx/hornR already exist)
// ── Hornburg ──
const hornH = 20 * S;
for (let y = 0; y < hornH; y += step)
  drawRing(pts, hx, y, 0, hornR, STONE2);
```

**CRITICAL:** Declare shared constants (`hx`, `hornR`) BEFORE any block that uses them — TypeScript `const` is block-scoped, redeclaring throws error 2448.

---

## RETURN WALL (closing an open end)

When a wall ends abruptly, add a short perpendicular return:

```ts
// Wall runs along Z=0. At east end (x = wallL/2), add return going into Z:
for (let y = 0; y < wallH; y += step)
  drawWall(pts, wallL/2, y, 0, wallL/2, y, returnDepth, STONE2);
```

---

## CHECKLIST FOR EMPTY CORNERS

1. Is there a circular tower at the corner? → calculate `towerCentreX ± towerRadius` and add a straight connector wall to the wall end.
2. Is it a wall end with nothing? → add a return wall (perpendicular stub, 2–4*S deep).
3. Is it a convex polygon vertex? → add an outward-facing filler panel (see `polygon_corner_patterns`).
4. Is it two walls meeting at an angle? → use `drawWall` from one endpoint to the other; let drawWall auto-compute the diagonal.
