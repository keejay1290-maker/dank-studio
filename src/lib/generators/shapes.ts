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
import { drawWall, drawRing, drawRect, drawDisk, drawSphere, drawDome, drawSphereBudgeted, auditSphereCoverage, _drawSphereRings, applyLimit } from "../draw";
import { getObjectDef } from "../constants";

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
 * 🛰️ DEATH STAR — V3 Screen-accurate rebuild
 *
 * Research:
 *  • Superlaser dish: northern hemisphere, ~23% of diameter, large concave bowl
 *    with 8 tributary emitter channels and central focus lens (barrel_red)
 *  • Equatorial trench: full ring, visually wide and deep with trench floor panels
 *  • Surface: grey gridded tile panels in alternating bands (CNC8 + MILCNC)
 *  • Two secondary sub-trenches flank the main trench
 *
 * Panel rotation:
 *  yaw   = atan2(x, z) * 180/π  → faces panel tangent in XZ plane
 *  pitch = (phi - π/2) * 180/π  → tilts face to point radially outward
 *    phi=0 (N pole)   → pitch=-90 (lies flat, faces up)
 *    phi=π/2 (equator)→ pitch=0  (stands vertical)
 *    phi=π (S pole)   → pitch=90 (lies flat, faces down)
 */
export function gen_death_star(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const R     = Math.min(p.r ?? 35, 60);  // hard-clamped: >60 OOMs WebGL
  const panelW = 9.012;              // IND10 face width (P3D-verified)

  // ── Materials ─────────────────────────────────────────────────────────────
  const MAT_MAIN  = IND10;           // main hull plates — 9.012×9.758 industrial
  const MAT_BAND  = IND10;           // Must be same height to prevent gaps!
  const MAT_TRENCH= CNC4;            // trench floor panels
  const MAT_RIM   = STONE;           // trench wall rim — dark grey

  // ── Equatorial trench ─────────────────────────────────────────────────────
  const trenchPhi   = Math.PI / 2;
  const trenchHalf  = 0.095;         // ±5.4° either side
  const trenchDepth = 0.10 * R;      // ~7.2m deep — shallower so walls are manageable

  // ── Superlaser dish ───────────────────────────────────────────────────────
  const dishPhi   = Math.PI * 0.39;
  const dishTheta = Math.PI * 0.55;
  const dishCone  = 0.60;
  const dishDepth = 0.40 * R;

  const dcx = Math.sin(dishPhi) * Math.cos(dishTheta);
  const dcy = Math.cos(dishPhi);
  const dcz = Math.sin(dishPhi) * Math.sin(dishTheta);

  // ── Base sphere — Built explicitly bounded by the trench gap ─────────────
  const panelH = getObjectDef(MAT_MAIN)?.height ?? 9.758;
  const HULL_HALF_H = panelH / 2;

  // North hemisphere (North Pole down to the top edge of trench)
  const arcN = trenchPhi - trenchHalf;
  const nRingsN = Math.max(3, Math.round((arcN * R) / (panelH * 0.75)));
  
  // South hemisphere (Bottom edge of trench down to South Pole)
  const arcS = Math.PI - (trenchPhi + trenchHalf);
  const nRingsS = Math.max(3, Math.round((arcS * R) / (panelH * 0.75)));

  const baseSphere: Point3D[] = [];
  
  // North cap
  baseSphere.push({ x: 0, y: R + R - HULL_HALF_H, z: 0, yaw: 0, pitch: -90, name: MAT_MAIN });
  _drawSphereRings(baseSphere, 0, R, 0, R, 0, arcN, nRingsN, panelW, HULL_HALF_H, MAT_MAIN);
  
  // South half
  _drawSphereRings(baseSphere, 0, R, 0, R, trenchPhi + trenchHalf, Math.PI, nRingsS, panelW, HULL_HALF_H, MAT_MAIN);
  // South cap
  baseSphere.push({ x: 0, y: R - R - HULL_HALF_H, z: 0, yaw: 0, pitch: 90,  name: MAT_MAIN });

  for (const panel of baseSphere) {
    // Reconstruct normal to carve the dish and assign band colors
    const dx = panel.x;
    const dy = panel.y - R + HULL_HALF_H; 
    const dz = panel.z;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 0.001) { pts.push(panel); continue; }
    
    // Latitude (phi from north pole)
    const ny = dy / len;
    const phi = Math.acos(Math.max(-1, Math.min(1, ny)));

    // Skip dish region
    const nx = dx / len, nz = dz / len;
    const dot = nx * dcx + ny * dcy + nz * dcz;
    const dishAngle = Math.acos(Math.max(-1, Math.min(1, dot)));
    if (dishAngle < dishCone) continue;

    // Material banding: darker plates in latitude rings
    const bandIdx = Math.floor((phi / Math.PI) * 12);
    const nearTrench = Math.abs(phi - trenchPhi) < trenchHalf + 0.05;
    const mat = nearTrench ? MAT_RIM : (bandIdx % 2 === 0 ? MAT_MAIN : MAT_BAND);

    pts.push({ ...panel, name: mat });
  }

  // ── Trench walls — close the hull-to-trench-floor gap ───────────────────
  // Vertical ring of panels just inside the trench cut, on both rims, sitting
  // at half-depth so they bridge from the hull edge down to the trench floor.
  {
    const equatorCirc = 2 * Math.PI * R;
    const wallNP      = Math.max(8, Math.floor(equatorCirc / panelW));
    const wallArc     = (2 * Math.PI) / wallNP;
    for (const side of [-1, 1] as const) {
      const phi  = trenchPhi + side * trenchHalf;
      const sinP = Math.sin(phi);
      const cosP = Math.cos(phi);
      const midR = R - trenchDepth * 0.5;
      const circ  = 2 * Math.PI * midR * sinP;
      const scale = (circ / wallNP) / panelW;
      const pitch = (phi - Math.PI / 2) * 180 / Math.PI;
      for (let j = 0; j < wallNP; j++) {
        const theta = (j + 0.5) * wallArc;
        const x = midR * sinP * Math.cos(theta);
        const y = midR * cosP;
        const z = midR * sinP * Math.sin(theta);
        const yaw = Math.atan2(x, z) * 180 / Math.PI;
        pts.push({
          x, y: R + y, z, yaw,
          pitch: +pitch.toFixed(2),
          scale: Math.abs(scale - 1) > 0.005 ? +scale.toFixed(4) : undefined,
          name: MAT_RIM,
        });
      }
    }
  }

  // ── SUPERLASER DISH — dedicated concave builder ───────────────────────────
  // Parameterized by angular distance α from the dish axis d̂ (α ∈ [0, dishCone])
  // and azimuth a ∈ [0, 2π]. Each panel sits on a modified sphere where the
  // radius is pushed inward near the dish axis, producing a true concave bowl.
  //
  //   position(α, a) = curR(α) * [cos(α)*d̂ + sin(α)*(cos(a)*û + sin(a)*v̂)]
  //   curR(α)        = R − dishDepth * (1 − α/dishCone)^1.6
  //
  // At α=dishCone (rim) → curR=R → point sits exactly on the sphere surface,
  // so the dish merges seamlessly with the rest of the hull.

  // Orthonormal tangent basis (û, v̂) perpendicular to d̂
  let ux: number, uy: number, uz: number;
  if (Math.abs(dcy) < 0.99) {
    // u = normalize(d × worldUp), worldUp = (0,1,0)
    const cxv = dcz, czv = -dcx;
    const len = Math.sqrt(cxv * cxv + czv * czv);
    ux = cxv / len; uy = 0; uz = czv / len;
  } else {
    ux = 1; uy = 0; uz = 0;
  }
  // v̂ = d̂ × û
  const vx = dcy * uz - dcz * uy;
  const vy = dcz * ux - dcx * uz;
  const vz = dcx * uy - dcy * ux;

  // Pre-compute formatted strings — reused by center lens, spoke panels
  const dishAxisYaw   = +(Math.atan2(dcx, dcz) * 180 / Math.PI).toFixed(2);
  const dishAxisPitch = +(-Math.asin(Math.max(-1, Math.min(1, dcy))) * 180 / Math.PI).toFixed(2);

  pts.push({
    x: (R - dishDepth) * dcx,
    y: R + (R - dishDepth) * dcy,
    z: (R - dishDepth) * dcz,
    yaw: dishAxisYaw, pitch: dishAxisPitch,
    name: "barrel_red",
  });

  const dishRings = 16;
  for (let ri = 1; ri <= dishRings; ri++) {
    const t      = ri / dishRings;                       // 0 = near center, 1 = rim
    const alpha  = t * dishCone;
    const curR   = R - dishDepth * Math.pow(1 - t, 1.6); // pushed inward
    const sinAl  = Math.sin(alpha);
    const cosAl  = Math.cos(alpha);
    const ringR  = curR * sinAl;                         // effective world ring radius

    const circ   = 2 * Math.PI * ringR;
    const nP     = Math.max(8, Math.floor(circ / (panelW * 0.85)));

    // Material bands
    let mat: string;
    if (t < 0.20)      mat = "barrel_yellow";
    else if (t < 0.42) mat = "staticobj_roadblock_cncblock";
    else if (t < 0.88) mat = MILCNC;
    else               mat = MAT_RIM;

    for (let j = 0; j < nP; j++) {
      const a    = (j + 0.5) * (2 * Math.PI) / nP;
      const cosA = Math.cos(a), sinA = Math.sin(a);
      // Direction in world: cos(α)*d̂ + sin(α)*(cosA*û + sinA*v̂)
      const dirX = cosAl * dcx + sinAl * (cosA * ux + sinA * vx);
      const dirY = cosAl * dcy + sinAl * (cosA * uy + sinA * vy);
      const dirZ = cosAl * dcz + sinAl * (cosA * uz + sinA * vz);
      const px = curR * dirX;
      const py = curR * dirY;
      const pz = curR * dirZ;

      // Face normal: blend axial d̂ (center) with sphere-outward dir (rim)
      // weighted by t — center panels face straight along d̂, rim panels face
      // outward like the surrounding sphere.
      const nnx = (1 - t) * dcx + t * dirX;
      const nny = (1 - t) * dcy + t * dirY;
      const nnz = (1 - t) * dcz + t * dirZ;
      const nLen = Math.sqrt(nnx * nnx + nny * nny + nnz * nnz);
      const NX = nnx / nLen, NY = nny / nLen, NZ = nnz / nLen;
      const yaw   = Math.atan2(NX, NZ) * 180 / Math.PI;
      const pitch = -Math.asin(Math.max(-1, Math.min(1, NY))) * 180 / Math.PI;

      pts.push({
        x: px, y: R + py, z: pz,
        yaw:   +yaw.toFixed(2),
        pitch: +pitch.toFixed(2),
        name: mat,
      });
    }
  }

  // ── 8 radial emitter spokes across the dish ──────────────────────────────
  const nSpokes  = 8;
  const spokeSeg = 8;
  for (let s = 0; s < nSpokes; s++) {
    const a    = (s / nSpokes) * Math.PI * 2;
    const cosA = Math.cos(a), sinA = Math.sin(a);
    for (let k = 1; k <= spokeSeg; k++) {
      const t      = k / (spokeSeg + 1);
      const alpha  = t * dishCone;
      const curR   = R - dishDepth * Math.pow(1 - t, 1.6) + 1.5; // raised slightly
      const sinAl  = Math.sin(alpha);
      const cosAl  = Math.cos(alpha);
      const dirX = cosAl * dcx + sinAl * (cosA * ux + sinA * vx);
      const dirY = cosAl * dcy + sinAl * (cosA * uy + sinA * vy);
      const dirZ = cosAl * dcz + sinAl * (cosA * uz + sinA * vz);
      pts.push({
        x: curR * dirX,
        y: R + curR * dirY,
        z: curR * dirZ,
        yaw: dishAxisYaw, pitch: dishAxisPitch,
        name: MAT_RIM,
      });
    }
  }

  // ── Trench floor — rings spanning the full trench angular width ───────────
  const trenchFloorR = R - trenchDepth;
  const trenchRings  = 4;
  for (let ti = 0; ti < trenchRings; ti++) {
    // Span full ±trenchHalf so floor edges meet the trench walls — no bottom gap
    const phi  = trenchPhi - trenchHalf + (ti / (trenchRings - 1)) * trenchHalf * 2;
    const sinP = Math.sin(phi);
    const circ    = 2 * Math.PI * trenchFloorR * sinP;
    const nPanels = Math.max(4, Math.floor(circ / panelW));
    const scale   = (circ / nPanels) / panelW;
    const arcStep = (2 * Math.PI) / nPanels;
    const pitch   = (phi - Math.PI / 2) * 180 / Math.PI;

    for (let j = 0; j < nPanels; j++) {
      const theta = (j + 0.5) * arcStep;
      const x   = trenchFloorR * sinP * Math.cos(theta);
      const y   = trenchFloorR * Math.cos(phi);
      const z   = trenchFloorR * sinP * Math.sin(theta);
      const yaw = Math.atan2(x, z) * 180 / Math.PI;
      pts.push({
        x, y: R + y, z, yaw,
        pitch: +pitch.toFixed(2),
        scale: Math.abs(scale - 1) > 0.005 ? +scale.toFixed(4) : undefined,
        name: ti % 2 === 0 ? MAT_TRENCH : MAT_BAND,
      });
    }
  }

  // Gap audit — only runs when p.debug=1 to avoid blocking the UI on every generate
  if (p.debug) {
    const audit = auditSphereCoverage(pts, 0, R, 0, R, 0.08, 2000);
    const tag = audit.coverage > 0.98 ? "PASS" : audit.coverage > 0.92 ? "WARN" : "FAIL";
    // eslint-disable-next-line no-console
    console.log(`[death_star audit] ${tag} — coverage ${(audit.coverage*100).toFixed(1)}% worst=${(audit.maxGapAngle*180/Math.PI).toFixed(1)}° panels=${pts.length}`);
  }

  return applyLimit(pts, 1150);
}

