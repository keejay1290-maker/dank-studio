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
// GEOMETRIC
// ─────────────────────────────────────────────────────────────────────────────

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
  const tiers  = Math.min(p.tiers ?? 8, 8);
  const baseR  = p.r ?? 40;
  const tierD  = 5;        // 5m outward step per tier
  const stepH  = 9.758;    // IND10 physical height — never scale this
  const sweep  = Math.PI;  // true semicircle

  // ── Tiered seating banks: IND10 retaining walls, stepping up and outward ──
  for (let t = 0; t < tiers; t++) {
    const r = baseR + t * tierD;
    const y = t * stepH;
    // Number of panels proportional to arc length; IND10 is ~9m wide, use 9 as step
    const n = Math.max(6, Math.round(r * sweep / 9));
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * sweep - sweep / 2;
      pts.push({
        x: r * Math.cos(a),
        y,
        z: r * Math.sin(a),
        yaw: -a * 180 / Math.PI + 90,
        name: IND10,
      });
    }
  }

  // ── Outer colonnade facade: one IND10 ring at y=0 on outermost edge ──
  const outerR = baseR + tiers * tierD + 4;
  const facadeN = Math.max(8, Math.round(outerR * sweep / 9));
  for (let i = 0; i <= facadeN; i++) {
    const a = (i / facadeN) * sweep - sweep / 2;
    pts.push({
      x: outerR * Math.cos(a),
      y: 0,
      z: outerR * Math.sin(a),
      yaw: -a * 180 / Math.PI + 90,
      name: IND10,
    });
  }

  // ── Orchestra / stage floor: CNC8 rectangle at centre base ──
  const stageHW = Math.round(baseR * 0.45);
  const stageHD = Math.round(baseR * 0.25);
  drawRect(pts, 0, 0, 0, stageHW, stageHD, CNC8);

  // ── Skene building (stage backdrop): drawRect wall at rear of stage ──
  const skeneZ = stageHD + 4;
  for (let y = 0; y < 2 * 2.3; y += 2.3)
    drawRect(pts, 0, y, skeneZ, stageHW, 4, CNC8);

  return applyLimit(pts, p.n ?? 600);
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
