# DANK STUDIO — Session Handover
**Last updated:** 2026-04-16 | **Renderer:** V6.5 Extreme | **Desktop app:** dist-electron/win-unpacked/

---

## WHAT NOT TO TOUCH

| File / Area | Rule |
|---|---|
| `Dank-editor-preview/` | Old project — ignore completely |
| `dist-electron/` | Never edit by hand — update via asar-swap only |
| `public/models/*.glb` | Auto-generated — run `python tools/gltf_generator.py` to regenerate |
| `public/textures/*.png` | Auto-extracted — run `python tools/extract_textures.py` to refresh |
| `applyLimit` on sphere output | **Never** call `applyLimit` on `drawSphere`/`drawDome` output — creates visible holes. Use `drawSphereBudgeted` and cap radius in builds.ts instead |
| `highCount` threshold | Removed in V6. The renderer now always uses GLB+textures for any count |
| Asset paths | Must be `./`-relative (not `/`-absolute). `/models/foo.glb` → `C:/models/foo.glb` on Windows |

---

## WHAT YOU CAN TOUCH

### Adding a new generator (the only flow that matters):

1. **Write the generator** in `src/lib/generators/shapes.ts`:
   ```ts
   export function gen_myname(p: GenParams): Point3D[] {
     const pts: Point3D[] = [];
     // use drawWall / drawRing / drawRect / drawSphere helpers
     return applyLimit(pts, 1100); // always cap
   }
   ```

2. **Register it** in `src/lib/generators/index.ts`:
   ```ts
   my_build_key: G.gen_myname,
   ```

3. **Add UI entry** in `src/lib/builds.ts`:
   ```ts
   { key: "my_build_key", label: "My Build", category: "Sci-Fi",
     defaultParams: { scale: 1 },
     params: [{ key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.1, default: 1 }] }
   ```

4. **Param key** in `builds.ts` must **exactly match** `p.xxx` in the generator — mismatch silences sliders with no error.

---

## ROTATION CONVENTIONS (Critical)

```
yaw=0   → face +Z (North)   |  yaw=90  → +X (East)
yaw=180 → face -Z (South)   |  yaw=-90 → -X (West)

pitch=0   → panel stands vertical
pitch=-90 → panel lies flat, face pointing up (floor tile)
pitch=+90 → panel lies flat, face pointing down

roll=θ → spin around panel's face axis (use for tilted rings — see Stargate)
```

**Draw helper rotation output:**
- `drawWall`: auto-computes `yaw = atan2(dx, dz) * 180/π` and `pitch` from slope
- `drawRing`: places panels tangentially around horizontal circle
- `drawRect`: 4 walls of a box, no capping

**Renderer conversion** (Preview3D.tsx line ~220):
```ts
rot = new THREE.Euler(pitch*DEG, yaw*DEG, roll*DEG, "YXZ")
```

---

## CURRENT ARCHITECTURE

```
src/lib/generators/shapes.ts    — All generators (add new ones here)
src/lib/generators/index.ts     — Registry + generate() entry point
src/lib/builds.ts               — UI sidebar definitions
src/lib/draw.ts                 — drawWall / drawRing / drawRect / drawSphere / applyLimit
src/lib/mimic.ts                — P3D-verified panel dimensions for 3D preview
src/lib/constants.ts            — Object dims, MAX_OBJECTS=1200
src/components/Preview3D.tsx    — React Three Fiber renderer (V6.5)
public/models/                  — 547 GLB files (auto-generated corrugated walls)
public/textures/                — 21 real DayZ PNG textures
tools/gltf_generator.py         — Regenerates all 547 GLBs
tools/extract_textures.py       — Re-extracts DayZ PAA→PNG textures
dist-electron/win-unpacked/     — Portable desktop app (Dank Studio.exe)
```

---

## RECENT CHANGES (2026-04-16)

| What | Detail |
|---|---|
| Black screen fix | Removed `logarithmicDepthBuffer` (conflicts with EffectComposer), `multisampling` set to 0, ErrorBoundary replaced with real React class component |
| Sci-fi rotation audit | Falcon engine glow moved to rear; Stark Tower spire fixed (was zero-panel drawWall); AT-AT knee → STONE; X-Wing exhaust glow added |
| Cyberpunk Nexus | Full rebuild: ziggurat setback, neon rings, skybridge arms, rooftop spires |
| Saturn | Correct ring bands at 1.2–2.27× planet radius, 26.7° axial tilt |
| Borg Cube | New build: stochastic-erosion hull, CNC8 sub-modules, edge conduits, corner spires. Corners fixed: panels now scale-fill to exact H edge |
| Halo Installation | New build: 3-layer ring, terrain surface, 12 ribs, Forerunner engines |
| AT-AT legs | Leg struts rewritten: 4 walls now properly offset (Z-only for front/back, X-only for inner/outer) — previously all 4 walls were diagonal duplicates |
| Star Destroyer | Full rewrite: correct deckY = IND10 height (9.758m); proper triangular deck fill; 3-tier superstructure; 4 turbolaser batteries; 3+2 engine nozzles with stacked depth rings |
| barrel_green fix | getMaterialProps now maps barrel_green → barrel_green_co.png (was wrongly using barrel_red) |

---

## KNOWN ACTIVE BUGS

### AT-AT Walker — may still crash
- Legs now use correct box-strut geometry
- If it still crashes: open DevTools (Ctrl+Shift+I), Generate AT-AT, check Console for NaN or Three.js error

---

## DESKTOP APP UPDATE (asar-swap — the ONLY working method)

```bash
npm run build
mkdir -p /tmp/asar_tmp
npx asar extract dist-electron/win-unpacked/resources/app.asar /tmp/asar_tmp
cp -r dist/. /tmp/asar_tmp/dist/
npx asar pack /tmp/asar_tmp dist-electron/win-unpacked/resources/app.asar
```

`npm run electron:build` is permanently broken (Windows Defender locks `d3dcompiler_47.dll`).

---

## QUICK COMMANDS

```bash
npm run dev          # dev server → http://localhost:5174
npm run build        # production build → dist/
python tools/gltf_generator.py          # regenerate all 547 GLBs
python tools/extract_textures.py        # re-extract DayZ textures
```