/**
 * 🤖 AT-AT WALKER — Imperial All Terrain Armoured Transport
 *
 * Research: T-1 walker — 22.5m tall, 26m long, 8.6m wide.
 * At S=1 this generator is ~3× real scale for DayZ visibility.
 *
 * Structure:
 *  • Body — huge IND10 armour-plate box on 4 articulated legs
 *  • Neck — short angled spar from front-top of body to head base
 *  • Head — CNC8 box, facing south (-Z). Two chin cannons with barrel_red tips.
 *  • Legs — MILCNC panels: upper thigh (angled outward), lower shin (near-vertical), foot pad
 *
 * The angled drawWall segments auto-calculate pitch → panels look rotated/mechanical.
 * barrel_red at cannon muzzles = the original working look.
 */
export function gen_atat_walker(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S  = Math.max(0.5, p.scale ?? 1);

  // ── Dimensions ────────────────────────────────────────────────────────────
  const LH = 16 * S;        // leg height (ground to body floor)
  const BW =  7 * S;        // body half-width  (full = 14m)
  const BD = 12 * S;        // body half-depth  (full = 24m)
  // Body is one row of IND10 (P3D height = 9.758m) → sits from LH to LH+9.758
  const bodyTop = LH + 9.758 * S;

  // ── BODY — IND10 armour plates (9.758m tall) ──────────────────────────────
  drawRect(pts, 0, LH, 0, BW, BD, IND10);
  
  // Solid upper and lower decks for the body encapsulation
  const PW = Math.max(0.1, 4.052 * S); 
  const PD = Math.max(0.1, 4.744 * S); 
  for(let z = -BD + PD/2; z <= BD - PD/2; z += PD) {
     for(let x = -BW + PW/2; x <= BW - PW/2; x += PW) {
         pts.push({x, y: LH, z, yaw: 0, pitch: -90, name: MILCNC});
         pts.push({x, y: bodyTop, z, yaw: 0, pitch: -90, name: MILCNC});
     }
  }

  // ── NECK — armored tube extending forward ─────────────────────────────────
  const neckBX = 0, neckBY = bodyTop - 2 * S, neckBZ = -BD;
  const neckTX = 0, neckTY = LH + 6 * S,      neckTZ = -BD - 10 * S;
  // Four walls to construct a fully enclosed structural tunnel
  drawWall(pts, neckBX - 2*S, neckBY, neckBZ, neckTX - 2*S, neckTY, neckTZ, CNC4);
  drawWall(pts, neckBX + 2*S, neckBY, neckBZ, neckTX + 2*S, neckTY, neckTZ, CNC4);
  drawWall(pts, neckBX, neckBY + 2*S, neckBZ, neckTX, neckTY + 2*S, neckTZ, CNC4);
  drawWall(pts, neckBX, neckBY - 2*S, neckBZ, neckTX, neckTY - 2*S, neckTZ, CNC4);

  // ── HEAD — CNC8 box (6m tall capsular head) ───────────────────────────────
  const headCZ = neckTZ - 6 * S;   // centre of head along Z
  const headBY = neckTY - 5 * S;   // head base Y (slightly below neck tip)
  const HW = 5 * S;                 // head half-width (X)
  const HD = 6 * S;                 // head half-depth (Z)
  drawRect(pts, 0, headBY,           headCZ, HW, HD, CNC8);
  drawRect(pts, 0, headBY + 3 * S,   headCZ, HW, HD, CNC8);
  
  // Solid upper and lower decks for the head encapsulation
  for(let z = headCZ - HD + PD/2; z <= headCZ + HD - PD/2; z += PD) {
      for(let x = -HW + PW/2; x <= HW - PW/2; x += PW) {
          pts.push({x, y: headBY, z, yaw: 0, pitch: -90, name: MILCNC});
          pts.push({x, y: headBY + 6 * S, z, yaw: 0, pitch: -90, name: MILCNC});
      }
  }

  // ── CHIN CANNONS — two forward barrels with barrel_red muzzles ───────────
  // Mounted on the lower chin (front-bottom of head).
  const cannonY  = headBY + 1 * S;          // chin height
  const cannonZ1 = headCZ - HD;             // cannon root (front face of head)
  const cannonZ2 = cannonZ1 - 10 * S;       // muzzle tip

  for (const cx of [-3 * S, 3 * S]) {
    drawWall(pts, cx, cannonY, cannonZ1, cx, cannonY, cannonZ2, CNC4);
    // barrel_red cluster at the muzzle — the original working look
    pts.push({ x: cx,            y: cannonY + 1.5 * S, z: cannonZ2, yaw: 0, name: "barrel_red" });
    pts.push({ x: cx,            y: cannonY,            z: cannonZ2, yaw: 0, name: "barrel_red" });
    pts.push({ x: cx + 0.4 * S, y: cannonY + 0.8 * S, z: cannonZ2, yaw: 0, name: "barrel_red" });
    pts.push({ x: cx - 0.4 * S, y: cannonY + 0.8 * S, z: cannonZ2, yaw: 0, name: "barrel_red" });
  }

  // ── 4 LEGS — Fully articulated 3D armored segments ───────────────────────
  const legPositions = [
    { lx:  BW, lz: -BD },   // front-right
    { lx: -BW, lz: -BD },   // front-left
    { lx:  BW, lz:  BD },   // rear-right
    { lx: -BW, lz:  BD },   // rear-left
  ];

  for (const leg of legPositions) {
    const kneeX = leg.lx * 1.35;
    const kneeY = LH * 0.52;
    const kneeZ = leg.lz;

    const ankleX = leg.lx * 1.15;
    const ankleY = 2 * S;

    // Upper leg / Hip (Enclosed 4-sided strut)
    drawWall(pts, leg.lx - 2*S, LH, leg.lz - 2*S, kneeX - 2*S, kneeY, kneeZ - 2*S, CNC4);
    drawWall(pts, leg.lx + 2*S, LH, leg.lz + 2*S, kneeX + 2*S, kneeY, kneeZ + 2*S, CNC4);
    drawWall(pts, leg.lx - 2*S, LH, leg.lz + 2*S, kneeX - 2*S, kneeY, kneeZ + 2*S, CNC4);
    drawWall(pts, leg.lx + 2*S, LH, leg.lz - 2*S, kneeX + 2*S, kneeY, kneeZ - 2*S, CNC4);

    // Knee Joint (Solid cylinder ring)
    drawRing(pts, kneeX, kneeY, kneeZ, 3*S, STONE);

    // Lower leg / Shin (Enclosed 4-sided strut)
    drawWall(pts, kneeX - 1.5*S, kneeY, kneeZ - 1.5*S, ankleX - 1.5*S, ankleY, kneeZ - 1.5*S, CNC4);
    drawWall(pts, kneeX + 1.5*S, kneeY, kneeZ + 1.5*S, ankleX + 1.5*S, ankleY, kneeZ + 1.5*S, CNC4);
    drawWall(pts, kneeX - 1.5*S, kneeY, kneeZ + 1.5*S, ankleX - 1.5*S, ankleY, kneeZ + 1.5*S, CNC4);
    drawWall(pts, kneeX + 1.5*S, kneeY, kneeZ - 1.5*S, ankleX + 1.5*S, ankleY, kneeZ - 1.5*S, CNC4);

    // Foot pad (Large rounded disc)
    drawDisk(pts, ankleX, 0.5 * S, kneeZ, 4.5 * S, CNC4);
    // Toe flap
    drawWall(pts, ankleX - 3*S, 1.5*S, kneeZ - 5*S, ankleX + 3*S, 1*S, kneeZ - 6*S, CNC4);
  }

  return pts;
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
 * 🛰️ STAR DESTROYER — Imperial-class
 * Built using solid flat deck plating and stacked architectural tiers.
 */
export function gen_star_destroyer(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, p.scale ?? 1);
  const L = 160 * S;
  const HW = 45 * S; // Half-width at stern
  const bowZ = -L / 2;
  const sternZ = L / 2;

  // Panel dimensions for IND10 when laid flat (pitch: -90)
  const PW = Math.max(0.1, 9.012 * S); // width X
  const PD = Math.max(0.1, 9.758 * S); // depth Z
  const deckY = 3 * S;  // dorsal deck height
  const botY = -3 * S;  // ventral deck height

  // 1. PERIMETER WALLS (The wedge border)
  drawWall(pts, -HW, 0, sternZ, 0, 0, bowZ, IND10);
  drawWall(pts, HW, 0, sternZ, 0, 0, bowZ, IND10);
  drawWall(pts, -HW, 0, sternZ, HW, 0, sternZ, IND10);

  // 2. MAIN HULL DORSAL & VENTRAL DECKS (Flat horizontal panels)
  // Instead of an exposed blocky grid pushing out, we lay several perfectly 
  // tangent layers of deck plates exactly parallel to the diagonal outer hull.
  // This swallows the rough edges of the inner grid into a smooth border.
  const edgeLen = Math.sqrt(HW * HW + L * L);
  const nEdgeP = Math.floor(edgeLen / PW);
  const eScale = edgeLen / (nEdgeP * PW);
  
  for(const side of [-1, 1]) {
     // Yaw aligns tangent to the diagonal
     const edgeYaw = side * Math.atan2(HW, L) * 180 / Math.PI + 90; 
     
     // 3 layers deep of parallel border plating
     for(let layer = 0; layer < 3; layer++) {
        // Shift inwardly towards the central spine
        const innerShiftX = side * (layer * PD * 0.9 * Math.cos(Math.atan2(HW, L)));
        const innerShiftZ = layer * PD * 0.9 * Math.sin(Math.atan2(HW, L));
        
        for (let i = 0; i < nEdgeP; i++) {
           const t = (i + 0.5) / nEdgeP;
           let z = bowZ + t * L + innerShiftZ;
           let x = (side * t * HW) - innerShiftX;
           
           if (z > sternZ - 2*S) continue; // Keep within rear bound
           
           pts.push({x, y: deckY, z, yaw: edgeYaw, pitch: -90, scale: eScale, name: IND10});
           pts.push({x, y: botY, z, yaw: edgeYaw, pitch: -90, scale: eScale, name: IND10});
        }
     }
  }

  // Deep internal grid (now safely shielded 3 layers deep, preventing any jagged edges poking out)
  for (let z = bowZ + (3*PD); z <= sternZ - PD; z += PD) {
    const fraction = (z - bowZ) / L;
    const currentHW = (HW * fraction) - (3 * PD * 0.9); 
    if (currentHW <= 0) continue;
    
    const rows = Math.floor((currentHW * 2) / PW);
    const startX = -(rows * PW) / 2 + PW / 2;

    for (let i = 0; i < rows; i++) {
      const x = startX + i * PW;
      pts.push({ x, y: deckY, z, yaw: 0, pitch: -90, name: IND10 });
      if (fraction > 0.4) {
        pts.push({ x, y: botY, z, yaw: 0, pitch: -90, name: IND10 });
      }
    }
  }

  // 3. TIERED SUPERSTRUCTURE (The layered city-blocks on the dorsal deck)
  // Tier 1 (Base wide tier)
  drawRect(pts, 0, deckY + 2 * S, sternZ - 25 * S, 14 * S, 20 * S, CNC8); // 8m walls
  // Tier 2 (Middle narrower tier)
  drawRect(pts, 0, deckY + 5 * S, sternZ - 20 * S, 10 * S, 15 * S, CNC4); // 4m walls

  // 4. BRIDGE TOWER (The iconic command neck and head)
  const towerZ = sternZ - 12 * S;
  const neckY = deckY + 7 * S;
  // Neck (Stalk)
  drawRect(pts, 0, neckY, towerZ, 3 * S, 3 * S, IND10);
  drawRect(pts, 0, neckY + 4 * S, towerZ, 3 * S, 3 * S, IND10);
  
  // Command Bridge (T-Shape wide head at the top)
  const bridgeY = neckY + 9 * S;
  drawWall(pts, -10 * S, bridgeY, towerZ, 10 * S, bridgeY, towerZ, IND10);
  // Viewport windows
  drawWall(pts, -9 * S, bridgeY + 3.5 * S, towerZ - 1 * S, 9 * S, bridgeY + 3.5 * S, towerZ - 1 * S, CNC4);

  // Shield Generator Domes (Two spheres on bridge wings)
  for (const side of [-1, 1] as const) {
    const domeX = side * 8 * S;
    for (let h = 0; h <= 2; h++) {
       const r = (2.5 - h * 0.6) * S;
       if (r > 0) drawRing(pts, domeX, bridgeY + 4 * S + h * S, towerZ, r, CNC4);
    }
    pts.push({ x: side * 8 * S, y: bridgeY + 7 * S, z: towerZ, yaw: 0, pitch: -90, name: CNC4 });
  }

  // 5. REAR ENGINE NOZZLES
  // 3 Primary engines along the stern
  for (const x of [-16, 0, 16] as const) {
    drawRing(pts, x * S, 0, sternZ + 1 * S, 4.5 * S, IND10);
    drawRing(pts, x * S, 0, sternZ + 2 * S, 2.5 * S, "barrel_blue"); // engine glow
  }
  // 2 Auxiliary engines
  for (const x of [-28, 28] as const) {
    drawRing(pts, x * S, deckY, sternZ + 1 * S, 2 * S, CNC4);
  }

  return pts;
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
  // We stack 3 layers along the Z-axis to give the gate massive thickness
  for (const zOffset of [ -2, 0, 2 ]) {
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

  // 4. BASE APPROACH RAMP (Stepped entrance leading into the event horizon)
  // The bottom of the event horizon is at Y ≈ 2.5m off the ground.
  for (let yLevel = 0; yLevel <= 3; yLevel++) {
     const depth = 12 - yLevel * 2.5;
     const width = R * 0.8 - yLevel * 1.5;
     // Ramp levels stack vertically
     drawRect(pts, 0, yLevel, 0, width, depth, CNC4);
     
     // Solid deck on top of each ramp step
     const PW_RAMP = 4.052; // MILCNC
     for(let x = -width + PW_RAMP/2; x <= width; x += PW_RAMP) {
         pts.push({ x, y: yLevel + 1, z: depth, yaw: 0, pitch: -90, name: MILCNC });
         pts.push({ x, y: yLevel + 1, z: -depth, yaw: 0, pitch: -90, name: MILCNC });
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
  for (let sy = towerTopY; sy < towerTopY + 30 * S; sy += 9.012 * S) {
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
 *  • Core shaft — IND10 panels, ziggurat setback at 30%, 60%, 85% height
 *  • Neon conduit rings — barrel_blue every 3 floors, barrel_red accent bands
 *  • Skybridge arms — CNC4 horizontal beams at 40% and 70% height
 *  • Rooftop antenna cluster — thin MILCNC spires and a central barrel_blue beacon
 */
export function gen_cyberpunk(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, p.scale ?? 1);
  const h = 80 * S;
  const panelH = 9.758 * S;

  // Ziggurat setback profile — tower width decreases at 30%, 60%, 85% height
  function towerHalfWidth(y: number): number {
    const t = y / h;
    if (t < 0.30) return 18 * S;
    if (t < 0.60) return 13 * S;
    if (t < 0.85) return  9 * S;
    return 6 * S;
  }

  // Core shaft with setback walls
  for (let y = 0; y < h; y += panelH) {
    const w = towerHalfWidth(y);
    const mat = (Math.floor(y / panelH) % 3 === 0) ? IND10 : CNC8;
    drawRect(pts, 0, y, 0, w, w, mat);

    // Flat deck at each setback transition
    const nextW = towerHalfWidth(y + panelH);
    if (nextW < w - 1) {
      for (let dx = -w + 4.5*S; dx <= w - 4.5*S; dx += 9*S) {
        pts.push({ x: dx, y: y + panelH, z:  w - 4.5*S, yaw: 0, pitch: -90, name: MILCNC });
        pts.push({ x: dx, y: y + panelH, z: -w + 4.5*S, yaw: 0, pitch: -90, name: MILCNC });
      }
    }
  }

  // Neon conduit rings — barrel_blue every 3 floors, barrel_red accent every 7
  for (let y = panelH * 2; y < h; y += panelH * 3) {
    const w = towerHalfWidth(y);
    const isRed = Math.floor(y / (panelH * 3)) % 7 === 0;
    drawRing(pts, 0, y + panelH * 0.1, 0, w + 2 * S, isRed ? "barrel_red" : "barrel_blue");
  }

  // Skybridge arms at 40% and 70% height — CNC4 beams extending outward
  for (const frac of [0.40, 0.70]) {
    const bridgeY = h * frac;
    const bw = towerHalfWidth(bridgeY);
    for (const side of [-1, 1] as const) {
      // Horizontal arm extending 20m past the tower face
      drawWall(pts, side * bw, bridgeY, -8*S, side * (bw + 20*S), bridgeY, -8*S, CNC4);
      drawWall(pts, side * bw, bridgeY,  8*S, side * (bw + 20*S), bridgeY,  8*S, CNC4);
      // Arm cap wall
      drawWall(pts, side * (bw + 20*S), bridgeY, -8*S, side * (bw + 20*S), bridgeY, 8*S, CNC4);
      // Neon underside glow
      pts.push({ x: side * (bw + 10*S), y: bridgeY - 1*S, z: 0, yaw: 0, pitch: -90, name: "barrel_blue" });
    }
  }

  // Rooftop antenna cluster — 4 perimeter spires + central beacon
  const roofY = h;
  const roofW = towerHalfWidth(h) - 2*S;
  for (const [ox, oz] of [[roofW, 0], [-roofW, 0], [0, roofW], [0, -roofW]] as const) {
    for (let ay = roofY; ay < roofY + 20*S; ay += 9.012*S) {
      pts.push({ x: ox, y: ay, z: oz, yaw: 0,  pitch: 0, name: MILCNC });
      pts.push({ x: ox, y: ay, z: oz, yaw: 90, pitch: 0, name: MILCNC });
    }
  }
  // Central beacon
  pts.push({ x: 0, y: roofY + 24*S, z: 0, yaw: 0, name: "barrel_red" });
  pts.push({ x: 0, y: roofY + 26*S, z: 0, yaw: 0, name: "barrel_blue" });

  return pts;
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
  const R = Math.min(p.r ?? 60, 100); // planet radius
  const cx = 0, cy = R, cz = 0;       // planet centre elevated so it rests on ground

  // Planet body
  drawSphere(pts, cx, cy, cz, R, IND10);

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
  const S = Math.max(0.5, p.scale ?? 1);

  // ── Dimensions ────────────────────────────────────────────────────────────
  const fY    = 3 * S;    // fuselage floor Y (sits off ground)
  const noseZ = -18 * S;  // nose tip Z
  const tailZ =  10 * S;  // tail end Z

  // ── FUSELAGE — CNC4 cross-sections, tapered at nose ──────────────────────
  // Each section: drawRect creates a 4-wall rectangular tube
  const fuseSections: Array<{ z: number; hw: number; hd: number }> = [
    { z: noseZ + 3*S,  hw: 0.5*S, hd: 0.4*S },  // narrow nose section
    { z: noseZ + 7*S,  hw: 1.2*S, hd: 1.0*S },  // taper widens
    { z: noseZ + 11*S, hw: 1.8*S, hd: 1.5*S },  // transitioning to body
    { z: -4 * S,       hw: 2.2*S, hd: 1.8*S },  // pre-cockpit body
    { z:  0 * S,       hw: 2.2*S, hd: 1.8*S },  // wing root body
    { z:  4 * S,       hw: 2.0*S, hd: 1.7*S },  // rear body
    { z: tailZ - 1*S,  hw: 1.6*S, hd: 1.4*S },  // tail
  ];
  for (const sec of fuseSections) {
    drawRect(pts, 0, fY, sec.z, sec.hw, sec.hd, CNC4);
  }
  // Nose point cap
  pts.push({ x: 0, y: fY, z: noseZ + 0.5*S, yaw: 0, name: CNC4 });

  // ── COCKPIT CANOPY — raised above fuselage, mid-ship ─────────────────────
  // Sits from z=-10 to z=-4, elevated 2.5m above fuselage floor
  for (const z of [-9*S, -6*S, -3.5*S]) {
    drawRect(pts, 0, fY + 2.5*S, z, 1.3*S, 1.1*S, CNC4);
  }
  // Canopy top ridge
  pts.push({ x: 0, y: fY + 4.2*S, z: -7*S, yaw: 0, name: CNC4 });

  // R2-D2 astromech dome behind cockpit
  pts.push({ x: 0, y: fY + 3.8*S, z: -1.5*S, yaw: 0, name: "barrel_blue" });

  // ── VERTICAL TAIL FIN ─────────────────────────────────────────────────────
  for (let y = 0; y <= 4*S; y += 2.5*S) {
    pts.push({ x: 0, y: fY + 1.5*S + y, z: tailZ - 2*S, yaw: 90, name: CNC4 });
    pts.push({ x: 0, y: fY + 1.5*S + y, z: tailZ - 5*S, yaw: 90, name: CNC4 });
  }

  // ── WINGS — S-foils in attack position (X formation) ─────────────────────
  // pitch=-90 → CNC8 panel lays flat (8m E-W × 3m N-S, 0.4m thick)
  // Y increases toward tip on upper wings, decreases on lower wings → X shape
  //
  // Wing chord spans z=-6 to z=+6 (covered by 4 panels × 3m each)
  const chordZs  = [-4.5*S, -1.5*S, 1.5*S, 4.5*S];
  // Span sections: inner (x=±4), outer (x=±12), tip approach (x=±18)
  const spanDefs = [
    { t: 0.0,  xMag: 4  },   // inner span  (x ± 0–8)
    { t: 0.55, xMag: 12 },   // outer span  (x ± 8–16)
    { t: 0.9,  xMag: 18 },   // tip section (x ± 14–22)
  ];

  for (const side of [-1, 1] as const) {
    for (const upper of [1, -1] as const) {
      // upper=1: wing rises 5m at tip. upper=-1: wing drops 3m at tip.
      const tipYSpread = upper === 1 ? 5 * S : -3 * S;

      for (const span of spanDefs) {
        const wx = side * span.xMag * S;
        const wy = fY + 0.5*S + span.t * tipYSpread;

        // Flat wing surface — all chord panels at this span section
        for (const cz of chordZs) {
          pts.push({ x: wx, y: wy, z: cz, yaw: 0, pitch: -90, name: CNC8 });
        }

        // Red stripe — one barrel_red per span section along wing midline
        pts.push({ x: wx, y: wy + 0.3, z: 0, yaw: 0, pitch: -90, name: "barrel_red" });
      }

      // ── ENGINE NACELLE — at outer wing root (x=±12) ───────────────────
      // 3 rings form the cylindrical engine body; military concrete for contrast
      const engX = side * 12 * S;
      const engY = fY + 0.5*S + 0.45 * tipYSpread;
      for (let z = 3*S; z <= 9*S; z += 3*S) {
        drawRing(pts, engX, engY, z, 2.2*S, CNC4);
      }
      drawRing(pts, engX, engY, 9*S, 2.5*S, MILCNC);  // exhaust ring
      pts.push({ x: engX, y: engY, z: 9*S, yaw: 0, pitch: -90, name: "barrel_blue" }); // engine glow

      // ── LASER CANNON — from wingtip, extending forward past nose ──────
      const tipX = side * 21 * S;
      const tipY = fY + 0.5*S + tipYSpread;
      drawWall(pts, tipX, tipY, -7*S, tipX, tipY, noseZ - 1*S, CNC4);
      // barrel_red muzzle cluster at cannon tip
      pts.push({ x: tipX,            y: tipY + 1.5*S, z: noseZ - 1*S, yaw: 0, name: "barrel_red" });
      pts.push({ x: tipX,            y: tipY,          z: noseZ - 1*S, yaw: 0, name: "barrel_red" });
      pts.push({ x: tipX + 0.5*S,   y: tipY + 0.8*S,  z: noseZ - 1*S, yaw: 0, name: "barrel_red" });
      pts.push({ x: tipX - 0.5*S,   y: tipY + 0.8*S,  z: noseZ - 1*S, yaw: 0, name: "barrel_red" });
    }
  }

  return pts;
}


// ═══════════════════════════════════════════════════════════════════════════════
//  MONUMENTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🗼 EIFFEL TOWER
 */
export function gen_eiffel_tower(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, p.scale ?? 1);
  const IRON = CNC4;       // We use CNC4 for the dark structural iron look
  const IRON_H = 4.744 * S;
  const METAL = IND10;     


  // ── Key architectural heights & dimensions ───────────────────────────────
  const hL1 = 57 * S;      // First platform
  const hL2 = 115 * S;     // Second platform
  const topH = 276 * S;    // Tower top before spire

  const wBase = 45 * S;    // Spread of legs at ground
  const wL1 = 25 * S;
  const wL2 = 10 * S;
  const wTop = 2 * S;

  // 1. ANCHOR LEGS (Ground to L1)
  // Four massive structural pillars sweeping upward to merge at the first deck
  for (let y = 0; y < hL1; y += IRON_H) {
    const t = y / hL1;
    // Dramatic exponential curve inward
    const curveT = Math.pow(t, 0.75); 
    const cx = wBase - (wBase - wL1) * curveT;
    const cz = cx;
    
    // The pillar itself is a square column that tapers in thickness
    const legW = 8 * S * (1 - t * 0.4); 

    // Draw the 4 discrete structural boxes
    drawRect(pts,  cx, y,  cz, legW, legW, IRON);
    drawRect(pts, -cx, y,  cz, legW, legW, IRON);
    drawRect(pts,  cx, y, -cz, legW, legW, IRON);
    drawRect(pts, -cx, y, -cz, legW, legW, IRON);
    
    // Draw the monumental connecting arches filling the space under L1
    if (y > hL1 * 0.4) {
       drawRect(pts, 0, y, 0, cx, cx, IRON);
    }
  }

  // 2. FIRST PLATFORM DECK
  const deck1W = wL1 + 8 * S;
  drawRect(pts, 0, hL1, 0, deck1W, deck1W, METAL);
  drawRect(pts, 0, hL1 + 2*S, 0, deck1W, deck1W, METAL);

  // 3. MIDDLE TOWER (L1 to L2)
  // The 4 legs structurally merge into a sweeping central shaft
  for (let y = hL1 + IRON_H; y < hL2; y += IRON_H) {
    const t = (y - hL1) / (hL2 - hL1);
    const curveT = Math.pow(t, 0.85); // Gentle taper
    const w = wL1 - (wL1 - wL2) * curveT;
    drawRect(pts, 0, y, 0, w + 4*S, w + 4*S, IRON);
  }

  // 4. SECOND PLATFORM DECK
  const deck2W = wL2 + 5 * S;
  drawRect(pts, 0, hL2, 0, deck2W, deck2W, METAL);
  
  // 5. UPPER TOWER (L2 to Top)
  for (let y = hL2 + IRON_H; y < topH; y += IRON_H) {
    const t = (y - hL2) / (topH - hL2);
    const curveT = Math.pow(t, 1.2); // Tapers aggressively near the very tip
    const w = wL2 - (wL2 - wTop) * curveT;
    drawRect(pts, 0, y, 0, w + 2*S, w + 2*S, IRON);
  }

  // 6. CUPOLA & SPIRE
  drawDome(pts, 0, topH, 0, wTop + 4*S, IRON);
  drawWall(pts, 0, topH, 0, 0, topH + 24*S, 0, METAL); // Needle antenna
  pts.push({ x: 0, y: topH + 24*S, z: 0, yaw: 0, name: "barrel_red" }); // Aviation safety light

  return pts;
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
  const base = p.base   ?? 120;
  const h    = p.height ?? 80;
  const S    = base / 120;
  const step = 4 * S;

  for (let y = 0; y <= h; y += step) {
    const t  = y / h;
    const hw = (base/2) * (1 - t);
    if (hw < 2) break;
    drawRect(pts, 0, y, 0, hw, hw, STONE2);
  }
  pts.push({ x:0, y:h+2, z:0, name: STONE2 });
  return pts;
}

/**
 * 🪨 STONEHENGE
 */
export function gen_stonehenge(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const r  = p.r ?? 25;
  const n  = 30;
  for (let i = 0; i < n; i++) {
    const a   = (i / n) * Math.PI * 2;
    const x   = r * Math.cos(a), z = r * Math.sin(a);
    const yaw = -a * 180 / Math.PI + 90;
    // standing stone (2 stack for height)
    pts.push({ x, y:0, z, yaw, name: STONE2 });
    pts.push({ x, y:3.5, z, yaw, name: STONE2 });
    // lintel every 2 stones
    if (i % 2 === 0) {
      const a2 = ((i+1) / n) * Math.PI * 2;
      const mx = (r*Math.cos(a) + r*Math.cos(a2)) / 2;
      const mz = (r*Math.sin(a) + r*Math.sin(a2)) / 2;
      pts.push({ x:mx, y:7, z:mz, yaw, name: STONE });
    }
  }
  // Horseshoe inner ring
  const r2 = r * 0.55;
  for (let i = 0; i < 10; i++) {
    const a   = (i/10)*Math.PI * 2;
    const yaw = -a * 180 / Math.PI + 90;
    pts.push({ x:r2*Math.cos(a), y:0, z:r2*Math.sin(a), yaw, name: STONE });
    pts.push({ x:r2*Math.cos(a), y:3.5, z:r2*Math.sin(a), yaw, name: STONE });
  }
  return pts;
}

/**
 * 🕰️ BIG BEN — Elizabeth Tower
 */
export function gen_big_ben(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S  = Math.max(0.5, p.scale ?? 1);
  const hw = 7.6 * S;

  const rect = (y: number, half: number) => drawRect(pts, 0, y, 0, half, half, STONE2);

  // 1. Plinth (3 steps)
  rect(0,      hw + 2.8*S);
  rect(2*S,    hw + 1.6*S);
  rect(4*S,    hw + 0.6*S);

  // 2. Main shaft 6–52m
  for (let y = 6*S; y <= 52*S; y += 8*S) rect(y, hw);

  // 3. Clock stage 52–64m
  for (let y = 52*S; y <= 64*S; y += 4*S) rect(y, hw + 1.4*S);

  // 4. Clock faces (rings on 4 sides)
  const cY = 56*S, cR = 3.5*S, cOff = hw + 1.6*S;
  drawRing(pts, 0,    cY, -cOff, cR, STONE2);
  drawRing(pts, 0,    cY,  cOff, cR, STONE2);
  drawRing(pts, -cOff,cY, 0,    cR, STONE2);
  drawRing(pts,  cOff,cY, 0,    cR, STONE2);

  // 5. Belfry 64–74m with arch openings
  const bw = hw + 1.2*S, ag = 3.2*S;
  for (let y = 64*S; y <= 74*S; y += 3*S) {
    drawWall(pts, -bw, y, -bw,  -ag, y, -bw, STONE2);
    drawWall(pts,  ag, y, -bw,   bw, y, -bw, STONE2);
    drawWall(pts, -bw, y,  bw,  -ag, y,  bw, STONE2);
    drawWall(pts,  ag, y,  bw,   bw, y,  bw, STONE2);
    drawWall(pts, -bw, y, -bw,  -bw, y, -ag, STONE2);
    drawWall(pts, -bw, y,  ag,  -bw, y,  bw, STONE2);
    drawWall(pts,  bw, y, -bw,   bw, y, -ag, STONE2);
    drawWall(pts,  bw, y,  ag,   bw, y,  bw, STONE2);
  }

  // 6. Corner pinnacles
  const po = hw + 3*S;
  for (const [cx,cz] of [[-po,-po],[po,-po],[-po,po],[po,po]]) {
    for (let y = 52*S; y <= 85*S; y += 4*S) drawRing(pts, cx, y, cz, 2*S, STONE2);
  }

  // 7. Gothic spire 74–95m
  for (let y = 74*S; y <= 94*S; y += 3*S) {
    const t = (y-74*S)/(22*S);
    const sr = hw*(1-t)*0.9;
    if (sr < 0.5) break;
    rect(y, sr);
  }
  pts.push({ x:0, y:95*S, z:0, name: STONE2 });
  return pts;
}

/**
 * 🗽 STATUE OF LIBERTY
 */
export function gen_statue_liberty(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, p.scale ?? 1);

  // Fort Wood star base
  const oR = 22*S, iR = 14*S;
  for (let i = 0; i < 12; i++) {
    const a1 = (i/12)*Math.PI*2, a2 = ((i+1)/12)*Math.PI*2;
    const r1 = i%2===0?oR:iR, r2 = i%2===0?iR:oR;
    for (let y = 0; y <= 6*S; y += 3*S)
      drawWall(pts, Math.cos(a1)*r1, y, Math.sin(a1)*r1, Math.cos(a2)*r2, y, Math.sin(a2)*r2, STONE2);
  }

  // Pedestal 6–47m
  const stages = [{y0:6,y1:15,hw:10},{y0:15,y1:30,hw:9},{y0:30,y1:47,hw:8}];
  for (const {y0,y1,hw} of stages)
    for (let y = y0*S; y <= y1*S; y += 4*S) drawRect(pts, 0, y, 0, hw*S, hw*S, STONE2);

  // Statue body 47–82m
  for (let y = 47*S; y <= 82*S; y += 4*S) {
    const t = (y-47*S)/(35*S);
    drawRing(pts, 0, y, 0, (5-t*2.5)*S, STONE2);
  }

  // Right arm (torch)
  for (let i = 0; i <= 10; i++) {
    const t = i/10;
    pts.push({ x:(4+t*4)*S, y:(72+t*21)*S, z:0, yaw:90, name: STONE2 });
  }
  drawRing(pts, 8*S, 93*S, 0, 1.5*S, IND10);
  pts.push({ x:8*S, y:96*S, z:0, yaw:90, name: IND10 });

  // Left arm (tablet)
  for (let i = 0; i <= 6; i++) {
    const t = i/6;
    pts.push({ x:(-3-t*2)*S, y:(72-t*7)*S, z:0, yaw:270, name: STONE2 });
  }

  // Crown spikes
  for (let i = 0; i < 7; i++) {
    const a = (i/7)*Math.PI*2;
    drawWall(pts, Math.cos(a)*1.5*S, 86*S, Math.sin(a)*1.5*S, Math.cos(a)*4*S, 93*S, Math.sin(a)*4*S, STONE2);
  }
  return pts;
}

/**
 * ✝️ CHRIST THE REDEEMER
 */
export function gen_christ_redeemer(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, p.scale ?? 1);
  const pw = 8*S;

  // Pedestal
  for (let y = 0; y <= 9.5*S; y += 3*S) drawRect(pts, 0, y, 0, pw, pw, STONE2);

  // Body
  for (let y = 9.5*S; y <= 30*S; y += 3.5*S) {
    const t = (y-9.5*S)/(20.5*S);
    drawRing(pts, 0, y, 0, (2.2-t*1.2)*S, STONE2);
  }

  // Arms
  const armY = 26*S;
  for (const dz of [-1.5*S, 0, 1.5*S]) {
    drawWall(pts, 0, armY, dz, 14*S, armY-S, dz, STONE2);
    drawWall(pts, 0, armY, dz, -14*S, armY-S, dz, STONE2);
  }

  // Head
  drawRing(pts, 0, 32*S, 0, 1.8*S, STONE2);
  drawRing(pts, 0, 34*S, 0, 1.4*S, STONE2);
  pts.push({ x:0, y:37.5*S, z:0, name: STONE2 });
  return pts;
}

/**
 * 🏛️ THE PARTHENON
 */
export function gen_parthenon(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, p.scale ?? 1);
  const L = 35*S, W = 16*S, colH = 10*S, colR = 1.2*S, sp = 4.5*S;

  // Stepped platform
  for (let step = 0; step < 3; step++) {
    const extra = (3-step)*1.5*S;
    drawRect(pts, 0, step*0.8*S, 0, L+extra, W+extra, STONE2);
  }

  // Columns (east + west facade + sides)
  for (let x = -L; x <= L; x += sp)
    for (const z of [-W, W]) {
      for (let y = 2.4*S; y <= 2.4*S+colH; y += 2.5*S) drawRing(pts, x, y, z, colR, STONE2);
    }
  for (let z = -W; z <= W; z += sp)
    for (const x of [-L, L]) {
      for (let y = 2.4*S; y <= 2.4*S+colH; y += 2.5*S) drawRing(pts, x, y, z, colR, STONE2);
    }

  // Entablature
  drawRect(pts, 0, 2.4*S+colH, 0, L, W, STONE2);

  // Pediment (triangular gable on E and W)
  for (let x = -L; x <= L; x += sp) {
    const peakH = (1 - Math.abs(x)/L) * 4*S;
    if (peakH > 0.5) pts.push({ x, y: 2.4*S+colH+0.5*S+peakH, z:-W, yaw:0, name: STONE2 });
  }
  return pts;
}

