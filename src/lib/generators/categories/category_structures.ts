// AUTO-SPLIT from shapes.ts by tools/split_shapes.py — do not hand-edit headers.
// Add new generators normally inside this file; they will export through the
// shapes.ts barrel.
import type { Point3D } from "../../types";
import {
  drawWall, drawRing, drawRect, drawDisk, drawSphere, drawDome,
  drawSphereBudgeted, _drawSphereRings, applyLimit,
} from "../../draw";
import {
  CASTLE, STONE, STONE2, CNC8, CNC4, MILCNC, IND10,
  _CD, _CH, _CW, _C_PALETTE, _cpick,
} from "../_constants";
import type { GenParams } from "../_constants";

// ─────────────────────────────────────────────────────────────────────────────
// STRUCTURES
// ─────────────────────────────────────────────────────────────────────────────

//  STRUCTURES / MILITARY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🪖 BUNKER COMPLEX — Underground concrete command bunker with exploration rooms
 * Front entrance gap on south face leads into a vestibule corridor. Main interior
 * spine splits into 3 rooms via MILCNC dividers. Secondary exit on north face.
 * Solid CNC8 roof with ventilation towers.
 */
export function gen_bunker(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S     = Math.max(0.5, p.scale ?? 1);
  const step  = 2.3 * S;   // CNC8 flush row height
  const hw    = 20 * S;    // half-width (X)
  const hd    = 14 * S;    // half-depth (Z)
  const h     = 6.9 * S;   // wall height (3 rows: 3 × 2.3)
  const doorW = 4 * S;     // half-width of entrance gap
  const doorH = 2 * step;  // door height (2 rows ≈ 4.6 m)

  // Corner fills for a drawRect at (cx,cy,cz) with half-extents (w,d)
  function cornerFills(cx: number, cy: number, cz: number, w: number, d: number) {
    pts.push({ x: cx - w, y: cy, z: cz - d, yaw: 225, name: CNC8 });
    pts.push({ x: cx + w, y: cy, z: cz - d, yaw: 135, name: CNC8 });
    pts.push({ x: cx + w, y: cy, z: cz + d, yaw:  45, name: CNC8 });
    pts.push({ x: cx - w, y: cy, z: cz + d, yaw: 315, name: CNC8 });
  }

  // ── OUTER SHELL — entrance gap in south face (z = +hd) ───────────────────
  for (let y = 0; y < h; y += step) {
    // North face — solid
    drawWall(pts, -hw, y, -hd, hw, y, -hd, CNC8);
    // East face — solid
    drawWall(pts, hw, y, -hd, hw, y, hd, CNC8);
    // West face — solid
    drawWall(pts, -hw, y, hd, -hw, y, -hd, CNC8);
    // South face — gap in centre for entrance
    if (y < doorH) {
      drawWall(pts, -hw, y, hd, -doorW, y, hd, CNC8);  // west pier
      drawWall(pts,  doorW, y, hd,  hw, y, hd, CNC8);  // east pier
    } else {
      drawWall(pts, -hw, y, hd, hw, y, hd, CNC8);      // above door: full span
    }
    cornerFills(0, y, 0, hw, hd);
  }

  // North exit door frame — CNC4 panels framing a small exit
  for (let y = 0; y < doorH; y += step)
    pts.push({ x: 0, y, z: -hd - 0.5 * S, yaw: 0, name: CNC4 });

  // ── ROOF SLAB ─────────────────────────────────────────────────────────────
  drawRect(pts, 0, h, 0, hw, hd, CNC8);
  cornerFills(0, h, 0, hw, hd);

  // Roof ventilation towers
  for (const vx of [-hw * 0.4, hw * 0.4] as number[]) {
    for (let y = h + step; y < h + step + 4 * S; y += step)
      drawRing(pts, vx, y, 0, 2 * S, CNC8);
  }

  // ── ENTRANCE VESTIBULE — short corridor outside south face ────────────────
  const vestL = 6 * S;
  for (let y = 0; y < doorH; y += step) {
    drawWall(pts, -doorW, y, hd, -doorW, y, hd + vestL, CNC8);
    drawWall(pts,  doorW, y, hd,  doorW, y, hd + vestL, CNC8);
  }
  // Vestibule lintel / roof edge
  drawWall(pts, -doorW, doorH, hd,         doorW, doorH, hd,         CNC8);
  drawWall(pts, -doorW, doorH, hd + vestL, doorW, doorH, hd + vestL, CNC8);

  // ── INTERIOR WALLS — corridor spine + 3 rooms ────────────────────────────
  const divX = hw / 3;
  for (let y = 0; y < h; y += step) {
    // West room divider
    drawWall(pts, -divX, y, -hd, -divX, y, hd * 0.5, MILCNC);
    // East room divider
    drawWall(pts,  divX, y, -hd,  divX, y, hd * 0.5, MILCNC);
    // Central back wall — separates rear rooms from front corridor
    drawWall(pts, -divX, y, -hd * 0.3, divX, y, -hd * 0.3, MILCNC);
  }

  return applyLimit(pts, 1100);
}

