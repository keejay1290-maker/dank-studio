# DANK STUDIO — Session Handover
**Last updated:** 2026-04-17 | **Renderer:** V6.5 Extreme | **Desktop app:** dist-electron/win-unpacked/

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
- `drawRing`: places panels tangentially around horizontal (XZ-plane) circle only
- `drawRect`: 4 walls of a box, no capping
- Horizontal cylinders (nacelles, torpedoes): use manual `pts.push` with pitch=±90 for top/bottom plates and yaw=±90 for side plates

**Renderer conversion** (Preview3D.tsx line ~220):
```ts
rot = new THREE.Euler(pitch*DEG, yaw*DEG, roll*DEG, "YXZ")
```

**Zero-panel trap**: `drawWall(pts, x,y1,z, x,y2,z, cls)` where only Y differs produces 0 panels (vertical line). Fix with an explicit loop:
```ts
for (let sy = startY; sy < endY; sy += PANEL_HEIGHT) {
  pts.push({ x, y: sy, z, yaw: 0,  pitch: 0, name: cls });
  pts.push({ x, y: sy, z, yaw: 90, pitch: 0, name: cls });
}
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

## PANEL CONSTANTS (P3D-verified — use these, not raw strings)

```ts
const CASTLE = "staticobj_castle_wall3";      // ~8m × 2m
const STONE  = "staticobj_wall_stone";        // 10.060m × 2.034m dark stone
const STONE2 = "staticobj_wall_stone2";       // 9.408m × 1.572m light stone
const CNC8   = "staticobj_wall_cncsmall_8";   // 8.008m × 2.300m concrete
const CNC4   = "staticobj_wall_cncsmall_4";   // 4.017m × 2.324m concrete
const MILCNC = "staticobj_wall_milcnc_4";     // 4.052m × 4.744m military
const IND10  = "staticobj_wall_indcnc_10";    // 9.012m × 9.758m industrial
```

---

## RECENT CHANGES (2026-04-19)

| What | Detail |
|---|---|
| **Iron Throne (GoT)** | New Fantasy build: 3-tier STONE base, STONE2 armrests, 5-row CNC4 backrest, fan of TUBE_S/TUBE_B sword-spine tubes radiating at angles, POLE micro-shards — registry key `iron_throne` |
| **Container Mode** | Global toggle on the params bar (📦 Containers button). Calls `containerify()` post-processor in `generators/index.ts`. Replaces wall panels with `land_container_1bo` scaled so long axis (10m) matches face width; stacks rows for height; passes through objects already in `KEEP_AS_IS` list |
| **Zoom +/− buttons** | Added to bottom-right of Preview3D overlay. Manipulate `ctrlRef.current.object` (camera) position toward/away from OrbitControls `target`. Factor 0.75 = zoom in 25%, 1.33 = zoom out 33% |
| **5 Container builds** | New "Containers" category in sidebar: Sky Fort (elevated stilt platform), Container Ziggurat (stepped pyramid), Container Drum Tower (circular ring+crenellations), Container Helix (double counter-rotating spiral), Container Space Station (cruciform core + ring) |
| **AT-AT ceiling flush** | Body roof IND10 panels stored at `bodyTop - 4.376` (renderer y-offset fix: `wall_top - (h-d)/2`). Head ceiling MILCNC at `headBY + HH - 1.824`. Eliminates floating gap |
| **Death Star adaptive density** | `ringDensity = min(1.6, 0.75 + max(0, R-35)*0.028)` prevents object overflow at R=60 |
| **Death Star dish rewrite** | Concave bowl (panels face radially outward from sphere center), 10 rings, 8 spoke channels, colour graded CNC4→MILCNC→hull material, central `barrel_red` focal lens |
| **Death Star trench** | Trench walls rebuilt with `_drawSphereRings` for gapless hull-to-trench junction |

### Container Mode — implementation notes
- `containerify()` in `generators/index.ts` post-processes any `Point3D[]`
- Container dims (P3D): w=2.702 h=2.782 d=10.000 — `scC = faceW / 10.0`
- Vertical panels: `contYaw = panelYaw + 90` (long axis aligns along wall), stacked `rows = ceil(mimic.h / (2.782 * scC))`
- Flat panels (|pitch-90|<10): single container lying flat, same yaw, same scale
- Pass-through: anything already in `KEEP_AS_IS` set (containers, barrels, pier_tubes)

### Flat-panel flush formula (critical — do not regress)
For any object at pitch=±90 (floor/roof tile), stored Y must be:
```
stored_y = target_surface_y - (mimic.h - mimic.d) / 2
```
After renderer adds `mimic.h * scale / 2`, the box center sits at `surface_y + mimic.d/2` → flush with surface.
- IND10 (h=9.758, d=1.007): offset = −4.376
- MILCNC (h=4.744, d=1.096): offset = −1.824

## RECENT CHANGES (2026-04-17)

| What | Detail |
|---|---|
| Eiffel Tower spire fix | Replaced zero-panel `drawWall` (vertical) with MILCNC cross-pair loop at 4.744*S steps — same fix pattern as Stark Tower |
| Eiffel Tower default scale | 1.0 → 0.5; slider range 0.5–3 → 0.25–2 (was over object threshold at default) |
| Taj Mahal default scale | 1.0 → 0.5; slider range tightened to 0.25–2 |
| Colosseum description | "Roman amphitheatre — 4-tiered elliptical arched facade with cardinal entrances" |
| Great Pyramid description | "Ancient wonder of the world — stepped limestone casing with mortuary complex" |
| USS Enterprise NCC-1701 | **New sci-fi build** (~640 panels at scale=1): saucer section (3-row IND10 rim, 5-ring CNC4 top, 4-ring CNC4 bottom), bridge dome (MILCNC), photon torpedo launcher (barrel_red), 6-step neck interpolation, engineering hull (CNC8 rings), deflector dish (barrel_blue), warp pylons, twin nacelles (hull plates + Bussard collectors barrel_red + plasma vents barrel_blue), 6 phaser strips |

## RECENT CHANGES (2026-04-16)

| What | Detail |
|---|---|
| Black screen fix | Removed `logarithmicDepthBuffer` (conflicts with EffectComposer), `multisampling` set to 0, ErrorBoundary replaced with real React class component |
| Sci-fi rotation audit | Falcon engine glow moved to rear; Stark Tower spire fixed; AT-AT knee → STONE; X-Wing exhaust glow added |
| Cyberpunk Nexus | Full rebuild: ziggurat setback, neon rings, skybridge arms, rooftop spires |
| Saturn | Correct ring bands at 1.2–2.27× planet radius, 26.7° axial tilt |
| Borg Cube | New build: stochastic-erosion hull, CNC8 sub-modules, edge conduits, corner spires. Corners: scale-fill to exact edge |
| Halo Installation | New build: 3-layer ring, terrain surface, 12 ribs, Forerunner engines |
| AT-AT legs | Leg struts rewritten: Z-only offset for front/back walls, X-only for inner/outer |
| Star Destroyer | Full rewrite: deckY = IND10 height (9.758m), triangular deck fill, 3-tier superstructure, turbolaser batteries, stacked engine nozzles |
| barrel_green fix | getMaterialProps maps barrel_green → barrel_green_co.png (was barrel_red) |

---

## KNOWN ACTIVE BUGS

### AT-AT Walker — may still crash
- Legs now use correct box-strut geometry
- If it crashes: open DevTools (Ctrl+Shift+I), Generate AT-AT, check Console for NaN or Three.js error

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
