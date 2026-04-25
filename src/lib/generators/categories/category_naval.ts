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
// NAVAL
// ─────────────────────────────────────────────────────────────────────────────

//  NAVAL / INDUSTRIAL
// ═══════════════════════════════════════════════════════════════════════════════

export function gen_carrier(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const L = Math.min(p.length ?? 200, 250);   // flight deck length (bow +Z, stern -Z)

  // ── Constants ─────────────────────────────────────────────────────────────
  const CONT      = "land_container_1bo";
  const CONT_H    = 2.782;   // vertical step — exact, never S-scale
  const CONT_W    = 2.702;   // lateral step — exact
  const HULL_ROWS = 4;       // container rows high (≈11.128m total hull height)
  const deckY     = HULL_ROWS * CONT_H;  // 11.128 — flight deck surface

  // Hull half-widths (port/starboard in X)
  const HULL_X    = 16;      // containers placed at x=±16
  // Bow taper cutoff: containers stop 20m from bow, replaced by IND10 cap ring
  const bowTaperZ = L / 2 - 20;

  // ── Hull sides — container stacks running Z axis ───────────────────────────
  // Port side (x = -HULL_X), Starboard side (x = +HULL_X)
  // Rows 0-3 stacked vertically using exact CONT_H step
  for (const hullX of [-HULL_X, HULL_X]) {
    for (let stack = 0; stack < HULL_ROWS; stack++) {
      const y = stack * CONT_H;
      for (let z = -L / 2; z <= bowTaperZ; z += CONT_W) {
        pts.push({ x: hullX, y, z, yaw: 0, name: CONT });
      }
    }
  }

  // Hull lateral fill — containers laid across (yaw=90) filling the hull floor
  // 1 layer at y=0 as keel reinforcement, spaced CONT_W apart along X
  for (let stack = 0; stack < 2; stack++) {
    const y = stack * CONT_H;
    for (let x = -HULL_X + CONT_W; x < HULL_X; x += CONT_W) {
      for (let z = -L / 2 + 5; z <= bowTaperZ - 5; z += CONT_H) {
        pts.push({ x, y, z, yaw: 90, name: CONT });
      }
    }
  }

  // ── Bow cap ring — IND10 panels forming the rounded bow profile ────────────
  const bowR = HULL_X;
  const bowZ = L / 2;
  const nBow = Math.max(6, Math.ceil(Math.PI * bowR / 9.012));
  for (let i = 0; i < nBow; i++) {
    const ang  = (i / nBow) * Math.PI;          // 0..π (port to starboard arc)
    const bx   = bowR * Math.cos(ang - Math.PI / 2);   // maps 0→-R..π→+R
    const bz   = bowZ + Math.abs(Math.sin(ang)) * 8;   // bulge forward
    const yaw  = (ang - Math.PI / 2) * (180 / Math.PI) + 90;
    for (let row = 0; row < HULL_ROWS; row++) {
      pts.push({ x: bx, y: row * CONT_H, z: bz, yaw, name: CONT });
    }
  }
  // Bow face — IND10 flat front panels at bowZ
  for (let row = 0; row < HULL_ROWS; row++) {
    pts.push({ x: 0, y: row * CONT_H, z: bowZ + 10, yaw: 0, name: IND10 });
  }

  // ── Flight deck — IND10 flat panels (pitch:-90) ────────────────────────────
  // Main deck: x = -HULL_X to +HULL_X+2 (slight starboard overhang for island)
  // z = -L/2 to L/2+5 (flush with bow end)
  const deckPanW = 9.012;
  const deckPanD = 9.758;
  for (let dx = -HULL_X; dx <= HULL_X + 2; dx += deckPanW) {
    for (let dz = -L / 2; dz <= L / 2 + 5; dz += deckPanD) {
      pts.push({ x: dx, y: deckY, z: dz, yaw: 0, pitch: -90, name: IND10 });
    }
  }

  // Angled deck section — 8° to port at bow (standard angled deck)
  // 4 rows of IND10 panels extending port side at 8° yaw from bow end
  const angStart = L / 2 - 90;   // start z
  const angEnd   = L / 2 - 10;   // end z (bow)
  const angYaw   = 8;             // 8° port
  for (let dz = angStart; dz <= angEnd; dz += deckPanD) {
    for (let row = 0; row < 4; row++) {
      const ox = -(HULL_X + 2 + row * deckPanW);   // extends to port
      pts.push({ x: ox, y: deckY, z: dz, yaw: angYaw, pitch: -90, name: IND10 });
    }
  }

  // ── Island superstructure — starboard side, 2/3 from stern ────────────────
  // Real Nimitz: island at ~2/3 from stern = z = -L/2 + L*2/3 = L/6
  const islandZ  = L / 6;
  const islandX  = HULL_X + 5;   // just outboard of starboard hull
  const islandHW = 8;             // island half-width along X
  const islandHD = 5;             // island half-depth along Z
  const cncStep  = 2.300;         // CNC8 panel height

  // Island base: 3 rows of CNC8 walls
  for (let row = 0; row < 3; row++) {
    const iy = deckY + row * cncStep;
    drawRect(pts, islandX, iy, islandZ, islandHW, islandHD, CNC8);
    pts.push({ x: islandX - islandHW, y: iy, z: islandZ - islandHD, yaw: 225, name: CNC8 });
    pts.push({ x: islandX + islandHW, y: iy, z: islandZ - islandHD, yaw: 135, name: CNC8 });
    pts.push({ x: islandX + islandHW, y: iy, z: islandZ + islandHD, yaw:  45, name: CNC8 });
    pts.push({ x: islandX - islandHW, y: iy, z: islandZ + islandHD, yaw: 315, name: CNC8 });
  }

  // Control tower object on island top
  const towerY = deckY + 3 * cncStep;
  pts.push({ x: islandX, y: towerY, z: islandZ, yaw: 0, name: "land_mil_controltower" });

  // Radar tower behind control tower
  pts.push({ x: islandX, y: towerY, z: islandZ - 12, yaw: 0, name: "land_airfield_radar_tall" });

  // Mobile radar unit beside island base
  pts.push({ x: islandX, y: deckY, z: islandZ + 10, yaw: 90, name: "land_mil_radar_mobile1" });

  // Flagpoles on island (3 along X edge)
  for (let fi = -1; fi <= 1; fi++) {
    pts.push({ x: islandX + fi * 3, y: towerY + 18, z: islandZ - islandHD - 1, yaw: 0, name: "staticobj_misc_flagpole" });
  }

  // ── Catapult tracks — 4 tracks at bow ─────────────────────────────────────
  // 2 tracks port side, 2 starboard side of centreline, along Z axis
  const catStart = L / 2 - 90;
  const catEnd   = L / 2 + 2;
  const catStep  = 4.017;   // CNC4 width
  const catZList = [-8, -4, 4, 8];  // 4 tracks offset from X centreline
  for (const catX of catZList) {
    for (let cz = catStart; cz <= catEnd; cz += catStep) {
      pts.push({ x: catX, y: deckY + 0.3, z: cz, yaw: 0, name: CNC4 });
    }
  }

  // ── Arresting wire gear — 3 at stern ──────────────────────────────────────
  const wireStep = 12;
  for (let wi = 0; wi < 3; wi++) {
    const wz = -L / 2 + 30 + wi * wireStep;
    // CNC4 panels across deck (yaw=90) marking each wire
    for (let wx = -HULL_X + 2; wx <= HULL_X - 2; wx += 4.017) {
      pts.push({ x: wx, y: deckY + 0.2, z: wz, yaw: 90, name: CNC4 });
    }
  }

  // ── Stern crane ───────────────────────────────────────────────────────────
  pts.push({ x: 0, y: deckY, z: -L / 2 + 20, yaw: 180, name: "staticobj_pier_crane_a" });

  // ── Lifeboats — 8 along port side at deck level ────────────────────────────
  const lbCount  = 8;
  const lbSpan   = L * 0.6;          // spread over 60% of ship length
  const lbStart  = -lbSpan / 2;
  for (let li = 0; li < lbCount; li++) {
    const lz = lbStart + (li / (lbCount - 1)) * lbSpan;
    pts.push({ x: -(HULL_X + 2), y: deckY - CONT_H, z: lz, yaw: 90, name: "staticobj_boat_small4" });
  }

  // ── Flight deck spotlights — 4 near edges ─────────────────────────────────
  const spotPositions: [number, number][] = [
    [-HULL_X + 4, L / 2 - 20],   // port bow
    [ HULL_X - 4, L / 2 - 20],   // starboard bow
    [-HULL_X + 4, -L / 2 + 30],  // port stern
    [ HULL_X - 4, -L / 2 + 30],  // starboard stern
  ];
  for (const [sx, sz] of spotPositions) {
    pts.push({ x: sx, y: deckY + 0.5, z: sz, yaw: 0, name: "staticobj_misc_spotlight" });
  }

  return applyLimit(pts, 1150);
}

