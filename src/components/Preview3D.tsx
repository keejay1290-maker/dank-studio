// ─────────────────────────────────────────────────────────────────────────────
// DANK STUDIO — S-Tier V6.0 Extreme Renderer (game-engine quality)
// ─────────────────────────────────────────────────────────────────────────────
import { useRef, useEffect, useMemo, Suspense, forwardRef, memo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { 
  OrbitControls, Grid, Environment, useGLTF, Sky, 
  Instances, Instance, Html, useTexture
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import type { Point3D } from "../lib/types";
import { getMimic } from "../lib/mimic";

const MIN_DISTANCE = 5;
const MAX_DISTANCE = 2000;

// ── Error Boundary for 3D Components ──────────────────────────────────────────
function ErrorBoundary({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  useEffect(() => {
    const handleErr = (e: ErrorEvent) => { 
      if (e.message.includes("GLTF") || e.message.includes("texture") || e.message.includes("rendering")) {
         setHasError(true); 
      }
    };
    window.addEventListener("error", handleErr);
    return () => window.removeEventListener("error", handleErr);
  }, []);
  if (hasError) return <>{fallback}</> || null;
  return <>{children}</>;
}


// ── Shared Materials & Textures ───────────────────────────────────────────────
const _sharedMaterials = new Map<string, THREE.MeshStandardMaterial>();

function getMaterialProps(classname: string) {
  const k = classname.toLowerCase();
  let props = { roughness: 0.8, metalness: 0.1 };
  let texName = "concrete_wall_co.png";

  if (k.includes("container") || k.includes("tank")) {
    props = { roughness: 0.45, metalness: 0.5 };
    texName = "container_co.png";
  } else if (k.includes("barrel")) {
    props = { roughness: 0.35, metalness: 0.7 };
    texName = k.includes("blue") ? "barrel_blue_co.png" : "barrel_red_co.png";
  } else if (k.includes("stone") || k.includes("castle")) {
    props = { roughness: 1.0, metalness: 0.0 };
    texName = "stone_co.png";
  } else if (k.includes("concrete") || k.includes("cnc") || k.includes("mil")) {
    props = { roughness: 0.9, metalness: 0.05 };
    texName = "milcnc_co.png";
  } else if (k.includes("metal") || k.includes("tin")) {
    props = { roughness: 0.6, metalness: 0.4 };
    texName = "metal_co.png";
  } else if (k.includes("brick")) {
    texName = "brick_co.png";
  } else if (k.includes("pipe")) {
    texName = "pipe_co.png";
  }
  return { props, texName };
}

function useSharedMaterial(classname: string, color: string) {
  const { props, texName } = useMemo(() => getMaterialProps(classname), [classname]);
  // useTexture handles caching internally, but we useMemo to create the material once
  const tex = useTexture(`./textures/${texName}`);
  
  return useMemo(() => {
    const matKey = `${classname}_${color}`;
    if (_sharedMaterials.has(matKey)) return _sharedMaterials.get(matKey)!;
    
    if (tex) {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1, 1);
    }

    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      map: tex,
      ...props,
      envMapIntensity: 1.0
    });
    _sharedMaterials.set(matKey, mat);
    return mat;
  }, [classname, color, tex, props]);
}

// ── Instanced Component for a specific Classname ─────────────────────────────
const InstancedGroup = memo(function InstancedGroup({ 
  classname, instances 
}: { 
  classname: string; 
  instances: { pos: [number, number, number], rot: THREE.Euler, scale: number }[] 
}) {
  const gltf = useGLTF(`./models/${classname}.glb`);
  
  const mesh = useMemo(() => {
    if (!gltf) return null;
    let found: THREE.Mesh | null = null;
    gltf.scene.traverse((c: any) => {
      if (!found && c.isMesh) found = c;
    });
    return found;
  }, [gltf]);

  if (!mesh) return null;

  return (
    <Instances 
      castShadow 
      receiveShadow 
      range={instances.length} 
      geometry={(mesh as any).geometry} 
      material={(mesh as any).material}
    >
      {instances.map((inst, i) => (
        <Instance 
          key={i} 
          position={inst.pos} 
          rotation={inst.rot} 
          scale={[inst.scale, inst.scale, inst.scale]} 
        />
      ))}
    </Instances>
  );
});

