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
// MONUMENTS
// ─────────────────────────────────────────────────────────────────────────────

//  MONUMENTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🗼 EIFFEL TOWER
 */
export function gen_eiffel_tower(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S    = Math.max(0.25, Math.min(1, p.scale ?? 0.5));
  const IRON  = CNC4;
  const IH    = 2.324;  // CNC4 row height — fixed, never scale
  const METAL = IND10;

  const hL1  = 57  * S;
  const hL2  = 115 * S;
  const topH = 276 * S;
  const wBase = 45 * S;
  const wL1   = 25 * S;
  const wL2   = 10 * S;
  const wTop  =  2 * S;

  // ── 1. ANCHOR LEGS — swept diagonal walls (8 segments, 4 legs) ────────────
  // Draws each leg as a series of slanted drawWall segments along the inward
  // curve, rather than a drawRect per horizontal level. Far fewer panels.
  const nSegs = 8;
  for (let i = 0; i < nSegs; i++) {
    const t0 = i / nSegs,       t1 = (i + 1) / nSegs;
    const c0 = Math.pow(t0, 0.75), c1 = Math.pow(t1, 0.75);
    const x0 = wBase - (wBase - wL1) * c0, y0 = hL1 * t0;
    const x1 = wBase - (wBase - wL1) * c1, y1 = hL1 * t1;
    drawWall(pts,  x0, y0,  x0,  x1, y1,  x1, IRON);
    drawWall(pts, -x0, y0,  x0, -x1, y1,  x1, IRON);
    drawWall(pts,  x0, y0, -x0,  x1, y1, -x1, IRON);
    drawWall(pts, -x0, y0, -x0, -x1, y1, -x1, IRON);
  }

  // ── 2. BASE ARCH — two cross-bracing rings at 30% and 60% of leg height ───
  const archW = wL1 * 1.1;
  drawRect(pts, 0, hL1 * 0.30, 0, archW, archW, IRON);
  drawRect(pts, 0, hL1 * 0.60, 0, wL1,   wL1,   IRON);

  // ── 3. FIRST PLATFORM DECK ────────────────────────────────────────────────
  const deck1W = wL1 + 6 * S;
  drawRect(pts, 0, hL1,      0, deck1W,     deck1W,     METAL);
  drawRect(pts, 0, hL1 + IH, 0, deck1W - 2, deck1W - 2, METAL);

  // ── 4. MIDDLE TOWER (L1 → L2) — one drawRect per IH step ─────────────────
  for (let y = hL1 + IH * 2; y < hL2; y += IH) {
    const t = (y - hL1) / (hL2 - hL1);
    const w = wL1 - (wL1 - wL2) * Math.pow(t, 0.85);
    drawRect(pts, 0, y, 0, w + 3 * S, w + 3 * S, IRON);
  }

  // ── 5. SECOND PLATFORM DECK ───────────────────────────────────────────────
  const deck2W = wL2 + 4 * S;
  drawRect(pts, 0, hL2, 0, deck2W, deck2W, METAL);

  // ── 6. UPPER TOWER (L2 → topH) — tapering drawRect per IH step ───────────
  for (let y = hL2 + IH; y < topH; y += IH) {
    const t = (y - hL2) / (topH - hL2);
    const w = wL2 - (wL2 - wTop) * Math.pow(t, 1.2);
    drawRect(pts, 0, y, 0, w + 1.5 * S, w + 1.5 * S, IRON);
  }

  // ── 7. CUPOLA & SPIRE ─────────────────────────────────────────────────────
  drawDome(pts, 0, topH, 0, wTop + 3 * S, IRON);
  for (let sy = topH; sy < topH + 24 * S; sy += 4.744) {
    pts.push({ x: 0, y: sy, z: 0, yaw:  0, name: MILCNC });
    pts.push({ x: 0, y: sy, z: 0, yaw: 90, name: MILCNC });
  }
  pts.push({ x: 0, y: topH + 24 * S, z: 0, name: "barrel_red" });

  return applyLimit(pts, 1100);
}

