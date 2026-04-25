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
// CONTAINERS
// ─────────────────────────────────────────────────────────────────────────────

//  CONTAINER BUILDS — native shipping-container architecture
//  Dims (P3D verified): w=2.702 h=2.782 d=10.000 — long axis Z at yaw=0
// ═══════════════════════════════════════════════════════════════════════════════

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
  const risePerStep = _CH;  // one full container height per step — clean stacking
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
  const armLen = Math.max(3, Math.round(S * 5));
  const coreSide = Math.max(2, Math.round(S * 3));  // containers per core side
  const coreLayers = Math.max(2, Math.round(S * 3));
  const pts: Point3D[] = [];

  // Hollow square core — bigger than before, scales with S
  const coreHalf = coreSide * _CD / 2;  // core extends ±coreHalf in X and Z
  for (let layer = 0; layer < coreLayers; layer++) {
    const y = layer * _CH;
    // N/S faces (running X, yaw=90)
    for (let i = 0; i < coreSide; i++) {
      const x = -coreHalf + i * _CD + _CD/2;
      pts.push({ x, y, z: -coreHalf, yaw: 90, scale:1, name: _cpick(i + layer)     });
      pts.push({ x, y, z:  coreHalf, yaw: 90, scale:1, name: _cpick(i + layer + 2) });
    }
    // E/W faces (running Z, yaw=0)
    for (let i = 0; i < coreSide; i++) {
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

// ── Container Fortress ────────────────────────────────────────────────────────
// Square perimeter walls of containers stacked flush, corner watchtowers,
// internal courtyard. Yaw param rotates the entire fortress.
export function gen_container_fortress(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const tiers  = Math.max(2, Math.round(p.tiers ?? 4));
  const sideC  = Math.max(3, Math.round(p.side ?? 5));  // containers per wall side
  const side   = sideC * _CD;
  const CW     = 2.702;  // container width (flush side-by-side)

  // Perimeter walls — N/S faces run along X (yaw=90), E/W run along Z (yaw=0)
  for (let t = 0; t < tiers; t++) {
    const y = t * _CH;
    for (let i = 0; i < sideC; i++) {
      const x = i * _CD + _CD / 2;
      pts.push({ x, y, z:    0, yaw:  90, name: _cpick(i+t),   scale: 1 }); // S face
      pts.push({ x, y, z: side, yaw:  90, name: _cpick(i+t+2), scale: 1 }); // N face
      pts.push({ x:    0, y, z: x, yaw: 0, name: _cpick(i+t+4), scale: 1 }); // W face
      pts.push({ x: side, y, z: x, yaw: 0, name: _cpick(i+t+6), scale: 1 }); // E face
    }
    // Corner watchtowers — extra container stack slightly inset
    for (const [cx, cz] of [[0,0],[side,0],[0,side],[side,side]] as [number,number][]) {
      pts.push({ x: cx, y, z: cz, yaw: 45, name: "land_container_1bo", scale: 1 });
    }
  }

  // Raised corner towers — 2 extra tiers above wall
  for (let t = tiers; t < tiers + 2; t++) {
    const y = t * _CH;
    for (const [cx, cz] of [[0,0],[side,0],[0,side],[side,side]] as [number,number][]) {
      pts.push({ x: cx, y, z: cz, yaw: 45, name: "land_container_1bo", scale: 1 });
      pts.push({ x: cx - CW/2, y, z: cz, yaw: 90, name: "land_container_1bo", scale: 1 });
    }
  }

  // Roof edge on perimeter wall
  for (let i = 0; i < sideC; i++) {
    const x = i * _CD + _CD / 2;
    pts.push({ x, y: tiers * _CH, z:    0, pitch: -90, yaw: 0, name: "land_container_1bo", scale: 1 });
    pts.push({ x, y: tiers * _CH, z: side, pitch: -90, yaw: 0, name: "land_container_1bo", scale: 1 });
  }

  // ── Decorative military dressing ─────────────────────────────────────────
  // Hbarrier sandbag wall outside the main gate (south face)
  const gateX = side / 2;
  for (let dx = -12; dx <= 12; dx += 6) {
    pts.push({ x: gateX + dx, y: 0, z: -8, yaw: 0, name: "staticobj_mil_hbarrier_6m", scale: 1 });
  }
  // Courtyard fuel drums
  const cyX = side / 2, cyZ = side / 2;
  for (const [dx, dz] of [[6, -2], [6, 2], [8, 0], [-8, 4], [-8, -4]] as [number, number][]) {
    pts.push({ x: cyX + dx, y: 0, z: cyZ + dz, yaw: 0, name: "barrel_red", scale: 1 });
  }
  // Flagpole on south gate rampart
  pts.push({ x: gateX, y: tiers * _CH, z: 2, yaw: 0, name: "staticobj_misc_flagpole", scale: 1 });

  return applyLimit(pts, 1100);
}

// ── Container Starport ────────────────────────────────────────────────────────
// Circular landing pad ringed by containers, control tower, rotating radar dish.
export function gen_container_starport(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const r      = Math.max(20, p.r ?? 40);
  const tiers  = Math.max(1, Math.round(p.tiers ?? 3));

  // Landing pad — flat IND10 tiles at y=0
  for (let x = -r + 5; x <= r - 5; x += 9.012)
    for (let z = -r + 5; z <= r - 5; z += 9.758)
      if (x*x + z*z < r*r * 0.7)
        pts.push({ x, y: 0, z, pitch: -90, yaw: 0, name: IND10 });

  // Outer ring — flush container ring (step = container width 2.702m laterally, depth 10m radially)
  const nRing = Math.round(2 * Math.PI * r / 2.702);
  for (let t = 0; t < tiers; t++) {
    const y = t * _CH;
    for (let i = 0; i < nRing; i++) {
      const a = (i / nRing) * Math.PI * 2;
      // yaw so long axis (10m) faces radially outward
      const yaw = 90 - a * 180 / Math.PI;
      pts.push({ x: Math.cos(a)*r, y, z: Math.sin(a)*r, yaw, name: _cpick(i+t), scale: 1 });
    }
  }

  // Control tower — stacked containers at edge
  const twrX = r * 0.6, twrZ = 0;
  for (let t = 0; t < tiers + 4; t++)
    pts.push({ x: twrX, y: t * _CH, z: twrZ, yaw: 0, name: "land_container_1bo", scale: 1 });

  // Radar dish on top of tower
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    pts.push({ x: twrX + Math.cos(a) * 4, y: (tiers + 4) * _CH, z: twrZ + Math.sin(a) * 4,
      yaw: 90 + a * 180 / Math.PI, pitch: -45, name: "land_container_1bo", scale: 0.3 });
  }

  // Refuelling bay — row of containers on opposite side
  for (let i = 0; i < 4; i++)
    pts.push({ x: -r * 0.6 + i * 2.702, y: 0, z: 5, yaw: 90, name: _cpick(i), scale: 1 });

  return applyLimit(pts, 1100);
}

// ── Container Shantytown ──────────────────────────────────────────────────────
// Irregular stacked container settlement — ramshackle multi-level stack with
// alleyways, overhanging upper floors, and barrel accent details.
export function gen_container_shantytown(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const density = Math.max(4, Math.round(p.density ?? 6));  // grid density
  const maxH    = Math.max(2, Math.round(p.height ?? 3));   // max stack height

  // Pseudo-random placement using a deterministic seed pattern
  const placements: { x: number; z: number; h: number; yaw: number }[] = [];
  let seed = 7;
  const rand = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return Math.abs(seed) / 0xffffffff; };

  const spacing = _CD + 1;  // tight grid — alleyways created by drop-outs only
  const offset  = -(density - 1) * spacing / 2;  // centre the grid
  for (let gx = 0; gx < density; gx++) {
    for (let gz = 0; gz < density; gz++) {
      if (rand() < 0.15) continue;  // 15% alleyway gaps
      const jx = (rand() - 0.5) * 1.5;
      const jz = (rand() - 0.5) * 1.5;
      const h  = 1 + Math.floor(rand() * maxH);
      const yaw = Math.round(rand() * 3) * 90;  // always 0/90/180/270 — grid aligned
      placements.push({ x: offset + gx * spacing + jx, z: offset + gz * spacing + jz, h, yaw });
    }
  }

  // Stack containers flush using _CH step
  for (const pl of placements) {
    for (let t = 0; t < pl.h; t++) {
      pts.push({ x: pl.x, y: t * _CH, z: pl.z, yaw: pl.yaw, name: _cpick(pl.h + t), scale: 1 });
    }
    // Occasional overhang on upper floors
    if (pl.h >= 2 && Math.abs(pl.x + pl.z) % 3 < 1) {
      pts.push({ x: pl.x + (pl.yaw === 0 ? _CD * 0.4 : 0), y: (pl.h - 1) * _CH,
        z: pl.z + (pl.yaw === 90 ? _CD * 0.4 : 0), yaw: pl.yaw, name: _cpick(pl.h+2), scale: 1 });
    }
    // Barrel details on ground level
    if (rand() < 0.3)
      pts.push({ x: pl.x + 4, y: 0, z: pl.z, name: "barrel_blue", yaw: 0, scale: 1 });
  }

  return applyLimit(pts, 1100);
}

