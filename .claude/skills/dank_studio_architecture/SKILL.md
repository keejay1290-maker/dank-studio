# 🗺️ DANK STUDIO — PROJECT ARCHITECTURE MAP

**Audience:** Any AI model (Claude, GPT-4, Gemini, local LLMs) picking up this project cold.
**Read this first** before editing anything. It tells you which project is live and where every moving part lives.

---

## ⚠️ TWO PROJECTS — WHICH ONE IS LIVE?

There are **two copies** of the same code on this machine:

| Path                                                                           | Status             |
| ------------------------------------------------------------------------------ | ------------------ |
| `C:\Users\Shadow\Downloads\Dank-editor-preview\artifacts\dank-studio\`         | **🟢 LIVE** — dev server runs from here (`npm run dev` → port 5174) |
| `C:\Users\Shadow\Downloads\dank-studio\`                                       | 🟡 Secondary — keep in sync, not under git |

**Git repo root** is `C:\Users\Shadow\Downloads\Dank-editor-preview\`. Only the `artifacts/dank-studio` tree is tracked.

**Rule:** edit `artifacts/dank-studio` first. Then copy the changed files to `C:\Users\Shadow\Downloads\dank-studio\` with the same relative path. Never edit the secondary copy without then overwriting the artifacts one or you'll lose the change.

---

## 🧩 FILE MAP (inside `artifacts/dank-studio/src/`)

```
src/
├── main.tsx                    entry point
├── App.tsx                     root layout: Library / Draw / Panel mode tabs
├── components/
│   ├── Preview3D.tsx           the 3D canvas (see dank_studio_preview_renderer skill)
│   ├── DrawCanvas.tsx          2D line-draw mode for freehand walls
│   ├── ObjectPicker.tsx        UI for selecting a classname
│   └── PanelBuilder.tsx        grid-based panel placement
└── lib/
    ├── types.ts                Point3D interface — the universal object format
    ├── constants.ts            OBJECT_CATALOGUE — every DayZ object we know
    ├── mimic.ts                DayZ classname → [w,h,d,color] for 3D preview boxes
    ├── draw.ts                 CORE HELPERS: drawWall, drawRing, drawDisk, drawRect,
    │                           drawSphere, drawDome, drawSphereBudgeted, applyLimit
    ├── builds.ts               list of available builds (key, label, category)
    └── generators/
        ├── index.ts            maps build key → generator function, calls applyLimit
        └── shapes.ts           ALL generators (gen_death_star, gen_atat_walker, ...)
```

---

## 🧱 DATA FLOW

```
User picks build in App.tsx
        │
        ▼
generators/index.ts   →  runs the matching gen_* function from shapes.ts
        │                 (passes GenParams — a Record<string, number>)
        ▼
shapes.ts             →  calls drawWall / drawRing / drawSphere... from draw.ts
        │                 which push Point3D{x,y,z,yaw,pitch,name,scale} items
        ▼
applyLimit(1200)      →  last-resort cull if over budget
        │                 ⚠ sub-samples uniformly — creates HOLES in spheres
        │                 ⚠ generators should use drawSphereBudgeted to AVOID hitting this
        ▼
Preview3D.tsx         →  renders every Point3D as a box using mimic.ts dims
        │                 exports to DayZ JSON via App's export button
        ▼
DayZ (in-game)
```

---

## 🪄 THE GOLDEN RULES

1. **Object limit: 1200.** Hard cap. Spheres MUST use `drawSphereBudgeted` or pick a panel class that naturally fits.
2. **DayZ coordinate system:** X = East, Y = Up, Z = North. **Left-handed.** Yaw=0 faces North (+Z), clockwise: 90=East, 180=South, 270=West.
3. **Three.js vs DayZ yaw:** Three.js Y-rotation is CCW. Use `rotation.y = +yawRad` (NOT negated). The negative-yaw bug was fixed — don't reintroduce it.
4. **Sphere ring step uses panel HEIGHT, not width.** `ringStep = panelH * 0.75` (25% overlap). See `dank_studio_sphere_math` skill for proof.
5. **Panel count formula:** `total ≈ 20.9 · r² / (panelW · panelH)`. Use this to budget before generating.
6. **Horizontal panel count uses floor():** `nPanels = Math.floor(circ / panelW)` → guarantees scale ≥ 1 → no horizontal gaps. NEVER use `round()` or `ceil()`.

---

## 🛠️ HOW TO DO COMMON TASKS

**Editing a shape generator?** → Read `dank_studio_adding_generators` skill.
**Preview looks wrong (white bg / clipping / rotation)?** → Read `dank_studio_preview_renderer` skill.
**Sphere has gaps / over-budget?** → Read `dank_studio_sphere_math` skill.
**Adding a new DayZ object class?** → Add to BOTH `constants.ts` `OBJECT_CATALOGUE` AND `mimic.ts` `MIMICS` with the same w/h/d. Add a fuzzy fallback in mimic.ts `getMimic` for name variants.

---

## 🚦 VERIFICATION CHECKLIST (run after any geometry change)

```bash
cd c:/Users/Shadow/Downloads/Dank-editor-preview/artifacts/dank-studio
npx tsc --noEmit         # must be clean
npm run dev              # open http://localhost:5174 and test the changed build visually
```

Never declare a geometry change "done" without opening the preview and eyeballing it. Type checks pass on broken geometry all the time.
