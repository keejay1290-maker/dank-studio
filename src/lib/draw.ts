// ─────────────────────────────────────────────────────────────────────────────
// DANK STUDIO — Core Draw Helpers
//
// DayZ coordinate system: X = East, Y = Up, Z = North (left-handed)
// Yaw 0 = facing North (+Z). Increases clockwise: 90=East, 180=South, 270=West
//
// drawWall   — panels along a straight line, flush with no gaps
// drawRing   — panels around a circle, tangent to the ring
// drawDisk   — fills a flat disk with concentric rings
// drawRect   — four-sided rectangular enclosure
// drawSphere — sphere surface with correct yaw+pitch and zero gaps
// drawDome   — upper hemisphere only (phi 0 → π/2)
// ─────────────────────────────────────────────────────────────────────────────
import type { Point3D } from "./types";
import { getObjectWidth, getObjectDef, MAX_OBJECTS } from "./constants";

const DEFAULT_WALL = "staticobj_castle_wall3";
const DEFAULT_W    = 8;

// ─────────────────────────────────────────────────────────────────────────────
// drawWall
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Place wall panels from (x1,y1,z1) to (x2,y2,z2).
 * Uses kingalobar wall-maker approach: round to nearest panel count then
 * scale each panel so they fill the wall perfectly with no gaps.
 */
