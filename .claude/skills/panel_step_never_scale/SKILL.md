---
name: Panel Step Size — NEVER Scale by S
description: Panel height constants (step sizes) must always be the PHYSICAL panel dimension — never multiplied by scale. This is the #1 cause of visual gapping/overlap bugs across generators.
---

# Panel Step Size — NEVER Scale by S

## The Bug

A common anti-pattern seen in ~15 generators in shapes.ts:

```ts
const step = 1.572 * S;   // ❌ WRONG — scales STONE2 step with S
const istp = 9.758 * S;   // ❌ WRONG — scales IND10 step with S
```

When `S < 1` (e.g. default scale of 0.5), this makes the step SMALLER than one panel is tall, so adjacent ring rows **overlap** each other. When `S > 1`, the step becomes LARGER than the panel, leaving visible **gaps** between rows.

Either way, the visual result is wrong: the structure looks either chunky+dense, or skeletal with holes.

## The Fix

Always use the physical panel height as a constant:

```ts
const step = 1.572;   // ✓ STONE2 physical height
const istp = 9.758;   // ✓ IND10 physical height
const mstp = 4.744;   // ✓ MILCNC physical height
const c4   = 2.324;   // ✓ CNC4 physical height
const c8   = 2.300;   // ✓ CNC8 physical height
const cstp = 2.0;     // ✓ CASTLE physical height
const s2   = 1.572;   // ✓ STONE2 physical height
```

Scale *world dimensions* (radii, half-widths, tower heights) by S, but never the per-panel step used in `for (let y = 0; y < h; y += step)` loops.

## Why This Happens

Developers see `h = 25 * S` (a scaled building height) and incorrectly assume "everything should scale together." It shouldn't — DayZ panels have fixed physical dimensions, so the step in a flush-coverage loop must be the **physical** height.

## Verification Pattern

When scanning a generator for this bug, grep for the panel-height numeric literals followed by `* S`:

```bash
grep -nE '(1\.572|2\.034|2\.3|2\.324|4\.744|9\.758|9\.408|9\.012) \* S' src/lib/generators/shapes.ts
```

Any match is almost certainly wrong. Exception: `9.408 * S` is correct for `PW` (panel *width* used for horizontal spacing), but panel *height* (`PH`) must never scale.

## Exact Multiple Rule

When the *building height* is scaled but the *step* is fixed, the building height must still be an exact multiple of step to avoid a gap at the top row:

```ts
// ❌ WRONG — naveH is 12.5, istp=9.758 → one full row + 2.74m gap
const naveH = 25 * S;
for (let y = 0; y < naveH; y += istp) { ... }

// ✓ RIGHT — naveH snapped up to next multiple of istp
const naveH = Math.ceil(25 * S / istp) * istp;
for (let y = 0; y < naveH; y += istp) { ... }
```

## Generators fixed with this rule (2026-04-24)

- gen_hagia_sophia, gen_eye_of_sauron, gen_fortress_solitude
- gen_black_gate, gen_gondor_beacon, gen_stormwind
- gen_isengard, gen_helms_deep, gen_rivendell, gen_minas_tirith
- gen_colosseum (PH was scaled, facade also)

## Cross-reference

- See [flush_panel_coverage/SKILL.md](../flush_panel_coverage/SKILL.md) for the broader zero-gap coverage rules
- See [generator_rework_checklist/SKILL.md](../generator_rework_checklist/SKILL.md) step 6 (step size)
