# 📏 R/SPREAD PARAM GENERATORS — When There's No Scale Multiplier

**When to use:** Generators that use `r` (radius) or `spread` instead of a `scale` param. The param itself controls physical size, so steps are NOT multiplied by S.

---

## TWO PARAM PATTERNS

### Pattern A — `scale` param (most generators)
```ts
const S    = Math.max(0.25, p.scale ?? 0.5);
const step = 1.572 * S;   // ← multiply by S
const h    = 20 * S;       // ← multiply by S
```

### Pattern B — `r` or `spread` param (Pentagon, Star Fort, Arena Fort, Normandy)
```ts
const r    = p.r ?? 100;  // r IS the scale
const step = 4.744;        // ← NO S multiplier — fixed physical step
const h    = 20;           // ← NO S multiplier — fixed physical height
```

**Rule:** If the generator has no `S` variable, use bare panel heights for steps. The `r` or `spread` param controls the plan size, and heights are proportional to a "game standard" scale.

---

## STEP SIZES FOR R-PARAM GENERATORS

Same panel heights as always, just no `*S`:

| Panel | Fixed step |
|---|---|
| CASTLE | 2.0 |
| STONE2 | 1.572 |
| CNC8 / CNC4 | 2.3 |
| MILCNC | 4.744 |
| IND10 | 9.758 |

---

## BUILDS.TS — `r` or `spread` entries

When writing the builds.ts entry, `defaultParams` and `params` use the raw param name:

```ts
{
  key: "the_pentagon", label: "The Pentagon", category: "Structures",
  defaultParams: { r: 100 },                               // ← NOT scale
  params: [
    { key: "r", label: "Radius (m)", min: 40, max: 200, step: 10, default: 100 },
  ],
}
```

**Common mistake:** writing `defaultParams: { scale: 1 }` when the generator reads `p.r` — param key must match exactly or sliders are silently ignored.

---

## WHEN TO USE EACH PATTERN

| Use `scale` when... | Use `r`/`spread` when... |
|---|---|
| The whole build scales uniformly | Only the footprint/length changes, height stays fixed |
| Building proportions need to stay consistent | A wall needs to be "as long as you want" |
| It's a 3D structure (tower, castle) | It's a plan-shape structure (arena, pentagon, fort) |
