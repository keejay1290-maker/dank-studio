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
import { drawWall, drawRing, drawRect, drawDisk, drawSphere, drawDome, drawSphereBudgeted, auditSphereCoverage } from "../draw";
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
  const R     = p.r ?? 42;           // radius 42 — denser hull coverage within 1200 limit
  const panelW = 9.012;              // IND10 face width (P3D-verified)

  // ── Materials ─────────────────────────────────────────────────────────────
  const MAT_MAIN  = IND10;           // main hull plates — 9.012×9.758 industrial
  const MAT_BAND  = "staticobj_wall_indcnc4_8"; // 8m × 8m darker band
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

  // ── Base sphere — use the proven gap-free drawSphere helper ─────────────
  // Build into a temp array, then filter out panels in the dish + trench
  // regions before pushing to pts. This keeps all sphere-tiling math in one
  // place (draw.ts) instead of duplicating it here.
  const baseSphere: Point3D[] = [];
  drawSphere(baseSphere, 0, R, 0, R, MAT_MAIN);
  // drawSphere stores y at pivot-bottom (surface - panelH/2). Add halfH back
  // when reconstructing radial direction vectors for dish/trench filtering.
  const HULL_HALF_H = (getObjectDef(MAT_MAIN)?.height ?? 10) / 2;

  for (const panel of baseSphere) {
    // Reconstruct unit direction from sphere center (0, R, 0)
    const dx = panel.x;
    const dy = panel.y - R + HULL_HALF_H; // +halfH cancels drawSphere's pivot-bottom offset
    const dz = panel.z;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 0.001) { pts.push(panel); continue; }
    const nx = dx / len, ny = dy / len, nz = dz / len;

    // Latitude (phi from north pole)
    const phi = Math.acos(Math.max(-1, Math.min(1, ny)));

    // Skip main equatorial trench band
    if (Math.abs(phi - trenchPhi) < trenchHalf) continue;

    // Skip dish region
    const dot = nx * dcx + ny * dcy + nz * dcz;
    const dishAngle = Math.acos(Math.max(-1, Math.min(1, dot)));
    if (dishAngle < dishCone) continue;

    // Material banding: darker plates in latitude rings for surface grid look
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

  return pts;
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

  // ── NECK — angled forward from body front-top to head ─────────────────────
  // Front of body is at z = -BD. Neck angles forward (more -Z) and slightly down.
  const neckBX = 0, neckBY = bodyTop,     neckBZ = -BD;
  const neckTX = 0, neckTY = LH + 6 * S, neckTZ = -BD - 10 * S;
  drawWall(pts, neckBX, neckBY, neckBZ, neckTX, neckTY, neckTZ, IND10);

  // ── HEAD — CNC8 box (2 stacked rows = 6m tall) ───────────────────────────
  // Head centre Z is 8m past the neck tip; head faces south (-Z direction).
  const headCZ = neckTZ - 6 * S;   // centre of head along Z
  const headBY = neckTY - 5 * S;   // head base Y (slightly below neck tip)
  const HW = 5 * S;                 // head half-width (X)
  const HD = 6 * S;                 // head half-depth (Z)
  drawRect(pts, 0, headBY,           headCZ, HW, HD, CNC8);
  drawRect(pts, 0, headBY + 3 * S,  headCZ, HW, HD, CNC8);

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

  // ── 4 LEGS — MILCNC angled segments (auto-pitch via drawWall) ────────────
  // 2 front legs (z = -BD), 2 rear legs (z = +BD)
  const legPositions = [
    { lx:  BW, lz: -BD },   // front-right
    { lx: -BW, lz: -BD },   // front-left
    { lx:  BW, lz:  BD },   // rear-right
    { lx: -BW, lz:  BD },   // rear-left
  ];

  for (const leg of legPositions) {
    // Knee: splayed outward 30%, halfway up
    const kneeX = leg.lx * 1.35;
    const kneeY = LH * 0.52;
    const kneeZ = leg.lz;

    // Ankle: pulls inward from knee, near ground
    const ankleX = leg.lx * 1.15;
    const ankleY = 2 * S;

    // Upper leg (hip → knee) — angled outward: panels rotate automatically via drawWall pitch
    drawWall(pts, leg.lx, LH, leg.lz, kneeX, kneeY, kneeZ, MILCNC);
    // Lower leg (knee → ankle)
    drawWall(pts, kneeX, kneeY, kneeZ, ankleX, ankleY, kneeZ, MILCNC);
    // Foot pad (wide flat base)
    drawRect(pts, ankleX, 0.5 * S, kneeZ, 3.5 * S, 4 * S, CNC8);
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
 * 🛰️ STAR DESTROYER — Imperial-class (ISD-I)
 *
 * Reference: 1,600m long, 900m wide at stern, 100m tall stern cross-section.
 * At S=1 this is ~1/10 scale (160m long) for DayZ visibility.
 *
 * Structure (bow points toward -Z / South):
 *  • Hull — 3D dagger wedge: wide+thick at stern (+Z), narrow+thin at bow (-Z)
 *    - Dorsal skin (top) — IND10 panels running Z slices, tapered in both X and Y
 *    - Ventral skin (bottom) — mirrored below, angled slightly upward toward bow
 *  • Dorsal superstructure — raised spine keel running from mid-ship to stern
 *  • Bridge tower — tall stalk behind mid-ship with T-shaped command bridge
 *    - Two shield generator spheres (dome rings) atop the bridge wings
 *  • Engine bank — 3 large + 2 small engine rings at the stern face
 *  • Hangar bay — recessed dark rectangle on ventral stern
 */
export function gen_star_destroyer(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const S = Math.max(0.5, p.scale ?? 1);
  const L   = 160 * S;           // overall length
  const HW  = 45  * S;           // stern half-width (full 90m at stern)
  const TH  = 14  * S;           // stern hull thickness (total height)
  const sliceStep = 10 * S;      // slice interval along Z

  // ── HULL — dorsal + ventral skins ─────────────────────────────────────────
  // From stern (+L/2) to bow (-L/2), each Z slice is a trapezoidal cross-section
  // that narrows in both X and Y toward the bow.
  for (let z = -L/2; z <= L/2; z += sliceStep) {
    const t    = (z / L + 0.5);              // 0 = bow, 1 = stern
    const halfX = 2 * S + t * (HW - 2 * S); // width taper: 2m → 45m
    const topY  = t * TH * 0.55;            // dorsal height: 0 → 7.7m
    const botY  = -t * TH * 0.45;           // ventral depth: 0 → -6.3m

    // Dorsal skin (top surface)
    drawWall(pts, -halfX, topY, z, halfX, topY, z, IND10);

    // Ventral skin (bottom surface) — only from mid-ship to stern for performance
    if (t > 0.3) {
      drawWall(pts, -halfX, botY, z, halfX, botY, z, IND10);
    }

    // Side edges — left & right hull edges connecting dorsal to ventral
    if (t > 0.25 && Math.abs(halfX) > 8 * S) {
      // Left edge
      pts.push({ x: -halfX, y: (topY + botY) / 2, z, yaw: 90, name: IND10 });
      // Right edge
      pts.push({ x:  halfX, y: (topY + botY) / 2, z, yaw: 90, name: IND10 });
    }
  }

  // ── DORSAL SUPERSTRUCTURE — raised spine/keel ─────────────────────────────
  // Runs from z = -10*S (just behind mid-ship) to z = +L/2 - 20*S (before stern)
  const spineStart = -10 * S;
  const spineEnd   = L/2 - 20 * S;
  for (let z = spineStart; z <= spineEnd; z += 12 * S) {
    const t    = (z - spineStart) / (spineEnd - spineStart);
    const half = (3 + t * 5) * S;  // spine widens toward stern
    const yTop = (0.55 * TH * ((z / L + 0.5))) + (2 + t * 3) * S;
    drawWall(pts, -half, yTop, z, half, yTop, z, MILCNC);
  }

  // ── BRIDGE TOWER — tall rectangular stalk + T-shaped command bridge ───────
  const towerZ   = -15 * S;       // just behind mid-ship
  const towerBase = 0.55 * TH * ((-15 * S / L + 0.5)) + 2 * S;
  const towerTop  = towerBase + 20 * S;

  // Tower stalk — 2 vertical walls (narrow rectangle rising from dorsal hull)
  drawWall(pts, -2 * S, towerBase, towerZ, -2 * S, towerTop, towerZ, IND10);
  drawWall(pts,  2 * S, towerBase, towerZ,  2 * S, towerTop, towerZ, IND10);
  // Tower front/back faces
  drawWall(pts, -2 * S, towerBase, towerZ - 2 * S, -2 * S, towerTop, towerZ - 2 * S, IND10);
  drawWall(pts,  2 * S, towerBase, towerZ + 2 * S,  2 * S, towerTop, towerZ + 2 * S, IND10);

  // T-shaped command bridge — wide horizontal bar at top of stalk
  const bridgeY = towerTop;
  const bridgeHW = 12 * S;  // half-width of the command bridge
  drawWall(pts, -bridgeHW, bridgeY, towerZ - 3 * S, bridgeHW, bridgeY, towerZ - 3 * S, CNC8);
  drawWall(pts, -bridgeHW, bridgeY, towerZ + 3 * S, bridgeHW, bridgeY, towerZ + 3 * S, CNC8);
  drawWall(pts, -bridgeHW, bridgeY + 2 * S, towerZ, bridgeHW, bridgeY + 2 * S, towerZ, CNC8);

  // Bridge viewport windows (dark band)
  drawWall(pts, -bridgeHW * 0.8, bridgeY + 3.5 * S, towerZ, bridgeHW * 0.8, bridgeY + 3.5 * S, towerZ, CNC4);

  // ── SHIELD GENERATOR DOMES — two spherical bumps on bridge wings ──────────
  for (const side of [-1, 1] as const) {
    const domeX = side * (bridgeHW - 2 * S);
    const domeY = bridgeY + 4 * S;
    // 3 stacked rings approximate a small dome
    for (const dr of [0, 1.2, 2.2] as const) {
      const r = (2.5 - dr * 0.6) * S;
      if (r > 0.5) drawRing(pts, domeX, domeY + dr * S, towerZ, r, CNC4);
    }
    // Dome cap
    pts.push({ x: domeX, y: domeY + 3 * S, z: towerZ, yaw: 0, pitch: -90, name: CNC4 });
  }

  // ── ENGINE BANK — 3 large + 2 small nozzle rings at stern ─────────────────
  const sternZ = L / 2 - 2 * S;
  // 3 main engines (center, left, right)
  for (const ex of [-10, 0, 10] as const) {
    drawRing(pts, ex * S, 0, sternZ, 5 * S, IND10);
    // Glowing nozzle inner ring
    drawRing(pts, ex * S, 0, sternZ + 1 * S, 3 * S, "barrel_blue");
  }
  // 2 smaller auxiliary engines
  for (const ex of [-20, 20] as const) {
    drawRing(pts, ex * S, 2 * S, sternZ, 3 * S, MILCNC);
  }

  // ── VENTRAL HANGAR BAY — dark recessed rectangle ──────────────────────────
  const hangarZ = 20 * S;
  const hangarY = -0.45 * TH * ((hangarZ / L + 0.5)) - 1 * S;
  drawRect(pts, 0, hangarY, hangarZ, 8 * S, 6 * S, STONE);

  return pts;
}

/**
 * ⭕ STARGATE PORTAL
 */
export function gen_stargate_portal(p: GenParams): Point3D[] {
  const pts: Point3D[] = [];
  const r = p.r ?? 14;
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
  const S = Math.max(0.5, p.scale ?? 1), h = 80*S, w = 20*S;
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
  const r = p.r ?? 35;
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
  const S = Math.max(0.5, p.scale ?? 1);
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
  const outerR = p.r       ?? 100;
  const tiers  = p.tiers   ?? 4;
  const tierH  = 8;

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
