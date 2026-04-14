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
import { drawWall, drawRing, drawRect, drawDisk, drawSphere, drawDome, drawSphereBudgeted } from "../draw";

export type GenParams = Record<string, number>;

// ─── Shorthand wall class constants ─────────────────────────────────────────
const CASTLE  = "staticobj_castle_wall3";      // 8m × 2m
const STONE   = "staticobj_wall_stone";        // 8m × 3.5m dark
const STONE2  = "staticobj_wall_stone2";       // 8m × 3.5m light
const CNC8    = "staticobj_wall_cncsmall_8";   // 8m × 3m concrete
const CNC4    = "staticobj_wall_cncsmall_4";   // 4m × 3m concrete
const MILCNC  = "staticobj_wall_milcnc_4";     // 4m × 3m metal
const IND10   = "staticobj_wall_indcnc_10";    // 8.75m × 10m industrial
const _TIN5   = "staticobj_wall_tin_5";        // 5m × 2m tin (available for use)
void _TIN5;


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
  const R     = p.r ?? 72;           // radius — 144m diameter sphere
  // IND10 = 8.75m × 10m tall. 5× coverage per panel vs CNC8 → fits in 1200.
  // Estimate: ~19.6·R² / (W·H) = 19.6·5184 / 87.5 ≈ 1161 panels ✓
  const panelW = 8.75;               // IND10 face width
  const panelH = 10.0;               // IND10 height

  // ── Materials ─────────────────────────────────────────────────────────────
  const MAT_MAIN  = IND10;           // main hull plates — 8.75×10 industrial
  const MAT_BAND  = "staticobj_wall_indcnc4_8"; // 8m × 8m darker band
  const MAT_TRENCH= CNC4;            // trench floor panels
  const MAT_RIM   = STONE;           // trench wall rim — dark grey

  // ── Equatorial trench ─────────────────────────────────────────────────────
  // Wide visible gap with a recessed floor ring
  const trenchPhi   = Math.PI / 2;
  const trenchHalf  = 0.13;          // ±7.5° either side — wide trench
  const trenchDepth = 0.16 * R;      // ~11.5m deep

  // Secondary sub-trenches either side of the main trench
  const subOff   = 0.28;             // 16° from equator
  const subHalf  = 0.04;
  const subDepth = 0.05 * R;

  // ── Superlaser dish ───────────────────────────────────────────────────────
  // Northern hemisphere, roughly 20° above equator (phi ≈ 70° from N pole)
  const dishPhi   = Math.PI * 0.39;  // ~70° from north pole = 20° above equator
  const dishTheta = Math.PI * 0.55;  // arbitrary longitude — "side on" view angle
  const dishCone  = 0.60;            // half-angle ~34° — large prominent bowl
  const dishDepth = 0.40 * R;        // very deep concave depression

  // Unit vector pointing at dish centre
  const dcx = Math.sin(dishPhi) * Math.cos(dishTheta);
  const dcy = Math.cos(dishPhi);
  const dcz = Math.sin(dishPhi) * Math.sin(dishTheta);

  // ── 8 tributary emitter channels radiating from dish centre ──────────────
  // Each is a narrow slot angled from centre to rim of dish
  function inTributary(nx: number, ny: number, nz: number, dishAngle: number): boolean {
    if (dishAngle > dishCone * 0.95) return false;
    // Project onto the dish plane
    const dot2 = nx * dcx + ny * dcy + nz * dcz;
    const px = nx - dot2 * dcx, py = ny - dot2 * dcy, pz = nz - dot2 * dcz;
    const pLen = Math.sqrt(px * px + py * py + pz * pz);
    if (pLen < 0.001) return false;
    // Angle of this panel in the dish plane (0–2π)
    // Build a local X/Y axis in the dish plane
    const upHint = Math.abs(dcy) < 0.99 ? [0, 1, 0] : [1, 0, 0];
    const ax = dcy * upHint[2] - dcz * upHint[1];
    const ay = dcz * upHint[0] - dcx * upHint[2];
    const az = dcx * upHint[1] - dcy * upHint[0];
    const aLen = Math.sqrt(ax * ax + ay * ay + az * az);
    const a = Math.atan2(
      (py * az - pz * ay) / aLen,
      (px * ax + py * ay + pz * az) / aLen
    );
    // 8 channels: slot width ≈ 0.15 rad
    const slotW = 0.15;
    for (let ch = 0; ch < 8; ch++) {
      const chAngle = (ch / 8) * Math.PI * 2;
      let diff = Math.abs(a - chAngle);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      if (diff < slotW) return true;
    }
    return false;
  }

  // ── Sphere scan ───────────────────────────────────────────────────────────
  // Ring step uses panel HEIGHT with 25% overlap. Panels are flat tangent
  // rectangles; the overlap ensures their top/bottom edges cross the sphere
  // surface INSIDE the adjacent ring's extent → zero visible gaps.
  const ringStep = panelH * 0.75;
  const nRings   = Math.max(10, Math.round((Math.PI * R) / ringStep));

  for (let i = 1; i < nRings; i++) {
    const phi  = (i / nRings) * Math.PI;
    const sinP = Math.sin(phi);
    const cosP = Math.cos(phi);
    const ringR = R * sinP;
    // Skip rings too small to fit 4 full-width panels (keeps scale ≥ 1)
    if (2 * Math.PI * ringR < panelW * 4) continue;

    // ── Skip main trench band (creates visible gap) ───────────────────────
    if (Math.abs(phi - trenchPhi) < trenchHalf) continue;

    const circ    = 2 * Math.PI * ringR;
    // floor() → scale always ≥ 1 → panels always overlap, never gap horizontally
    const nPanels = Math.max(4, Math.floor(circ / panelW));
    const arcStep = (2 * Math.PI) / nPanels;
    const scale   = (circ / nPanels) / panelW;

    // pitch: panel face points radially outward at this latitude
    const pitch = (phi - Math.PI / 2) * 180 / Math.PI;

    // Band material — alternating every 3 rings for surface grid look
    const bandMat = Math.floor(i / 3) % 2 === 0 ? MAT_MAIN : MAT_BAND;

    // Near trench rims: use darker rim material
    const nearTrench = Math.abs(phi - trenchPhi) < trenchHalf + 0.07;
    const rimMat = nearTrench ? MAT_RIM : bandMat;

    for (let j = 0; j < nPanels; j++) {
      const theta = (j + 0.5) * arcStep;
      const nx    = sinP * Math.cos(theta);
      const ny    = cosP;
      const nz    = sinP * Math.sin(theta);

      // Distance from dish centre
      const dot       = nx * dcx + ny * dcy + nz * dcz;
      const dishAngle = Math.acos(Math.max(-1, Math.min(1, dot)));

      let curR = R;
      let mat  = rimMat;

      // Sub-trenches (slight depression)
      if (Math.abs(phi - (trenchPhi - subOff)) < subHalf) {
        curR -= subDepth;
        mat = MAT_BAND;
      } else if (Math.abs(phi - (trenchPhi + subOff)) < subHalf) {
        curR -= subDepth;
        mat = MAT_BAND;
      }

      // Superlaser dish
      if (dishAngle < dishCone) {
        const t = dishAngle / dishCone;
        // Concave bowl: deep at centre, blends to surface at rim
        curR = R - dishDepth * Math.pow(1 - t, 1.6);

        // Tributary channels — exposed dark recessed slot
        if (inTributary(nx, ny, nz, dishAngle) && t > 0.08) {
          mat  = MAT_BAND;
          curR = R - dishDepth * 0.7 * (1 - t);
        } else if (t < 0.06) {
          mat = "barrel_red";   // central focus lens
        } else if (t < 0.18) {
          mat = "barrel_yellow"; // inner emitter ring
        } else if (t < 0.35) {
          mat = "staticobj_roadblock_cncblock"; // mid collector ring
        } else {
          mat = MILCNC;          // outer dish hull
        }
      }

      const x   = curR * sinP * Math.cos(theta);
      const y   = curR * cosP;
      const z   = curR * sinP * Math.sin(theta);
      const yaw = Math.atan2(x, z) * 180 / Math.PI;

      pts.push({
        x, y: R + y, z, yaw,
        pitch: +pitch.toFixed(2),
        scale: Math.abs(scale - 1) > 0.01 ? +scale.toFixed(4) : undefined,
        name:  mat,
      });
    }
  }

  // ── Polar caps — close the bare holes at top/bottom ─────────────────────
  pts.push({ x: 0, y: R + R,  z: 0, yaw: 0, pitch: -90, name: MAT_MAIN });
  pts.push({ x: 0, y: R - R,  z: 0, yaw: 0, pitch:  90, name: MAT_MAIN });

  // ── Trench floor — rings at reduced radius inside the trench gap ──────────
  const trenchFloorR = R - trenchDepth;
  const trenchRings  = 8;
  for (let ti = 0; ti < trenchRings; ti++) {
    const phi  = trenchPhi - trenchHalf * 0.85 + (ti / (trenchRings - 1)) * trenchHalf * 1.7;
    const sinP = Math.sin(phi);
    const circ    = 2 * Math.PI * trenchFloorR * sinP;
    const nPanels = Math.max(4, Math.floor(circ / 4.0));   // 4m panels for detail
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
        name: ti % 2 === 0 ? MAT_TRENCH : MAT_BAND,
      });
    }
  }

  return pts;
}

