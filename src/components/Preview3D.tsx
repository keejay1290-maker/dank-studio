// ─────────────────────────────────────────────────────────────────────────────
// DANK STUDIO — 3D Preview  (game-engine quality renderer)
//
// Rotation fix: DayZ yaw is CW from North. Three.js Y-rotation is CCW.
// To align them: rotation.y = +yawRad (not negative).
// Proof: Y-rotation matrix maps +Z → (sin θ, 0, cos θ). At θ=π/2 → +X (East).
// DayZ yaw=90° = facing East ✓.
//
// Renderer upgrades:
//   • ACESFilmic tone mapping + sRGB output
//   • Procedural Sky (sun, atmosphere, horizon)
//   • HemisphereLight for warm/cool ambient fill
//   • Two directional lights (key + fill)
//   • ContactShadows for soft ground shadows
//   • Per-material roughness/metalness by object type (PBR-lite)
//   • Fog tuned to sky haze (not dark)
// ─────────────────────────────────────────────────────────────────────────────
import { useRef, useEffect, useMemo, forwardRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Sky, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import type { Point3D } from "../lib/types";
import { getMimic } from "../lib/mimic";

const MIN_DISTANCE = 15;
const MAX_DISTANCE = 4000;

// ── Material properties by object class ──────────────────────────────────────
function getMaterialProps(classname: string): { roughness: number; metalness: number } {
  const k = (classname ?? "").toLowerCase();
  if (k.includes("container") || k.includes("tank"))
    return { roughness: 0.38, metalness: 0.62 };
  if (k.includes("barrel"))
    return { roughness: 0.28, metalness: 0.72 };
  if (k.includes("indcnc") || k.includes("cncsmall") || k.includes("_cnc"))
    return { roughness: 0.90, metalness: 0.02 };
  if (k.includes("stone") || k.includes("castle"))
    return { roughness: 0.97, metalness: 0.0 };
  if (k.includes("mil"))
    return { roughness: 0.72, metalness: 0.18 };
  if (k.includes("bridge") || k.includes("pier") || k.includes("timber"))
    return { roughness: 0.92, metalness: 0.0 };
  if (k.includes("bunker"))
    return { roughness: 0.85, metalness: 0.04 };
  if (k.includes("platform"))
    return { roughness: 0.88, metalness: 0.06 };
  return { roughness: 0.82, metalness: 0.05 };
}

// ── Auto-frame camera on build extent ────────────────────────────────────────
function AutoFrame({ points }: { points: Point3D[] }) {
  const { camera, controls } = useThree() as { camera: THREE.PerspectiveCamera; controls: any };
  const prevLen = useRef(0);

  useEffect(() => {
    if (points.length === 0 || points.length === prevLen.current) return;
    prevLen.current = points.length;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (const p of points) {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
      minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
    }

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const cz = (minZ + maxZ) / 2;
    const size = Math.max(maxX - minX, maxY - minY, maxZ - minZ, 20);
    const dist = size * 1.5;

    camera.position.set(cx + dist * 0.65, cy + dist * 0.5, cz + dist * 0.65);
    camera.lookAt(cx, cy, cz);
    camera.fov = 55;
    camera.updateProjectionMatrix();

    if (controls?.target) {
      controls.target.set(cx, cy, cz);
      controls.update();
    }
  }, [points, camera, controls]);

  return null;
}

// ── Single DayZ object rendered as a box ─────────────────────────────────────
function BuildObject({ pt }: { pt: Point3D }) {
  const mimic   = getMimic(pt.name ?? "");
  const matProps = useMemo(() => getMaterialProps(pt.name ?? ""), [pt.name]);

  const euler = useMemo(() => {
    // DayZ yaw is CW from North. Three.js Y is CCW.
    // Y-rotation matrix: +Z face → (sin θ, 0, cos θ).
    // At θ=+π/2 face points to +X (East). DayZ yaw=90° = East ✓.
    // So use +yawRad (not negated).
    const yawRad   = ((pt.yaw   ?? 0) * Math.PI) / 180;
    const pitchRad = ((pt.pitch ?? 0) * Math.PI) / 180;
    const rollRad  = ((pt.roll  ?? 0) * Math.PI) / 180;
    return new THREE.Euler(pitchRad, yawRad, rollRad, "YXZ");
  }, [pt.yaw, pt.pitch, pt.roll]);

  const s = pt.scale ?? 1;
  const w = mimic.w * s;
  const h = mimic.h * s;
  const d = mimic.d * s;

  return (
    <mesh
      position={[pt.x, pt.y + h / 2, pt.z]}
      rotation={euler}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial
        color={mimic.color}
        roughness={matProps.roughness}
        metalness={matProps.metalness}
        envMapIntensity={0.6}
      />
    </mesh>
  );
}

// ── OrbitControls with ref capture + hard zoom limits ────────────────────────
const ControlsRef = forwardRef<any, object>(function Controls(_, ref) {
  return (
    <OrbitControls
      ref={ref}
      makeDefault
      enableDamping
      dampingFactor={0.07}
      minDistance={MIN_DISTANCE}
      maxDistance={MAX_DISTANCE}
    />
  );
});

// ── Sun position shared between Sky and directionalLight ─────────────────────
// Raw world position (NOT normalised). Drei's <Sky> projects this onto its sphere.
const SUN: [number, number, number] = [150, 200, 100];

function Scene({ points, ctrlRef }: { points: Point3D[]; ctrlRef: React.Ref<any> }) {
  return (
    <>
      <AutoFrame points={points} />
      <ControlsRef ref={ctrlRef} />

      {/* ── Sky / atmosphere ─────────────────────────────────────── */}
      {/* distance must be < camera.far or the sky mesh is clipped → white! */}
      <Sky
        distance={4500}
        sunPosition={SUN}
        turbidity={8}
        rayleigh={2.2}
        mieCoefficient={0.005}
        mieDirectionalG={0.92}
      />

      {/* Fallback blue in case Sky fails to render */}
      <color attach="background" args={["#7faed6"]} />

      {/* Subtle atmospheric haze that matches the sky colour */}
      <fog attach="fog" args={["#aec8e8", 800, 3500]} />

      {/* ── Lighting ──────────────────────────────────────────────── */}
      {/* Warm sky / cool-earth hemisphere fill */}
      <hemisphereLight args={["#c8dff5", "#4a3d28", 0.55]} />

      {/* Key sun — soft shadows */}
      <directionalLight
        position={[150, 200, 100]}
        intensity={2.0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={1200}
        shadow-camera-left={-300}
        shadow-camera-right={300}
        shadow-camera-top={300}
        shadow-camera-bottom={-300}
        shadow-bias={-0.0004}
      />

      {/* Cool fill light from opposite side — simulates sky bounce */}
      <directionalLight
        position={[-100, 80, -120]}
        intensity={0.45}
        color="#7aabff"
      />

      {/* ── Ground ────────────────────────────────────────────────── */}
      {/* Infinite grid — 8m cells matching wall widths */}
      <Grid
        args={[2000, 2000]}
        cellSize={8}
        cellThickness={0.4}
        cellColor="#8aaa7a"
        sectionSize={40}
        sectionThickness={0.8}
        sectionColor="#6a8a5a"
        fadeDistance={800}
        fadeStrength={1.5}
        infiniteGrid
        position={[0, -0.01, 0]}
      />

      {/* Soft contact shadows directly under the build */}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.45}
        scale={600}
        blur={2.5}
        far={60}
        color="#1a1a0a"
      />

      {/* ── Build objects ─────────────────────────────────────────── */}
      {points.map((pt, i) => (
        <BuildObject key={i} pt={pt} />
      ))}
    </>
  );
}

// ── Public component ──────────────────────────────────────────────────────────
interface Props {
  points: Point3D[];
}

export function Preview3D({ points }: Props) {
  const ctrlRef = useRef<any>(null);

  function zoom(inward: boolean) {
    const ctrl = ctrlRef.current;
    if (!ctrl) return;
    const cam    = ctrl.object as THREE.Camera;
    const target = ctrl.target as THREE.Vector3;
    const dir    = new THREE.Vector3().subVectors(cam.position, target);
    const dist   = Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, dir.length() * (inward ? 0.75 : 1.33)));
    dir.normalize().multiplyScalar(dist);
    cam.position.copy(target).add(dir);
    ctrl.update();
  }

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ fov: 55, near: 0.5, far: 6000, position: [180, 130, 180] }}
        shadows="soft"
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <Scene points={points} ctrlRef={ctrlRef} />
      </Canvas>

      {/* Zoom overlay */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button
          onClick={() => zoom(true)}
          className="w-9 h-9 bg-black/50 hover:bg-black/70 border border-white/20 text-white text-xl font-bold rounded flex items-center justify-center select-none backdrop-blur-sm"
        >+</button>
        <button
          onClick={() => zoom(false)}
          className="w-9 h-9 bg-black/50 hover:bg-black/70 border border-white/20 text-white text-xl font-bold rounded flex items-center justify-center select-none backdrop-blur-sm"
        >−</button>
      </div>

      {/* Stats */}
      {points.length > 0 && (
        <div className="absolute top-2 right-2 text-xs text-white/60 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
          {points.length.toLocaleString()} objects
        </div>
      )}

      {points.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-zinc-500 text-sm">Select a build to preview</p>
        </div>
      )}
    </div>
  );
}
