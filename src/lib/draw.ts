// ─────────────────────────────────────────────────────────────────────────────
// DANK STUDIO — Core Draw Helpers
//
// DayZ coordinate system: X = East, Y = Up, Z = North (left-handed)
// Yaw 0 = facing North (+Z). Increases clockwise: 90=East, 180=South, 270=West
//
// drawWall  — places panels along a straight line, flush with no gaps
// drawRing  — places panels around a circle, tangent to the ring
// drawDisk  — fills a flat disk with concentric rings
// ─────────────────────────────────────────────────────────────────────────────
import type { Point3D } from "./types";
import { getObjectWidth, MAX_OBJECTS } from "./constants";

// Default wall class used when none is specified
const DEFAULT_WALL = "staticobj_castle_wall3";
const DEFAULT_W    = 8; // metres — castle_wall3 face width

/**
 * Place wall panels from (x1,y1,z1) to (x2,y2,z2).
 *
 * HOW SPACING WORKS (mirrors the kingalobar wall-maker approach):
 *   1. Measure the wall length in metres.
 *   2. Round to nearest integer panel count (not ceil — avoids over-dense placement).
 *   3. Scale each panel slightly so they fill the wall perfectly with no gaps.
 *      objectScale = requiredSegmentLength / objectWidth
 *      (panels scale by at most ~0–15% in practice — invisible in-game)
 *
 * @param wallClass  DayZ class name — width is looked up from OBJECT_CATALOGUE.
 *                   Pass a number to override spacing explicitly (legacy).
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

  // --- determine panel width & name ---
  let name      = DEFAULT_WALL;
  let panelW    = DEFAULT_W;
  if (typeof wallClass === "string") {
    name   = wallClass;
    panelW = getObjectWidth(wallClass);
  } else if (typeof wallClass === "number") {
    panelW = wallClass;              // explicit spacing override
  }

  // --- yaw & pitch of this wall segment ---
  const yaw   =  Math.atan2(dx, dz) * 180 / Math.PI + 90;
  const pitch = -Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)) * 180 / Math.PI;

  // --- how many panels fit? ---
  const nPanels = Math.max(1, Math.round(len / panelW));
  const scale   = (len / nPanels) / panelW; // near-1.0 fill scale

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

/**
 * Place panels around a circle, each tangent to the ring.
 * Produces perfectly flush rings — circumference / panelWidth panels, scaled to fit.
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
  const nPanels = Math.max(4, Math.round(circ / panelW));
  const arcStep = (2 * Math.PI) / nPanels;
  const scale   = (circ / nPanels) / panelW;

  for (let i = 0; i < nPanels; i++) {
    const a   = (i + 0.5) * arcStep;
    const yaw = -a * 180 / Math.PI + 90;          // tangent to ring
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

/**
 * Fill a horizontal disk with concentric rings.
 */
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

/**
 * Place a rectangular ring of walls (4 sides).
 * hw = half-width (X), hd = half-depth (Z).
 * wallClass applied to all 4 sides.
 */
export function drawRect(
  pts: Point3D[],
  cx: number, cy: number, cz: number,
  hw: number, hd: number,
  wallClass: string | number = DEFAULT_WALL,
) {
  drawWall(pts, cx - hw, cy, cz - hd,  cx + hw, cy, cz - hd, wallClass); // North
  drawWall(pts, cx + hw, cy, cz - hd,  cx + hw, cy, cz + hd, wallClass); // East
  drawWall(pts, cx + hw, cy, cz + hd,  cx - hw, cy, cz + hd, wallClass); // South
  drawWall(pts, cx - hw, cy, cz + hd,  cx - hw, cy, cz - hd, wallClass); // West
}

/**
 * Place panels along the surface of a sphere.
 * Fixes the Death Star problem: every panel gets correct yaw AND pitch.
 *
 * yaw   = atan2(x, z)  → panel faces outward in XZ plane
 * pitch = (phi - π/2) * 180/π  → tilts panel to face outward at all latitudes
 *   phi=0  (north pole): pitch = -90°  (lies flat, roof tile)
 *   phi=90 (equator):    pitch =   0°  (stands vertical)
 */
export function drawSphere(
  pts:      Point3D[],
  cx: number, cy: number, cz: number,
  r:        number,
  wallClass: string | number = DEFAULT_WALL,
) {
  const panelW  = typeof wallClass === "number" ? wallClass : getObjectWidth(wallClass as string);
  const ringStep = panelW * 0.95;           // slight overlap for no gaps
  const nRings   = Math.max(6, Math.round((Math.PI * r) / ringStep));

  for (let i = 1; i < nRings; i++) {
    const phi    = (i / nRings) * Math.PI;
    const ringR  = r * Math.sin(phi);
    if (ringR < panelW * 0.5) continue;     // skip tiny polar caps

    const ringY  = r * Math.cos(phi);
    const circ   = 2 * Math.PI * ringR;
    const nPanels = Math.max(4, Math.round(circ / panelW));
    const arcStep = (2 * Math.PI) / nPanels;
    const scale   = (circ / nPanels) / panelW;

    // pitch: rotate panel to face outward at this latitude
    const pitch = (phi - Math.PI / 2) * 180 / Math.PI;

    for (let j = 0; j < nPanels; j++) {
      const theta = (j + 0.5) * arcStep;
      const x     = cx + ringR * Math.cos(theta);
      const z     = cz + ringR * Math.sin(theta);
      const yaw   = Math.atan2(x - cx, z - cz) * 180 / Math.PI;

      pts.push({
        x, y: cy + ringY, z,
        yaw,
        pitch: +pitch.toFixed(2),
        scale: Math.abs(scale - 1) > 0.01 ? +scale.toFixed(4) : undefined,
        name: typeof wallClass === "string" ? wallClass : DEFAULT_WALL,
      });
    }
  }
}

/** Trim to object limit, preserving full silhouette by uniform sub-sampling. */
export function applyLimit(pts: Point3D[], limit = MAX_OBJECTS): Point3D[] {
  if (pts.length <= limit) return pts;
  const step = pts.length / limit;
  return Array.from({ length: limit }, (_, i) => pts[Math.floor(i * step)]);
}