/**
 * 🌉 ARC DE TRIOMPHE
 */
export function gen_arc_triomphe(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S  = Math.max(0.5, p.scale ?? 1);
  const hw = 13*S, hd = 7*S, h = 50*S, archR = 10*S;

  // 4 solid piers
  for (let y = 0; y <= h; y += 4*S) {
    drawWall(pts, -hw, y, -hd, -hw+6*S, y, -hd, STONE2);
    drawWall(pts,  hw-6*S, y, -hd,  hw, y, -hd, STONE2);
    drawWall(pts, -hw, y,  hd, -hw+6*S, y,  hd, STONE2);
    drawWall(pts,  hw-6*S, y,  hd,  hw, y,  hd, STONE2);
    drawWall(pts, -hw, y, -hd, -hw, y, -hd+4*S, STONE2);
    drawWall(pts, -hw, y,  hd-4*S, -hw, y, hd, STONE2);
    drawWall(pts,  hw, y, -hd,  hw, y, -hd+4*S, STONE2);
    drawWall(pts,  hw, y,  hd-4*S,  hw, y,  hd, STONE2);
  }
  // Main arch (N-S)
  for (let s = 0; s <= 10; s++) {
    const a = (s/10)*Math.PI;
    const ax = Math.cos(a)*archR, ay = h*0.4 + Math.sin(a)*archR;
    pts.push({ x:ax, y:ay, z:-hd-0.5*S, yaw:0, name: STONE2 });
    pts.push({ x:ax, y:ay, z: hd+0.5*S, yaw:180, name: STONE2 });
  }
  // Attic
  drawRect(pts, 0, h, 0, hw, hd, STONE2);
  return pts;
}

