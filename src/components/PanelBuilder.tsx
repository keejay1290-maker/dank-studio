// ─────────────────────────────────────────────────────────────────────────────
// DANK STUDIO — Panel Builder (Legacy Grid Mode)
// Grid-based room construction. Each cell is PANEL_GRID_SIZE metres square.
// Click floor cells to add/remove floors.
// Click the edge between two cells to toggle a wall on that edge.
// Exports as DrawnWall[] + DrawnObject[] (floor tiles).
// ─────────────────────────────────────────────────────────────────────────────
import { useRef, useEffect, useCallback, useState } from "react";
import { PANEL_GRID_SIZE } from "../lib/constants";
import { ObjectPicker } from "./ObjectPicker";

// ── Types ─────────────────────────────────────────────────────────────────────
type CellKey  = `${number},${number}`;                    // "col,row"
type EdgeKey  = `h:${number},${number}` | `v:${number},${number}`; // h=horizontal,v=vertical

export interface PanelState {
  floors:    Set<CellKey>;   // filled floor cells
  walls:     Set<EdgeKey>;   // walls on edges
  wallClass: string;
  floorClass:string;
}

interface Props {
  state:       PanelState;
  onChange:    (s: PanelState) => void;
  onExport:    (s: PanelState) => void; // convert to walls+objects
}

// ── Constants ─────────────────────────────────────────────────────────────────
const CELL_PX    = 32;   // pixels per grid cell
const COLS       = 30;
const ROWS       = 30;
const EDGE_HIT   = 6;    // px from edge centre for wall toggle

// ── Helper ────────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 10); }