/**
 * 🤖 AT-AT WALKER — Imperial All Terrain Armoured Transport
 * Confirmed working — ported from old build.
 */
export function gen_atat_walker(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S  = p.scale ?? 1;
  const BW = 18 * S, BH = 8 * S, BD = 12 * S;  // body
  const LH = 14 * S;  // leg height
  const FW = 5 * S;   // foot width

  // ── BODY ──────────────────────────────────────────────────────────────────
  for (let y = LH; y <= LH + BH; y += 4 * S) {
    drawRect(pts, 0, y, 0, BW/2, BD/2, IND10);
  }
  // Neck
  for (let y = LH + BH; y <= LH + BH + 6 * S; y += 4 * S) {
    drawRect(pts, 0, y, -BD/3, 3 * S, 3 * S, IND10);
  }
  // Head
  const headY = LH + BH + 6 * S;
  drawRect(pts, 0, headY, -BD/3, 6*S, 5*S, IND10);
  drawRect(pts, 0, headY + 4*S, -BD/3, 6*S, 5*S, IND10);
  // Chin cannons
  for (let c = -1; c <= 1; c += 2) {
    drawWall(pts, c*4*S, headY+1*S, -BD/3-5*S, c*4*S, headY+1*S, -BD/3-12*S, IND10);
  }

  // ── 4 LEGS ────────────────────────────────────────────────────────────────
  const legPos = [
    { lx:  BW/2 - 2*S, lz:  BD/2 - 2*S },
    { lx: -BW/2 + 2*S, lz:  BD/2 - 2*S },
    { lx:  BW/2 - 2*S, lz: -BD/2 + 2*S },
    { lx: -BW/2 + 2*S, lz: -BD/2 + 2*S },
  ];
  for (const leg of legPos) {
    // Upper leg (slanted)
    const mx = leg.lx * 0.6, mz = leg.lz * 0.6;
    drawWall(pts, leg.lx, LH, leg.lz, mx, LH * 0.5, mz, IND10);
    // Lower leg (vertical)
    drawWall(pts, mx, LH * 0.5, mz, mx, 0, mz, IND10);
    // Foot platform
    drawRect(pts, mx, 1*S, mz, FW/2, FW/2, IND10);
  }
  return pts;
}