/**
 * 🏛️ THE PENTAGON — US Department of Defense HQ, Arlington, Virginia (1943)
 * Five concentric pentagonal rings of 5-storey office buildings (rings E→A,
 * outer to inner), separated by open courtyards and connected by 10 radial
 * spoke corridors. Largest office building in the world: 6.5M sq ft.
 */
export function gen_pentagon(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const r     = p.r ?? 80;
  const stp   = 9.758;   // IND10 flush row height — bigger panels, cleaner readable silhouette
  const rings = 5;
  const bldgH = stp * 2;  // 2 IND10 stories per ring = ~19.5m, matches the 5-story real building

  // Five concentric pentagonal rings (E = outer, A = inner)
  for (let ri = 0; ri < rings; ri++) {
    const rr = r * (1 - ri * 0.16);
    for (let i = 0; i < 5; i++) {
      const a1 = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const a2 = ((i + 1) / 5) * Math.PI * 2 - Math.PI / 2;
      for (let y = 0; y < bldgH; y += stp)
        drawWall(pts, rr*Math.cos(a1), y, rr*Math.sin(a1), rr*Math.cos(a2), y, rr*Math.sin(a2), IND10);
    }
    // Corner filler — one outward-facing panel at each vertex to close the 108° notch
    for (let i = 0; i < 5; i++) {
      const aV  = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const yaw = 90 - aV * 180 / Math.PI;
      for (let y = 0; y < bldgH; y += stp)
        pts.push({ x: rr * Math.cos(aV), y, z: rr * Math.sin(aV), yaw, name: IND10 });
    }
  }

  return applyLimit(pts, 1100);
}

/**
 * ⭐ STAR FORT — Vauban-style polygonal fortification (17th century)
 * Classic trace italienne design: outer star polygon of angled bastions and
 * curtain walls designed to eliminate blind spots from cannon fire.
 * Exemplified by Fort Bourtange (Netherlands, 1593) and Fort McHenry (USA, 1798).
 */
export function gen_star_fort(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const r     = p.r ?? 60;
  const nPts  = Math.round(p.points ?? 5);
  const inner = r * 0.62;   // concave gorge radius
  const h     = 30;         // wall height (r param controls plan size)
  const step  = 1.572;      // STONE2 flush step

  // Outer star walls — alternating bastion tips (r) and gorge corners (inner)
  for (let i = 0; i < nPts * 2; i++) {
    const a1 = (i / (nPts * 2)) * Math.PI * 2;
    const a2 = ((i + 1) / (nPts * 2)) * Math.PI * 2;
    const r1  = i % 2 === 0 ? r     : inner;
    const r2  = i % 2 === 0 ? inner : r;
    for (let y = 0; y < h; y += step)
      drawWall(pts, r1*Math.cos(a1), y, r1*Math.sin(a1), r2*Math.cos(a2), y, r2*Math.sin(a2), STONE2);
    drawWall(pts, r1*Math.cos(a1), h, r1*Math.sin(a1), r2*Math.cos(a2), h, r2*Math.sin(a2), CASTLE);
  }

  // Inner citadel ring at centre
  for (let y = 0; y < h * 0.75; y += step)
    drawRing(pts, 0, y, 0, inner * 0.45, STONE2);

  return applyLimit(pts, 1100);
}

/**
 * 🏟️ ARENA FORT — Circular curtain-wall fortification with projecting towers
 * Round medieval/Roman-style fortified compound: IND10 curtain wall ring with
 * CASTLE battlements, four D-shaped projecting towers at the cardinal points,
 * and a circular inner keep at the centre.
 */
