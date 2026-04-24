// ─────────────────────────────────────────────────────────────────────────────
// DANK STUDIO — All Shape Generators
//
// CONVENTIONS:
//  • All functions receive (p: GenParams) and return Point3D[]
//  • Use drawWall / drawRing / drawRect / drawSphere from "../draw"
//  • Pass the DayZ classname string to drawWall/drawRing as spacing key
//    e.g. drawWall(pts, x1,y1,z1, x2,y2,z2, "staticobj_castle_wall3")
//  • yaw=0 → facing North (+Z). Clockwise: 90=East, 180=South, 270=West
//  • pitch=0 → vertical. pitch=-90 → lying flat (floor tile)
//
// ADDING A NEW GENERATOR:
//  1. Write export function gen_myname(p: GenParams): Point3D[] { ... }
//  2. Add an import + case in generators/index.ts
// ─────────────────────────────────────────────────────────────────────────────
import type { Point3D } from "../types";
import { drawWall, drawRing, drawRect, drawDisk, drawSphere, drawDome, drawSphereBudgeted, _drawSphereRings, applyLimit } from "../draw";

export type GenParams = Record<string, number>;

// ─── Shorthand wall class constants (P3D-verified dimensions) ───────────────
// w = face width (X, horizontal spacing), h = panel height (Y), d = depth (Z)
const CASTLE  = "staticobj_castle_wall3";      // ~8m × 2m  (P3D not scanned)
const STONE   = "staticobj_wall_stone";        // 10.060m × 2.034m dark stone
const STONE2  = "staticobj_wall_stone2";       // 9.408m × 1.572m light stone
const CNC8    = "staticobj_wall_cncsmall_8";   // 8.008m × 2.300m concrete
const CNC4    = "staticobj_wall_cncsmall_4";   // 4.017m × 2.324m concrete
const MILCNC  = "staticobj_wall_milcnc_4";     // 4.052m × 4.744m military
const IND10   = "staticobj_wall_indcnc_10";    // 9.012m × 9.758m industrial

// ═══════════════════════════════════════════════════════════════════════════════
//  SCI-FI
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🛰️ DEATH STAR — Clean rebuild using per-ring sphere math
 *
 * Research:
 *  • Massive grey battle station — near-perfect sphere
 *  • Equatorial trench: full ring groove ~10° wide at equator, visibly recessed
 *  • Superlaser dish: large concave depression on northern hemisphere (~45° from
 *    north pole), offset to one side. 8 spoke channels + central barrel_red lens.
 *  • Surface: grey IND10 panels in latitude rings
 *
 * Panel rotation:
 *  yaw   = atan2(x, z) * 180/π  → panel tangent in XZ plane
 *  pitch = (phi - π/2) * 180/π  → phi=0 N-pole → pitch=-90, equator → 0, S-pole → 90
 */
