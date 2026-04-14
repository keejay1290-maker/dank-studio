# 🏗️ DANK STUDIO — ADDING A NEW BUILD GENERATOR

**Audience:** Any AI adding a new structure (tower, castle, ship, sci-fi rig, etc.) to the library.

**Goal:** A new entry in the Library tab that produces an accurate, flush, under-1200-object DayZ build.

---

## 📋 CHECKLIST (do all 5, in order)

### 1. Write the generator function

Location: `src/lib/generators/shapes.ts`

```ts
export function gen_my_build(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const R = p.radius ?? 30;

  // Use the helpers — do NOT hand-roll rotation math:
  drawRect(pts, 0,  0, 0, R, R, IND10);   // ground floor
  drawRect(pts, 0,  8, 0, R, R, IND10);   // second floor
  drawDome(pts, 0, 16, 0, R, STONE);      // domed roof

  return pts;
}
```

**Rules:**
- First argument is always `(p: GenParams)`, not individual numbers — params are typed in `generators/index.ts`.
- Always return a fresh `Point3D[]`.
- Never call `applyLimit` yourself — `generators/index.ts` wraps every generator with it.
- Never hand-roll yaw/pitch math — use the helpers from `../draw`. See `dank_studio_sphere_math` skill for the formulas if you must write your own.

### 2. Register the generator

Location: `src/lib/generators/index.ts`

```ts
import * as G from "./shapes";

export const GENERATORS: Record<string, (p: GenParams) => Point3D[]> = {
  death_star:  G.gen_death_star,
  my_build:    G.gen_my_build,    // ← add here
  ...
};
```

### 3. Add it to the build library

Location: `src/lib/builds.ts`

```ts
export const BUILDS: BuildDef[] = [
  { key: "my_build", label: "My Amazing Build", category: "Sci-Fi", defaultParams: { radius: 30 } },
  ...
];
```

**Categories in use:** `Walls`, `Historic`, `Sci-Fi`, `Military`, `Natural`, `Vehicles`, `Primitives`. Create a new one only if existing ones don't fit.

### 4. Budget the object count BEFORE running

Do the math in your head or a comment before hitting save. The hard limit is 1200. Estimate by helper:

| Helper        | Count formula                                   |
| ------------- | ----------------------------------------------- |
| `drawWall`    | `round(length / panelW)`                        |
| `drawRect`    | `4 × round(side / panelW)`                      |
| `drawRing`    | `floor(2π·r / panelW)`                          |
| `drawDisk`    | `sum over rings — roughly r² · 2 / panelW²`     |
| `drawSphere`  | `20.9 · r² / (panelW · panelH)`                 |
| `drawDome`    | half of drawSphere + drawDisk for the base      |

If total > 1100, pick bigger panels (IND10 = 8.75×10m gives 5× coverage vs CNC8 = 8×3m), or reduce radius/size.

### 5. Test it visually

```bash
cd c:/Users/Shadow/Downloads/Dank-editor-preview/artifacts/dank-studio
npx tsc --noEmit
npm run dev
```

Open http://localhost:5174, Library tab, pick your build. Check:
- **Silhouette** matches the real thing (google image search if needed)
- **No gaps** — orbit all the way around, look up/down
- **Object counter** top-right shows < 1200
- **Ground plane** — objects don't clip below y=0 unless intentional (tunnels, pools)

---

## 🎨 MATERIAL SHORTCUTS

Constants exported from the top of `shapes.ts`:

```ts
const CNC8     = "staticobj_wall_cncsmall_8";       // 8×3  grey concrete
const CNC4     = "staticobj_wall_cncsmall_4";       // 4×3  grey concrete
const IND10    = "staticobj_wall_indcnc_10";        // 8.75×10 industrial concrete
const MILCNC   = "staticobj_wall_milcnc_4";         // 4×3  military concrete
const STONE    = "staticobj_wall_stone";            // 8×3.5 dark stone
const CASTLE   = "staticobj_castle_wall3";          // 8×2  castle
const BUNKER   = "land_bunker1_double";             // 8×3.5 bunker panel
```

Mix them for visual interest — alternate rings, use different materials for trim/base/roof.

---

## 🧠 "BUILD IT LIKE A REAL ARCHITECT"

When the user asks for a named real-world structure (Eiffel Tower, Taj Mahal, Sydney Opera House, Colosseum, Burj Khalifa, pyramids, etc.):

1. **Google the proportions first.** Get height, footprint dimensions, number of floors/tiers, signature features (dome, spire, arches).
2. **Map to helpers.** Most buildings decompose into: a stack of `drawRect` floors + optional `drawDome` or `drawRing` roof + decorative `drawDisk` accents.
3. **Budget check.** Real buildings have detail; you have 1200 objects. Pick the 5-6 most iconic silhouette elements and ignore ornate details.
4. **Preserve the instantly-recognizable feature.** For Eiffel: the lattice narrowing profile. For Taj: the central onion dome + 4 minarets + reflecting pool. For Colosseum: the tiered arch rings.
5. **Use real dimensions where they fit the budget.** If Eiffel is 300m tall but you can only fit 100m at your panel size, scale uniformly — DO NOT squash one axis.

---

## 🔄 ITERATION PATTERN

Don't try to nail the build in one shot. Work in passes:

1. **Pass 1 — silhouette.** Get the basic shape right (rect stacks, rings). Verify under 500 objects.
2. **Pass 2 — proportions.** Measure from reference. Adjust heights/widths until it reads as "the thing."
3. **Pass 3 — materials.** Add the alternating bands and accent classes.
4. **Pass 4 — detail.** Spend the remaining object budget on things you can actually see from orbit distance: crenellations, spires, balconies, tribune ring.
5. **Pass 5 — polish.** Close any gaps, align edges, fix clipping.

Each pass should be a separate edit-and-reload cycle.

---

## 🚫 COMMON MISTAKES

| Mistake                                                 | Fix                                                    |
| ------------------------------------------------------- | ------------------------------------------------------ |
| Floor stack uses `for (y=0; y<h; y+=2)` with 2m step    | Walls are 3m tall — use `y+=4` for slight overlap      |
| Dome + matching floor don't align                       | Dome sits at cy, base needs drawDisk at same cy         |
| Naming: `gen_Deathstar` or `genDeathStar`               | Always `gen_death_star` (snake_case, `gen_` prefix)    |
| Forgetting the build in `builds.ts`                     | It won't show in the library even if the function runs|
| Hand-rolled yaw = `atan2(z, x)`                         | DayZ needs `atan2(x, z)` — see sphere math skill       |
| Using `p.r` in one place and `p.radius` in another      | Pick one and stick with it; default `p.radius ?? 30`   |
