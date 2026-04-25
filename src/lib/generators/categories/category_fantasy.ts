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
// FANTASY
// ─────────────────────────────────────────────────────────────────────────────

//  FANTASY & FICTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🏰 HOGWARTS CASTLE
 * Scottish Gothic castle complex — main keep, Great Hall south wing, Astronomy Tower
 * (tallest, NE), 3 corner towers at varied heights, viaduct bridge.
 * CASTLE panels are 8m × 2m — all walls loop at 2*S step for flush coverage.
 */
export function gen_hogwarts(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S    = Math.max(0.5, p.scale ?? 1);
  const step = 2 * S;   // CASTLE panel height = 2m exact

  // Helpers ──────────────────────────────────────────────────────────────────
  function castleWalls(cx: number, cz: number, hw: number, hd: number, wallH: number) {
    for (let y = 0; y <= wallH; y += step) {
      drawRect(pts, cx, y, cz, hw, hd, CASTLE);
      pts.push({ x: cx-hw, y, z: cz-hd, yaw: 225, name: CASTLE });
      pts.push({ x: cx+hw, y, z: cz-hd, yaw: 135, name: CASTLE });
      pts.push({ x: cx+hw, y, z: cz+hd, yaw:  45, name: CASTLE });
      pts.push({ x: cx-hw, y, z: cz+hd, yaw: 315, name: CASTLE });
    }
  }
  function castleTower(cx: number, cz: number, r: number, towerH: number) {
    for (let y = 0; y <= towerH; y += step) drawRing(pts, cx, y, cz, r, CASTLE);
    // Battlement crown: two projecting rings at top
    drawRing(pts, cx, towerH + step,     cz, r + 1.5*S, CASTLE);
    drawRing(pts, cx, towerH + step*2,   cz, r + 0.5*S, CASTLE);
  }

  // ── Main castle keep — walls trimmed at each tower's tangent ─────────────
  const mhw = 28*S, mhd = 18*S, mH = 20*S;
  const rNE = 5*S, rNW = 4*S, rSW = 3.5*S, rSE = 3*S;
  for (let y = 0; y <= mH; y += step) {
    drawWall(pts, -mhw+rNW, y, -mhd,  mhw-rNE,  y, -mhd, CASTLE); // N
    drawWall(pts,  mhw,     y, -mhd+rNE, mhw,    y,  mhd-rSE, CASTLE); // E
    drawWall(pts,  mhw-rSE, y,  mhd, -mhw+rSW,   y,  mhd, CASTLE); // S
    drawWall(pts, -mhw,     y,  mhd-rSW, -mhw,   y, -mhd+rNW, CASTLE); // W
  }
  // Parapet atop keep walls — also trimmed at tower tangents
  for (let x = -mhw+rNW; x <= mhw-rNE; x += 8*S)
    pts.push({ x, y: mH+step, z: -mhd, yaw: 0,   name: CASTLE });
  for (let x = -mhw+rSW; x <= mhw-rSE; x += 8*S)
    pts.push({ x, y: mH+step, z:  mhd, yaw: 180, name: CASTLE });
  for (let z = -mhd+rNE; z <= mhd-rSE; z += 8*S)
    pts.push({ x:  mhw, y: mH+step, z, yaw: 90,  name: CASTLE });
  for (let z = -mhd+rNW; z <= mhd-rSW; z += 8*S)
    pts.push({ x: -mhw, y: mH+step, z, yaw: 270, name: CASTLE });

  // ── Great Hall — south-facing gothic wing, taller than keep ───────────────
  const ghW = 14*S, ghD = 10*S, ghH = 30*S;
  const ghZ0 = mhd, ghZ1 = mhd + ghD;
  for (let y = 0; y <= ghH; y += step) {
    drawWall(pts, -ghW, y, ghZ0,  ghW, y, ghZ0,  CASTLE);  // back (= keep's S wall, redundant OK)
    drawWall(pts,  ghW, y, ghZ0,  ghW, y, ghZ1,  CASTLE);  // east side
    drawWall(pts,  ghW, y, ghZ1, -ghW, y, ghZ1,  CASTLE);  // far end
    drawWall(pts, -ghW, y, ghZ1, -ghW, y, ghZ0,  CASTLE);  // west side
  }
  // Great Hall corner fills
  for (let y = 0; y <= ghH; y += step) {
    pts.push({ x: -ghW, y, z: ghZ0, yaw: 315, name: CASTLE }); // SW corner
    pts.push({ x:  ghW, y, z: ghZ0, yaw:  45, name: CASTLE }); // SE corner
    pts.push({ x:  ghW, y, z: ghZ1, yaw: 135, name: CASTLE }); // NE corner
    pts.push({ x: -ghW, y, z: ghZ1, yaw: 225, name: CASTLE }); // NW corner
  }

  // Gable arch on far end (gothic pointed look)
  const nGab = 8;
  for (let s = 0; s <= nGab; s++) {
    const a  = (s / nGab) * Math.PI;
    const gx = Math.cos(a) * ghW;
    const gy = ghH + Math.sin(a) * ghW * 0.5;
    pts.push({ x: gx, y: gy, z: ghZ1, yaw: 180, name: CASTLE });
    pts.push({ x: gx, y: gy, z: ghZ0, yaw: 0,   name: CASTLE });
  }

  // ── Astronomy Tower — NE corner, tallest landmark ─────────────────────────
  castleTower(mhw, -mhd, 5*S, 68*S);

  // ── Three corner towers — varied heights ──────────────────────────────────
  castleTower(-mhw, -mhd, 4*S,   52*S);   // NW — Clock Tower wing
  castleTower(-mhw,  mhd, 3.5*S, 42*S);   // SW
  castleTower( mhw,  mhd, 3*S,   36*S);   // SE

  // ── Clock Tower annex — small wing attached to NW tower ───────────────────
  const ctX = -mhw - 12*S, ctZ = -mhd;
  castleWalls(ctX, ctZ, 8*S, 6*S, 28*S);
  castleTower(ctX, ctZ, 3*S, 38*S);

  // ── Viaduct bridge — extends north from Astronomy Tower ───────────────────
  const viaLen = 45*S, viaY = 6*S;
  drawWall(pts, mhw, viaY, -mhd - 3*S, mhw, viaY, -mhd - viaLen, CASTLE);
  drawWall(pts, mhw + 3*S, viaY, -mhd, mhw + 3*S, viaY, -mhd - viaLen, CASTLE);

  return applyLimit(pts, 1100);
}