export function gen_death_star(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const R      = Math.min(p.r ?? 35, 55);
  const panelW = 9.012;   // IND10 face width
  const halfH  = 4.879;   // IND10 half-height

  // ── Dish direction ────────────────────────────────────────────────────────
  const dishPhi   = 0.38 * Math.PI;   // ~68° from north pole
  const dishTheta = 0.55 * Math.PI;
  const dishCone  = 0.42;             // half-angle ~24°
  const dcx = Math.sin(dishPhi) * Math.cos(dishTheta);
  const dcy = Math.cos(dishPhi);
  const dcz = Math.sin(dishPhi) * Math.sin(dishTheta);

  // ── Trench band ────────────────────────────────────────────────────────────
  const trenchHalf = 0.12;   // ±~7° around equator

  // ── Build sphere rings, skipping trench and dish ──────────────────────────
  const nRings = Math.max(8, Math.round(Math.PI * R / (halfH * 1.5)));

  // North pole cap
  pts.push({ x: 0, y: R * 2 - halfH, z: 0, yaw: 0, pitch: -90, name: IND10 });

  for (let i = 1; i <= nRings; i++) {
    const phi  = (i / nRings) * Math.PI;

    // Skip equatorial trench band
    if (Math.abs(phi - Math.PI / 2) < trenchHalf) continue;

    const sinP  = Math.sin(phi);
    const cosP  = Math.cos(phi);
    const ringR = R * sinP;
    const ringY = R * cosP;

    if (ringR < panelW * 0.5) continue;

    const circ  = 2 * Math.PI * ringR;
    const nP    = Math.max(4, Math.ceil(circ / (panelW * 0.98)));
    const scale = (circ / nP) / panelW;
    const pitch = (phi - Math.PI / 2) * 180 / Math.PI;

    for (let j = 0; j < nP; j++) {
      const theta = (j + 0.5) * (2 * Math.PI / nP);
      const x = ringR * Math.cos(theta);
      const z = ringR * Math.sin(theta);

      // Skip dish cone
      const dn = ringY / R;   // dy normalised
      const dot = (x / R) * dcx + dn * dcy + (z / R) * dcz;
      if (Math.acos(Math.max(-1, Math.min(1, dot))) < dishCone) continue;

      pts.push({
        x,
        y: R + ringY - halfH,
        z,
        yaw:   +(Math.atan2(x, z) * 180 / Math.PI).toFixed(2),
        pitch: +pitch.toFixed(2),
        scale: Math.abs(scale - 1) > 0.005 ? +scale.toFixed(4) : undefined,
        name: IND10,
      });
    }
  }

  // South pole cap
  pts.push({ x: 0, y: -halfH, z: 0, yaw: 0, pitch: 90, name: IND10 });

  // ── Equatorial trench — recessed inner surface ────────────────────────────
  {
    const trenchR  = R * 0.72;
    const nTrench  = Math.max(4, Math.round((Math.PI / 3) * trenchR / (halfH * 1.5)));
    for (let i = 0; i <= nTrench; i++) {
      const phi   = Math.PI / 2 - trenchHalf + (i / nTrench) * 2 * trenchHalf;
      const sinP  = Math.sin(phi);
      const cosP  = Math.cos(phi);
      const ringR = trenchR * sinP;
      if (ringR < panelW * 0.5) continue;
      const circ  = 2 * Math.PI * ringR;
      const nP    = Math.max(4, Math.ceil(circ / (panelW * 0.98)));
      const sc    = (circ / nP) / panelW;
      const pitch = (phi - Math.PI / 2) * 180 / Math.PI;
      for (let j = 0; j < nP; j++) {
        const theta = (j + 0.5) * (2 * Math.PI / nP);
        const x = ringR * Math.cos(theta);
        const z = ringR * Math.sin(theta);
        pts.push({
          x,
          y: R + trenchR * cosP - halfH,
          z,
          yaw:   +(Math.atan2(x, z) * 180 / Math.PI).toFixed(2),
          pitch: +pitch.toFixed(2),
          scale: Math.abs(sc - 1) > 0.005 ? +sc.toFixed(4) : undefined,
          name: CNC8,
        });
      }
    }
  }

  // ── Superlaser dish — concave bowl with 8 spoke gaps ─────────────────────
  {
    // Orthonormal basis in dish plane
    let ux: number, uy: number, uz: number;
    if (Math.abs(dcy) < 0.99) {
      const l = Math.sqrt(dcx * dcx + dcz * dcz);
      ux = dcz / l; uy = 0; uz = -dcx / l;
    } else {
      ux = 1; uy = 0; uz = 0;
    }
    const vx = dcy * uz - dcz * uy;
    const vy = dcz * ux - dcx * uz;
    const vz = dcx * uy - dcy * ux;

    const nDishRings = 8;
    const nSpokes    = 8;
    const spokeHalf  = Math.PI / (nSpokes * 2.5);

    // Central lens
    const phiC = Math.acos(Math.max(-1, Math.min(1, dcy)));
    pts.push({
      x: R * dcx, y: R + R * dcy - halfH, z: R * dcz,
      yaw:   +(Math.atan2(dcx, dcz) * 180 / Math.PI).toFixed(2),
      pitch: +((phiC - Math.PI / 2) * 180 / Math.PI).toFixed(2),
      name: "barrel_red",
    });

    for (let ri = 1; ri <= nDishRings; ri++) {
      const alpha = (ri / nDishRings) * dishCone;
      const t     = ri / nDishRings;
      const mat   = t < 0.35 ? CNC4 : t < 0.70 ? MILCNC : IND10;
      const mW    = t < 0.35 ? 8.044 : t < 0.70 ? 9.608 : 9.012;

      const sinAl = Math.sin(alpha);
      const cosAl = Math.cos(alpha);
      const ringR2 = R * sinAl;
      const circ   = 2 * Math.PI * ringR2;
      const nP     = Math.max(4, Math.ceil(circ / (mW * 0.97)));
      const sc     = (circ / nP) / mW;
      const step   = (2 * Math.PI) / nP;

      for (let j = 0; j < nP; j++) {
        const az = (j + 0.5) * step;

        // Leave 8 spoke channels open (skip inner/mid rings only)
        if (ri > 1 && ri < nDishRings) {
          const azN     = ((az % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
          const nearest = Math.round(azN * nSpokes / (2 * Math.PI)) * (2 * Math.PI / nSpokes);
          if (Math.abs(azN - nearest) < spokeHalf) continue;
        }

        const cosAz = Math.cos(az), sinAz = Math.sin(az);
        const nx = cosAl * dcx + sinAl * (cosAz * ux + sinAz * vx);
        const ny = cosAl * dcy + sinAl * (cosAz * uy + sinAz * vy);
        const nz = cosAl * dcz + sinAl * (cosAz * uz + sinAz * vz);
        const phiW = Math.acos(Math.max(-1, Math.min(1, ny)));
        pts.push({
          x: R * nx,
          y: R + R * ny - halfH,
          z: R * nz,
          yaw:   +(Math.atan2(nx, nz) * 180 / Math.PI).toFixed(2),
          pitch: +((phiW - Math.PI / 2) * 180 / Math.PI).toFixed(2),
          scale: Math.abs(sc - 1) > 0.005 ? +sc.toFixed(4) : undefined,
          name: mat,
        });
      }
    }
  }

  return applyLimit(pts, 1150);
}

/**
 * 🤖 AT-AT WALKER — Imperial All Terrain Armoured Transport
 *
 * Silhouette: 3 dominant masses — large rectangular body elevated on 4 tall
 * jointed legs, forward-protruding wedge head connected by a short neck block.
 *
 * Panel constants (P3D-verified, NEVER scale heights):
 *  IH = 9.758  (IND10 height) — body walls, 2 rows = 19.516m tall body
 *  C8H = 2.300 (CNC8 height)  — head walls, 3 rows = 6.9m tall head
 */
export function gen_atat_walker(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, Math.min(2, p.scale ?? 1));

  // Physical panel heights — NEVER multiply by S
  const IH  = 9.758;
  const C8H = 2.300;
  const MF  = 4.052;  // MILCNC flat footprint

  // ── Layout ────────────────────────────────────────────────────────────────
  const LH  = 16 * S;  // hip height = body bottom Y
  const BW  =  7 * S;  // body half-width  (E-W)
  const BD  = 12 * S;  // body half-depth  (N-S)
  const bodyBot = LH;
  const bodyTop = LH + 2 * IH;  // 2 IND10 rows = 19.516m fixed height

  // ── 1. BODY — 2 IND10 rows, gapless floor & ceiling ──────────────────────
  drawRect(pts, 0, bodyBot,      0, BW, BD, IND10);
  drawRect(pts, 0, bodyBot + IH, 0, BW, BD, IND10);

  // Floor — MILCNC grid at body bottom
  const nBX = Math.max(1, Math.round(BW * 2 / MF));
  const nBZ = Math.max(1, Math.round(BD * 2 / MF));
  const scB  = +((BW * 2) / (nBX * MF)).toFixed(3);
  for (let xi = 0; xi < nBX; xi++) {
    for (let zi = 0; zi < nBZ; zi++) {
      const x = -BW + (xi + 0.5) * (BW * 2 / nBX);
      const z = -BD + (zi + 0.5) * (BD * 2 / nBZ);
      pts.push({ x, y: bodyBot, z, yaw: 0, pitch: -90, scale: scB, name: MILCNC });
    }
  }
  // Ceiling — IND10 at bodyTop (same object type as body walls → proven flush)
  {
    const IW_C = 9.012, IH_C = 9.758;
    const nCX = Math.max(1, Math.round(BW * 2 / IW_C));
    const nCZ = Math.max(1, Math.round(BD * 2 / IH_C));
    const scC = +((BW * 2) / (nCX * IW_C)).toFixed(3);
    for (let zi = 0; zi < nCZ; zi++) {
      const z = -BD + (zi + 0.5) * (BD * 2 / nCZ);
      for (let xi = 0; xi < nCX; xi++) {
        const x = -BW + (xi + 0.5) * (BW * 2 / nCX);
        // y offset compensates renderer's h/2 addition: flush = bodyTop - (h-d)/2
        pts.push({ x, y: bodyTop - 4.376, z, yaw: 0, pitch: -90, scale: scC, name: IND10 });
      }
    }
  }

  // ── 2. NECK — 4-wall armored tunnel, body front-top → head rear ──────────
  const NW     = 2.5 * S;
  const neckBZ = -BD;
  const neckBY = bodyBot + IH;       // attaches at first/second row junction
  const neckTZ = -BD - 9 * S;
  const neckTY = bodyBot + IH * 0.4; // slopes downward toward head

  drawWall(pts, -NW, neckBY, neckBZ, -NW, neckTY, neckTZ, CNC4);
  drawWall(pts,  NW, neckBY, neckBZ,  NW, neckTY, neckTZ, CNC4);
  drawWall(pts,   0, neckBY + NW, neckBZ,   0, neckTY + NW, neckTZ, CNC4);
  drawWall(pts,   0, neckBY - NW, neckBZ,   0, neckTY - NW, neckTZ, CNC4);

  // ── 3. HEAD — 3 CNC8 rows, visor eyes on front face ──────────────────────
  const HW    =  5 * S;
  const HD    =  6 * S;
  const HH    = 3 * C8H;  // 6.9m fixed
  const headBY = neckTY - C8H;
  const headCZ = neckTZ - HD;
  const frontZ = headCZ - HD;

  for (let row = 0; row < 3; row++) {
    drawRect(pts, 0, headBY + row * C8H, headCZ, HW, HD, CNC8);
  }

  const nHX = Math.max(1, Math.round(HW * 2 / MF));
  const nHZ = Math.max(1, Math.round(HD * 2 / MF));
  const scH  = +((HW * 2) / (nHX * MF)).toFixed(3);
  for (let xi = 0; xi < nHX; xi++) {
    for (let zi = 0; zi < nHZ; zi++) {
      const x = -HW + (xi + 0.5) * (HW * 2 / nHX);
      const z = headCZ - HD + (zi + 0.5) * (HD * 2 / nHZ);
      pts.push({ x, y: headBY,            z, yaw: 0, pitch: -90, scale: scH, name: MILCNC });
      // MILCNC: (h-d)/2 = (4.744-1.096)/2 = 1.824 — compensate renderer h/2 offset
      pts.push({ x, y: headBY + HH - 1.824, z, yaw: 0, pitch: -90, scale: scH, name: MILCNC });
    }
  }

  // Visor slit — barrel_red eyes centred on front face at mid-height
  const visorY = headBY + C8H * 1.2;
  for (const vx of [-2.2 * S, 2.2 * S]) {
    pts.push({ x: vx, y: visorY,         z: frontZ, yaw: 180, name: "barrel_red" });
    pts.push({ x: vx, y: visorY + 0.8*S, z: frontZ, yaw: 180, name: "barrel_red" });
  }

  // ── 4. CHIN CANNONS ────────────────────────────────────────────────────────
  const canY  = headBY + 0.5 * S;
  const canZ2 = frontZ - 10 * S;
  for (const cx of [-3 * S, 3 * S]) {
    drawWall(pts, cx, canY, frontZ, cx, canY, canZ2, CNC4);
    pts.push({ x: cx,           y: canY + 1.5*S, z: canZ2, name: "barrel_red" });
    pts.push({ x: cx,           y: canY,          z: canZ2, name: "barrel_red" });
    pts.push({ x: cx + 0.35*S, y: canY + 0.7*S, z: canZ2, name: "barrel_red" });
    pts.push({ x: cx - 0.35*S, y: canY + 0.7*S, z: canZ2, name: "barrel_red" });
  }

  // ── 5. LEGS — 4 articulated box struts: hip ring → knee ring → ankle → foot
  const SW = 1.8 * S;  // strut half-width

  for (const { hipX, hipZ, front } of [
    { hipX:  BW, hipZ: -BD * 0.6, front: true  },
    { hipX: -BW, hipZ: -BD * 0.6, front: true  },
    { hipX:  BW, hipZ:  BD * 0.6, front: false },
    { hipX: -BW, hipZ:  BD * 0.6, front: false },
  ]) {
    const kneeX  = hipX * 1.35;
    const kneeY  = LH   * 0.50;
    const kneeZ  = hipZ + (front ? -1.5 * S : 1.5 * S);
    const ankleX = hipX * 1.15;
    const ankleY = 2 * S;
    const ankleZ = kneeZ;

    // Hip disc where leg meets body bottom
    drawRing(pts, hipX, bodyBot, hipZ, SW + 0.8 * S, CNC4);

    // Upper leg box strut (hip → knee)
    drawWall(pts, hipX - SW, bodyBot, hipZ,  kneeX - SW, kneeY, kneeZ, CNC4);
    drawWall(pts, hipX + SW, bodyBot, hipZ,  kneeX + SW, kneeY, kneeZ, CNC4);
    drawWall(pts, hipX, bodyBot, hipZ - SW,  kneeX, kneeY, kneeZ - SW, CNC4);
    drawWall(pts, hipX, bodyBot, hipZ + SW,  kneeX, kneeY, kneeZ + SW, CNC4);

    // Knee joint ring
    drawRing(pts, kneeX, kneeY, kneeZ, SW * 2.0, STONE);

    // Lower leg box strut (knee → ankle, slightly narrower)
    const LW = SW * 0.8;
    drawWall(pts, kneeX - LW, kneeY, kneeZ,  ankleX - LW, ankleY, ankleZ, CNC4);
    drawWall(pts, kneeX + LW, kneeY, kneeZ,  ankleX + LW, ankleY, ankleZ, CNC4);
    drawWall(pts, kneeX, kneeY, kneeZ - LW,  ankleX, ankleY, ankleZ - LW, CNC4);
    drawWall(pts, kneeX, kneeY, kneeZ + LW,  ankleX, ankleY, ankleZ + LW, CNC4);

    // Ankle joint ring
    drawRing(pts, ankleX, ankleY, ankleZ, SW * 1.5, CNC4);

    // Foot — flat disk pad + forward toe plate
    drawDisk(pts, ankleX, 0.4 * S, ankleZ, 4.5 * S, CNC4);
    drawWall(pts, ankleX - 3*S, S, ankleZ - 4.5*S,  ankleX + 3*S, 0.5*S, ankleZ - 5.5*S, CNC4);
  }

  return applyLimit(pts, 1100);
}

/**
 * 🛸 MILLENNIUM FALCON
 * Highly detailed. Uses flat plate decking rigidly constrained to the hull,
 * tapered mandibles instead of blocks, and concrete pipes for structural tubing.
 */
export function gen_millennium_falcon(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = p.scale ?? 1;
  const R = 14 * S;

  const PW = Math.max(0.1, 4.052 * S); 
  const PD = Math.max(0.1, 4.744 * S); 
  const deckY = 1.5 * S;
  const botY = -1.5 * S;

  // 1. SAUCER PERIMETER WALL
  drawRing(pts, 0, 0, 0, R, CNC4); 

  // 2. SAUCER FLAT DECKS (Dorsal & Ventral)
  // To create a perfectly flush boundary without jagged corners poking through,
  // we layout flat plates in concentric rings (like a spiderweb) tangent to the hull.
  for (let r = PD / 2; r < R; r += PD) {
    const circ = 2 * Math.PI * r;
    const nPanels = Math.max(4, Math.floor(circ / PW));
    const arcStep = (2 * Math.PI) / nPanels;
    
    // Slight overlap horizontally guarantees no gaps
    const scale = (circ / nPanels) / PW;
    
    for (let i = 0; i < nPanels; i++) {
       const a = (i + 0.5) * arcStep;
       const x = r * Math.cos(a);
       const z = r * Math.sin(a);
       const yaw = -a * 180 / Math.PI + 90; // tangent orientation
       
       pts.push({ x, y: deckY, z, yaw, pitch: -90, scale, name: MILCNC }); // Top Plate
       pts.push({ x, y: botY,  z, yaw, pitch: -90, scale, name: MILCNC }); // Bottom Plate
    }
  }

  // 3. TAPERED FORWARD MANDIBLES
  const mandL = 12 * S;
  const rootZ = -R + 2 * S;
  const tipZ = -R - mandL + 2 * S;
  
  // Left mandible (tapers from width 4 down to 2)
  drawWall(pts, -1 * S, 0, rootZ, -2 * S, 0, tipZ, CNC4); // Inner edge
  drawWall(pts, -7 * S, 0, rootZ, -5 * S, 0, tipZ, CNC4); // Outer edge
  drawWall(pts, -2 * S, 0, tipZ, -5 * S, 0, tipZ, CNC4);  // Tip face
  
  // Right mandible (tapers from width 4 down to 2)
  drawWall(pts, 1 * S, 0, rootZ, 2 * S, 0, tipZ, CNC4);   // Inner edge
  drawWall(pts, 7 * S, 0, rootZ, 5 * S, 0, tipZ, CNC4);   // Outer edge
  drawWall(pts, 2 * S, 0, tipZ, 5 * S, 0, tipZ, CNC4);    // Tip face

  // Mandible flat deck filling (kept safely inside the tapers)
  for (let mt = 0; mt < 2; mt++) { 
     const mz = -R - 3 * S - mt * PD;
     for (const side of [-1, 1] as const) {
        pts.push({ x: side * 3.5 * S, y: deckY, z: mz, yaw: 0, pitch: -90, name: MILCNC });
        pts.push({ x: side * 3.5 * S, y: botY,  z: mz, yaw: 0, pitch: -90, name: MILCNC });
     }
  }

  // 4. COCKPIT ARM & POD (Right side)
  const armX = R + 7 * S;
  const armZ = -R + 5 * S; 

  const innerX = R * 0.8;
  const innerZ = -1 * S;
  // Arm structural walls (creates an access corridor angling toward the front right)
  drawWall(pts, innerX, 0, innerZ - 2 * S, armX, 0, armZ - 2 * S, CNC4); // Front wall
  drawWall(pts, innerX, 0, innerZ + 2 * S, armX, 0, armZ + 2 * S, CNC4); // Back wall
  
  // Cockpit Pod (Cylinder rim)
  drawRing(pts, armX, 0, armZ, 2.5 * S, CNC4);
  pts.push({ x: armX, y: deckY + 1 * S, z: armZ, yaw: 0, pitch: -90, name: CNC4 }); // top cap
  pts.push({ x: armX, y: botY - 1 * S, z: armZ, yaw: 0, pitch: -90, name: CNC4 }); // bot cap
  // Cockpit viewport blue glow
  pts.push({ x: armX, y: deckY - 0.5 * S, z: armZ - 2.5 * S, yaw: 0, pitch: 0, name: "barrel_blue" });

  // 5. REAR ENGINE GLOW — rear arc (+Z side, cos(a) positive near a=0)
  for (let a = -Math.PI * 0.35; a <= Math.PI * 0.35; a += 0.1) {
     const ex = R * 0.95 * Math.sin(a);
     const ez = R * 0.95 * Math.cos(a);
     pts.push({ x: ex, y: 0, z: ez, yaw: 0, pitch: 0, name: "barrel_blue" });
  }

  // 6. CENTRAL QUAD LASER & RADAR DISH
  drawRing(pts, 0, deckY + 1 * S, 0, 4 * S, CNC4); 
  pts.push({ x: 0, y: deckY + 2 * S, z: 0, yaw: 0, pitch: -90, name: MILCNC }); // upper turret deck
  drawRing(pts, 0, botY - 1 * S, 0, 4 * S, CNC4);
  pts.push({ x: 0, y: botY - 2 * S, z: 0, yaw: 0, pitch: -90, name: MILCNC }); // lower turret deck
  
  // Radar Dish (Rectenna offset)
  const rx = 3 * S;
  const rz = 2 * S;
  drawRing(pts, rx, deckY + 2 * S, rz, 1.5 * S, CNC4);
  pts.push({ x: rx, y: deckY + 3 * S, z: rz, yaw: 0, pitch: -90, name: CNC4 });

  return pts;
}

/**
 * 🛰️ IMPERIAL STAR DESTROYER (ISD-I)
 *
 * Research: 1,600m long triangular warship. At S=1 → 160m model (~1:10 scale).
 * Key anatomy: flat triangular dorsal hull, 1-row-high IND10 edge walls,
 * command superstructure at stern (3 tiers + bridge stalk + globes),
 * twin-barrelled turbolaser towers across dorsal, 3 primary ion drives + 2 aux.
 *
 * Hull layout (Y-axis):
 *  y=0          — ground (hull bottom / keel)
 *  y=9.758      — top of IND10 hull walls (deckY)
 *  y=deckY+...  — superstructure and towers
 *
 * Orientations:
 *  Bow → -Z (South) | Stern → +Z (North) | Port → -X | Starboard → +X
 */
export function gen_star_destroyer(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S      = Math.max(0.5, Math.min(1.5, p.scale ?? 0.75));
  const L      = 160 * S;
  const HW     = 45  * S;
  const bowZ   = -L / 2;
  const sternZ =  L / 2;

  // Panel physical constants — NEVER multiply by S
  const IW  = 9.012;  // IND10 face width
  const IH  = 9.758;  // IND10 face height = hull wall height
  const C8H = 2.300;  // CNC8 row height
  const C4H = 2.324;  // CNC4 row height
  const MH  = 4.052;  // MILCNC tile footprint

  const deckY = IH;   // deck sits flush on top of single IND10 hull row

  // ── 1. HULL SIDE WALLS ──────────────────────────────────────────────────────
  drawWall(pts, -HW, 0, sternZ,  0,  0, bowZ,   IND10);
  drawWall(pts,  HW, 0, sternZ,  0,  0, bowZ,   IND10);
  drawWall(pts, -HW, 0, sternZ, HW,  0, sternZ, IND10);

  // ── 2. HULL FLOOR — flat IND10 tiles at keel ────────────────────────────────
  for (let z = bowZ + IH * 0.5; z <= sternZ - IH * 0.5; z += IH) {
    const frac  = (z - bowZ) / L;
    const halfW = HW * frac;
    if (halfW < IW * 0.5) continue;
    const nP  = Math.max(1, Math.floor(halfW * 2 / IW));
    const slot = (halfW * 2) / nP;
    const sc   = +(slot / IW).toFixed(3);
    for (let i = 0; i < nP; i++) {
      pts.push({ x: -halfW + (i + 0.5) * slot, y: 0, z, yaw: 0, pitch: -90, scale: sc, name: IND10 });
    }
  }

  // ── 3. DORSAL DECK — flat IND10 flush on top of hull walls ─────────────────
  for (let z = bowZ + IH * 0.5; z <= sternZ - IH * 0.5; z += IH) {
    const frac  = (z - bowZ) / L;
    const halfW = HW * frac;
    if (halfW < IW * 0.5) continue;
    const nP  = Math.max(1, Math.floor(halfW * 2 / IW));
    const slot = (halfW * 2) / nP;
    const sc   = +(slot / IW).toFixed(3);
    for (let i = 0; i < nP; i++) {
      pts.push({ x: -halfW + (i + 0.5) * slot, y: deckY, z, yaw: 0, pitch: -90, scale: sc, name: IND10 });
    }
  }

  // ── 4. SUPERSTRUCTURE ───────────────────────────────────────────────────────
  const ssZ = sternZ - 28 * S;

  // Tier 1 — 2 IND10 rows (each IH tall)
  drawRect(pts, 0, deckY,        ssZ, 18*S, 22*S, IND10);
  drawRect(pts, 0, deckY + IH,   ssZ, 18*S, 22*S, IND10);

  // Tier 1 roof — MILCNC tiles (fixed MH step, not scaled)
  const t1Top = deckY + 2 * IH;
  for (let z = ssZ - 20*S; z <= ssZ + 20*S; z += MH) {
    for (let x = -16*S; x <= 16*S; x += MH) {
      pts.push({ x, y: t1Top, z, yaw: 0, pitch: -90, name: MILCNC });
    }
  }

  // Tier 2 — 2 CNC8 rows
  const t2Y = t1Top;
  drawRect(pts, 0, t2Y,         ssZ + 3*S, 12*S, 15*S, CNC8);
  drawRect(pts, 0, t2Y + C8H,   ssZ + 3*S, 12*S, 15*S, CNC8);

  // Tier 3 — 1 CNC4 row
  const t3Y = t2Y + 2 * C8H;
  drawRect(pts, 0, t3Y,         ssZ + 5*S,  8*S, 10*S, CNC4);

  // Neck stalk (IND10) + command bridge wing
  const neckY   = t3Y + C4H;
  const bridgeY = neckY + IH;
  drawRect(pts, 0, neckY, ssZ + 5*S, 4*S, 4*S, IND10);

  drawWall(pts, -13*S, bridgeY,        ssZ + 5*S,  13*S, bridgeY,        ssZ + 5*S, IND10);
  drawWall(pts, -13*S, bridgeY + IH,   ssZ + 5*S,  13*S, bridgeY + IH,   ssZ + 5*S, IND10);
  drawWall(pts, -13*S, bridgeY,        ssZ + 5*S, -13*S, bridgeY + IH,   ssZ + 5*S, IND10);
  drawWall(pts,  13*S, bridgeY,        ssZ + 5*S,  13*S, bridgeY + IH,   ssZ + 5*S, IND10);
  drawWall(pts, -11*S, bridgeY + 1*S,  ssZ + 3.5*S, 11*S, bridgeY + 1*S, ssZ + 3.5*S, CNC4);

  // Shield generator globes
  for (const sx of [-10, 10] as const) {
    for (let gh = 0; gh <= 3; gh++) {
      const gr = Math.max(0.5, (3.5 - gh * 0.7)) * S;
      drawRing(pts, sx*S, bridgeY + IH + gh * S, ssZ + 5*S, gr, CNC4);
    }
    pts.push({ x: sx*S, y: bridgeY + IH + 4.5*S, z: ssZ + 5*S, yaw: 0, pitch: -90, name: CNC4 });
  }

  // ── 5. TURBOLASER BATTERIES ─────────────────────────────────────────────────
  for (const [tx, tz] of [
    [20*S, ssZ - 20*S], [-20*S, ssZ - 20*S],
    [20*S, ssZ - 38*S], [-20*S, ssZ - 38*S],
  ] as const) {
    drawRing(pts, tx, deckY + S, tz, 3*S, CNC8);
    pts.push({ x: tx - 1.5*S, y: deckY + 4*S, z: tz - 4*S, yaw: 0, name: "barrel_red" });
    pts.push({ x: tx + 1.5*S, y: deckY + 4*S, z: tz - 4*S, yaw: 0, name: "barrel_red" });
  }

  // ── 6. REAR ENGINE NOZZLES — doubled barrel rings for glow depth ────────────
  for (const ex of [-18, 0, 18] as const) {
    drawRing(pts, ex*S, IH * 0.5, sternZ,           6*S, IND10);
    drawRing(pts, ex*S, IH * 0.5, sternZ + S,        4*S, CNC8);
    drawRing(pts, ex*S, IH * 0.5, sternZ + 1.5*S,   2.5*S, "barrel_blue");
    drawRing(pts, ex*S, IH * 0.5, sternZ + 2.5*S,   2.5*S, "barrel_blue");
  }
  for (const ex of [-32, 32] as const) {
    drawRing(pts, ex*S, IH * 0.3, sternZ,           3.5*S, CNC8);
    drawRing(pts, ex*S, IH * 0.3, sternZ + S,        2*S,   "barrel_blue");
    drawRing(pts, ex*S, IH * 0.3, sternZ + 2*S,      2*S,   "barrel_blue");
  }

  return applyLimit(pts, 1100);
}

/**
 * ⭕ STARGATE PORTAL
 * A massive upright ring resting in a base structure, complete with 9 locking
 * chevrons, a glowing blue event horizon, and an approach ramp.
 */
export function gen_stargate_portal(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const R = p.r ?? 18; // Default 18m radius for a truly epic standing Stargate

  const PW = 4.052; // MILCNC horizontal width
  const circ = 2 * Math.PI * R;
  const nPanels = Math.max(8, Math.floor(circ / PW));
  const arcStep = (2 * Math.PI) / nPanels;
  const scale = (circ / nPanels) / PW;

  // 1. THE STARGATE RING (Standing vertically in the XY plane)
  // Two layers along Z for clean gate thickness
  for (const zOffset of [ -1.5, 1.5 ]) {
    for (let i = 0; i < nPanels; i++) {
       const a = i * arcStep;
       const x = R * Math.cos(a);
       const y = R + R * Math.sin(a); // Origin rests perfectly on the ground (y=0)
       
       // Using roll to tilt the panel tangentially along the circle outline!
       const roll = (a * 180 / Math.PI) - 90;
       
       pts.push({ x, y, z: zOffset, yaw: 0, pitch: 0, roll, scale, name: MILCNC });
    }
  }

  // 2. CHEVRONS (9 locking points distributed around the outer rim)
  for (let i = 0; i < 9; i++) {
    // Chervons start at the very top of the gate (a = 90 deg)
    const a = (Math.PI / 2) + (i / 9) * Math.PI * 2;
    // Protrude slightly out from the MILCNC ring
    const cx = (R + 1.8) * Math.cos(a);
    const cy = R + (R + 1.8) * Math.sin(a);
    const roll = (a * 180 / Math.PI) - 90;

    // Dark housing for the chevron
    pts.push({ x: cx, y: cy, z: 0, yaw: 0, pitch: 0, roll, scale: 1.8, name: CNC4 });
    // Glowing red locking lights pointing outwards on front and back
    pts.push({ x: cx, y: cy, z: 2.5,  yaw: 0, pitch: 0, roll, scale: 1.5, name: "barrel_red" });
    pts.push({ x: cx, y: cy, z: -2.5, yaw: 0, pitch: 0, roll, scale: 1.5, name: "barrel_red" });
  }

  // 3. EVENT HORIZON (Concentric ripples of glowing blue plasma)
  const rEH = R - 2.5; 
  for (let rB = 0; rB <= rEH; rB += 1.5) {
     if (rB === 0) {
       pts.push({ x: 0, y: R, z: 0, yaw: 0, pitch: -90, roll: 0, name: "barrel_blue" });
       continue;
     }
     const circB = 2 * Math.PI * rB;
     const numB = Math.max(4, Math.floor(circB / 1.5));
     for (let i = 0; i < numB; i++) {
        const a = (i / numB) * Math.PI * 2;
        const x = rB * Math.cos(a);
        const y = R + rB * Math.sin(a);
        // Pitching the blue barrel -90 lays it flat, so its glowing top aims at the traveller!
        pts.push({ x, y, z: 0, yaw: 0, pitch: -90, roll: 0, name: "barrel_blue" });
     }
  }

  return pts;
}

/**
 * 🅰️ TONY STARK TOWER
 */
export function gen_stark_tower(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, p.scale ?? 1);
  const panelH = 9.758 * S;

  const totalFloors = 32;

  let padY = 0;
  let padZ = 0;
  let towerTopY = 0;

  for (let f = 0; f < totalFloors; f++) {
    const y = f * panelH;

    // Fractional height 0.0 to 1.0
    const t = f / totalFloors;

    // Base width tapers cleanly upwards
    const W = 25 * S * (1 - t * 0.4); 
    
    // The Stark Tower front sweeps dramatically backwards around 40% height
    let frontZ = -15 * S;
    if (t > 0.4) {
      const curveT = (t - 0.4) / 0.6;
      frontZ += Math.pow(curveT, 2) * 20 * S;
    }

    // Back profile curves in slightly less aggressively
    const backZ = 15 * S - (t * 5 * S);

    // Build the 4 pristine structural walls to prevent horizontal or vertical gapping
    drawWall(pts, -W, y, frontZ,  W, y, frontZ, IND10); // Front face
    drawWall(pts, -W, y, backZ,   W, y, backZ, IND10);  // Back face
    drawWall(pts, -W, y, backZ,  -W, y, frontZ, IND10); // Left face
    drawWall(pts,  W, y, frontZ,  W, y, backZ, IND10);  // Right face

    // Anchor the cantilever platform at floor 24
    if (f === 24) {
      padY = y;
      padZ = frontZ;
    }
  }
  
  towerTopY = totalFloors * panelH;

  // ── THE CANTILEVERED LANDING PAD ──────────────────────────────────────────
  // Thrusts far out over the swept-back front face
  const padExtension = 20 * S;
  const padFront = padZ - padExtension;
  const padW = 10 * S; // Half-width of the pad

  // Render a massive solid flat deck overlapping the space
  for(let z = padFront; z <= padZ + 2*S; z += 4.5*S) {
     for(let x = -padW; x <= padW; x += 4*S) {
         pts.push({ x, y: padY, z, yaw: 0, pitch: -90, scale: S, name: MILCNC });
         pts.push({ x, y: padY - 0.5*S, z, yaw: 0, pitch: -90, scale: S, name: MILCNC }); // underbelly
     }
  }

  // Rounded tip spanning the front
  drawDisk(pts, 0, padY, padFront, padW, MILCNC);
  drawDisk(pts, 0, padY - 0.5*S, padFront, padW, MILCNC);
  
  // Glowing blue runway lights tracing the pad edges
  for (let z = padFront; z < padZ; z += 3 * S) {
     pts.push({ x: -padW + 1*S, y: padY + 1*S, z, yaw: 0, name: "barrel_blue" });
     pts.push({ x:  padW - 1*S, y: padY + 1*S, z, yaw: 0, name: "barrel_blue" });
  }

  // ── ARC REACTOR LOGO (Floor 27) ──────────────────────────────────────────
  // Imposing glowing blue ring clamped directly to the swept-back face
  const arcY = padY + 3 * panelH;
  // Compute exactly where the curved frontZ lies at t=27/32
  const tArc = 27 / 32;
  const arcZ = (-15 + Math.pow((tArc - 0.4) / 0.6, 2) * 20) * S - 1.5 * S;
  
  // 5m radius giant glowing ring representing the "A" core
  drawRing(pts, 0, arcY, arcZ, 5 * S, "barrel_blue");

  // ── SPIRE ANTENNA ────────────────────────────────────────────────────────
  // Two perpendicular fins per level form a narrow needle rising 30m above the tower.
  for (let sy = towerTopY; sy < towerTopY + 30 * S; sy += 9.758 * S) {
    pts.push({ x: 0, y: sy, z: 0, yaw: 0,  pitch: 0, name: IND10 });
    pts.push({ x: 0, y: sy, z: 0, yaw: 90, pitch: 0, name: IND10 });
  }
  
  return pts;
}