export function gen_taj_mahal(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, p.scale ?? 1);

  const STONE_H = 1.572 * S;
  const STONE2 = "staticobj_wall_stone2";

  const wPlinth = 40 * S;
  const hPlinth = 7 * S;
  const wMain = 24 * S;
  const hMain = 28 * S;

  // 1. THE MASSIVE PLINTH (Base platform)
  // Drawn layer by layer using exact STONE_H step to remove vertical gaps
  for (let y = 0; y < hPlinth; y += STONE_H) {
     drawRect(pts, 0, y, 0, wPlinth, wPlinth, STONE2);
  }

  // 2. THE MAIN MAUSOLEUM BODY
  // Constructed as a chamfered octagon: N, S, E, W faces are flat; corners are diagonal.
  const wFlat = 10 * S; // Half width of the flat cardinal face
  
  for (let y = hPlinth; y < hPlinth + hMain; y += STONE_H) {
     // Cardinal Faces
     drawWall(pts, -wFlat, y, wMain, wFlat, y, wMain, STONE2);      // North
     drawWall(pts, -wFlat, y, -wMain, wFlat, y, -wMain, STONE2);    // South
     drawWall(pts, wMain, y, -wFlat, wMain, y, wFlat, STONE2);      // East
     drawWall(pts, -wMain, y, -wFlat, -wMain, y, wFlat, STONE2);    // West
     
     // Chamfered Diagonal Corner Faces
     drawWall(pts, wFlat, y, wMain, wMain, y, wFlat, STONE2);       // NE
     drawWall(pts, wFlat, y, -wMain, wMain, y, -wFlat, STONE2);     // SE
     drawWall(pts, -wFlat, y, -wMain, -wMain, y, -wFlat, STONE2);   // SW
     drawWall(pts, -wFlat, y, wMain, -wMain, y, wFlat, STONE2);     // NW
  }

  // 3. THE GRAND (IWAN) ARCHES
  // Plaster dark concrete against the cardinal faces to simulate deep archways
  const iwanW = 7 * S;
  const iwanH = 20 * S;
  const DARK = "staticobj_wall_indcnc4_4";
  for (let y = hPlinth; y < hPlinth + iwanH; y += 4.744 * S) { 
     drawWall(pts, -iwanW, y, wMain + 0.5*S, iwanW, y, wMain + 0.5*S, DARK);      // N
     drawWall(pts, -iwanW, y, -wMain - 0.5*S, iwanW, y, -wMain - 0.5*S, DARK);    // S
     drawWall(pts, wMain + 0.5*S, y, -iwanW, wMain + 0.5*S, y, iwanW, DARK);      // E
     drawWall(pts, -wMain - 0.5*S, y, -iwanW, -wMain - 0.5*S, y, iwanW, DARK);    // W
  }

  // 4. THE CENTRAL ONION DOME
  const domeBaseY = hPlinth + hMain;
  const domeBaseR = 12 * S;
  
  // Drum base
  for (let y = domeBaseY; y < domeBaseY + 6*S; y += STONE_H) {
     drawRing(pts, 0, y, 0, domeBaseR, STONE2);
  }
  
  // Swelling "onion" bulb
  const domeStart = domeBaseY + 6*S;
  const domeHeight = 22 * S;
  for (let y = domeStart; y < domeStart + domeHeight; y += STONE_H) {
     const t = (y - domeStart) / domeHeight;
     let r = domeBaseR;
     // Swells to 1.15x radius at t=0.3, then aggressively tapers to 0 at t=1
     if (t < 0.3) r = domeBaseR * (1 + (t / 0.3)*0.15);
     else r = domeBaseR * 1.15 * Math.pow(1 - (t - 0.3)/0.7, 1.3);
     
     if (r > 0.5*S) drawRing(pts, 0, y, 0, r, STONE2);
  }
  
  // Kalash Finial (Spire)
  pts.push({ x: 0, y: domeStart + domeHeight, z: 0, yaw: 0, name: "barrel_red" });

  // 5. THE FOUR CHHATRIS (Small decorative domes bordering the central dome)
  const cOff = 16 * S;
  const chhatriR = 4 * S;
  for (const cx of [-cOff, cOff]) {
     for (const cz of [-cOff, cOff]) {
        // Pillars (Square cross pattern, fixed scale S to avoid auto-scaling gaps)
        for (let y = domeBaseY; y < domeBaseY + 5*S; y += STONE_H) {
           pts.push({ x: cx, y, z: cz - chhatriR/2, yaw: 0,   scale: S, name: STONE2 });
           pts.push({ x: cx, y, z: cz + chhatriR/2, yaw: 180, scale: S, name: STONE2 });
           pts.push({ x: cx - chhatriR/2, y, z: cz, yaw: 90,  scale: S, name: STONE2 });
           pts.push({ x: cx + chhatriR/2, y, z: cz, yaw: -90, scale: S, name: STONE2 });
        }
        // Small Domes (fixed height stack)
        for (let y = domeBaseY + 6*S; y < domeBaseY + 10*S; y += STONE_H) {
           const t = (y - (domeBaseY + 6*S)) / (4*S);
           const r = chhatriR * Math.sqrt(1 - t*t);
           if (r > 0) {
              pts.push({ x: cx, y, z: cz - r, yaw: 0,   scale: S, name: STONE2 });
              pts.push({ x: cx, y, z: cz + r, yaw: 180, scale: S, name: STONE2 });
              pts.push({ x: cx - r, y, z: cz, yaw: 90,  scale: S, name: STONE2 });
              pts.push({ x: cx + r, y, z: cz, yaw: -90, scale: S, name: STONE2 });
           }
        }
        // Chhatri Finial (Spire)
        pts.push({ x: cx, y: domeBaseY + 10*S, z: cz, yaw: 0, scale: S * 0.7, name: "barrel_red" });
     }
  }

  // 6. THE FOUR MINARETS
  const mOff = wPlinth - 4*S; // Placed at the very corners of the expansive plinth
  const minaretR = 2.5 * S;
  const minaretH = 45 * S;
  
  for (const cx of [-mOff, mOff]) {
     for (const cz of [-mOff, mOff]) {
        // Tower shafts (Cruciform/Square stack with fixed scale S to maintain 1.572m height)
        for (let y = hPlinth; y < hPlinth + minaretH; y += STONE_H) {
           pts.push({ x: cx, y, z: cz - minaretR, yaw: 0,   scale: S, name: STONE2 });
           pts.push({ x: cx, y, z: cz + minaretR, yaw: 180, scale: S, name: STONE2 });
           pts.push({ x: cx - minaretR, y, z: cz, yaw: 90,  scale: S, name: STONE2 });
           pts.push({ x: cx + minaretR, y, z: cz, yaw: -90, scale: S, name: STONE2 });
        }
        
        // Projecting balconies
        for (const balcY of [hPlinth + minaretH*0.4, hPlinth + minaretH*0.8]) {
            // A dark stone landing using explicitly sized panels
            drawRect(pts, cx, balcY, cz, minaretR + 1.5*S, minaretR + 1.5*S, "staticobj_wall_indcnc4_4");
        }
        
        // Capping chhatris
        const mTop = hPlinth + minaretH;
        for (let y = mTop; y < mTop + 4*S; y += STONE_H) {
           const t = (y - mTop) / (4*S);
           const r = (minaretR + 1*S) * Math.sqrt(1 - t*t);
           if (r > 0) {
              pts.push({ x: cx, y, z: cz - r, yaw: 0,   scale: S, name: STONE2 });
              pts.push({ x: cx, y, z: cz + r, yaw: 180, scale: S, name: STONE2 });
              pts.push({ x: cx - r, y, z: cz, yaw: 90,  scale: S, name: STONE2 });
              pts.push({ x: cx + r, y, z: cz, yaw: -90, scale: S, name: STONE2 });
           }
        }

        // Aviation light / Spire on top of the minarets
        pts.push({ x: cx, y: mTop + 4*S, z: cz, yaw: 0, scale: S * 0.7, name: "barrel_red" });
     }
  }

  return pts;
}


/**
 * 📐 GREAT PYRAMID OF GIZA
 */
export function gen_pyramid(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const base = Math.min(p.base   ?? 80, 140);
  const h    = Math.min(p.height ?? 60, 100);

  const PW = 9.408;  // STONE2 face width (metres, fixed)
  const PH = 1.572;  // STONE2 panel height (metres, fixed)

  for (let y = 0; y < h; y += PH) {
    const t  = y / h;
    const hw = (base / 2) * (1 - t);
    if (hw < PW * 0.3) break;

    // Four faces — drawWall scale-fills each side perfectly
    drawWall(pts, -hw, y, -hw,  hw, y, -hw, STONE2);  // S
    drawWall(pts,  hw, y, -hw,  hw, y,  hw, STONE2);  // E
    drawWall(pts,  hw, y,  hw, -hw, y,  hw, STONE2);  // N
    drawWall(pts, -hw, y,  hw, -hw, y, -hw, STONE2);  // W

    // Corner cap panels at 45° — fill the diagonal notch at each corner
    if (hw >= PW * 0.5) {
      const cs = +(Math.min(1.0, hw / (PW * 1.2))).toFixed(3);
      pts.push({ x: -hw, y, z: -hw, yaw: 225, scale: cs, name: STONE2 });
      pts.push({ x:  hw, y, z: -hw, yaw: 135, scale: cs, name: STONE2 });
      pts.push({ x:  hw, y, z:  hw, yaw:  45, scale: cs, name: STONE2 });
      pts.push({ x: -hw, y, z:  hw, yaw: 315, scale: cs, name: STONE2 });
    }
  }

  pts.push({ x: 0, y: h, z: 0, name: STONE2 });
  return applyLimit(pts, 1100);
}

