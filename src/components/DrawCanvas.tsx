// ─────────────────────────────────────────────────────────────────────────────
// DANK STUDIO — Free Draw Canvas
// 2D top-down canvas. Modes:
//   wall   — click+drag to draw a wall segment between two points
//   place  — click / tap to place a single object
//   select — click existing wall or object to select it; then replace or delete
// Works on desktop (mouse) and mobile (touch).
// ─────────────────────────────────────────────────────────────────────────────
import {
  useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef,
} from "react";
import type { DrawnWall, DrawnObject } from "../lib/types";
import { getMimic } from "../lib/mimic";
import { ObjectPicker } from "./ObjectPicker";

export type DrawMode = "wall" | "place" | "select";

export interface DrawCanvasHandle {
  clearAll(): void;
}

interface Props {
  walls:        DrawnWall[];
  objects:      DrawnObject[];
  onAddWall:    (w: Omit<DrawnWall, "id">) => void;
  onAddObject:  (o: Omit<DrawnObject, "id">) => void;
  onRemoveWall: (id: string) => void;
  onRemoveObject:(id: string) => void;
  onReplaceWall(id: string, classname: string): void;
  onReplaceObject(id: string, classname: string): void;
  mode:         DrawMode;
  wallClass:    string;
  objectClass:  string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const PX_PER_M     = 4;       // 1 metre = 4 px at default zoom
const GRID_METRES  = 4;       // snap grid in metres
const HIT_RADIUS   = 12;      // pixels for selection hit-test

// ── Helpers ───────────────────────────────────────────────────────────────────
function snap(v: number, g: number) { return Math.round(v / g) * g; }

/** Distance from point (px,pz) to segment (ax,az)→(bx,bz) in world coords */
function ptSegDist(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax, dz = bz - az;
  const len2 = dx * dx + dz * dz;
  if (len2 === 0) return Math.hypot(px - ax, pz - az);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / len2));
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