// ── Container Barracks ────────────────────────────────────────────────────────
// Long rectangular military barracks: parallel rows of containers with a central
// alley, 2 tiers tall, rooftop deck with sandbags + spotlights.
export function gen_container_barracks(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const length = Math.max(3, Math.round(p.length ?? 6));   // containers per row
  const tiers  = Math.max(1, Math.round(p.tiers ?? 2));
  const _CW    = 2.702;
  const alley  = _CW * 1.5;                                // central walkway

  // Two parallel rows of long-axis containers (yaw=90 → 10m runs along X)
  for (let row = 0; row < 2; row++) {
    const z = row === 0 ? -_CW/2 - alley/2 : _CW/2 + alley/2;
    for (let t = 0; t < tiers; t++) {
      const y = t * _CH;
      for (let i = 0; i < length; i++) {
        pts.push({ x: i * _CD + _CD/2, y, z, yaw: 90, scale: 1, name: _cpick(i + t + row*3) });
      }
    }
  }

  // End caps at each row end (close the building)
  for (let t = 0; t < tiers; t++) {
    const y = t * _CH;
    for (const xEnd of [0, length * _CD]) {
      pts.push({ x: xEnd, y, z: 0, yaw: 0, scale: 1, name: _cpick(t + 5) });
    }
  }

  // Rooftop sandbag wall (no spotlight clutter — those render at 2m fallback
  // and dominate the silhouette out of proportion with the containers below)
  const roofY = tiers * _CH;
  for (let i = 0; i < length; i++) {
    const x = i * _CD + _CD/2;
    pts.push({ x, y: roofY, z: -_CW - alley/2, yaw: 0, name: "staticobj_mil_hbarrier_6m", scale: 1 });
    pts.push({ x, y: roofY, z:  _CW + alley/2, yaw: 0, name: "staticobj_mil_hbarrier_6m", scale: 1 });
  }

  // Flagpole at front-center
  pts.push({ x: length * _CD / 2, y: roofY, z: 0, yaw: 0, name: "staticobj_misc_flagpole", scale: 1 });

  return applyLimit(pts, 1100);
}