/**
 * 🛸 MILLENNIUM FALCON
 */
export function gen_millennium_falcon(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = p.scale ?? 1;
  const R = 14 * S;

  // Saucer hull — two rings at slight offset give the oval shape
  for (let y = 0; y <= 3 * S; y += 1.5 * S) {
    const r = R * (1 - (y / (3 * S)) * 0.3);
    drawRing(pts, 0, y, 0, r, CNC8);
  }
  // Cockpit arm
  drawWall(pts, 0, 1.5*S, -R, R, 1.5*S, -R - 6*S, CNC8);
  drawRing(pts, R, 1.5*S, -R - 4*S, 2.5*S, CNC8);
  // Engines (rear)
  for (let e = -1; e <= 1; e += 2) {
    drawWall(pts, e*4*S, 1*S, R, e*4*S, 1*S, R+5*S, IND10);
    drawRing(pts, e*4*S, 1*S, R+5*S, 2*S, IND10);
  }
  // Central turret
  drawRing(pts, 0, 5*S, 0, 3*S, MILCNC);
  return pts;
}

/**
 * 🛰️ STAR DESTROYER
 */
export function gen_star_destroyer(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const L = p.length ?? 160;
  const S = L / 160;

  // Wedge hull — triangular plan, builds from stern to bow
  for (let z = -L/2; z <= L/2; z += 8*S) {
    const t    = (z / L + 0.5);
    const half = (1 - t) * 40 * S + t * 2 * S;
    const y    = t * 12 * S; // bow rises
    drawWall(pts, -half, y, z, half, y, z, IND10);
  }
  // Bridge tower
  drawRect(pts, 0, 12*S, -20*S, 6*S, 6*S, IND10);
  drawRect(pts, 0, 16*S, -20*S, 4*S, 4*S, IND10);
  // Engine banks
  for (let e = -2; e <= 2; e++) {
    drawRing(pts, e*10*S, 2*S, L/2 - 4*S, 4*S, IND10);
  }
  return pts;
}