// ── Fast Non-Suspending Fallback ─────────────────────────────────────────────
const FastBox = memo(({ classname, instances, color }: { classname: string, instances: any[], color: string }) => {
  const mimic = useMemo(() => getMimic(classname), [classname]);
  const geo = useMemo(() => new THREE.BoxGeometry(mimic.w, mimic.h, mimic.d), [mimic]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.8 }), [color]);

  return (
    <Instances range={instances.length} geometry={geo} material={mat}>
      {instances.map((inst, i) => (
        <Instance 
          key={i} 
          position={[inst.pos[0], inst.pos[1] + (mimic.h * inst.scale)/2, inst.pos[2]]} 
          rotation={inst.rot} 
          scale={inst.scale}
        />
      ))}
    </Instances>
  );
});

const InstancedBoxes = memo(({ classname, instances, color }: { classname: string, instances: any[], color: string }) => {
  const mimic = useMemo(() => getMimic(classname), [classname]);
  const mat = useSharedMaterial(classname, color); // This can suspend
  const geo = useMemo(() => new THREE.BoxGeometry(mimic.w, mimic.h, mimic.d), [mimic]);

  return (
    <Instances castShadow receiveShadow range={instances.length} geometry={geo} material={mat}>
      {instances.map((inst, i) => (
        <Instance 
          key={i} 
          position={[inst.pos[0], inst.pos[1] + (mimic.h * inst.scale)/2, inst.pos[2]]} 
          rotation={inst.rot} 
          scale={inst.scale}
          userData={{ index: inst.id }}
        />
      ))}
    </Instances>
  );
});

// ── Internal Build Renderer ──────────────────────────────────────────────────
function BuildRenderer({ points, selectedId }: { 
  points: Point3D[], 
  selectedId?: string
}) {
  const [availableGlbs, setAvailableGlbs] = useState<Set<string>>(new Set());
  const [failedGlbs, setFailedGlbs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (points.length === 0) return;
    const uniqueTypes = Array.from(new Set(points.map(p => p.name ?? "staticobj_castle_wall3")));
    
    // Only fetch if NOT in available AND NOT in failed
    const missing = uniqueTypes.filter(t => !availableGlbs.has(t) && !failedGlbs.has(t));
    if (missing.length === 0) return;

    Promise.all(missing.map(name => 
      fetch(`./models/${name}.glb`, { method: "HEAD" })
        .then(r => r.ok ? { name, ok: true } : { name, ok: false })
        .catch(() => ({ name, ok: false }))
    )).then(results => {
      const found = results.filter(r => r.ok).map(r => r.name);
      const missed = results.filter(r => !r.ok).map(r => r.name);
      
      if (found.length > 0) {
        setAvailableGlbs(prev => {
          const next = new Set(prev);
          found.forEach(f => next.add(f));
          return next;
        });
      }
      if (missed.length > 0) {
        setFailedGlbs(prev => {
          const next = new Set(prev);
          missed.forEach(m => next.add(m));
          return next;
        });
      }
    });
  }, [points, availableGlbs, failedGlbs]);

  const groups = useMemo(() => {
    const map = new Map<string, { id: string, pos: [number, number, number], rot: THREE.Euler, scale: number }[]>();
    points.forEach((p) => {
      const name = p.name ?? "staticobj_castle_wall3";
      if (!map.has(name)) map.set(name, []);
      const DEG = Math.PI / 180;
      map.get(name)!.push({
        id: p.id || "un-id",
        pos: [p.x, p.y, p.z],
        rot: new THREE.Euler((p.pitch || 0) * DEG, (p.yaw || 0) * DEG, (p.roll || 0) * DEG, "YXZ"),
        scale: p.scale || 1
      });
    });
    return Array.from(map.entries());
  }, [points]);

  return (
    <>
      {groups.map(([name, instances]) => {
        const normalInsts = instances.filter(inst => inst.id !== selectedId);
        const selectedInst = instances.filter(inst => inst.id === selectedId);

        return (
          <group key={name}>
            {availableGlbs.has(name) ? (
              <ErrorBoundary fallback={<FastBox classname={name} color="#556677" instances={instances} />}>
                <Suspense fallback={<FastBox classname={name} color="#556677" instances={instances} />}>
                  <InstancedGroup classname={name} instances={normalInsts} />
                  {selectedInst.length > 0 && (
                    <mesh position={selectedInst[0].pos} rotation={selectedInst[0].rot}>
                      <boxGeometry args={[0.5, 5, 0.5]} />
                      <meshBasicMaterial color="yellow" wireframe />
                    </mesh>
                  )}
                </Suspense>
              </ErrorBoundary>
            ) : (
              <Suspense fallback={<FastBox classname={name} color="#556677" instances={instances} />}>
                <InstancedBoxes classname={name} color="#7a8a9a" instances={instances} />
              </Suspense>
            )}
          </group>
        );
      })}
    </>
  );
}

// ── Controls & Scene Setup ───────────────────────────────────────────────────
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

