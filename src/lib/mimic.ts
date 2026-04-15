// ─────────────────────────────────────────────────────────────────────────────
// DANK STUDIO — 3D Preview Object Dimensions
// Maps DayZ classname → [width, height, depth] for the Three.js box preview.
// Dimensions verified against real LordBionik JSON exports & naming convention.
// ─────────────────────────────────────────────────────────────────────────────

export interface MimicDef {
  w: number; h: number; d: number;
  color: string;
}

const MIMICS: Record<string, MimicDef> = {

  // ── CONCRETE WALLS (small/standard) ──────────────────────────────────────
  "staticobj_wall_cncsmall_8":        { w: 8.00, h:  3.0, d: 0.40, color: "#aaaaaa" },
  "staticobj_wall_cncsmall_4":        { w: 4.00, h:  3.0, d: 0.40, color: "#aaaaaa" },
  "staticobj_wall_cnc_5":             { w: 5.00, h:  3.0, d: 0.50, color: "#b0b0b0" },

  // ── INDUSTRIAL CONCRETE WALLS ────────────────────────────────────────────
  // face = 8.75 m (measured from placed builds), height = 10 m
  "staticobj_wall_indcnc_10":         { w: 8.75, h: 10.0, d: 0.50, color: "#546e7a" },
  "staticobj_wall_indcnc_4":          { w: 4.00, h: 10.0, d: 0.50, color: "#4a6270" },
  "staticobj_wall_indcnch_10":        { w: 8.75, h:  5.0, d: 0.50, color: "#607d8b" },
  "staticobj_wall_indcnch_5":         { w: 4.375,h:  5.0, d: 0.50, color: "#607d8b" },
  "staticobj_wall_indcnc4_8":         { w: 8.00, h:  8.0, d: 0.50, color: "#5a7a8a" },
  "staticobj_wall_indcnc4_4":         { w: 4.00, h:  8.0, d: 0.50, color: "#5a7a8a" },
  "staticobj_wall_indcnc4_low_8":     { w: 8.00, h:  4.0, d: 0.50, color: "#6a8a9a" },
  "staticobj_wall_indcnc4_low_4":     { w: 4.00, h:  4.0, d: 0.50, color: "#6a8a9a" },

  // ── MILITARY CONCRETE ────────────────────────────────────────────────────
  "staticobj_wall_milcnc_4":          { w: 4.00, h:  3.0, d: 0.30, color: "#78909c" },
  "staticobj_wall_milcncbarrier":     { w: 4.00, h:  2.0, d: 1.20, color: "#78909c" },

  // ── CASTLE / STONE WALLS ─────────────────────────────────────────────────
  "staticobj_castle_wall3":           { w: 8.00, h:  2.0, d: 0.60, color: "#9e8b6c" },
  "staticobj_wall_stone2":            { w: 8.00, h:  3.5, d: 0.60, color: "#c8b99a" },
  "staticobj_wall_stone":             { w: 8.00, h:  3.5, d: 0.60, color: "#6a6a6a" },
  "land_castle_wall1_20":             { w:20.00, h:  8.0, d: 1.00, color: "#795548" },
  "land_castle_wall2_30":             { w:30.00, h:  8.0, d: 1.00, color: "#6d4c41" },

  // ── TIN WALLS ────────────────────────────────────────────────────────────
  "staticobj_wall_tin_5":             { w: 5.00, h:  2.0, d: 0.30, color: "#7a8a7a" },

  // ── BUNKER PANELS ────────────────────────────────────────────────────────
  "land_bunker1_double":              { w: 8.00, h:  3.5, d: 0.60, color: "#5a6a5a" },
  "land_bunker1_left":                { w: 4.00, h:  3.5, d: 0.60, color: "#5a6a5a" },
  "land_bunker1_right":               { w: 4.00, h:  3.5, d: 0.60, color: "#5a6a5a" },
  "land_bunker2_double":              { w: 8.00, h:  3.5, d: 0.60, color: "#6a6a5a" },

  // ── FLOORS / PLATFORMS ───────────────────────────────────────────────────
  "staticobj_platform1_block":        { w: 2.00, h:  0.4, d: 2.00, color: "#999999" },
  "staticobj_misc_timbers_log4":      { w: 4.00, h:  0.4, d: 0.40, color: "#8d6e40" },

  // ── BRIDGES & PIERS ──────────────────────────────────────────────────────
  "staticobj_bridge_wood_50":         { w:50.00, h:  1.0, d: 4.00, color: "#7e5233" },
  "staticobj_bridge_wood_25":         { w:25.00, h:  1.0, d: 4.00, color: "#7e5233" },
  "land_woodenpier_15m":              { w:15.00, h:  1.0, d: 4.00, color: "#7e5233" },
  "staticobj_pier_wooden1":           { w: 8.00, h:  1.0, d: 2.00, color: "#7e5233" },
  "staticobj_pier_concrete2":         { w: 8.00, h:  1.0, d: 2.00, color: "#888888" },

  // ── BARRIERS ─────────────────────────────────────────────────────────────
  "staticobj_mil_hbarrier_big":       { w: 4.50, h:  1.8, d: 1.50, color: "#8a7a6a" },
  "staticobj_mil_hbarrier_6m":        { w: 6.00, h:  1.8, d: 1.50, color: "#8a7a6a" },
  "staticobj_roadblock_cncblock":     { w: 3.00, h:  1.0, d: 1.20, color: "#8a8a8a" },

  // ── CONTAINERS ───────────────────────────────────────────────────────────
  "land_container_1bo":               { w: 6.00, h:  2.9, d: 2.40, color: "#4a4a4a" },
  "land_container_1mo":               { w: 6.00, h:  2.9, d: 2.40, color: "#5a5a4a" },
  "land_container_1moh":              { w: 6.00, h:  2.9, d: 2.40, color: "#4a5a4a" },
  "land_container_1aoh":              { w: 6.00, h:  2.9, d: 2.40, color: "#5a4a4a" },

  // ── CYLINDRICAL TANKS ────────────────────────────────────────────────────
  "land_dieselpowerplant_tank_small": { w: 6.00, h:  6.0, d: 6.00, color: "#5a5a6a" },
  "land_dieselpowerplant_tank_big":   { w:10.00, h: 10.0, d:10.00, color: "#4a4a5a" },

  // ── MILITARY STRUCTURES ──────────────────────────────────────────────────
  "land_mil_guardbox_smooth":         { w: 2.50, h:  2.5, d: 2.50, color: "#708090" },
  "land_mil_guardbox_green":          { w: 2.50, h:  2.5, d: 2.50, color: "#5a7a5a" },
  "land_mil_guardbox_brown":          { w: 2.50, h:  2.5, d: 2.50, color: "#7a6a5a" },
  "land_mil_guardshed":               { w: 4.00, h:  3.5, d: 3.00, color: "#6a7a6a" },
  "land_mil_barracks_round":          { w: 8.00, h:  5.0, d: 8.00, color: "#5a6a5a" },

  // ── PROPS ─────────────────────────────────────────────────────────────────
  "barrel_blue":                      { w: 0.70, h:  0.9, d: 0.70, color: "#2980b9" },
  "barrel_red":                       { w: 0.70, h:  0.9, d: 0.70, color: "#c0392b" },
  "barrel_yellow":                    { w: 0.70, h:  0.9, d: 0.70, color: "#f1c40f" },
  "barrel_green":                     { w: 0.70, h:  0.9, d: 0.70, color: "#27ae60" },

  // ── PIPES & TUBES ────────────────────────────────────────────────────────
  "staticobj_misc_concretepipe":       { w: 2.00, h:  2.0, d: 2.00, color: "#7a7a7a" },
  "staticobj_misc_boundarystone_tube": { w: 0.30, h:  1.8, d: 0.30, color: "#6a5a4a" },
  "staticobj_pier_tube_big":           { w: 1.50, h:  3.0, d: 1.50, color: "#5a5a5a" },
  "staticobj_pier_tube_small":         { w: 0.80, h:  1.5, d: 0.80, color: "#5a5a5a" },
  "staticobj_pipe_big_18m":            { w: 1.50, h:  1.5, d:18.00, color: "#666666" },
  "staticobj_pipe_med_9m":             { w: 0.90, h:  0.9, d: 9.00, color: "#6a6a6a" },
  "staticobj_pipe_small_20m":          { w: 0.40, h:  0.4, d:20.00, color: "#707070" },

  // ── MONUMENTS / PILLARS ──────────────────────────────────────────────────
  "staticobj_monument_war1":           { w: 2.00, h: 12.0, d: 2.00, color: "#8a8a8a" },
  "staticobj_monument_enoch1":         { w: 1.00, h:  3.0, d: 1.00, color: "#8a8a8a" },

  // ── CASTLE STRUCTURAL ────────────────────────────────────────────────────
  "land_castle_bastion":               { w: 6.00, h:  8.0, d: 6.00, color: "#7a6a5a" },

  // ── WRECKS ───────────────────────────────────────────────────────────────
  "wreck_ship_large_front":           { w:15.00, h:  7.0, d:10.00, color: "#5a6a7a" },
  "wreck_ship_large_mid":             { w:15.00, h:  6.0, d:10.00, color: "#5a6a7a" },
  "wreck_ship_large_back":            { w:15.00, h:  7.0, d:10.00, color: "#5a6a7a" },
};