/**
 * ⭕ STARGATE PORTAL
 */
export function gen_stargate_portal(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const r = p.radius ?? 14;
  // Ring
  for (let dr = 0; dr < 2; dr++) {
    drawRing(pts, 0, 0, 0, r + dr, IND10);
    drawRing(pts, 0, 0.5, 0, r + dr, IND10);
  }
  // Chevrons (9 chevrons spaced around the ring)
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 - Math.PI / 2;
    const cx = (r + 3) * Math.cos(a), cz = (r + 3) * Math.sin(a);
    const yaw = -a * 180 / Math.PI + 90;
    pts.push({ x: cx, y: 0, z: cz, yaw, name: "barrel_red" });
    pts.push({ x: cx, y: 1.5, z: cz, yaw, name: "barrel_red" });
  }
  // Inner event horizon disk
  drawDisk(pts, 0, 0, 0, r - 1, CNC8);
  return pts;
}

/**
 * 💀 T-800 ENDOSKELETON
 */
export function gen_t800(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = p.scale ?? 1;
  // Torso
  drawRect(pts, 0, 8*S, 0, 3*S, 2*S, IND10);
  drawRect(pts, 0, 11*S, 0, 2.5*S, 1.5*S, IND10);
  // Head
  drawRect(pts, 0, 14*S, 0, 2*S, 1.5*S, IND10);
  drawRect(pts, 0, 16*S, 0, 1.5*S, 1*S, IND10);
  // Eyes
  pts.push({ x: -1*S, y: 15.5*S, z: -1.5*S, yaw: 0, name: "barrel_red" });
  pts.push({ x:  1*S, y: 15.5*S, z: -1.5*S, yaw: 0, name: "barrel_red" });
  // Arms
  for (let c = -1; c <= 1; c += 2) {
    drawWall(pts, c*3*S, 11*S, 0, c*6*S, 7*S, 0, IND10);
    drawWall(pts, c*6*S, 7*S, 0, c*5*S, 3*S, 1*S, IND10);
    drawRect(pts, c*5*S, 2*S, 1*S, 1*S, 0.5*S, MILCNC); // hand
  }
  // Legs
  for (let c = -1; c <= 1; c += 2) {
    drawWall(pts, c*2*S, 8*S, 0, c*2.5*S, 4*S, 0, IND10);
    drawWall(pts, c*2.5*S, 4*S, 0, c*2*S, 0, 0.5*S, IND10);
    drawRect(pts, c*2*S, 0, 0.5*S, 1.5*S, 1*S, IND10); // foot
  }
  return pts;
}

