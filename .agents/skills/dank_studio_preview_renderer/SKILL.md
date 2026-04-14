# 🎥 DANK STUDIO — 3D PREVIEW RENDERER

**Audience:** Any AI editing `src/components/Preview3D.tsx` or debugging why the preview looks wrong.

**Stack:** React Three Fiber v9 + drei v10 + three v0.183. No post-processing libs (add only if absolutely necessary — `@react-three/postprocessing` is NOT installed).

---

## 🏗️ RENDERER STRUCTURE

```
<Canvas camera fov=55 far=6000 shadows="soft"
        gl={{ antialias, toneMapping: ACESFilmic, toneMappingExposure: 1.05, outputColorSpace: SRGB }}>
  <Scene>
    <AutoFrame/>               ← re-fits camera when points change
    <ControlsRef/>             ← OrbitControls with damping
    <Sky distance=4500/>       ← CRITICAL: distance MUST be < camera.far or sky mesh is clipped → WHITE BACKGROUND
    <color attach="background" args={["#7faed6"]}/>  ← fallback if sky fails
    <fog/>                     ← haze colour matches sky (#aec8e8)
    <hemisphereLight/>         ← warm sky / cool-earth fill
    <directionalLight/>        ← key sun, shadow-mapSize 2048, PCFSoft
    <directionalLight/>        ← cool fill from opposite side
    <Grid/>                    ← infinite ground grid, 8m cells
    <ContactShadows/>          ← soft blob shadow under build
    {points.map(BuildObject)}  ← every Point3D rendered as a box
  </Scene>
</Canvas>
```

---

## 🚨 KNOWN PITFALLS (all fixed — keep them fixed)

### 1. White background after adding `<Sky>`

**Cause:** drei's `<Sky>` defaults to `distance=450000`, far beyond our `camera.far=6000`. The sky mesh is frustum-clipped, the camera sees the clear colour instead (which is white by default in Three.js).

**Fix:** set `distance={4500}` on `<Sky>` — inside the camera far plane. Also keep a `<color attach="background">` fallback so even if Sky fails you don't see white.

```tsx
<Sky distance={4500} sunPosition={[150, 200, 100]} turbidity={8} rayleigh={2.2} />
<color attach="background" args={["#7faed6"]} />
```

### 2. All panels rotated to the wrong side

**Cause:** `new THREE.Euler(pitchRad, -yawRad, rollRad, "YXZ")` — the negative sign mirrors every panel.

**Fix:** use `+yawRad`. See `dank_studio_sphere_math` skill for the mathematical proof. Never reintroduce the negative.

### 3. `sunPosition={vec3.normalize()}`

**Symptom:** Sun position too close to origin, Sky shader produces dark/black result.

**Fix:** pass a raw tuple like `[150, 200, 100]` — drei's Sky projects it onto its sphere internally. Don't normalize.

### 4. `shadows="soft"` string value

R3F v9 accepts `shadows="basic" | "percentage" | "soft" | "variance"` or `shadows={true}`. `"soft"` is valid → PCFSoftShadowMap. Don't change to `shadows` boolean unless you know why.

---

## 🎨 PBR MATERIAL LOOKUP

Per-object roughness/metalness lives in `getMaterialProps(classname)` at the top of `Preview3D.tsx`. Patterns checked in order:

| Classname contains…                | roughness | metalness | look               |
| ---------------------------------- | --------- | --------- | ------------------ |
| `container`, `tank`                | 0.38      | 0.62      | painted metal      |
| `barrel`                           | 0.28      | 0.72      | shiny steel        |
| `indcnc`, `cncsmall`, `_cnc`       | 0.90      | 0.02      | rough concrete     |
| `stone`, `castle`                  | 0.97      | 0.00      | matte stone        |
| `mil` (catch-all military)         | 0.72      | 0.18      | weathered metal    |
| `bridge`, `pier`, `timber`         | 0.92      | 0.00      | wood               |
| `bunker`                           | 0.85      | 0.04      | rough concrete     |
| default                            | 0.82      | 0.05      | generic            |

When adding a new object class, add a new pattern to `getMaterialProps` too if it needs a distinct look.

---

## 💡 LIGHTING RECIPE

```tsx
<hemisphereLight args={["#c8dff5", "#4a3d28", 0.55]} />    // sky / ground fill

<directionalLight
  position={[150, 200, 100]}           // matches Sky sun position
  intensity={2.0}
  castShadow
  shadow-mapSize-width={2048}
  shadow-mapSize-height={2048}
  shadow-camera-near={0.5}
  shadow-camera-far={1200}
  shadow-camera-left={-300}  right={300}  top={300}  bottom={-300}
  shadow-bias={-0.0004}
/>

<directionalLight position={[-100, 80, -120]} intensity={0.45} color="#7aabff" />  // cool fill
```

Shadow bias `-0.0004` is the sweet spot — too close to 0 and you get shadow acne, too negative and shadows detach ("peter panning"). Don't tune this without a specific reason.

Shadow camera frustum `-300..300` covers a 600m build. If a build is larger, widen it. Wider frustum = lower shadow resolution per unit.

---

## 🧰 UPGRADE IDEAS (NOT YET APPLIED)

- **HDR environment map** via `<Environment preset="sunset"/>` — requires network access to Poly Haven CDN, avoid unless the user says it's OK.
- **Bloom** via `@react-three/postprocessing` — not currently installed, adds ~100KB.
- **Reflective ground** via `<MeshReflectorMaterial/>` (already in drei) — looks nice but doubles draw calls.
- **SSAO** via postprocessing — expensive on 1200 boxes.

Add these only when the user explicitly asks. Default rule: fewer deps is better.

---

## 🧪 DEBUGGING CHECKLIST

**Background is white:** Sky `distance` > camera.far, or Sky component removed entirely.
**Everything looks flat / grey:** hemisphereLight intensity too high, or `toneMapping` not set.
**Panels all dark:** directionalLight behind the camera, or shadow-bias wrong.
**Preview won't update on file change:** Vite HMR should catch it. If not, hard-reload the browser tab — some Canvas props don't hot-reload.
**"Cannot destructure property 'target' of 'controls'":** OrbitControls not mounted yet. Check `makeDefault` is set.