/**
 * 🪨 STONEHENGE — Container megalith edition
 *
 * Research:
 *  • Outer Sarsen Circle: 30 upright stones (~4m tall, ~2m wide) with 30 lintels
 *  • Inner Sarsen Horseshoe: 5 trilithons (pairs + lintel), open to NE
 *  • Altar stone at centre; Heel Stone outside entrance axis
 *
 * Approach: land_container_1mo (10m × 2.7m × 2.78m)
 *   pitch=-90 → stands 10m tall as a monolith
 *   flat (no pitch) → lintel spanning between pairs
 *
 * ~77 objects — minimal and clean
 */
export function gen_stonehenge(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const r = Math.max(20, Math.min(p.r ?? 30, 60));

  const MONO   = "land_container_1mo";  // 10m tall when standing (pitch=-90)
  const ALTAR  = "land_container_1a";   // 6.7m × 2.66m flat — altar stone
  const TAU    = 2 * Math.PI;
  const nOuter = 30;
  const lintelY = 10;  // lintels rest on top of 10m uprights

  // ── OUTER SARSEN CIRCLE — 30 upright monoliths ───────────────────────────
  for (let i = 0; i < nOuter; i++) {
    const a   = (i / nOuter) * TAU;
    const yaw = -a * 180 / Math.PI + 90;
    pts.push({ x: r * Math.cos(a), y: 0, z: r * Math.sin(a), yaw, pitch: -90, name: MONO });
  }

  // ── OUTER LINTELS — one per pair, tangentially placed ────────────────────
  for (let i = 0; i < nOuter; i++) {
    const aMid = ((i + 0.5) / nOuter) * TAU;
    const yaw  = -aMid * 180 / Math.PI;  // long axis tangential to ring
    pts.push({ x: r * Math.cos(aMid), y: lintelY, z: r * Math.sin(aMid), yaw, name: MONO });
  }

  // ── INNER HORSESHOE — 5 trilithons, open toward +Z (NE entrance) ─────────
  const rIn = r * 0.45;
  // Angles covering ~240° arc, leaving ~120° open toward +Z
  const trilithAngles = [
    Math.PI * 1.0,   // W
    Math.PI * 0.75,  // SW
    Math.PI * 0.5,   // S
    Math.PI * 1.25,  // NW
    Math.PI * 1.5,   // N
  ];

  for (const a of trilithAngles) {
    const cx  = rIn * Math.cos(a);
    const cz  = rIn * Math.sin(a);
    const yaw = -a * 180 / Math.PI + 90;
    // Tangent offset to separate the pair side-by-side
    const tx  = -Math.sin(a) * 3.5;
    const tz  =  Math.cos(a) * 3.5;
    // Two uprights
    pts.push({ x: cx + tx, y: 0, z: cz + tz, yaw, pitch: -90, name: MONO });
    pts.push({ x: cx - tx, y: 0, z: cz - tz, yaw, pitch: -90, name: MONO });
    // Lintel across the pair
    pts.push({ x: cx, y: lintelY, z: cz, yaw: -a * 180 / Math.PI, name: MONO });
  }

  // ── ALTAR STONE — flat container at centre ───────────────────────────────
  pts.push({ x: 0, y: 0, z: 0, yaw: 0, name: ALTAR });

  // ── HEEL STONE — single upright outside the NE entrance, slightly tilted ─
  pts.push({ x: 0, y: 0, z: r * 1.35, yaw: 0, pitch: -82, name: MONO });

  return pts;
}

/**
 * ⭐ PENTAGRAM — 5-pointed star of castle wall panels
 * Slightly smaller than Stonehenge (r≈22 vs r=30).
 * 5 lines connecting non-adjacent vertices; CASTLE battlement walls with tower tips.
 */
export function gen_pentagram(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const r = Math.max(10, Math.min(p.r ?? 22, 60));
  const S = Math.max(0.5, p.scale ?? 1);
  const h = 4 * S;    // wall height (2 CASTLE rows)
  const step = 2 * S; // CASTLE step

  // 5 star vertices on circle, top-aligned
  const verts = Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    return { x: r * Math.cos(a), z: r * Math.sin(a) };
  });

  // 5 star lines: vertex i → vertex (i+2)%5
  for (let i = 0; i < 5; i++) {
    const v1 = verts[i];
    const v2 = verts[(i + 2) % 5];
    for (let y = 0; y < h; y += step) {
      drawWall(pts, v1.x, y, v1.z, v2.x, y, v2.z, CASTLE);
    }
    // Battlement cap
    drawWall(pts, v1.x, h, v1.z, v2.x, h, v2.z, CASTLE);
  }

  // 5 star points — small tower at each vertex tip
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const vx = r * Math.cos(a), vz = r * Math.sin(a);
    for (let y = 0; y <= h + step; y += step)
      drawRing(pts, vx, y, vz, 2 * S, CASTLE);
  }

  return applyLimit(pts, 1100);
}

/**
 * 🕰️ BIG BEN — Elizabeth Tower (V2 rebuild)
 *
 * Research:
 *  • Square limestone shaft ~15m wide, 55m to clock stage base
 *  • Clock stage: slightly wider (~18m), 12m tall — 4 clock faces each ~7m diameter
 *    → left as a SQUARE HOLE on all 4 sides for user to fill with oversized clock object
 *  • Belfry: 64–76m, pointed Gothic arch openings on all 4 faces
 *  • 4 corner pinnacles (Gothic turrets): rise from 52m to 88m
 *  • Gothic spire: tapers from 76m to 96m apex
 *
 * All rows step by PH=1.572 (STONE2 height) — zero vertical gaps.
 * All drawRect calls supplemented with 45° corner cap panels — zero corner notches.
 */
