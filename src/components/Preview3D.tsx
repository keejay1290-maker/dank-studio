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
import { useRef, useEffect, useMemo, forwardRef, memo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import type { Point3D } from "../lib/types";
import { getMimic } from "../lib/mimic";

const MIN_DISTANCE = 15;
const MAX_DISTANCE = 4000;

// ── Material properties by object class (cached) ─────────────────────────────
const _matCache = new Map<string, { roughness: number; metalness: number }>();

function getMaterialProps(classname: string): { roughness: number; metalness: number } {
  const key = classname ?? "";
  const hit = _matCache.get(key);
  if (hit) return hit;

  const k = key.toLowerCase();
  let result: { roughness: number; metalness: number };
  if (k.includes("container") || k.includes("tank"))
    result = { roughness: 0.38, metalness: 0.62 };
  else if (k.includes("barrel"))
    result = { roughness: 0.28, metalness: 0.72 };
  else if (k.includes("indcnc") || k.includes("cncsmall") || k.includes("_cnc"))
    result = { roughness: 0.90, metalness: 0.02 };
  else if (k.includes("stone") || k.includes("castle"))
    result = { roughness: 0.97, metalness: 0.0 };
  else if (k.includes("mil"))
    result = { roughness: 0.72, metalness: 0.18 };
  else if (k.includes("bridge") || k.includes("pier") || k.includes("timber"))
    result = { roughness: 0.92, metalness: 0.0 };
  else if (k.includes("bunker"))
    result = { roughness: 0.85, metalness: 0.04 };
  else if (k.includes("platform"))
    result = { roughness: 0.88, metalness: 0.06 };
  else
    result = { roughness: 0.82, metalness: 0.05 };

  _matCache.set(key, result);
  return result;
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
const BuildObject = memo(function BuildObject({ pt }: { pt: Point3D }) {
  const mimic   = getMimic(pt.name ?? "");
  const matProps = getMaterialProps(pt.name ?? "");

  const euler = useMemo(() => {
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
});

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

// ── Pre-built geometry — avoids re-creating on every render ──────────────────
const RUNWAY_GEO    = new THREE.PlaneGeometry(960, 46);
const TAXIWAY_GEO   = new THREE.PlaneGeometry(960, 18);
const APRON_GEO     = new THREE.PlaneGeometry(340, 200);
const GRASS_GEO     = new THREE.PlaneGeometry(8000, 8000);
const LINE_H_GEO    = new THREE.PlaneGeometry(960, 0.5);
const DASH_RW_GEO   = new THREE.PlaneGeometry(24, 0.6);
const DASH_TW_GEO   = new THREE.PlaneGeometry(20, 0.4);
const THRESH_GEO    = new THREE.PlaneGeometry(2, 14);
const CONNECTOR_GEO = new THREE.PlaneGeometry(18, 130);

const MAT_GRASS    = new THREE.MeshStandardMaterial({ color: "#4e6b28", roughness: 1.0, metalness: 0 });
const MAT_RUNWAY   = new THREE.MeshStandardMaterial({ color: "#525250", roughness: 0.98, metalness: 0 });
const MAT_TAXIWAY  = new THREE.MeshStandardMaterial({ color: "#5c5c5a", roughness: 0.97, metalness: 0 });
const MAT_APRON    = new THREE.MeshStandardMaterial({ color: "#747472", roughness: 0.95, metalness: 0 });
const MAT_WHITE    = new THREE.MeshStandardMaterial({ color: "#d8d8d5", roughness: 0.85, metalness: 0 });
const MAT_YELLOW   = new THREE.MeshStandardMaterial({ color: "#c8a018", roughness: 0.85, metalness: 0 });
const MAT_HANGAR   = new THREE.MeshStandardMaterial({ color: "#68645e", roughness: 0.95, metalness: 0 });
const MAT_TOWER    = new THREE.MeshStandardMaterial({ color: "#78746c", roughness: 0.93, metalness: 0 });
const MAT_TOWER_TOP= new THREE.MeshStandardMaterial({ color: "#686460", roughness: 0.92, metalness: 0 });
const MAT_TREES    = new THREE.MeshStandardMaterial({ color: "#354e1a", roughness: 1.0,  metalness: 0 });

// Rotation shared by all ground planes
const GROUND_ROT = new THREE.Euler(-Math.PI / 2, 0, 0);

// Hangar geometry — re-used for all 3 hangars
const HANGAR_BODY_GEO = new THREE.BoxGeometry(56, 14, 38);
const HANGAR_RIDGE_GEO = new THREE.BoxGeometry(56, 3, 6);

// Control tower geometry
const TOWER_SHAFT_GEO = new THREE.BoxGeometry(11, 34, 11);
const TOWER_OBS_GEO   = new THREE.BoxGeometry(15, 5, 13);
const TOWER_MAST_GEO  = new THREE.BoxGeometry(0.8, 8, 0.8);

// Tree geometry — precomputed with deterministic heights (never change at runtime)
// North treeline: 22 trees, heights = 7 + ((i*7919)%9)
const NORTH_TREES: { x: number; h: number }[] = Array.from({ length: 22 }, (_, i) => ({
  x: -520 + i * 50,
  h: 7 + ((i * 7919) % 9),
}));
// West treeline: 14 trees, heights = 6 + ((i*4001)%10)
const WEST_TREES: { z: number; h: number }[] = Array.from({ length: 14 }, (_, i) => ({
  z: -480 + i * 40,
  h: 6 + ((i * 4001) % 10),
}));
// Individual geometries per unique height (avoids per-frame allocation)
const _treeGeoCache = new Map<number, THREE.BoxGeometry>();
function getTreeGeo(h: number): THREE.BoxGeometry {
  let geo = _treeGeoCache.get(h);
  if (!geo) { geo = new THREE.BoxGeometry(7, h, 7); _treeGeoCache.set(h, geo); }
  return geo;
}

function Scene({ points, ctrlRef }: { points: Point3D[]; ctrlRef: React.Ref<any> }) {
  return (
    <>
      <AutoFrame points={points} />
      <ControlsRef ref={ctrlRef} />

      {/* ── Sky — DayZ NWAF overcast blue ───────────────────────────── */}
      <color attach="background" args={["#829db8"]} />

      {/* ── Subtle distance haze matching NWAF atmosphere ───────────── */}
      <fog attach="fog" args={["#9bb0c8", 600, 2800]} />

      {/* ── Lighting — DayZ late-morning sun from SE ─────────────────── */}
      <hemisphereLight args={["#b0c8e0", "#3a5820", 0.9]} />
      <directionalLight
        position={[350, 450, 150]}
        intensity={1.6}
        color="#f0e8d8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={1200}
        shadow-camera-left={-500}
        shadow-camera-right={500}
        shadow-camera-top={500}
        shadow-camera-bottom={-500}
        shadow-bias={-0.0005}
      />

      {/* ── Grass — NWAF green ──────────────────────────────────────── */}
      <mesh geometry={GRASS_GEO} material={MAT_GRASS} rotation={GROUND_ROT} position={[0, -0.02, 0]} receiveShadow />

      {/* ── Main apron — where build objects spawn ───────────────────── */}
      <mesh geometry={APRON_GEO} material={MAT_APRON} rotation={GROUND_ROT} position={[0, 0.01, 0]} receiveShadow />

      {/* Apron yellow edge marking (front) */}
      <mesh geometry={LINE_H_GEO} material={MAT_YELLOW} rotation={GROUND_ROT} position={[0, 0.03, 100]} />
      <mesh geometry={LINE_H_GEO} material={MAT_YELLOW} rotation={GROUND_ROT} position={[0, 0.03, -100]} />

      {/* ── Grid on central 120×120 build zone only ─────────────────── */}
      <Grid
        args={[120, 120]}
        cellSize={8}
        cellThickness={0.5}
        cellColor="#555555"
        sectionSize={40}
        sectionThickness={1.0}
        sectionColor="#888888"
        fadeDistance={280}
        fadeStrength={1.2}
        position={[0, 0.02, 0]}
      />

      {/* ── Connector taxiways (apron → taxiway) ─────────────────────── */}
      <mesh geometry={CONNECTOR_GEO} material={MAT_TAXIWAY} rotation={GROUND_ROT} position={[-170, 0.01, -165]} />
      <mesh geometry={CONNECTOR_GEO} material={MAT_TAXIWAY} rotation={GROUND_ROT} position={[ 170, 0.01, -165]} />

      {/* ── Parallel taxiway ─────────────────────────────────────────── */}
      <mesh geometry={TAXIWAY_GEO} material={MAT_TAXIWAY} rotation={GROUND_ROT} position={[0, 0.01, -230]} receiveShadow />
      {/* Taxiway yellow centreline dashes */}
      {Array.from({ length: 26 }, (_, i) => i - 13).map(i => (
        <mesh key={i} geometry={DASH_TW_GEO} material={MAT_YELLOW} rotation={GROUND_ROT} position={[i * 36, 0.03, -230]} />
      ))}

      {/* ── Main runway ──────────────────────────────────────────────── */}
      <mesh geometry={RUNWAY_GEO} material={MAT_RUNWAY} rotation={GROUND_ROT} position={[0, 0.01, -370]} receiveShadow />

      {/* Runway edge lines */}
      <mesh geometry={LINE_H_GEO} material={MAT_WHITE} rotation={GROUND_ROT} position={[0, 0.03, -370 - 22]} />
      <mesh geometry={LINE_H_GEO} material={MAT_WHITE} rotation={GROUND_ROT} position={[0, 0.03, -370 + 22]} />

      {/* Runway centreline dashes */}
      {Array.from({ length: 20 }, (_, i) => i - 10).map(i => (
        <mesh key={i} geometry={DASH_RW_GEO} material={MAT_WHITE} rotation={GROUND_ROT} position={[i * 46, 0.03, -370]} />
      ))}

      {/* Threshold bars — east end */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} geometry={THRESH_GEO} material={MAT_WHITE} rotation={GROUND_ROT} position={[-13 + i * 5.5, 0.03, -370 + 460]} />
      ))}
      {/* Threshold bars — west end */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} geometry={THRESH_GEO} material={MAT_WHITE} rotation={GROUND_ROT} position={[-13 + i * 5.5, 0.03, -370 - 460]} />
      ))}

      {/* ── Hangars (3) — Soviet-era NWAF style ──────────────────────── */}
      {([-120, 10, 140] as const).map((x, i) => (
        <group key={i} position={[x, 0, -145]}>
          <mesh geometry={HANGAR_BODY_GEO}  material={MAT_HANGAR} position={[0, 7, 0]} castShadow receiveShadow />
          <mesh geometry={HANGAR_RIDGE_GEO} material={MAT_TOWER}  position={[0, 15.5, 0]} />
        </group>
      ))}

      {/* ── Control tower — tall Soviet concrete block ───────────────── */}
      <group position={[-230, 0, -110]}>
        <mesh geometry={TOWER_SHAFT_GEO} material={MAT_TOWER}     castShadow receiveShadow position={[0, 17, 0]} />
        <mesh geometry={TOWER_OBS_GEO}   material={MAT_TOWER_TOP} castShadow              position={[0, 36, 0]} />
        <mesh geometry={TOWER_MAST_GEO}  material={MAT_TOWER}                             position={[0, 42, 0]} />
      </group>

      {/* ── Tree line — E-W along north edge ────────────────────────── */}
      {NORTH_TREES.map((t, i) => (
        <mesh key={i} geometry={getTreeGeo(t.h)} material={MAT_TREES} position={[t.x, t.h / 2, -510]} castShadow />
      ))}
      {/* Tree line — west side ──────────────────────────────────────── */}
      {WEST_TREES.map((t, i) => (
        <mesh key={i} geometry={getTreeGeo(t.h)} material={MAT_TREES} position={[-510, t.h / 2, t.z]} castShadow />
      ))}

      {/* ── Soft ground shadows on apron ─────────────────────────────── */}
      <ContactShadows
        position={[0, 0.03, 0]}
        opacity={0.45}
        scale={350}
        blur={3.0}
        far={80}
        color="#000000"
      />

      {/* ── Build objects ─────────────────────────────────────────────── */}
      {points.map((pt, i) => (
        <BuildObject key={`${pt.name}_${pt.x}_${pt.y}_${pt.z}_${i}`} pt={pt} />
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