export function gen_arena_fort(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const r     = p.r ?? 50;
  const h     = 16;        // wall height (r param controls plan size)
  const step  = 9.758;     // IND10 flush step
  const cstep = 2.0;       // CASTLE flush step

  // Outer curtain wall
  for (let y = 0; y < h; y += step)
    drawRing(pts, 0, y, 0, r, IND10);
  drawRing(pts, 0, h, 0, r, CASTLE);

  // Four D-shaped projecting towers at cardinal points — project beyond wall
  const tR = r * 0.14;
  for (let i = 0; i < 4; i++) {
    const a  = (i / 4) * Math.PI * 2;
    const tx = r * Math.cos(a), tz = r * Math.sin(a);
    for (let y = 0; y <= h + cstep * 3; y += cstep)
      drawRing(pts, tx, y, tz, tR, CASTLE);
  }

  // Inner keep — taller central tower
  const keepR = r * 0.18;
  for (let y = 0; y < h * 1.4; y += step)
    drawRing(pts, 0, y, 0, keepR, IND10);
  drawRing(pts, 0, h * 1.4, 0, keepR, CASTLE);

  return applyLimit(pts, 1100);
}

/**
 * 🚪 GATEHOUSE — Medieval fortified gate passage
 * Twin cylindrical flanking towers with CASTLE battlements, connecting curtain
 * walls, and a pointed arch spanning the gate passage. Typical of English and
 * French medieval castle design (12th–14th century).
 */
export function gen_gatehouse(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S     = Math.max(0.5, p.scale ?? 1);
  const step  = 1.572 * S;   // STONE2 flush row height
  const cstep = 2 * S;        // CASTLE flush step
  const w     = 28 * S;       // full width between tower centres
  const h     = 20 * S;       // tower height
  const tR    = 5 * S;        // tower radius

  // Two flanking towers
  for (const tx of [-w/2, w/2]) {
    for (let y = 0; y < h; y += step)
      drawRing(pts, tx, y, 0, tR, STONE2);
    // Battlement crown
    for (let y = h; y <= h + cstep * 2; y += cstep)
      drawRing(pts, tx, y, 0, tR + 0.5*S, CASTLE);
  }

  // Gate passage walls connecting the two towers
  const passH = h * 0.65;
  for (let y = 0; y < passH; y += step) {
    drawWall(pts, -w/2 + tR, y, -3*S, -w/2 + tR, y, 3*S, STONE2);
    drawWall(pts,  w/2 - tR, y, -3*S,  w/2 - tR, y, 3*S, STONE2);
    // Junction filler panels bridging each passage wall end to its flanking tower
    pts.push({ x: -w/2 + tR, y, z: -3*S, yaw:  90, name: STONE2 }); // left-front
    pts.push({ x: -w/2 + tR, y, z:  3*S, yaw:  90, name: STONE2 }); // left-rear
    pts.push({ x:  w/2 - tR, y, z: -3*S, yaw: -90, name: STONE2 }); // right-front
    pts.push({ x:  w/2 - tR, y, z:  3*S, yaw: -90, name: STONE2 }); // right-rear
  }
  // Parapet walkway across top of passage
  for (let y = passH; y <= passH + cstep * 2; y += cstep)
    drawWall(pts, -w/2 + tR, y, 0, w/2 - tR, y, 0, CASTLE);

  // Front and rear curtain walls above the arch, connecting the two towers
  for (let y = passH; y < h; y += step) {
    drawWall(pts, -w/2, y, -3*S, w/2, y, -3*S, STONE2);
    drawWall(pts, -w/2, y,  3*S, w/2, y,  3*S, STONE2);
  }

  // Pointed arch spanning the gate (front and rear faces)
  const archW = w/2 - tR;
  const archBase = 0;
  const nArch = 10;
  for (let s = 0; s <= nArch; s++) {
    const a  = (s / nArch) * Math.PI;
    const ax = Math.cos(a) * archW;
    const ay = archBase + passH * 0.3 + Math.sin(a) * archW * 0.65;
    pts.push({ x: ax, y: ay, z: -3*S, yaw:   0, name: STONE2 });
    pts.push({ x: ax, y: ay, z:  3*S, yaw: 180, name: STONE2 });
  }

  return applyLimit(pts, 1100);
}