/**
 * 🏰 MINAS TIRITH — City of Kings, Gondor, Lord of the Rings
 * Seven concentric stone tiers carved into Mount Mindolluin, each tier set back
 * behind the one below. White Tower of Ecthelion crowns the 7th level.
 */
export function gen_minas_tirith(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S     = Math.max(0.25, p.scale ?? 0.5);
  const step  = 1.572;   // STONE2 flush row height — physical constant

  const tiers = 7;
  const baseR = 52 * S;       // radius of outermost tier
  const dR    = 7  * S;       // radius reduction per tier
  const tierRows = Math.max(3, Math.ceil(14 * S / step));
  const tierH   = tierRows * step;  // exact multiple → no gap

  // Seven concentric rings — each tier sits atop the previous
  for (let i = 0; i < tiers; i++) {
    const r  = baseR - i * dR;
    const y0 = i * tierH;
    // Wall rings — flush coverage guaranteed (tierH = tierRows * step exactly)
    for (let row = 0; row < tierRows; row++)
      drawRing(pts, 0, y0 + row * step, 0, r, STONE2);
    // Battlement crown immediately after last wall row
    drawRing(pts, 0, y0 + tierH, 0, r, CASTLE);
    // Inner floor: additional ring slightly smaller to suggest platform
    if (i > 0) {
      const innerR = r - 3 * S;
      if (innerR > 2 * S) drawRing(pts, 0, y0, 0, innerR, STONE2);
    }
  }

  // White Tower of Ecthelion — starts from top of 7th tier, very slender spire
  const tBase = tiers * tierH;
  const tH    = 50 * S;   // taller than before
  const tRows = Math.floor(tH / step);
  for (let row = 0; row < tRows; row++) {
    const t = row / tRows;
    const r = (6 * S) * (1 - t * 0.88);  // tapers from 6*S to ~0.72*S
    if (r > 0.3 * S) drawRing(pts, 0, tBase + row * step, 0, r, STONE2);
  }
  // Spire crown
  const spireBase = tBase + tH;
  for (let row = 0; row < 4; row++)
    drawRing(pts, 0, spireBase + row * 2.3 * S, 0, 0.8 * S, CNC4);

  return applyLimit(pts, 1100);
}