export function gen_big_ben(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S  = Math.max(0.5, p.scale ?? 1);
  const PH = 1.572;   // STONE2 panel height (fixed metres)
  const PW = 9.408;   // STONE2 panel width  (fixed metres)
  const hw = 7.6 * S; // main shaft half-width

  // Rect + diagonal corner caps to eliminate the 90° notch at every corner
  function rectCC(y: number, hwx: number, hwz: number = hwx) {
    drawWall(pts, -hwx, y, -hwz,  hwx, y, -hwz, STONE2);
    drawWall(pts,  hwx, y, -hwz,  hwx, y,  hwz, STONE2);
    drawWall(pts,  hwx, y,  hwz, -hwx, y,  hwz, STONE2);
    drawWall(pts, -hwx, y,  hwz, -hwx, y, -hwz, STONE2);
    const cs = +Math.min(0.7, Math.min(hwx, hwz) / (PW * 1.2)).toFixed(3);
    if (cs > 0.08) {
      pts.push({ x: -hwx, y, z: -hwz, yaw: 225, scale: cs, name: STONE2 });
      pts.push({ x:  hwx, y, z: -hwz, yaw: 135, scale: cs, name: STONE2 });
      pts.push({ x:  hwx, y, z:  hwz, yaw:  45, scale: cs, name: STONE2 });
      pts.push({ x: -hwx, y, z:  hwz, yaw: 315, scale: cs, name: STONE2 });
    }
  }

  // ── 1. PLINTH — 3 receding steps ─────────────────────────────────────────
  for (let y = 0;     y < 3   * S; y += PH) rectCC(y, hw + 2.8*S);
  for (let y = 3*S;   y < 5   * S; y += PH) rectCC(y, hw + 1.6*S);
  for (let y = 5*S;   y < 6.5 * S; y += PH) rectCC(y, hw + 0.6*S);

  // ── 2. MAIN SHAFT 6.5m–52m — tight rows, no gaps ─────────────────────────
  for (let y = 6.5*S; y < 52*S; y += PH) rectCC(y, hw);

  // ── 3. CLOCK STAGE 52m–64m — SQUARE HOLE on all 4 faces ─────────────────
  //    User fills the opening with an oversized clock object in-game.
  const cHW = hw + 1.4*S;  // clock stage is wider than shaft
  const ho  = 3.8 * S;     // clock hole half-width  (~7.6m opening per face)
  const hY1 = 54  * S;     // hole opens at 54m
  const hY2 = 62  * S;     // hole closes at 62m
  const cs  = +Math.min(0.7, cHW / (PW * 1.2)).toFixed(3);

  for (let y = 52*S; y < 64*S; y += PH) {
    const inHole = y >= hY1 && y < hY2;
    if (!inHole) {
      rectCC(y, cHW);
    } else {
      // Each face split into left + right segments around the opening
      drawWall(pts, -cHW, y, -cHW, -ho, y, -cHW, STONE2);   // S-face left
      drawWall(pts,  +ho, y, -cHW, +cHW, y, -cHW, STONE2);  // S-face right
      drawWall(pts, +cHW, y, +cHW, +ho, y, +cHW, STONE2);   // N-face left
      drawWall(pts,  -ho, y, +cHW, -cHW, y, +cHW, STONE2);  // N-face right
      drawWall(pts, +cHW, y, -cHW, +cHW, y, -ho, STONE2);   // E-face left
      drawWall(pts, +cHW, y,  +ho, +cHW, y, +cHW, STONE2);  // E-face right
      drawWall(pts, -cHW, y, +cHW, -cHW, y, +ho, STONE2);   // W-face left
      drawWall(pts, -cHW, y,  -ho, -cHW, y, -cHW, STONE2);  // W-face right
      // Corners are always intact
      pts.push({ x: -cHW, y, z: -cHW, yaw: 225, scale: cs, name: STONE2 });
      pts.push({ x:  cHW, y, z: -cHW, yaw: 135, scale: cs, name: STONE2 });
      pts.push({ x:  cHW, y, z:  cHW, yaw:  45, scale: cs, name: STONE2 });
      pts.push({ x: -cHW, y, z:  cHW, yaw: 315, scale: cs, name: STONE2 });
    }
  }

  // ── 4. BELFRY 64m–76m — Gothic arch openings on all 4 faces ──────────────
  const bw = hw + 1.2*S;
  const ag = 3.5 * S;   // arch gap half-width
  for (let y = 64*S; y < 76*S; y += PH) {
    drawWall(pts, -bw, y, -bw, -ag, y, -bw, STONE2);
    drawWall(pts,  ag, y, -bw,  bw, y, -bw, STONE2);
    drawWall(pts, -bw, y,  bw, -ag, y,  bw, STONE2);
    drawWall(pts,  ag, y,  bw,  bw, y,  bw, STONE2);
    drawWall(pts, -bw, y, -bw, -bw, y, -ag, STONE2);
    drawWall(pts, -bw, y,  ag, -bw, y,  bw, STONE2);
    drawWall(pts,  bw, y, -bw,  bw, y, -ag, STONE2);
    drawWall(pts,  bw, y,  ag,  bw, y,  bw, STONE2);
  }

  // ── 5. CORNER PINNACLES — 4 Gothic turrets from 52m to 95m ───────────────
  const MILCNC_H = 4.744;
  const po = hw + 3*S;
  for (const [cx, cz] of [[-po,-po],[po,-po],[-po,po],[po,po]]) {
    for (let y = 52*S; y < 84*S; y += MILCNC_H) {
      pts.push({ x: cx, y, z: cz, yaw:  0, name: MILCNC });
      pts.push({ x: cx, y, z: cz, yaw: 90, name: MILCNC });
    }
    for (let y = 84*S; y < 95*S; y += MILCNC_H) {
      const sc = +(1 - ((y - 84*S) / (11*S)) * 0.65).toFixed(3);
      pts.push({ x: cx, y, z: cz, yaw:  0, scale: sc, name: MILCNC });
      pts.push({ x: cx, y, z: cz, yaw: 90, scale: sc, name: MILCNC });
    }
    pts.push({ x: cx, y: 95*S, z: cz, name: STONE2 });
  }

  // ── 6. GOTHIC SPIRE 76m–96m — tightly tapering ───────────────────────────
  for (let y = 76*S; y < 96*S; y += PH) {
    const t  = (y - 76*S) / (22*S);
    const sr = hw * (1 - t) * 0.85;
    if (sr < PH * 0.25) break;
    rectCC(y, sr);
  }
  pts.push({ x: 0, y: 96*S, z: 0, name: STONE2 });

  return applyLimit(pts, 1100);
}

/**
 * ✝️ CHRIST THE REDEEMER
 */
/**
 * 🛕 ANGKOR WAT — Khmer Temple Complex
 *
 * Research:
 *  • 3 concentric rectangular galleries rising like a stepped pyramid
 *  • 5 lotus towers (prasats) in quincunx: 1 central + 4 at inner gallery corners
 *  • Central tower (Bakan): tallest, rises ~65m in reality → 40S here
 *  • Outer enclosure wall + causeway approach from +Z (west entrance)
 *  • Stone material throughout — light sandstone STONE2
 *
 * ~650 panels at scale=1
 */