export function drawWall(
  pts:       Point3D[],
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number,
  wallClass: string | number = DEFAULT_WALL,
) {
  const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (len < 0.01) return;

  let name   = DEFAULT_WALL;
  let panelW = DEFAULT_W;
  if (typeof wallClass === "string") {
    name   = wallClass;
    panelW = getObjectWidth(wallClass);
  } else if (typeof wallClass === "number") {
    panelW = wallClass;
  }

  const yaw   =  Math.atan2(dx, dz) * 180 / Math.PI + 90;
  const pitch = -Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)) * 180 / Math.PI;
  const nPanels = Math.max(1, Math.round(len / panelW));
  const scale   = (len / nPanels) / panelW;

  for (let i = 0; i < nPanels; i++) {
    const t = (i + 0.5) / nPanels;
    pts.push({
      x: x1 + dx * t,
      y: y1 + dy * t,
      z: z1 + dz * t,
      yaw,
      pitch: Math.abs(pitch) > 0.5 ? pitch : undefined,
      scale: Math.abs(scale - 1) > 0.01 ? +scale.toFixed(4) : undefined,
      name,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// drawRing
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Place panels around a horizontal circle, each tangent to the ring.
 * Uses floor() so scale is always ≥ 1 — panels always overlap, never gap.
 */
export function drawRing(
  pts: Point3D[],
  cx: number, cy: number, cz: number,
  r:  number,
  wallClass: string | number = DEFAULT_WALL,
) {
  if (r <= 0) return;

  let name   = DEFAULT_WALL;
  let panelW = DEFAULT_W;
  if (typeof wallClass === "string") { name = wallClass; panelW = getObjectWidth(wallClass); }
  else if (typeof wallClass === "number") panelW = wallClass;

  const circ    = 2 * Math.PI * r;
  // floor() → scale always ≥ 1 → no horizontal gaps ever
  const nPanels = Math.max(4, Math.floor(circ / panelW));
  const arcStep = (2 * Math.PI) / nPanels;
  const scale   = (circ / nPanels) / panelW;

  for (let i = 0; i < nPanels; i++) {
    const a   = (i + 0.5) * arcStep;
    const yaw = -a * 180 / Math.PI + 90;
    pts.push({
      x: cx + r * Math.cos(a),
      y: cy,
      z: cz + r * Math.sin(a),
      yaw,
      scale: Math.abs(scale - 1) > 0.01 ? +scale.toFixed(4) : undefined,
      name,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// drawDisk
// ─────────────────────────────────────────────────────────────────────────────
export function drawDisk(
  pts: Point3D[],
  cx: number, cy: number, cz: number,
  maxR: number,
  wallClass: string | number = DEFAULT_WALL,
) {
  const panelW = typeof wallClass === "number" ? wallClass : getObjectWidth(wallClass as string);
  for (let r = panelW; r <= maxR; r += panelW) {
    drawRing(pts, cx, cy, cz, r, wallClass);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// drawRect
// ─────────────────────────────────────────────────────────────────────────────
export function drawRect(
  pts: Point3D[],
  cx: number, cy: number, cz: number,
  hw: number, hd: number,
  wallClass: string | number = DEFAULT_WALL,
) {
  drawWall(pts, cx - hw, cy, cz - hd,  cx + hw, cy, cz - hd, wallClass);
  drawWall(pts, cx + hw, cy, cz - hd,  cx + hw, cy, cz + hd, wallClass);
  drawWall(pts, cx + hw, cy, cz + hd,  cx - hw, cy, cz + hd, wallClass);
  drawWall(pts, cx - hw, cy, cz + hd,  cx - hw, cy, cz - hd, wallClass);
}

// ─────────────────────────────────────────────────────────────────────────────
// drawSphere
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Place panels across the full surface of a sphere. Zero-gap tiling:
 *
 *  • Ring step uses panel HEIGHT (vertical dimension), not face width.
 *    e.g. CNC8 (8 m wide × 3 m tall): step = 2.4 m → rings overlap 20%
 *    — this compensates for curved-surface edge divergence.
 *
 *  • Each ring uses Math.floor(circ/panelW) panels so scale ≥ 1.
 *    Panels are always slightly wider than the arc gap → no seam lines.
 *
 *  • Polar caps: a flat panel (pitch=±90°) caps each pole.
 *
 * Rotation conventions (DayZ left-handed, Y-up):
 *   yaw   = atan2(x, z) * 180/π   → panel faces radially outward in XZ plane
 *   pitch = (phi - π/2) * 180/π   → tilts face to point outward at latitude phi
 *     phi=0  (N pole) → pitch=-90  (lies flat, faces up)
 *     phi=π/2 (equator) → pitch=0  (stands vertical)
 *     phi=π  (S pole) → pitch=+90  (lies flat, faces down)
 */
export function drawSphere(
  pts:       Point3D[],
  cx: number, cy: number, cz: number,
  r:         number,
  wallClass: string | number = DEFAULT_WALL,
) {
  const panelW = typeof wallClass === "number" ? wallClass : getObjectWidth(wallClass as string);
  // Use panel HEIGHT for ring spacing — not face width.
  // CNC8: h=3 m → step=2.4 m (20% overlap). IND10: h=10 m → step=8 m.
  const panelH  = typeof wallClass === "string"
    ? (getObjectDef(wallClass)?.height ?? panelW)
    : panelW;
  const ringStep = panelH * 0.75;   // 25% vertical overlap — guarantees flush   // 20% vertical overlap for gap-free coverage
  const nRings   = Math.max(6, Math.round((Math.PI * r) / ringStep));
  const wallName = typeof wallClass === "string" ? wallClass : DEFAULT_WALL;

  // North polar cap
  pts.push({ x: cx, y: cy + r, z: cz, yaw: 0, pitch: -90, name: wallName });

  for (let i = 1; i < nRings; i++) {
    const phi    = (i / nRings) * Math.PI;
    const sinP   = Math.sin(phi);
    const ringR  = r * sinP;
    // Skip rings too small to fit 4 full-width panels — stops scale<1 gaps near poles
    if (2 * Math.PI * ringR < panelW * 4) continue;

    const ringY   = r * Math.cos(phi);
    const circ    = 2 * Math.PI * ringR;
    // floor() → scale always ≥ 1 → panels overlap slightly → no seam lines
    const nPanels = Math.max(4, Math.floor(circ / panelW));
    const arcStep = (2 * Math.PI) / nPanels;
    const scale   = (circ / nPanels) / panelW;
    const pitch   = (phi - Math.PI / 2) * 180 / Math.PI;

    for (let j = 0; j < nPanels; j++) {
      const theta = (j + 0.5) * arcStep;
      const x     = cx + ringR * Math.cos(theta);
      const z     = cz + ringR * Math.sin(theta);
      const yaw   = Math.atan2(x - cx, z - cz) * 180 / Math.PI;

      pts.push({
        x, y: cy + ringY, z,
        yaw,
        pitch: +pitch.toFixed(2),
        scale: Math.abs(scale - 1) > 0.005 ? +scale.toFixed(4) : undefined,
        name: wallName,
      });
    }
  }

  // South polar cap
  pts.push({ x: cx, y: cy - r, z: cz, yaw: 0, pitch: 90, name: wallName });
}

// ─────────────────────────────────────────────────────────────────────────────
// drawDome
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Upper hemisphere only (phi from 0 to π/2).
 * Same gap-free algorithm as drawSphere.
 * The equatorial ring at phi=π/2 (pitch=0) forms the base — sits at cy.
 */
export function drawDome(
  pts:       Point3D[],
  cx: number, cy: number, cz: number,
  r:         number,
  wallClass: string | number = DEFAULT_WALL,
) {
  const panelW  = typeof wallClass === "number" ? wallClass : getObjectWidth(wallClass as string);
  const panelH  = typeof wallClass === "string"
    ? (getObjectDef(wallClass)?.height ?? panelW)
    : panelW;
  const ringStep = panelH * 0.75;   // 25% vertical overlap — guarantees flush
  const nRings   = Math.max(4, Math.round(((Math.PI / 2) * r) / ringStep));
  const wallName = typeof wallClass === "string" ? wallClass : DEFAULT_WALL;

  // North polar cap
  pts.push({ x: cx, y: cy + r, z: cz, yaw: 0, pitch: -90, name: wallName });

  for (let i = 1; i <= nRings; i++) {
    const phi    = (i / nRings) * (Math.PI / 2);
    const sinP   = Math.sin(phi);
    const ringR  = r * sinP;
    if (ringR < panelW * 0.15) continue;

    const ringY   = r * Math.cos(phi);
    const circ    = 2 * Math.PI * ringR;
    const nPanels = Math.max(4, Math.floor(circ / panelW));
    const arcStep = (2 * Math.PI) / nPanels;
    const scale   = (circ / nPanels) / panelW;
    const pitch   = (phi - Math.PI / 2) * 180 / Math.PI;

    for (let j = 0; j < nPanels; j++) {
      const theta = (j + 0.5) * arcStep;
      const x     = cx + ringR * Math.cos(theta);
      const z     = cz + ringR * Math.sin(theta);
      const yaw   = Math.atan2(x - cx, z - cz) * 180 / Math.PI;

      pts.push({
        x, y: cy + ringY, z,
        yaw,
        pitch: +pitch.toFixed(2),
        scale: Math.abs(scale - 1) > 0.005 ? +scale.toFixed(4) : undefined,
        name: wallName,
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// drawSphereBudgeted
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Draw a sphere that fits inside an object budget by auto-picking the largest
 * panel class from `candidates` whose estimated count is ≤ budget.
 *
 * Estimate formula (derived from ∫sin φ dφ × 2πr/panelW × πr/ringStep):
 *     total ≈ 5 · π · r² / (panelW · panelH · 0.75)  ≈ 20.9 r² / (W·H)
 *
 * Returns the classname chosen (useful for matching decorations).
 */
export function drawSphereBudgeted(
  pts:        Point3D[],
  cx: number, cy: number, cz: number,
  r:          number,
  budget:     number,
  candidates: string[] = [
    "staticobj_wall_indcnc_10",     // 8.75 × 10  — biggest (5× coverage)
    "staticobj_wall_indcnc4_8",     // 8.00 × 8
    "staticobj_wall_indcnch_10",    // 8.75 × 5
    "staticobj_wall_stone",         // 8.00 × 3.5
    "staticobj_wall_cncsmall_8",    // 8.00 × 3
  ],
): string {
  for (const c of candidates) {
    const def = getObjectDef(c);
    if (!def) continue;
    const est = (20.9 * r * r) / (def.width * def.height);
    if (est <= budget) {
      drawSphere(pts, cx, cy, cz, r, c);
      return c;
    }
  }
  // None fit — use largest and let caller/applyLimit deal with it
  const fallback = candidates[0];
  drawSphere(pts, cx, cy, cz, r, fallback);
  return fallback;
}

// ─────────────────────────────────────────────────────────────────────────────
// applyLimit
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Trim to object limit. For gap-sensitive geometry (spheres, domes) sub-sampling
 * creates visible holes — generators should use drawSphereBudgeted to AVOID
 * hitting this. applyLimit is only a last-resort safety net.
 */
export function applyLimit(pts: Point3D[], limit = MAX_OBJECTS): Point3D[] {
  if (pts.length <= limit) return pts;
  const step = pts.length / limit;
  return Array.from({ length: limit }, (_, i) => pts[Math.floor(i * step)]);
}