// ── Canvas renderer ───────────────────────────────────────────────────────────
function render(
  ctx:        CanvasRenderingContext2D,
  w:          number,
  h:          number,
  walls:      DrawnWall[],
  objects:    DrawnObject[],
  camX:       number, // world-X of canvas centre
  camZ:       number, // world-Z of canvas centre
  zoom:       number, // pixels per metre
  ghostStart: { x: number; z: number } | null,
  ghostEnd:   { x: number; z: number } | null,
  ghostObj:   { x: number; z: number } | null,
  wallClass:  string,
  objectClass:string,
  selectedId: string | null,
) {
  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.fillStyle = "#111114";
  ctx.fillRect(0, 0, w, h);

  const toS = (wx: number, wz: number): [number, number] => [
    w / 2 + (wx - camX) * zoom,
    h / 2 + (wz - camZ) * zoom,
  ];

  // Grid
  const gridM = GRID_METRES;
  const startX = Math.floor((camX - w / (2 * zoom)) / gridM) * gridM;
  const endX   = Math.ceil ((camX + w / (2 * zoom)) / gridM) * gridM;
  const startZ = Math.floor((camZ - h / (2 * zoom)) / gridM) * gridM;
  const endZ   = Math.ceil ((camZ + h / (2 * zoom)) / gridM) * gridM;

  ctx.strokeStyle = "#1e1e24";
  ctx.lineWidth = 0.5;
  for (let mx = startX; mx <= endX; mx += gridM) {
    const [sx] = toS(mx, 0);
    ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, h); ctx.stroke();
  }
  for (let mz = startZ; mz <= endZ; mz += gridM) {
    const [, sz] = toS(0, mz);
    ctx.beginPath(); ctx.moveTo(0, sz); ctx.lineTo(w, sz); ctx.stroke();
  }

  // Origin cross
  const [ox, oz] = toS(0, 0);
  ctx.strokeStyle = "#2a2a40";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(ox - 12, oz); ctx.lineTo(ox + 12, oz); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ox, oz - 12); ctx.lineTo(ox, oz + 12); ctx.stroke();

  // Walls
  for (const wall of walls) {
    const [sx1, sz1] = toS(wall.x1, wall.z1);
    const [sx2, sz2] = toS(wall.x2, wall.z2);
    const mimic = getMimic(wall.classname);
    const isSelected = wall.id === selectedId;

    ctx.strokeStyle = isSelected ? "#6366f1" : mimic.color;
    ctx.lineWidth   = isSelected ? 3 : Math.max(2, mimic.d * zoom * 0.5);
    ctx.beginPath();
    ctx.moveTo(sx1, sz1);
    ctx.lineTo(sx2, sz2);
    ctx.stroke();
  }

  // Objects
  for (const obj of objects) {
    const mimic = getMimic(obj.classname);
    const [sx, sz] = toS(obj.x, obj.z);
    const pw = mimic.w * zoom * 0.5;
    const pd = mimic.d * zoom * 0.5;
    const isSelected = obj.id === selectedId;

    ctx.save();
    ctx.translate(sx, sz);
    ctx.rotate((obj.yaw * Math.PI) / 180);
    ctx.fillStyle   = isSelected ? "#6366f1" : mimic.color + "cc";
    ctx.strokeStyle = isSelected ? "#a5b4fc" : mimic.color;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.fillRect(-pw / 2, -pd / 2, pw, pd);
    ctx.strokeRect(-pw / 2, -pd / 2, pw, pd);
    ctx.restore();
  }

  // Ghost wall (preview while dragging)
  if (ghostStart && ghostEnd) {
    const [sx1, sz1] = toS(ghostStart.x, ghostStart.z);
    const [sx2, sz2] = toS(ghostEnd.x, ghostEnd.z);
    const mimic = getMimic(wallClass);
    ctx.strokeStyle = mimic.color + "88";
    ctx.lineWidth   = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(sx1, sz1); ctx.lineTo(sx2, sz2); ctx.stroke();
    ctx.setLineDash([]);
  }

  // Ghost object (preview while hovering in place mode)
  if (ghostObj) {
    const [sx, sz] = toS(ghostObj.x, ghostObj.z);
    const mimic = getMimic(objectClass);
    const pw = mimic.w * zoom * 0.5;
    const pd = mimic.d * zoom * 0.5;
    ctx.fillStyle   = mimic.color + "66";
    ctx.strokeStyle = mimic.color + "aa";
    ctx.lineWidth = 1;
    ctx.fillRect(sx - pw / 2, sz - pd / 2, pw, pd);
    ctx.strokeRect(sx - pw / 2, sz - pd / 2, pw, pd);
  }
}

