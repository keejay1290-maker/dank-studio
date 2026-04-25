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
// Cross-category call: gen_pyramid lives in monuments
import { gen_pyramid } from "./category_monuments";

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

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
  for (let y = 0; y <= h; y += 2.3) drawRing(pts, 0, y, 0, r, CNC8);
  return pts;
}

export function gen_cylinder(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const r = p.r ?? 10, h = p.h ?? 20;
  for (let y = 0; y <= h; y += 2.3) drawRing(pts, 0, y, 0, r, CNC8);
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
  for (let y = 0; y <= s; y += 2.3) drawRect(pts, 0, y, 0, s/2, s/2, CNC8);
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
  const PH         = 1.572;       // STONE2 height — physical constant, never * S
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
  // Each tier is a full IND10 arcade level (9.758m), not a thin 1.572m step,
  // giving the Colosseum its real 48m-tall silhouette.
  const TIER_H  = 9.758;           // IND10 height per arcade level
  const ROWS_PER_TIER = 6;         // 6 STONE2 rows = 9.432m per tier (flush coverage)
  for (let t = 0; t <= numTiers; t++) {
    const tA  = A - (numTiers - t) * tierDepth;
    const tB  = B - (numTiers - t) * tierDepth;
    const tY  = t * TIER_H;
    const nP  = Math.max(20, Math.floor(ellipseCirc(tA, tB) / PW));
    const sc  = (ellipseCirc(tA, tB) / nP) / PW;

    for (let row = 0; row < ROWS_PER_TIER; row++) {
      const ry = tY + row * PH;
      for (const rp of traceEllipse(tA, tB, nP)) {
        if (isEntrance(rp.x, rp.z)) continue;
        pts.push({ x: rp.x, y: ry, z: rp.z, yaw: +rp.yaw.toFixed(2), scale: +sc.toFixed(4), name: STONE2 });
      }
    }

    // Seating flat slab on top edge of each tier
    if (t < numTiers) {
      const flatA = tA + tierDepth / 2;
      const flatB = tB + tierDepth / 2;
      for (const rp of traceEllipse(flatA, flatB, nP)) {
        if (isEntrance(rp.x, rp.z)) continue;
        pts.push({
          x: rp.x, y: tY + TIER_H, z: rp.z,
          yaw: +rp.yaw.toFixed(2), pitch: -90,
          scale: +sc.toFixed(4), name: STONE2,
        });
      }
    }
  }

  // ── 2. OUTER FACADE — 3 arcade levels (real Colosseum has 3 arches + attic) ─
  const facadeA = A + tierDepth;
  const facadeB = B + tierDepth;
  const FACADE_H = (numTiers + 1) * TIER_H;   // rises one level above the cavea
  const facSc   = (ellipseCirc(facadeA, facadeB) / 80) / 9.408;
  for (let fy = 0; fy < FACADE_H; fy += PH) {
    for (const rp of traceEllipse(facadeA, facadeB, 80)) {
      if (isEntrance(rp.x, rp.z)) continue;
      pts.push({ x: rp.x, y: fy, z: rp.z, yaw: +rp.yaw.toFixed(2), scale: +facSc.toFixed(4), name: STONE2 });
    }
  }
  // Cornice / attic cap
  for (const rp of traceEllipse(facadeA, facadeB, 80)) {
    if (isEntrance(rp.x, rp.z)) continue;
    pts.push({ x: rp.x, y: FACADE_H, z: rp.z, yaw: +rp.yaw.toFixed(2), scale: +facSc.toFixed(4), pitch: -90, name: STONE2 });
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
      // Smooth taper with 3-period undulation for organic Gaudí silhouette
      const shrink = 1 - t * 0.85;
      const undulate = Math.sin(t * Math.PI * 3) * 0.05;
      const r = baseR * Math.max(0.15, shrink + undulate);
      drawRing(pts, cx, row * step, cz, r, STONE2);
    }
    // Pinnacle: Gaudí star-burst tip
    drawRing(pts, cx, h, cz, 0.6 * S, CNC4);
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

// ═══════════════════════════════════════════════════════════════════════════════