/**
 * 🏙️ CYBERPUNK NEXUS TOWER
 *
 * Research: Cyberpunk megastructure — ziggurat setback profile, neon conduit rings,
 * skybridge arms, rooftop antenna cluster. Inspired by Blade Runner/2077 arcology.
 *
 * Structure:
 *  • Core shaft — IND10 panels throughout, consistent step=9.758, ziggurat at 30/60/85%
 *  • Corner fills after every drawRect to plug notches
 *  • Neon conduit rings — barrel_blue every 3 floors, barrel_red at setbacks
 *  • Skybridge arms — CNC8 horizontal beams at 35% and 65% height
 *  • Four flanking CNC8 towers at wider offset with MILCNC spires
 *  • Rooftop antenna cluster — thin MILCNC spires and a central barrel_blue beacon
 */
export function gen_cyberpunk(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S   = Math.max(0.5, p.scale ?? 1);
  const PH  = 9.758;   // IND10 row height — fixed, never scale
  const MPH = 4.744;   // MILCNC height
  const CPH = 2.300;   // CNC8 height

  const totalH = 90 * S;

  function coreHW(y: number): number {
    const t = y / totalH;
    if (t < 0.30) return 22 * S;
    if (t < 0.60) return 15 * S;
    if (t < 0.85) return 10 * S;
    return 6 * S;
  }

  // Helper: add 4 diagonal corner fills for a drawRect call
  function addCorners(y: number, hw: number, hd: number): void {
    pts.push({ x: -hw, y, z: -hd, yaw: 225, name: IND10 });
    pts.push({ x:  hw, y, z: -hd, yaw: 135, name: IND10 });
    pts.push({ x:  hw, y, z:  hd, yaw:  45, name: IND10 });
    pts.push({ x: -hw, y, z:  hd, yaw: 315, name: IND10 });
  }

  // ── 1. CENTRAL MEGA-TOWER — IND10 ziggurat, consistent step ──────────────
  for (let y = 0; y < totalH; y += PH) {
    const w     = coreHW(y);
    const nextW = coreHW(y + PH);
    drawRect(pts, 0, y, 0, w, w, IND10);
    addCorners(y, w, w);

    // Neon conduit ring every 3 floors
    if (Math.round(y / PH) % 3 === 0) {
      const neon = Math.max(6, Math.ceil((2 * Math.PI * (w + 2)) / 4));
      for (let i = 0; i < neon; i++) {
        const a = (i / neon) * 2 * Math.PI;
        pts.push({ x: (w + 2) * Math.cos(a), y: y + PH * 0.5, z: (w + 2) * Math.sin(a), name: "barrel_blue" });
      }
    }

    // Setback transition: flat deck panels + barrel_red ring accent
    if (nextW < w - 0.5) {
      const deckY = y + PH;
      for (let dx = -w + 2; dx <= w - 2; dx += 4.052) {
        pts.push({ x: dx, y: deckY, z:  w - 2, pitch: -90, name: MILCNC });
        pts.push({ x: dx, y: deckY, z: -w + 2, pitch: -90, name: MILCNC });
      }
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * 2 * Math.PI;
        pts.push({ x: (w + 2) * Math.cos(a), y: deckY, z: (w + 2) * Math.sin(a), name: "barrel_red" });
      }
    }
  }

  // ── 2. FOUR FLANKING TOWERS — wider offset, CNC8 shafts ──────────────────
  const fOff = 38 * S;
  const fH   = 50 * S;
  const fHW  = 6 * S;   // wider flanking towers
  for (const [tx, tz] of [[-fOff, 0], [fOff, 0], [0, -fOff], [0, fOff]] as [number, number][]) {
    for (let y = 0; y < fH; y += CPH) {
      drawRect(pts, tx, y, tz, fHW, fHW, CNC8);
      pts.push({ x: tx - fHW, y, z: tz - fHW, yaw: 225, name: CNC8 });
      pts.push({ x: tx + fHW, y, z: tz - fHW, yaw: 135, name: CNC8 });
      pts.push({ x: tx + fHW, y, z: tz + fHW, yaw:  45, name: CNC8 });
      pts.push({ x: tx - fHW, y, z: tz + fHW, yaw: 315, name: CNC8 });
    }
    // Crown neon ring
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * 2 * Math.PI;
      pts.push({ x: tx + (fHW + 1) * Math.cos(a), y: fH, z: tz + (fHW + 1) * Math.sin(a), name: "barrel_blue" });
    }
    // MILCNC spire
    for (let y = fH; y < fH + 15 * S; y += MPH) {
      pts.push({ x: tx, y, z: tz, yaw:  0, name: MILCNC });
      pts.push({ x: tx, y, z: tz, yaw: 90, name: MILCNC });
    }
    pts.push({ x: tx, y: fH + 15 * S, z: tz, name: "barrel_red" });
  }

  // ── 3. SKYBRIDGES — 2 levels, connect core to flanking towers ────────────
  for (const frac of [0.35, 0.65]) {
    const bY     = totalH * frac;
    const bw     = coreHW(bY);
    const armEnd = fOff - fHW - 1;
    for (const side of [-1, 1] as const) {
      // X-axis bridges
      drawWall(pts, side * bw, bY, -3 * S, side * armEnd, bY, -3 * S, CNC8);
      drawWall(pts, side * bw, bY,  3 * S, side * armEnd, bY,  3 * S, CNC8);
      // Z-axis bridges
      drawWall(pts, -3 * S, bY, side * bw, -3 * S, bY, side * armEnd, CNC8);
      drawWall(pts,  3 * S, bY, side * bw,  3 * S, bY, side * armEnd, CNC8);
      // Neon glow at bridge midpoints
      const mid = side * (bw + (armEnd - bw) * 0.5);
      pts.push({ x: mid, y: bY + 1, z:   0, name: "barrel_blue" });
      pts.push({ x:   0, y: bY + 1, z: mid, name: "barrel_blue" });
    }
  }

  // ── 4. ROOFTOP CLUSTER — perimeter spires + central beacon ───────────────
  const roofY  = totalH;
  const roofHW = coreHW(totalH) * 0.8;
  for (const [ox, oz] of [[roofHW, 0], [-roofHW, 0], [0, roofHW], [0, -roofHW]] as const) {
    for (let y = roofY; y < roofY + 20 * S; y += MPH) {
      pts.push({ x: ox, y, z: oz, yaw:  0, name: MILCNC });
      pts.push({ x: ox, y, z: oz, yaw: 90, name: MILCNC });
    }
    pts.push({ x: ox, y: roofY + 20 * S, z: oz, name: "barrel_red" });
  }
  // Central master spire
  for (let y = roofY; y < roofY + 30 * S; y += MPH) {
    pts.push({ x: 0, y, z: 0, yaw:  0, name: MILCNC });
    pts.push({ x: 0, y, z: 0, yaw: 90, name: MILCNC });
  }
  pts.push({ x: 0, y: roofY + 30 * S, z: 0, name: "barrel_blue" });
  pts.push({ x: 0, y: roofY + 32 * S, z: 0, name: "barrel_red" });

  return applyLimit(pts, 1100);
}

/**
 * 🪐 PLANET SATURN
 *
 * Research: Saturn — oblate spheroid, axial tilt 26.7°, ring system spans
 * 1.2–2.27× planet radius (D ring to F ring). Rings are extremely thin (~20m real).
 * Ring bands: C-ring (inner, faint MILCNC), B-ring (brightest, IND10),
 * Cassini Division (gap), A-ring (outer, CNC8).
 *
 * DayZ approximation: planet = drawSphere at planet radius, rings manually placed
 * at tilted angle using per-panel trig to simulate the 26.7° axial tilt.
 */
export function gen_saturn(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const R = Math.min(p.r ?? 35, 45); // planet radius — capped at 45 to stay under 1100 panels
  // cy = 2.1*R keeps the A-ring bottom (at -2.028*R below centre) just above ground
  const cx = 0, cy = 2.1 * R, cz = 0;

  // Planet body — auto-pick largest panel class that fits the sphere budget
  drawSphereBudgeted(pts, cx, cy, cz, R, 550);

  // Ring system: panels placed on an ellipse tilted 26.7° around Z axis
  // Each ring panel sits at angle θ around the ring axis.
  // Ring axis direction (after 26.7° tilt around Z): (sin(26.7°), cos(26.7°), 0)
  const TILT = 26.7 * Math.PI / 180;
  const cosT = Math.cos(TILT), sinT = Math.sin(TILT);

  // Ring bands: [innerR, outerR, material, step_panels]
  const bands: Array<[number, number, string]> = [
    [1.20 * R, 1.52 * R, MILCNC],  // C-ring (faint inner)
    [1.52 * R, 1.95 * R, IND10],   // B-ring (brightest)
    // Cassini Division gap: 1.95–2.02×R (skip)
    [2.02 * R, 2.27 * R, CNC8],    // A-ring (outer)
  ];

  for (const [innerRR, outerRR, mat] of bands) {
    const panelW = 9.012;
    // Sample 3 radii across the band width for density
    const radii = [innerRR, (innerRR + outerRR) / 2, outerRR];
    for (const rr of radii) {
      const circ = 2 * Math.PI * rr;
      const nP = Math.max(8, Math.floor(circ / panelW));
      const arcStep = (2 * Math.PI) / nP;
      const scale = (circ / nP) / panelW;

      for (let i = 0; i < nP; i++) {
        const theta = (i + 0.5) * arcStep;
        // Ring in its own plane (XZ initially), then tilt around Z by TILT
        const rx = rr * Math.cos(theta);
        const ry_ring = rr * Math.sin(theta); // vertical in the ring plane
        // Apply tilt: rotate ring-plane-Y into world XY
        const wx = cx + rx;
        const wy = cy + ry_ring * cosT;  // tilt lifts/lowers by cos
        const wz = cz + ry_ring * sinT;  // tilt adds Z component

        // Yaw: tangent of the tilted ring
        const tangX = -Math.sin(theta);
        const tangY_ring = Math.cos(theta);
        const tangZ = tangY_ring * sinT;
        const yaw = Math.atan2(tangX, tangZ) * 180 / Math.PI;
        const pitch = -Math.asin(Math.max(-1, Math.min(1, tangY_ring * cosT / Math.sqrt(tangX*tangX + (tangY_ring*cosT)*(tangY_ring*cosT) + tangZ*tangZ)))) * 180 / Math.PI;

        pts.push({ x: wx, y: wy, z: wz, yaw: +yaw.toFixed(1), pitch: +pitch.toFixed(1), scale: +scale.toFixed(3), name: mat });
      }
    }
  }

  return applyLimit(pts, 1100);
}

/**
 * 🚀 TIE FIGHTER (TIE/LN) — Imperial starfighter
 *
 * Reference: 6.4m wingspan (real scale). At S=1 → ~74m DayZ model.
 * Anatomy:
 *  • Twin hexagonal solar wings — 3-column IND10 hex (center=4 tall, sides=2 tall)
 *  • Spherical cockpit pod — 3 rings of CNC4 at wing vertical centre
 *  • Two arm pylons — parallel CNC4 drawWall bars connecting pod to wings
 *
 * Orientation: ship faces -Z (south). Wings extend ±X. IND10 panels at yaw=0
 * so their flat face is visible from the front.
 */
export function gen_tie_fighter(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, Math.min(2, p.scale ?? 1));

  const IW = 9.012;  // IND10 face width
  const IH = 9.758;  // IND10 face height

  // Wing vertical centre = midpoint of a 4-panel-tall column
  const wingCY = IH * 2;        // 19.516m
  const ckR    = 6 * S;          // cockpit sphere radius
  const wingR  = 28 * S;         // X from origin to wing centre column

  // ── COCKPIT POD — MILCNC sphere (4.052m × 4.744m panels) ───────────────────
  const ckPW   = 4.052;   // MILCNC face width
  const ckPH   = 4.744;   // MILCNC face height
  const ckHalfH = ckPH / 2;
  const nCkRings = Math.max(4, Math.round((Math.PI * ckR) / (ckPH * 0.75)));
  // North pole cap
  pts.push({ x: 0, y: wingCY + ckR - ckHalfH, z: 0, yaw: 0, pitch: -90, name: MILCNC });
  // South pole cap
  pts.push({ x: 0, y: wingCY - ckR - ckHalfH, z: 0, yaw: 0, pitch:  90, name: MILCNC });
  // Latitude rings
  _drawSphereRings(pts, 0, wingCY, 0, ckR, 0, Math.PI, nCkRings, ckPW, ckHalfH, MILCNC);
  // Forward viewport barrel accent — TIE faces -Z
  pts.push({ x: 0, y: wingCY, z: -(ckR + 0.5), name: "barrel_blue", yaw: 0, scale: 1 });

  for (const side of [-1, 1] as const) {
    const wX        = side * wingR;          // centre column X
    const innerColX = side * (wingR - IW);   // column closer to origin

    // ── WING PYLONS — two parallel CNC4 bars, top and bottom of arm ───────────
    drawWall(pts, side * ckR, wingCY + 2*S, 0, innerColX, wingCY + 2*S, 0, CNC4);
    drawWall(pts, side * ckR, wingCY - 2*S, 0, innerColX, wingCY - 2*S, 0, CNC4);

    // ── SOLAR WINGS — hexagonal IND10 arrangement ─────────────────────────────
    // Centre column: 4 panels spanning y = 0 → 4*IH
    for (let r = 0; r < 4; r++) {
      pts.push({ x: wX, y: r * IH, z: 0, yaw: 0, name: IND10 });
    }
    // Inner column (closer to fuselage): 2 panels at rows 1–2 (hex sides)
    for (let r = 1; r <= 2; r++) {
      pts.push({ x: innerColX, y: r * IH, z: 0, yaw: 0, name: IND10 });
    }
    // Outer column (farther from fuselage): 2 panels at rows 1–2
    const outerColX = wX + side * IW;
    for (let r = 1; r <= 2; r++) {
      pts.push({ x: outerColX, y: r * IH, z: 0, yaw: 0, name: IND10 });
    }
  }

  return applyLimit(pts, 1100);
}

/**
 * ✈️ X-WING STARFIGHTER (T-65B) — Full structural rewrite
 *
 * Reference: Real T-65B — 12.5m long, 11m wingspan (S-foils open).
 * At S=1 this is ~3× scale for DayZ panel visibility.
 *
 * Structure (nose points toward -Z / South):
 *  • Fuselage — CNC4 rectangular cross-sections along Z, tapered at nose
 *  • Cockpit canopy — raised CNC4 box above fuselage at mid-ship
 *  • R2-D2 dome — barrel_blue behind cockpit
 *  • Vertical tail fin — two CNC4 panels rising from tail
 *  • 4 Wings — CNC8 panels laid FLAT (pitch=-90) in X attack formation
 *      upper wings angle UP toward tip, lower wings angle DOWN
 *  • 4 Engine nacelles — drawRing CNC4 at the outer wing root (mid-span)
 *  • 4 Laser cannons — CNC4 drawWall extending forward from each wingtip
 *  • Red wing stripes — barrel_red accent along each wing
 *  • Cannon muzzle tips — barrel_red at the very end of each cannon
 *
 * Wing geometry note:
 *   pitch=-90 lays a CNC8 panel flat (face points up).
 *   yaw=0 keeps the 8m span running East-West.
 *   Varying Y per span section creates the X spread seen head-on.
 */