/**
 * 🏯 HELM'S DEEP — The Hornburg, Rohan, Lord of the Rings
 * Ancient fortress in the White Mountains: the Deeping Wall (long curtain wall),
 * Hornburg (great circular keep on a rock), and Deeping Tower at the east end.
 */
export function gen_helms_deep(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S     = Math.max(0.25, p.scale ?? 0.5);
  const step  = 1.572;   // STONE2 flush row height — physical constant
  const cstep = 2.0;     // CASTLE flush row height — physical constant

  const wallL = 60 * S;
  const wallH = 12 * S;
  const hx    = -wallL/2 - 14*S;   // Hornburg centre X
  const hornR = 9 * S;              // Hornburg radius

  // ── Deeping Wall — dual-face with end caps ───────────────────────────────
  for (let y = 0; y < wallH; y += step) {
    drawWall(pts, -wallL/2, y,     0, wallL/2, y,     0, STONE2); // front face
    drawWall(pts, -wallL/2, y, 4*S, wallL/2, y, 4*S, STONE2); // rear face
    drawWall(pts, -wallL/2, y,     0, -wallL/2, y, 4*S, STONE2); // west end cap
    drawWall(pts,  wallL/2, y,     0,  wallL/2, y, 4*S, STONE2); // east end cap
  }
  drawWall(pts, -wallL/2, wallH,     0, wallL/2, wallH,     0, CASTLE); // front battlement
  drawWall(pts, -wallL/2, wallH, 4*S, wallL/2, wallH, 4*S, CASTLE); // rear battlement

  // West connector — bridges gap between wall end and Hornburg east perimeter
  for (let y = 0; y < wallH; y += step)
    drawWall(pts, hx + hornR, y, 0, -wallL/2, y, 0, STONE2);
  drawWall(pts, hx + hornR, wallH, 0, -wallL/2, wallH, 0, CASTLE);

  // Wall interval towers — 3 evenly spaced
  for (const tx of [-wallL/3, 0, wallL/3]) {
    for (let y = 0; y <= wallH + cstep; y += cstep)
      drawRing(pts, tx, y, 0, 3*S, CASTLE);
  }

  // ── Hornburg — large circular fortress at west end ────────────────────────
  const hornH = 20 * S;
  for (let y = 0; y < hornH; y += step)
    drawRing(pts, hx, y, 0, 9*S, STONE2);
  drawRing(pts, hx, hornH, 0, 9*S, CASTLE);
  // Inner keep tower (taller, at Hornburg centre)
  for (let y = 0; y < hornH + 10*S; y += cstep)
    drawRing(pts, hx, y, 0, 4*S, CASTLE);

  // ── Deeping Tower — circular tower at east end of wall ───────────────────
  const dtx = wallL/2 + 4*S;
  for (let y = 0; y < wallH + 6*S; y += step)
    drawRing(pts, dtx, y, 0, 5*S, STONE2);
  drawRing(pts, dtx, wallH + 6*S, 0, 5*S, CASTLE);

  // ── Helm's Gate — raised gate tower above wall centre ────────────────────
  for (let y = wallH; y < wallH + 8*S; y += cstep)
    drawRing(pts, 0, y, 0, 3*S, CASTLE);

  return applyLimit(pts, 1100);
}

/**
 * 🧱 THE WALL — Night's Watch, Game of Thrones
 * Colossal ice fortification stretching across the northern border of Westeros,
 * 213m tall (game-scaled to 60m). Garrisoned by 19 castles, chief among them
 * Castle Black, with roads wide enough for 12 men abreast along the summit.
 */