/**
 * 🚛 OPTIMUS PRIME
 */
export function gen_optimus(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = p.scale ?? 1;
  // Cab / Torso
  drawRect(pts, 0, 8*S, 0, 4*S, 3*S, IND10);
  drawRect(pts, 0, 12*S, 0, 3*S, 2.5*S, IND10);
  // Head
  drawRect(pts, 0, 16*S, 0, 2.5*S, 2*S, IND10);
  pts.push({ x: 0, y: 18*S, z: 0, yaw: 0, name: "barrel_red" }); // face plate
  // Shoulder plates
  for (let c = -1; c <= 1; c += 2) {
    drawWall(pts, c*4*S, 12*S, 0, c*7*S, 12*S, 0, IND10);
    drawRect(pts, c*6.5*S, 10*S, 0, 2*S, 1.5*S, IND10); // upper arm
    drawRect(pts, c*6*S, 6*S, 0, 1.5*S, 1.5*S, IND10);  // lower arm
    pts.push({ x: c*6*S, y: 4*S, z: 0, yaw: c < 0 ? 270 : 90, name: IND10 }); // fist
  }
  // Trailer hitch / legs
  for (let c = -1; c <= 1; c += 2) {
    drawWall(pts, c*2*S, 8*S, 0, c*2*S, 4*S, 0, IND10);
    drawWall(pts, c*2*S, 4*S, 0, c*2*S, 0, 0, IND10);
    drawRect(pts, c*2*S, 0, 1*S, 2*S, 1.5*S, IND10);
  }
  // Exhaust stacks
  for (let c = -1; c <= 1; c += 2) {
    drawWall(pts, c*3.5*S, 8*S, -2*S, c*3.5*S, 16*S, -2*S, CNC4);
  }
  return pts;
}

/**
 * 🕳️ BLACK HOLE EVENT HORIZON
 */
export function gen_black_hole(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const r    = p.radius ?? 30;
  const arcs = p.arcs   ?? 8;
  for (let a = 0; a < arcs; a++) {
    const startAngle = (a / arcs) * Math.PI * 2;
    for (let i = 0; i < 50; i++) {
      const t     = i / 50;
      const angle = startAngle + t * Math.PI * 1.5;
      const dist  = r * (0.6 + t * 0.4);
      const y     = Math.sin(t * Math.PI * 2) * 2;
      pts.push({ x: dist*Math.cos(angle), y, z: dist*Math.sin(angle), yaw: -angle*180/Math.PI+90, name: IND10 });
    }
  }
  for (let y = -2; y <= 2; y += 1) drawRing(pts, 0, y, 0, r*0.4, IND10);
  return pts;
}

/**
 * 🅰️ TONY STARK TOWER
 */
export function gen_stark_tower(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const floors = p.floors ?? 40;
  const fh     = 3.5;
  const W = 20, D = 14, sp = 3.5;

  for (let f = 0; f < floors; f++) {
    const y     = f * fh;
    const slant = f > 5 ? (f - 5) * 0.25 : 0;
    const fx    = slant;
    for (let x = -W/2; x <= W/2; x += sp) {
      pts.push({ x: fx+x, y, z: -D/2, yaw: 0, name: CNC8 });
      pts.push({ x: fx+x, y, z:  D/2, yaw: 0, name: CNC8 });
    }
    for (let z = -D/2; z <= D/2; z += sp) {
      pts.push({ x: fx-W/2, y, z, yaw: 90, name: CNC8 });
      pts.push({ x: fx+W/2, y, z, yaw: 90, name: CNC8 });
    }
    // Landing pad at floor 35
    if (f === 35) {
      const padR = 12, px = fx + W/2 + padR - 2;
      drawRing(pts, px, y, 0, padR, MILCNC);
    }
  }
  return pts;
}