export function gen_xwing(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, Math.min(2, p.scale ?? 1));

  const CH4 = 2.324;   // CNC4 height — fixed, never scale
  const CW4 = 4.017;   // CNC4 width

  const fY    =  4 * S;
  const noseZ = -18 * S;
  const bodyZ =  -8 * S;  // nose taper ends, body begins
  const tailZ =  12 * S;

  // Fuselage half-width at Z (tapers from narrow nose to body)
  function fuseHW(z: number): number {
    if (z <= noseZ) return 0.2 * S;
    if (z >= bodyZ) return 2.2 * S;
    return (0.2 + 2.0 * Math.pow((z - noseZ) / (bodyZ - noseZ), 0.65)) * S;
  }

  // Tight barrel cluster: n barrels at ~0.7m spacing
  function cluster(cx: number, cy: number, cz: number, cls: string, n = 5) {
    const off: [number, number][] = [[0,0],[0.7,0],[0,0.7],[-0.7,0],[0,-0.7],[0.7,0.7]];
    for (let i = 0; i < Math.min(n, off.length); i++)
      pts.push({ x: cx + off[i][0], y: cy, z: cz + off[i][1], name: cls });
  }

  // ── 1. FUSELAGE SIDES — longitudinal rows, no gaps ────────────────────────
  // drawWall runs continuously along Z per height row — eliminates all Z gaps.
  const nRows = Math.ceil(3.5 * S / CH4);
  for (let row = 0; row < nRows; row++) {
    const y = fY + row * CH4;
    // Nose taper: wall runs diagonally from narrow nose to wide body
    drawWall(pts, -0.2*S, y, noseZ, -2.2*S, y, bodyZ, CNC4);
    drawWall(pts,  0.2*S, y, noseZ,  2.2*S, y, bodyZ, CNC4);
    // Body: straight walls nose→tail
    drawWall(pts, -2.2*S, y, bodyZ, -2.2*S, y, tailZ, CNC4);
    drawWall(pts,  2.2*S, y, bodyZ,  2.2*S, y, tailZ, CNC4);
  }

  // ── 2. FUSELAGE FLOOR — flat CNC4 panels along Z ─────────────────────────
  // Body section: 1–2 panels wide depending on fuselage width
  for (let z = bodyZ; z < tailZ; z += CH4) {
    const w  = fuseHW(z + CH4 / 2);
    const nP = Math.max(1, Math.round(w * 2 / CW4));
    const sc = +(w * 2 / (nP * CW4)).toFixed(3);
    for (let i = 0; i < nP; i++) {
      const x = -w + (i + 0.5) * (w * 2 / nP);
      pts.push({ x, y: fY, z: z + CH4 / 2, yaw: 0, pitch: -90, scale: sc, name: CNC4 });
    }
  }
  // Nose floor: single centerline panel every other step
  for (let z = noseZ; z < bodyZ; z += CH4 * 2) {
    const w = fuseHW(z + CH4);
    if (w > 0.5) pts.push({ x: 0, y: fY, z: z + CH4, yaw: 0, pitch: -90, name: CNC4 });
  }

  // ── 3. COCKPIT CANOPY — raised above fuselage ─────────────────────────────
  const ckZ0 = -11*S, ckZ1 = -2.5*S, ckHW = 1.4*S;
  for (let row = 0; row < 2; row++) {
    const y = fY + 2.5*S + row * CH4;
    drawWall(pts, -ckHW, y, ckZ0, -ckHW, y, ckZ1, CNC4);
    drawWall(pts,  ckHW, y, ckZ0,  ckHW, y, ckZ1, CNC4);
  }
  // Front / back caps
  for (const z of [ckZ0, ckZ1]) {
    pts.push({ x: 0, y: fY + 2.5*S, z, yaw: 0, name: CNC4 });
    pts.push({ x: 0, y: fY + 2.5*S, z, yaw: 90, name: CNC4 });
  }
  // Canopy ridge
  pts.push({ x: 0, y: fY + 5*S, z: -7*S, yaw:  0, name: CNC4 });
  pts.push({ x: 0, y: fY + 5*S, z: -7*S, yaw: 90, name: CNC4 });
  // R2-D2 — 4-barrel blue cluster
  cluster(0, fY + 3.5*S, -1.5*S, "barrel_blue", 4);

  // ── 4. VERTICAL TAIL FIN ──────────────────────────────────────────────────
  for (let y = fY + CH4; y <= fY + 3.5*S + CH4; y += CH4) {
    pts.push({ x: 0, y, z: tailZ - 2*S, yaw: 90, name: CNC4 });
    pts.push({ x: 0, y, z: tailZ - 5*S, yaw: 90, name: CNC4 });
  }

  // ── 5. WINGS — S-foils in X attack formation ──────────────────────────────
  // 3 span columns × 5 chord rows of flat CNC8 per wing quarter.
  // CNC8 flat: 8m span (X) × 2.324m chord (Z).
  // 5 chord rows at step=12*S/5 with scale=step/2.324 → gapless chord.
  const chordLen = 12 * S;
  const nChord   = 5;
  const chordSc  = +(chordLen / (nChord * 2.300)).toFixed(3);  // CNC8 h=2.3m (not 2.324)
  const chordZ0  = -6 * S;
  const spanXs   = [4*S, 12*S, 20*S];  // inner / mid / outer span columns

  for (const side of [-1, 1] as const) {
    for (const upper of [1, -1] as const) {
      const tipRise = upper === 1 ? 5*S : -3*S;

      for (let si = 0; si < spanXs.length; si++) {
        const wx = side * spanXs[si];
        const wy = fY + 0.3*S + (si / (spanXs.length - 1)) * tipRise;

        // 5 flat chord panels — gapless with chordSc
        for (let ci = 0; ci < nChord; ci++) {
          const cz = chordZ0 + (ci + 0.5) * (chordLen / nChord);
          pts.push({ x: wx, y: wy, z: cz, yaw: 0, pitch: -90, scale: chordSc, name: CNC8 });
        }
        // Red wing stripe — 4-barrel cluster at mid-span mid-chord
        if (si === 1) cluster(wx, wy + 0.4, 0, "barrel_red", 4);
      }

      // ── Engine nacelle at mid-span ───────────────────────────────────────
      const engX = side * 12*S;
      const engY = fY + 0.3*S + 0.5 * tipRise;
      for (let nz = 2*S; nz <= 9*S; nz += 2.3*S)
        drawRing(pts, engX, engY, nz, 2.4*S, CNC4);
      drawRing(pts, engX, engY, 9*S, 2.8*S, MILCNC);
      // Engine exhaust — 6-barrel blue cluster
      cluster(engX, engY, 9*S, "barrel_blue", 6);

      // ── Laser cannon from wingtip forward ───────────────────────────────
      const tipX = side * 21*S;
      const canY = fY + 0.3*S + tipRise;
      drawWall(pts, tipX, canY, -5*S, tipX, canY, noseZ - 2*S, CNC4);
      // Muzzle — 5 tight red barrels
      cluster(tipX, canY + 0.4, noseZ - 2*S, "barrel_red", 5);
    }
  }

  return applyLimit(pts, 1100);
}


/**
 * 🟩 BORG CUBE — Assimilation Vessel
 *
 * Research: The Borg Cube (Star Trek) is a 3km perfect cube, every surface
 * covered in technology protrusions, conduits, and tractor beam emitters.
 * Characteristic green energy glow. Surfaces are NOT perfectly smooth —
 * individual sub-modules create a lattice texture. ~15% stochastic decay
 * (panels removed by noise) gives the "partially assimilated" look.
 *
 * Structure:
 *  • 5 cube faces (bottom skipped, ground obscures it) — IND10, 15% erosion
 *  • CNC8 sub-module clusters protruding from each face
 *  • Exterior edge conduits — barrel_blue running all 4 top edges
 *  • 4 corner assimilation spires rising from top corners
 */
export function gen_borg_cube(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S  = Math.max(0.5, p.scale ?? 1);
  const H  = 40 * S;   // half-edge — full cube is 80m × 80m × 80m
  const CY = H;         // centre Y (cube rests on ground)
  const PW = 9.012 * S; // IND10 face width

  // Deterministic erosion — ~82% of panels survive (Borg surfaces are nearly complete)
  function keep(x: number, y: number, z: number): boolean {
    const h = Math.sin(x * 0.31 + 0.7) * Math.cos(y * 0.29 - 0.3) * Math.sin(z * 0.37 + 1.1);
    return Math.abs(h) < 0.88;
  }

  // Generate one cube face. Panels are scaled to fill the full H×H face so
  // edges meet neighbouring faces exactly — no corner gaps.
  function addFace(
    ox: number, oy: number, oz: number,
    axU: [number, number, number],
    axV: [number, number, number],
    yaw: number, pitch: number
  ) {
    const n     = Math.floor((H * 2) / PW);
    const slot  = (H * 2) / n;          // exact slot width so n slots fill H*2
    const scale = slot / PW;            // stretch factor (<1.15 at any practical size)
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const u = -H + (i + 0.5) * slot;
        const v = -H + (j + 0.5) * slot;
        const x = ox + u * axU[0] + v * axV[0];
        const y = oy + u * axU[1] + v * axV[1];
        const z = oz + u * axU[2] + v * axV[2];
        if (!keep(x, y, z)) continue;
        pts.push({ x, y, z, yaw, pitch, scale: +scale.toFixed(3), name: IND10 });
      }
    }
  }

  // 5 cube faces (skip floor — ground obscures it)
  addFace(0,  CY,  H, [1,0,0], [0,1,0],   0,   0);  // +Z north
  addFace(0,  CY, -H, [1,0,0], [0,1,0], 180,   0);  // -Z south
  addFace( H, CY,  0, [0,0,1], [0,1,0],  90,   0);  // +X east
  addFace(-H, CY,  0, [0,0,1], [0,1,0], -90,   0);  // -X west
  addFace(0, CY+H, 0, [1,0,0], [0,0,1],   0, -90);  // +Y top

  // CNC8 sub-module protrusions — lattice of tech blocks on 3 visible faces
  const modStep = 18 * S;
  for (let u = -H + 9*S; u <= H - 9*S; u += modStep) {
    for (let v = -H + 9*S; v <= H - 9*S; v += modStep) {
      if (keep(u, CY + v, H + 1)) {
        pts.push({ x: u, y: CY + v, z: H + 3*S, yaw:  0, pitch: 0, name: CNC8 });
      }
      if (keep(H + 1, CY + v, u)) {
        pts.push({ x: H + 3*S, y: CY + v, z: u, yaw: 90, pitch: 0, name: CNC8 });
      }
      if (keep(u, CY + H + 1, v)) {
        pts.push({ x: u, y: CY + H + 3*S, z: v, yaw:  0, pitch: -90, name: CNC8 });
      }
    }
  }

  // Exterior edge conduits — barrel_blue along all 4 top edges of the cube
  for (let t = -H + 6*S; t <= H - 6*S; t += 8*S) {
    pts.push({ x: t,  y: CY + H + 2*S, z:  H, yaw:  0, pitch: 0, name: "barrel_blue" });
    pts.push({ x: t,  y: CY + H + 2*S, z: -H, yaw:  0, pitch: 0, name: "barrel_blue" });
    pts.push({ x:  H, y: CY + H + 2*S, z: t,  yaw: 90, pitch: 0, name: "barrel_blue" });
    pts.push({ x: -H, y: CY + H + 2*S, z: t,  yaw: 90, pitch: 0, name: "barrel_blue" });
  }

  // 4 corner assimilation spires rising from top corners
  for (const [cx, cz] of [[H, H], [-H, H], [H, -H], [-H, -H]] as const) {
    for (let sy = CY + H; sy < CY + H + 20*S; sy += 9.012*S) {
      pts.push({ x: cx, y: sy, z: cz, yaw:  0, pitch: 0, name: MILCNC });
      pts.push({ x: cx, y: sy, z: cz, yaw: 90, pitch: 0, name: MILCNC });
    }
  }

  return applyLimit(pts, 1100);
}

/**
 * ⭕ HALO INSTALLATION (Installation 04)
 *
 * Research: A Forerunner megastructure — a ring ~10,000km diameter with a
 * ~300km wide habitable inner surface. The ring stands vertically, approached
 * through its centre. Key features: outer ring structure (IND10 lattice in 3
 * depth layers), inner habitable terrain band (MILCNC tiles), 12 equidistant
 * structural ribs, 4 Forerunner engine pulse emitters at the base, and
 * two massive support pedestals where the ring meets the ground.
 *
 * Panel orientations: ring uses roll for tangential facing (same as Stargate).
 * Inner surface uses outward-facing (yaw+pitch=-90) so terrain faces inward.
 */
export function gen_halo_ring(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const R   = Math.min(p.r ?? 60, 100);
  const CY  = R;             // ring centre Y (rests on ground)
  const RW  = R * 0.35;      // ring radial width
  const IR  = R - RW;        // inner radius (edge of habitable surface)

  const outerPW = 9.012;
  const outerN  = Math.max(12, Math.floor(2 * Math.PI * R / outerPW));
  const outerStep = (2 * Math.PI) / outerN;
  const outerScale = (2 * Math.PI * R / outerN) / outerPW;

  // ── 1. OUTER RING — 3 depth layers give the ring structural mass ─────────
  for (const zOff of [-8, 0, 8]) {
    for (let i = 0; i < outerN; i++) {
      const a    = i * outerStep;
      const x    = R * Math.cos(a);
      const y    = CY + R * Math.sin(a);
      const roll = a * 180 / Math.PI - 90;
      pts.push({ x, y, z: zOff, yaw: 0, pitch: 0, roll, scale: outerScale, name: IND10 });
    }
  }

  // ── 2. RING WIDTH — two inner structural bands (CNC8) ────────────────────
  for (const rr of [R * 0.82, R * 0.91]) {
    const circ  = 2 * Math.PI * rr;
    const nP    = Math.max(12, Math.floor(circ / outerPW));
    const step  = (2 * Math.PI) / nP;
    const scale = (circ / nP) / outerPW;
    for (let i = 0; i < nP; i++) {
      const a    = i * step;
      const x    = rr * Math.cos(a);
      const y    = CY + rr * Math.sin(a);
      const roll = a * 180 / Math.PI - 90;
      pts.push({ x, y, z: 0, yaw: 0, pitch: 0, roll, scale, name: CNC8 });
    }
  }

  // ── 3. HABITABLE INNER SURFACE — flat MILCNC terrain tiles ──────────────
  // Tiles face inward toward ring axis: yaw = a*180/π - 90, pitch = -90
  const milPW = 4.052;
  const irCirc = 2 * Math.PI * IR;
  const irN    = Math.max(12, Math.floor(irCirc / milPW));
  const irStep = (2 * Math.PI) / irN;
  const irScale = (irCirc / irN) / milPW;
  for (let i = 0; i < irN; i++) {
    const a   = i * irStep;
    const x   = IR * Math.cos(a);
    const y   = CY + IR * Math.sin(a);
    const yaw = a * 180 / Math.PI - 90;
    pts.push({ x, y, z: 0, yaw, pitch: -90, scale: irScale, name: MILCNC });
  }

  // ── 4. STRUCTURAL RIBS — 12 radial spokes from inner to outer ring ───────
  const nRibs = 12;
  for (let i = 0; i < nRibs; i++) {
    const a    = (i / nRibs) * Math.PI * 2;
    const cosA = Math.cos(a), sinA = Math.sin(a);
    // Place 3 CNC4 panels along the radial direction
    for (const frac of [0.2, 0.5, 0.8]) {
      const rr  = IR + RW * frac;
      const x   = rr * cosA;
      const y   = CY + rr * sinA;
      const yaw = a * 180 / Math.PI; // face tangentially (sidewall of rib)
      pts.push({ x, y, z: 0, yaw, pitch: 0, name: CNC4 });
      pts.push({ x, y, z: 6, yaw, pitch: 0, name: CNC4 });
      pts.push({ x, y, z: -6, yaw, pitch: 0, name: CNC4 });
    }
  }

  // ── 5. ENGINE PULSE EMITTERS — 4 Forerunner engines at the base arc ──────
  for (let i = 0; i < 4; i++) {
    const a   = Math.PI * 1.65 + (i / 4) * Math.PI * 0.7;
    const rr  = R - RW * 0.5;
    const x   = rr * Math.cos(a);
    const y   = CY + rr * Math.sin(a);
    for (const zo of [-4, 0, 4]) {
      pts.push({ x, y, z: zo, yaw: 0, pitch: 0, name: "barrel_blue" });
    }
  }

  // ── 6. GROUND SUPPORT PEDESTALS — two pillars where ring meets ground ────
  for (const bx of [-R * 0.15, R * 0.15]) {
    drawRect(pts, bx, 0, 0, 3, 4, CNC8);
  }

  return applyLimit(pts, 1100);
}