export function gen_the_wall(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const L   = p.length ?? 200;
  const h   = 60;          // game-scaled height
  const stp = 9.758;       // IND10 flush row height

  // Front and rear ice faces
  for (let y = 0; y < h; y += stp) {
    drawWall(pts, -L/2, y, 0, L/2, y, 0,   IND10);
    drawWall(pts, -L/2, y, 4, L/2, y, 4,   IND10);
  }
  // Battlements along top
  drawWall(pts, -L/2, h, 0, L/2, h, 0, CASTLE);
  drawWall(pts, -L/2, h, 4, L/2, h, 4, CASTLE);

  // Night's Watch waycastles — small CASTLE towers projecting above parapet
  const spacing = Math.max(40, L / 5);
  for (let x = -L/2 + spacing * 0.5; x < L/2; x += spacing) {
    for (let y = h; y < h + 14; y += 2)
      drawRect(pts, x, y, 2, 6, 6, CASTLE);
  }

  return applyLimit(pts, 1100);
}

/**
 * 🏚️ AZKABAN PRISON — Wizarding World, Harry Potter
 * Remote sea fortress on a rocky North Sea island. Triangular dark stone keep,
 * three corner watchtowers, and a central tapering dark spire housing the
 * Dementor cells. Escaped prisoners include Sirius Black (1993).
 */
export function gen_azkaban(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S    = Math.max(0.25, p.scale ?? 0.5);
  const step = 9.758 * S;   // IND10 flush row height
  const r    = 28 * S;
  const keepH = 50 * S;

  // Triangular keep — 3 sides of dark industrial stone
  for (let i = 0; i < 3; i++) {
    const a1 = (i / 3) * Math.PI * 2;
    const a2 = ((i + 1) / 3) * Math.PI * 2;
    for (let y = 0; y < keepH; y += step)
      drawWall(pts, r*Math.cos(a1), y, r*Math.sin(a1), r*Math.cos(a2), y, r*Math.sin(a2), IND10);
  }
  // Corner watchtowers at each triangle vertex
  for (let i = 0; i < 3; i++) {
    const a  = (i / 3) * Math.PI * 2;
    const tx = r * Math.cos(a), tz = r * Math.sin(a);
    for (let y = 0; y < keepH + 12*S; y += 2.3*S)
      drawRing(pts, tx, y, tz, 3*S, CNC8);
  }
  // Central spire — tapers from r=5*S to 0 over 40*S
  const spireH = 40 * S;
  for (let y = keepH; y < keepH + spireH; y += step) {
    const t = (y - keepH) / spireH;
    const rr = 5 * S * (1 - t);
    if (rr > 0.3 * S) drawRing(pts, 0, y, 0, rr, IND10);
  }

  return applyLimit(pts, 1100);
}

/**
 * 👁️ EYE OF SAURON
 * Barad-dûr tower crown, Lord of the Rings.
 * Tall tapered dark tower (IND10), two flanking horn spires, fiery pupil slit
 * (barrel_red ellipse at crown), and a ring of CNC8 battlements at the summit.
 */
