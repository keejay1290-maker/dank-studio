// Shared P3D-verified DayZ wall classnames + container dimensions + types.
// Extracted from shapes.ts so generator sub-files can re-use without circular imports.

export type GenParams = Record<string, number>;
//
// Format: w = face width (X, horizontal spacing), h = panel height (Y), d = depth (Z)

// ── Wall panels ───────────────────────────────────────────────────────────────
export const CASTLE  = "staticobj_castle_wall3";      // ~8m × 2m  (P3D not scanned)
export const STONE   = "staticobj_wall_stone";        // 10.060m × 2.034m dark stone
export const STONE2  = "staticobj_wall_stone2";       // 9.408m × 1.572m light stone
export const CNC8    = "staticobj_wall_cncsmall_8";   // 8.008m × 2.300m concrete
export const CNC4    = "staticobj_wall_cncsmall_4";   // 4.017m × 2.324m concrete
export const MILCNC  = "staticobj_wall_milcnc_4";     // 4.052m × 4.744m military
export const IND10   = "staticobj_wall_indcnc_10";    // 9.012m × 9.758m industrial

// ── Timber & Logs ────────────────────────────────────────────────────────────
export const TIMBERS1 = "staticobj_misc_timbers1";      // 4.010m x 3.556m
export const TIMBERS2 = "staticobj_misc_timbers2";      // 4.001m x 2.203m
export const LOG1     = "staticobj_misc_timbers_log1";  // 11.838m long (Z axis)
export const LOG5     = "staticobj_misc_timbers_log5";  // 3.156m tall (Y axis)

// ── Container dimensions (long axis Z at yaw=0) ──────────────────────────────
export const _CD  = 10.000;   // container depth (long axis)
export const _CH  = 2.782;    // container height
export const _CW  = 2.702;    // container width

// ── Container colour palette (deterministic _cpick rotation) ─────────────────
// All entries MUST share the same physical shape (2.702 W × 2.782 H × 10.000 D)
// so generator yaw assumptions hold. Do NOT add land_container_1a/1b/1c here —
// those are a different short-fat shape (6.7 × 2.66 × 2.7) that breaks layouts.
export const _C_PALETTE = [
  "land_container_1bo",
  "land_container_1mo",
  "land_container_1moh",
  "land_containerlocked",
] as const;

export const _cpick = (i: number): string =>
  _C_PALETTE[Math.abs(i) % _C_PALETTE.length];