// ── Container Arena ───────────────────────────────────────────────────────────
// Circular fighting arena: ring of containers forming wall, 2 tiers of stadium
// seating (containers tipped on edge), central pit with barrels + flagpole.
export function gen_container_arena(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const r     = Math.max(15, p.r ?? 25);
  const tiers = Math.max(2, Math.round(p.tiers ?? 3));

  // Outer wall — flush container ring (long axis 10m radial → step lateral 2.702m)
  const nRing = Math.round(2 * Math.PI * r / 2.702);
  for (let t = 0; t < tiers; t++) {
    const y = t * _CH;
    for (let i = 0; i < nRing; i++) {
      const a   = (i / nRing) * Math.PI * 2;
      const yaw = 90 - a * 180 / Math.PI;
      // Gate gap on south face (i within 2 indices of bottom-center)
      const isGate = t < 2 && Math.abs(i - Math.round(nRing * 0.75)) < 2;
      if (!isGate) pts.push({ x: Math.cos(a)*r, y, z: Math.sin(a)*r, yaw, name: _cpick(i+t), scale: 1 });
    }
  }

  // Crenellated rim on top tier (alternating containers)
  for (let i = 0; i < nRing; i += 2) {
    const a   = ((i + 0.5) / nRing) * Math.PI * 2;
    const yaw = 90 - a * 180 / Math.PI;
    pts.push({ x: Math.cos(a)*r, y: tiers * _CH, z: Math.sin(a)*r, yaw, name: "land_container_1bo", scale: 1 });
  }

  // Centre pit — barrels + flag at exact origin
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    pts.push({ x: Math.cos(a) * 4, y: 0, z: Math.sin(a) * 4, yaw: 0, name: i % 2 === 0 ? "barrel_red" : "barrel_blue", scale: 1 });
  }
  pts.push({ x: 0, y: 0, z: 0, yaw: 0, name: "staticobj_misc_flagpole", scale: 1 });

  return applyLimit(pts, 1100);
}