function AutoFrame({ points }: { points: Point3D[] }) {
  const { camera, controls } = useThree() as { camera: THREE.PerspectiveCamera; controls: any };
  const prevLen = useRef(0);

  useEffect(() => {
    if (points.length === 0 || points.length === prevLen.current) return;
    prevLen.current = points.length;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const p of points) {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
      minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
    }

    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;
    const size = Math.max(maxX - minX, maxY - minY, maxZ - minZ, 20);
    const dist = size * 1.5;

    camera.position.set(cx + dist * 0.65, cy + dist * 0.5, cz + dist * 0.65);
    camera.lookAt(cx, cy, cz);
    camera.updateProjectionMatrix();
    if (controls?.target) {
      controls.target.set(cx, cy, cz);
      controls.update();
    }
  }, [points, camera, controls]);

  return null;
}

function Scene({ 
  points, 
  ctrlRef, 
  selectedId, 
  onSelect, 
  onPlace 
}: { 
  points: Point3D[]; 
  ctrlRef: React.Ref<any>;
  selectedId?: string;
  onSelect: (id: string | null) => void;
  onPlace: (pos: [number, number, number]) => void;
}) {
  return (
    <>
      <AutoFrame points={points} />
      <ControlsRef ref={ctrlRef} />

      <ambientLight intensity={1.5} />
      <directionalLight
        position={[100, 150, 50]}
        intensity={2.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
      />
      <hemisphereLight intensity={0.5} groundColor="#1a1a1a" />
      <Sky distance={450000} sunPosition={[100, 150, 50]} inclination={0} azimuth={0.25} />
      <Environment preset="forest" />
      <fog attach="fog" args={["#a0b0c8", 400, 2000]} />
      
      <Grid 
        infiniteGrid 
        fadeDistance={1200} 
        fadeStrength={5} 
        sectionSize={50} 
        cellSize={10} 
        sectionColor="#2d2d30" 
        cellColor="#1a1a1c" 
      />
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow onPointerDown={e => {
        if (e.shiftKey) {
          e.stopPropagation();
          onPlace?.([e.point.x, e.point.y, e.point.z]);
        } else {
          onSelect?.(null);
        }
      }}>
        <planeGeometry args={[10000, 10000]} />
        <meshStandardMaterial color="#1a1c1e" roughness={1} metalness={0} />
      </mesh>
      
      <Suspense fallback={<Html center><div className="text-white text-[10px] animate-pulse">WARMING ENGINE...</div></Html>}>
        <BuildRenderer points={points} selectedId={selectedId} />
      </Suspense>

      <EffectComposer multisampling={4}>
        <Bloom luminanceThreshold={1.2} intensity={0.8} levels={8} mipmapBlur />
        <Vignette eskil={false} offset={0.1} darkness={0.4} />
      </EffectComposer>
    </>
  );
}

export function Preview3D({ 
  points, 
  onPlacePoint,
  selectedId,
  onSelect
}: { 
  points: Point3D[];
  onPlacePoint?: (pos: [number, number, number]) => void;
  selectedId?: string;
  onSelect?: (id: string | null) => void;
}) {
  const ctrlRef = useRef<any>(null);

  // Background color for the canvas to prevent black screen if scene takes long to load
  return (
    <div className="w-full h-full relative cursor-crosshair bg-[#050507]">
      <Canvas shadows gl={{ antialias: true, logarithmicDepthBuffer: true }} onPointerMissed={() => onSelect?.(null)}>
        <Suspense fallback={<Html center><div className="text-white text-[10px]">INITIALIZING ENGINE...</div></Html>}>
          <Scene 
            points={points} 
            ctrlRef={ctrlRef} 
            selectedId={selectedId}
            onSelect={onSelect || (() => {})}
            onPlace={onPlacePoint || (() => {})}
          />
        </Suspense>
      </Canvas>

      <div className="absolute top-4 left-4 flex flex-col gap-1 pointer-events-none">
        <div className="px-3 py-1.5 glass rounded text-[10px] uppercase tracking-widest font-bold text-indigo-400">
          Render Engine V6.5 Extreme
        </div>
        <div className="px-3 py-1 text-xs text-zinc-400 glass rounded flex items-center gap-2">
          <span>Simulation Objects:</span>
          <span className="text-white font-mono">{points.length}</span>
        </div>
      </div>

      {points.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
             <p className="text-zinc-600 text-[10px] uppercase tracking-[0.3em] mb-2 font-black">Waiting for Selection</p>
             <p className="text-zinc-500 text-xs opacity-50">S-Tier Building Simulator v2.51 Hotfix</p>
          </div>
        </div>
      )}
    </div>
  );
}