export function gen_angkor_wat(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S  = Math.max(0.5, p.scale ?? 1);
  const PH = 1.572;  // STONE2 height (fixed)
  const PW = 9.408;  // STONE2 width  (fixed)

  // Rectangular gallery ring with corner caps
  function gallery(y: number, hwx: number, hwz: number) {
    drawWall(pts, -hwx, y, -hwz,  hwx, y, -hwz, STONE2);
    drawWall(pts,  hwx, y, -hwz,  hwx, y,  hwz, STONE2);
    drawWall(pts,  hwx, y,  hwz, -hwx, y,  hwz, STONE2);
    drawWall(pts, -hwx, y,  hwz, -hwx, y, -hwz, STONE2);
    const cs = +Math.min(0.65, Math.min(hwx, hwz) / (PW * 1.4)).toFixed(3);
    if (cs > 0.08) {
      pts.push({ x: -hwx, y, z: -hwz, yaw: 225, scale: cs, name: STONE2 });
      pts.push({ x:  hwx, y, z: -hwz, yaw: 135, scale: cs, name: STONE2 });
      pts.push({ x:  hwx, y, z:  hwz, yaw:  45, scale: cs, name: STONE2 });
      pts.push({ x: -hwx, y, z:  hwz, yaw: 315, scale: cs, name: STONE2 });
    }
  }

  // Lotus tower at (cx, cz) — rings taper upward then swell into a lotus crown
  function lotusTower(cx: number, cz: number, baseY: number, shaftH: number, baseR: number) {
    // Shaft — gradually tapering rings
    for (let y = baseY; y < baseY + shaftH; y += PH) {
      const t = (y - baseY) / shaftH;
      const r = baseR * (1 - t * 0.55);
      if (r > 0.3) drawRing(pts, cx, y, cz, r, STONE2);
    }
    // Lotus crown — 4 swelling bulge rings then taper to point
    const crownBase = baseY + shaftH;
    const steps = [0.95, 1.15, 1.05, 0.80, 0.55, 0.30, 0.12];
    for (let i = 0; i < steps.length; i++) {
      const r = baseR * 0.45 * steps[i];
      if (r > 0.3) drawRing(pts, cx, crownBase + i * PH * 1.8, cz, r, STONE2);
    }
    pts.push({ x: cx, y: crownBase + steps.length * PH * 1.8, z: cz, name: STONE2 });
  }

  // ── 1. OUTER ENCLOSURE WALL — 2 rows ─────────────────────────────────────
  for (let y = 0; y < PH * 2; y += PH) gallery(y, 55*S, 45*S);

  // ── 2. CAUSEWAY — triple-lane approach from +Z entrance ──────────────────
  for (const xOff of [-3*S, 0, 3*S]) {
    drawWall(pts, xOff, 0, 45*S, xOff, 0, 70*S, STONE2);
  }

  // ── 3. GALLERY 1 — first colonnaded enclosure (8m terrace step) ───────────
  const g1Y = 4*S, g1W = 44*S, g1D = 36*S;
  for (let y = g1Y; y < g1Y + PH * 4; y += PH) gallery(y, g1W, g1D);
  // Colonnade suggestion — small ring markers at gallery corners + midpoints
  for (const [cx, cz] of [
    [-g1W, -g1D], [g1W, -g1D], [g1W, g1D], [-g1W, g1D],
    [0, -g1D], [0, g1D], [-g1W, 0], [g1W, 0],
  ]) {
    drawRing(pts, cx, g1Y, cz, 2.5*S, STONE2);
    drawRing(pts, cx, g1Y + 4*S, cz, 2.5*S, STONE2);
  }

  // ── 4. GALLERY 2 — second rising enclosure (16m terrace step) ────────────
  const g2Y = 10*S, g2W = 28*S, g2D = 22*S;
  for (let y = g2Y; y < g2Y + PH * 5; y += PH) gallery(y, g2W, g2D);

  // ── 5. INNER SANCTUARY TERRACE (24m step) ────────────────────────────────
  const g3Y = 18*S, g3W = 16*S;
  for (let y = g3Y; y < g3Y + PH * 5; y += PH) gallery(y, g3W, g3W);

  // ── 6. FIVE LOTUS TOWERS — 1 central + 4 corner ──────────────────────────
  // Central tower (tallest — rises from sanctuary top)
  lotusTower(0, 0, g3Y + PH * 5, 26*S, 5.5*S);

  // 4 corner towers (rise from inner gallery floor)
  const tOff = 13*S;
  for (const [tx, tz] of [[-tOff,-tOff],[tOff,-tOff],[-tOff,tOff],[tOff,tOff]]) {
    lotusTower(tx, tz, g2Y + PH * 5, 16*S, 3.8*S);
  }

  return applyLimit(pts, 1100);
}

/**
 * 🏛️ THE PARTHENON
 *
 * Research:
 *  • Doric temple, Athens — 69.5m × 30.9m footprint, 10.4m columns
 *  • 8 columns per short face (east/west), 17 per long face (north/south)
 *  • 3-step marble stylobate, triglyphed entablature, triangular pediments
 *  • Inner cella chamber (naos) enclosed by continuous stone walls
 *
 * Object choices (P3D-verified):
 *  • Columns: staticobj_pier_tube_small (0.833m × 13m vertical) — per-column
 *    scale set so height = colH * S giving true cylindrical Doric columns
 *  • Walls/platform/entablature: STONE2 (9.408m × 1.572m light stone)
 */