export function gen_eye_of_sauron(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S  = Math.max(0.5, p.scale ?? 1);
  const rB = 20 * S;   // base radius
  const h  = 90 * S;   // tower height
  const step = 9.758;  // IND10 panel height — physical constant, never S-scaled

  // ── Main tower — tapers from rB at base to rTop at crown ──────────────────
  for (let y = 0; y < h; y += step) {
    const t = y / h;
    const r = rB * (1 - t * 0.65);   // tapers to 35% of base radius
    drawRing(pts, 0, y, 0, r, IND10);
  }

  // ── Battlements / crown platform at top ───────────────────────────────────
  const crownY = h;
  const crownR = rB * 0.36;
  for (let di = 0; di <= 2; di++) drawRing(pts, 0, crownY + di*2.3*S, 0, crownR + di*1.5*S, CNC8);

  // ── Two flanking horn spires (the "lids" of the Eye) ──────────────────────
  // One N (+Z), one S (-Z), angled outward and upward.
  // Use solid MILCNC rings placed along the spire arc path — no gap-prone drawWall segments.
  const nSeg = 12;
  for (let side = 0; side < 2; side++) {
    const sz = side === 0 ? 1 : -1;
    for (let seg = 0; seg < nSeg; seg++) {
      const t  = seg / nSeg;
      const z0 = sz * (crownR + t * 18*S);
      const y0 = crownY + t * 30*S;
      const r0 = Math.max(0.3*S, (3 - t * 2.6) * S);
      drawRing(pts, 0, y0, z0, r0, MILCNC);
    }
  }

  // ── The Eye — upright vertical arches + horizontal glow ring ─────────────────
  //
  // Two perpendicular eyelid arches (XY plane and ZY plane) make the eye visible
  // from all four horizontal approach directions. A wide horizontal iris ring
  // is visible from above and from angled ground-level views.
  //
  // Orientation: wide E-W (X axis), narrow N-S (Z axis) — classic cat-eye slit.
  // Spires sweep out to N/S (+Z/-Z) framing the eye from those sides.
  const eyeBase = crownY + 20 * S;
  const eyeW    = rB * 0.92;       // half-span east-west (nearly as wide as tower base)
  const eyeH    = rB * 0.70;       // upper eyelid arch height above centre
  const eyeD    = rB * 0.20;       // narrow cat-eye depth (N-S)
  const nLid    = 12;              // barrel count per arch half

  // 1. Horizontal iris glow ring — outward-facing, wide X narrow Z
  //    Visible from above and from diagonal ground angles.
  const nGlow = 24;
  for (let i = 0; i < nGlow; i++) {
    const a = (i / nGlow) * Math.PI * 2;
    pts.push({
      x:   Math.cos(a) * eyeW,
      y:   eyeBase,
      z:   Math.sin(a) * eyeD,
      yaw: 90 - a * 180 / Math.PI,   // outward-facing (radial, not tangential)
      name: "barrel_red",
    });
  }

  // 2. Upper eyelid arch — in the XY plane, facing ±Z (visible from N/S approach)
  //    Arcs from east rim to west rim over the top of the eye.
  for (let i = 0; i <= nLid; i++) {
    const a  = (i / nLid) * Math.PI;
    const bx = Math.cos(a) * eyeW;
    const by = eyeBase + Math.sin(a) * eyeH;
    pts.push({ x: bx, y: by, z: -0.4*S, yaw:   0, name: "barrel_red" }); // faces +Z
    pts.push({ x: bx, y: by, z:  0.4*S, yaw: 180, name: "barrel_red" }); // faces -Z
  }

  // 3. Lower eyelid arch — shallower curve below centre (the bottom lid)
  for (let i = 0; i <= nLid; i++) {
    const a  = (i / nLid) * Math.PI;
    const bx = Math.cos(a) * eyeW;
    const by = eyeBase - Math.sin(a) * eyeH * 0.38;
    pts.push({ x: bx, y: by, z: -0.4*S, yaw:   0, name: "barrel_red" });
    pts.push({ x: bx, y: by, z:  0.4*S, yaw: 180, name: "barrel_red" });
  }

  // 4. Upper eyelid arch — in the ZY plane, facing ±X (visible from E/W approach)
  for (let i = 0; i <= nLid; i++) {
    const a  = (i / nLid) * Math.PI;
    const bz = Math.cos(a) * eyeD;
    const by = eyeBase + Math.sin(a) * eyeH;
    pts.push({ x: -0.4*S, y: by, z: bz, yaw: -90, name: "barrel_red" }); // faces -X
    pts.push({ x:  0.4*S, y: by, z: bz, yaw:  90, name: "barrel_red" }); // faces +X
  }

  // 5. Lower eyelid arch — ZY plane
  for (let i = 0; i <= nLid; i++) {
    const a  = (i / nLid) * Math.PI;
    const bz = Math.cos(a) * eyeD;
    const by = eyeBase - Math.sin(a) * eyeH * 0.38;
    pts.push({ x: -0.4*S, y: by, z: bz, yaw: -90, name: "barrel_red" });
    pts.push({ x:  0.4*S, y: by, z: bz, yaw:  90, name: "barrel_red" });
  }

  // 6. Vertical pupil slit — barrel column at exact centre, spanning eye height
  const nPupil = 8;
  for (let i = 0; i < nPupil; i++) {
    const py = eyeBase - eyeH * 0.32 + (i / (nPupil - 1)) * eyeH * 0.64;
    pts.push({ x: 0, y: py, z: 0, yaw: 0, name: "barrel_red" });
  }

  return applyLimit(pts, 1100);
}

/**
 * 🔷 FORTRESS OF SOLITUDE — Superman's Arctic Sanctuary, DC Comics
 * Isolated ice palace in the Arctic, formed from giant white crystal spires
 * that Superman's father Jor-El designed to grow from Kryptonian technology.
 * Outer ring of 6 tall spires, inner ring of 4 medium spires, central mega-spire.
 */
