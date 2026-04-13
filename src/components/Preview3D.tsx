// ─────────────────────────────────────────────────────────────────────────────
// DANK STUDIO — 3D Preview
// React-Three-Fiber canvas. Every object = Box (no dots).
// Zoom +/- buttons, GridHelper floor, FogExp2, 60° FOV.
// ─────────────────────────────────────────────────────────────────────────────
import { useRef, useEffect, useMemo, forwardRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";
import type { Point3D } from "../lib/types";
import { getMimic } from "../lib/mimic";

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
    const dist = size * 1.0;

    camera.position.set(cx + dist * 0.7, cy + dist * 0.5, cz + dist * 0.7);
    camera.lookAt(cx, cy, cz);
    camera.fov = 60;
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
  const mimic = getMimic(pt.name ?? "");

  const euler = useMemo(() => {
    // DayZ: Y up, Yaw rotates around Y (clockwise from North = +Z)
    // Three.js Y-up: rotation.y is CCW, so negate yaw
    const yawRad   = ((pt.yaw   ?? 0) * Math.PI) / 180;
    const pitchRad = ((pt.pitch ?? 0) * Math.PI) / 180;
    const rollRad  = ((pt.roll  ?? 0) * Math.PI) / 180;
    return new THREE.Euler(pitchRad, -yawRad, rollRad, "YXZ");
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
      <meshStandardMaterial color={mimic.color} />
    </mesh>
  );
}

// ── Inner scene ───────────────────────────────────────────────────────────────
const ControlsRef = forwardRef<any, object>(function Controls(_, ref) {
  return <OrbitControls ref={ref} makeDefault enableDamping dampingFactor={0.08} />;
});

function Scene({ points, ctrlRef }: { points: Point3D[]; ctrlRef: React.Ref<any> }) {
  return (
    <>
      <AutoFrame points={points} />
      <ControlsRef ref={ctrlRef} />

      {/* Lighting */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[150, 250, 100]} intensity={1.1} castShadow />

      {/* Ground grid — infinite, 8m cells matching wall widths */}
      <Grid
        args={[2000, 2000]}
        cellSize={8}
        cellThickness={0.3}
        cellColor="#222226"
        sectionSize={40}
        sectionThickness={0.7}
        sectionColor="#2e2e36"
        fadeDistance={500}
        fadeStrength={1.2}
        infiniteGrid
        position={[0, -0.01, 0]}
      />

      {/* Atmosphere */}
      <fogExp2 attach="fog" args={["#0d0d10", 0.0018]} />
      <color attach="background" args={["#0d0d10"]} />

      {/* Build objects */}
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
    const dir = new THREE.Vector3();
    ctrl.object.getWorldDirection(dir);
    ctrl.object.position.addScaledVector(dir, inward ? 20 : -20);
    ctrl.update();
  }

  return (
    <div className="relative w-full h-full bg-[#0d0d10]">
      <Canvas
        camera={{ fov: 60, near: 0.5, far: 5000, position: [80, 60, 80] }}
        shadows
        gl={{ antialias: true }}
      >
        <Scene points={points} ctrlRef={ctrlRef} />
      </Canvas>

      {/* Zoom overlay */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button
          onClick={() => zoom(true)}
          className="w-8 h-8 bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-600 text-zinc-200 text-lg font-bold rounded flex items-center justify-center select-none"
        >+</button>
        <button
          onClick={() => zoom(false)}
          className="w-8 h-8 bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-600 text-zinc-200 text-lg font-bold rounded flex items-center justify-center select-none"
        >−</button>
      </div>

      {/* Stats */}
      {points.length > 0 && (
        <div className="absolute top-2 right-2 text-xs text-zinc-500 bg-zinc-900/70 px-2 py-0.5 rounded">
          {points.length.toLocaleString()} objects
        </div>
      )}

      {points.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-zinc-600 text-sm">Select a build to preview</p>
        </div>
      )}
    </div>
  );
}