/**
 * 🏙️ CYBERPUNK NEXUS TOWER
 */
export function gen_cyberpunk(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const h = p.height ?? 80, w = p.width ?? 20;
  for (let y = 0; y <= h; y += 4) {
    drawRect(pts, 0, y, 0, w/2, w/2, y % 8 === 0 ? IND10 : CNC8);
    if (y % 16 === 0) drawRing(pts, 0, y, 0, w/2 + 4, MILCNC);
  }
  return pts;
}

/**
 * 🪐 SATURN SPACE STATION
 */
export function gen_saturn(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const r = p.radius ?? 35;
  // Core sphere
  drawSphere(pts, 0, r, 0, r * 0.5, IND10);
  // Rings at different heights
  for (let dy = -r*0.1; dy <= r*0.1; dy += 4) {
    const rr = r * (1.8 + Math.abs(dy) * 0.01);
    drawRing(pts, 0, r + dy, 0, rr, CNC8);
    drawRing(pts, 0, r + dy, 0, rr * 0.7, MILCNC);
  }
  return pts;
}

export function gen_xwing(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, (p.length ?? 13) / 13);
  // Fuselage
  for (let z = -6*S; z <= 6*S; z += 2*S) drawRing(pts, 0, 0, z, 1.2*S, CNC8);
  drawRing(pts, 0, 0, -6*S, 1.5*S, CNC8);
  drawRing(pts, 0, 0.4*S, -7*S, 1.0*S, CNC8);
  pts.push({ x:0, y:0.2*S, z:-8*S, yaw:0, name: CNC8 });
  // Cockpit
  drawRing(pts, 0, 1.2*S, -4*S, 1.0*S, CNC8);
  drawRing(pts, 0, 1.8*S, -4*S, 0.5*S, CNC8);
  pts.push({ x:0, y:2.2*S, z:-4*S, yaw:0, name: CNC8 });
  // S-foils
  const wings = [
    { ax:1.2,ay:1.2,tx:5.5,ty:3.0 }, { ax:-1.2,ay:1.2,tx:-5.5,ty:3.0 },
    { ax:1.2,ay:-1.2,tx:5.5,ty:-3.0 }, { ax:-1.2,ay:-1.2,tx:-5.5,ty:-3.0 },
  ];
  for (const w of wings) {
    drawWall(pts, w.ax*S, w.ay*S, 2*S, w.tx*S, w.ty*S, 2*S, CNC8);
    drawWall(pts, w.ax*S, w.ay*S, 5*S, w.tx*S, w.ty*S, 5*S, CNC8);
  }
  // Nacelles
  for (const n of [{ cx:5.5,cy:3.0 },{cx:-5.5,cy:3.0},{cx:5.5,cy:-3.0},{cx:-5.5,cy:-3.0}]) {
    for (let z = 0; z <= 6*S; z += 2*S) drawRing(pts, n.cx*S, n.cy*S, z, 0.9*S, CNC8);
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
  const h = p.height ?? 150;
  const S = h / 150;

  // 4 legs — each a tapered curve from wide base to central shaft
  const legSegs = 20;
  const legAngs = [0, Math.PI/2, Math.PI, 3*Math.PI/2];
  for (const baseAngle of legAngs) {
    for (let s = 0; s < legSegs; s++) {
      const t0 = s / legSegs, t1 = (s+1) / legSegs;
      // base radius shrinks from 40m at ground to 3m at 50m
      const r0 = (40 - t0*37) * S, r1 = (40 - t1*37) * S;
      const y0 = t0 * 50 * S,      y1 = t1 * 50 * S;
      drawWall(pts,
        r0*Math.cos(baseAngle), y0, r0*Math.sin(baseAngle),
        r1*Math.cos(baseAngle), y1, r1*Math.sin(baseAngle),
        IND10,
      );
    }
    // Cross-bracing — rings at 15m, 30m, 50m
    [15, 30, 50].forEach(hy => drawRing(pts, 0, hy*S, 0, (40 - hy*37/50)*S+1, IND10));
  }
  // Shaft 50–115m
  for (let y = 50*S; y <= 115*S; y += 8*S) drawRing(pts, 0, y, 0, 3*S, IND10);
  // First platform at 57m
  drawDisk(pts, 0, 57*S, 0, 8*S, IND10);
  // Second platform at 115m
  drawDisk(pts, 0, 115*S, 0, 5*S, IND10);
  // Spire 115–150m
  for (let y = 115*S; y <= 148*S; y += 6*S) {
    const r = 3*S * (1 - (y - 115*S)/(33*S));
    if (r > 0.5*S) drawRing(pts, 0, y, 0, Math.max(0.5*S, r), IND10);
  }
  pts.push({ x:0, y:150*S, z:0, yaw:0, name:IND10 });
  return pts;
}