// ── Main component ────────────────────────────────────────────────────────────
export const DrawCanvas = forwardRef<DrawCanvasHandle, Props>(function DrawCanvas(
  {
    walls, objects,
    onAddWall, onAddObject, onRemoveWall, onRemoveObject,
    onReplaceWall, onReplaceObject,
    mode, wallClass, objectClass,
  },
  ref,
) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);

  // Camera state
  const camX = useRef(0);
  const camZ = useRef(0);
  const zoom = useRef(PX_PER_M);

  // Drag state
  const dragging  = useRef(false);
  const dragStart = useRef<{ x: number; z: number } | null>(null);
  const panning   = useRef(false);
  const panStart  = useRef<{ sx: number; sz: number; cx: number; cz: number } | null>(null);

  // Ghost / hover
  const [ghostEnd, setGhostEnd]  = useState<{ x: number; z: number } | null>(null);
  const [ghostObj, setGhostObj]  = useState<{ x: number; z: number } | null>(null);

  // Selection
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"wall" | "object" | null>(null);
  const [showPicker, setShowPicker]   = useState(false);

  useImperativeHandle(ref, () => ({
    clearAll() { setSelectedId(null); setSelectedType(null); },
  }));

  // ── Canvas → world coords ─────────────────────────────────────────────────
  const toWorld = useCallback((sx: number, sz: number): { x: number; z: number } => {
    const canvas = canvasRef.current!;
    const wx = camX.current + (sx - canvas.width  / 2) / zoom.current;
    const wz = camZ.current + (sz - canvas.height / 2) / zoom.current;
    return { x: wx, z: wz };
  }, []);

  const toWorldSnapped = useCallback((sx: number, sz: number) => {
    const { x, z } = toWorld(sx, sz);
    const g = GRID_METRES;
    return { x: snap(x, g), z: snap(z, g) };
  }, [toWorld]);

  // ── Re-render loop ────────────────────────────────────────────────────────
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    render(
      ctx, canvas.width, canvas.height,
      walls, objects,
      camX.current, camZ.current, zoom.current,
      mode === "wall" ? dragStart.current : null,
      mode === "wall" ? ghostEnd : null,
      mode === "place" ? ghostObj : null,
      wallClass, objectClass, selectedId,
    );
  }, [walls, objects, mode, wallClass, objectClass, ghostEnd, ghostObj, selectedId]);

  useEffect(() => { redraw(); }, [redraw]);

  // ── Resize observer ───────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      redraw();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [redraw]);

  // ── Hit-test: find wall or object near world coords ───────────────────────
  const hitTest = useCallback((wx: number, wz: number): { id: string; type: "wall" | "object" } | null => {
    const threshold = HIT_RADIUS / zoom.current;

    for (const obj of objects) {
      if (Math.hypot(obj.x - wx, obj.z - wz) < threshold) {
        return { id: obj.id, type: "object" };
      }
    }
    for (const wall of walls) {
      if (ptSegDist(wx, wz, wall.x1, wall.z1, wall.x2, wall.z2) < threshold) {
        return { id: wall.id, type: "wall" };
      }
    }
    return null;
  }, [walls, objects]);

  // ── Event extraction ──────────────────────────────────────────────────────
  function getPos(e: React.MouseEvent | React.TouchEvent): { sx: number; sz: number } {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const t = e.touches[0] ?? e.changedTouches[0];
      return { sx: t.clientX - rect.left, sz: t.clientY - rect.top };
    }
    return { sx: (e as React.MouseEvent).clientX - rect.left, sz: (e as React.MouseEvent).clientY - rect.top };
  }

  // ── Pointer down ─────────────────────────────────────────────────────────
  function handlePointerDown(e: React.MouseEvent | React.TouchEvent) {
    const { sx, sz } = getPos(e);
    const isMiddle = "button" in e && (e as React.MouseEvent).button === 1;
    const isRight  = "button" in e && (e as React.MouseEvent).button === 2;

    if (isMiddle || isRight) {
      panning.current = true;
      panStart.current = { sx, sz, cx: camX.current, cz: camZ.current };
      return;
    }

    if (mode === "wall") {
      const wp = toWorldSnapped(sx, sz);
      dragStart.current = wp;
      dragging.current  = true;
    } else if (mode === "place") {
      const wp = toWorldSnapped(sx, sz);
      onAddObject({
        classname: objectClass,
        x: wp.x, y: 0, z: wp.z,
        yaw: 0, pitch: 0, roll: 0,
        scale: 1,
      });
    } else if (mode === "select") {
      const wp = toWorld(sx, sz);
      const hit = hitTest(wp.x, wp.z);
      if (hit) {
        setSelectedId(hit.id);
        setSelectedType(hit.type);
      } else {
        setSelectedId(null);
        setSelectedType(null);
      }
    }
  }

  // ── Pointer move ──────────────────────────────────────────────────────────
  function handlePointerMove(e: React.MouseEvent | React.TouchEvent) {
    const { sx, sz } = getPos(e);

    if (panning.current && panStart.current) {
      camX.current = panStart.current.cx - (sx - panStart.current.sx) / zoom.current;
      camZ.current = panStart.current.cz - (sz - panStart.current.sz) / zoom.current;
      redraw();
      return;
    }

    if (mode === "wall" && dragging.current) {
      const wp = toWorldSnapped(sx, sz);
      setGhostEnd(wp);
    } else if (mode === "place") {
      const wp = toWorldSnapped(sx, sz);
      setGhostObj(wp);
    }
  }

  // ── Pointer up ────────────────────────────────────────────────────────────
  function handlePointerUp(e: React.MouseEvent | React.TouchEvent) {
    if (panning.current) {
      panning.current = false;
      panStart.current = null;
      return;
    }

    if (mode === "wall" && dragging.current && dragStart.current) {
      const { sx, sz } = getPos(e);
      const wp = toWorldSnapped(sx, sz);
      const dx = wp.x - dragStart.current.x;
      const dz = wp.z - dragStart.current.z;
      if (Math.hypot(dx, dz) > 1) {
        onAddWall({
          classname: wallClass,
          x1: dragStart.current.x, y1: 0, z1: dragStart.current.z,
          x2: wp.x,                y2: 0, z2: wp.z,
        });
      }
      dragStart.current = null;
      dragging.current  = false;
      setGhostEnd(null);
    }
  }

  // ── Wheel zoom ────────────────────────────────────────────────────────────
  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    zoom.current = Math.max(0.5, Math.min(40, zoom.current * factor));
    redraw();
  }

  // ── Keyboard delete ───────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        if (selectedType === "wall") onRemoveWall(selectedId);
        else if (selectedType === "object") onRemoveObject(selectedId);
        setSelectedId(null);
        setSelectedType(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, selectedType, onRemoveWall, onRemoveObject]);

  // ── Context menu — "Replace" / "Delete" ─────────────────────────────────
  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    const { sx, sz } = getPos(e);
    const wp = toWorld(sx, sz);
    const hit = hitTest(wp.x, wp.z);
    if (hit) {
      setSelectedId(hit.id);
      setSelectedType(hit.type);
      setShowPicker(true);
    }
  }

  function handlePickerSelect(classname: string) {
    if (!selectedId) return;
    if (selectedType === "wall")   onReplaceWall(selectedId, classname);
    if (selectedType === "object") onReplaceObject(selectedId, classname);
    setShowPicker(false);
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#111114]">
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={() => { dragging.current = false; setGhostEnd(null); setGhostObj(null); }}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      />

      {/* Selection toolbar */}
      {selectedId && mode === "select" && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-zinc-900/95 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
          <button
            onClick={() => setShowPicker(true)}
            className="text-xs text-amber-400 hover:text-amber-200 px-2 py-1 bg-zinc-800 rounded"
          >Replace Object</button>
          <button
            onClick={() => {
              if (selectedType === "wall")   onRemoveWall(selectedId);
              if (selectedType === "object") onRemoveObject(selectedId);
              setSelectedId(null);
            }}
            className="text-xs text-red-400 hover:text-red-200 px-2 py-1 bg-zinc-800 rounded"
          >Delete</button>
          <button
            onClick={() => { setSelectedId(null); setSelectedType(null); }}
            className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 bg-zinc-800 rounded"
          >✕</button>
        </div>
      )}

      {/* Hint */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none">
        {mode === "wall"   && <span className="text-xs text-zinc-600 bg-zinc-900/70 px-2 py-0.5 rounded">Click & drag to draw walls • Scroll to zoom • Right-click to pan</span>}
        {mode === "place"  && <span className="text-xs text-zinc-600 bg-zinc-900/70 px-2 py-0.5 rounded">Click to place object • Scroll to zoom</span>}
        {mode === "select" && <span className="text-xs text-zinc-600 bg-zinc-900/70 px-2 py-0.5 rounded">Click to select • Right-click to replace • Delete key to remove</span>}
      </div>

      {/* Object picker */}
      {showPicker && (
        <ObjectPicker
          current={
            selectedType === "wall"
              ? walls.find(w => w.id === selectedId)?.classname
              : objects.find(o => o.id === selectedId)?.classname
          }
          onSelect={handlePickerSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
});
