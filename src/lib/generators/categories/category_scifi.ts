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
// SCIFI
// ─────────────────────────────────────────────────────────────────────────────

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
  const R      = Math.min(p.r ?? 40, 55);
  const panelW = 9.012;   // IND10 face width
  const halfH  = 4.879;   // IND10 half-height

  // ── Dish direction ────────────────────────────────────────────────────────
  const dishPhi   = 0.30 * Math.PI;   // ~54° from north pole
  const dishTheta = 0.55 * Math.PI;
  const dishCone  = 0.22;             // half-angle ~12.6° — properly scaled dish
  const dcx = Math.sin(dishPhi) * Math.cos(dishTheta);
  const dcy = Math.cos(dishPhi);
  const dcz = Math.sin(dishPhi) * Math.sin(dishTheta);

  // ── Trench band ────────────────────────────────────────────────────────────
  const trenchHalf = 0.12;   // ±~7° around equator

  // ── Build sphere rings — one ring per panel-height arc for flush coverage ─
  const nRings = Math.max(8, Math.ceil(Math.PI * R / 9.758));

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
