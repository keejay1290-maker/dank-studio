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
//   • Environment IBL (Image-Based Lighting) via @react-three/drei
//   • Procedural PBR textures — concrete/stone/metal/rust per class
//   • GLTF model loading — loads public/models/{classname}.glb when available
//   • Box fallback with textured PBR material when no GLTF present
//   • HemisphereLight + directional key/fill lighting
//   • ContactShadows for soft ground shadows
//   • Per-material roughness/metalness by object type
//   • Fog tuned to sky haze
// ─────────────────────────────────────────────────────────────────────────────
import { useRef, useEffect, useMemo, Suspense, forwardRef, memo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, ContactShadows, Environment, useGLTF, useTexture, Sky } from "@react-three/drei";
import * as THREE from "three";
import type { Point3D } from "../lib/types";
import { getMimic } from "../lib/mimic";

const MIN_DISTANCE = 15;
const MAX_DISTANCE = 4000;

// ── Which classnames have pre-built GLTF models in public/models/ ─────────────
// Populated at runtime the first time a classname is requested. We try loading
// the model; if it 404s the loader throws and we fall back to a textured box.
const _gltfAvailable = new Map<string, boolean>();

// ── Procedural PBR textures (canvas-generated, cached globally) ──────────────
const _texCache = new Map<string, THREE.Texture>();

type TexType = "concrete" | "stone" | "metal" | "rust" | "dirt_concrete" | "grass" | "asphalt";