export function gen_submarine(p: GenParams): Point3D[] {
  // Virginia-class nuclear submarine
  // Length ~115m, beam ~10m, container hull (3-wide × 3-tall), sail at 25% from bow,
  // cruciform tail fins, twin torpedo bays at bow, periscope + snorkel masts.
  const pts: Point3D[] = [];
  const L     = Math.min(p.length ?? 100, 150);
  const S     = Math.max(0.5, L / 100);

  // Container constants — never scaled
  const CONT   = "land_container_1bo";
  const CONT_H = 2.782;   // vertical step
  const CONT_W = 2.702;   // lateral step
  const CONT_L = 6.096;   // container length along Z

  // ── Pressure hull — 3 lanes × 3 layers of containers along Z axis ────────
  // Leave 10m at each end for IND10 cap rings
  const bowCapZ   =  L / 2 - 10;
  const sternCapZ = -L / 2 + 10;
  const laneOffsets = [-CONT_W, 0, CONT_W];
  for (const lx of laneOffsets) {
    for (let layer = 0; layer < 3; layer++) {
      const cy = layer * CONT_H;
      for (let z = sternCapZ; z <= bowCapZ; z += CONT_L) {
        pts.push({ x: lx, y: cy, z, yaw: 0, name: CONT });
      }
    }
  }

  // ── Bow and stern IND10 end caps ──────────────────────────────────────────
  const capR = CONT_W * 1.5;   // covers 3-lane cross-section
  drawRing(pts, 0, CONT_H, bowCapZ,   capR, IND10);
  drawRing(pts, 0, CONT_H, sternCapZ, capR, IND10);

  // ── Sail / conning tower — located at Z = +L/4 (25% from bow) ────────────
  // Sail: drawRect of CNC8, footprint 8m×6m, 3 rows high
  const sailZ  = L / 4;
  const sailHW = 4;    // half of 8m footprint
  const sailHD = 3;    // half of 6m footprint
  const sailY0 = 3 * CONT_H;  // sits on top of hull
  for (let row = 0; row < 3; row++) {
    const sy = sailY0 + row * 2.3;
    drawRect(pts, 0, sy, sailZ, sailHW, sailHD, CNC8);
    // corner fills
    pts.push({ x: -sailHW, y: sy, z: sailZ - sailHD, yaw: 225, name: CNC8 });
    pts.push({ x:  sailHW, y: sy, z: sailZ - sailHD, yaw: 135, name: CNC8 });
    pts.push({ x:  sailHW, y: sy, z: sailZ + sailHD, yaw:  45, name: CNC8 });
    pts.push({ x: -sailHW, y: sy, z: sailZ + sailHD, yaw: 315, name: CNC8 });
  }
  // Sail top ring (bridge/fairwater)
  const sailTop = sailY0 + 3 * 2.3;
  drawRing(pts, 0, sailTop, sailZ, sailHW * 0.8, CNC4);

  // ── Periscope mast (staticobj_pier_tube_small, h=13m) ─────────────────────
  pts.push({
    x: 0, y: sailTop + 1, z: sailZ,
    yaw: 0, name: "staticobj_pier_tube_small"
  });

  // ── Snorkel mast (staticobj_pier_tube_big, h=20m) ─────────────────────────
  pts.push({
    x: 0, y: sailTop + 1, z: sailZ + sailHD,
    yaw: 0, name: "staticobj_pier_tube_big"
  });

  // ── Cruciform tail control surfaces — at stern cap ───────────────────────
  // Top fin: drawWall upward from hull top; port/starboard: drawWall outward
  const finZ    = sternCapZ + 2;           // just inside stern cap
  const hullTop = 3 * CONT_H;             // top of 3-layer hull
  const hullMid = 1.5 * CONT_H;           // mid-height of hull
  const hullSide = CONT_W + 1;            // outer edge of hull cross-section

  // Top fin
  drawWall(pts, 0, hullTop, finZ,  0, hullTop + 8, finZ, IND10);
  // Port and starboard fins at hull mid-height
  drawWall(pts,  hullSide, hullMid, finZ,  hullSide + 6, hullMid, finZ, IND10);
  drawWall(pts, -hullSide, hullMid, finZ, -hullSide - 6, hullMid, finZ, IND10);

  // ── Bow torpedo bay doors — 2 CNC4 panels at bow tip ─────────────────────
  const bowZ = L / 2 - 2;
  pts.push({ x:  CONT_W, y: CONT_H, z: bowZ, yaw:  90, name: CNC4 });
  pts.push({ x: -CONT_W, y: CONT_H, z: bowZ, yaw: -90, name: CNC4 });

  // ── ESM/radar antenna — small spotlight on sail bridge ────────────────────
  pts.push({ x: 0.8 * S, y: sailTop, z: sailZ - sailHD * 0.5, yaw: 0, name: "staticobj_misc_spotlight" });

  return applyLimit(pts, 1100);
}

