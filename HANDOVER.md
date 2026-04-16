# DANK STUDIO — SESSION HANDOVER DOCUMENT
**Date:** 2026-04-16  
**Author:** Claude Sonnet 4.6  
**Status:** Out of context. Resume in a new session.

---

## WHAT WAS DONE THIS SESSION

### 1. Real DayZ Texture Pipeline
- Extracted 21 real DayZ `.paa` textures to `public/textures/*.png` using `ImageToPAA.exe` from DayZ Tools.
- Script: `tools/extract_textures.py` — re-run this any time to refresh textures.
- Textures used: `indcnc_co.png`, `stone_co.png`, `metal_co.png`, `rust_co.png`, `milcnc_co.png`, `container_co.png`, `barrel_red_co.png`, etc.

### 2. Preview3D High-Fidelity Renderer
`src/components/Preview3D.tsx` was significantly upgraded:
- **`DZ_TEXTURE_URLS`** — maps 5 material types (concrete, stone, metal, rust, dirt_concrete) to real DayZ PNG textures via `./textures/*.png` (relative paths for Electron compatibility).
- **`DayZTexturedBox`** — new component using `useTexture()` hook from drei; loads real DayZ textures with tiled repeat; wrapped in `<Suspense>`.
- **`GltfModel`** — also uses `useTexture()` for real DayZ maps applied to loaded GLB geometry.
- **`highCount` threshold** — set to `points.length > 900`. Below this, every object gets real DayZ textures. Above it, canvas fallback is used to avoid memory issues. **Do not lower this below 500.**
- All asset paths are `./`-relative (not `/`-absolute) so they work in both Vite dev server and Electron `file://` context.

### 3. GLB Models — Corrugated Wall Geometry
`tools/gltf_generator.py` updated:
- `corrugated_wall_mesh()` — adds horizontal corrugation ribs to `indcnc`, `milcnc`, `cncsmall` wall panels.
- All 547 GLBs regenerated. IND10 is now ~9KB (was 2KB flat box).
- Regenerate with: `python tools/gltf_generator.py`

### 4. Desktop App Updated
- `dist-electron/win-unpacked/resources/app.asar` updated to 171MB (contains all 547 GLBs + 21 textures).
- **Run the app:** `dist-electron/win-unpacked/Dank Studio.exe`
- `electron:build` (NSIS installer) fails because Windows Defender locks `d3dcompiler_47.dll` immediately after creation. Workaround: add `dist-electron\win-unpacked\` to Windows Defender exclusions, then run `npm run electron:build`. The portable `win-unpacked` exe works fine regardless.
- When updating the app after code changes, use this asar-swap method (avoids the DLL lock issue):
  ```bash
  mkdir -p /tmp/asar_tmp
  npx asar extract dist-electron/win-unpacked/resources/app.asar /tmp/asar_tmp
  cp -r dist/. /tmp/asar_tmp/dist/
  npx asar pack /tmp/asar_tmp dist-electron/win-unpacked/resources/app.asar
  ```

---

## KNOWN BUGS TO FIX (NEXT SESSION)

### BUG 1 — Death Star crashes at default radius (CRITICAL)
**File:** `src/lib/builds.ts` line 29 — `defaultParams: { r: 72 }`, max: 140  
**Cause:** At R=72 the generator produces ~1400+ panels (sphere ~1232 + trench 300 + dish 350). No `applyLimit()` call. React tries to mount 1400+ Three.js meshes, browser OOM.  
**Fix — two changes:**
1. In `src/lib/builds.ts`, change death_star params:
   ```ts
   defaultParams: { r: 50 },
   params: [{ key: "r", label: "Radius (m)", min: 30, max: 80, step: 2, default: 50 }],
   ```
2. In `src/lib/generators/shapes.ts`, at the very end of `gen_death_star()`, before `return pts`:
   ```ts
   import { applyLimit } from "../draw";
   // inside gen_death_star, before return:
   return applyLimit(pts, 1100);
   ```
   (Note: `applyLimit` is already exported from draw.ts — add it to the import at line 17 of shapes.ts.)

**Why R=50 works:** Sphere estimate = 20.9 × 50² / (9.012 × 9.758) ≈ 594 panels. After dish+trench filter ~500. Total with extras ≈ 900 — safely under 1100.

### BUG 2 — AT-AT Walker crashes (needs investigation)
**File:** `src/lib/generators/shapes.ts` — `gen_atat_walker()`  
**Panel count at scale=1:** Only ~81 panels — should NOT cause OOM.  
**Likely cause:** Either a NaN position from a geometry calculation, or a React error from `useTexture` inside a Suspense boundary that propagates uncaught.  
**Debug approach in next session:**
1. Open browser DevTools (Ctrl+Shift+I in Electron or the dev server at port 5174).
2. Select AT-AT Walker, click Generate.
3. Look in the Console for the exact error — `NaN`, `TypeError`, or a Three.js error.
4. Check if `drawWall` with zero-length segments is producing degenerate geometry (the neck drawWall from `(0, bodyTop, -BD)` to `(0, LH+6S, -BD-10S)` has `dx=0` — check that `len > 0.01` guard triggers correctly).

---

## NEXT SESSION — FULL RENDERER UPGRADE PLAN

The user wants game-engine quality visuals matching DayZ itself. Here is the complete plan for the next session:

### Priority 1 — Instanced Rendering (performance)
Currently each object is a separate `<mesh>` component. At 500+ objects this is slow.  
Replace with `THREE.InstancedMesh` grouping identical classnames:
```tsx
// Group pts by classname
const groups = Map<string, Point3D[]>
// For each group, create one InstancedMesh with count = group.size
// Set instance matrices from pt.x/y/z + euler
```
This reduces draw calls from 500+ to ~20 (one per unique classname).  
Key file to edit: `src/components/Preview3D.tsx` — replace the `BuildObject` map with an `InstancedBuildGroup` component.

### Priority 2 — ACES Tone Mapping (already in but verify)
Check `src/components/Preview3D.tsx` Canvas element — should have:
```tsx
<Canvas
  shadows
  gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
  ...
