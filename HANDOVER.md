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

## KNOWN ACTIVE BUGS

### AT-AT Walker — crash to investigate
- Generator produces ~150-200 panels (not an OOM issue)
- Likely: NaN position from a geometry edge case, or an uncaught Suspense error
- **Debug**: open DevTools (Ctrl+Shift+I), select AT-AT Walker → Generate → check Console

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