/**
 * 🕌 TAJ MAHAL
 */
export function gen_taj_mahal(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, (p.width ?? 80) / 80);
  const W = 30*S, D = 26*S, BH = 10*S;

  // Main plinth
  for (let y = 0; y <= BH; y += 4*S) drawRect(pts, 0, y, 0, W, D, STONE2);

  // Central dome
  const domeR = 10*S;
  for (let dy = 0; dy <= domeR; dy += 2*S) {
    const r = Math.sqrt(Math.max(0, domeR*domeR - dy*dy));
    if (r > 0.5) drawRing(pts, 0, BH + domeR + dy, 0, r, STONE2);
  }
  pts.push({ x:0, y: BH + 2*domeR + 4*S, z:0, name: STONE2 });

  // 4 minarets at corners
  const mOff = W + 2*S;
  const mPos = [{ x:mOff,z:mOff },{ x:-mOff,z:mOff },{ x:mOff,z:-mOff },{ x:-mOff,z:-mOff }];
  for (const m of mPos) {
    for (let y = 0; y <= BH + domeR*1.5; y += 4*S) drawRing(pts, m.x, y, m.z, 2.5*S, STONE2);
    // minaret dome
    for (let dy = 0; dy <= 3*S; dy += 1.5*S) {
      const r = Math.sqrt(Math.max(0, 9*S*S - dy*dy));
      if (r > 0.2) drawRing(pts, m.x, BH+domeR*1.5+dy, m.z, r, STONE2);
    }
  }

  // Arched entrance (south facade)
  const archR = 5*S;
  for (let s = 0; s <= 8; s++) {
    const a  = (s/8) * Math.PI;
    pts.push({ x: Math.cos(a)*archR, y: BH + Math.sin(a)*archR*1.2, z: -D-0.5*S, yaw: 0, name: STONE2 });
  }
  return pts;
}

/**
 * 🏛️ COLOSSEUM
 */
export function gen_colosseum(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const outerR = p.width   ?? 100;
  const tiers  = p.tiers   ?? 4;
  const tierH  = p.tierH   ?? 8;

  for (let t = 0; t < tiers; t++) {
    const r = outerR - t * 10;
    const y = t * tierH;
    drawRing(pts, 0, y, 0, r, STONE2);
    drawRing(pts, 0, y + tierH * 0.5, 0, r, STONE2);
    drawRing(pts, 0, y + tierH, 0, r, STONE);
    // Arch rows — radial spokes
    const nArches = Math.round(2 * Math.PI * r / 8);
    for (let i = 0; i < nArches; i += 3) {
      const a = (i / nArches) * Math.PI * 2;
      drawWall(pts, r*Math.cos(a), y, r*Math.sin(a), (r-8)*Math.cos(a), y, (r-8)*Math.sin(a), STONE2);
    }
  }
  // Arena floor
  drawDisk(pts, 0, 0.5, 0, outerR - tiers*10, STONE);
  return pts;
}

/**
 * 📐 GREAT PYRAMID OF GIZA
 */