// ── Container Bunker ──────────────────────────────────────────────────────────
// Low wide blast bunker: 2-tier double-thick walls in U-shape, IND10 roof slabs,
// hbarrier blast wall at entrance, ventilation barrels.
export function gen_container_bunker(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const w     = Math.max(3, Math.round(p.width ?? 4));   // containers wide (X)
  const d     = Math.max(3, Math.round(p.depth ?? 4));   // containers deep (Z)
  const tiers = Math.max(1, Math.round(p.tiers ?? 2));
  const _CW   = 2.702;
  const W     = w * _CD;
  const D     = d * _CD;

  // Outer perimeter walls (2 tiers, double-thick on N/S faces)
  for (let t = 0; t < tiers; t++) {
    const y = t * _CH;
    // N/S walls (yaw=90, run along X)
    for (let i = 0; i < w; i++) {
      const x = i * _CD + _CD/2;
      pts.push({ x, y, z: 0, yaw: 90, name: _cpick(i+t),   scale: 1 });
      pts.push({ x, y, z: D, yaw: 90, name: _cpick(i+t+1), scale: 1 });
      // double-thick second row inset by container width
      pts.push({ x, y, z: _CW,     yaw: 90, name: _cpick(i+t+2), scale: 1 });
      pts.push({ x, y, z: D - _CW, yaw: 90, name: _cpick(i+t+3), scale: 1 });
    }
    // E/W walls (yaw=0)
    for (let i = 1; i < d - 1; i++) {
      const z = i * _CD + _CD/2;
      pts.push({ x: 0, y, z, yaw: 0, name: _cpick(i+t+4), scale: 1 });
      pts.push({ x: W, y, z, yaw: 0, name: _cpick(i+t+5), scale: 1 });
    }
  }

  // Solid IND10 roof slabs over whole footprint
  const roofY = tiers * _CH;
  for (let x = 4; x < W - 4; x += 9.012) {
    for (let z = 4; z < D - 4; z += 9.758) {
      pts.push({ x, y: roofY, z, pitch: -90, yaw: 0, name: IND10, scale: 1 });
    }
  }

  // Blast wall — staggered hbarriers in front of south entrance (z=-6)
  for (let i = 0; i < w; i++) {
    const x = i * _CD + _CD/2;
    pts.push({ x, y: 0, z: -6, yaw: 0, name: "staticobj_mil_hbarrier_6m", scale: 1 });
  }
  // Ventilation barrels on roof corners
  for (const [vx, vz] of [[2, 2], [W - 2, 2], [2, D - 2], [W - 2, D - 2]] as [number, number][]) {
    pts.push({ x: vx, y: roofY, z: vz, yaw: 0, name: "barrel_red", scale: 1 });
  }

  return applyLimit(pts, 1100);
}