/**
 * 🐚 SYDNEY OPERA HOUSE
 */
export function gen_sydney_opera(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, p.scale ?? 1);

  // Podium
  for (let y = 0; y <= 6*S; y += 3*S) drawRect(pts, 0, y, 0, 50*S, 30*S, CNC8);

  // Shells — Concert Hall (left, x<0), 3 shells
  const shells = [
    { peakY:67,xSpan:25,zStart:-15,zEnd:18,zStep:5,xOff:-20 },
    { peakY:45,xSpan:18,zStart:-10,zEnd:14,zStep:5,xOff:-15 },
    { peakY:30,xSpan:12,zStart:-5, zEnd:9, zStep:4,xOff:-10 },
    // Opera Theatre (right)
    { peakY:59,xSpan:22,zStart:-12,zEnd:16,zStep:5,xOff:18 },
    { peakY:40,xSpan:16,zStart:-8, zEnd:11,zStep:4,xOff:14 },
  ];
  for (const sh of shells) {
    for (let z = sh.zStart*S; z <= sh.zEnd*S; z += sh.zStep*S) {
      for (let s = 0; s <= 12; s++) {
        const a  = (s/12)*Math.PI;
        const ax = (sh.xOff + Math.cos(a)*sh.xSpan)*S;
        const ay = 6*S + Math.sin(a)*sh.peakY*S;
        pts.push({ x:ax, y:ay, z, yaw:0, name: CNC8 });
      }
    }
  }
  return pts;
}

