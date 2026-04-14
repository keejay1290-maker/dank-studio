# DANK STUDIO — Complete AI Assistant Guide
> Read this before touching any file. Every section matters.

---

## What Is This App?

Dank Studio is a React + Three.js tool that lets DayZ server admins place large-scale object
builds on their server. Users pick a shape (Death Star, Eiffel Tower, etc.), adjust sliders,
see a real-time 3D preview, then export a SpawnObject script they paste into their server mission.

**The full pipeline:**
```
User picks build + sets params
       ↓
generate(key, params) in generators/index.ts
       ↓
Generator function pushes Point3D[] using draw.ts helpers
       ↓
applyLimit() caps at 1200 objects
       ↓
Preview3D.tsx renders boxes for each point
       ↓
Export → SpawnObject("classname", pos, rot, scale)
```

---

## DayZ Coordinate System (Memorise This)

```
     +Z (North)
      ↑
      │
-X ───┼─── +X (East)
      │
      ↓
     -Z (South)

Y = Up (height above ground)
Yaw 0° = facing North, increases CLOCKWISE
  90° = East  |  180° = South  |  270° = West

Pitch: negative = tilted up, positive = tilted down
```

**Three.js preview conversion:**
- `rotation.y = +yawRad` (NOT negative) — see Preview3D.tsx header for the proof
- `new THREE.Euler(pitchRad, yawRad, rollRad, "YXZ")`

---

## File Map

```
src/
  App.tsx                          Main UI — sidebar, sliders, code panel, preview
  components/
    Preview3D.tsx                  Three.js/R3F 3D renderer (NWAF environment)
  lib/
    builds.ts                      Build library — every entry in the sidebar lives here
    constants.ts                   Object catalogue (classnames, dimensions, colours)
    draw.ts                        Core drawing helpers (drawWall, drawRing, drawSphere…)
    mimic.ts                       3D preview box dimensions + colour per classname
    types.ts                       TypeScript interfaces (Point3D, ObjectDef, etc.)
    generators/
      index.ts                     Routes shape key → generator function
      shapes.ts                    All ~60 generator implementations

.claude/skills/                    Skill prompts for this project
AI_GUIDE.md                        ← You are here
DANK_RULES.md                      Gold-standard build/render rules
```

---

## How Generators Work

Each generator is a pure function `(p: GenParams) => Point3D[]`.

```ts
// GenParams is just Record<string, number> — read params with nullish defaults
export function gen_my_build(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, p.scale ?? 1);   // scale param

  drawRect(pts, 0, 0, 0, 20*S, 15*S, IND10);
  drawWall(pts, 0, 20*S, 0, 0, 40*S, 0, IND10);

  return pts;
}
```

`applyLimit(pts)` is called in `generators/index.ts` — you don't call it inside generators.

---

## Point3D Interface

```ts
interface Point3D {
  x:      number;   // East (metres from origin)
  y:      number;   // Height — PIVOT-BOTTOM (bottom of object, not centre)
  z:      number;   // North (metres from origin)
  yaw?:   number;   // Degrees CW from North (0 = North)
  pitch?: number;   // Degrees (negative = up)
  roll?:  number;   // Degrees
  scale?: number;   // Uniform scale (1.0 = normal size)
  name?:  string;   // DayZ classname e.g. "staticobj_wall_indcnc_10"
}
```

**Pivot-bottom:** `y` is the bottom of the object. Preview3D renders at `position.y = pt.y + height/2`
so the box is centred correctly. Keep this consistent — drawSphere and drawDome both use pivot-bottom.

---

## Draw Helper Reference (src/lib/draw.ts)

### `drawWall(pts, x1,y1,z1, x2,y2,z2, wallClass?)`
Straight line of panels from A to B.
- Auto-calculates yaw from direction vector: `atan2(dx, dz) * 180/π + 90`
- Scales panels to fill perfectly — no gaps, no spacing issues
- `wallClass`: classname string OR a raw panel width number

### `drawRing(pts, cx,cy,cz, r, wallClass?)`
Circle of panels around a centre point at radius `r`.
- Uses `Math.floor(circumference / panelW)` → count is always an integer ≥ panelW
- Scale ≥ 1 always (panels overlap slightly) → **never gaps**
- Panels face radially outward

### `drawDisk(pts, cx,cy,cz, maxR, wallClass?)`
Solid flat disk — concentric rings from `panelW` step out to `maxR`.

### `drawRect(pts, cx,cy,cz, hw,hd, wallClass?)`
Four-wall rectangular enclosure. `hw` = half-width (X), `hd` = half-depth (Z).

### `drawSphere(pts, cx,cy,cz, r, wallClass?)`
Full sphere, gap-free. Internally calls `_drawSphereRings`.
- 25% vertical overlap between rings
- North and south pole caps added automatically
- **y stored at pivot-bottom** (`surface_y - panelH/2`)