// ── Container Watchtower ──────────────────────────────────────────────────────
// Tall slim observation tower: 4-container square stack, single column, observation
// platform with sandbags + spotlight at top.
export function gen_container_watchtower(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const tiers = Math.max(3, Math.round(p.tiers ?? 6));
  const _CW   = 2.702;
  const half  = _CW / 2;

  // Single 1×1 footprint, 4 containers per layer forming a hollow square pillar
  for (let t = 0; t < tiers; t++) {
    const y = t * _CH;
    pts.push({ x: -half, y, z: 0,     yaw: 0,  name: _cpick(t),     scale: 1 });
    pts.push({ x:  half, y, z: 0,     yaw: 0,  name: _cpick(t + 1), scale: 1 });
    pts.push({ x: 0,     y, z: -half, yaw: 90, name: _cpick(t + 2), scale: 1 });
    pts.push({ x: 0,     y, z:  half, yaw: 90, name: _cpick(t + 3), scale: 1 });
  }

  // Observation deck — IND10 floor at top
  const topY = tiers * _CH;
  pts.push({ x: 0, y: topY, z: 0, pitch: -90, yaw: 0, name: IND10, scale: 1 });

  // Sandbag rim around platform
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (dx === 0 && dz === 0) continue;
      pts.push({ x: dx * 2, y: topY, z: dz * 2, yaw: 0, name: "staticobj_mil_hbarrier_6m", scale: 0.5 });
    }
  }

  return applyLimit(pts, 600);
}

// ── DayZ Authentic Castle ─────────────────────────────────────────────────────
// Built from REAL DayZ castle classnames scraped from scalespeeder/Sinystock-Castle
// (Land_Castle_Bergfrit/Wall1_20/Gate/Stairs/Wall2_Corner1) — drops directly onto
// any Chernarus server without needing a mod.
export function gen_dayz_castle(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S      = Math.max(0.5, p.scale ?? 1);
  const sideC  = Math.max(3, Math.round(p.side ?? 4));   // walls per side
  // Sinystock Castle walls measure ~20m segments (Wall1_20)
  const WALL_LEN = 20 * S;
  const side     = sideC * WALL_LEN;

  // Outer perimeter walls (4 sides), gate gap on south face mid
  const gateIdx = Math.floor(sideC / 2);
  for (let i = 0; i < sideC; i++) {
    const off = i * WALL_LEN + WALL_LEN / 2;
    // South wall (yaw=90, runs along X) — gate slot at gateIdx
    if (i === gateIdx) {
      pts.push({ x: off, y: 0, z: 0, yaw: 90, name: "Land_Castle_Gate", scale: S });
    } else {
      pts.push({ x: off, y: 0, z: 0, yaw: 90, name: "Land_Castle_Wall1_20", scale: S });
    }
    // North wall
    pts.push({ x: off, y: 0, z: side, yaw: 90, name: "Land_Castle_Wall1_20", scale: S });
    // West wall (yaw=0, runs along Z)
    pts.push({ x: 0,    y: 0, z: off, yaw: 0, name: "Land_Castle_Wall1_20", scale: S });
    // East wall
    pts.push({ x: side, y: 0, z: off, yaw: 0, name: "Land_Castle_Wall1_20", scale: S });
  }

  // 4 corner towers — Wall2_Corner1 caps the wall junctions
  for (const [cx, cz] of [[0, 0], [side, 0], [0, side], [side, side]] as [number, number][]) {
    pts.push({ x: cx, y: 0, z: cz, yaw: 0, name: "Land_Castle_Wall2_Corner1", scale: S });
  }

  // Central keep — Bergfrit (the iconic DayZ castle keep tower)
  pts.push({ x: side / 2, y: 0, z: side / 2, yaw: 0, name: "Land_Castle_Bergfrit", scale: S });

  // Stairs at gate entrance
  pts.push({ x: side / 2, y: 0, z: -3, yaw: 0, name: "Land_Castle_Stairs_nolc", scale: S });

  // Atmospheric dressing: fortified sandbag nests + medical tent + wreck queue
  for (const [dx, dz] of [[10, 6], [-10, 6], [10, side - 6], [-10, side - 6]] as [number, number][]) {
    pts.push({ x: side / 2 + dx, y: 0, z: dz, yaw: 0, name: "Land_Mil_Fortified_Nest_Small", scale: 1 });
  }
  pts.push({ x: side / 2 - 8, y: 0, z: side / 2 - 8, yaw: 0, name: "Land_Medical_Tent_Big", scale: 1 });
  pts.push({ x: side / 2 + 12, y: 0, z: -8, yaw: 90, name: "Land_Wreck_Uaz", scale: 1 });
  pts.push({ x: side / 2 - 12, y: 0, z: -8, yaw: 90, name: "Land_wreck_truck01_aban1_green", scale: 1 });

  return applyLimit(pts, 600);
}