/**
 * 🗼 CN TOWER
 */
export function gen_cn_tower(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, p.scale ?? 1), h = 180 * S;

  // Tripod base
  for (let i = 0; i < 3; i++) {
    const a = (i/3)*Math.PI*2;
    for (let s = 0; s < 10; s++) {
      const t0 = s/10, t1 = (s+1)/10;
      const r0 = (20-t0*15.5)*S, r1 = (20-t1*15.5)*S;
      drawWall(pts, Math.cos(a)*r0, t0*50*S, Math.sin(a)*r0, Math.cos(a)*r1, t1*50*S, Math.sin(a)*r1, IND10);
    }
  }
  // Shaft
  for (let y = 50*S; y <= 135*S; y += 10*S) drawRing(pts, 0, y, 0, 4.5*S, IND10);
  // Saucer
  for (let dy = 0; dy <= 4; dy++) drawRing(pts, 0, (136+dy)*S, 0, (21-dy*3)*S, CNC8);
  drawDisk(pts, 0, 138*S, 0, 20*S, MILCNC);
  // Spire
  for (let y = 140*S; y <= h-4; y += 5*S) {
    const r = 3*S*(1-(y-140*S)/(40*S));
    if (r > 0.5) drawRing(pts, 0, y, 0, r, IND10);
  }
  return pts;
}