>
```
If missing, add it. This single change makes colours look cinematic vs. washed out.

### Priority 3 — Normal Maps
The DayZ texture `.paa` files also ship `_nohq.paa` (normal+height) maps.  
`tools/extract_textures.py` already extracts some `_nohq` variants.  
Add them to `DZ_TEXTURE_URLS` as a second map:
```tsx
const DZ_NORMAL_URLS: Record<TexType, string> = {
  concrete: "./textures/indcnc_nohq.png",
  stone:    "./textures/stone_nohq.png",
  ...
};
// In DayZTexturedBox and GltfModel:
const [tex, normalTex] = useTexture([url, normalUrl]);
// <meshStandardMaterial map={tex} normalMap={normalTex} normalScale={[1.2, 1.2]} ... />
```

### Priority 4 — SSAO / Post-Processing
Install `@react-three/postprocessing` (already likely in node_modules as a drei peer dep).  
Wrap the Canvas content:
```tsx
import { EffectComposer, SSAO, Bloom } from "@react-three/postprocessing";
// In Scene:
<EffectComposer>
  <SSAO radius={0.05} intensity={20} luminanceInfluence={0.6} />
  <Bloom luminanceThreshold={0.9} intensity={0.3} />
</EffectComposer>
```
SSAO adds the contact-darkening in crevices that makes DayZ look grounded.

### Priority 5 — Real Mesh Import (Mikero's Eliteness — ODOL→MLOD)
The biggest visual upgrade: using actual P3D vertex data instead of procedural boxes.  
Steps:
1. Download **Mikero's Eliteness** from `https://mikero.bohemia.net/downloads/` — free tool, installs `peew.exe`.
2. Run: `peew.exe DePbo <path_to_dayz_pbo>` to unpack PBO files.
3. Run: `ElitenessMKII.exe <path>.p3d` to convert ODOL → MLOD.
4. Then `tools/p3d_blender_convert.py` can import the MLOD output via Arma3ObjectBuilder add-on.
5. Export each P3D as GLB → `public/models/{classname}.glb`.
This gives you the actual DayZ wall meshes with correct geometry, UVs, and normals.  
**Pre-requisite:** Blender 3.6+ with [Arma3ObjectBuilder add-on](https://github.com/MrClock8163/Arma3ObjectBuilder).

---

## ARCHITECTURE REFERENCE

```
src/
  components/Preview3D.tsx     — 3D renderer (React Three Fiber)
  lib/
    generators/shapes.ts       — All build generators (gen_death_star, gen_atat_walker, etc.)
    draw.ts                    — drawWall / drawRing / drawRect / drawSphere helpers
    constants.ts               — Object dims + MAX_OBJECTS=1200
    mimic.ts                   — P3D-verified dimensions for 3D preview
    builds.ts                  — UI param definitions (key must match p.xxx in generator)
    types.ts                   — Point3D interface
public/
  models/                      — 547 GLB files (corrugated walls, auto-generated)
  textures/                    — 21 real DayZ PNG textures
tools/
  gltf_generator.py            — Regenerates all 547 GLBs
  extract_textures.py          — Re-extracts DayZ PAA→PNG textures
  p3d_catalogue.json           — P3D-verified dimensions for 547 objects
dist-electron/
  win-unpacked/                — Portable desktop app (run Dank Studio.exe)
    resources/app.asar         — Packaged app (171MB — includes all models+textures)
```

---

## QUICK COMMANDS REFERENCE

```bash
# Dev server (browser, hot reload)
npm run dev                    # http://localhost:5174

# Production build (updates dist/)
npm run build

# Update desktop app after build (asar swap — avoids DLL lock)
mkdir -p /tmp/asar_tmp
npx asar extract dist-electron/win-unpacked/resources/app.asar /tmp/asar_tmp
cp -r dist/. /tmp/asar_tmp/dist/
npx asar pack /tmp/asar_tmp dist-electron/win-unpacked/resources/app.asar

# Regenerate all 547 GLB models
cd tools && python gltf_generator.py

# Re-extract DayZ textures (requires DayZ Tools installed)
python tools/extract_textures.py
```

---

## IMPORTANT GOTCHAS

| Issue | Detail |
|---|---|
| Electron paths | All asset URLs must be `./`-relative (not `/`-absolute). `/models/foo.glb` → `C:/models/foo.glb` on Windows. |
| `highCount` threshold | Line 740 of Preview3D.tsx — currently `> 900`. If lowered below ~50, real DayZ textures won't load on any real build. |
| `applyLimit` vs `drawSphereBudgeted` | Never call `applyLimit` on sphere/dome output — creates visible holes. Use `drawSphereBudgeted` instead and cap radius in builds.ts. |
| GLB save_to_bytes | Returns a list of chunks, not bytes. Always `b"".join(gltf.save_to_bytes())`. |
| Param key matching | `builds.ts` param `key` must exactly match `p.xxx` in the generator function. Mismatch silently breaks sliders. |
| Windows Defender | Locks `d3dcompiler_47.dll` immediately after electron-builder writes it. Use the asar-swap method above instead of `npm run electron:build`. |