### `drawDome(pts, cx,cy,cz, r, wallClass?)`
Upper hemisphere only (phi 0 → π/2). Same algorithm as drawSphere.

### `drawSphereBudgeted(pts, cx,cy,cz, r, budget, candidates?)`
Auto-picks the largest panel class whose estimated total ≤ `budget`.
Returns the chosen classname string.
Use this when you want a sphere that always fits under 1200 objects regardless of radius.

### `applyLimit(pts, limit=1200)`
Trims array to `limit` by uniform sub-sampling.
**Do not use on spheres/domes** — sub-sampling creates visible holes.
Use `drawSphereBudgeted` instead to stay within budget organically.

---

## Material Constants (top of shapes.ts)

```ts
const IND10  = "staticobj_wall_indcnc_10"    // 8.75 × 10 m — blue-grey industrial (default)
const CNC4   = "staticobj_wall_cncsmall_4"   // 4 × 3 m    — light grey concrete
const CNC8   = "staticobj_wall_cncsmall_8"   // 8 × 3 m    — light grey concrete
const STONE  = "staticobj_wall_stone"        // 8 × 3.5 m  — dark weathered stone
const STONE2 = "staticobj_wall_stone2"       // 8 × 3.5 m  — lighter stone
const MILCNC = "staticobj_wall_milcnc_4"     // 4 × 3 m    — military olive concrete
const CASTLE = "staticobj_castle_wall3"      // 8 × 2 m    — castle stone
```

Use `getObjectWidth(classname)` and `getObjectDef(classname)` from `constants.ts`
to get real dimensions when you need them.

---

## Param Naming Conventions — CRITICAL

The `key` in `params[]` inside `builds.ts` **must exactly match** what the generator reads from `p.xxx`.
Mismatches cause sliders to silently do nothing.

| builds.ts `key` | Generator reads  | Use for                        |
|-----------------|------------------|--------------------------------|
| `scale`         | `p.scale ?? 1`   | Uniform scaling of any build   |
| `r`             | `p.r ?? 20`      | Single radius (ring, dome…)    |
| `R`             | `p.R ?? 40`      | Major radius (torus outer)     |
| `h`             | `p.h ?? 20`      | Height separate from scale     |
| `length`        | `p.length ?? 80` | Linear dimension               |
| `base`          | `p.base ?? 100`  | Base width (pyramid)           |
| `height`        | `p.height ?? 60` | When height ≠ width            |
| `tiers`         | `p.tiers ?? 3`   | Integer count of levels        |
| `turns`         | `p.turns ?? 3`   | Spiral rotations               |
| `points`        | `p.points ?? 5`  | Star fort points count         |
| `arches`        | `p.arches ?? 8`  | Arch count                     |
| `angle`         | `p.angle ?? 180` | Arc sweep in degrees           |

**Scale pattern (most generators):**
```ts
const S = Math.max(0.5, p.scale ?? 1);
// Use S everywhere: drawRect(pts, 0, 0, 0, 20*S, 15*S, IND10)
```

---

## Adding a New Generator — Step by Step

### 1. Write the function in `src/lib/generators/shapes.ts`

Add it near similar builds. Follow this template:

```ts
/**
 * 🏰 MY CASTLE
 * Medieval castle with 4 towers and a great hall.
 */
export function gen_my_castle(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, p.scale ?? 1);

  // Great hall
  for (let y = 0; y <= 16 * S; y += 8 * S) drawRect(pts, 0, y, 0, 24*S, 16*S, CASTLE);

  // Corner towers
  for (const [tx, tz] of [[-24,-16],[24,-16],[-24,16],[24,16]] as const) {
    for (let y = 0; y <= 24 * S; y += 8 * S) drawRing(pts, tx*S, y, tz*S, 5*S, CASTLE);
  }

  return pts;
}
```

### 2. Register in `src/lib/generators/index.ts`

```ts
my_castle: G.gen_my_castle,
```

### 3. Add the entry to `src/lib/builds.ts`

Put it in the right category array:

```ts
{
  key: "my_castle", label: "My Castle", category: "Fantasy",
  description: "Medieval castle with 4 towers",
  defaultParams: { scale: 1 },
  params: [
    { key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.25, default: 1 },
  ],
},
```

### That's it. The app auto-discovers it from the arrays.

---

## Object Budget Reference

DayZ server limit = 1200 objects per build (enforced by `MAX_OBJECTS` in constants.ts).

**Sphere estimates** — formula: `est ≈ (20.9 × r²) / (panelW × panelH)`