export function gen_parthenon(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, Math.min(2, p.scale ?? 1));

  // Physical constants — NEVER multiply by S
  const STONE2_H  = 1.572;
  const PIER_TUBE = "staticobj_pier_tube_small";
  const PIER_H    = 13.000;  // natural height of pier_tube_small

  // Column scale: at S=1 columns are ~14m tall (~1.0m diameter) — grand temple
  const colSc = +(1.1 * S).toFixed(4);
  const colH  = PIER_H * colSc;

  // Footprint — ~2.15:1 ratio (historical 69.5×30.9m = 2.25:1)
  const halfX = 13 * S;   // half-width
  const halfZ = 28 * S;   // half-length

  const nFront = 8;                              // columns on each short face
  const nSide  = 17;                             // columns on each long face (incl. corners)
  const spX = (2 * halfX) / (nFront - 1);       // ≈ 3.7m at S=1
  const spZ = (2 * halfZ) / (nSide  - 1);       // ≈ 3.5m at S=1

  // ── 1. STYLOBATE — 3-step marble platform ────────────────────────────────────
  for (let st = 0; st < 3; st++) {
    const extra = (2 - st) * spX * 0.4;
    const cx = halfX + extra;
    const cz = halfZ + extra;
    const sy = st * STONE2_H;
    drawRect(pts, 0, sy, 0, cx, cz, STONE2);
    pts.push({ x: -cx, y: sy, z: -cz, yaw: 225, name: STONE2 });
    pts.push({ x:  cx, y: sy, z: -cz, yaw: 135, name: STONE2 });
    pts.push({ x:  cx, y: sy, z:  cz, yaw:  45, name: STONE2 });
    pts.push({ x: -cx, y: sy, z:  cz, yaw: 315, name: STONE2 });
  }
  const platY = 3 * STONE2_H;  // column base Y

  // ── 2. COLONNADE — pier_tube_small per-column scaled to colH ─────────────────
  // Front (z = +halfZ) and Back (z = -halfZ) — 8 each
  for (let i = 0; i < nFront; i++) {
    const x = -halfX + i * spX;
    pts.push({ x, y: platY, z:  halfZ, scale: colSc, name: PIER_TUBE });
    pts.push({ x, y: platY, z: -halfZ, scale: colSc, name: PIER_TUBE });
  }
  // North (x = -halfX) and South (x = +halfX) flanks — skip corners (already placed above)
  for (let i = 1; i < nSide - 1; i++) {
    const z = -halfZ + i * spZ;
    pts.push({ x: -halfX, y: platY, z, scale: colSc, name: PIER_TUBE });
    pts.push({ x:  halfX, y: platY, z, scale: colSc, name: PIER_TUBE });
  }

  const colTop = platY + colH;

  // ── 3. ENTABLATURE — 2 rows of STONE2 capping the colonnade ──────────────────
  for (let row = 0; row < 2; row++) {
    const ey = colTop + row * STONE2_H;
    const ex = halfX + S;
    const ez = halfZ + S;
    drawRect(pts, 0, ey, 0, ex, ez, STONE2);
    pts.push({ x: -ex, y: ey, z: -ez, yaw: 225, name: STONE2 });
    pts.push({ x:  ex, y: ey, z: -ez, yaw: 135, name: STONE2 });
    pts.push({ x:  ex, y: ey, z:  ez, yaw:  45, name: STONE2 });
    pts.push({ x: -ex, y: ey, z:  ez, yaw: 315, name: STONE2 });
  }
  const entabY = colTop + 2 * STONE2_H;

  // ── 4. PEDIMENTS — raking cornices on the two short faces ────────────────────
  const pedH = 4 * S;
  for (const fz of [-halfZ, halfZ]) {
    drawWall(pts, -halfX, entabY, fz,  halfX, entabY,        fz, STONE2);
    drawWall(pts, -halfX, entabY, fz,  0,     entabY + pedH, fz, STONE2);
    drawWall(pts,  halfX, entabY, fz,  0,     entabY + pedH, fz, STONE2);
  }

  // ── 5. CELLA — inner chamber walls running floor to entablature ──────────────
  const cellX = halfX - spX * 0.5;
  const cellZ = halfZ - spZ * 0.5;
  for (let y = platY; y < colTop - STONE2_H * 0.5; y += STONE2_H) {
    drawWall(pts, -cellX, y, -cellZ,  cellX, y, -cellZ, STONE2);
    drawWall(pts, -cellX, y,  cellZ,  cellX, y,  cellZ, STONE2);
    drawWall(pts, -cellX, y, -cellZ, -cellX, y,  cellZ, STONE2);
    drawWall(pts,  cellX, y, -cellZ,  cellX, y,  cellZ, STONE2);
  }

  return applyLimit(pts, 1100);
}

/**
 * 🌉 ARC DE TRIOMPHE
 * Paris, 1836. 50m tall × 45m wide × 22m deep limestone triumphal arch.
 * Main arch (N/S faces): 29m tall, 14.6m wide semicircular opening.
 * Secondary arches (E/W faces): 18.7m tall, 8.5m wide.
 * Attic with relief panels above arches on all 4 faces.
 */
export function gen_arc_triomphe(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, p.scale ?? 1);

  // Real dimensions (metres → units at S=1)
  const hw  = 22.5 * S;   // half-width  (45m total, N/S face width)
  const hd  = 11   * S;   // half-depth  (22m total, E/W face width)
  const h   = 50   * S;   // total height

  // Main arch (on N/S faces): radius=7.3m, spring at 22m
  const mAR     = 7.3  * S;
  const mSpring = 22   * S;
  const mHalf   = 7.3  * S;   // half opening width

  // Secondary arch (on E/W faces): radius=4.25m, spring at 14.5m
  const sAR     = 4.25 * S;
  const sSpring = 14.5 * S;
  const sHalf   = 4.25 * S;   // half opening width

  const rowStep = 2.3 * S;  // CNC8 panel height

  for (let y = 0; y < h; y += rowStep) {
    // ── N face (z = -hd) and S face (z = +hd) ──────────────────────────
    if (y < mSpring) {
      // Below main arch spring: two solid piers, open centre
      drawWall(pts, -hw, y, -hd, -mHalf, y, -hd, CNC8);
      drawWall(pts,  mHalf, y, -hd,  hw, y, -hd, CNC8);
      drawWall(pts, -hw, y,  hd, -mHalf, y,  hd, CNC8);
      drawWall(pts,  mHalf, y,  hd,  hw, y,  hd, CNC8);
    } else {
      // In/above arch zone
      const dy   = y - mSpring;
      const archX = dy < mAR ? Math.sqrt(mAR * mAR - dy * dy) : 0;
      if (archX > 0.5) {
        // Arch sides still cut out
        drawWall(pts, -hw, y, -hd, -archX, y, -hd, CNC8);
        drawWall(pts,  archX, y, -hd,  hw, y, -hd, CNC8);
        drawWall(pts, -hw, y,  hd, -archX, y,  hd, CNC8);
        drawWall(pts,  archX, y,  hd,  hw, y,  hd, CNC8);
      } else {
        // Above arch crown: full attic wall
        drawWall(pts, -hw, y, -hd, hw, y, -hd, CNC8);
        drawWall(pts, -hw, y,  hd, hw, y,  hd, CNC8);
      }
    }

    // ── E face (x = +hw) and W face (x = -hw) ──────────────────────────
    if (y < sSpring) {
      drawWall(pts, -hw, y, -hd, -hw, y, -sHalf, CNC8);
      drawWall(pts, -hw, y,  sHalf, -hw, y,  hd, CNC8);
      drawWall(pts,  hw, y, -hd,  hw, y, -sHalf, CNC8);
      drawWall(pts,  hw, y,  sHalf,  hw, y,  hd, CNC8);
    } else {
      const dy   = y - sSpring;
      const archZ = dy < sAR ? Math.sqrt(sAR * sAR - dy * dy) : 0;
      if (archZ > 0.5) {
        drawWall(pts, -hw, y, -hd, -hw, y, -archZ, CNC8);
        drawWall(pts, -hw, y,  archZ, -hw, y,  hd, CNC8);
        drawWall(pts,  hw, y, -hd,  hw, y, -archZ, CNC8);
        drawWall(pts,  hw, y,  archZ,  hw, y,  hd, CNC8);
      } else {
        drawWall(pts, -hw, y, -hd, -hw, y, hd, CNC8);
        drawWall(pts,  hw, y, -hd,  hw, y, hd, CNC8);
      }
    }
  }

  // ── Arch voussoir crowns (intrados panels facing inward) ──────────────
  // Main arches — N and S faces
  const mSteps = 14;
  for (let s = 0; s <= mSteps; s++) {
    const a = (s / mSteps) * Math.PI;
    const ax = Math.cos(a) * mAR;
    const ay = mSpring + Math.sin(a) * mAR;
    pts.push({ x: ax, y: ay, z: -hd - 0.5*S, yaw: 180, name: STONE2 });
    pts.push({ x: ax, y: ay, z:  hd + 0.5*S, yaw: 0,   name: STONE2 });
  }
  // Secondary arches — E and W faces
  const sSteps = 10;
  for (let s = 0; s <= sSteps; s++) {
    const a = (s / sSteps) * Math.PI;
    const az = Math.cos(a) * sAR;
    const ay = sSpring + Math.sin(a) * sAR;
    pts.push({ x: -hw - 0.5*S, y: ay, z: az, yaw: -90, name: STONE2 });
    pts.push({ x:  hw + 0.5*S, y: ay, z: az, yaw:  90, name: STONE2 });
  }

  // ── Attic cap ─────────────────────────────────────────────────────────
  drawRect(pts, 0, h, 0, hw, hd, CNC8);
  // Corner fill panels to close the 90° notches at each attic corner
  pts.push({ x: -hw, y: h, z: -hd, yaw: 225, scale: 0.5, name: CNC8 });
  pts.push({ x:  hw, y: h, z: -hd, yaw: 135, scale: 0.5, name: CNC8 });
  pts.push({ x:  hw, y: h, z:  hd, yaw:  45, scale: 0.5, name: CNC8 });
  pts.push({ x: -hw, y: h, z:  hd, yaw: 315, scale: 0.5, name: CNC8 });

  return applyLimit(pts, 1100);
}