export function gen_pyramid(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const base = p.width  ?? 120;
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
  const r  = p.radius ?? 25;
  const n  = p.stones ?? 30;
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
  const targetH = p.height ?? 96;
  const S  = targetH / 96;
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
  const S = Math.max(0.5, (p.height ?? 93) / 93);

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
  const S = Math.max(0.5, (p.height ?? 38) / 38);
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
  const S = Math.max(0.5, (p.width ?? 70) / 70);
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
  const S  = Math.max(0.5, (p.height ?? 50) / 50);
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
  const S = Math.max(0.5, (p.width ?? 120) / 120);

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
  const h = p.height ?? 180, S = h / 180;

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
  const h = p.height ?? 184, S = h/184;
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
  const h = p.height ?? 56, tilt = (p.pitch ?? 4) * Math.PI/180;
  const r = 7, S = h/56;
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
  const S = Math.max(0.5, (p.width ?? 150) / 150);
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
  const baseR = p.width ?? 120, totalH = p.height ?? 100, tiers = 7;
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
  const S = Math.max(0.5, (p.width ?? 200) / 200);
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
  const L = p.length ?? 300, h = p.height ?? 60, S = h/60;
  for (let y = 0; y <= h; y += 8*S) drawWall(pts, -L/2, y, 0, L/2, y, 0, IND10);
  // Castles along top
  for (let x = -L/2 + 20; x <= L/2; x += 60)
    for (let y = h; y <= h+16*S; y += 8*S) drawRect(pts, x, y, 0, 6*S, 6*S, IND10);
  return pts;
}

export function gen_azkaban(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, (p.width ?? 80)/80);
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
  const h = p.height ?? 90, tw = p.towerWidth ?? 28, er = p.eyeRadius ?? 22;
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
  const r = p.width ?? 60;
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
  const w = p.width ?? 40, d = p.depth ?? 30, floors = p.floors ?? 3;
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
  const r = p.width ?? 100, rings = 5;
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
  const r = p.radius ?? 60, pts2 = p.points ?? 5;
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
  const r = p.radius ?? 50, h = p.height ?? 20;
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
  const w = p.width ?? 32, h = p.height ?? 22;
  const S = h/22;

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
  const L = p.length ?? 80, H = p.height ?? 12, W = p.width ?? 8;
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
  const r = p.radius ?? 30, h = p.height ?? 8, count = p.stoneCount ?? 24;
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
  const h = p.height ?? 60, r = p.radius ?? 8, turns = p.turns ?? 4;
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
  const tiers = p.tiers ?? 8, baseR = p.radius ?? 40, tierD = p.tierDepth ?? 4, stepH = p.stepHeight ?? 1.5;
  const sweepAngle = (p.sweepAngle ?? 180) * Math.PI / 180;
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
  const L = p.length ?? 120, h = p.height ?? 20, archSpan = 12;
  const nArches = Math.round(L / archSpan);

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
  const nArches = p.arches ?? 5, aw = p.archWidth ?? 8, ah = p.archHeight ?? 12, pillarH = ah * 0.6;
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
  const r = p.radius ?? 20;
  if (p.wallClass) {
    drawSphere(pts, 0, r, 0, r, String(p.wallClass));
  } else {
    drawSphereBudgeted(pts, 0, r, 0, r, 1150);
  }
  return pts;
}

export function gen_ring(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const r = p.radius ?? 20, h = p.height ?? 8;
  for (let y = 0; y <= h; y += 4) drawRing(pts, 0, y, 0, r, CNC8);
  return pts;
}

export function gen_cylinder(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const r = p.radius ?? 10, h = p.height ?? 20;
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
  const R = p.radius ?? 20, r = p.tubeRadius ?? 5;
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
  const r = p.radius ?? 20;
  const mat = p.wallClass ? String(p.wallClass) : CNC8;
  drawDome(pts, 0, 0, 0, r, mat);
  // Base disk floor
  drawDisk(pts, 0, 0, 0, r, mat);
  return pts;
}

export function gen_spiral(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const h = p.height ?? 40, r = p.radius ?? 8, turns = p.turns ?? 3;
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
  const r = p.radius ?? 20, angle = (p.angle ?? 180)*Math.PI/180, h = p.height ?? 8;
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
