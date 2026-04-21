# 🔺 SPIRE & CRYSTAL TAPER PATTERNS

**When to use:** Any generator that has a tapering tower, spire, or crystal.

---

## THE SAFE TAPER FORMULA

```ts
const step = 1.572 * S;  // or whichever panel's flush step
for (let y = yBase; y < yBase + h; y += step) {
  const t = (y - yBase) / h;         // 0 at base, 1 at top
  const r = rBase * (1 - t * 0.9);   // taper to 10% at peak (change 0.9 for different sharpness)
  if (r > 0.3 * S) drawRing(pts, cx, y, cz, r, MAT);
}
```

**Critical:** Always guard `if (r > 0.3 * S)` — without it, negative-radius rings still push points and create junk geometry near the tip.

---

## TAPER SHARPNESS TABLE

| `t * X` | Effect |
|---|---|
| `t * 0.75` | Blunt tip — column tapers to 25% of base |
| `t * 0.85` | Standard tower — tapers to 15% at top |
| `t * 0.90` | Sharp spire — tapers to 10% (crystal, obelisk) |
| `t * 0.98` | Near-needle — almost to a point |

---

## COMMON MISTAKE — Formula that goes negative

```ts
// ❌ WRONG — at 80% height the denominator is 32*S, radius goes negative before top
const r = 4*S*(1-(y-60*S)/40*S*0.8);

// ✅ RIGHT — explicit numerator/denominator, always safe
const t = (y - yBase) / h;
const r = rBase * (1 - t * 0.9);
if (r > 0.3 * S) drawRing(pts, cx, y, cz, r, MAT);
```

The `40*S*0.8` trap: operator precedence gives `40*S*0.8 = 32*S`, so radius hits 0 at 80% of the way up, then goes negative.

---

## CLUSTER OF SPIRES PATTERN

For organic structures (crystal caves, ice palaces, fantasy towers):

```ts
function crystal(cx: number, cz: number, rBase: number, h: number) {
  for (let y = 0; y < h; y += step) {
    const r = rBase * (1 - (y / h) * 0.9);
    if (r > 0.3 * S) drawRing(pts, cx, y, cz, r, STONE2);
  }
}

// Outer ring
for (let i = 0; i < 6; i++) {
  const a = (i / 6) * Math.PI * 2;
  crystal(Math.cos(a) * outerR, Math.sin(a) * outerR, rBase, heights[i]);
}
// Central spire
crystal(0, 0, rBase * 1.8, h * 1.3);
```