export function gen_oil_rig(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S      = Math.max(0.5, p.scale ?? 1);
  const legOff = 22 * S;   // distance of each leg from centre
  const deckH  = 40;       // fixed deck height — not S-scaled
  const step   = 9.758;    // IND10 step — NEVER multiply by S

  // Container constants
  const CONT   = "land_container_1bo";
  const CONT_H = 2.782;   // vertical step — exact, never S-scale
  const CONT_W = 2.702;   // lateral side spacing

  // ── 4 large cylindrical legs with container cladding ──────────────────────
  const legCorners: [number,number][] = [
    [-legOff,-legOff],[legOff,-legOff],[-legOff,legOff],[legOff,legOff]
  ];
  for (const [lx, lz] of legCorners) {
    // IND10 rings from sea level to deck
    for (let y = 0; y <= deckH; y += step)
      drawRing(pts, lx, y, lz, 5, IND10);
    drawDisk(pts, lx, 0, lz, 5, IND10);  // pontoon base

    // Container cladding — 3 columns per leg, yaw facing outward
    const legAngle = Math.atan2(lx, lz);
    const legYaw   = legAngle * 180 / Math.PI + 90;
    for (const side of [-1, 0, 1]) {
      const cx = lx + side * CONT_W * Math.cos(legAngle);
      const cz = lz + side * CONT_W * Math.sin(legAngle);
      for (let y = CONT_H; y < deckH - CONT_H; y += CONT_H)
        pts.push({ x: cx, y, z: cz, yaw: legYaw, name: CONT });
    }
  }

  // ── Cross-bracing between legs ─────────────────────────────────────────────
  const lp: [number,number][] = [
    [-legOff,-legOff],[legOff,-legOff],[legOff,legOff],[-legOff,legOff]
  ];
  for (let i = 0; i < 4; i++) {
    const [ax, az] = lp[i];
    const [bx, bz] = lp[(i+1)%4];
    // CNC8 horizontal braces at 40% and 70% height
    drawWall(pts, ax, deckH*0.4, az, bx, deckH*0.4, bz, CNC8);
    drawWall(pts, ax, deckH*0.7, az, bx, deckH*0.7, bz, CNC8);
    // Vertical pipe at midpoint of each span
    const mx = (ax+bx)/2, mz = (az+bz)/2;
    pts.push({ x: mx, y: deckH*0.5, z: mz, yaw: 0, name: "staticobj_pier_tube_big" });
  }

  // ── Deck perimeter walls ───────────────────────────────────────────────────
  const hw = legOff + 8;
  drawRect(pts, 0, deckH + step, 0, hw, hw, IND10);
  pts.push({ x: -hw, y: deckH+step, z: -hw, yaw: 225, name: IND10 });
  pts.push({ x:  hw, y: deckH+step, z: -hw, yaw: 135, name: IND10 });
  pts.push({ x:  hw, y: deckH+step, z:  hw, yaw:  45, name: IND10 });
  pts.push({ x: -hw, y: deckH+step, z:  hw, yaw: 315, name: IND10 });

  // ── Deck surface — IND10 flat grid ────────────────────────────────────────
  for (let x = -(legOff+4); x <= legOff+4; x += 9.012)
    for (let z = -(legOff+4); z <= legOff+4; z += 9.758)
      pts.push({ x, y: deckH + step, z, yaw: 0, pitch: -90, name: IND10 });

  // ── Main derrick tower (cell tower lattice steel) ─────────────────────────
  pts.push({ x: 0, y: deckH + step, z: 0, yaw: 0, name: "land_tower_tc1" });

  // ── Dock crane at south face + crane rails along X ────────────────────────
  pts.push({ x: 0,  y: deckH + step, z: -legOff, yaw: 180, name: "staticobj_pier_crane_a" });
  pts.push({ x: -6, y: deckH + step, z: -legOff, yaw:   0, name: "staticobj_pier_crane_rails" });
  pts.push({ x:  6, y: deckH + step, z: -legOff, yaw:   0, name: "staticobj_pier_crane_rails" });

  // ── Lighthouse at SE corner (navigation/safety) ───────────────────────────
  pts.push({ x: legOff+8, y: deckH + step, z: legOff+8, yaw: 0, name: "staticobj_lighthouse" });

  // ── Helipad — MILCNC disk, one step above main deck ───────────────────────
  const hpX = 0, hpZ = legOff + 12, hpY = deckH + step * 2;
  drawDisk(pts, hpX, hpY, hpZ, 10, MILCNC);
  // Spotlights around helipad edge
  for (const [sx, sz] of [[-8,0],[8,0],[0,-8],[0,8]] as [number,number][])
    pts.push({ x: hpX+sx, y: hpY, z: hpZ+sz, yaw: 0, name: "staticobj_misc_spotlight" });

  // ── Industrial details on deck ─────────────────────────────────────────────
  // Large crude oil storage tanks
  pts.push({ x: -legOff+6, y: deckH+step, z:  6, yaw:  0, name: "land_tank_big" });
  pts.push({ x:  legOff-6, y: deckH+step, z:  6, yaw:  0, name: "land_tank_big" });

  // Diesel power generator module
  pts.push({ x: -legOff+6, y: deckH+step, z: -8, yaw: 90, name: "land_dieselpowerplant_tank_big" });

  // Vertical pipe stacks over each leg corner on deck surface
  for (const [px, pz] of legCorners)
    pts.push({ x: px, y: deckH+step, z: pz, yaw: 0, name: "staticobj_pier_tube_big" });

  // Warning barrels around deck edge
  const barrelPositions: [number,number][] = [
    [-hw+4,0],[hw-4,0],[0,-hw+4],[0,hw-4],[-hw+4,-hw+4],[hw-4,hw-4]
  ];
  for (const [bx, bz] of barrelPositions)
    pts.push({ x: bx, y: deckH+step, z: bz, yaw: 0, name: "barrel_red" });

  // Water supply barrels
  for (const [bx, bz] of [[-8,-8],[8,-8],[-8,8],[8,8]] as [number,number][])
    pts.push({ x: bx, y: deckH+step, z: bz, yaw: 0, name: "barrel_blue" });

  // ── Flare stack — MILCNC taper rising 25m, barrel_red flame at top ────────
  const flareX = -legOff + 5, flareZ = legOff - 5;
  const flareBase = deckH + step;
  for (let fy = flareBase; fy < flareBase + 25; fy += 4.744)
    drawRing(pts, flareX, fy, flareZ, 1.5, MILCNC);
  pts.push({ x: flareX, y: flareBase + 25, z: flareZ, yaw: 0, name: "barrel_red" });

  // ── Accommodation module — 2×4 container block (crew quarters) ────────────
  const accX = legOff - 8, accZ = -(legOff - 8);
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      pts.push({
        x: accX,
        y: deckH + step + row * CONT_H,
        z: accZ + col * 3.5,
        yaw: 90,
        name: CONT,
      });
    }
  }

  return applyLimit(pts, 1150);
}

