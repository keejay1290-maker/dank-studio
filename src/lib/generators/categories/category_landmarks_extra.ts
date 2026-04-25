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
// LANDMARKS_EXTRA
// ─────────────────────────────────────────────────────────────────────────────

//  ALHAMBRA PALACE — Granada, Spain
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * 🏰 ALHAMBRA PALACE
 *
 * Moorish fortress-palace, Nasrid dynasty. Key features:
 *  • Court of the Lions: 28m×16m open courtyard with CNC4 arcade columns
 *    on all four sides, central drawRing fountain basin
 *  • Comares Tower (Hall of Ambassadors): large IND10 square tower, 45m tall
 *  • Outer defensive wall: STONE2 curtain wall with square MILCNC towers every 25m
 *  • Palace body: STONE2 residential wings flanking the court
 */
export function gen_alhambra(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S     = Math.max(0.25, p.scale ?? 0.5);
  const s2stp = 1.572 * S;   // STONE2 flush row step
  const c4stp = 2.324 * S;   // CNC4 step
  const mstp  = 4.744 * S;   // MILCNC step
  const istp  = 9.758 * S;   // IND10 step

  // ── Outer defensive curtain wall (perimeter) ─────────────────────────────
  const wallR = 55 * S;   // approx outer perimeter half-size
  const wallH = 8 * S;
  for (let y = 0; y < wallH; y += s2stp) {
    drawWall(pts, -wallR, y, -wallR, wallR, y, -wallR, STONE2);   // north face
    drawWall(pts,  wallR, y, -wallR, wallR, y,  wallR, STONE2);   // east face
    drawWall(pts,  wallR, y,  wallR,-wallR, y,  wallR, STONE2);   // south face
    drawWall(pts, -wallR, y,  wallR,-wallR, y, -wallR, STONE2);   // west face
  }
  // Battlement atop outer wall
  drawWall(pts, -wallR, wallH, -wallR,  wallR, wallH, -wallR, CASTLE);
  drawWall(pts,  wallR, wallH, -wallR,  wallR, wallH,  wallR, CASTLE);
  drawWall(pts,  wallR, wallH,  wallR, -wallR, wallH,  wallR, CASTLE);
  drawWall(pts, -wallR, wallH,  wallR, -wallR, wallH, -wallR, CASTLE);

  // Square towers every 25m along the outer wall
  const towerSpacing = 25 * S;
  const tw = 4 * S;   // tower half-width
  const tH = 12 * S;
  const towerXs = [-wallR + towerSpacing, -wallR + towerSpacing * 2, -wallR + towerSpacing * 3];
  for (const tx of towerXs) {
    // North wall towers
    for (let y = 0; y < tH; y += mstp) {
      drawRect(pts, tx, y, -wallR, tw, tw, MILCNC);
      pts.push({x:tx-tw,y,z:-wallR-tw,yaw:225,name:MILCNC},{x:tx+tw,y,z:-wallR-tw,yaw:135,name:MILCNC},{x:tx+tw,y,z:-wallR+tw,yaw:45,name:MILCNC},{x:tx-tw,y,z:-wallR+tw,yaw:315,name:MILCNC});
    }
    // South wall towers
    for (let y = 0; y < tH; y += mstp) {
      drawRect(pts, tx, y, wallR, tw, tw, MILCNC);
      pts.push({x:tx-tw,y,z:wallR-tw,yaw:225,name:MILCNC},{x:tx+tw,y,z:wallR-tw,yaw:135,name:MILCNC},{x:tx+tw,y,z:wallR+tw,yaw:45,name:MILCNC},{x:tx-tw,y,z:wallR+tw,yaw:315,name:MILCNC});
    }
  }

  // ── Court of the Lions (rectangular open courtyard) ───────────────────────
  // 28m × 16m; colonnade of CNC4 arches on all 4 sides
  const crtHW = 14 * S;   // court half-width  (28m)
  const crtHD =  8 * S;   // court half-depth  (16m)
  const crtBase = 2 * S;  // slight elevation
  // Arcade columns — 2 rows high forming open colonnades
  for (let row = 0; row < 2; row++) {
    const y = crtBase + row * c4stp;
    drawWall(pts, -crtHW, y, -crtHD,  crtHW, y, -crtHD, CNC4);  // north arcade
    drawWall(pts, -crtHW, y,  crtHD,  crtHW, y,  crtHD, CNC4);  // south arcade
    drawWall(pts, -crtHW, y, -crtHD, -crtHW, y,  crtHD, CNC4);  // west arcade
    drawWall(pts,  crtHW, y, -crtHD,  crtHW, y,  crtHD, CNC4);  // east arcade
  }
  // Central fountain — small ring at ground level
  drawRing(pts, 0, crtBase, 0, 3 * S, CNC4);
  drawRing(pts, 0, crtBase + c4stp, 0, 1.5 * S, CNC4);

  // ── Palace wings (Nasrid Palace body) ─────────────────────────────────────
  // Two rectangular wings flanking the court, STONE2
  const wingH = 10 * S;
  // East wing
  const ewCX =  crtHW + 10 * S;
  for (let y = 0; y < wingH; y += s2stp) {
    drawRect(pts, ewCX, y, 0, 9 * S, crtHD, STONE2);
    pts.push({x:ewCX-9*S,y,z:-crtHD,yaw:225,name:STONE2},{x:ewCX+9*S,y,z:-crtHD,yaw:135,name:STONE2},{x:ewCX+9*S,y,z:crtHD,yaw:45,name:STONE2},{x:ewCX-9*S,y,z:crtHD,yaw:315,name:STONE2});
  }
  // West wing
  const wwCX = -crtHW - 10 * S;
  for (let y = 0; y < wingH; y += s2stp) {
    drawRect(pts, wwCX, y, 0, 9 * S, crtHD, STONE2);
    pts.push({x:wwCX-9*S,y,z:-crtHD,yaw:225,name:STONE2},{x:wwCX+9*S,y,z:-crtHD,yaw:135,name:STONE2},{x:wwCX+9*S,y,z:crtHD,yaw:45,name:STONE2},{x:wwCX-9*S,y,z:crtHD,yaw:315,name:STONE2});
  }

  // ── Comares Tower (Hall of Ambassadors) — tallest tower, 45m ─────────────
  const ctCX = -wallR + 12 * S;  // positioned at NW inner corner
  const ctCZ = -wallR + 12 * S;
  const ctHW = 8 * S;
  const ctH  = 45 * S;
  for (let y = 0; y < ctH; y += istp) {
    drawRect(pts, ctCX, y, ctCZ, ctHW, ctHW, IND10);
    pts.push({x:ctCX-ctHW,y,z:ctCZ-ctHW,yaw:225,name:IND10},{x:ctCX+ctHW,y,z:ctCZ-ctHW,yaw:135,name:IND10},{x:ctCX+ctHW,y,z:ctCZ+ctHW,yaw:45,name:IND10},{x:ctCX-ctHW,y,z:ctCZ+ctHW,yaw:315,name:IND10});
  }
  // Battlements atop Comares Tower
  drawRect(pts, ctCX, ctH, ctCZ, ctHW, ctHW, CASTLE);
  pts.push({x:ctCX-ctHW,y:ctH,z:ctCZ-ctHW,yaw:225,name:CASTLE},{x:ctCX+ctHW,y:ctH,z:ctCZ-ctHW,yaw:135,name:CASTLE},{x:ctCX+ctHW,y:ctH,z:ctCZ+ctHW,yaw:45,name:CASTLE},{x:ctCX-ctHW,y:ctH,z:ctCZ+ctHW,yaw:315,name:CASTLE});

  return applyLimit(pts, 1100);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  HAGIA SOPHIA — Istanbul, Turkey
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * 🕌 HAGIA SOPHIA
 *
 * Byzantine basilica (537 AD), later Ottoman mosque.
 *  • Massive central dome: 31m diameter, 55m high — drawDome + ring tiers
 *  • Two half-domes on E/W axis flanking the central dome
 *  • Large IND10 rectangular nave body
 *  • 4 minarets at outer corners — tapered MILCNC spires
 */
export function gen_hagia_sophia(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S     = Math.max(0.25, p.scale ?? 0.5);
  const istp  = 9.758;   // IND10 step — physical, never S-scaled
  const mstp  = 4.744;   // MILCNC step — physical, never S-scaled
  const s2stp = 1.572;   // STONE2 step — physical, never S-scaled

  // ── Nave body (rectangular) ────────────────────────────────────────────────
  const naveHW = 28 * S;  // half-width  (E-W)
  const naveHD = 20 * S;  // half-depth  (N-S)
  const naveH  = Math.ceil(25 * S / istp) * istp;  // exact multiple → no gap
  for (let y = 0; y < naveH; y += istp) {
    drawRect(pts, 0, y, 0, naveHW, naveHD, IND10);
    pts.push({x:-naveHW,y,z:-naveHD,yaw:225,name:IND10},{x:naveHW,y,z:-naveHD,yaw:135,name:IND10},{x:naveHW,y,z:naveHD,yaw:45,name:IND10},{x:-naveHW,y,z:naveHD,yaw:315,name:IND10});
  }

  // ── Drum ring below central dome ───────────────────────────────────────────
  const drumY = naveH;
  const mainR = 15.5 * S;
  const drumH = 8 * S;
  for (let y = drumY; y < drumY + drumH; y += s2stp)
    drawRing(pts, 0, y, 0, mainR, STONE2);

  // ── Central dome ───────────────────────────────────────────────────────────
  drawDome(pts, 0, drumY + drumH, 0, mainR, STONE2);

  // ── Two half-domes (E and W, flanking) ────────────────────────────────────
  const halfDomeR = 11 * S;
  const halfDomeY = naveH + 4 * S;
  // East half-dome
  for (let y = halfDomeY; y < halfDomeY + 4 * S; y += s2stp)
    drawRing(pts, 0, y, naveHW - halfDomeR, halfDomeR, STONE2);
  drawDome(pts, 0, halfDomeY + 4 * S, naveHW - halfDomeR, halfDomeR, STONE2);
  // West half-dome
  for (let y = halfDomeY; y < halfDomeY + 4 * S; y += s2stp)
    drawRing(pts, 0, y, -(naveHW - halfDomeR), halfDomeR, STONE2);
  drawDome(pts, 0, halfDomeY + 4 * S, -(naveHW - halfDomeR), halfDomeR, STONE2);

  // ── 4 Minarets at outer corners — tapered MILCNC spires ───────────────────
  const minaretH = 38 * S;
  const minaretBaseR = 3 * S;
  const corners: [number, number][] = [
    [-naveHW - 4 * S, -naveHD - 4 * S],
    [ naveHW + 4 * S, -naveHD - 4 * S],
    [ naveHW + 4 * S,  naveHD + 4 * S],
    [-naveHW - 4 * S,  naveHD + 4 * S],
  ];
  for (const [mx, mz] of corners) {
    for (let y = 0; y < minaretH; y += mstp) {
      const t = y / minaretH;
      const r = minaretBaseR * Math.max(0.15, 1 - t * 0.85);
      drawRing(pts, mx, y, mz, r, MILCNC);
    }
    // Minaret tip
    drawRing(pts, mx, minaretH, mz, 0.8 * S, CNC4);
  }

  return applyLimit(pts, 1100);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  RIVENDELL — Last Homely House, LOTR
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * 🌿 RIVENDELL
 *
 * Elven valley refuge carved into a mountain gorge.
 *  • 5 terraced levels stepping down into a valley (increasing -Z depth)
 *  • Elegant white CNC4 towers at the outer terrace corners
 *  • Arched bridge spanning the gorge centre (CNC4 ring arc + wall piers)
 *  • Waterfall cascade column (STONE2 ring stack) at the cliff face rear
 */
export function gen_rivendell(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S     = Math.max(0.25, p.scale ?? 0.5);
  const s2stp = 1.572;   // STONE2 step — physical constant
  const c4stp = 2.324;   // CNC4 step — physical constant

  // ── 5 terraced levels ─────────────────────────────────────────────────────
  // Each level is wider and deeper into the gorge, stepping downward
  const tiers = 5;
  for (let i = 0; i < tiers; i++) {
    const tierW = (20 + i * 12) * S;  // half-width grows with depth
    const tierZ = i * 14 * S;         // push further into gorge
    const tierY = (tiers - 1 - i) * 6 * S;  // descend Y level
    const nRows = 3;
    for (let row = 0; row < nRows; row++) {
      const y = tierY + row * s2stp;
      // Front face (facing viewer)
      drawWall(pts, -tierW, y, tierZ, tierW, y, tierZ, STONE2);
      // Two side walls connecting to next tier
      drawWall(pts, -tierW, y, tierZ, -tierW, y, tierZ + 14 * S, STONE2);
      drawWall(pts,  tierW, y, tierZ,  tierW, y, tierZ + 14 * S, STONE2);
    }
    // Decorative CNC4 battlement / balcony rail on front
    drawWall(pts, -tierW, tierY + nRows * s2stp, tierZ, tierW, tierY + nRows * s2stp, tierZ, CNC4);
  }

  // ── Elegant corner towers on outer terrace (tier 0) ───────────────────────
  const outerW = 20 * S;
  const outerZ = 0;
  const outerY = (tiers - 1) * 6 * S;
  const towerH = 22 * S;
  const towerBaseR = 3 * S;
  for (const [tx, tz] of [[-outerW, outerZ], [outerW, outerZ]] as [number,number][]) {
    for (let y = outerY; y < outerY + towerH; y += c4stp) {
      const t = (y - outerY) / towerH;
      const r = towerBaseR * Math.max(0.2, 1 - t * 0.75);
      drawRing(pts, tx, y, tz, r, CNC4);
    }
    // Tower tip
    drawRing(pts, tx, outerY + towerH, tz, 0.5 * S, CNC4);
  }

  // ── Arched bridge spanning the gorge (middle tier Z) ──────────────────────
  // Bridge deck — short STONE2 wall segments forming the span
  const bridgeY = (tiers - 1) * 6 * S + 4 * S;  // elevated above gorge floor
  const bridgeZ = 2 * 14 * S;   // midpoint of gorge
  const bridgeSpan = 20 * S;
  drawWall(pts, -bridgeSpan, bridgeY, bridgeZ, bridgeSpan, bridgeY, bridgeZ, STONE2);
  // Bridge arch underpinning — CNC4 ring arcs below deck
  const archR = bridgeSpan * 0.55;
  const archCX = 0;
  const archCZ = bridgeZ;
  const archY  = bridgeY - archR * 0.4;
  const nArch = 8;
  for (let i = 0; i < nArch; i++) {
    const a = (i / (nArch - 1)) * Math.PI;   // 0 → π (bottom half-circle)
    const ax = archCX + archR * Math.cos(a);
    const ay = archY  + archR * Math.sin(a) * 0.35;
    pts.push({ x: ax, y: ay, z: archCZ, yaw: 0, name: CNC4 });
  }
  // Bridge piers
  for (const px of [-bridgeSpan * 0.7, bridgeSpan * 0.7]) {
    for (let y = 0; y < bridgeY; y += s2stp)
      pts.push({ x: px, y, z: bridgeZ, yaw: 0, name: STONE2 });
  }

  // ── Waterfall cascade (cliff face at rear of deepest tier) ────────────────
  const wfX = 0;
  const wfZ = (tiers - 1) * 14 * S + 6 * S;
  const wfTop = (tiers - 1) * 6 * S + 20 * S;
  for (let y = 0; y < wfTop; y += s2stp) {
    drawRing(pts, wfX, y, wfZ, 2 * S, STONE2);
  }

  return applyLimit(pts, 1100);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ISENGARD / ORTHANC — Saruman's Fortress, LOTR
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * 🗼 ISENGARD / ORTHANC
 *
 * Saruman's industrial fortress.
 *  • Orthanc: hexagonal IND10 tower (~150m scaled), slight taper, 4 MILCNC
 *    horn pinnacles at the crown
 *  • Outer ring wall: large drawRing of IND10 with gap sections (destroyed look)
 *  • Industrial furnace pits: barrel_red rings scattered at base
 */
export function gen_isengard(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S    = Math.max(0.25, p.scale ?? 0.5);
  const istp = 9.758;   // IND10 step — physical constant
  const mstp = 4.744;   // MILCNC step — physical constant

  // ── Outer Ring Wall of Isengard (gap sections for destroyed look) ──────────
  const outerR = 60 * S;
  const ringH  = 10 * S;
  const gapStart1 = 0.15;   // 15% angular start of first gap
  const gapEnd1   = 0.22;
  const gapStart2 = 0.62;
  const gapEnd2   = 0.70;
  // Draw outer wall in arcs, skipping the gap segments
  for (let y = 0; y < ringH; y += istp) {
    // We manually place panels around the ring, skipping gap fractions
    const circ = 2 * Math.PI * outerR;
    const nPanels = Math.max(8, Math.ceil(circ / 9.012));
    for (let i = 0; i < nPanels; i++) {
      const frac = i / nPanels;
      if (frac > gapStart1 && frac < gapEnd1) continue;
      if (frac > gapStart2 && frac < gapEnd2) continue;
      const a = frac * 2 * Math.PI;
      const x = outerR * Math.cos(a);
      const z = outerR * Math.sin(a);
      const yaw = (Math.atan2(x, z) * 180 / Math.PI + 180) % 360;
      pts.push({ x, y, z, yaw, name: IND10 });
    }
  }

  // Destroyed battlement atop intact sections of outer ring
  for (let i = 0; i < 48; i++) {
    const frac = i / 48;
    if (frac > gapStart1 && frac < gapEnd1) continue;
    if (frac > gapStart2 && frac < gapEnd2) continue;
    const a = frac * 2 * Math.PI;
    const x = outerR * Math.cos(a);
    const z = outerR * Math.sin(a);
    const yaw = (Math.atan2(x, z) * 180 / Math.PI + 180) % 360;
    pts.push({ x, y: ringH, z, yaw, name: CASTLE });
  }

  // ── Orthanc Tower — hexagonal cross-section using 6-sided polygon per floor ─
  const ortH   = 80 * S;   // total height of Orthanc
  const ortR   = 8 * S;    // base "radius" of hexagonal tower
  const sides  = 6;
  for (let y = 0; y < ortH; y += istp) {
    const t = y / ortH;
    const r = ortR * Math.max(0.55, 1 - t * 0.35);  // slight taper
    // Place IND10 panels around a regular hexagon
    for (let i = 0; i < sides; i++) {
      const a0 = (i / sides) * Math.PI * 2;
      const a1 = ((i + 1) / sides) * Math.PI * 2;
      const mx = (Math.cos(a0) + Math.cos(a1)) * 0.5 * r;
      const mz = (Math.sin(a0) + Math.sin(a1)) * 0.5 * r;
      const yaw = (Math.atan2(mx, mz) * 180 / Math.PI + 180) % 360;
      pts.push({ x: mx, y, z: mz, yaw, name: IND10 });
    }
  }

  // ── Orthanc Crown: MILCNC band + 4 horn pinnacles ─────────────────────────
  const crownY = ortH;
  // Crown band — 2 rows of MILCNC rings
  for (let row = 0; row < 2; row++) {
    const y = crownY + row * mstp;
    const r = ortR * 0.7;
    drawRing(pts, 0, y, 0, r, MILCNC);
  }
  // 4 horn pinnacles at cardinal orientations, tilting outward
  const hornH  = 16 * S;
  const hornOff = ortR * 0.6;
  const hornPos: [number, number, number][] = [
    [  hornOff,  0,      0   ],
    [ -hornOff,  0,      0   ],
    [  0,        0,  hornOff ],
    [  0,        0, -hornOff ],
  ];
  for (const [hx, , hz] of hornPos) {
    const hYaw = (Math.atan2(hx, hz) * 180 / Math.PI + 180) % 360;
    for (let y = crownY; y < crownY + hornH; y += mstp) {
      const t = (y - crownY) / hornH;
      const r = (2 - t * 1.6) * S;
      if (r > 0.2 * S) drawRing(pts, hx, y, hz, r, MILCNC);
    }
    // Pitch the horn outward with a slight lean panel at base
    pts.push({ x: hx * 1.1, y: crownY, z: hz * 1.1, yaw: hYaw, pitch: -15, name: MILCNC });
  }

  // ── Industrial furnace pits — barrel_red rings at base ────────────────────
  const BARREL = "barrel_red";
  const pitPositions: [number, number][] = [
    [20 * S,  15 * S], [-20 * S,  15 * S],
    [20 * S, -15 * S], [-20 * S, -15 * S],
    [ 0,      25 * S], [ 0,      -25 * S],
  ];
  for (const [px, pz] of pitPositions) {
    pts.push({ x: px, y: 0, z: pz, yaw: 0, name: BARREL });
    pts.push({ x: px + 2 * S, y: 0, z: pz, yaw: 0, name: BARREL });
    pts.push({ x: px - 2 * S, y: 0, z: pz, yaw: 0, name: BARREL });
  }

  return applyLimit(pts, 1100);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FANTASY / FICTION — New Landmarks
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🏰 CAMELOT CASTLE — Arthurian Legend
 * Concentric castle of King Arthur. Outer curtain wall (~80m square) of light
 * stone with 4 D-shaped corner towers, inner ward (~45m square) with 4 corner
 * round towers, central Great Hall (3-tier IND10), Round Table courtyard with
 * decorative CNC4 ring and stone floor disc.
 */
export function gen_camelot(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S    = Math.max(0.5, p.scale ?? 1);
  const s2   = 1.572 * S;   // STONE2 row height
  const istp = 9.758 * S;   // IND10 row height

  // ── Outer curtain wall — ~80m square ──────────────────────────────────────
  const oHW = 40 * S;
  const oHD = 40 * S;
  const outerH = 8 * S;
  for (let y = 0; y < outerH; y += s2) {
    drawRect(pts, 0, y, 0, oHW, oHD, STONE2);
    pts.push({x:-oHW,y,z:-oHD,yaw:225,name:STONE2},{x:oHW,y,z:-oHD,yaw:135,name:STONE2},{x:oHW,y,z:oHD,yaw:45,name:STONE2},{x:-oHW,y,z:oHD,yaw:315,name:STONE2});
  }
  drawRect(pts, 0, outerH, 0, oHW, oHD, CASTLE);
  pts.push({x:-oHW,y:outerH,z:-oHD,yaw:225,name:CASTLE},{x:oHW,y:outerH,z:-oHD,yaw:135,name:CASTLE},{x:oHW,y:outerH,z:oHD,yaw:45,name:CASTLE},{x:-oHW,y:outerH,z:oHD,yaw:315,name:CASTLE});

  // Outer corner D-towers
  const outerTR = 6 * S;
  const cornerOuter: [number,number][] = [[-oHW,-oHD],[oHW,-oHD],[oHW,oHD],[-oHW,oHD]];
  for (const [tx,tz] of cornerOuter) {
    for (let y = 0; y < outerH + 4*S; y += s2)
      drawRing(pts, tx, y, tz, outerTR, STONE2);
    drawRing(pts, tx, outerH + 4*S, tz, outerTR, CASTLE);
  }

  // ── Inner ward — ~45m square ───────────────────────────────────────────────
  const iHW = 22 * S;
  const iHD = 22 * S;
  const innerH = 12 * S;
  for (let y = 0; y < innerH; y += s2) {
    drawRect(pts, 0, y, 0, iHW, iHD, STONE2);
    pts.push({x:-iHW,y,z:-iHD,yaw:225,name:STONE2},{x:iHW,y,z:-iHD,yaw:135,name:STONE2},{x:iHW,y,z:iHD,yaw:45,name:STONE2},{x:-iHW,y,z:iHD,yaw:315,name:STONE2});
  }
  drawRect(pts, 0, innerH, 0, iHW, iHD, CASTLE);
  pts.push({x:-iHW,y:innerH,z:-iHD,yaw:225,name:CASTLE},{x:iHW,y:innerH,z:-iHD,yaw:135,name:CASTLE},{x:iHW,y:innerH,z:iHD,yaw:45,name:CASTLE},{x:-iHW,y:innerH,z:iHD,yaw:315,name:CASTLE});

  // Inner corner round towers
  const innerTR = 5 * S;
  const cornerInner: [number,number][] = [[-iHW,-iHD],[iHW,-iHD],[iHW,iHD],[-iHW,iHD]];
  for (const [tx,tz] of cornerInner) {
    for (let y = 0; y < innerH + 6*S; y += s2)
      drawRing(pts, tx, y, tz, innerTR, STONE2);
    drawRing(pts, tx, innerH + 6*S, tz, innerTR, CASTLE);
  }

  // ── Central Great Hall — 3 IND10 tiers, ~15×10m ───────────────────────────
  const ghHW = 7.5 * S;
  const ghHD = 5   * S;
  for (let row = 0; row < 3; row++) {
    const y = row * istp;
    drawRect(pts, 0, y, 0, ghHW, ghHD, IND10);
    pts.push({x:-ghHW,y,z:-ghHD,yaw:225,name:IND10},{x:ghHW,y,z:-ghHD,yaw:135,name:IND10},{x:ghHW,y,z:ghHD,yaw:45,name:IND10},{x:-ghHW,y,z:ghHD,yaw:315,name:IND10});
  }
  const hallTop = 3 * istp;
  drawRect(pts, 0, hallTop, 0, ghHW, ghHD, CASTLE);
  pts.push({x:-ghHW,y:hallTop,z:-ghHD,yaw:225,name:CASTLE},{x:ghHW,y:hallTop,z:-ghHD,yaw:135,name:CASTLE},{x:ghHW,y:hallTop,z:ghHD,yaw:45,name:CASTLE},{x:-ghHW,y:hallTop,z:ghHD,yaw:315,name:CASTLE});

  // ── Round Table courtyard — stone floor disc + decorative CNC4 ring ────────
  const courtR = 10 * S;
  const courtX = 12 * S;
  const courtZ = 12 * S;
  drawDisk(pts, courtX, 0, courtZ, courtR, STONE2);
  drawRing(pts, courtX, 0, courtZ, courtR, CNC4);
  drawRing(pts, courtX, 2.324 * S, courtZ, courtR, CNC4);

  return applyLimit(pts, 1100);
}

/**
 * 🐺 WINTERFELL — Game of Thrones / ASOIAF
 * Stark ancestral seat in the north of Westeros. ~100m×80m outer stone walls
 * with 4 corner towers, Great Keep (4-row IND10 heavy keep), Broken Tower
 * (reaches only ~60% height with sparse upper section), Glass Gardens (low
 * CNC4 greenhouse arcade), and crypts entrance archway.
 */
export function gen_winterfell(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S    = Math.max(0.5, p.scale ?? 1);
  const s2   = 1.572 * S;   // STONE2 row height
  const istp = 9.758 * S;   // IND10 row height
  const c4   = 2.324 * S;   // CNC4 row height

  // ── Outer curtain wall — ~100m × 80m ──────────────────────────────────────
  const oHW = 50 * S;
  const oHD = 40 * S;
  const wallH = 10 * S;
  for (let y = 0; y < wallH; y += s2) {
    drawRect(pts, 0, y, 0, oHW, oHD, STONE2);
    pts.push({x:-oHW,y,z:-oHD,yaw:225,name:STONE2},{x:oHW,y,z:-oHD,yaw:135,name:STONE2},{x:oHW,y,z:oHD,yaw:45,name:STONE2},{x:-oHW,y,z:oHD,yaw:315,name:STONE2});
  }
  drawRect(pts, 0, wallH, 0, oHW, oHD, CASTLE);
  pts.push({x:-oHW,y:wallH,z:-oHD,yaw:225,name:CASTLE},{x:oHW,y:wallH,z:-oHD,yaw:135,name:CASTLE},{x:oHW,y:wallH,z:oHD,yaw:45,name:CASTLE},{x:-oHW,y:wallH,z:oHD,yaw:315,name:CASTLE});

  // 4 corner towers
  const ctR = 6 * S;
  const wallCorners: [number,number][] = [[-oHW,-oHD],[oHW,-oHD],[oHW,oHD],[-oHW,oHD]];
  for (const [tx,tz] of wallCorners) {
    for (let y = 0; y < wallH + 8*S; y += s2)
      drawRing(pts, tx, y, tz, ctR, STONE2);
    drawRing(pts, tx, wallH + 8*S, tz, ctR, CASTLE);
  }

  // ── Great Keep — 4 rows IND10, ~25m × 20m ─────────────────────────────────
  const gkHW = 12.5 * S;
  const gkHD = 10   * S;
  const gkX  = -10  * S;
  for (let row = 0; row < 4; row++) {
    const y = row * istp;
    drawRect(pts, gkX, y, 0, gkHW, gkHD, IND10);
    pts.push({x:gkX-gkHW,y,z:-gkHD,yaw:225,name:IND10},{x:gkX+gkHW,y,z:-gkHD,yaw:135,name:IND10},{x:gkX+gkHW,y,z:gkHD,yaw:45,name:IND10},{x:gkX-gkHW,y,z:gkHD,yaw:315,name:IND10});
  }
  const keepTop = 4 * istp;
  drawRect(pts, gkX, keepTop, 0, gkHW, gkHD, CASTLE);
  pts.push({x:gkX-gkHW,y:keepTop,z:-gkHD,yaw:225,name:CASTLE},{x:gkX+gkHW,y:keepTop,z:-gkHD,yaw:135,name:CASTLE},{x:gkX+gkHW,y:keepTop,z:gkHD,yaw:45,name:CASTLE},{x:gkX-gkHW,y:keepTop,z:gkHD,yaw:315,name:CASTLE});

  // ── Broken Tower — partial height, sparse upper section ───────────────────
  const btX = 25 * S;
  const btZ = 15 * S;
  const btR = 4  * S;
  const btFull   = 20 * S;
  const btBroken = btFull * 0.6;
  for (let y = 0; y < btFull; y += s2) {
    if (y < btBroken || (Math.round(y / s2) % 3 === 0))
      drawRing(pts, btX, y, btZ, btR, STONE2);
  }

  // ── Glass Gardens — low CNC4 greenhouse arcade ────────────────────────────
  const ggX  = 20 * S;
  const ggZ  = -15 * S;
  const ggHW = 8 * S;
  const ggHD = 4 * S;
  for (let row = 0; row < 3; row++) {
    const y = row * c4;
    drawRect(pts, ggX, y, ggZ, ggHW, ggHD, CNC4);
    pts.push({x:ggX-ggHW,y,z:ggZ-ggHD,yaw:225,name:CNC4},{x:ggX+ggHW,y,z:ggZ-ggHD,yaw:135,name:CNC4},{x:ggX+ggHW,y,z:ggZ+ggHD,yaw:45,name:CNC4},{x:ggX-ggHW,y,z:ggZ+ggHD,yaw:315,name:CNC4});
  }

  // ── Crypts entrance — STONE2 narrow archway ───────────────────────────────
  const cryptX = -35 * S;
  const cryptZ =  30 * S;
  for (let y = 0; y < 6*S; y += s2) {
    drawWall(pts, cryptX - 4*S, y, cryptZ, cryptX - 1*S, y, cryptZ, STONE2);
    drawWall(pts, cryptX + 1*S, y, cryptZ, cryptX + 4*S, y, cryptZ, STONE2);
  }
  for (let y = 6*S; y < 8*S; y += s2)
    drawWall(pts, cryptX - 4*S, y, cryptZ, cryptX + 4*S, y, cryptZ, STONE2);

  return applyLimit(pts, 1100);
}

/**
 * 🔥 BLACK GATE (MORANNON) — Lord of the Rings
 * The iron gates of Mordor on the northern border of the Black Land.
 * Two massive flanking towers (IND10 rings, r=10), portcullis frame wall
 * with central gate gap, raised gate tower above, secondary rear defence wall.
 * Barrel_red fire pits scattered as Orc encampment.
 */
export function gen_black_gate(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S    = Math.max(0.5, p.scale ?? 1);
  const istp = 9.758;   // IND10 row height — physical constant

  const towerH  = 40 * S;
  const towerR  = 10 * S;
  const towerX  = 20 * S;

  // ── Flanking towers ────────────────────────────────────────────────────────
  const wallRows = Math.max(1, Math.round(towerH / istp));
  for (let row = 0; row < wallRows; row++) {
    const y = row * istp;
    drawRing(pts, -towerX, y, 0, towerR, IND10);
    drawRing(pts,  towerX, y, 0, towerR, IND10);
  }
  drawRing(pts, -towerX, towerH, 0, towerR, MILCNC);
  drawRing(pts,  towerX, towerH, 0, towerR, MILCNC);

  // ── Portcullis frame — IND10 wall with central gate gap ───────────────────
  const gateGapHW = 6 * S;
  for (let row = 0; row < wallRows; row++) {
    const y = row * istp;
    drawWall(pts, -(towerX - towerR), y, 0, -gateGapHW, y, 0, IND10);
    drawWall(pts,  gateGapHW,         y, 0,  (towerX - towerR), y, 0, IND10);
  }

  // ── Gate tower above the arch ──────────────────────────────────────────────
  const gateTHW = 8 * S;
  const gateTHD = 5 * S;
  const gateTBase = wallRows * istp;
  for (let row = 0; row < 3; row++) {
    const y = gateTBase + row * istp;
    drawRect(pts, 0, y, 0, gateTHW, gateTHD, IND10);
    pts.push({x:-gateTHW,y,z:-gateTHD,yaw:225,name:IND10},{x:gateTHW,y,z:-gateTHD,yaw:135,name:IND10},{x:gateTHW,y,z:gateTHD,yaw:45,name:IND10},{x:-gateTHW,y,z:gateTHD,yaw:315,name:IND10});
  }
  const gateTTop = gateTBase + 3 * istp;
  drawRect(pts, 0, gateTTop, 0, gateTHW, gateTHD, MILCNC);
  pts.push({x:-gateTHW,y:gateTTop,z:-gateTHD,yaw:225,name:MILCNC},{x:gateTHW,y:gateTTop,z:-gateTHD,yaw:135,name:MILCNC},{x:gateTHW,y:gateTTop,z:gateTHD,yaw:45,name:MILCNC},{x:-gateTHW,y:gateTTop,z:gateTHD,yaw:315,name:MILCNC});

  // ── Secondary rear defence wall — 3 IND10 rows, 15*S north ────────────────
  const rearZ = 15 * S;
  const rearW = towerX + towerR * 0.5;
  for (let row = 0; row < 3; row++) {
    const y = row * istp;
    drawWall(pts, -rearW, y, rearZ, rearW, y, rearZ, IND10);
  }
  drawWall(pts, -rearW, 3*istp, rearZ, rearW, 3*istp, rearZ, MILCNC);

  // ── Orc fire pits — barrel_red ────────────────────────────────────────────
  const firePits: [number,number][] = [
    [-30*S, 12*S],[30*S,12*S],[-15*S,18*S],[15*S,18*S],
    [0, 25*S], [-35*S, 0], [35*S, 0],
  ];
  for (const [px,pz] of firePits)
    pts.push({x:px,y:0,z:pz,yaw:0,name:"barrel_red"});

  return applyLimit(pts, 1100);
}

/**
 * 🔦 GONDOR BEACON TOWER — Amon Dîn, Lord of the Rings
 * One of the chain of signal beacons across the White Mountains of Gondor.
 * Tall circular STONE2 watchtower (r=5, h=30), wide crenellated CASTLE parapet
 * at top, central beacon pyre (barrel_red + barrel_yellow), 4 stone buttress
 * fins radiating outward from the base, CNC4 gateway arch at ground level.
 */
export function gen_gondor_beacon(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S    = Math.max(0.5, p.scale ?? 1);
  const s2   = 1.572;   // STONE2 row height — physical constant
  const cstp = 2.0;    // CASTLE row height — physical constant
  const c4   = 2.324;  // CNC4 row height — physical constant

  const towerR = 5  * S;
  const towerH = 30 * S;

  // ── Main tower shaft ───────────────────────────────────────────────────────
  for (let y = 0; y < towerH; y += s2)
    drawRing(pts, 0, y, 0, towerR, STONE2);

  // ── Crenellated parapet ring at summit ────────────────────────────────────
  const parapetR = towerR + 1.5 * S;
  for (let row = 0; row < 2; row++)
    drawRing(pts, 0, towerH + row * cstp, 0, parapetR, CASTLE);

  // ── Beacon pyre — barrel_red and barrel_yellow stacked at summit ──────────
  const pyreY = towerH + 2 * cstp;
  pts.push({x:0, y:pyreY,        z:0, yaw:0, name:"barrel_red"   });
  pts.push({x:0, y:pyreY + 1*S,  z:0, yaw:0, name:"barrel_yellow"});
  pts.push({x:0, y:pyreY + 2*S,  z:0, yaw:0, name:"barrel_red"   });

  // ── 4 buttress fins radiating outward ─────────────────────────────────────
  const butLen  = 8 * S;
  const butMaxY = towerH * 0.4;
  const butEndpoints: [number,number,number,number,number,number][] = [
    [0,       0, towerR,  0,                0, towerR + butLen],
    [0,       0, -towerR, 0,                0, -(towerR + butLen)],
    [towerR,  0, 0,       towerR + butLen,  0, 0],
    [-towerR, 0, 0,       -(towerR + butLen), 0, 0],
  ];
  for (const [x1,_y1,z1,x2,_y2,z2] of butEndpoints) {
    for (let y = 0; y < butMaxY; y += s2)
      drawWall(pts, x1, y, z1, x2, y, z2, STONE2);
  }

  // ── Gateway arch at base — CNC4 panels flanking an entrance gap ───────────
  const archGapHW = 2.5 * S;
  const archFaceZ = towerR + 1 * S;
  for (let row = 0; row < 3; row++) {
    const y = row * c4;
    drawWall(pts, -(towerR + 2*S), y, archFaceZ, -archGapHW, y, archFaceZ, CNC4);
    drawWall(pts,  archGapHW,      y, archFaceZ,  (towerR + 2*S), y, archFaceZ, CNC4);
  }
  drawWall(pts, -(towerR + 2*S), 3*c4, archFaceZ, (towerR + 2*S), 3*c4, archFaceZ, CNC4);

  return applyLimit(pts, 1100);
}

/**
 * 🦁 STORMWIND CITY — World of Warcraft
 * Human capital city of the Alliance. Cathedral of Light (central Gothic nave),
 * Trade District ring around a CNC4 fountain, Stormwind Keep (north, 3 towers),
 * outer STONE2 city walls with corner towers, Throne Room CNC8 central spire.
 * Default S=0.5 to keep city footprint manageable.
 */
export function gen_stormwind(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S    = Math.max(0.5, p.scale ?? 0.5);
  const s2   = 1.572;  // STONE2 row height — physical constant
  const c8   = 2.3;   // CNC8 row height — physical constant
  const c4   = 2.324; // CNC4 row height — physical constant
  const istp = 9.758; // IND10 row height — physical constant

  // ── Outer city walls — ~120m × 100m ───────────────────────────────────────
  const cwHW = 60 * S;
  const cwHD = 50 * S;
  const cwH  = 10 * S;
  for (let y = 0; y < cwH; y += s2) {
    drawRect(pts, 0, y, 0, cwHW, cwHD, STONE2);
    pts.push({x:-cwHW,y,z:-cwHD,yaw:225,name:STONE2},{x:cwHW,y,z:-cwHD,yaw:135,name:STONE2},{x:cwHW,y,z:cwHD,yaw:45,name:STONE2},{x:-cwHW,y,z:cwHD,yaw:315,name:STONE2});
  }
  drawRect(pts, 0, cwH, 0, cwHW, cwHD, CASTLE);
  pts.push({x:-cwHW,y:cwH,z:-cwHD,yaw:225,name:CASTLE},{x:cwHW,y:cwH,z:-cwHD,yaw:135,name:CASTLE},{x:cwHW,y:cwH,z:cwHD,yaw:45,name:CASTLE},{x:-cwHW,y:cwH,z:cwHD,yaw:315,name:CASTLE});

  // City wall corner towers
  const cityCorners: [number,number][] = [[-cwHW,-cwHD],[cwHW,-cwHD],[cwHW,cwHD],[-cwHW,cwHD]];
  for (const [tx,tz] of cityCorners) {
    for (let y = 0; y < cwH + 6*S; y += s2)
      drawRing(pts, tx, y, tz, 6*S, STONE2);
    drawRing(pts, tx, cwH + 6*S, tz, 6*S, CASTLE);
  }

  // ── Cathedral of Light — central Gothic nave ──────────────────────────────
  const catHW = 10 * S;
  const catHD =  5 * S;
  const catRows = 5;
  for (let row = 0; row < catRows; row++) {
    const y = row * c4;
    drawRect(pts, 0, y, 0, catHW, catHD, CNC4);
    pts.push({x:-catHW,y,z:-catHD,yaw:225,name:CNC4},{x:catHW,y,z:-catHD,yaw:135,name:CNC4},{x:catHW,y,z:catHD,yaw:45,name:CNC4},{x:-catHW,y,z:catHD,yaw:315,name:CNC4});
  }
  const catTop = catRows * c4;
  for (let row = 0; row < 5; row++) {
    const y = catTop + row * c8;
    const r = Math.max(0.5*S, (4 - row * 0.7) * S);
    drawRing(pts, 0, y, 0, r, CNC8);
  }

  // ── Trade District — IND10 buildings around CNC4 fountain ring ────────────
  const tdCX = 30 * S;
  const tdCZ =  0;
  drawRing(pts, tdCX, 0, tdCZ, 6*S, CNC4);
  drawDisk(pts, tdCX, 0, tdCZ, 5*S, STONE2);
  const tdBuildings: [number,number,number,number,number][] = [
    [tdCX + 15*S, 0, tdCZ,        5*S, 4*S],
    [tdCX - 15*S, 0, tdCZ,        5*S, 4*S],
    [tdCX,        0, tdCZ + 15*S, 4*S, 5*S],
    [tdCX,        0, tdCZ - 15*S, 4*S, 5*S],
  ];
  for (const [bx,by,bz,bhw,bhd] of tdBuildings) {
    drawRect(pts, bx, by, bz, bhw, bhd, IND10);
    pts.push({x:bx-bhw,y:by,z:bz-bhd,yaw:225,name:IND10},{x:bx+bhw,y:by,z:bz-bhd,yaw:135,name:IND10},{x:bx+bhw,y:by,z:bz+bhd,yaw:45,name:IND10},{x:bx-bhw,y:by,z:bz+bhd,yaw:315,name:IND10});
  }

  // ── Stormwind Keep — north, 3 IND10 towers ────────────────────────────────
  const skCX = -35 * S;
  const skCZ =   0;
  const skHW = 14 * S;
  const skHD = 10 * S;
  for (let row = 0; row < 2; row++) {
    const y = row * istp;
    drawRect(pts, skCX, y, skCZ, skHW, skHD, IND10);
    pts.push({x:skCX-skHW,y,z:skCZ-skHD,yaw:225,name:IND10},{x:skCX+skHW,y,z:skCZ-skHD,yaw:135,name:IND10},{x:skCX+skHW,y,z:skCZ+skHD,yaw:45,name:IND10},{x:skCX-skHW,y,z:skCZ+skHD,yaw:315,name:IND10});
  }
  const skTop = 2 * istp;
  const keepTowers: [number,number][] = [[skCX, skCZ],[skCX + skHW, skCZ],[skCX - skHW, skCZ]];
  for (const [ktx,ktz] of keepTowers) {
    for (let y = skTop; y < skTop + 4*istp; y += istp)
      drawRing(pts, ktx, y, ktz, 5*S, IND10);
    drawRing(pts, ktx, skTop + 4*istp, ktz, 5*S, CASTLE);
  }

  // ── Throne Room — tallest CNC8 central spire inside Keep ──────────────────
  const throneR = 3 * S;
  for (let row = 0; row < 8; row++) {
    const y = row * c8;
    const r = Math.max(0.5*S, throneR - row * 0.2 * S);
    drawRing(pts, skCX, y, skCZ, r, CNC8);
  }

  return applyLimit(pts, 1100);
}

// ── Great Wall of China ───────────────────────────────────────────────────────
export function gen_great_wall(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const L    = Math.min(p.length ?? 160, 300);
  const h    = 10;     // wall height in metres
  const stp  = 9.758;  // IND10 step (no S — length param controls size)
  const cW   = 4;      // wall depth (front-to-rear gap)

  // Front and rear faces — IND10 rows
  for (let y = 0; y < h; y += stp) {
    drawWall(pts, -L/2, y, 0,    L/2, y, 0,   IND10);
    drawWall(pts, -L/2, y, cW,   L/2, y, cW,  IND10);
  }
  // Battlements along top
  drawWall(pts, -L/2, h, 0,  L/2, h, 0,  CASTLE);
  drawWall(pts, -L/2, h, cW, L/2, h, cW, CASTLE);
  // End caps
  for (let y = 0; y < h; y += stp) {
    drawWall(pts, -L/2, y, 0, -L/2, y, cW, IND10);
    drawWall(pts,  L/2, y, 0,  L/2, y, cW, IND10);
  }

  // Watchtowers every 40m along the wall
  const spacing = 40;
  for (let x = -L/2 + spacing/2; x < L/2; x += spacing) {
    const tH = 16, thw = 5, thd = 5;
    for (let y = 0; y < tH; y += 2.3) {
      drawRect(pts, x, y, cW/2, thw, thd, CNC8);
      pts.push({x:x-thw,y,z:cW/2-thd,yaw:225,name:CNC8},{x:x+thw,y,z:cW/2-thd,yaw:135,name:CNC8},{x:x+thw,y,z:cW/2+thd,yaw:45,name:CNC8},{x:x-thw,y,z:cW/2+thd,yaw:315,name:CNC8});
    }
    drawRect(pts, x, tH, cW/2, thw, thd, CASTLE);
    pts.push({x:x-thw,y:tH,z:cW/2-thd,yaw:225,name:CASTLE},{x:x+thw,y:tH,z:cW/2-thd,yaw:135,name:CASTLE},{x:x+thw,y:tH,z:cW/2+thd,yaw:45,name:CASTLE},{x:x-thw,y:tH,z:cW/2+thd,yaw:315,name:CASTLE});
  }

  return applyLimit(pts, 1100);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CREATIVE MEGASTRUCTURES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * DYSON SPHERE (Partial)
 *
 * Research:
 *  - Theoretical megastructure surrounding a star to capture its energy output.
 *  - In fiction (Star Trek, Outer Limits) depicted as a lattice framework of
 *    structural rings and longitude struts, not a complete solid shell.
 *  - Latitude rings run parallel to the equator; longitude struts arc pole-to-pole.
 *  - Central star depicted as a blazing point of energy.
 *
 * Design:
 *  - Central star: 3 barrel_red stacked at origin
 *  - Latitude rings: IND10 rings from north to south pole using sphere formula
 *  - Every 3rd ring: longitude arc struts at 8 cardinal/diagonal angles
 *  - Maintenance platforms: drawRect bays at equatorial nodes
 *  - Default r=80, IND10 panels (largest available)
 */
export function gen_dyson_sphere(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const R   = Math.min(Math.max(p.r ?? 80, 40), 150);
  const stp = 9.758; // IND10 panel height

  // Central star (barrel_red cluster)
  for (let i = 0; i < 3; i++) {
    pts.push({ x: 0, y: i * 1.5, z: 0, name: "barrel_red" });
  }

  // Latitude rings pole-to-pole
  const nRings = Math.max(6, Math.round(Math.PI * R / stp));
  let ringIndex = 0;
  for (let i = 1; i < nRings; i++) {
    const phi   = (i / nRings) * Math.PI;
    const sinP  = Math.sin(phi);
    const cosP  = Math.cos(phi);
    const ringR = R * sinP;
    const y     = R + R * cosP; // elevate so base at y=0

    if (ringR < 2) continue;
    drawRing(pts, 0, y, 0, ringR, IND10);
    ringIndex++;

    // Every 3rd ring: longitude struts at 8 angles
    if (ringIndex % 3 === 0) {
      const nStruts = 8;
      for (let s = 0; s < nStruts; s++) {
        const theta = (s / nStruts) * 2 * Math.PI;
        const x1    = ringR * Math.cos(theta);
        const z1    = ringR * Math.sin(theta);
        const phiNext = ((i - 1) / nRings) * Math.PI;
        const rNext   = R * Math.sin(phiNext);
        const yNext   = R + R * Math.cos(phiNext);
        if (rNext > 2) {
          const x2 = rNext * Math.cos(theta);
          const z2 = rNext * Math.sin(theta);
          drawWall(pts, x1, y, z1, x2, yNext, z2, IND10);
        }
      }
    }
  }

  // Equatorial maintenance bays
  const eqY = R;
  const eqR = R * 0.9;
  const bhw = 9;
  const bhd = 9;
  for (let b = 0; b < 4; b++) {
    const theta = (b / 4) * 2 * Math.PI;
    const bx    = eqR * Math.cos(theta);
    const bz    = eqR * Math.sin(theta);
    drawRect(pts, bx, eqY, bz, bhw, bhd, IND10);
    pts.push(
      { x: bx - bhw, y: eqY, z: bz - bhd, yaw: 225, name: IND10 },
      { x: bx + bhw, y: eqY, z: bz - bhd, yaw: 135, name: IND10 },
      { x: bx + bhw, y: eqY, z: bz + bhd, yaw:  45, name: IND10 },
      { x: bx - bhw, y: eqY, z: bz + bhd, yaw: 315, name: IND10 },
    );
  }

  return applyLimit(pts, 1100);
}

/**
 * BARAD-DUR -- Sauron's Dark Tower
 *
 * Research:
 *  - Tolkien: 3000m tall black fortress on a plateau of Mordor, built from
 *    iron and shadow by Sauron in the Second Age.
 *  - Key features: massive buttressed black base; a rising shaft; an open
 *    crown bearing the Eye of Sauron; flanking horn battlements.
 *  - Depicted in Peter Jackson films as a jagged iron spike ringed by a
 *    fiery crown with a vertical eye slit of flame.
 *  - Scaled to ~150m in-game using MILCNC/IND10 (dark materials only).
 */
export function gen_barad_dur(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S  = Math.max(0.25, p.scale ?? 1);
  const sI = 9.758 * S;  // IND10 step
  const sM = 4.744 * S;  // MILCNC step

  // Base tiers -- 3 stepped IND10 rectangles
  const baseTiers: Array<{ hw: number; hd: number; top: number; h: number }> = [
    { hw: 30 * S, hd: 30 * S, top: 0,       h: 20 * S },
    { hw: 22 * S, hd: 22 * S, top: 20 * S,  h: 15 * S },
    { hw: 16 * S, hd: 16 * S, top: 35 * S,  h: 10 * S },
  ];
  for (const tier of baseTiers) {
    const { hw, hd, top, h } = tier;
    for (let y = top; y < top + h; y += sI) {
      drawRect(pts, 0, y, 0, hw, hd, IND10);
      pts.push(
        { x: -hw, y, z: -hd, yaw: 225, name: IND10 },
        { x: +hw, y, z: -hd, yaw: 135, name: IND10 },
        { x: +hw, y, z: +hd, yaw:  45, name: IND10 },
        { x: -hw, y, z: +hd, yaw: 315, name: IND10 },
      );
    }
  }

  // Central shaft -- tapering MILCNC ring, 45m to 130m
  const shaftBase = 45 * S;
  const shaftTop  = 130 * S;
  for (let y = shaftBase; y < shaftTop; y += sM) {
    const t = (y - shaftBase) / (shaftTop - shaftBase);
    const r = (12 - t * 5) * S;
    if (r > 0.5 * S) drawRing(pts, 0, y, 0, r, MILCNC);
  }

  // Mid-shaft buttresses at 30% and 60% height
  for (const frac of [0.30, 0.60]) {
    const by = shaftBase + (shaftTop - shaftBase) * frac;
    const br = (12 - frac * 5) * S;
    for (let a = 0; a < 4; a++) {
      const theta  = (a / 4) * 2 * Math.PI;
      const cosT   = Math.cos(theta);
      const sinT   = Math.sin(theta);
      const finLen = 10 * S;
      const ix = br * cosT;
      const iz = br * sinT;
      const ox = (br + finLen) * cosT;
      const oz = (br + finLen) * sinT;
      for (let fy = by - sI; fy <= by + sI; fy += sI) {
        drawWall(pts, ix, fy, iz, ox, fy, oz, IND10);
      }
    }
  }

  // Crown -- 6 MILCNC rings slightly flared
  const crownBase = 130 * S;
  for (let i = 0; i < 6; i++) {
    const y = crownBase + i * sM;
    const r = (7 + i * 0.5) * S;
    drawRing(pts, 0, y, 0, r, MILCNC);
  }

  // Eye slit -- 2 barrel_red at crown center
  const eyeY = crownBase + 3 * sM;
  pts.push({ x:  1.5 * S, y: eyeY, z: 0, name: "barrel_red" });
  pts.push({ x: -1.5 * S, y: eyeY, z: 0, name: "barrel_red" });

  // Horn battlements -- 2 MILCNC stacks at crown flanks
  const hornY   = crownBase + 2 * sM;
  const hornOff = 8 * S;
  for (const hx of [-hornOff, hornOff]) {
    for (let i = 0; i < 4; i++) {
      pts.push({ x: hx, y: hornY + i * sM, z: 0, yaw:  0, name: MILCNC });
      pts.push({ x: hx, y: hornY + i * sM, z: 0, yaw: 90, name: MILCNC });
    }
  }

  return applyLimit(pts, 1100);
}

/**
 * MASS EFFECT CITADEL STATION
 *
 * Research:
 *  - The Citadel from the Mass Effect trilogy -- a 44km Prothean/Reaper space
 *    station in the Widow Nebula. Shaped like 5 long radial "arms" (the Wards)
 *    extending from a central torus (the Presidium Ring).
 *  - When open, the arms spread like a flower; closed they form a spike.
 *    We model the open configuration.
 *  - Features: central Presidium ring, 5 ward arms at 72° intervals,
 *    Keeper maintenance hub at center top, barrel_blue nav lights.
 *  - Scale: ~200m game footprint at default scale=1.
 */
export function gen_mass_effect_citadel(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S   = Math.max(0.25, p.scale ?? 1);
  const sI  = 9.758 * S;  // IND10 step
  const sM  = 4.744 * S;  // MILCNC step
  const sC8 = 2.300 * S;  // CNC8 step

  // Central Presidium ring -- 3 IND10 tiers
  const presR = 20 * S;
  for (let i = 0; i < 3; i++) {
    drawRing(pts, 0, i * sI, 0, presR, IND10);
  }

  // Ring deck floor
  drawDisk(pts, 0, sI * 1.5, 0, presR, MILCNC);

  // 5 Ward arms radiating at 72° intervals
  const armLen   = 50 * S;
  const armStart = presR + 2 * S;
  const armEnd   = armStart + armLen;
  for (let arm = 0; arm < 5; arm++) {
    const theta = (arm / 5) * 2 * Math.PI;
    const cosT  = Math.cos(theta);
    const sinT  = Math.sin(theta);
    const sx    = armStart * cosT;
    const sz    = armStart * sinT;
    const ex    = armEnd   * cosT;
    const ez    = armEnd   * sinT;

    // Dual-face IND10 arm walls
    const sideOff = 2 * S;
    const perpX   =  sinT;
    const perpZ   = -cosT;
    for (let row = 0; row < 2; row++) {
      const sign = row === 0 ? 1 : -1;
      const offX = perpX * sideOff * sign;
      const offZ = perpZ * sideOff * sign;
      drawWall(pts, sx + offX, 0,  sz + offZ, ex + offX, 0,  ez + offZ, IND10);
      drawWall(pts, sx + offX, sI, sz + offZ, ex + offX, sI, ez + offZ, IND10);
    }

    // End cap at arm tip
    drawWall(pts,
      ex + perpX * sideOff, 0,  ez + perpZ * sideOff,
      ex - perpX * sideOff, 0,  ez - perpZ * sideOff, IND10);
    drawWall(pts,
      ex + perpX * sideOff, sI, ez + perpZ * sideOff,
      ex - perpX * sideOff, sI, ez - perpZ * sideOff, IND10);

    // Arm tip terminal block -- 3 tiers CNC8
    const tipHW = 3 * S;
    const tipHD = 3 * S;
    for (let t = 0; t < 3; t++) {
      const ty = t * sC8;
      drawRect(pts, ex, ty, ez, tipHW, tipHD, CNC8);
      pts.push(
        { x: ex - tipHW, y: ty, z: ez - tipHD, yaw: 225, name: CNC8 },
        { x: ex + tipHW, y: ty, z: ez - tipHD, yaw: 135, name: CNC8 },
        { x: ex + tipHW, y: ty, z: ez + tipHD, yaw:  45, name: CNC8 },
        { x: ex - tipHW, y: ty, z: ez + tipHD, yaw: 315, name: CNC8 },
      );
    }

    // barrel_blue nav light at each arm tip
    pts.push({ x: ex, y: 3 * sC8, z: ez, name: "barrel_blue" });
  }

  // Keeper hub -- MILCNC tapered spire above the ring
  const hubBase = 3 * sI;
  for (let i = 0; i < 8; i++) {
    const y = hubBase + i * sM;
    const t = i / 8;
    const r = (6 - t * 5.2) * S;
    if (r > 0.3 * S) drawRing(pts, 0, y, 0, r, MILCNC);
  }
  // Spire tip CNC8
  for (let i = 0; i < 4; i++) {
    const y = hubBase + 8 * sM + i * sC8;
    const t = i / 4;
    const r = (1 - t * 0.8) * S;
    if (r > 0.1 * S) drawRing(pts, 0, y, 0, r, CNC8);
  }

  return applyLimit(pts, 1100);
}