export function gen_fortress_solitude(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S    = Math.max(0.25, p.scale ?? 0.5);
  const step = 1.572;  // STONE2 flush row height — physical constant

  function crystal(cx: number, cz: number, rBase: number, h: number) {
    for (let y = 0; y < h; y += step) {
      const r = rBase * (1 - (y / h) * 0.9);  // taper to 10% at peak
      if (r > 0.3 * S) drawRing(pts, cx, y, cz, r, STONE2);
    }
  }

  // Outer ring — 6 tall crystals
  const outerR = 36 * S;
  const outerH = [55, 42, 64, 38, 52, 46].map(v => v * S);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    crystal(Math.cos(a) * outerR, Math.sin(a) * outerR, 5 * S, outerH[i]);
  }

  // Inner ring — 4 medium crystals, rotated 45°
  const innerR = 17 * S;
  const innerH = [30, 26, 34, 28].map(v => v * S);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    crystal(Math.cos(a) * innerR, Math.sin(a) * innerR, 3.5 * S, innerH[i]);
  }

  // Central mega-spire
  crystal(0, 0, 9 * S, 75 * S);

  return applyLimit(pts, 1100);
}


// ═══════════════════════════════════════════════════════════════════════════════
//  IRON THRONE — Game of Thrones
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * 🗡️ IRON THRONE
 *
 * Towering, jagged seat of power. Silhouette: wide tiered base → deep seat
 * cavity with forward armrests → narrow backrest → radiating fan of vertical
 * sword-spines (pier_tube_small + pier_tube_big) at the crown.
 *
 * Faces South (-Z). Fan radiates behind (+Z) and upward.
 *
 * Materials (P3D-verified):
 *  STONE  = staticobj_wall_stone       10.060 × 2.034 × 1.950
 *  STONE2 = staticobj_wall_stone2       9.408 × 1.572 × 1.452
 *  CNC4   = staticobj_wall_cncsmall_4   4.017 × 2.324 × 0.538
 *  TUBE_S = staticobj_pier_tube_small   0.833 × 13.000 × 0.850 (vertical)
 *  TUBE_B = staticobj_pier_tube_big     1.077 × 19.950 × 1.077 (vertical)
 */