/**
 * 🐚 SYDNEY OPERA HOUSE
 * Sydney, 1973. Architect: Jørn Utzon. Iconic sail-shell roof over Bennelong Point.
 * Concert Hall (west) peaks at 67m; Opera Theatre (east) at 59m.
 * Shells are barrel vaults running along Z; each rib panel faces radially outward.
 * Each vault fans from full size at front (+Z) to nothing at rear (-Z).
 */
export function gen_sydney_opera(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, p.scale ?? 1);

  // 3-tier stepped podium (Bennelong peninsula base)
  for (let tier = 0; tier < 3; tier++) {
    drawRect(pts, 0, tier*2.5*S, 0, (45-tier*4)*S, (22-tier*3)*S, CNC8);
  }
  const podTop = 7.5*S;

  // Sail helper: ring-stack forming an asymmetric shell (taller on one side).
  // Creates concentric rings of decreasing radius and increasing Y → shell shape.
  // cx/cz: centre, baseR: ground radius, peakH: top height, lean: tilt direction (+/-Z)
  function drawSail(cx: number, cz: number, baseR: number, peakH: number, lean: number) {
    const step = 1.572;                                  // STONE2 flush step
    const nRings = Math.max(4, Math.ceil(peakH / step));
    for (let i = 0; i < nRings; i++) {
      const t = i / (nRings - 1);
      const r = baseR * (1 - Math.sin(t * Math.PI * 0.5) * 0.9);   // cosine taper → 10% at top
      if (r < 0.5) break;
      const y = podTop + t * peakH;
      const zOffset = lean * Math.pow(t, 1.6) * baseR * 0.4;         // lean makes the shell curve
      drawRing(pts, cx, y, cz + zOffset, r, STONE2);
    }
  }

  // Concert Hall sails (west cluster, lean forward +Z)
  drawSail(-18*S,  0,     12*S, 28*S,  1);
  drawSail(-26*S,  3*S,    8*S, 18*S,  1);
  drawSail(-30*S, -4*S,    6*S, 12*S,  1);

  // Opera Theatre sails (east cluster, lean forward +Z — slightly smaller)
  drawSail( 18*S,  0,     10*S, 23*S,  1);
  drawSail( 25*S, -3*S,    7*S, 15*S,  1);
  drawSail( 30*S,  3*S,    5*S, 10*S,  1);

  // Restaurant shell (far rear, low shallow sail leaning back)
  drawSail(  0,   12*S,    8*S, 10*S, -0.6);

  return applyLimit(pts, 1100);
}

/**
 * 🗼 CN TOWER
 * Toronto, 1976. 553m — free-standing concrete telecommunications tower.
 * Y-shaped tripod base (3 massive fins), hexagonal shaft, large observation pod
 * at 342m with glass-floor lower deck and SkyPod upper disc at 447m, antenna to 553m.
 */