/**
 * 🗼 SPACE NEEDLE
 */
export function gen_space_needle(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, p.scale ?? 1), h = 184 * S;
  for (let i = 0; i < 3; i++) {
    const a = (i/3)*Math.PI*2;
    for (let s = 0; s < 10; s++) {
      const t0 = s/10, t1 = (s+1)/10;
      drawWall(pts, Math.cos(a)*(20-t0*15.5)*S, t0*50*S, Math.sin(a)*(20-t0*15.5)*S,
                    Math.cos(a)*(20-t1*15.5)*S, t1*50*S, Math.sin(a)*(20-t1*15.5)*S, IND10);
    }
  }
  for (let y = 50*S; y <= 135*S; y += 10*S) drawRing(pts, 0, y, 0, 4.5*S, IND10);
  for (let dy = 0; dy <= 5; dy++) drawRing(pts, 0, (136+dy)*S, 0, (21-dy*2.5)*S, CNC8);
  drawDisk(pts, 0, 138*S, 0, 20*S, MILCNC);
  for (let y = 142*S; y < h; y += 6*S) {
    const r = 3*S*(1-(y-142*S)/(42*S));
    if (r>0.5) drawRing(pts, 0, y, 0, r, IND10);
  }
  return pts;
}

/**
 * 🗼 LEANING TOWER OF PISA
 */