function buildTexture(type: TexType): THREE.Texture {
  const SIZE = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;

  if (type === "concrete") {
    // Base — mid grey
    ctx.fillStyle = "#828280";
    ctx.fillRect(0, 0, SIZE, SIZE);
    // Grain noise
    for (let i = 0; i < 28000; i++) {
      const x = Math.random() * SIZE, y = Math.random() * SIZE;
      const v = Math.floor(Math.random() * 28 - 14);
      const c = 130 + v;
      ctx.fillStyle = `rgb(${c},${c},${c - 2})`;
      ctx.fillRect(x, y, 2, 2);
    }
    // Horizontal cast-lines (formwork shadow at every ~92px ≈ 1m @ 1/5.5 scale)
    ctx.strokeStyle = "rgba(40,40,38,0.35)";
    ctx.lineWidth = 1.5;
    for (let y = 92; y < SIZE; y += 92) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SIZE, y); ctx.stroke();
    }
    // Occasional vertical crack
    ctx.strokeStyle = "rgba(55,55,52,0.18)";
    ctx.lineWidth = 1;
    for (let x = 160; x < SIZE; x += 210) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 8, SIZE); ctx.stroke();
    }
  } else if (type === "stone") {
    // Warm grey base
    ctx.fillStyle = "#7a7570";
    ctx.fillRect(0, 0, SIZE, SIZE);
    for (let i = 0; i < 22000; i++) {
      const x = Math.random() * SIZE, y = Math.random() * SIZE;
      const v = Math.floor(Math.random() * 35 - 17);
      const r = 122 + v, g = 117 + v, b = 112 + v;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, 3, 3);
    }
    // Large irregular stone blocks
    ctx.strokeStyle = "rgba(50,46,42,0.40)";
    ctx.lineWidth = 2;
    const blockH = [0, 110, 230, 370, 510];
    for (const y of blockH) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SIZE, y); ctx.stroke();
      // Offset vertical joints per row
      const off = (y / 110) % 2 === 0 ? 0 : 90;
      for (let x = off; x < SIZE; x += 180) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 110); ctx.stroke();
      }
    }
  } else if (type === "metal") {
    // Dark steel
    ctx.fillStyle = "#565656";
    ctx.fillRect(0, 0, SIZE, SIZE);
    for (let i = 0; i < 18000; i++) {
      const x = Math.random() * SIZE, y = Math.random() * SIZE;
      const v = Math.floor(Math.random() * 20 - 10);
      const c = 86 + v;
      ctx.fillStyle = `rgb(${c},${c + 1},${c + 2})`;
      ctx.fillRect(x, y, 2, 2);
    }
    // Horizontal brushed lines
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let y = 3; y < SIZE; y += 5) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SIZE, y); ctx.stroke();
    }
    // Weld/rivet rows
    ctx.fillStyle = "rgba(30,30,28,0.45)";
    for (let y = 128; y < SIZE; y += 128) {
      for (let x = 32; x < SIZE; x += 64) {
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
  } else if (type === "rust") {
    // Corroded container steel
    ctx.fillStyle = "#6a4a38";
    ctx.fillRect(0, 0, SIZE, SIZE);
    for (let i = 0; i < 24000; i++) {
      const x = Math.random() * SIZE, y = Math.random() * SIZE;
      const v = Math.floor(Math.random() * 40 - 20);
      const r = 106 + v, g = 74 + v * 0.5, b = 56 + v * 0.3;
      ctx.fillStyle = `rgb(${Math.max(0,Math.min(255,r))},${Math.max(0,Math.min(255,g))},${Math.max(0,Math.min(255,b))})`;
      ctx.fillRect(x, y, 3, 3);
    }
    // Corrugation ribs (shipping container style)
    ctx.strokeStyle = "rgba(30,20,15,0.45)";
    ctx.lineWidth = 3;
    for (let x = 52; x < SIZE; x += 52) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, SIZE); ctx.stroke();
    }
  } else if (type === "dirt_concrete") {
    // dirt_concrete — weathered outdoor slab
    ctx.fillStyle = "#737068";
    ctx.fillRect(0, 0, SIZE, SIZE);
    for (let i = 0; i < 25000; i++) {
      const x = Math.random() * SIZE, y = Math.random() * SIZE;
      const v = Math.floor(Math.random() * 32 - 16);
      const c = 115 + v;
      ctx.fillStyle = `rgb(${c},${c - 2},${c - 5})`;
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.strokeStyle = "rgba(40,38,33,0.28)";
    ctx.lineWidth = 1;
    for (let y = 80; y < SIZE; y += 80) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SIZE, y); ctx.stroke();
    }
    for (let x = 80; x < SIZE; x += 80) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, SIZE); ctx.stroke();
    }
  } else if (type === "grass") {
    // Forest/field grass — lush green with variation and dirt patches
    ctx.fillStyle = "#3d6b22";
    ctx.fillRect(0, 0, SIZE, SIZE);
    // Dense grass blade noise
    for (let i = 0; i < 30000; i++) {
      const x = Math.random() * SIZE, y = Math.random() * SIZE;
      const v = Math.floor(Math.random() * 40 - 20);
      const r = 55 + v, g = 95 + v + Math.floor(Math.random() * 15), b = 28 + Math.floor(v * 0.3);
      ctx.fillStyle = `rgb(${Math.max(0,Math.min(255,r))},${Math.max(0,Math.min(255,g))},${Math.max(0,Math.min(255,b))})`;
      ctx.fillRect(x, y, 3 + Math.random() * 2, 3 + Math.random() * 2);
    }
    // Darker clumps
    for (let i = 0; i < 200; i++) {
      const cx = Math.random() * SIZE, cy = Math.random() * SIZE;
      ctx.fillStyle = `rgba(30,55,15,${0.15 + Math.random() * 0.2})`;
      ctx.beginPath(); ctx.arc(cx, cy, 8 + Math.random() * 16, 0, Math.PI * 2); ctx.fill();
    }
    // Dirt specks
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * SIZE, y = Math.random() * SIZE;
      ctx.fillStyle = `rgba(90,75,55,${0.15 + Math.random() * 0.15})`;
      ctx.fillRect(x, y, 1, 1);
    }
  } else if (type === "asphalt") {
    // Weathered runway asphalt — dark grey with aggregate and cracks
    ctx.fillStyle = "#3a3a38";
    ctx.fillRect(0, 0, SIZE, SIZE);
    // Aggregate speckling
    for (let i = 0; i < 35000; i++) {
      const x = Math.random() * SIZE, y = Math.random() * SIZE;
      const v = Math.floor(Math.random() * 24 - 12);
      const c = 58 + v;
      ctx.fillStyle = `rgb(${c},${c},${c - 1})`;
      ctx.fillRect(x, y, 1 + Math.random(), 1 + Math.random());
    }
    // Oil stains
    for (let i = 0; i < 40; i++) {
      const cx = Math.random() * SIZE, cy = Math.random() * SIZE;
      ctx.fillStyle = `rgba(25,25,22,${0.1 + Math.random() * 0.15})`;
      ctx.beginPath(); ctx.arc(cx, cy, 6 + Math.random() * 14, 0, Math.PI * 2); ctx.fill();
    }
    // Hairline cracks
    ctx.strokeStyle = "rgba(20,20,18,0.22)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      let x = Math.random() * SIZE, y = Math.random() * SIZE;
      ctx.moveTo(x, y);
      for (let s = 0; s < 6; s++) {
        x += Math.random() * 80 - 40; y += Math.random() * 80 - 40;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function getTex(type: TexType): THREE.Texture {
  const hit = _texCache.get(type);
  if (hit) return hit;
  const tex = buildTexture(type);
  _texCache.set(type, tex);
  return tex;
}

// ── Real DayZ texture URLs (extracted from PAA via ImageToPAA.exe) ────────────
// Relative paths work in both Vite dev (served from root) and Electron (file://)
const DZ_TEXTURE_URLS: Record<TexType, string> = {
  concrete:      "./textures/indcnc_co.png",
  stone:         "./textures/stone_co.png",
  metal:         "./textures/metal_co.png",
  rust:          "./textures/rust_co.png",
  dirt_concrete: "./textures/milcnc_co.png",
  grass:         "./textures/indcnc_co.png",   // fallback — env uses canvas tex
  asphalt:       "./textures/milcnc_co.png",   // fallback — env uses canvas tex
};

// ── Material properties + texture type by object class ───────────────────────
const _matCache = new Map<
  string,
  { roughness: number; metalness: number; texType: TexType; repeat: [number, number] }
>();

function getMaterialProps(classname: string) {
  const key = classname ?? "";
  const hit = _matCache.get(key);
  if (hit) return hit;

  const k = key.toLowerCase();
  let result: { roughness: number; metalness: number; texType: TexType; repeat: [number, number] };

  if (k.includes("container") || k.includes("tank"))
    result = { roughness: 0.45, metalness: 0.58, texType: "rust", repeat: [2, 1] };
  else if (k.includes("barrel"))
    result = { roughness: 0.30, metalness: 0.72, texType: "metal", repeat: [1, 1] };
  else if (k.includes("pipe"))
    result = { roughness: 0.38, metalness: 0.64, texType: "metal", repeat: [4, 1] };
  else if (k.includes("smokestack") || k.includes("chimney"))
    result = { roughness: 0.82, metalness: 0.08, texType: "dirt_concrete", repeat: [2, 4] };
  else if (k.includes("indcnc") || k.includes("cncsmall") || k.includes("_cnc") || k.includes("milcnc"))
    result = { roughness: 0.88, metalness: 0.03, texType: "concrete", repeat: [2, 1] };
  else if (k.includes("stone") || k.includes("castle"))
    result = { roughness: 0.96, metalness: 0.0, texType: "stone", repeat: [1, 1] };
  else if (k.includes("mil") || k.includes("bunker") || k.includes("barracks"))
    result = { roughness: 0.76, metalness: 0.12, texType: "dirt_concrete", repeat: [2, 1] };
  else if (k.includes("hbarrier") || k.includes("roadblock"))
    result = { roughness: 0.90, metalness: 0.02, texType: "concrete", repeat: [1, 1] };
  else
    result = { roughness: 0.84, metalness: 0.04, texType: "concrete", repeat: [2, 1] };

  _matCache.set(key, result);
  return result;
}

// ── GLTF model loader — loads public/models/{classname}.glb, throws on 404 ───
function GltfModel({
  classname, h, euler, s, matProps,
}: {
  classname: string; h: number;
  euler: THREE.Euler; s: number;
  matProps: ReturnType<typeof getMaterialProps>;
}) {
  const { scene } = useGLTF(`./models/${classname}.glb`);
  const dzTex = useTexture(DZ_TEXTURE_URLS[matProps.texType]);

  const tiledTex = useMemo(() => {
    const t = dzTex.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...matProps.repeat);
    t.needsUpdate = true;
    return t;
  }, [dzTex, matProps.repeat[0], matProps.repeat[1]]);

  const cloned = useMemo(() => {
    const obj = scene.clone(true);
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = new THREE.MeshStandardMaterial({
          map: tiledTex,
          roughness: matProps.roughness,
          metalness: matProps.metalness,
          envMapIntensity: 1.2,
        });
        mesh.material = mat;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return obj;
  }, [scene, tiledTex, matProps.roughness, matProps.metalness]);

  return (
    <primitive
      object={cloned}
      position={[0, h / 2, 0]}
      rotation={euler}
      scale={[s, s, s]}
      castShadow
      receiveShadow
    />
  );
}

// ── Textured box fallback (used when no GLTF available) ──────────────────────
const _boxMatCache = new Map<string, THREE.MeshStandardMaterial>();

function TexturedBox({
  w, h, d, color, euler, matProps,
}: {
  w: number; h: number; d: number;
  color: string; euler: THREE.Euler;
  matProps: ReturnType<typeof getMaterialProps>;
}) {
  const mat = useMemo(() => {
    const matKey = `${matProps.texType}_${matProps.repeat[0]}_${matProps.repeat[1]}_${color}_${matProps.roughness}_${matProps.metalness}`;
    let m = _boxMatCache.get(matKey);
    if (!m) {
      const t = getTex(matProps.texType).clone();
      t.repeat.set(...matProps.repeat);
      t.needsUpdate = true;
      m = new THREE.MeshStandardMaterial({
        color,
        map: t,
        roughness: matProps.roughness,
        metalness: matProps.metalness,
        envMapIntensity: 0.85,
      });
      _boxMatCache.set(matKey, m);
    }
    return m;
  }, [matProps.texType, matProps.repeat[0], matProps.repeat[1], color, matProps.roughness, matProps.metalness]);

  return (
    <mesh position={[0, h / 2, 0]} rotation={euler} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

// ── Real DayZ textured box — uses useTexture (Suspense required by caller) ────
function DayZTexturedBox({
  w, h, d, euler, matProps,
}: {
  w: number; h: number; d: number;
  euler: THREE.Euler;
  matProps: ReturnType<typeof getMaterialProps>;
}) {
  const url = DZ_TEXTURE_URLS[matProps.texType];
  const tex = useTexture(url);
  const tiledTex = useMemo(() => {
    const t = tex.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...matProps.repeat);
    t.needsUpdate = true;
    return t;
  }, [tex, matProps.repeat[0], matProps.repeat[1]]);

  return (
    <mesh position={[0, h / 2, 0]} rotation={euler} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial
        map={tiledTex}
        roughness={matProps.roughness}
        metalness={matProps.metalness}
        envMapIntensity={0.9}
      />
    </mesh>
  );
}

// ── Single DayZ object: tries GLTF, falls back to textured box ───────────────
const BuildObject = memo(function BuildObject({ pt, highCount }: { pt: Point3D; highCount: boolean }) {
  const mimic    = getMimic(pt.name ?? "");
  const matProps = getMaterialProps(pt.name ?? "");
  const [hasGltf, setHasGltf] = useState<boolean | null>(null);

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
  const classname = pt.name ?? "";
  const doShadow = !highCount;

  // Check availability from cache — skip HEAD fetch in high-count mode to avoid
  // 1000+ network requests that stall the renderer
  useEffect(() => {
    if (highCount) {
      setHasGltf(false);
      return;
    }
    if (_gltfAvailable.has(classname)) {
      setHasGltf(_gltfAvailable.get(classname)!);
    } else {
      // Quick HEAD check to see if the GLB file exists
      fetch(`./models/${classname}.glb`, { method: "HEAD" })
        .then((r) => {
          const ok = r.ok;
          _gltfAvailable.set(classname, ok);
          setHasGltf(ok);
        })
        .catch(() => {
          _gltfAvailable.set(classname, false);
          setHasGltf(false);
        });
    }
  }, [classname, highCount]);

  const fallbackBox = <TexturedBox w={w} h={h} d={d} color={mimic.color} euler={euler} matProps={matProps} />;

  return (
    <group position={[pt.x, pt.y, pt.z]}>
      {hasGltf === true ? (
        <Suspense fallback={fallbackBox}>
          <GltfModel
            classname={classname}
            h={h}
            euler={euler}
            s={s}
            matProps={matProps}
          />
        </Suspense>
      ) : highCount ? (
        /* High-count mode: use lightweight canvas textures only — skip useTexture */
        fallbackBox
      ) : (
        <Suspense fallback={fallbackBox}>
          <DayZTexturedBox w={w} h={h} d={d} euler={euler} matProps={matProps} />
        </Suspense>
      )}
    </group>
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

// ── Pre-built geometry — avoids re-creating on every render ──────────────────
const RUNWAY_GEO    = new THREE.PlaneGeometry(960, 46);
const TAXIWAY_GEO   = new THREE.PlaneGeometry(960, 18);
const APRON_GEO     = new THREE.PlaneGeometry(340, 200);
const GRASS_GEO     = new THREE.PlaneGeometry(8000, 8000, 4, 4);
const LINE_H_GEO    = new THREE.PlaneGeometry(960, 0.5);
const DASH_RW_GEO   = new THREE.PlaneGeometry(24, 0.6);
const DASH_TW_GEO   = new THREE.PlaneGeometry(20, 0.4);
const THRESH_GEO    = new THREE.PlaneGeometry(2, 14);
const CONNECTOR_GEO = new THREE.PlaneGeometry(18, 130);

// ── Lazy textured material factory ────────────────────────────────────────────
function makeEnvMat(
  texType: TexType, repeat: [number, number],
  roughness: number, metalness: number, baseColor?: string,
): THREE.MeshStandardMaterial {
  const tex = getTex(texType).clone();
  tex.repeat.set(...repeat);
  tex.needsUpdate = true;
  const opts: Record<string, unknown> = { map: tex, roughness, metalness, envMapIntensity: 0.5 };
  if (baseColor) opts.color = baseColor;
  return new THREE.MeshStandardMaterial(opts as THREE.MeshStandardMaterialParameters);
}

// Ground & tarmac — procedural PBR textures
const MAT_GRASS    = makeEnvMat("grass",   [40, 40],  1.0,  0);
const MAT_RUNWAY   = makeEnvMat("asphalt", [24, 2],   0.92, 0.02);
const MAT_TAXIWAY  = makeEnvMat("asphalt", [18, 1],   0.90, 0.02);
const MAT_APRON    = makeEnvMat("asphalt", [10, 6],   0.88, 0.03);
// Marking paint
const MAT_WHITE    = new THREE.MeshStandardMaterial({ color: "#e0e0dc", roughness: 0.75, metalness: 0, emissive: "#181816", emissiveIntensity: 0.08 });
const MAT_YELLOW   = new THREE.MeshStandardMaterial({ color: "#d4a820", roughness: 0.70, metalness: 0, emissive: "#3a2a00", emissiveIntensity: 0.10 });
// Structures — PBR textured
const MAT_HANGAR     = makeEnvMat("metal",    [4, 2], 0.65, 0.40);
const MAT_HANGAR_TOP = makeEnvMat("metal",    [4, 1], 0.55, 0.45, "#6a706e");
const MAT_TOWER      = makeEnvMat("concrete", [2, 4], 0.88, 0.05);
const MAT_TOWER_TOP  = makeEnvMat("metal",    [2, 1], 0.50, 0.55, "#556068");
const MAT_TOWER_GLASS = new THREE.MeshStandardMaterial({
  color: "#3a5a6a", roughness: 0.08, metalness: 0.85,
  envMapIntensity: 1.8, transparent: true, opacity: 0.75,
});
// Vegetation
const MAT_TRUNK    = new THREE.MeshStandardMaterial({ color: "#4a3520", roughness: 0.95, metalness: 0 });
const MAT_CANOPY_A = new THREE.MeshStandardMaterial({ color: "#2d5a1a", roughness: 0.95, metalness: 0 });
const MAT_CANOPY_B = new THREE.MeshStandardMaterial({ color: "#1e4a12", roughness: 0.95, metalness: 0 });
const MAT_CANOPY_C = new THREE.MeshStandardMaterial({ color: "#3a6828", roughness: 0.95, metalness: 0 });
const CANOPY_MATS  = [MAT_CANOPY_A, MAT_CANOPY_B, MAT_CANOPY_C];

const GROUND_ROT = new THREE.Euler(-Math.PI / 2, 0, 0);

// ── Hangar & Tower geometry ───────────────────────────────────────────────────
const HANGAR_BODY_GEO   = new THREE.BoxGeometry(56, 14, 38);
const HANGAR_RIDGE_GEO  = new THREE.BoxGeometry(56, 3, 6);
const HANGAR_DOOR_GEO   = new THREE.PlaneGeometry(20, 12);
const TOWER_SHAFT_GEO   = new THREE.BoxGeometry(11, 34, 11);
const TOWER_OBS_GEO     = new THREE.BoxGeometry(15, 5, 13);
const TOWER_GLASS_GEO   = new THREE.BoxGeometry(14.5, 3.5, 12.5);
const TOWER_MAST_GEO    = new THREE.CylinderGeometry(0.3, 0.4, 10, 6);
const TOWER_DISH_GEO    = new THREE.SphereGeometry(1.8, 8, 4, 0, Math.PI);

// ── Trees — cone canopy + cylinder trunk ──────────────────────────────────────
const TRUNK_GEO     = new THREE.CylinderGeometry(0.3, 0.5, 1, 6);
const CANOPY_LO_GEO = new THREE.ConeGeometry(1, 1, 7);
const CANOPY_HI_GEO = new THREE.ConeGeometry(0.7, 0.8, 7);

interface TreeDef { x: number; z: number; h: number; variant: number }

const NORTH_TREES: TreeDef[] = Array.from({ length: 32 }, (_, i) => ({
  x: -620 + i * 40 + ((i * 3571) % 15) - 7,
  z: -510 + ((i * 2903) % 20) - 10,
  h: 8 + ((i * 7919) % 12),
  variant: i % 3,
}));
const WEST_TREES: TreeDef[] = Array.from({ length: 20 }, (_, i) => ({
  x: -510 + ((i * 4517) % 18) - 9,
  z: -500 + i * 34 + ((i * 6131) % 12) - 6,
  h: 7 + ((i * 4001) % 11),
  variant: (i + 1) % 3,
}));
const EAST_TREES: TreeDef[] = Array.from({ length: 18 }, (_, i) => ({
  x: 510 + ((i * 2137) % 16) - 8,
  z: -420 + i * 38 + ((i * 5303) % 14) - 7,
  h: 7 + ((i * 3307) % 10),
  variant: (i + 2) % 3,
}));
const ALL_ENV_TREES = [...NORTH_TREES, ...WEST_TREES, ...EAST_TREES];

function Scene({ points, ctrlRef }: { points: Point3D[]; ctrlRef: React.Ref<any> }) {
  return (
    <>
      <AutoFrame points={points} />
      <ControlsRef ref={ctrlRef} />

      {/* ── Atmospheric sky dome — realistic Rayleigh/Mie scattering ────── */}
      <Sky
        distance={4500}
        sunPosition={[350, 450, 150]}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
        rayleigh={0.5}
        turbidity={8}
      />

      {/* ── Environment IBL — PBR reflections on all materials ─────────── */}
      <Environment preset="city" background={false} />

      {/* ── Distance haze — tuned to match sky horizon ────────────────── */}
      <fog attach="fog" args={["#b8c8d8", 400, 3200]} />

      {/* ── Lighting — DayZ late-morning sun from SE ──────────────────── */}
      <hemisphereLight args={["#c0d4e8", "#4a6830", 0.75]} />
      <directionalLight
        position={[350, 450, 150]}
        intensity={1.5}
        color="#f5ead0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={1200}
        shadow-camera-left={-500}
        shadow-camera-right={500}
        shadow-camera-top={500}
        shadow-camera-bottom={-500}
        shadow-bias={-0.0004}
      />
      {/* Soft fill from opposite side */}
      <directionalLight position={[-200, 180, -300]} intensity={0.4} color="#c0d0e8" />
      {/* Warm bounce from ground */}
      <directionalLight position={[0, -50, 0]} intensity={0.15} color="#8a7a50" />

      {/* ── Grass ─────────────────────────────────────────────────────────── */}
      <mesh geometry={GRASS_GEO} material={MAT_GRASS} rotation={GROUND_ROT} position={[0, -0.02, 0]} receiveShadow />

      {/* ── Main apron ────────────────────────────────────────────────────── */}
      <mesh geometry={APRON_GEO} material={MAT_APRON} rotation={GROUND_ROT} position={[0, 0.01, 0]} receiveShadow />

      {/* Apron yellow edge marking */}
      <mesh geometry={LINE_H_GEO} material={MAT_YELLOW} rotation={GROUND_ROT} position={[0, 0.03, 100]} />
      <mesh geometry={LINE_H_GEO} material={MAT_YELLOW} rotation={GROUND_ROT} position={[0, 0.03, -100]} />

      {/* ── Grid on central 120×120 build zone ───────────────────────────── */}
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

      {/* ── Connector taxiways ─────────────────────────────────────────────── */}
      <mesh geometry={CONNECTOR_GEO} material={MAT_TAXIWAY} rotation={GROUND_ROT} position={[-170, 0.01, -165]} />
      <mesh geometry={CONNECTOR_GEO} material={MAT_TAXIWAY} rotation={GROUND_ROT} position={[ 170, 0.01, -165]} />

      {/* ── Parallel taxiway ──────────────────────────────────────────────── */}
      <mesh geometry={TAXIWAY_GEO} material={MAT_TAXIWAY} rotation={GROUND_ROT} position={[0, 0.01, -230]} receiveShadow />
      {Array.from({ length: 26 }, (_, i) => i - 13).map(i => (
        <mesh key={i} geometry={DASH_TW_GEO} material={MAT_YELLOW} rotation={GROUND_ROT} position={[i * 36, 0.03, -230]} />
      ))}

      {/* ── Main runway ───────────────────────────────────────────────────── */}
      <mesh geometry={RUNWAY_GEO} material={MAT_RUNWAY} rotation={GROUND_ROT} position={[0, 0.01, -370]} receiveShadow />
      <mesh geometry={LINE_H_GEO} material={MAT_WHITE} rotation={GROUND_ROT} position={[0, 0.03, -370 - 22]} />
      <mesh geometry={LINE_H_GEO} material={MAT_WHITE} rotation={GROUND_ROT} position={[0, 0.03, -370 + 22]} />
      {Array.from({ length: 20 }, (_, i) => i - 10).map(i => (
        <mesh key={i} geometry={DASH_RW_GEO} material={MAT_WHITE} rotation={GROUND_ROT} position={[i * 46, 0.03, -370]} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} geometry={THRESH_GEO} material={MAT_WHITE} rotation={GROUND_ROT} position={[-13 + i * 5.5, 0.03, -370 + 460]} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} geometry={THRESH_GEO} material={MAT_WHITE} rotation={GROUND_ROT} position={[-13 + i * 5.5, 0.03, -370 - 460]} />
      ))}

      {/* ── Hangars — metal-clad with corrugated roofs ────────────────────── */}
      {([-120, 10, 140] as const).map((x, i) => (
        <group key={i} position={[x, 0, -145]}>
          <mesh geometry={HANGAR_BODY_GEO}  material={MAT_HANGAR}     position={[0, 7, 0]}    castShadow receiveShadow />
          <mesh geometry={HANGAR_RIDGE_GEO} material={MAT_HANGAR_TOP} position={[0, 15.5, 0]} castShadow />
          {/* Front door opening */}
          <mesh geometry={HANGAR_DOOR_GEO} position={[0, 6, 19.01]} material={MAT_TOWER} />
        </group>
      ))}

      {/* ── Control Tower — concrete shaft + glass observation deck ────────── */}
      <group position={[-230, 0, -110]}>
        <mesh geometry={TOWER_SHAFT_GEO}  material={MAT_TOWER}       castShadow receiveShadow position={[0, 17, 0]} />
        <mesh geometry={TOWER_OBS_GEO}    material={MAT_TOWER_TOP}   castShadow              position={[0, 36, 0]} />
        <mesh geometry={TOWER_GLASS_GEO}  material={MAT_TOWER_GLASS}                         position={[0, 36, 0]} />
        <mesh geometry={TOWER_MAST_GEO}   material={MAT_TOWER_TOP}                           position={[0, 43, 0]} />
        <mesh geometry={TOWER_DISH_GEO}   material={MAT_TOWER_TOP}                           position={[4, 40.5, 0]} rotation={[0, 0, Math.PI / 4]} />
      </group>

      {/* ── Tree lines — cone canopy + cylinder trunk ─────────────────────── */}
      {ALL_ENV_TREES.map((t, i) => {
        const trunkH  = t.h * 0.35;
        const canopyH = t.h * 0.72;
        const canopyR = t.h * 0.32;
        return (
          <group key={`tree_${i}`} position={[t.x, 0, t.z]}>
            <mesh geometry={TRUNK_GEO} material={MAT_TRUNK}
              position={[0, trunkH / 2, 0]} scale={[1, trunkH, 1]} castShadow />
            <mesh geometry={CANOPY_LO_GEO} material={CANOPY_MATS[t.variant]}
              position={[0, trunkH + canopyH * 0.45, 0]} scale={[canopyR, canopyH, canopyR]} castShadow />
            <mesh geometry={CANOPY_HI_GEO} material={CANOPY_MATS[(t.variant + 1) % 3]}
              position={[0, trunkH + canopyH * 0.85, 0]} scale={[canopyR * 0.6, canopyH * 0.5, canopyR * 0.6]} />
          </group>
        );
      })}

      {/* ── Soft ground shadows ────────────────────────────────────────────── */}
      <ContactShadows
        position={[0, 0.03, 0]}
        opacity={0.5}
        scale={400}
        blur={2.5}
        far={100}
        color="#101008"
      />

      {/* ── Build objects ─────────────────────────────────────────────────── */}
      {points.map((pt, i) => (
        <BuildObject key={`${pt.name}_${pt.x}_${pt.y}_${pt.z}_${i}`} pt={pt} highCount={points.length > 30} />
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