export function gen_cn_tower(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, p.scale ?? 1);
  // Compress 553m to 185 units: 1 unit ≈ 3m
  const h      = 185 * S;
  const podY   = 112 * S;   // main observation pod   (real 342m)
  const spaceY = 146 * S;   // SkyPod upper disc       (real 447m)

  // ── Y-shaped tripod base — containers stacked flush (CONT_H=2.782m step) ──
  const CONT = "land_container_1bo";
  const CONT_H = 2.782, CONT_W = 2.702;
  const legStacks = Math.ceil(48 * S / CONT_H);
  for (let i = 0; i < 3; i++) {
    const a  = (i / 3) * Math.PI * 2;
    const cA = Math.cos(a), sA = Math.sin(a);
    const yaw = 90 - a * 180 / Math.PI;
    for (let stack = 0; stack < legStacks; stack++) {
      const t  = stack / Math.max(1, legStacks - 1);
      const rr = (20 - t * 16) * S;  // r=20S → r=4S
      const yy = stack * CONT_H;     // flush vertical stacking
      pts.push({ x: cA*rr,                      y: yy, z: sA*rr,                      yaw, name: CONT });
      pts.push({ x: cA*rr - sA*CONT_W,          y: yy, z: sA*rr + cA*CONT_W,          yaw, name: CONT });
      pts.push({ x: cA*rr + sA*CONT_W,          y: yy, z: sA*rr - cA*CONT_W,          yaw, name: CONT });
    }
  }

  // ── Main shaft — tapers r=4.5→3.2, rings at 4.5*S (MILCNC effective height ~4.14m → no gaps)
  for (let y = 48*S; y < podY; y += 4.5*S) {
    const t = (y - 48*S) / (podY - 48*S);
    const r = (4.5 - t * 1.3) * S;
    drawRing(pts, 0, y, 0, r, MILCNC);
  }

  // ── Main observation pod — broad donut shape (real radius ~17m) ───────────
  // Flares out from shaft at bottom, wide band in middle, tapers back at top
  const podSteps = 10;
  for (let di = 0; di <= podSteps; di++) {
    const t    = di / podSteps;
    // Bell-curve profile: narrow→wide→narrow
    const bell = Math.sin(t * Math.PI);
    const r    = (3.5 + bell * 17) * S;
    const y    = podY + di * 1.6 * S;
    drawRing(pts, 0, y, 0, r, CNC8);
  }
  // Floor plate of observation deck
  drawDisk(pts, 0, podY + 5*S, 0, 18*S, MILCNC);
  // Glass-floor level ring (slightly below main deck)
  drawRing(pts, 0, podY + 2*S, 0, 16*S, CNC4);

  // ── Shaft between pods — 4.5*S rings from pod top to SkyPod (no gaps)
  for (let y = podY + podSteps*1.6*S; y < spaceY; y += 4.5*S) {
    drawRing(pts, 0, y, 0, 3.2*S, MILCNC);
  }

  // ── SkyPod (upper disc at 447m) ───────────────────────────────────────────
  for (let di = 0; di <= 4; di++) {
    const t    = di / 4;
    const bell = Math.sin(t * Math.PI);
    const r    = (2 + bell * 7) * S;
    drawRing(pts, 0, spaceY + di * 1.5*S, 0, r, CNC8);
  }
  drawDisk(pts, 0, spaceY + 2*S, 0, 6*S, MILCNC);

  // ── Antenna/spire ─────────────────────────────────────────────────────────
  for (let y = spaceY + 8*S; y <= h - 4; y += 4*S) {
    const t = (y - spaceY) / (h - spaceY);
    const r = (2.8 - t * 2.5) * S;
    if (r > 0.25) drawRing(pts, 0, y, 0, r, CNC4);
  }

  return applyLimit(pts, 1100);
}

/**
 * 🗼 SPACE NEEDLE
 * Seattle, 1962. 184m — tripod base, ultra-thin shaft, flying-saucer observation deck.
 * MILCNC shaft rings at 4.5*S spacing = near-flush coverage (panel height ~4.2m at this radius).
 */
export function gen_space_needle(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, p.scale ?? 1), h = 184 * S;

  // Tripod base — containers stacked flush (CONT_H=2.782m step, CONT_W=2.702m side-by-side)
  const CONT_SN = "land_container_1bo";
  const SN_H = 2.782, SN_W = 2.702;
  const snStacks = Math.ceil(50 * S / SN_H);
  for (let i = 0; i < 3; i++) {
    const a   = (i / 3) * Math.PI * 2;
    const cA  = Math.cos(a), sA = Math.sin(a);
    const yaw = 90 - a * 180 / Math.PI;
    for (let stack = 0; stack < snStacks; stack++) {
      const t  = stack / Math.max(1, snStacks - 1);
      const rr = (18 - t * 14) * S;  // r=18S → r=4S
      const yy = stack * SN_H;        // flush vertical stacking
      pts.push({ x: cA*rr,              y: yy, z: sA*rr,              yaw, name: CONT_SN });
      pts.push({ x: cA*rr - sA*SN_W,   y: yy, z: sA*rr + cA*SN_W,   yaw, name: CONT_SN });
      pts.push({ x: cA*rr + sA*SN_W,   y: yy, z: sA*rr - cA*SN_W,   yaw, name: CONT_SN });
    }
  }

  // Shaft — MILCNC rings every 4.5*S (effective panel height ~4.2m → slight overlap, no gaps)
  for (let y = 50*S; y <= 132*S; y += 4.5*S) {
    drawRing(pts, 0, y, 0, 4.5*S, MILCNC);
  }

  // Observation deck — flaring saucer profile
  for (let di = 0; di <= 6; di++) {
    const t = di / 6;
    const r = (4 + Math.sin(t * Math.PI) * 18) * S;
    drawRing(pts, 0, (133 + di*1.5)*S, 0, r, CNC8);
  }
  drawDisk(pts, 0, 136*S, 0, 19*S, MILCNC);

  // Spire — CNC4 rings tapering from r=3 to near zero
  for (let y = 143*S; y < h; y += 4*S) {
    const t = (y - 143*S) / (h - 143*S);
    const r = (3 - t * 2.7) * S;
    if (r > 0.3) drawRing(pts, 0, y, 0, r, CNC4);
  }

  return applyLimit(pts, 1100);
}

/**
 * 🗼 LEANING TOWER OF PISA
 * Pisa, 1372. 56m white marble campanile — 8 tiers with open colonnaded galleries.
 * 3.97° lean (4°) toward south. STONE2 rings at 1.572*S (flush, panel-height step).
 * Gallery columns project at r=9.5*S at each tier floor.
 */
export function gen_pisa(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S  = Math.max(0.5, p.scale ?? 1);
  const h  = 56 * S;
  const tilt = Math.sin(3.97 * Math.PI / 180); // lean: Δx per unit Y
  const rMain = 7.5 * S;   // main cylinder radius
  const rCol  = 9.5 * S;   // colonnade gallery radius
  const step  = 1.572 * S; // STONE2 panel height — flush rings

  // Gallery floors: blind base + 6 open gallery tiers + belfry base
  const galleryYs = [0, 7*S, 14*S, 21*S, 28*S, 35*S, 42*S];

  for (let y = 0; y <= h; y += step) {
    const lean = tilt * y;
    // Main cylinder ring
    drawRing(pts, lean, y, 0, rMain, STONE2);
    // Colonnade gallery ring at each tier floor (projecting column band)
    for (const gy of galleryYs) {
      if (Math.abs(y - gy) < step * 0.6) {
        drawRing(pts, lean, y, 0, rCol, STONE2);
        break;
      }
    }
  }

  // Belfry — narrower cylinder, slightly less lean continuation, 7 rings
  const bBase = h;
  for (let dy = 0; dy <= 7 * step; dy += step) {
    const y    = bBase + dy;
    const lean = tilt * y;
    drawRing(pts, lean, y, 0, 6*S, STONE2);
  }

  return applyLimit(pts, 1100);
}


// ═══════════════════════════════════════════════════════════════════════════════