| Panel classname              | W × H (m)  | Objects for R=50 | Objects for R=72 |
|------------------------------|------------|------------------|------------------|
| staticobj_wall_indcnc_10     | 8.75 × 10  | ~240             | ~500             |
| staticobj_wall_indcnc4_8     | 8 × 8      | ~325             | ~675             |
| staticobj_wall_indcnch_10    | 8.75 × 5   | ~480             | ~995             |
| staticobj_wall_stone         | 8 × 3.5    | ~745             | >1200            |
| staticobj_wall_cncsmall_8    | 8 × 3      | ~870             | >1200            |

**Death Star** at default R=72: ~920 panels (safe, under 1200).

---

## Common Pitfalls

### Gapped spheres
Cause: `applyLimit` sub-sampling, or scale slider multiplying R past budget.
Fix: Use `p.r` for radius, not `p.scale`. Use `drawSphereBudgeted`.

### Silent slider (most common bug)
Cause: `builds.ts` param key ≠ generator `p.xxx` name.
Fix: Make them match exactly. See Param Naming table above.

### Sphere y-offset filtering (Death Star dish/trench)
`drawSphere` stores `y = surfaceY - panelH/2`. When filtering sphere panels,
reconstruct the true surface point by adding `HULL_HALF_H = getObjectDef(mat)?.height/2`.

### Yaw formula
```ts
// CORRECT — atan2(x, z), NOT atan2(z, x)
const yaw = Math.atan2(dx, dz) * 180 / Math.PI;

// For sphere rings (outward radial):
const yaw = Math.atan2(x - cx, z - cz) * 180 / Math.PI;

// For wall direction:
const yaw = Math.atan2(dx, dz) * 180 / Math.PI + 90;
```

### Three.js rotation
`rotation.y = +yawRad` in Preview3D (NOT negated). See the header proof in Preview3D.tsx.

### Ring gap prevention
Always use `Math.floor(circ / panelW)` for panel count — never `Math.round` or `Math.ceil`.
`floor` gives scale ≥ 1 → panels overlap slightly → never gaps.

---

## The Build Registry (builds.ts)

Each `BuildEntry` has:
```ts
{
  key:           string;        // matches REGISTRY key in generators/index.ts
  label:         string;        // shown in sidebar
  category:      string;        // one of the sidebar categories
  description?:  string;        // shown as tooltip/subtitle
  defaultParams: Record<string, number>;  // used on first load and ↺ reset
  params:        ParamDef[];    // drives the slider UI
}

interface ParamDef {
  key:     string;   // MUST match p.xxx in generator
  label:   string;   // shown above slider
  min:     number;
  max:     number;
  step:    number;
  default: number;   // used by ↺ reset button
}
```

`CATEGORIES` is auto-derived from all build entries — just add entries, categories appear automatically.

---

## Preview3D Scene (NWAF Environment)

The 3D preview renders an approximation of DayZ's North West Airfield:
- **Apron** — large concrete area where build objects spawn
- **Taxiway** — parallel strip with yellow dashes, behind the apron
- **Runway** — with threshold bars, white edge lines, centreline dashes
- **Hangars** — 3 Soviet-era concrete boxes in the background
- **Control tower** — tall shaft with observation level
- **Tree line** — distant pines along the north and west edges

Objects from the generator appear on the apron at coordinates matching their Point3D positions.

`getMaterialProps(classname)` in Preview3D.tsx maps object type → PBR roughness/metalness.
Results are cached in `_matCache` (module-level Map) — no string ops per frame.

`BuildObject` is wrapped in `React.memo` — only re-renders when the Point3D for that object changes.

---

## Skills Available in This Project

| Skill | Use when |
|-------|----------|
| `dank_studio_architecture` | Need full project map / component relationships |
| `dank_studio_sphere_math` | Working on sphere/dome geometry, gap elimination |
| `dank_studio_adding_generators` | Step-by-step guide to adding a new generator |
| `dank_studio_preview_renderer` | Changes to Preview3D, camera, materials |
| `master_stylist` | High-fidelity builds matching real-world references |
| `architectural_perfection` | Zero-gap algorithmic sweep methodology |
| `simplify` | Post-implementation quality/efficiency review |

---

## DayZ Object Naming Conventions

| Pattern in classname | What it means |
|----------------------|---------------|
| `staticobj_wall_*`   | Placeable wall panel |
| `_indcnc_10`         | Industrial concrete, 10m **tall** (8.75m wide) |
| `_cncsmall_8`        | Small concrete, 8m **wide** (3m tall) |
| `_stone` / `_stone2` | Stone wall (light/dark variant) |
| `_milcnc_*`          | Military concrete |
| `land_*`             | World objects (containers, tanks, buildings) |
| `staticobj_*`        | Placeable static objects |
| `barrel_*`           | Metal barrels (coloured variants) |
| Trailing number      | Face length in metres (except indcnc where it's height) |

---

*Last updated: 2026-04-14 — covers all generators in shapes.ts and all UI features in App.tsx*