// ── DayZ Underground Bunker (Full Network) ────────────────────────────────────
// Real Land_Underground_* pieces from Livonia. Layout:
//   • Surface entrance + descending stairs down to subterranean level
//   • Central + corridor intersection (Main_Both) with control panels/levers
//   • 4 corridor branches radiating to themed storage rooms (Ammo / Hospital /
//     Barracks / Laboratory)
//   • Side branch to Floor_Comms + Floor_Crew (operations zone)
//   • Water section: WaterMaintenance + WaterReservoir + reservoir water plane
//   • Auxiliary single-tunnel branch off central with Storage_Big at end
export function gen_dayz_bunker(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S      = Math.max(0.5, p.scale ?? 1);
  const SEG    = 14 * S;   // segment length between corridor pieces
  const Y_DOWN = -8 * S;   // subterranean Y level

  // ── 1. Surface entrance + stairs descent ─────────────────────────────────
  pts.push({ x: 0,             y: 0,            z: -SEG * 2,    yaw: 0,   name: "Land_Underground_Entrance",        scale: S });
  pts.push({ x: 0,             y: -2 * S,       z: -SEG * 1.4,  yaw: 0,   name: "Land_Underground_Stairs_Start",    scale: S });
  pts.push({ x: 0,             y: -5 * S,       z: -SEG * 0.8,  yaw: 0,   name: "Land_Underground_Stairs_Block",    scale: S });
  pts.push({ x: 0,             y: Y_DOWN,       z: -SEG * 0.2,  yaw: 0,   name: "Land_Underground_Stairs_Block_Corridor", scale: S });

  // ── 2. Central intersection (Main_Both) at depth ─────────────────────────
  pts.push({ x: 0,             y: Y_DOWN,       z: 0,           yaw: 0,   name: "Land_Underground_Corridor_Main_Both",     scale: S });

  // Control panels + lever at the central junction (gameplay decoration)
  pts.push({ x:  2.5 * S,      y: Y_DOWN + 1*S, z:  2.5 * S,    yaw: 0,   name: "Land_Underground_Panel",             scale: S });
  pts.push({ x: -2.5 * S,      y: Y_DOWN + 1*S, z:  2.5 * S,    yaw: 0,   name: "Land_Underground_Panel_Lever",       scale: S });
  pts.push({ x:  0,            y: Y_DOWN + 1*S, z:  2.5 * S,    yaw: 0,   name: "PunchedCard",                        scale: S });

  // ── 3. Four cardinal corridor branches with end rooms ────────────────────
  // Connector → Tunnel_Single → Storage at the end, per branch.
  const BRANCHES: { dx: number; dz: number; yaw: number; room: string }[] = [
    { dx: 0,  dz:  1, yaw: 0,   room: "Land_Underground_Storage_Ammo"       },
    { dx: 0,  dz: -1, yaw: 180, room: "Land_Underground_Storage_Hospital"   },
    { dx: 1,  dz:  0, yaw: 90,  room: "Land_Underground_Storage_Barracks"   },
    { dx: -1, dz:  0, yaw: 270, room: "Land_Underground_Storage_Laboratory" },
  ];
  for (const { dx, dz, yaw, room } of BRANCHES) {
    pts.push({ x: dx * SEG,       y: Y_DOWN, z: dz * SEG,       yaw, name: "Land_Underground_Corridor_Connector", scale: S });
    pts.push({ x: dx * SEG * 1.8, y: Y_DOWN, z: dz * SEG * 1.8, yaw, name: "Land_Underground_Tunnel_Single",      scale: S });
    pts.push({ x: dx * SEG * 2.6, y: Y_DOWN, z: dz * SEG * 2.6, yaw, name: room,                                   scale: S });
  }

  // ── 4. Operations zone — Floor_Comms + Floor_Crew off NE diagonal ────────
  pts.push({ x:  SEG * 0.7, y: Y_DOWN, z:  SEG * 0.7, yaw: 45, name: "Land_Underground_Tunnel_Single_Right", scale: S });
  pts.push({ x:  SEG * 1.4, y: Y_DOWN, z:  SEG * 1.4, yaw: 45, name: "Land_Underground_Floor_Comms",        scale: S });
  pts.push({ x:  SEG * 2.1, y: Y_DOWN, z:  SEG * 2.1, yaw: 45, name: "Land_Underground_Floor_Crew",         scale: S });

  // ── 5. Water section — SE diagonal ───────────────────────────────────────
  pts.push({ x:  SEG * 0.7, y: Y_DOWN, z: -SEG * 0.7, yaw: 135, name: "Land_Underground_Tunnel_Single_Left",  scale: S });
  pts.push({ x:  SEG * 1.4, y: Y_DOWN, z: -SEG * 1.4, yaw: 135, name: "Land_Underground_WaterMaintenance",    scale: S });
  pts.push({ x:  SEG * 2.1, y: Y_DOWN, z: -SEG * 2.1, yaw: 135, name: "Land_Underground_WaterReservoir",      scale: S });
  pts.push({ x:  SEG * 2.1, y: Y_DOWN, z: -SEG * 2.1, yaw: 135, name: "Land_Underground_WaterReservoir_Water", scale: S });

  // ── 6. Storage_Big auxiliary off SW diagonal ─────────────────────────────
  pts.push({ x: -SEG * 0.7, y: Y_DOWN, z: -SEG * 0.7, yaw: 225, name: "Land_Underground_Tunnel_Single",       scale: S });
  pts.push({ x: -SEG * 1.5, y: Y_DOWN, z: -SEG * 1.5, yaw: 225, name: "Land_Underground_Storage_Big",         scale: S });

  // ── 7. Prison + POX side branch off NW ───────────────────────────────────
  pts.push({ x: -SEG * 0.7, y: Y_DOWN, z:  SEG * 0.7, yaw: 315, name: "Land_Underground_Tunnel_Single",       scale: S });
  pts.push({ x: -SEG * 1.4, y: Y_DOWN, z:  SEG * 1.4, yaw: 315, name: "Land_Underground_Storage_Prison",      scale: S });
  pts.push({ x: -SEG * 2.1, y: Y_DOWN, z:  SEG * 2.1, yaw: 315, name: "Land_Underground_Storage_POX",         scale: S });

  // ── 8. Surface dressing around the entrance ──────────────────────────────
  for (const [dx, dz] of [[-4, -SEG * 2 - 4], [4, -SEG * 2 - 4], [-4, -SEG * 2 + 4], [4, -SEG * 2 + 4]] as [number, number][]) {
    pts.push({ x: dx, y: 0, z: dz, yaw: 0, name: "Land_Mil_Fortified_Nest_Small", scale: 1 });
  }
  pts.push({ x: 0,  y: 0, z: -SEG * 2 - 8, yaw: 0,  name: "Land_Mil_Tent_Big1_1",        scale: 1 });
  pts.push({ x: -8, y: 0, z: -SEG * 2 + 6, yaw: 90, name: "Land_wreck_truck01_aban1_orange", scale: 1 });
  pts.push({ x: 0,  y: 0, z: -SEG * 2 - 2, yaw: 0,  name: "staticobj_misc_flagpole",     scale: 1 });

  return applyLimit(pts, 400);
}

