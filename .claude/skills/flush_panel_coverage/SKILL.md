# 📐 FLUSH PANEL COVERAGE — Gap-Free Wall & Ring Stacking

**When to use:** Any time you stack rings or rows of panels vertically. Wrong step size = visible horizontal gaps in the structure.

---

## THE RULE

For a ring or wall row to have **zero gaps**, the vertical step between rows must be ≤ the panel's **effective height**:

```
effectiveHeight = mimic.h * scale
scale = (circumference / nPanels) / mimic.w      ← computed by drawRing
```

Since `scale < 1` for large rings (drawRing uses ceil → slight overlap), the safest formula is:

```
step = mimic.h * (circumference / (ceil(circumference / (mimic.w * 0.98)) * mimic.w))
```

In practice: **use the table below** and stay at or under the listed step.

---

## CRITICAL RULE — ALWAYS MULTIPLY BY S

```ts
// ❌ WRONG — fixed units, no scale applied
for (let y = 0; y < h; y += 1.572) drawRing(pts, 0, y, 0, r, STONE2);

// ✅ RIGHT
const step = 1.572 * S;
for (let y = 0; y < h; y += step) drawRing(pts, 0, y, 0, r, STONE2);
```

Every loop increment that places panels must be `panelH * S`. Hardcoded steps cause:
- Gaps that appear/disappear as scale changes
- Disproportionate floor heights vs panel sizes at non-default scales

---

## STEP SIZE TABLE (S=1, radius in parentheses)

| Panel class | mimic.h | Safe step (any radius) | Notes |
|---|---|---|---|
| `staticobj_castle_wall3` (CASTLE) | 2.000m | **2.0 × S** | Exact — never exceed |
| `staticobj_wall_stone` (STONE)    | 2.034m | **2.0 × S** | Round down for safety |
| `staticobj_wall_stone2` (STONE2)  | 1.572m | **1.572 × S** | Exact panel height |
| `staticobj_wall_cncsmall_8` (CNC8) | 2.300m | **2.3 × S** | Exact |
| `staticobj_wall_cncsmall_4` (CNC4) | 2.324m | **2.3 × S** | Slight rounding down |
| `staticobj_wall_milcnc_4` (MILCNC) | 4.744m | **4.5 × S** at r≈4–5 | Scale ≈0.87, eff.h≈4.13m |
| `staticobj_wall_milcnc_4` (MILCNC) | 4.744m | **4.7 × S** at r≥10 | Scale closer to 1 |
| `staticobj_wall_indcnc_10` (IND10) | 9.758m | **8.0 × S** at r≈4–5 | Scale ≈0.87, eff.h≈8.49m |
| `staticobj_wall_indcnc_10` (IND10) | 9.758m | **9.5 × S** at r≥15 | Scale closer to 1 |

**MILCNC at shaft radius 4–5m (CN Tower / Space Needle):** use `4.5*S` not `8*S`.  
Rings at `8*S` with MILCNC produce a **3.87m visible gap** — confirmed bug.

---

## COMMON MISTAKES FIXED THIS SESSION

| Bug | Wrong | Fixed |
|---|---|---|
| CN Tower shaft | `y += 8*S` with MILCNC | `y += 4.5*S` |
| CN Tower between-pod shaft | `y += 7*S` with MILCNC | `y += 4.5*S` |
| Space Needle shaft | `y += 10*S` with IND10 | Switch to MILCNC + `y += 4.5*S` |
| Leaning Tower of Pisa | `y += 3*S` with STONE2 (h=1.572m) | `y += 1.572*S` |
| Hogwarts main block | `y += 8*S` with CASTLE (h=2.0m) | `y += 2*S` |

---

## drawRing effective height formula (reference)

```ts
const circ    = 2 * Math.PI * r;
const nPanels = Math.max(4, Math.ceil(circ / (mimic.w * 0.98)));
const scale   = (circ / nPanels) / mimic.w;
const effH    = mimic.h * scale;   // ← use this as your step size
```

For no gap: `ringStep ≤ effH`. For slight overlap (recommended): `ringStep = effH * 0.95`.