function renderPanel(
  ctx:        CanvasRenderingContext2D,
  state:      PanelState,
  offsetX:    number,
  offsetY:    number,
  hoveredCell:CellKey | null,
  hoveredEdge:EdgeKey | null,
) {
  const W = COLS * CELL_PX;
  const H = ROWS * CELL_PX;

  ctx.clearRect(0, 0, W + 40, H + 40);
  ctx.fillStyle = "#0f0f12";
  ctx.fillRect(0, 0, W + 40, H + 40);

  ctx.save();
  ctx.translate(offsetX, offsetY);

  // Draw cells
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      const key: CellKey = `${col},${row}`;
      const x = col * CELL_PX;
      const y = row * CELL_PX;
      const filled = state.floors.has(key);

      // Floor fill
      if (filled) {
        ctx.fillStyle = "#2a2a1e";
        ctx.fillRect(x + 1, y + 1, CELL_PX - 2, CELL_PX - 2);
      }

      // Hover
      if (key === hoveredCell && !filled) {
        ctx.fillStyle = "#2a2a3a55";
        ctx.fillRect(x, y, CELL_PX, CELL_PX);
      }

      // Grid lines
      ctx.strokeStyle = filled ? "#3a3a2a" : "#1e1e22";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, CELL_PX, CELL_PX);
    }
  }

  // Draw walls on edges
  ctx.lineWidth = 3;
  for (const eKey of state.walls) {
    const [type, rest] = eKey.split(":");
    const [a, b] = rest.split(",").map(Number);
    ctx.strokeStyle = "#7c6a52";
    ctx.beginPath();
    if (type === "h") {
      // horizontal edge between (col,row) and (col,row+1) = wall on top of row (a=col,b=row)
      ctx.moveTo(a * CELL_PX,           b * CELL_PX);
      ctx.lineTo((a + 1) * CELL_PX,     b * CELL_PX);
    } else {
      // vertical edge (a=col,b=row) = wall on left of col
      ctx.moveTo(a * CELL_PX,           b * CELL_PX);
      ctx.lineTo(a * CELL_PX,           (b + 1) * CELL_PX);
    }
    ctx.stroke();
  }

  // Hovered edge preview
  if (hoveredEdge) {
    const [type, rest] = hoveredEdge.split(":");
    const [a, b] = rest.split(",").map(Number);
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth   = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    if (type === "h") {
      ctx.moveTo(a * CELL_PX, b * CELL_PX);
      ctx.lineTo((a + 1) * CELL_PX, b * CELL_PX);
    } else {
      ctx.moveTo(a * CELL_PX, b * CELL_PX);
      ctx.lineTo(a * CELL_PX, (b + 1) * CELL_PX);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

// ── Component ─────────────────────────────────────────────────────────────────
export function PanelBuilder({ state, onChange, onExport }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const [hovCell,  setHovCell]  = useState<CellKey | null>(null);
  const [hovEdge,  setHovEdge]  = useState<EdgeKey | null>(null);
  const [showWallPicker,  setShowWallPicker]  = useState(false);
  const [showFloorPicker, setShowFloorPicker] = useState(false);
  const [tool, setTool] = useState<"floor" | "wall">("floor");

  const OX = 20, OY = 20; // canvas offset

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    renderPanel(ctx, state, OX, OY, hovCell, hovEdge);
  }, [state, hovCell, hovEdge]);

  useEffect(() => { redraw(); }, [redraw]);

  // ── Mouse helpers ─────────────────────────────────────────────────────────
  function getRelPos(e: React.MouseEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      px: e.clientX - rect.left - OX,
      py: e.clientY - rect.top  - OY,
    };
  }

  function posToCell(px: number, py: number): CellKey | null {
    const col = Math.floor(px / CELL_PX);
    const row = Math.floor(py / CELL_PX);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
    return `${col},${row}`;
  }

  /** Find nearest edge within EDGE_HIT px */
  function posToEdge(px: number, py: number): EdgeKey | null {
    const col = Math.floor(px / CELL_PX);
    const row = Math.floor(py / CELL_PX);

    // Check horizontal edges (top/bottom of cells)
    const nearTopDist  = Math.abs(py - row * CELL_PX);
    const nearBotDist  = Math.abs(py - (row + 1) * CELL_PX);
    const nearLeftDist = Math.abs(px - col * CELL_PX);
    const nearRightDist= Math.abs(px - (col + 1) * CELL_PX);

    const minDist = Math.min(nearTopDist, nearBotDist, nearLeftDist, nearRightDist);
    if (minDist > EDGE_HIT) return null;

    if (minDist === nearTopDist  && row >= 0 && row <= ROWS && col >= 0 && col < COLS)
      return `h:${col},${row}`;
    if (minDist === nearBotDist  && row + 1 >= 0 && row + 1 <= ROWS && col >= 0 && col < COLS)
      return `h:${col},${row + 1}`;
    if (minDist === nearLeftDist && col >= 0 && col <= COLS && row >= 0 && row < ROWS)
      return `v:${col},${row}`;
    if (minDist === nearRightDist && col + 1 >= 0 && col + 1 <= COLS && row >= 0 && row < ROWS)
      return `v:${col + 1},${row}`;

    return null;
  }

  function handleMouseMove(e: React.MouseEvent) {
    const { px, py } = getRelPos(e);
    if (tool === "floor") {
      setHovCell(posToCell(px, py));
      setHovEdge(null);
    } else {
      const edge = posToEdge(px, py);
      setHovEdge(edge);
      setHovCell(null);
    }
  }

  function handleClick(e: React.MouseEvent) {
    const { px, py } = getRelPos(e);

    if (tool === "floor") {
      const key = posToCell(px, py);
      if (!key) return;
      const next = new Set(state.floors);
      if (next.has(key)) next.delete(key); else next.add(key);
      onChange({ ...state, floors: next });
    } else {
      const edge = posToEdge(px, py);
      if (!edge) return;
      const next = new Set(state.walls);
      if (next.has(edge)) next.delete(edge); else next.add(edge);
      onChange({ ...state, walls: next });
    }
  }

  const cellCount  = state.floors.size;
  const wallCount  = state.walls.size;
  const G = PANEL_GRID_SIZE;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0f0f12]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 flex-shrink-0">
        <span className="text-xs text-zinc-400 font-semibold mr-1">Tool:</span>
        <button
          onClick={() => setTool("floor")}
          className={`text-xs px-2 py-1 rounded ${tool === "floor" ? "bg-indigo-700 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
        >Floor</button>
        <button
          onClick={() => setTool("wall")}
          className={`text-xs px-2 py-1 rounded ${tool === "wall" ? "bg-indigo-700 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
        >Wall</button>

        <div className="w-px h-4 bg-zinc-700 mx-1" />

        <button
          onClick={() => setShowWallPicker(true)}
          className="text-xs px-2 py-1 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 rounded"
        >Wall: <span className="text-zinc-300">{state.wallClass.split("_").slice(-2).join("_")}</span></button>
        <button
          onClick={() => setShowFloorPicker(true)}
          className="text-xs px-2 py-1 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 rounded"
        >Floor: <span className="text-zinc-300">{state.floorClass.split("_").slice(-2).join("_")}</span></button>

        <div className="flex-1" />

        <span className="text-xs text-zinc-600">
          {cellCount} floors · {wallCount} walls
        </span>

        <button
          onClick={() => onChange({ ...state, floors: new Set(), walls: new Set() })}
          className="text-xs px-2 py-1 bg-zinc-800 text-red-400 hover:bg-red-900/40 rounded"
        >Clear</button>

        <button
          onClick={() => onExport(state)}
          className="text-xs px-3 py-1 bg-indigo-700 hover:bg-indigo-600 text-white rounded font-semibold"
        >Export</button>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto p-2">
        <canvas
          ref={canvasRef}
          width={COLS * CELL_PX + 40}
          height={ROWS * CELL_PX + 40}
          style={{ cursor: tool === "floor" ? "crosshair" : "cell", imageRendering: "pixelated" }}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          onMouseLeave={() => { setHovCell(null); setHovEdge(null); }}
        />
      </div>

      {/* Info */}
      <div className="px-3 py-1.5 border-t border-zinc-800 text-xs text-zinc-600 flex-shrink-0">
        {tool === "floor"
          ? `Click cells to paint floors (${G}m × ${G}m each)`
          : "Click cell edges to place walls"}
        {" · Each cell = "}{G}m
      </div>

      {/* Pickers */}
      {showWallPicker && (
        <ObjectPicker
          current={state.wallClass}
          onSelect={c => { onChange({ ...state, wallClass: c }); setShowWallPicker(false); }}
          onClose={() => setShowWallPicker(false)}
        />
      )}
      {showFloorPicker && (
        <ObjectPicker
          current={state.floorClass}
          onSelect={c => { onChange({ ...state, floorClass: c }); setShowFloorPicker(false); }}
          onClose={() => setShowFloorPicker(false)}
        />
      )}
    </div>
  );
}