export function gen_iron_throne(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, Math.min(2, p.scale ?? 1));

  // Fixed physical heights (NEVER scale)
  const STH  = 2.034;  // STONE row height
  const S2H  = 1.572;  // STONE2 row height
  const C4H  = 2.324;  // CNC4 row height

  const TUBE_S = "staticobj_pier_tube_small"; // 13m tall vertical spike
  const TUBE_B = "staticobj_pier_tube_big";   // 20m tall vertical spike

  // ── Module 1: Tiered Base — 3 STONE steps ─────────────────────────────────
  const BHX = 9 * S;    // base half-width  (front face is widest)
  const BHZ = 7 * S;    // base half-depth
  for (let t = 0; t < 3; t++) {
    const shrink = t * 1.2 * S;
    drawRect(pts, 0, t * STH, 0, BHX - shrink, BHZ - shrink, STONE);
  }
  const seatY = 3 * STH;  // 6.1m — platform top

  // ── Module 2: Seat Cavity — STONE2 armrests + back wall ───────────────────
  const armHX = 4.5 * S;   // armrest inner edge X
  const seatFZ = -BHZ;     // seat front Z edge (facing viewer)
  const seatBZ =  BHZ - 1.2 * S;  // seat rear Z

  // Armrests: 2 STONE2 rows each side, extending forward past the base
  const armFZ = seatFZ - 4 * S;
  for (let r = 0; r < 2; r++) {
    const y = seatY + r * S2H;
    for (const side of [-1, 1] as const) {
      drawWall(pts, side * armHX, y, seatBZ, side * armHX, y, armFZ, STONE2);
    }
  }

  // Seat back wall (the base of the backrest, closing rear of the seat)
  drawWall(pts, -armHX, seatY, seatBZ, armHX, seatY, seatBZ, STONE2);

  // ── Module 3: Backrest Core — 5 CNC4 rows stacked vertically ─────────────
  const backHX = 3.5 * S;
  const backBotY = seatY + S2H;  // backrest starts one STONE2 row above seat
  const nBack = 5;
  for (let r = 0; r < nBack; r++) {
    const y = backBotY + r * C4H;
    // front face of backrest (facing viewer)
    drawWall(pts, -backHX, y, seatBZ, backHX, y, seatBZ, CNC4);
    // side walls
    drawWall(pts, -backHX, y, seatBZ, -backHX, y, BHZ, CNC4);
    drawWall(pts,  backHX, y, seatBZ,  backHX, y, BHZ, CNC4);
  }
  const backTopY = backBotY + nBack * C4H;  // ~18.3m

  // ── Module 4: Fan of Sword Spines ─────────────────────────────────────────
  // pier_tube_small and pier_tube_big are vertical (base at y, top at y + 13/20m).
  // Renderer adds h/2 so store y = desired_base.
  // Fan radiates upward behind the backrest.  The central spine is tallest.
  const fanBaseY = backTopY - 4 * S;  // spines start overlapping the backrest top
  const fanZ = BHZ + 0.5 * S;

  // Central primary: pier_tube_big (20m) — the dominant spine
  pts.push({ x: 0, y: fanBaseY, z: fanZ, yaw: 0, scale: S, name: TUBE_B });

  // Primary secondaries (TUBE_B slightly shorter via lower base, flanking center)
  for (const [xOff, zOff] of [[-2.5*S, 0.5*S], [2.5*S, 0.5*S]] as [number,number][]) {
    pts.push({ x: xOff, y: fanBaseY - 1.5, z: fanZ + zOff, yaw: 0, scale: S * 0.9, name: TUBE_B });
  }

  // Secondary spines (TUBE_S, 13m) — intermediate positions
  const secondarySpines: Array<{ x: number; z: number; yaw: number; sc: number }> = [
    { x: -5*S,  z: 1*S,   yaw: -8,  sc: 1.0 * S },
    { x:  5*S,  z: 1*S,   yaw:  8,  sc: 1.0 * S },
    { x: -7*S,  z: 2*S,   yaw: -18, sc: 0.95 * S },
    { x:  7*S,  z: 2*S,   yaw:  18, sc: 0.95 * S },
  ];
  for (const { x, z, yaw, sc } of secondarySpines) {
    pts.push({ x, y: fanBaseY - 1, z: fanZ + z, yaw, scale: sc, name: TUBE_S });
  }

  // Tertiary shards (TUBE_S at irregular heights and angles — chaotic silhouette)
  const shards: Array<{ x: number; z: number; yaw: number; sc: number }> = [
    { x: -3.5*S, z: 0,     yaw:  5, sc: 0.88 * S },
    { x:  3.5*S, z: 0,     yaw: -5, sc: 0.88 * S },
    { x: -9*S,   z: 3*S,   yaw: -28, sc: 0.80 * S },
    { x:  9*S,   z: 3*S,   yaw:  28, sc: 0.80 * S },
    { x: -11*S,  z: 4*S,   yaw: -38, sc: 0.70 * S },
    { x:  11*S,  z: 4*S,   yaw:  38, sc: 0.70 * S },
    { x: -1.5*S, z: 1.5*S, yaw:  3, sc: 0.82 * S },
    { x:  1.5*S, z: 1.5*S, yaw: -3, sc: 0.82 * S },
  ];
  for (const { x, z, yaw, sc } of shards) {
    pts.push({ x, y: fanBaseY - 3, z: fanZ + z, yaw, scale: sc, name: TUBE_S });
  }

  // Micro-shard layer — fill gaps with flagpoles for ragged silhouette
  const POLE = "staticobj_misc_flagpole";  // 0.448 × 7.186 × 0.442 vertical
  const microShards = [
    [-4*S, 0.5*S, 10], [4*S, 0.5*S, -10],
    [-6*S, 1.5*S, 22], [6*S, 1.5*S, -22],
    [-8*S, 2.5*S, 32], [8*S, 2.5*S, -32],
    [0, 2*S, 0], [-2*S, 3*S, 12], [2*S, 3*S, -12],
  ];
  for (const [mxR, mzR, myaw] of microShards) {
    pts.push({ x: mxR, y: backTopY - 2, z: fanZ + mzR, yaw: myaw, scale: S * 1.2, name: POLE });
  }

  return applyLimit(pts, 1100);
}

// ═══════════════════════════════════════════════════════════════════════════════