// ═══════════════════════════════════════════════════════════════════════════════
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

  // 3-tier stepped podium
  for (let tier = 0; tier < 3; tier++) {
    drawRect(pts, 0, tier*2.5*S, 0, (45-tier*4)*S, (22-tier*3)*S, CNC8);
  }
  const podTop = 7.5*S;

  // Vault helper: one sail shell as barrel-vault ribs running along Z.
  // Each rib is an arc in the XY plane; panels face radially outward from the arch centre.
  // xMid: arch centre X  xHalf: half-span at full size  peakH: apex height
  // zBack: rear (narrow end)  zFront: front (full-size end)
  function drawVault(xMid: number, xHalf: number, peakH: number, zBack: number, zFront: number) {
    const range  = zFront - zBack;
    const nSlice = Math.max(4, Math.round(range / (4.5*S)));
    for (let i = 0; i <= nSlice; i++) {
      const t    = i / nSlice;
      const z    = zBack + t * range;
      const sc   = Math.sqrt(t);                   // fan taper: 0 at rear → 1 at front
      const span = xHalf * sc;
      const apex = peakH * sc;
      if (span < 2 || apex < 2) continue;
      const nRib = Math.max(6, Math.round((span + apex) * Math.PI * 0.5 / (8*S)));
      for (let s = 0; s <= nRib; s++) {
        const a   = (s / nRib) * Math.PI;          // 0=right base, π/2=apex, π=left base
        const cx  = Math.cos(a);                   // outward X component
        const cy  = Math.sin(a);                   // outward Y component (up)
        // Panel faces radially outward from arch centre in XY plane
        const yaw   = Math.atan2(cx, 1e-9) * 180 / Math.PI;           // ±90
        const pitch = -Math.atan2(cy, Math.abs(cx) + 1e-9) * 180 / Math.PI;
        pts.push({
          x: xMid + cx * span,
          y: podTop + cy * apex,
          z,
          yaw,
          pitch: Math.abs(pitch) > 1 ? pitch : undefined,
          name: CNC8,
        });
      }
    }
  }

  // Concert Hall (west, x < 0) — 3 nested vaults, tallest outermost
  drawVault(-22*S, 20*S, 33*S, -20*S,  20*S);
  drawVault(-14*S, 13*S, 22*S, -13*S,  13*S);
  drawVault( -8*S,  7*S, 12*S,  -7*S,   7*S);

  // Opera Theatre (east, x > 0) — 2 nested vaults
  drawVault( 17*S, 16*S, 28*S, -16*S,  16*S);
  drawVault( 10*S, 10*S, 17*S, -10*S,  10*S);

  // Bennelong Room restaurant (far west, small low vault)
  drawVault(-33*S,  7*S,  8*S,  -6*S,   6*S);

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

  // ── Y-shaped tripod base — 3 container-stacked legs stepping inward as they rise ──
  const CONT = "land_container_1bo";
  for (let i = 0; i < 3; i++) {
    const a  = (i / 3) * Math.PI * 2;
    const cA = Math.cos(a), sA = Math.sin(a);
    const yaw = 90 - a * 180 / Math.PI;
    for (let stack = 0; stack < 5; stack++) {
      const t  = stack / 4;
      const rr = (20 - t * 14) * S;  // steps inward r=20 → r=6
      const yy = stack * 10 * S;
      // Centre column of leg
      pts.push({ x: cA*rr,              y: yy, z: sA*rr,              yaw, name: CONT });
      // Flanking containers for leg width
      pts.push({ x: cA*rr + sA*4*S,    y: yy, z: sA*rr - cA*4*S,    yaw, name: CONT });
      pts.push({ x: cA*rr - sA*4*S,    y: yy, z: sA*rr + cA*4*S,    yaw, name: CONT });
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

  // Tripod base — container stacks stepping inward as they rise.
  const CONT_SN = "land_container_1bo";
  for (let i = 0; i < 3; i++) {
    const a   = (i / 3) * Math.PI * 2;
    const cA  = Math.cos(a), sA = Math.sin(a);
    const yaw = 90 - a * 180 / Math.PI;
    for (let stack = 0; stack < 4; stack++) {
      const t  = stack / 3;
      const rr = (18 - t * 14) * S;  // steps inward r=18 → r=4
      const yy = stack * 12 * S;
      // Centre container of leg
      pts.push({ x: cA*rr,           y: yy, z: sA*rr,           yaw, name: CONT_SN });
      // Flanking containers for visible leg width
      pts.push({ x: cA*rr + sA*3*S, y: yy, z: sA*rr - cA*3*S, yaw, name: CONT_SN });
      pts.push({ x: cA*rr - sA*3*S, y: yy, z: sA*rr + cA*3*S, yaw, name: CONT_SN });
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

  // ── Main castle keep — 56 × 36m, 20m walls ────────────────────────────────
  const mhw = 28*S, mhd = 18*S, mH = 20*S;
  castleWalls(0, 0, mhw, mhd, mH);
  // Parapet atop keep walls
  for (let x = -mhw; x <= mhw; x += 8*S) {
    pts.push({ x, y: mH+step, z: -mhd, yaw: 0,   name: CASTLE });
    pts.push({ x, y: mH+step, z:  mhd, yaw: 180, name: CASTLE });
  }
  for (let z = -mhd; z <= mhd; z += 8*S) {
    pts.push({ x: -mhw, y: mH+step, z, yaw: 270, name: CASTLE });
    pts.push({ x:  mhw, y: mH+step, z, yaw: 90,  name: CASTLE });
  }

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
  const step  = 1.572 * S;   // STONE2 flush row height

  const tiers = 7;
  const baseR = 52 * S;       // radius of outermost tier
  const dR    = 7  * S;       // radius reduction per tier
  // tierH must be exact multiple of step to avoid gap at battlement row
  const tierRows = 9;
  const tierH   = tierRows * step;

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
  const step  = 1.572 * S;   // STONE2 flush row height
  const cstep = 2 * S;        // CASTLE flush row height

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
  const step = 9.758 * S;  // IND10 panel height — flush ring stacking

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
  const step = 1.572 * S;  // STONE2 flush row height

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
//  CONTAINER BUILDS — native shipping-container architecture
//  Dims (P3D verified): w=2.702 h=2.782 d=10.000 — long axis Z at yaw=0
// ═══════════════════════════════════════════════════════════════════════════════

const _CD  = 10.000;   // container depth (long axis)
const _CH  = 2.782;    // container height
const _C_PALETTE = [
  "land_container_1bo","land_container_1mo","land_container_1moh",
  "land_container_1a","land_container_1b","land_container_1c",
  "land_containerlocked",
] as const;
const _cpick = (i: number) => _C_PALETTE[Math.abs(i) % _C_PALETTE.length];

// ── Sky Fort ──────────────────────────────────────────────────────────────────
// Highly detailed military bastion on stilts — features internal rooms, 
// a container-built staircase, courtyard deck, and watchtower lookouts.
export function gen_sky_fort(p: GenParams): Point3D[] {
  const S     = p.scale ?? 1;
  const elevM = p.elevation ?? 20;
  const elev  = Math.max(2, Math.round(elevM / _CH));
  const pts: Point3D[] = [];

  const nSide  = Math.max(4, Math.round(S * 5)); 
  const SIZE   = nSide * _CD;
  const floorY = elev * _CH;
  const _CW    = 2.702;

  // ── 1. REINFORCED MILITARY PILLARS ────────────────────────────────────────
  // Distinct corner pillars (2x2 stacks)
  const cornOff = _CD / 2;
  const corners: [number, number][] = [
    [cornOff, cornOff], [SIZE - cornOff, cornOff],
    [cornOff, SIZE - cornOff], [SIZE - cornOff, SIZE - cornOff]
  ];

  for (let ci = 0; ci < 4; ci++) {
    const [cx, cz] = corners[ci];
    for (let st = 0; st < elev; st++) {
      const y = st * _CH;
      // Four containers facing inward to form a solid square column
      pts.push({ x: cx - _CW, y, z: cz, yaw: 0,  name: "land_containerlocked" });
      pts.push({ x: cx + _CW, y, z: cz, yaw: 0,  name: "land_containerlocked" });
      pts.push({ x: cx, y, z: cz - _CW, yaw: 90, name: "land_container_1mo" });
      pts.push({ x: cx, y, z: cz + _CW, yaw: 90, name: "land_container_1mo" });
    }
  }

  // ── 2. INTEGRATED ACCESS STAIRS ──────────────────────────────────────────
  // A steeper, shielded staircase leading directly to a West-face entrance.
  const stepRise = 2.5;
  const nSteps   = Math.ceil(floorY / stepRise);
  const rampX    = -(nSteps * 4); // Stairs start out west and move East
  for (let i = 0; i < nSteps; i++) {
    const y = i * stepRise;
    const x = rampX + (i * 4);
    const z = SIZE / 2;
    // The "Step" platform (yaw 90 = 10m wide bridge)
    pts.push({ x, y, z, yaw: 90, name: "land_container_1mo" });
    // Protective side-shields
    pts.push({ x, y: y + _CH, z: z - _CD/2, yaw: 90, name: "land_container_1mo", scale: 0.6 });
    pts.push({ x, y: y + _CH, z: z + _CD/2, yaw: 90, name: "land_container_1mo", scale: 0.6 });
  }
  // Transition platform into the entrance
  pts.push({ x: -2, y: floorY - 0.5, z: SIZE / 2, yaw: 90, name: "land_container_1bo" });

  // ── 3. BASTION DECK (Level 0) ─────────────────────────────────────────────
  // A frame-like platform with a central open courtyard
  for (let i = 0; i < nSide; i++) {
    const off = i * _CD + _CD/2;
    pts.push({ x: off,  y: floorY - 2.1, z: 0,    yaw: 90, pitch: -90, name: "land_container_1bo" });
    pts.push({ x: off,  y: floorY - 2.1, z: SIZE, yaw: 90, pitch: -90, name: "land_container_1bo" });
    pts.push({ x: 0,     y: floorY - 2.1, z: off, yaw: 0,  pitch: -90, name: "land_container_1bo" });
    pts.push({ x: SIZE,  y: floorY - 2.1, z: off, yaw: 0,  pitch: -90, name: "land_container_1bo" });
    
    if (i === Math.floor(nSide / 2)) {
      for (let j = 0; j < nSide; j++) {
        pts.push({ x: j * _CD, y: floorY - 2.1, z: off, yaw: 0, pitch: -90, name: "land_containerlocked" });
      }
    }
  }

  // ── 4. FORTIFIED BARRACKS & ENTRANCE (Level 1) ────────────────────────────
  // Perimeter walls with a designated ENTRANCE GAP on the West face
  const midIdx = Math.floor(nSide / 2);
  for (let row = 0; row < 3; row++) {
    const wy = floorY + row * _CH;
    for (let i = 0; i < nSide; i++) {
      const offset = i * _CD + _CD / 2;
      pts.push({ x: offset, y: wy, z: 0,    yaw: 90, name: _cpick(i + row) });
      pts.push({ x: offset, y: wy, z: SIZE, yaw: 90, name: _cpick(i + row + 1) });
      pts.push({ x: SIZE,   y: wy, z: offset, yaw: 0,  name: _cpick(i + row + 3) });
      
      // West Wall: Create a 1-container-wide doorway at row 0
      const isDoorway = (i === midIdx && row === 0);
      if (!isDoorway) {
        pts.push({ x: 0, y: wy, z: offset, yaw: 0, name: _cpick(i + row + 2) });
      }
    }
  }

  // Corner Rooms Logic...
  for (const [cx, cz] of corners) {
    const rY = floorY;
    const dx = cx < SIZE/2 ? _CD/2 : -_CD/2;
    const dz = cz < SIZE/2 ? _CD/2 : -_CD/2;
    pts.push({ x: cx, y: rY, z: cz + dz, yaw: 90, name: "land_containerlocked" });
    pts.push({ x: cx + dx, y: rY, z: cz, yaw: 0,  name: "land_containerlocked" });
    pts.push({ x: cx + dx, y: rY, z: cz + dz*2, yaw: 0,  name: "land_container_1moh" });
    pts.push({ x: cx + dx*2, y: rY, z: cz + dz, yaw: 90, name: "land_container_1moh" });
    pts.push({ x: cx + dx, y: rY, z: cz + dz, yaw: 0, name: "land_container_1a", scale: 0.8 });
    pts.push({ x: cx + dx, y: rY + _CH - 2.1, z: cz + dz, yaw: 0, pitch: -90, name: "land_containerlocked" });
  }

  // ── 5. LOOKOUT WATCHTOWERS (Levels 2 & 3) ─────────────────────────────────
  for (const [cx, cz] of corners) {
    // Watchtower Pod 1
    const y2 = floorY + _CH;
    pts.push({ x: cx, y: y2, z: cz, yaw: 45, name: "land_container_1bo" });
    
    // Watchtower Pod 2 (Higher lookout)
    const y3 = floorY + 2 * _CH;
    pts.push({ x: cx, y: y3, z: cz, yaw: -45, name: "land_container_1moh" });
    
    // Antennas and defense
    pts.push({ x: cx, y: y3 + _CH, z: cz, name: "barrel_red", yaw: 0 });
    pts.push({ x: cx + 1, y: y3 + _CH, z: cz + 1, name: "barrel_blue", yaw: 0 });
  }

  // ── 6. CENTER COMMAND HUB ────────────────────────────────────────────────
  const hubX = SIZE / 2;
  const hubZ = SIZE / 2;
  pts.push({ x: hubX, y: floorY, z: hubZ, yaw: 0, name: "land_containerlocked" });
  pts.push({ x: hubX, y: floorY + _CH, z: hubZ, yaw: 90, name: "land_container_1bo" });

  return applyLimit(pts, 1150);
}

// ── Container Pyramid (Ziggurat Monument) ─────────────────────────────────────
// Stepped square pyramid: each tier shrinks by 1 container per side.
export function gen_container_pyramid(p: GenParams): Point3D[] {
  const S     = p.scale ?? 1;
  const tiers = Math.max(2, Math.round(p.tiers ?? 5));
  const pts: Point3D[] = [];

  const baseN = Math.max(3, Math.round(S * 4)); // containers per base edge
  const TIER_COLORS = [
    "land_container_1bo","land_container_1mo","land_container_1moh",
    "land_container_1a","land_container_1b","land_container_1c",
  ];

  for (let t = 0; t < tiers; t++) {
    const y    = t * _CH;
    const n    = Math.max(1, baseN - t);
    const span = n * _CD;
    const ox   = -span / 2;
    const oz   = -span / 2;
    const cname = TIER_COLORS[t % TIER_COLORS.length];

    // N/S walls: full width (yaw=90, running X) — covers corners
    for (let i = 0; i < n; i++) {
      pts.push({ x: ox + i*_CD + _CD/2, y, z: oz,        yaw: 90, scale:1, name: cname });
      pts.push({ x: ox + i*_CD + _CD/2, y, z: oz + span, yaw: 90, scale:1, name: cname });
    }
    // E/W walls: inner only (yaw=0, running Z) — N/S walls cap the corners
    for (let i = 1; i < n - 1; i++) {
      pts.push({ x: ox,        y, z: oz + i*_CD + _CD/2, yaw: 0, scale:1, name: cname });
      pts.push({ x: ox + span, y, z: oz + i*_CD + _CD/2, yaw: 0, scale:1, name: cname });
    }
  }

  return applyLimit(pts, 1100);
}

// ── Container Drum Tower (Circular Fort) ──────────────────────────────────────
// Circular outer wall + inner keep + gate opening at South + crenellations.
export function gen_container_drum(p: GenParams): Point3D[] {
  const S     = p.scale ?? 1;
  const tiers = Math.max(2, Math.round(p.tiers ?? 5));
  const pts: Point3D[] = [];

  const R        = S * 20;  // ~12 containers per ring — visibly round
  const nPerRing = Math.max(8, Math.floor(2 * Math.PI * R / _CD));
  const gateIdx  = Math.round(nPerRing / 2);  // gap at South (θ=π)

  // Outer wall — full height, gate opening in bottom 2 tiers
  for (let tier = 0; tier < tiers; tier++) {
    const y = tier * _CH;
    for (let i = 0; i < nPerRing; i++) {
      if (tier < 2 && i === gateIdx) continue;
      const angle = (i / nPerRing) * 2 * Math.PI;
      pts.push({
        x: R * Math.sin(angle), y,
        z: R * Math.cos(angle),
        yaw: (angle * 180 / Math.PI) + 90, scale:1, name: _cpick(tier * 3 + i),
      });
    }
  }

  // Crenellations at top (alternating gaps)
  for (let i = 0; i < nPerRing; i += 2) {
    const angle = ((i + 0.5) / nPerRing) * 2 * Math.PI;
    pts.push({
      x: R * Math.sin(angle), y: tiers * _CH,
      z: R * Math.cos(angle),
      yaw: (angle * 180 / Math.PI) + 90, scale:1, name: "land_container_1a",
    });
  }

  // Inner keep: 45% radius, 3 tiers, offset half-step
  const Ri     = R * 0.45;
  const nInner = Math.max(4, Math.floor(2 * Math.PI * Ri / _CD));
  for (let tier = 0; tier < 3; tier++) {
    const y = tier * _CH;
    for (let i = 0; i < nInner; i++) {
      const angle = ((i + 0.5) / nInner) * 2 * Math.PI;
      pts.push({
        x: Ri * Math.sin(angle), y,
        z: Ri * Math.cos(angle),
        yaw: (angle * 180 / Math.PI) + 90, scale:1, name: _cpick(i + tier + 10),
      });
    }
  }

  // Barrel accents at cardinal points
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * 2 * Math.PI;
    pts.push({
      x: Ri * 0.5 * Math.sin(angle), y: 0,
      z: Ri * 0.5 * Math.cos(angle),
      name: i % 2 === 0 ? "barrel_red" : "barrel_blue", yaw: 0, scale: 1,
    });
  }

  return applyLimit(pts, 1100);
}

// ── Container Helix Tower (Double Counter-Rotating Spiral) ────────────────────
// Outer helix (CW) + inner counter-helix (CCW), each step rises CH*0.5 for
// visible spiral without the 70% overlap solid-block problem.
export function gen_container_helix(p: GenParams): Point3D[] {
  const S     = p.scale ?? 1;
  const turns = Math.max(1, p.turns ?? 3);
  const pts: Point3D[] = [];

  const R           = S * 15;  // rounder (~9 containers/turn)
  const nPerTurn    = Math.max(6, Math.floor(2 * Math.PI * R / _CD));
  const risePerStep = _CH * 0.5;  // 50% overlap — distinct spiral steps visible
  const total       = Math.round(nPerTurn * turns);

  // Outer helix (clockwise)
  for (let i = 0; i < total; i++) {
    const angle = (i / nPerTurn) * 2 * Math.PI;
    pts.push({
      x: R * Math.sin(angle),
      y: i * risePerStep,
      z: R * Math.cos(angle),
      yaw: (angle * 180 / Math.PI) + 90, scale:1, name: _cpick(i),
    });
  }

  // Inner counter-helix (CCW, 60% radius, half-step offset so it interleaves)
  const Ri     = R * 0.6;
  const nInner = Math.max(4, Math.floor(2 * Math.PI * Ri / _CD));
  const totI   = Math.round(nInner * turns);
  for (let i = 0; i < totI; i++) {
    const angle = -(i / nInner) * 2 * Math.PI;
    pts.push({
      x: Ri * Math.sin(angle),
      y: i * risePerStep + risePerStep * 0.5,
      z: Ri * Math.cos(angle),
      yaw: (angle * 180 / Math.PI) + 90, scale:1, name: _cpick(i + 4),
    });
  }

  return applyLimit(pts, 1100);
}

// ── Container Space Station (Sci-Fi Cruciform Outpost) ────────────────────────
// Hollow square core + 4 arms + connecting ring at arm tips.
export function gen_container_station(p: GenParams): Point3D[] {
  const S      = p.scale ?? 1;
  const armLen = Math.max(2, Math.round(S * 3));
  const pts: Point3D[] = [];

  // Hollow square core: 2 containers per side, 2 layers
  const coreHalf = _CD;  // core extends ±coreHalf in X and Z
  for (let layer = 0; layer < 2; layer++) {
    const y = layer * _CH;
    // N/S faces (running X, yaw=90)
    for (let i = 0; i < 2; i++) {
      const x = -coreHalf + i * _CD + _CD/2;
      pts.push({ x, y, z: -coreHalf, yaw: 90, scale:1, name: _cpick(i + layer)     });
      pts.push({ x, y, z:  coreHalf, yaw: 90, scale:1, name: _cpick(i + layer + 2) });
    }
    // E/W faces (running Z, yaw=0)
    for (let i = 0; i < 2; i++) {
      const z = -coreHalf + i * _CD + _CD/2;
      pts.push({ x: -coreHalf, y, z, yaw: 0, scale:1, name: _cpick(i + layer + 4) });
      pts.push({ x:  coreHalf, y, z, yaw: 0, scale:1, name: _cpick(i + layer + 6) });
    }
  }

  // 4 arms: +X / -X (yaw=90, depth runs X) and +Z / -Z (yaw=0, depth runs Z)
  const ARMS: { dx: number; dz: number; yaw: number }[] = [
    { dx:  1, dz: 0, yaw: 90 },
    { dx: -1, dz: 0, yaw: 90 },
    { dx:  0, dz:  1, yaw: 0 },
    { dx:  0, dz: -1, yaw: 0 },
  ];
  const armStart = coreHalf + _CD/2;  // first arm container centre from origin
  for (let ai = 0; ai < 4; ai++) {
    const { dx, dz, yaw } = ARMS[ai];
    for (let i = 0; i < armLen; i++) {
      const dist = armStart + i * _CD;
      for (let layer = 0; layer < 2; layer++)
        pts.push({ x: dx * dist, y: layer * _CH, z: dz * dist, yaw, scale:1, name: _cpick(ai + i + layer) });
    }
  }

  // Outer ring at arm-tip radius
  const ringR = armStart + armLen * _CD;
  const nRing = Math.max(8, Math.round(2 * Math.PI * ringR / _CD));
  for (let i = 0; i < nRing; i++) {
    const angle = (i / nRing) * 2 * Math.PI;
    pts.push({
      x: ringR * Math.sin(angle), y: _CH * 0.5,
      z: ringR * Math.cos(angle),
      yaw: (angle * 180 / Math.PI) + 90, scale:1, name: _cpick(i),
    });
  }

  // Barrel accents at arm tips
  for (let ai = 0; ai < 4; ai++) {
    const { dx, dz } = ARMS[ai];
    const tipDist = ringR + _CD/2;
    pts.push({ x: dx * tipDist, y: _CH * 1.5, z: dz * tipDist, name: "barrel_red",  yaw: 0, scale: 1 });
    pts.push({ x: dx * tipDist * 0.6, y: _CH * 2, z: dz * tipDist * 0.6, name: "barrel_blue", yaw: 0, scale: 1 });
  }

  return applyLimit(pts, 1100);
}

// ═══════════════════════════════════════════════════════════════════════════════
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
  const r    = p.r ?? 100;
  const stp  = 4.744;         // MILCNC flush row height (no S — r param controls size)
  const flH  = 5;             // floor spacing (5m per floor × 4 floors = 20m)
  const rings = 5;

  // Five concentric pentagonal rings (E = outer, A = inner)
  for (let ri = 0; ri < rings; ri++) {
    const rr = r * (1 - ri * 0.16);
    for (let i = 0; i < 5; i++) {
      const a1 = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const a2 = ((i + 1) / 5) * Math.PI * 2 - Math.PI / 2;
      for (let y = 0; y < flH * 4; y += stp)
        drawWall(pts, rr*Math.cos(a1), y, rr*Math.sin(a1), rr*Math.cos(a2), y, rr*Math.sin(a2), MILCNC);
    }
    // Corner filler — one outward-facing panel at each vertex to close the 108° notch
    for (let i = 0; i < 5; i++) {
      const aV  = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const yaw = 90 - aV * 180 / Math.PI;
      for (let y = 0; y < flH * 4; y += stp)
        pts.push({ x: rr * Math.cos(aV), y, z: rr * Math.sin(aV), yaw, name: MILCNC });
    }
  }

  // 10 radial spoke corridors connecting rings (2 per pentagon face)
  for (let i = 0; i < 5; i++) {
    const aMid = ((i + 0.5) / 5) * Math.PI * 2 - Math.PI / 2;
    const cx   = Math.cos(aMid), cz = Math.sin(aMid);
    const rOuter = r, rInner = r * (1 - (rings - 1) * 0.16);
    for (let y = 0; y < flH * 2; y += stp) {
      drawWall(pts, cx * rInner, y, cz * rInner, cx * rOuter, y, cz * rOuter, MILCNC);
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
  const h     = 10;         // wall height (r param controls plan size)
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

export function gen_alcatraz(_p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  // Cell block A — long rectangle
  drawRect(pts, 0, 0, 0, 40, 15, IND10);
  for (let y = 0; y <= 12; y += 4) drawRect(pts, 0, y, 0, 40, 15, IND10);
  // Guard towers
  const tPos = [{ x:42,z:17 },{ x:-42,z:17 },{ x:42,z:-17 },{ x:-42,z:-17 }];
  for (const t of tPos) {
    for (let y = 0; y <= 16; y += 4) drawRing(pts, t.x, y, t.z, 4, IND10);
  }
  // Lighthouse
  for (let y = 0; y <= 30; y += 3) drawRing(pts, 0, y, 50, 3*(1-y*0.02), STONE2);
  return pts;
}


// ═══════════════════════════════════════════════════════════════════════════════
//  NAVAL / INDUSTRIAL
// ═══════════════════════════════════════════════════════════════════════════════

export function gen_carrier(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const L = Math.min(p.length ?? 200, 250);   // flight deck length
  const W = 30;                                  // deck half-width
  const step = 9.758;   // IND10 step (no S — length param controls size)

  // ── Hull — IND10 rings at each cross-section ─────────────────────────────
  for (let x = -L/2; x <= L/2; x += 9.012) {
    const t = Math.abs(x) / (L/2);
    // Hull tapers at bow (+x) and stern (-x)
    const hw = W * (1 - Math.pow(t, 3) * 0.4);
    // Hull depth — 3 rows below deck
    for (let y = -step * 2; y < 0; y += step)
      drawWall(pts, x, y, -hw, x, y, hw, IND10);
    // Hull sides
    drawWall(pts, x, -step * 2, -hw, x, 0, -hw, IND10);
    drawWall(pts, x, -step * 2,  hw, x, 0,  hw, IND10);
  }

  // ── Flight deck — MILCNC flat panels (pitch:-90 = lying flat) ─────────────
  for (let x = -L/2; x <= L/2; x += 9.608) {
    for (let z = -W; z <= W; z += 9.608)
      pts.push({ x, y: 0, z, yaw: 0, pitch: -90, name: MILCNC });
  }

  // ── Island superstructure — starboard side (z = W + 3) ────────────────────
  const islandX = L/2 - 30;
  const islandZ = W + 3;
  for (let y = 0; y < step * 3; y += 2.3) {
    drawRect(pts, islandX, y, islandZ, 12, 5, CNC8);
    pts.push({ x: islandX-12, y, z: islandZ-5, yaw: 225, name: CNC8 });
    pts.push({ x: islandX+12, y, z: islandZ-5, yaw: 135, name: CNC8 });
    pts.push({ x: islandX+12, y, z: islandZ+5, yaw:  45, name: CNC8 });
    pts.push({ x: islandX-12, y, z: islandZ+5, yaw: 315, name: CNC8 });
  }
  // Radar mast
  for (let y = step * 3; y < step * 5; y += 4.744)
    drawRing(pts, islandX, y, islandZ, 2, MILCNC);
  // Radar dish
  pts.push({ x: islandX, y: step * 5 + 2, z: islandZ, yaw: 0, pitch: -90, name: CNC4 });

  // ── Catapult tracks — 2 forward, 1 angled ─────────────────────────────────
  // Forward cats along X-axis on deck
  for (let x = -L/2 + 10; x <= -L/2 + 80; x += 8)
    pts.push({ x, y: 0.5, z: -W * 0.4, yaw: 90, name: CNC4 });
  for (let x = -L/2 + 10; x <= -L/2 + 80; x += 8)
    pts.push({ x, y: 0.5, z:  W * 0.4, yaw: 90, name: CNC4 });

  // ── Bow anchor deck ───────────────────────────────────────────────────────
  pts.push({ x: -L/2 + 5, y: 0, z: 0, yaw: 0, pitch: -90, name: CNC8 });

  return applyLimit(pts, 1100);
}

export function gen_submarine(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const L = Math.min(p.length ?? 100, 150);
  const S = L / 100;

  // ── Pressure hull — circular cross-sections along Z ────────────────────────
  for (let z = -L/2; z <= L/2; z += 9.012) {
    const t = Math.abs(z) / (L / 2);
    // Tapers at bow (+z) to pointed, at stern (-z) slightly
    const r = t > 0.8 ? (1 - t) / 0.2 * 5 * S : 5 * S;
    if (r > 0.5) drawRing(pts, 0, 0, z, r, IND10);
  }
  // Hull cap panels at bow tip
  pts.push({ x: 0, y: 0, z: L/2, yaw: 0, name: IND10 });

  // ── Sail (conning tower) — at 1/3 from bow ─────────────────────────────────
  const sailZ = L * 0.15;  // offset forward of centre
  for (let y = 5*S; y <= 14*S; y += 2.3*S)
    drawRect(pts, 0, y, sailZ, 3*S, 4*S, CNC8);
  // Periscope + antenna on sail top
  drawRing(pts, 0, 14*S + 2, sailZ, 1.5*S, CNC4);
  pts.push({ x: 0, y: 14*S + 6, z: sailZ, yaw: 0, name: CNC4 });

  // ── Cruciform rear fins ────────────────────────────────────────────────────
  const finZ = -L/2 + 12*S;
  const finPairs: [number, number, number, number][] = [
    [0, 0, finZ, finZ],
    [0, 0, finZ, finZ],
  ];
  void finPairs; // unused — fins drawn below
  for (const [fx, fz] of [[8*S, finZ], [-8*S, finZ], [0, finZ-8*S], [0, finZ+8*S]] as [number,number][]) {
    drawWall(pts, 0, 0, finZ, fx, 4*S, fz, IND10);
  }

  return applyLimit(pts, 1100);
}

export function gen_oil_rig(_p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const legOff = 22;     // distance of each leg from centre
  const legH   = 40;     // leg height
  const deckH  = 40;     // deck floor height
  const step   = 9.758;  // IND10 step

  // ── 4 large cylindrical legs ───────────────────────────────────────────────
  for (const [lx, lz] of [[-legOff,-legOff],[legOff,-legOff],[-legOff,legOff],[legOff,legOff]] as [number,number][]) {
    for (let y = 0; y <= legH; y += step)
      drawRing(pts, lx, y, lz, 5, IND10);
    drawDisk(pts, lx, 0, lz, 5, IND10);  // pontoon base
  }

  // ── Cross-bracing diagonal between legs ────────────────────────────────────
  const braceH = legH * 0.5;
  // 4 diagonal braces connecting adjacent legs at mid-height
  const lp: [number,number][] = [[-legOff,-legOff],[legOff,-legOff],[legOff,legOff],[-legOff,legOff]];
  for (let i = 0; i < 4; i++) {
    const [ax, az] = lp[i];
    const [bx, bz] = lp[(i+1)%4];
    drawWall(pts, ax, braceH, az, bx, braceH, bz, IND10);
    // Second diagonal brace at 75% height
    drawWall(pts, ax, braceH*1.5, az, bx, braceH*1.5, bz, CNC8);
  }

  // ── Deck platform ─────────────────────────────────────────────────────────
  for (let y = deckH; y <= deckH + step; y += step) {
    drawRect(pts, 0, y, 0, legOff + 8, legOff + 8, IND10);
    // Corner fills
    const hw = legOff + 8;
    pts.push({ x: -hw, y, z: -hw, yaw: 225, name: IND10 });
    pts.push({ x:  hw, y, z: -hw, yaw: 135, name: IND10 });
    pts.push({ x:  hw, y, z:  hw, yaw:  45, name: IND10 });
    pts.push({ x: -hw, y, z:  hw, yaw: 315, name: IND10 });
  }
  // Deck surface (flat MILCNC)
  for (let x = -(legOff+6); x <= legOff+6; x += 9.608)
    for (let z = -(legOff+6); z <= legOff+6; z += 9.608)
      pts.push({ x, y: deckH + step, z, yaw: 0, pitch: -90, name: MILCNC });

  // ── Derrick drill tower ────────────────────────────────────────────────────
  const derrickH = deckH + step;
  for (let y = derrickH; y < derrickH + 50; y += step)
    drawRing(pts, 0, y, 0, 4, IND10);
  // Cross-bracing on derrick
  for (let y = derrickH + 10; y < derrickH + 50; y += 20) {
    drawWall(pts, -4, y, 0, 4, y, 0, CNC8);
    drawWall(pts, 0, y, -4, 0, y, 4, CNC8);
  }
  // Flare stack
  for (let y = derrickH + 50; y < derrickH + 60; y += 4.744)
    drawRing(pts, 15, y, 15, 1, MILCNC);

  // Accommodation module
  for (let y = deckH + step; y < deckH + step + 9.758*2; y += 9.758) {
    drawRect(pts, legOff - 5, y, legOff - 5, 10, 8, IND10);
  }

  return applyLimit(pts, 1100);
}

export function gen_pirate_ship(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const L = Math.min(p.length ?? 60, 90);
  const S = L / 60;

  // ── Hull — IND10 cross-section rings tapering bow and stern ───────────────
  for (let z = -L/2; z <= L/2; z += 9.012) {
    const t = Math.abs(z) / (L/2);
    const hw = (8 - t * 5) * S;
    const depth = (4 - t * 2) * S;
    if (hw < 1) continue;
    // Lower hull (underwater) — narrow
    for (let y = -depth; y < 0; y += 9.758)
      drawWall(pts, -hw*0.6, y, z, hw*0.6, y, z, IND10);
    // Upper hull sides
    drawWall(pts, -hw, 0, z, hw, 0, z, STONE2);
    drawWall(pts, -hw, 9.758*S, z, hw, 9.758*S, z, STONE2);
  }
  // Hull end caps
  drawRing(pts,  0, 5*S, -L/2, 4*S, IND10);  // stern
  pts.push({ x: 0, y: 5*S, z: L/2, yaw: 0, name: IND10 });  // bow cap

  // ── Main deck ─────────────────────────────────────────────────────────────
  const deckY = 9.758 * S;
  for (let z = -L/2 + 4; z <= L/2 - 4; z += 9.608)
    pts.push({ x: 0, y: deckY, z, yaw: 0, pitch: -90, name: MILCNC });

  // ── Forecastle (raised bow platform) ──────────────────────────────────────
  const fcZ = L/2 - 10*S;
  for (let y = deckY; y <= deckY + 4*S; y += 2*S)
    drawRect(pts, 0, y, fcZ + 3*S, 5*S, 7*S, CASTLE);

  // ── Sterncastle (raised stern platform) ───────────────────────────────────
  const scZ = -L/2 + 10*S;
  for (let y = deckY; y <= deckY + 8*S; y += 2*S)
    drawRect(pts, 0, y, scZ - 3*S, 7*S, 7*S, CASTLE);
  // Captain's cabin window rings
  drawRing(pts, 0, deckY + 4*S, scZ - 10*S, 3*S, CNC4);

  // ── 3 masts — vertical stacks of MILCNC panels ────────────────────────────
  const masts = [L/4, 0, -L/5];
  for (const mz of masts) {
    const mH = mz === 0 ? 28*S : 22*S;  // main mast tallest
    for (let y = deckY; y < deckY + mH; y += 4.744)
      pts.push({ x: 0, y, z: mz, yaw: 0, name: MILCNC });
    // Yardarm (horizontal boom)
    const yardY = deckY + mH * 0.6;
    drawWall(pts, -5*S, yardY, mz, 5*S, yardY, mz, CNC8);
    // Crow's nest
    drawRing(pts, 0, deckY + mH * 0.7, mz, 2*S, CNC8);
  }

  // ── Cannon ports — CASTLE panels along hull sides, 4 per side ─────────────
  for (let i = 0; i < 4; i++) {
    const cz = -L/4 + i * (L/4);
    pts.push({ x: -6.5*S, y: 5*S, z: cz, yaw: -90, name: CASTLE }); // port side
    pts.push({ x:  6.5*S, y: 5*S, z: cz, yaw:  90, name: CASTLE }); // starboard
  }

  // ── Jolly Roger flag — barrel_red at main mast top ────────────────────────
  pts.push({ x: 0, y: deckY + 28*S + 2, z: 0, name: "barrel_red" });

  return applyLimit(pts, 1100);
}

export function gen_bridge_truss(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const L = Math.min(p.length ?? 120, 200);
  const H = 20;      // truss height
  const W = 12;      // deck half-width
  const tH = 36;     // tower height

  // ── Top chord (upper truss rail) ───────────────────────────────────────────
  drawWall(pts, -L/2, H, -W, L/2, H, -W, IND10);
  drawWall(pts, -L/2, H,  W, L/2, H,  W, IND10);

  // ── Bottom chord (deck level) ──────────────────────────────────────────────
  drawWall(pts, -L/2, 0, -W, L/2, 0, -W, IND10);
  drawWall(pts, -L/2, 0,  W, L/2, 0,  W, IND10);

  // ── Road deck — MILCNC flat panels ────────────────────────────────────────
  for (let x = -L/2; x <= L/2; x += 9.608)
    pts.push({ x, y: 0, z: 0, yaw: 0, pitch: -90, name: MILCNC });

  // ── Warren truss diagonals — V pattern every 12m ──────────────────────────
  const panel = 12;
  for (let i = 0; i < Math.floor(L / panel); i++) {
    const x1 = -L/2 + i * panel;
    const x2 = x1 + panel;
    const xM = (x1 + x2) / 2;
    for (const z of [-W, W]) {
      // Upward V: from bottom-left → top-centre, top-centre → bottom-right
      drawWall(pts, x1, 0, z, xM, H, z, IND10);
      drawWall(pts, xM, H, z, x2, 0, z, IND10);
    }
    // Vertical cross-member at each panel
    drawWall(pts, x2, 0, -W, x2, H, -W, IND10);
    drawWall(pts, x2, 0,  W, x2, H,  W, IND10);
    // Cross-deck at panel intervals
    drawWall(pts, x2, 0, -W, x2, 0, W, CNC8);
    drawWall(pts, x2, H, -W, x2, H, W, CNC8);
  }

  // ── Two towers (pylons) ────────────────────────────────────────────────────
  for (const tx of [-L/4, L/4]) {
    for (let y = 0; y <= tH; y += 9.758) {
      drawRect(pts, tx, y, 0, 4, W + 4, IND10);
    }
    // Tower cap
    drawRect(pts, tx, tH, 0, 3, W + 3, CNC8);
    // Cross-beam between tower legs at top
    drawWall(pts, tx, tH - 5, -W, tx, tH - 5, W, CNC8);
  }

  // ── Suspension cables — diagonal STONE2 runs from tower top to deck ────────
  for (const tx of [-L/4, L/4]) {
    // Cables from tower top to each bridge end
    drawWall(pts, tx, tH, 0, -L/2, 0, 0, STONE2);
    drawWall(pts, tx, tH, 0,  L/2, 0, 0, STONE2);
  }

  return applyLimit(pts, 1100);
}


// ═══════════════════════════════════════════════════════════════════════════════
//  GEOMETRIC / UNIQUE
// ═══════════════════════════════════════════════════════════════════════════════

export function gen_celtic_ring(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const r = p.r ?? 30, h = 8, count = 24;
  for (let i = 0; i < count; i++) {
    const a = 2*Math.PI*i/count;
    const x = r*Math.cos(a), z = r*Math.sin(a);
    const yaw = -a*180/Math.PI+90;
    for (let y = 0; y < h; y += 3.5) pts.push({ x, y, z, yaw, name:STONE2 });
  }
  for (let i = 0; i < count; i += 2) {
    const a = (i/count)*Math.PI*2, a2 = ((i+1)/count)*Math.PI*2;
    const mx = (r*Math.cos(a) + r*Math.cos(a2))/2, mz = (r*Math.sin(a) + r*Math.sin(a2))/2;
    pts.push({ x:mx, y:h+0.5, z:mz, yaw:-a*180/Math.PI+90, name:STONE });
  }
  return pts;
}

export function gen_dna_helix(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const h = p.height ?? 60, r = p.r ?? 8, turns = p.turns ?? 4;
  for (let i = 0; i < 200; i++) {
    const t  = i/200;
    const a1 = t*turns*Math.PI*2;
    const a2 = a1 + Math.PI;
    const y  = t*h;
    pts.push({ x:r*Math.cos(a1), y, z:r*Math.sin(a1), yaw:a1*180/Math.PI, name:IND10 });
    pts.push({ x:r*Math.cos(a2), y, z:r*Math.sin(a2), yaw:a2*180/Math.PI, name:CNC8 });
    if (i%10===0) {
      drawWall(pts, r*Math.cos(a1), y, r*Math.sin(a1), r*Math.cos(a2), y, r*Math.sin(a2), MILCNC);
    }
  }
  return pts;
}

export function gen_amphitheater(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const tiers = p.tiers ?? 8, baseR = p.r ?? 40, tierD = 4, stepH = 1.5;
  const sweepAngle = Math.PI; // fixed 180°
  for (let t = 0; t < tiers; t++) {
    const r = baseR + t * tierD, y = t * stepH;
    const n = Math.max(8, Math.round(r * sweepAngle / 8));
    for (let i = 0; i <= n; i++) {
      const a = (i/n)*sweepAngle - sweepAngle/2;
      pts.push({ x:r*Math.cos(a), y, z:r*Math.sin(a), yaw:-a*180/Math.PI+90, name:STONE2 });
    }
  }
  // Stage
  drawRect(pts, 0, 0, 0, baseR*0.4, baseR*0.3, STONE2);
  return pts;
}

export function gen_aqueduct(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const nArches = p.arches ?? 8, L = p.length ?? 120;
  const archSpan = L / nArches, h = Math.max(8, archSpan * 0.8);

  // Upper channel
  drawWall(pts, -L/2, h,   -1, L/2, h,   -1, STONE2);
  drawWall(pts, -L/2, h,    1, L/2, h,    1, STONE2);
  drawWall(pts, -L/2, h+1, -1, L/2, h+1, -1, STONE2);

  // Arched piers
  for (let i = 0; i <= nArches; i++) {
    const ax = -L/2 + i*archSpan;
    // Pier column
    drawWall(pts, ax, 0, 0, ax, h, 0, STONE2);
    // Arch spans
    if (i < nArches) {
      for (let s = 0; s <= 6; s++) {
        const a = (s/6)*Math.PI;
        pts.push({ x:ax + Math.cos(a)*archSpan/2, y:h - archSpan/2 + Math.sin(a)*archSpan/2, z:0, yaw:0, name:STONE2 });
      }
    }
  }
  return pts;
}

export function gen_gothic_arch(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, p.scale ?? 1), nArches = 5, aw = 8*S, ah = 12*S, pillarH = ah * 0.6;
  for (let i = 0; i < nArches; i++) {
    const x = i * (aw + 2);
    // Pillars
    drawWall(pts, x,       0, 0, x,       pillarH, 0, STONE2);
    drawWall(pts, x + aw,  0, 0, x + aw,  pillarH, 0, STONE2);
    // Pointed arch
    for (let s = 0; s <= 10; s++) {
      const t  = s / 10;
      const ax = t < 0.5 ? x + t * aw : x + aw - (t - 0.5) * aw;
      const ay = pillarH + Math.sin(t * Math.PI) * (ah - pillarH) * (1.2 - 0.4*Math.abs(t-0.5)*4);
      pts.push({ x:ax, y:ay, z:0, yaw:0, name:STONE2 });
      pts.push({ x:ax, y:ay, z:2, yaw:180, name:STONE2 });
    }
  }
  return pts;
}

export function gen_dragon(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = p.scale ?? 1;
  // Body spine
  for (let i = 0; i < 12; i++) {
    const t = i/11;
    const x = Math.sin(t*Math.PI*0.8)*20*S;
    const z = t*40*S;
    const y = Math.sin(t*Math.PI)*8*S + 5*S;
    drawRing(pts, x, y, z, (4-t*2)*S, STONE2);
  }
  // Wings
  for (let c = -1; c <= 1; c += 2) {
    for (let s = 0; s < 5; s++) {
      const t = s/4;
      drawWall(pts, c*4*S, 8*S, 15*S, c*(4+t*18)*S, (8-t*4)*S, (15-t*10)*S, STONE2);
    }
  }
  // Head
  drawRect(pts, 0, 14*S, -4*S, 3*S, 4*S, STONE);
  return pts;
}


// ═══════════════════════════════════════════════════════════════════════════════
//  PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════════

export function gen_sphere(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const r = p.r ?? 20;
  if (p.wallClass) {
    drawSphere(pts, 0, r, 0, r, String(p.wallClass));
  } else {
    drawSphereBudgeted(pts, 0, r, 0, r, 1150);
  }
  return pts;
}

export function gen_ring(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const r = p.r ?? 20, h = 8;
  for (let y = 0; y <= h; y += 4) drawRing(pts, 0, y, 0, r, CNC8);
  return pts;
}

export function gen_cylinder(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const r = p.r ?? 10, h = p.h ?? 20;
  for (let y = 0; y <= h; y += 4) drawRing(pts, 0, y, 0, r, CNC8);
  drawDisk(pts, 0, 0, 0, r, CNC8);
  drawDisk(pts, 0, h, 0, r, CNC8);
  return pts;
}

export function gen_pyramid_basic(p: GenParams): Point3D[] {
  return gen_pyramid(p);
}

export function gen_torus(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const R = p.R ?? 20, r = p.r ?? 5;
  const nMaj = Math.max(8, Math.round(2*Math.PI*R / 8));
  for (let i = 0; i < nMaj; i++) {
    const a = (i/nMaj)*Math.PI*2;
    const cx = R*Math.cos(a), cz = R*Math.sin(a);
    drawRing(pts, cx, R, cz, r, CNC8);
  }
  return pts;
}

export function gen_cube(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const s = p.size ?? 20;
  for (let y = 0; y <= s; y += 4) drawRect(pts, 0, y, 0, s/2, s/2, CNC8);
  drawDisk(pts, 0, 0, 0, s/2, CNC8);
  drawDisk(pts, 0, s, 0, s/2, CNC8);
  return pts;
}

export function gen_dome(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const r = p.r ?? 20;
  const mat = p.wallClass ? String(p.wallClass) : CNC8;
  drawDome(pts, 0, 0, 0, r, mat);
  // Base disk floor
  drawDisk(pts, 0, 0, 0, r, mat);
  return pts;
}

export function gen_spiral(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const h = p.height ?? 40, r = p.r ?? 8, turns = p.turns ?? 3;
  for (let i = 0; i < 100; i++) {
    const t   = i/99;
    const a   = t*turns*Math.PI*2;
    const y   = t*h;
    const yaw = -a*180/Math.PI+90;
    pts.push({ x:r*Math.cos(a), y, z:r*Math.sin(a), yaw, name:CNC8 });
  }
  return pts;
}

export function gen_wall_line(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const len = p.length ?? 40;
  drawWall(pts, -len/2, 0, 0, len/2, 0, 0, CNC8);
  return pts;
}

export function gen_arc(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const r = p.r ?? 20, angle = (p.angle ?? 180)*Math.PI/180, h = 8;
  for (let y = 0; y <= h; y += 4) {
    const n = Math.max(4, Math.round(r*angle/8));
    for (let i = 0; i <= n; i++) {
      const a   = (i/n)*angle - angle/2;
      const yaw = -a*180/Math.PI+90;
      pts.push({ x:r*Math.cos(a), y, z:r*Math.sin(a), yaw, name:CNC8 });
    }
  }
  return pts;
}

/**
 * 🏛️ COLOSSEUM — Roman Arena
 * S-Tier V6.0 Extreme Architecture
 * Budget-safe: hard-capped at 800 objects to prevent WebGL OOM.
 */
export function gen_colosseum(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S      = Math.max(0.5, Math.min(p.scale ?? 1, 2));
  const rawR   = Math.min(p.r ?? 60, 100);  // semi-major; cap at 100m
  const A      = rawR * S;                   // Semi-major axis (X)
  const B      = A * (156 / 189);            // Semi-minor axis (Z) — historical ratio

  const PW         = 9.408 * S;   // STONE2 width
  const PH         = 1.572 * S;   // STONE2 height (one tier step)
  const numTiers   = Math.min(Math.round(p.tiers ?? 4), 5);
  const tierDepth  = 1.452 * S;

  // Ellipse perimeter helper (Ramanujan approximation)
  function ellipseCirc(a: number, b: number) {
    const h = Math.pow(a - b, 2) / Math.pow(a + b, 2);
    return Math.PI * (a + b) * (1 + 3 * h / (10 + Math.sqrt(4 - 3 * h)));
  }

  // Trace N evenly-spaced points around an ellipse
  function traceEllipse(aRX: number, bRZ: number, numPanels: number) {
    const out: { x: number; z: number; yaw: number }[] = [];
    for (let i = 0; i < numPanels; i++) {
      const t   = i * (2 * Math.PI) / numPanels;
      const x   = aRX * Math.cos(t);
      const z   = bRZ * Math.sin(t);
      const dx  = -aRX * Math.sin(t);
      const dz  =  bRZ * Math.cos(t);
      const yaw = Math.atan2(dx, dz) * 180 / Math.PI + 90;
      out.push({ x, z, yaw });
    }
    return out;
  }

  // Mask out the 4 cardinal entrance openings
  function isEntrance(x: number, z: number): boolean {
    const angle  = ((Math.atan2(z, x) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const tol    = 0.14;
    return [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2, 2 * Math.PI].some(
      a => Math.abs(angle - a) < tol
    );
  }

  // ── 1. CAVEA — elliptical tiered seating rings ──────────────────────────────
  for (let t = 0; t <= numTiers; t++) {
    const tA  = A - (numTiers - t) * tierDepth;
    const tB  = B - (numTiers - t) * tierDepth;
    const tY  = t * PH;
    const nP  = Math.max(20, Math.floor(ellipseCirc(tA, tB) / PW));
    const sc  = (ellipseCirc(tA, tB) / nP) / PW;

    for (const rp of traceEllipse(tA, tB, nP)) {
      if (isEntrance(rp.x, rp.z)) continue;
      // Retaining wall panel
      pts.push({ x: rp.x, y: tY, z: rp.z, yaw: +rp.yaw.toFixed(2), scale: +sc.toFixed(4), name: STONE2 });
      // Seating flat slab on top of each tier edge
      if (t < numTiers) {
        const angle = Math.atan2(rp.z, rp.x);
        const flatA = tA + tierDepth / 2;
        const flatB = tB + tierDepth / 2;
        pts.push({
          x: flatA * Math.cos(angle), y: tY + PH, z: flatB * Math.sin(angle),
          yaw: +rp.yaw.toFixed(2), pitch: -90,
          scale: +sc.toFixed(4), name: STONE2,
        });
      }
    }
  }

  // ── 2. OUTER FACADE — 80 classic arched bays ────────────────────────────────
  const facadeA = A + tierDepth;
  const facadeB = B + tierDepth;
  const FACADE_H = 11.143; // height of stone2d
  const facSc   = (ellipseCirc(facadeA, facadeB) / 80) / 8.569;
  for (const rp of traceEllipse(facadeA, facadeB, 80)) {
    if (isEntrance(rp.x, rp.z)) continue;
    // Ground-level foundation
    pts.push({ x: rp.x, y: 0, z: rp.z, yaw: +rp.yaw.toFixed(2), scale: +(facSc * 0.45).toFixed(4), name: STONE2 });
    // Tall arches — these give it the iconic Colosseum look
    pts.push({ x: rp.x, y: PH, z: rp.z, yaw: +rp.yaw.toFixed(2), scale: +facSc.toFixed(4), name: "staticobj_wall_stone2d" });
    // Header rim
    pts.push({ x: rp.x, y: PH + FACADE_H, z: rp.z, yaw: +rp.yaw.toFixed(2), scale: +facSc.toFixed(4), pitch: -90, name: STONE2 });
  }

  // ── 3. ARENA FLOOR — flat disk ───────────────────────────────────────────────
  const arenaA = A - numTiers * tierDepth;
  const arenaB = B - numTiers * tierDepth;
  // Simple concentric ellipse passes approximate floor
  const floorRings = Math.max(2, Math.floor(Math.min(arenaA, arenaB) / PW));
  for (let i = 1; i <= floorRings; i++) {
    const rA = (arenaA * i) / floorRings;
    const rB = (arenaB * i) / floorRings;
    const nF = Math.max(8, Math.floor(ellipseCirc(rA, rB) / PW));
    const sc = (ellipseCirc(rA, rB) / nF) / PW;
    for (const rp of traceEllipse(rA, rB, nF)) {
      pts.push({ x: rp.x, y: 0.1, z: rp.z, yaw: +rp.yaw.toFixed(2), pitch: -90, scale: +sc.toFixed(4), name: STONE });
    }
  }

  // ── 4. GRAND ENTRANCES — 4 vaulted passages (N/S/E/W) ───────────────────────
  for (const a of [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]) {
    const dirX = Math.cos(a), dirZ = Math.sin(a);
    const hw   = 3.5 * S;
    const rIn  = (Math.abs(dirX) > 0.5 ? arenaA : arenaB);
    const rOut = (Math.abs(dirX) > 0.5 ? facadeA : facadeB);
    const nSt  = Math.max(1, Math.round((rOut - rIn) / PW));
    for (let step = 0; step < nSt; step++) {
      const d = rIn + (step + 0.5) * ((rOut - rIn) / nSt);
      const px = d * dirX, pz = d * dirZ;
      const side = a * 180 / Math.PI;
      pts.push({ x: px - hw * Math.sin(a), y: 0,  z: pz + hw * Math.cos(a), yaw: side + 90, name: STONE2 });
      pts.push({ x: px + hw * Math.sin(a), y: 0,  z: pz - hw * Math.cos(a), yaw: side - 90, name: STONE2 });
      pts.push({ x: px - hw * Math.sin(a), y: PH, z: pz + hw * Math.cos(a), yaw: side + 90, name: STONE2 });
      pts.push({ x: px + hw * Math.sin(a), y: PH, z: pz - hw * Math.cos(a), yaw: side - 90, name: STONE2 });
    }
  }

  // Hard safety cap — never exceed 800 objects to keep WebGL stable
  // Hard safety cap — stay under Nitrado 1,200 limit but max out fidelity
  return applyLimit(pts, 1150);
}

// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🚀 USS ENTERPRISE NCC-1701 (Star Trek: The Original Series)
 *
 * Research:
 *  • Saucer section: 127m diameter disc, ~8m thick, forward-mounted
 *  • Secondary hull: tear-drop cylinder below/behind saucer, deflector dish faces forward
 *  • Neck: angled strut connecting saucer bottom to engineering hull top
 *  • Twin warp nacelles: horizontal cylinders on swept-back pylons, above engineering hull
 *  • Bussard collectors: glowing red forward caps on nacelles
 *  • Plasma vents: blue glow at nacelle rear
 *  • Ship faces +Z (nose at +Z, stern at -Z)
 *
 * Target: ~620–680 panels at scale=1
 */
export function gen_enterprise(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S  = Math.max(0.5, p.scale ?? 1);

  // Panel widths (P3D-verified)
  const CW4 = 4.017 * S;   // CNC4
  const CW8 = 8.008 * S;   // CNC8

  // ── LAYOUT ────────────────────────────────────────────────────────────────
  // Saucer
  const sR   = 36 * S;
  const sY   = 20 * S;   // saucer vertical center
  const sHf  =  5 * S;   // saucer half-thickness
  const sCz  = 24 * S;   // saucer center Z (forward)

  // Engineering hull (secondary hull)
  const engR   =  9 * S;
  const engCz  = -8 * S;
  const engBot =  4 * S;
  const engTop = 20 * S;

  // Nacelles
  const nacX   = 22 * S;
  const nacR   =  3.5 * S;
  const naMidY = 24 * S;
  const naFZ   = 14 * S;
  const naBZ   =-28 * S;
  const naLen  = naFZ - naBZ;

  // ── 1. SAUCER RIM — 3 rows of IND10 ──────────────────────────────────────
  for (let row = 0; row < 3; row++) {
    const y = (sY - sHf) + row * sHf;
    drawRing(pts, 0, y, sCz, sR, IND10);
  }

  // ── 2. SAUCER TOP SURFACE — 5 concentric rings (CNC4, pitch=-90 face-up) ─
  for (let ri = 1; ri <= 5; ri++) {
    const r  = sR * (ri / 5.5);
    const nP = Math.ceil(2 * Math.PI * r / CW4);
    for (let i = 0; i < nP; i++) {
      const a = (i / nP) * 2 * Math.PI;
      pts.push({
        x: r * Math.sin(a),
        y: sY + sHf,
        z: sCz + r * Math.cos(a),
        yaw: a * 180 / Math.PI,
        pitch: -90,
        name: CNC4,
      });
    }
  }

  // ── 3. SAUCER BOTTOM SURFACE — 4 concentric rings (pitch=+90 face-down) ──
  for (let ri = 1; ri <= 4; ri++) {
    const r  = sR * (ri / 4.5);
    const nP = Math.ceil(2 * Math.PI * r / CW4);
    for (let i = 0; i < nP; i++) {
      const a = (i / nP) * 2 * Math.PI;
      pts.push({
        x: r * Math.sin(a),
        y: sY - sHf,
        z: sCz + r * Math.cos(a),
        yaw: a * 180 / Math.PI,
        pitch: 90,
        name: CNC4,
      });
    }
  }

  // ── 4. BRIDGE DOME ────────────────────────────────────────────────────────
  drawDome(pts, 0, sY + sHf, sCz + 5 * S, 5 * S, MILCNC);

  // ── 5. PHOTON TORPEDO LAUNCHER (saucer nose) ──────────────────────────────
  drawRing(pts, 0, sY, sCz + sR - 3 * S, 4 * S, MILCNC);
  pts.push({ x: 0, y: sY, z: sCz + sR - S, yaw: 0, pitch: 0, name: "barrel_red" });

  // ── 6. NECK — 6 CNC8 rings interpolating saucer base → eng hull top ───────
  for (let step = 0; step <= 6; step++) {
    const t  = step / 6;
    const ny = (sY - sHf) * (1 - t) + engTop * t;
    const nz = sCz        * (1 - t) + engCz  * t;
    drawRing(pts, 0, ny, nz, 5 * S, CNC8);
  }

  // ── 7. ENGINEERING HULL — stacked CNC8 rings ─────────────────────────────
  const engSteps = Math.ceil((engTop - engBot) / CW8 * 1.4);
  for (let s = 0; s <= engSteps; s++) {
    const y = engBot + (s / engSteps) * (engTop - engBot);
    drawRing(pts, 0, y, engCz, engR, CNC8);
  }

  // ── 8. DEFLECTOR DISH (forward-lower face of engineering hull) ────────────
  const dishZ = engCz + engR + S;
  const dishY = engBot + 5 * S;
  drawRing(pts, 0, dishY, dishZ, 5 * S, MILCNC);
  drawRing(pts, 0, dishY, dishZ, 3 * S, CNC4);
  pts.push({ x: 0, y: dishY, z: dishZ, yaw: 0, pitch: -90, name: "barrel_blue" });

  // ── 9. WARP PYLONS ────────────────────────────────────────────────────────
  const pymZ = (naFZ + naBZ) / 2;
  for (const sx of [-1, 1]) {
    const nx = sx * nacX;
    drawWall(pts, 0, engTop,       engCz,     nx * 0.55, naMidY - S, pymZ, CNC4);
    drawWall(pts, 0, engTop + S,   engCz + S, nx * 0.55, naMidY - S, pymZ, CNC4);
    drawWall(pts, nx * 0.55, naMidY - S, pymZ, nx, naMidY, pymZ + 2 * S, CNC4);
  }

  // ── 10. WARP NACELLES — hull plates + end caps ────────────────────────────
  const naPan = Math.ceil(naLen / CW4);
  for (const sx of [-1, 1]) {
    const nx = sx * nacX;

    for (let i = 0; i < naPan; i++) {
      const z = naBZ + (i + 0.5) * (naLen / naPan);
      // Top plate (face up)
      pts.push({ x: nx, y: naMidY + nacR, z, yaw: 0,       pitch: -90, name: CNC4  });
      // Bottom plate (face down)
      pts.push({ x: nx, y: naMidY - nacR, z, yaw: 0,       pitch:  90, name: CNC4  });
      // Inner side (faces toward centreline)
      pts.push({ x: nx - sx * nacR, y: naMidY, z, yaw: -sx * 90, pitch: 0, name: IND10 });
      // Outer side (faces away from centreline)
      pts.push({ x: nx + sx * nacR, y: naMidY, z, yaw:  sx * 90, pitch: 0, name: IND10 });
    }

    // Bussard collector — forward glowing red cap
    drawRing(pts, nx, naMidY, naFZ, nacR + S, CNC4);
    pts.push({ x: nx, y: naMidY, z: naFZ + S, yaw: 0, pitch: -90, name: "barrel_red" });

    // Plasma vent — rear blue engine glow
    drawRing(pts, nx, naMidY, naBZ, nacR + S, MILCNC);
    pts.push({ x: nx, y: naMidY, z: naBZ - S,  yaw: 0, pitch: 90, name: "barrel_blue" });
    pts.push({ x: nx, y: naMidY, z: naBZ - 2*S, yaw: 0, pitch: 90, name: "barrel_blue" });
  }

  // ── 11. PHASER STRIPS — 6 emitters around saucer equator ─────────────────
  for (let i = 0; i < 6; i++) {
    const a  = (i / 6) * 2 * Math.PI;
    const px = sR * 0.72 * Math.sin(a);
    const pz = sCz + sR * 0.72 * Math.cos(a);
    pts.push({ x: px, y: sY, z: pz, yaw: a * 180 / Math.PI, pitch: 0, name: MILCNC });
  }

  // ── 12. ENGINEERING HULL FLOOR — close the hollow bottom ─────────────────
  for (let ri = 1; ri <= 3; ri++) {
    const fr = engR * (ri / 3.5);
    const nP = Math.ceil(2 * Math.PI * fr / CW4);
    for (let i = 0; i < nP; i++) {
      const a = (i / nP) * 2 * Math.PI;
      pts.push({ x: fr * Math.sin(a), y: engBot, z: engCz + fr * Math.cos(a),
                 yaw: a * 180 / Math.PI, pitch: 90, name: CNC4 });
    }
  }
  pts.push({ x: 0, y: engBot, z: engCz, yaw: 0, pitch: 90, name: CNC4 });

  // ── 13. SAUCER BOTTOM CENTRE — fill the hole left by ring ri=1 ────────────
  for (let ri = 1; ri <= 2; ri++) {
    const r  = sR * (ri / 9);
    const nP = Math.max(4, Math.ceil(2 * Math.PI * r / CW4));
    for (let i = 0; i < nP; i++) {
      const a = (i / nP) * 2 * Math.PI;
      pts.push({ x: r * Math.sin(a), y: sY - sHf, z: sCz + r * Math.cos(a),
                 yaw: a * 180 / Math.PI, pitch: 90, name: CNC4 });
    }
  }
  pts.push({ x: 0, y: sY - sHf, z: sCz, yaw: 0, pitch: 90, name: CNC4 });

  return applyLimit(pts, 1100);
}

// ── Mont-Saint-Michel ─────────────────────────────────────────────────────────
export function gen_mont_saint_michel(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S    = Math.max(0.25, p.scale ?? 0.5);
  const step = 1.572 * S;  // STONE2

  // 5 ascending tiers — each smaller and higher, like the island rock
  for (let i = 0; i < 5; i++) {
    const r  = (35 - i * 6) * S;
    const y0 = i * 8 * S;
    const rows = Math.round(8 * S / step);
    for (let row = 0; row < rows; row++)
      drawRing(pts, 0, y0 + row * step, 0, r, STONE2);
    drawRing(pts, 0, y0 + rows * step, 0, r, CASTLE); // battlement each tier
  }

  // Abbey — Gothic church at summit (CNC4 stepped tiers)
  const abbeyBase = 5 * 8 * S;
  const astep = 2.324 * S;  // CNC4 step
  for (let t = 0; t < 3; t++) {
    const ar = (8 - t * 2.5) * S;
    const ay0 = abbeyBase + t * 6 * S;
    const rows = Math.round(6 * S / astep);
    for (let row = 0; row < rows; row++)
      drawRing(pts, 0, ay0 + row * astep, 0, ar, CNC4);
  }
  // Abbey spire — MILCNC taper
  const spireBase = abbeyBase + 3 * 6 * S;
  for (let y = spireBase; y < spireBase + 25 * S; y += 4.744 * S) {
    const t = (y - spireBase) / (25 * S);
    const r = (3 - t * 2.7) * S;
    if (r > 0.3 * S) drawRing(pts, 0, y, 0, r, MILCNC);
  }

  return applyLimit(pts, 1100);
}

// ── Sagrada Família ───────────────────────────────────────────────────────────
export function gen_sagrada_familia(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S    = Math.max(0.25, p.scale ?? 0.5);
  const step = 1.572 * S;

  function organicTower(cx: number, cz: number, baseR: number, h: number) {
    const rows = Math.round(h / step);
    for (let row = 0; row < rows; row++) {
      const t = row / rows;
      // Organic taper: wide at base, waist at 40%, wider at 70%, then narrow tip
      const r = baseR * (1 - t * 0.7 + Math.sin(t * Math.PI * 1.5) * 0.15);
      if (r > 0.3 * S) drawRing(pts, cx, row * step, cz, r, STONE2);
    }
    // Pinnacle: distinctive Gaudí star-burst tip
    drawRing(pts, cx, h, cz, 0.8 * S, CNC4);
    pts.push({ x: cx, y: h + 2.324 * S, z: cz, yaw: 0, name: CNC4 });
  }

  // Central Jesus Christ tower (tallest)
  organicTower(0, 0, 8 * S, 86 * S);

  // 4 Evangelist towers at 90° intervals, medium height
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    organicTower(Math.cos(a) * 18 * S, Math.sin(a) * 18 * S, 5 * S, 67 * S);
  }

  // 8 outer Apostle towers
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    organicTower(Math.cos(a) * 30 * S, Math.sin(a) * 30 * S, 3.5 * S, 50 * S);
  }

  // Nave walls — connecting the tower bases with stone walls
  for (let y = 0; y < 12 * S; y += step) {
    drawRing(pts, 0, y, 0, 34 * S, STONE2);  // outer perimeter ring
  }

  return applyLimit(pts, 1100);
}

// ── Chrysler Building ─────────────────────────────────────────────────────────
export function gen_chrysler_building(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S    = Math.max(0.25, p.scale ?? 0.5);
  const step = 9.758 * S;   // IND10

  const h = 120 * S;
  function towerW(y: number): number {
    const t = y / h;
    if (t < 0.55) return 16 * S;
    if (t < 0.72) return 12 * S;
    if (t < 0.88) return  8 * S;
    return 5 * S;
  }

  // Main shaft — IND10 ziggurat
  for (let y = 0; y < h; y += step) {
    const w = towerW(y);
    drawRect(pts, 0, y, 0, w, w, IND10);
    // Corner fills
    pts.push({ x: -w, y, z: -w, yaw: 225, name: IND10 });
    pts.push({ x:  w, y, z: -w, yaw: 135, name: IND10 });
    pts.push({ x:  w, y, z:  w, yaw:  45, name: IND10 });
    pts.push({ x: -w, y, z:  w, yaw: 315, name: IND10 });
  }

  // Art Deco sunburst crown — 7 terraced arched tiers of decreasing radius
  const crownBase = h;
  const cstep = 2.3 * S;  // CNC8
  for (let t = 0; t < 7; t++) {
    const cr = (5 - t * 0.5) * S;
    const cy0 = crownBase + t * 3 * S;
    const rows = Math.round(3 * S / cstep);
    for (let row = 0; row < rows; row++)
      drawRing(pts, 0, cy0 + row * cstep, 0, cr, CNC8);
  }

  // Eagle gargoyles — 4 corners of the setback at 72%
  const eagleY = h * 0.72;
  const eagleW = towerW(h * 0.55);
  for (const [ex, ez] of [[-eagleW,-eagleW],[eagleW,-eagleW],[eagleW,eagleW],[-eagleW,eagleW]] as [number,number][]) {
    pts.push({ x: ex, y: eagleY, z: ez, yaw: 45, name: CNC4 });
  }

  // Needle spire
  const spireBase = crownBase + 7 * 3 * S;
  for (let y = spireBase; y < spireBase + 30 * S; y += 4.744 * S) {
    const t = (y - spireBase) / (30 * S);
    const r = (2.5 - t * 2.3) * S;
    if (r > 0.2 * S) drawRing(pts, 0, y, 0, r, MILCNC);
  }

  return applyLimit(pts, 1100);
}

// ── Tower of London ───────────────────────────────────────────────────────────
export function gen_tower_of_london(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S    = Math.max(0.25, p.scale ?? 0.5);
  const step = 1.572 * S;

  function tower(cx: number, cz: number, r: number, h: number) {
    for (let y = 0; y < h; y += step) drawRing(pts, cx, y, cz, r, STONE2);
    drawRing(pts, cx, h, cz, r + S, CASTLE);
  }

  // Outer curtain wall (170×130m, scaled)
  const ohw = 42 * S, ohd = 32 * S, owH = 10 * S;
  for (let y = 0; y < owH; y += step) {
    drawWall(pts, -ohw, y, -ohd,  ohw, y, -ohd, STONE2);
    drawWall(pts, -ohw, y,  ohd,  ohw, y,  ohd, STONE2);
    drawWall(pts, -ohw, y, -ohd, -ohw, y,  ohd, STONE2);
    drawWall(pts,  ohw, y, -ohd,  ohw, y,  ohd, STONE2);
  }
  drawWall(pts, -ohw, owH, -ohd, ohw, owH, -ohd, CASTLE);
  drawWall(pts, -ohw, owH,  ohd, ohw, owH,  ohd, CASTLE);
  drawWall(pts, -ohw, owH, -ohd, -ohw, owH, ohd, CASTLE);
  drawWall(pts,  ohw, owH, -ohd,  ohw, owH, ohd, CASTLE);
  // 4 outer corner towers
  for (const [tx,tz] of [[-ohw,-ohd],[ohw,-ohd],[ohw,ohd],[-ohw,ohd]] as [number,number][])
    tower(tx, tz, 3 * S, owH + 4 * S);

  // Inner curtain wall
  const ihw = 24 * S, ihd = 18 * S, iwH = 14 * S;
  for (let y = 0; y < iwH; y += step) {
    drawWall(pts, -ihw, y, -ihd,  ihw, y, -ihd, STONE2);
    drawWall(pts, -ihw, y,  ihd,  ihw, y,  ihd, STONE2);
    drawWall(pts, -ihw, y, -ihd, -ihw, y,  ihd, STONE2);
    drawWall(pts,  ihw, y, -ihd,  ihw, y,  ihd, STONE2);
  }
  // 4 inner corner towers + 4 mid towers
  for (const [tx,tz] of [[-ihw,-ihd],[ihw,-ihd],[ihw,ihd],[-ihw,ihd]] as [number,number][])
    tower(tx, tz, 3.5 * S, iwH + 6 * S);
  for (const [tx,tz] of [[0,-ihd],[0,ihd],[-ihw,0],[ihw,0]] as [number,number][])
    tower(tx, tz, 2.5 * S, iwH + 4 * S);

  // White Tower — central IND10 keep with 4 corner turrets
  const wtH = 22 * S, wtHW = 9 * S;
  for (let y = 0; y < wtH; y += 9.758 * S) {
    drawRect(pts, 0, y, 0, wtHW, wtHW, IND10);
    pts.push({x:-wtHW,y,z:-wtHW,yaw:225,name:IND10},{x:wtHW,y,z:-wtHW,yaw:135,name:IND10},{x:wtHW,y,z:wtHW,yaw:45,name:IND10},{x:-wtHW,y,z:wtHW,yaw:315,name:IND10});
  }
  for (const [tx,tz] of [[-wtHW,-wtHW],[wtHW,-wtHW],[wtHW,wtHW],[-wtHW,wtHW]] as [number,number][])
    tower(tx, tz, 2.5 * S, wtH + 6 * S);

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
  }

  return applyLimit(pts, 1100);
}