// ── Container Compound ────────────────────────────────────────────────────────
// Square military compound: perimeter wall with 4 corner watchtowers, central
// command structure, gate house, dressing (barriers/spotlights/lamps).
export function gen_container_compound(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const sideC = Math.max(4, Math.round(p.side ?? 6));   // wall containers per side
  const tiers = Math.max(2, Math.round(p.tiers ?? 2));
  const _CW   = 2.702;
  const side  = sideC * _CD;

  // Perimeter walls (gap in south face = gate)
  const gateIdx = Math.floor(sideC / 2);
  for (let t = 0; t < tiers; t++) {
    const y = t * _CH;
    for (let i = 0; i < sideC; i++) {
      const x = i * _CD + _CD / 2;
      const skipS = (t < 1 && i === gateIdx);
      if (!skipS) pts.push({ x, y, z: 0,    yaw: 90, name: _cpick(i+t),   scale: 1 });
      pts.push({ x, y, z: side, yaw: 90, name: _cpick(i+t+2), scale: 1 });
      // E/W walls
      pts.push({ x: 0,    y, z: x, yaw: 0, name: _cpick(i+t+4), scale: 1 });
      pts.push({ x: side, y, z: x, yaw: 0, name: _cpick(i+t+6), scale: 1 });
    }
  }

  // Corner watchtowers — extra 2 tiers above wall (kept slim, 1 container each)
  for (const [cx, cz] of [[0,0],[side,0],[0,side],[side,side]] as [number,number][]) {
    for (let t = tiers; t < tiers + 2; t++) {
      const y = t * _CH;
      pts.push({ x: cx, y, z: cz, yaw: 0, name: _cpick(t), scale: 1 });
    }
  }

  // Central command — single 2-tier square structure
  const cx = side / 2, cz = side / 2;
  const commandSize = 2;
  for (let t = 0; t < 2; t++) {
    const y = t * _CH;
    for (let i = 0; i < commandSize; i++) {
      pts.push({ x: cx - commandSize*_CD/2 + i*_CD + _CD/2, y, z: cz - 5,  yaw: 90, name: "land_container_1mo", scale: 1 });
      pts.push({ x: cx - commandSize*_CD/2 + i*_CD + _CD/2, y, z: cz + 5,  yaw: 90, name: "land_container_1mo", scale: 1 });
    }
  }
  pts.push({ x: cx, y: 2 * _CH, z: cz, yaw: 0, name: "staticobj_misc_flagpole", scale: 1 });

  // Gate hbarriers
  const gateX = (gateIdx + 0.5) * _CD;
  for (let dx = -10; dx <= 10; dx += 5) {
    pts.push({ x: gateX + dx, y: 0, z: -6, yaw: 0, name: "staticobj_mil_hbarrier_6m", scale: 1 });
  }
  // Tent + barrels in courtyard
  pts.push({ x: cx + 12, y: 0, z: cz, yaw: 0, name: "Land_Mil_Tent_Big1_1", scale: 1 });
  for (const [bx, bz] of [[10, 8], [10, -8], [-10, 8], [-10, -8]] as [number, number][]) {
    pts.push({ x: cx + bx, y: 0, z: cz + bz, yaw: 0, name: "barrel_red", scale: 1 });
  }

  return applyLimit(pts, 1100);
}

// ═══════════════════════════════════════════════════════════════════════════════