// ── Export converter: PanelState → walls + floor objects ──────────────────────
export function panelStateToPoints(state: PanelState) {
  const G = PANEL_GRID_SIZE;
  const walls: Array<{ classname: string; x1: number; y1: number; z1: number; x2: number; y2: number; z2: number; id: string }> = [];
  const objects: Array<{ id: string; classname: string; x: number; y: number; z: number; yaw: number; pitch: number; roll: number; scale: number }> = [];

  // Floor tiles
  for (const key of state.floors) {
    const [col, row] = key.split(",").map(Number);
    objects.push({
      id: uid(),
      classname: state.floorClass,
      x: col * G + G / 2,
      y: 0,
      z: row * G + G / 2,
      yaw: 0, pitch: 0, roll: 0, scale: 1,
    });
  }

  // Wall edges
  for (const eKey of state.walls) {
    const [type, rest] = eKey.split(":");
    const [a, b] = rest.split(",").map(Number);

    if (type === "h") {
      walls.push({
        id: uid(),
        classname: state.wallClass,
        x1: a * G,       y1: 0, z1: b * G,
        x2: (a + 1) * G, y2: 0, z2: b * G,
      });
    } else {
      walls.push({
        id: uid(),
        classname: state.wallClass,
        x1: a * G, y1: 0, z1: b * G,
        x2: a * G, y2: 0, z2: (b + 1) * G,
      });
    }
  }

  return { walls, objects };
}