export function gen_pisa(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, p.scale ?? 1), h = 56 * S;
  const tilt = 4 * Math.PI/180;  // 4° lean, fixed
  const r = 7;
  for (let y = 0; y <= h; y += 3*S) {
    const lean = Math.sin(tilt) * y;
    drawRing(pts, lean, y, 0, r*S, STONE2);
    if (y % 6 < 1) {  // Gallery rings
      drawRing(pts, lean, y, 0, (r+1.5)*S, STONE2);
    }
  }
  // Bell chamber at top
  for (let y = h; y <= h+10*S; y += 2.5*S)
    drawRing(pts, Math.sin(tilt)*h, y, 0, 5*S, STONE2);
  return pts;
}


// ═══════════════════════════════════════════════════════════════════════════════
//  FANTASY & FICTION
// ═══════════════════════════════════════════════════════════════════════════════

export function gen_hogwarts(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, p.scale ?? 1);
  const mw = 30*S, md = 20*S;

  // Main block
  for (let y = 0; y <= 20*S; y += 8*S) drawRect(pts, 0, y, 0, mw, md, CASTLE);
  // Battlements
  for (let x = -mw; x <= mw; x += 8*S) {
    pts.push({ x, y:21*S, z:-md, yaw:0,   name:CASTLE });
    pts.push({ x, y:21*S, z: md, yaw:180, name:CASTLE });
  }
  for (let z = -md; z <= md; z += 8*S) {
    pts.push({ x:-mw, y:21*S, z, yaw:270, name:CASTLE });
    pts.push({ x: mw, y:21*S, z, yaw:90,  name:CASTLE });
  }

  // Great Hall protrusion
  const ghW=15*S, ghD=10*S, ghZ=md+ghD;
  for (let y = 0; y <= 30*S; y += 8*S) {
    drawWall(pts, -ghW, y, md, ghW, y, md, CASTLE);
    drawWall(pts,  ghW, y, md, ghW, y, ghZ, CASTLE);
    drawWall(pts,  ghW, y, ghZ, -ghW, y, ghZ, CASTLE);
    drawWall(pts, -ghW, y, ghZ, -ghW, y, md, CASTLE);
  }

  // Astronomy Tower (tallest)
  for (let y = 0; y <= 70*S; y += 8*S) drawRing(pts, mw, y, -md, 4*S, CASTLE);
  drawRing(pts, mw, 72*S, -md, 5*S, CASTLE);

  // 3 Corner towers
  const corners = [{ cx:-mw,cz:-md,h:50*S },{ cx:-mw,cz:md,h:40*S },{ cx:mw,cz:md,h:35*S }];
  for (const c of corners) {
    for (let y = 0; y <= c.h; y += 8*S) drawRing(pts, c.cx, y, c.cz, 4*S, CASTLE);
  }

  // Viaduct bridge
  const viaY = 5*S;
  drawWall(pts, mw, viaY, -2*S, mw+40*S, viaY, -2*S, CASTLE);
  drawWall(pts, mw, viaY,  2*S, mw+40*S, viaY,  2*S, CASTLE);
  return pts;
}

export function gen_minas_tirith(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, p.scale ?? 1), baseR = 120 * S, totalH = 100 * S, tiers = 7;
  const stepH = totalH / tiers;

  for (let i = 0; i < tiers; i++) {
    const r = baseR * (1 - i/(tiers+1)), y = i * stepH;
    const mat = i === tiers-1 ? IND10 : CNC8;
    const n = Math.max(32, Math.round(r * 1.2));
    for (let j = 0; j <= n; j++) {
      const a = (j/n)*Math.PI*1.6 - Math.PI*0.8;
      const x = r*Math.cos(a), z = r*Math.sin(a);
      const yaw = -a*180/Math.PI+90;
      pts.push({ x, y, z, yaw, name:mat });
      if (j%2===0) pts.push({ x, y:y+2.5, z, yaw, name:STONE2 });
    }
  }
  // White Tower spire
  for (let y = totalH; y <= totalH+30; y += 3) {
    const r = 6*(1-(y-totalH)/40);
    if (r > 0.5) drawRing(pts, 0, y, 0, r, CNC8);
  }
  return pts;
}

export function gen_helms_deep(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, p.scale ?? 1);
  const wallL = 80*S, wallH = 24*S;

  // Deeping Wall
  for (let y = 0; y <= wallH; y += 8*S) drawWall(pts, -wallL/2, y, 0, wallL/2, y, 0, STONE2);

  // Hornburg
  const hx = -wallL/2 - 20*S;
  for (let y = 0; y <= wallH+20*S; y += 8*S) drawRing(pts, hx, y, 0, 10*S, STONE2);

  // Towers along wall
  for (let tx = -wallL/2; tx <= wallL/2; tx += 25*S) {
    for (let y = 0; y <= wallH+8*S; y += 8*S) drawRing(pts, tx, y, 0, 4*S, STONE2);
  }
  // Culvert at base
  for (let z = -2*S; z <= 2*S; z += 2*S)
    drawWall(pts, -8*S, -4*S, z, 8*S, -4*S, z, STONE2);

  return pts;
}

export function gen_the_wall(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const L = p.length ?? 300, h = 60;
  for (let y = 0; y <= h; y += 8) drawWall(pts, -L/2, y, 0, L/2, y, 0, IND10);
  // Castles along top
  for (let x = -L/2 + 20; x <= L/2; x += 60)
    for (let y = h; y <= h+16; y += 8) drawRect(pts, x, y, 0, 6, 6, IND10);
  return pts;
}

export function gen_azkaban(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, p.scale ?? 1);
  const r = 30*S;
  // Triangular keep — 3 sides
  for (let i = 0; i < 3; i++) {
    const a1 = (i/3)*Math.PI*2, a2 = ((i+1)/3)*Math.PI*2;
    for (let y = 0; y <= 60*S; y += 8*S)
      drawWall(pts, r*Math.cos(a1), y, r*Math.sin(a1), r*Math.cos(a2), y, r*Math.sin(a2), IND10);
  }
  // Central spire
  for (let y = 60*S; y <= 100*S; y += 4*S)
    drawRing(pts, 0, y, 0, 4*S*(1-(y-60*S)/40*S*0.8), IND10);
  return pts;
}

export function gen_eye_of_sauron(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const r = p.r ?? 50, h = r * 1.8, tw = r * 0.56, er = r * 0.44;
  for (let y = 0; y <= h; y += 8) {
    const t = 1-(y/h);
    drawRing(pts, 0, y, 0, tw*(t*0.7+0.3), IND10);
    if (y > h*0.8) {
      for (let i = 0; i < 2; i++) {
        const a = i*Math.PI;
        pts.push({ x:(tw+5)*Math.cos(a), y, z:(tw+5)*Math.sin(a), yaw:-a*180/Math.PI+90, name:IND10 });
      }
    }
  }
  const eyeY = h+10;
  for (let r = 2; r <= er; r += 4) drawRing(pts, 0, eyeY, 0, r, IND10);
  return pts;
}