const FALLBACK: MimicDef = { w: 2, h: 2, d: 2, color: "#4a7a50" };

export function getMimic(classname: string): MimicDef {
  if (!classname) return FALLBACK;
  const key = classname.toLowerCase();
  if (MIMICS[key]) return MIMICS[key];

  // Fuzzy fallbacks — ordered most-specific first
  if (key.includes("indcnch"))           return { w: 8.75, h:  5.0, d: 0.5, color: "#607d8b" };
  if (key.includes("indcnc4_low"))       return { w: 8.00, h:  4.0, d: 0.5, color: "#6a8a9a" };
  if (key.includes("indcnc4"))           return { w: 8.00, h:  8.0, d: 0.5, color: "#5a7a8a" };
  if (key.includes("indcnc"))            return { w: 8.75, h: 10.0, d: 0.5, color: "#546e7a" };
  if (key.includes("milcnc"))            return { w: 4.00, h:  3.0, d: 0.3, color: "#78909c" };
  if (key.includes("cncsmall_4"))        return { w: 4.00, h:  3.0, d: 0.4, color: "#aaaaaa" };
  if (key.includes("cncsmall") || key.includes("wall_cnc")) return { w: 8.00, h: 3.0, d: 0.4, color: "#aaaaaa" };
  if (key.includes("castle_wall"))       return { w: 8.00, h:  2.0, d: 0.6, color: "#9e8b6c" };
  if (key.includes("wall_stone2"))       return { w: 8.00, h:  3.5, d: 0.6, color: "#c8b99a" };
  if (key.includes("wall_stone"))        return { w: 8.00, h:  3.5, d: 0.6, color: "#6a6a6a" };
  if (key.includes("bunker1") || key.includes("bunker2")) return { w: 8.00, h: 3.5, d: 0.6, color: "#5a6a5a" };
  if (key.includes("tank_big"))          return { w:10.00, h: 10.0, d:10.0, color: "#4a4a5a" };
  if (key.includes("tank_small"))        return { w: 6.00, h:  6.0, d: 6.0, color: "#5a5a6a" };
  if (key.includes("container"))         return { w: 6.00, h:  2.9, d: 2.4, color: "#3a3a3a" };
  if (key.includes("guardbox"))          return { w: 2.50, h:  2.5, d: 2.5, color: "#708090" };
  if (key.includes("barrel"))            return { w: 0.70, h:  0.9, d: 0.7, color: "#888888" };
  if (key.includes("hbarrier"))          return { w: 5.00, h:  1.8, d: 1.5, color: "#8a7a6a" };
  if (key.includes("platform"))          return { w: 2.00, h:  0.4, d: 2.0, color: "#999999" };
  if (key.includes("pier") || key.includes("bridge")) return { w: 15.0, h: 1.0, d: 4.0, color: "#7e5233" };

  return FALLBACK;
}