export function gen_pirate_ship(p: GenParams): Point3D[] {
  // 17th-century galleon (Spanish/English, ~50-70m)
  // Bow at +Z, stern at -Z. CASTLE walls = wooden plank appearance.
  // Features: tapered hull, forecastle, tall sterncastle, 3 masts with yardarms,
  // crow's nests, bowsprit, gun ports, flagpole, rope coils, lifeboats.
  const pts: Point3D[] = [];
  const L    = Math.min(p.length ?? 70, 100);
  const S    = Math.max(0.5, L / 70);

  // ── Hull sides — CASTLE panels stepping along Z every 8m (face width), 3 rows high ──
  // Beam tapers: 8*S amidships → 2*S at bow/stern via quadratic profile.
  // Port (yaw=270) and starboard (yaw=90) panels placed individually for outward facing.
  const CASTLE_W = 8.0;   // CASTLE face width  → Z step
  const CASTLE_H = 2.0;   // CASTLE panel height → Y step
  const hullRows = 3;     // 3 strakes: y=0, 2, 4

  for (let z = -L/2 + CASTLE_W/2; z <= L/2 - CASTLE_W/2 + 0.01; z += CASTLE_W) {
    const zt = Math.abs(z) / (L / 2);
    const hw = Math.max(2.0, (8 - 6 * zt * zt) * S);
    for (let row = 0; row < hullRows; row++) {
      const y = row * CASTLE_H;
      pts.push({ x: -hw, y, z, yaw: 270, name: CASTLE });  // port
      pts.push({ x:  hw, y, z, yaw:  90, name: CASTLE });  // starboard
    }
  }

  const deckY = hullRows * CASTLE_H;  // main deck level = top of hull strakes

  // ── Main deck — MILCNC flat tiles, step=4.052 along X, 4.052 along Z ──────
  for (let dz = -L/2 + 4; dz <= L/2 - 4; dz += 4.052)
    for (let dx = -6 * S; dx <= 6 * S; dx += 4.052)
      pts.push({ x: dx, y: deckY, z: dz, yaw: 0, pitch: -90, name: MILCNC });

  // ── Forecastle (raised bow platform) — bow +Z side ────────────────────────
  // z from L/2 - 18*S to L/2, 3 rows CASTLE from deckY to deckY + 3*CASTLE_H
  const fcCZ = L/2 - 9 * S;
  const fcHW = 5.5 * S;
  const fcHD = 8.5 * S;
  for (let row = 0; row < 3; row++) {
    const fy = deckY + row * CASTLE_H;
    drawRect(pts, 0, fy, fcCZ, fcHW, fcHD, CASTLE);
    pts.push({ x: -fcHW, y: fy, z: fcCZ - fcHD, yaw: 225, name: CASTLE });
    pts.push({ x:  fcHW, y: fy, z: fcCZ - fcHD, yaw: 135, name: CASTLE });
    pts.push({ x:  fcHW, y: fy, z: fcCZ + fcHD, yaw:  45, name: CASTLE });
    pts.push({ x: -fcHW, y: fy, z: fcCZ + fcHD, yaw: 315, name: CASTLE });
  }
  const fcDeckY = deckY + 3 * CASTLE_H;

  // ── Sterncastle (high captain's quarters) — stern -Z side ─────────────────
  // 5 rows CASTLE — much taller than forecastle
  const scCZ = -L/2 + 11 * S;
  const scHW = 6.5 * S;
  const scHD = 11 * S;
  for (let row = 0; row < 5; row++) {
    const sy = deckY + row * CASTLE_H;
    drawRect(pts, 0, sy, scCZ, scHW, scHD, CASTLE);
    pts.push({ x: -scHW, y: sy, z: scCZ - scHD, yaw: 225, name: CASTLE });
    pts.push({ x:  scHW, y: sy, z: scCZ - scHD, yaw: 135, name: CASTLE });
    pts.push({ x:  scHW, y: sy, z: scCZ + scHD, yaw:  45, name: CASTLE });
    pts.push({ x: -scHW, y: sy, z: scCZ + scHD, yaw: 315, name: CASTLE });
  }
  const scTopY = deckY + 5 * CASTLE_H;
  // Stern gallery windows (CNC4 panels on stern face)
  for (let i = -1; i <= 1; i++)
    pts.push({ x: i * 3 * S, y: deckY + 3 * CASTLE_H, z: scCZ - scHD, yaw: 180, name: CNC4 });

  // ── 3 Masts — MILCNC rings stacked vertically (step=4.744 fixed) ──────────
  // Foremast:   z = L/4  (toward bow)
  // Mainmast:   z = 0    (amidships — tallest)
  // Mizzenmast: z = -L/4 (toward stern)
  const mastDefs: { mz: number; mastH: number }[] = [
    { mz:  L / 4, mastH: 24 * S },  // foremast
    { mz:  0,     mastH: 34 * S },  // mainmast — tallest
    { mz: -L / 4, mastH: 20 * S },  // mizzenmast
  ];

  for (const { mz, mastH } of mastDefs) {
    const mastBaseY = mz > 0 ? fcDeckY : (mz < -L/8 ? scTopY : deckY);
    // Mast column — single MILCNC panel per step, facing yaw=0
    for (let y = mastBaseY; y < mastBaseY + mastH; y += 4.744)
      pts.push({ x: 0, y, z: mz, yaw: 0, name: MILCNC });

    const mastTopY = mastBaseY + mastH;

    // Crow's nest platform at 70% mast height (CNC8 ring)
    const nestY = mastBaseY + mastH * 0.68;
    drawRing(pts, 0, nestY, mz, 2 * S, CNC8);

    // Lower yardarm at 40% mast height — CNC8 horizontal boom
    const yard1Y = mastBaseY + mastH * 0.38;
    const yard1W = mz === 0 ? 9 * S : 7 * S;
    drawWall(pts, -yard1W, yard1Y, mz, yard1W, yard1Y, mz, CNC8);

    // Upper yardarm at 65% mast height (foremast and mainmast only)
    if (mz >= 0) {
      const yard2Y = mastBaseY + mastH * 0.60;
      const yard2W = yard1W * 0.65;
      drawWall(pts, -yard2W, yard2Y, mz, yard2W, yard2Y, mz, CNC8);
    }

    // Flagpole at mainmast top
    if (mz === 0)
      pts.push({ x: 0, y: mastTopY, z: 0, yaw: 0, name: "staticobj_misc_flagpole" });
  }

  // ── Bowsprit — diagonal forward spar projecting from bow ─────────────────
  // From bow forecastle deck, angling up and forward at ~30°
  drawWall(pts, 0, fcDeckY, L/2 - 4, 0, fcDeckY + 8 * S, L/2 + 12 * S, CNC8);

  // ── Gun ports — barrel_red as cannon muzzles, 6 per side ─────────────────
  const gunY = deckY * 0.5;
  for (let i = 0; i < 6; i++) {
    const gz = -L/4 + i * (L / 2 / 5.5);
    const ghw = Math.max(2.0, (8 - 6 * Math.pow(Math.abs(gz) / (L/2), 2)) * S) + 0.5;
    pts.push({ x: -ghw, y: gunY, z: gz, yaw: 270, name: "barrel_red" });  // port
    pts.push({ x:  ghw, y: gunY, z: gz, yaw:  90, name: "barrel_red" });  // starboard
  }

  // ── Rope coils on deck ────────────────────────────────────────────────────
  pts.push({ x:  4 * S, y: deckY, z:  L/4 + 3, yaw: 0, name: "staticobj_misc_coil" });
  pts.push({ x: -4 * S, y: deckY, z: -L/4 + 3, yaw: 0, name: "staticobj_misc_coil" });

  // ── Lifeboats on sterncastle top ──────────────────────────────────────────
  pts.push({ x:  3 * S, y: scTopY, z: scCZ + 2, yaw:  90, name: "staticobj_boat_small4" });
  pts.push({ x: -3 * S, y: scTopY, z: scCZ + 2, yaw: 270, name: "staticobj_boat_small4" });

  return applyLimit(pts, 1100);
}