/**
 * 🪖 NORMANDY BUNKERS — Atlantic Wall, D-Day 1944
 * German Widerstandsnest defensive network: staggered line of Tobruk-style
 * CNC8 bunkers with stepped roofs and gun slits, backed by a second row and
 * fronted by a continuous hedge-row barbed wire barrier line.
 */
export function gen_normandy(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const spread = p.spread ?? 80;
  const step   = 2.3;   // CNC8 flush row height (no S — spread param controls scale)

  function bunker(bx: number, bz: number) {
    const hw = 8, hd = 5, bh = 6;
    for (let y = 0; y < bh; y += step)
      drawRect(pts, bx, y, bz, hw, hd, CNC8);
    // Roof slab
    drawRect(pts, bx, bh, bz, hw, hd, CNC8);
    // Stepped roof parapet
    drawRect(pts, bx, bh + step, bz, hw - 2, hd - 1, CNC8);
    // Gun slit panels facing forward (-Z)
    pts.push({ x: bx, y: bh * 0.4, z: bz - hd - 0.5, yaw: 0, name: CNC8 });
  }

  // Front row — 3 bunkers
  bunker(-spread/2, 0);
  bunker(0,         0);
  bunker( spread/2, 0);
  // Second row — 2 bunkers staggered
  bunker(-spread/3, 18);
  bunker( spread/3, 18);

  // Barbed wire barrier line in front
  for (let x = -spread/2 - 4; x <= spread/2 + 4; x += 4)
    pts.push({ x, y: 0.2, z: -14, yaw: 90, name: "staticobj_mil_hbarrier_big" });

  return applyLimit(pts, 1100);
}

export function gen_alcatraz(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];

  // ── Main cell house: long rectangle, 3 stories (IND10 = 9.758m per floor) ──
  // Real cell house: ~120m × 18m footprint
  const CELL_HW = 60, CELL_HD = 9;
  for (let y = 0; y < 3 * 9.758; y += 9.758) drawRect(pts, 0, y, 0, CELL_HW, CELL_HD, IND10);

  // ── D-block (isolation wing) — shorter rectangle extending north ──
  for (let y = 0; y < 2 * 9.758; y += 9.758) drawRect(pts, -50, y, 24, 12, 9, IND10);

  // ── B/C-block cross wings — two parallel rect wings running E-W inside main ──
  for (let y = 0; y < 2 * 9.758; y += 9.758) {
    drawRect(pts,  20, y,  0, 8, CELL_HD - 1, IND10);
    drawRect(pts, -20, y,  0, 8, CELL_HD - 1, IND10);
  }

  // ── Exercise yard: square wall enclosure attached south side ──
  // ~60m × 40m yard, single-story CNC8 perimeter wall
  const YARD_Y0 = 0;
  for (let y = YARD_Y0; y < 2 * 2.3; y += 2.3) drawRect(pts, 0, y, -50, 30, 20, CNC8);

  // ── Guard towers at 4 corners of the cell house — CNC8 rings, ~15m tall ──
  const towers = [
    { x:  62, z:  11 },
    { x: -62, z:  11 },
    { x:  62, z: -11 },
    { x: -62, z: -11 },
  ];
  for (const t of towers) {
    for (let y = 0; y <= 4 * 2.3; y += 2.3) drawRing(pts, t.x, y, t.z, 4, CNC8);
  }

  // ── Yard corner towers ──
  const yardTowers = [{ x: 32, z: -72 }, { x: -32, z: -72 }];
  for (const t of yardTowers) {
    for (let y = 0; y <= 3 * 2.3; y += 2.3) drawRing(pts, t.x, y, t.z, 4, CNC8);
  }

  // ── Water tower: tall thin drawRing near north end ──
  for (let y = 0; y <= 6 * 2.3; y += 2.3) drawRing(pts, -55, y, -20, 3, CNC8);

  // ── Industries building: low CNC8 rectangle at east end ──
  for (let y = 0; y < 2.3; y += 2.3) drawRect(pts, 70, y, 0, 10, 8, CNC8);

  // ── Hospital wing: small IND10 rectangle north-east ──
  for (let y = 0; y < 9.758; y += 9.758) drawRect(pts, 55, y, -20, 10, 7, IND10);

  return applyLimit(pts, p.n ?? 700);
}


// ═══════════════════════════════════════════════════════════════════════════════
