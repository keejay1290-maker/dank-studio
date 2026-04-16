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
  // Use ceil + explicit overlap to ensure zero-gap coverage
  const nPanels = Math.max(4, Math.ceil(circ / (panelW * 0.98))); 
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
// _drawSphereRings — shared inner loop used by drawSphere and drawDome
//
// Emits latitudinal panel rings from phiStart to phiEnd (in radians from N pole).
// Panel y is stored at object-pivot-bottom (surface_point - halfH) so that
// Preview3D's (y + h/2) centers each box exactly on the sphere surface.
//
// DayZ rotation conventions:
//   yaw   = atan2(x,z)*180/π  — panel faces radially outward in XZ plane
//   pitch = (phi-π/2)*180/π   — phi=0→-90 (flat up), φ=π/2→0 (vertical), φ=π→+90 (flat down)
// ─────────────────────────────────────────────────────────────────────────────
export function _drawSphereRings(
  pts: Point3D[],
  cx: number, cy: number, cz: number,
  r: number,
  phiStart: number, phiEnd: number,
  nRings: number,
  panelW: number, halfH: number,
  wallName: string,
) {
  for (let i = 1; i <= nRings; i++) {
    const phi   = phiStart + (i / nRings) * (phiEnd - phiStart);
    const ringR = r * Math.sin(phi);
    if (2 * Math.PI * ringR < panelW * 4) continue; // too small for ≥4 panels

    const ringY   = r * Math.cos(phi);
    const circ    = 2 * Math.PI * ringR;
    // Use ceil to force overlap and eliminate "seam" gaps in spheres
    const nPanels = Math.max(4, Math.ceil(circ / (panelW * 0.98))); 
    const arcStep = (2 * Math.PI) / nPanels;
    const scale   = (circ / nPanels) / panelW;
    const pitch   = (phi - Math.PI / 2) * 180 / Math.PI;

    for (let j = 0; j < nPanels; j++) {
      const theta = (j + 0.5) * arcStep;
      const x     = cx + ringR * Math.cos(theta);
      const z     = cz + ringR * Math.sin(theta);
      pts.push({
        x, y: cy + ringY - halfH, z,
        yaw: Math.atan2(x - cx, z - cz) * 180 / Math.PI,
        pitch: +pitch.toFixed(2),
        scale: Math.abs(scale - 1) > 0.005 ? +scale.toFixed(4) : undefined,
        name: wallName,
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// drawSphere — full sphere, gap-free tiling with 25% vertical ring overlap
// ─────────────────────────────────────────────────────────────────────────────
export function drawSphere(
  pts:       Point3D[],
  cx: number, cy: number, cz: number,
  r:         number,
  wallClass: string | number = DEFAULT_WALL,
) {
  const panelW  = typeof wallClass === "number" ? wallClass : getObjectWidth(wallClass as string);
  const panelH  = typeof wallClass === "string" ? (getObjectDef(wallClass)?.height ?? panelW) : panelW;
  const halfH   = panelH / 2;
  const nRings  = Math.max(6, Math.round((Math.PI * r) / (panelH * 0.75)));
  const wallName = typeof wallClass === "string" ? wallClass : DEFAULT_WALL;

  pts.push({ x: cx, y: cy + r - halfH, z: cz, yaw: 0, pitch: -90, name: wallName }); // N cap
  _drawSphereRings(pts, cx, cy, cz, r, 0, Math.PI, nRings, panelW, halfH, wallName);
  pts.push({ x: cx, y: cy - r - halfH, z: cz, yaw: 0, pitch: 90,  name: wallName }); // S cap
}

// ─────────────────────────────────────────────────────────────────────────────
// drawDome — upper hemisphere only (phi 0→π/2), same gap-free algorithm
// The equatorial ring (phi=π/2, pitch=0) forms the open base at cy.
// ─────────────────────────────────────────────────────────────────────────────
export function drawDome(
  pts:       Point3D[],
  cx: number, cy: number, cz: number,
  r:         number,
  wallClass: string | number = DEFAULT_WALL,
) {
  const panelW  = typeof wallClass === "number" ? wallClass : getObjectWidth(wallClass as string);
  const panelH  = typeof wallClass === "string" ? (getObjectDef(wallClass)?.height ?? panelW) : panelW;
  const halfH   = panelH / 2;
  const nRings  = Math.max(4, Math.round(((Math.PI / 2) * r) / (panelH * 0.75)));
  const wallName = typeof wallClass === "string" ? wallClass : DEFAULT_WALL;

  pts.push({ x: cx, y: cy + r - halfH, z: cz, yaw: 0, pitch: -90, name: wallName }); // N cap
  _drawSphereRings(pts, cx, cy, cz, r, 0, Math.PI / 2, nRings, panelW, halfH, wallName);
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
    "staticobj_wall_indcnc_10",     // 9.012 × 9.758 — biggest (5× coverage)
    "staticobj_wall_indcnc4_8",     // 8.044 × 3.004
    "staticobj_wall_indcnch_10",    // 9.608 × 1.113 (horizontal slab)
    "staticobj_wall_stone",         // 10.060 × 2.034
    "staticobj_wall_cncsmall_8",    // 8.008 × 2.300
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

// ─────────────────────────────────────────────────────────────────────────────
// auditSphereCoverage — objective gap validator
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Sample a unit sphere uniformly and check, for each sample, whether any
 * point in `pts` falls within `threshold` of that sample direction's ray
 * from (cx, cy, cz). Reports a coverage percentage and worst-case gap.
 *
 * Use to validate sphere-based builds (Death Star, dome, etc) aren't leaving
 * visible holes. Call from a generator and log the result.
 *
 * @param pts       panel list (already translated into world space)
 * @param cx,cy,cz  sphere center in world space
 * @param r         sphere radius
 * @param threshold angular tolerance in radians (0.05 ≈ 3° — one panel-width at R=72)
 * @param samples   sample count (2000 → ~4° grid, plenty for visual gaps)
 * @returns         { coverage, gaps, maxGapAngle, sampleCount }
 */
export function auditSphereCoverage(
  pts: Point3D[],
  cx: number, cy: number, cz: number,
  r: number,
  threshold = 0.08,
  samples = 2000,
): { coverage: number; gaps: number; maxGapAngle: number; sampleCount: number } {
  // Convert panels to unit direction vectors from center
  const dirs: Array<[number, number, number]> = [];
  for (const p of pts) {
    const dx = p.x - cx, dy = p.y - cy, dz = p.z - cz;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < r * 0.3 || len > r * 1.3) continue; // ignore non-surface panels (trenches, spokes)
    dirs.push([dx / len, dy / len, dz / len]);
  }
  if (dirs.length === 0) return { coverage: 0, gaps: samples, maxGapAngle: Math.PI, sampleCount: samples };

  // Fibonacci sphere sampling — uniform point distribution
  const phi = Math.PI * (3 - Math.sqrt(5));
  let gaps = 0;
  let maxGap = 0;
  const cosThresh = Math.cos(threshold);

  for (let i = 0; i < samples; i++) {
    const y = 1 - (i / (samples - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = phi * i;
    const sx = Math.cos(theta) * radius;
    const sz = Math.sin(theta) * radius;

    // Find nearest panel (max dot product = min angle)
    let bestDot = -1;
    for (const [dx, dy, dz] of dirs) {
      const d = sx * dx + y * dy + sz * dz;
      if (d > bestDot) bestDot = d;
    }
    if (bestDot < cosThresh) {
      gaps++;
      const ang = Math.acos(Math.max(-1, Math.min(1, bestDot)));
      if (ang > maxGap) maxGap = ang;
    }
  }

  return {
    coverage: (samples - gaps) / samples,
    gaps,
    maxGapAngle: maxGap,
    sampleCount: samples,
  };
}