export function gen_fortress_solitude(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, p.scale ?? 1), r = 60 * S;
  for (let i = 0; i < 30; i++) {
    const cx = ((i*7919)%100/100 - 0.5)*r, cz = ((i*4001)%100/100 - 0.5)*r;
    const ch = 20 + (i*13)%80;
    for (let y = 0; y < ch; y += 4) {
      const taper = 1-(y/ch);
      const w = (4+(i%3)*0.7)*taper;
      for (let j = 0; j < 3; j++) {
        const a1 = j*Math.PI*2/3, a2 = (j+1)*Math.PI*2/3;
        drawWall(pts, cx+w*Math.cos(a1), y, cz+w*Math.sin(a1), cx+w*Math.cos(a2), Math.min(y+10,ch), cz+w*Math.sin(a2), STONE);
      }
    }
  }
  for (let y = 0; y < 120; y += 4) {
    const t = 1-(y/120)*0.9;
    drawRing(pts, 0, y, 0, 8*t, STONE2);
  }
  return pts;
}


// ═══════════════════════════════════════════════════════════════════════════════
//  STRUCTURES / MILITARY
// ═══════════════════════════════════════════════════════════════════════════════

export function gen_bunker(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, p.scale ?? 1), w = 40*S, d = 30*S, floors = 3;
  for (let f = 0; f < floors; f++) {
    const y = f * 5;
    drawRect(pts, 0, y, 0, w/2, d/2, IND10);
    // Internal cross walls
    drawWall(pts, -w/4, y, -d/2, -w/4, y, d/2, IND10);
    drawWall(pts,  w/4, y, -d/2,  w/4, y, d/2, IND10);
  }
  // Blast door
  drawWall(pts, -8, floors*5, 0, 8, floors*5, 0, IND10);
  return pts;
}

export function gen_pentagon(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const r = p.r ?? 100, rings = 5;
  for (let ri = 0; ri < rings; ri++) {
    const rr = r*(1-ri*0.15);
    for (let i = 0; i < 5; i++) {
      const a1 = (i/5)*Math.PI*2 - Math.PI/2, a2 = ((i+1)/5)*Math.PI*2 - Math.PI/2;
      for (let fl = 0; fl <= 3; fl++)
        drawWall(pts, rr*Math.cos(a1), fl*4, rr*Math.sin(a1), rr*Math.cos(a2), fl*4, rr*Math.sin(a2), IND10);
    }
  }
  return pts;
}

export function gen_star_fort(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const r = p.r ?? 60, pts2 = p.points ?? 5;
  const inner = r*0.6;
  for (let i = 0; i < pts2*2; i++) {
    const a1 = (i/(pts2*2))*Math.PI*2, a2 = ((i+1)/(pts2*2))*Math.PI*2;
    const r1 = i%2===0 ? r : inner, r2 = i%2===0 ? inner : r;
    for (let y = 0; y <= 8; y += 4)
      drawWall(pts, r1*Math.cos(a1), y, r1*Math.sin(a1), r2*Math.cos(a2), y, r2*Math.sin(a2), STONE2);
  }
  return pts;
}

export function gen_arena_fort(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const r = p.r ?? 50, h = 20;
  for (let y = 0; y <= h; y += 4) drawRing(pts, 0, y, 0, r, IND10);
  // Towers at 4 points
  for (let i = 0; i < 4; i++) {
    const a = (i/4)*Math.PI*2;
    for (let y = 0; y <= h+8; y += 4) drawRing(pts, r*Math.cos(a), y, r*Math.sin(a), 5, IND10);
  }
  return pts;
}

export function gen_gatehouse(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, p.scale ?? 1), w = 32*S, h = 22*S;

  // Two flanking towers
  for (let tx = -w/2; tx <= w/2; tx += w) {
    for (let y = 0; y <= h; y += 4*S) drawRing(pts, tx, y, 0, 6*S, STONE2);
    for (let cr = 0; cr < 8; cr++) {
      const a = (cr/8)*Math.PI*2, yaw = -a*180/Math.PI+90;
      pts.push({ x:tx+6.5*S*Math.cos(a), y:h+1.5*S, z:6.5*S*Math.sin(a), yaw, name:STONE2 });
    }
  }
  // Gate passage walls
  for (let y = 0; y <= h*0.7; y += 4*S) {
    drawWall(pts, -w/2+6*S, y, -4*S, -w/2+6*S, y, 4*S, STONE2);
    drawWall(pts,  w/2-6*S, y, -4*S,  w/2-6*S, y, 4*S, STONE2);
  }
  // Arch over gate
  for (let s = 0; s <= 8; s++) {
    const a = (s/8)*Math.PI;
    const ax = Math.cos(a)*8*S, ay = h*0.4 + Math.sin(a)*8*S;
    pts.push({ x:ax, y:ay, z:-4*S, yaw:0, name:STONE2 });
    pts.push({ x:ax, y:ay, z: 4*S, yaw:180, name:STONE2 });
  }
  return pts;
}

export function gen_normandy(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const spread = p.spread ?? 80;
  const bunkers = [
    { x:-spread/2, z:0 }, { x:0, z:0 }, { x:spread/2, z:0 },
    { x:-spread/3, z:20 }, { x:spread/3, z:20 },
  ];
  for (const b of bunkers) {
    drawRect(pts, b.x, 0, b.z, 8, 5, IND10);
    drawRect(pts, b.x, 4, b.z, 8, 5, IND10);
    // Gun slit
    pts.push({ x:b.x, y:2, z:b.z-5.5, yaw:0, name:IND10 });
  }
  // Barbed wire trenches
  for (let x = -spread/2; x <= spread/2; x += 4)
    pts.push({ x, y:0.2, z:-15, yaw:90, name:"staticobj_mil_hbarrier_big" });
  return pts;
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
  const L = p.length ?? 200, W = 30;
  // Hull deck
  for (let x = -L/2; x <= L/2; x += 6) {
    pts.push({ x, y:0, z:-W/2, yaw:0, name:"land_container_1bo" });
    pts.push({ x, y:0, z: W/2, yaw:0, name:"land_container_1bo" });
    pts.push({ x, y:0, z:0,    yaw:0, name:"land_container_1bo" });
  }
  // Island superstructure
  drawRect(pts, L/2-20, 2, W/2+2, 8, 6, IND10);
  for (let y = 2; y <= 18; y += 4) drawRect(pts, L/2-20, y, W/2+2, 4, 3, IND10);
  return pts;
}

export function gen_submarine(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const L = p.length ?? 80, S = L/80;
  for (let z = -L/2; z <= L/2; z += 4*S) {
    const t = Math.abs(z)/(L/2);
    const r = (5 - t*3)*S;
    if (r > 0.5) drawRing(pts, 0, 0, z, r, IND10);
  }
  // Conning tower
  for (let y = 5*S; y <= 14*S; y += 3*S) drawRect(pts, 0, y, -5*S, 3*S, 3*S, IND10);
  // Planes / fins
  for (const [z,y] of [[10*S,0],[-(L/2-8*S),2*S]]) {
    drawWall(pts, -8*S, y, z, 8*S, y, z, IND10);
  }
  return pts;
}

export function gen_oil_rig(_p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const levels = 5, legOff = 20;
  // 4 legs
  for (const [lx,lz] of [[-legOff,-legOff],[legOff,-legOff],[-legOff,legOff],[legOff,legOff]]) {
    for (let y = 0; y <= levels*8; y += 4) drawRing(pts, lx, y, lz, 3, IND10);
  }
  // Deck platforms
  for (let lv = 1; lv <= levels; lv++) {
    const y = lv*8;
    drawRect(pts, 0, y, 0, legOff+3, legOff+3, IND10);
  }
  // Drill tower
  for (let y = levels*8; y <= levels*8+30; y += 4) drawRing(pts, 0, y, 0, 3, IND10);
  return pts;
}

export function gen_pirate_ship(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const L = p.length ?? 50, W = 10;
  // Hull
  for (let z = -L/2; z <= L/2; z += 5) {
    const t = Math.abs(z)/(L/2)*0.4;
    const hw = (W/2)*(1-t*0.5);
    drawWall(pts, -hw, 0, z, hw, 0, z, STONE2);
    drawWall(pts, -hw, 4, z, hw, 4, z, STONE2);
  }
  // Masts
  for (const mx of [-L/4, 0, L/4]) drawWall(pts, mx, 4, 0, mx, 20, 0, STONE2);
  // Crow's nest
  drawRing(pts, 0, 18, 0, 3, STONE2);
  return pts;
}

export function gen_bridge_truss(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const L = p.length ?? 80, H = 12, W = 8;
  const deckZ = W/2;
  // Top chords
  drawWall(pts, -L/2, H, -deckZ,  L/2, H, -deckZ, IND10);
  drawWall(pts, -L/2, H,  deckZ,  L/2, H,  deckZ, IND10);
  // Bottom chords (deck)
  drawWall(pts, -L/2, 0, -deckZ, L/2, 0, -deckZ, IND10);
  drawWall(pts, -L/2, 0,  deckZ, L/2, 0,  deckZ, IND10);
  // Verticals + diagonals
  for (let x = -L/2; x <= L/2; x += 8) {
    for (const z of [-deckZ, deckZ]) {
      drawWall(pts, x, 0, z, x, H, z, IND10);
      if (x < L/2) drawWall(pts, x, 0, z, x+8, H, z, IND10);
    }
    drawWall(pts, x, 0, -deckZ, x, 0,  deckZ, IND10);
    drawWall(pts, x, H, -deckZ, x, H,  deckZ, IND10);
  }
  return pts;
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