export function gen_bridge_truss(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const L  = Math.min(p.length ?? 120, 200);
  const W  = 8;     // deck half-width
  const tH = 45;    // pylon height above deck
  const dY = 0;     // deck Y level

  // ── Deck surface — IND10 flat panels ──────────────────────────────────────
  for (let z = -L/2; z <= L/2; z += 9.758)
    for (let x = -W; x <= W; x += 9.012)
      pts.push({ x, y: dY, z, yaw: 0, pitch: -90, name: IND10 });

  // ── Side rails (barrier walls) — STONE2 along both deck edges ─────────────
  drawWall(pts, -L/2, dY, -W, L/2, dY, -W, STONE2);
  drawWall(pts, -L/2, dY,  W, L/2, dY,  W, STONE2);

  // ── Two main pylons at z = ±L/4 ───────────────────────────────────────────
  const pylonZs: number[] = [-L/4, L/4];
  for (const pyZ of pylonZs) {
    // Two land_tower_tc1 side-by-side, one IND10 step apart in X
    pts.push({ x: -6, y: dY, z: pyZ, yaw: 0, name: "land_tower_tc1" });
    pts.push({ x:  6, y: dY, z: pyZ, yaw: 0, name: "land_tower_tc1" });
    // Cross-beam linking the two tower legs at top
    drawWall(pts, -6, dY + tH, pyZ, 6, dY + tH, pyZ, CNC8);
    // Intermediate cross-beam at half height
    drawWall(pts, -6, dY + tH*0.5, pyZ, 6, dY + tH*0.5, pyZ, CNC8);
  }

  // ── Cable fans — MILCNC segments from each pylon top to deck anchor points ─
  // Each pylon fans cables to deck every 15m toward both ends
  for (const pyZ of pylonZs) {
    const anchorTop = dY + tH;
    // Fan toward near bridge end
    const nearEnd = pyZ < 0 ? -L/2 : L/2;
    for (let dz = pyZ; Math.abs(dz) <= Math.abs(nearEnd); dz += (nearEnd > pyZ ? 15 : -15)) {
      drawWall(pts, 0, anchorTop, pyZ, 0, dY, dz, MILCNC);
      if (Math.abs(dz - nearEnd) < 1) break;
    }
    // Fan toward bridge centre
    const farEnd = pyZ < 0 ? L/2 : -L/2;
    for (let dz = pyZ; Math.abs(dz) <= Math.abs(farEnd); dz += (farEnd > pyZ ? 15 : -15)) {
      drawWall(pts, 0, anchorTop, pyZ, 0, dY, dz, MILCNC);
      if (Math.abs(dz - farEnd) < 1) break;
    }
  }

  // ── Approach span warren truss — end sections ──────────────────────────────
  // z = -L/2 to -L/4  and  z = L/4 to L/2
  const trussH = 15;
  const trussPanel = 12;
  for (const [spanStart, spanEnd] of [[-L/2, -L/4], [L/4, L/2]] as [number,number][]) {
    const spanLen = Math.abs(spanEnd - spanStart);
    const dir = spanEnd > spanStart ? 1 : -1;
    const panels = Math.floor(spanLen / trussPanel);
    // Top chord
    drawWall(pts, -W, trussH, spanStart, -W, trussH, spanEnd, IND10);
    drawWall(pts,  W, trussH, spanStart,  W, trussH, spanEnd, IND10);
    // Warren V diagonals
    for (let i = 0; i < panels; i++) {
      const z1 = spanStart + dir * i * trussPanel;
      const z2 = z1 + dir * trussPanel;
      const zM = (z1 + z2) / 2;
      for (const x of [-W, W]) {
        drawWall(pts, x, dY, z1, x, trussH, zM, IND10);
        drawWall(pts, x, trussH, zM, x, dY, z2, IND10);
      }
      // Cross-deck at each panel node
      drawWall(pts, -W, dY, z2, W, dY, z2, CNC8);
      drawWall(pts, -W, trussH, z2, W, trussH, z2, CNC8);
    }
  }

  // ── Abutment anchor blocks at each bridge end ──────────────────────────────
  for (const ez of [-L/2, L/2]) {
    // 3×3 grid of CNC8 stacked 2 high forming anchor block
    for (let ax = -W; ax <= W; ax += 8.008) {
      drawWall(pts, ax, dY,        ez, ax, dY,        ez, CNC8);
      drawWall(pts, ax, dY + 2.3,  ez, ax, dY + 2.3,  ez, CNC8);
    }
  }

  // ── Bridge lighting — spotlights along deck ────────────────────────────────
  const spotStep = L / 6;
  for (let i = 1; i <= 5; i++)
    pts.push({ x: 0, y: dY + 1, z: -L/2 + i * spotStep, yaw: 0, name: "staticobj_misc_spotlight" });
  // End spotlights
  pts.push({ x: 0, y: dY + 1, z: -L/2 + spotStep * 0.5, yaw: 0, name: "staticobj_misc_spotlight" });

  // ── Gate posts — tower_tc1 at each portal (z = ±L/2) ─────────────────────
  for (const gz of [-L/2, L/2]) {
    pts.push({ x: -W-2, y: dY, z: gz, yaw: 0, name: "land_tower_tc1" });
    pts.push({ x:  W+2, y: dY, z: gz, yaw: 0, name: "land_tower_tc1" });
  }

  return applyLimit(pts, 1150);
}


// ═══════════════════════════════════════════════════════════════════════════════
