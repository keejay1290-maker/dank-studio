// ─────────────────────────────────────────────────────────────────────────────
// DANK STUDIO — 3D Preview Object Dimensions (mimic.ts)
// ALL DIMENSIONS P3D-VERIFIED via ODOL bounding box extraction.
// Source: tools/p3d_catalogue.json (547 verified entries)
//
// Format: { w: X-axis, h: Y-axis (height), d: Z-axis, color: hex }
// ─────────────────────────────────────────────────────────────────────────────

export interface MimicDef {
  w: number; h: number; d: number;
  color: string;
}

const MIMICS: Record<string, MimicDef> = {

  // ── CONCRETE WALLS — CNC SMALL ───────────────────────────────────────────
  "staticobj_wall_cncsmall_8":        { w: 8.008, h:  2.300, d: 0.530, color: "#aaaaaa" },
  "staticobj_wall_cncsmall_4":        { w: 4.017, h:  2.324, d: 0.538, color: "#aaaaaa" },
  "staticobj_wall_cnc_5":             { w: 9.029, h:  5.026, d: 1.003, color: "#b0b0b0" },

  // ── INDUSTRIAL CNC (tall series) ─────────────────────────────────────────
  "staticobj_wall_indcnc_10":         { w: 9.012, h:  9.758, d: 1.007, color: "#546e7a" },
  "staticobj_wall_indcnc_4":          { w: 6.000, h:  3.499, d: 0.266, color: "#4a6270" },
  "staticobj_wall_indcnch_10":        { w: 9.608, h:  1.113, d:10.688, color: "#607d8b" },
  "staticobj_wall_indcnch_5":         { w: 9.499, h:  1.120, d: 5.466, color: "#607d8b" },
  "staticobj_wall_indcnc4_8":         { w: 8.044, h:  3.004, d: 0.400, color: "#5a7a8a" },
  "staticobj_wall_indcnc4_4":         { w: 4.055, h:  3.000, d: 0.400, color: "#5a7a8a" },
  "staticobj_wall_indcnc4_low_8":     { w: 8.044, h:  2.100, d: 0.400, color: "#6a8a9a" },
  "staticobj_wall_indcnc4_low_4":     { w: 4.052, h:  2.100, d: 0.400, color: "#6a8a9a" },
  "staticobj_wall_indcnc2_3":         { w: 3.000, h:  4.002, d: 0.400, color: "#5a7080" },
  "staticobj_wall_indcnc3_1_4":       { w: 6.029, h:  3.605, d: 0.322, color: "#607d8b" },
  "staticobj_wall_indcnc3_2_4":       { w: 6.029, h:  3.605, d: 0.322, color: "#607d8b" },
  "staticobj_wall_indcnc_end_2":      { w: 2.055, h:  3.499, d: 1.294, color: "#4a6270" },
  "staticobj_wall_indcnc_end_3":      { w: 2.372, h:  1.468, d: 1.931, color: "#4a6270" },
  "staticobj_wall_indcnc_pole":       { w: 0.244, h:  3.499, d: 0.259, color: "#4a6270" },

  // ── MILITARY CONCRETE ────────────────────────────────────────────────────
  "staticobj_wall_milcnc_4":          { w: 4.052, h:  4.744, d: 1.096, color: "#78909c" },
  "staticobj_wall_milcncbarrier":     { w: 4.012, h:  0.805, d: 0.487, color: "#78909c" },
  "staticobj_wall_milcnc_corner":     { w: 1.538, h:  4.727, d: 1.532, color: "#78909c" },

  // ── CNC BARRIER (bliss) ───────────────────────────────────────────────────
  "staticobj_wall_cncbarrier_block":  { w: 9.083, h:  1.835, d: 1.969, color: "#8a8a8a" },
  "staticobj_wall_cncbarrier_4block": { w: 7.594, h:  1.969, d: 1.833, color: "#8a8a8a" },

  // ── BARRICADE / CANAL ─────────────────────────────────────────────────────
  "staticobj_wall_barricade1_10":     { w: 8.050, h: 10.552, d: 2.433, color: "#7a7060" },
  "staticobj_wall_barricade1_4":      { w: 8.486, h:  4.019, d: 1.645, color: "#7a7060" },
  "staticobj_wall_canal_10":          { w:10.100, h:  5.476, d: 4.090, color: "#808070" },

  // ── STONE / CASTLE WALLS ─────────────────────────────────────────────────
  "staticobj_castle_wall3":           { w: 8.000, h:  2.000, d: 0.600, color: "#9e8b6c" },
  "staticobj_wall_stone2":            { w: 9.408, h:  1.572, d: 1.452, color: "#c8b99a" },
  "staticobj_wall_stone":             { w:10.060, h:  2.034, d: 1.950, color: "#6a6a6a" },
  "staticobj_wall_stoned":            { w: 8.131, h: 11.932, d: 1.622, color: "#5a5a5a" },
  "staticobj_wall_stone2d":           { w: 8.569, h: 11.143, d: 1.420, color: "#b0a090" },
  "land_castle_wall1_20":             { w: 7.671, h: 26.845, d:17.191, color: "#795548" },
  "land_castle_wall2_30":             { w: 6.274, h: 30.534, d:19.991, color: "#6d4c41" },
  "land_castle_bastion":              { w:26.973, h: 17.180, d:19.425, color: "#7a6a5a" },
  "land_castle_bergfrit":             { w:11.760, h: 36.677, d:15.566, color: "#7a6a5a" },
  "land_castle_bergfrit2":            { w:11.715, h: 36.676, d:15.585, color: "#7a6a5a" },
  "land_castle_donjon":               { w:15.198, h: 28.807, d:15.198, color: "#7a6060" },
  "land_castle_gate":                 { w:21.068, h: 17.189, d:21.289, color: "#7a6a5a" },
  "land_castle_stairs":               { w: 6.969, h: 20.319, d:17.154, color: "#7a6a5a" },
  "land_castle_walls_10":             { w: 7.821, h: 11.351, d: 5.300, color: "#7a6a5a" },
  "land_castle_walls_end":            { w: 7.841, h:  5.696, d: 5.007, color: "#7a6a5a" },
  "land_castle_wall1_corner1":        { w: 7.305, h:  5.296, d:16.963, color: "#795548" },
  "land_castle_wall1_corner2":        { w: 7.788, h: 17.404, d: 4.604, color: "#795548" },
  "land_castle_wall1_end1":           { w: 7.666, h: 23.250, d:16.963, color: "#795548" },
  "land_castle_wall2_corner1":        { w: 6.732, h:  6.598, d:19.921, color: "#6d4c41" },
  "land_castle_wall2_corner2":        { w: 7.821, h: 10.837, d:19.909, color: "#6d4c41" },
  "land_castle_wall2_end1":           { w: 2.445, h: 39.708, d:23.915, color: "#6d4c41" },
  "land_castle_wall2_end2":           { w: 8.064, h: 26.471, d:19.924, color: "#6d4c41" },

  // ── FENCE WALLS ──────────────────────────────────────────────────────────
  "staticobj_wall_fen1_5":            { w: 5.013, h:  3.095, d: 0.167, color: "#6a7a6a" },
  "staticobj_wall_fen1_5_2":          { w: 5.051, h:  3.095, d: 0.174, color: "#6a7a6a" },
  "staticobj_wall_fen2_6":            { w: 6.041, h:  2.344, d: 0.363, color: "#6a7060" },
  "staticobj_wall_fen3_4":            { w: 4.031, h:  2.563, d: 0.200, color: "#6a7060" },
  "staticobj_wall_fen3_8":            { w: 8.027, h:  2.533, d: 0.200, color: "#6a7060" },
  "staticobj_wall_fen4_4":            { w: 4.039, h:  3.402, d: 0.209, color: "#6a7a6a" },
  "staticobj_wall_fen4_8":            { w: 8.035, h:  3.402, d: 0.226, color: "#6a7a6a" },
  "staticobj_wall_fen5_5":            { w: 5.227, h:  2.848, d: 1.276, color: "#7a8a7a" },
  "staticobj_wall_fen5_10":           { w:10.184, h:  2.848, d: 1.279, color: "#7a8a7a" },
  "staticobj_wall_fen6_8":            { w: 8.336, h:  2.249, d: 0.502, color: "#6a7060" },
  "staticobj_wall_fen7_4":            { w: 4.129, h:  1.500, d: 1.098, color: "#6a7060" },
  "staticobj_wall_indfnc_9":          { w:10.005, h:  3.373, d: 0.386, color: "#6a7a6a" },
  "staticobj_wall_indfnc_3":          { w: 3.005, h:  3.373, d: 0.353, color: "#6a7a6a" },
  "staticobj_wall_indfnc_3_hole":     { w: 3.005, h:  3.378, d: 0.697, color: "#6a7a6a" },
  "staticobj_wall_indfnc2_9":         { w: 9.037, h:  3.384, d: 0.406, color: "#607a60" },
  "staticobj_wall_indfnc2_3":         { w: 3.037, h:  3.384, d: 0.525, color: "#607a60" },
  "staticobj_wall_fenstadium":        { w: 5.124, h:  4.812, d: 0.326, color: "#8a8a8a" },
  "staticobj_wall_fenvineyard":       { w: 8.324, h:  2.062, d: 0.305, color: "#8a7060" },
  "staticobj_wall_fenforest_5":       { w: 9.493, h:  5.034, d: 2.568, color: "#8a9a8a" },
  "staticobj_wall_pipefence_4":       { w: 4.122, h:  1.411, d: 0.125, color: "#7a7a7a" },
  "staticobj_wall_pipefence_8":       { w: 8.124, h:  1.409, d: 0.140, color: "#7a7a7a" },
  "staticobj_wall_pipefencewall_8":   { w: 8.026, h:  4.488, d: 0.715, color: "#7a7a7a" },
  "staticobj_wall_silagewall_5":      { w: 5.108, h:  4.100, d: 2.344, color: "#8a9a80" },

  // ── TIN / METAL WALLS ─────────────────────────────────────────────────────
  "staticobj_wall_tin_5":             { w: 5.301, h:  2.645, d: 0.301, color: "#7a8a7a" },
  "staticobj_wall_tin_4":             { w: 4.000, h:  2.900, d: 0.233, color: "#7a8a7a" },
  "staticobj_wall_tin6_1_4":          { w: 4.107, h:  2.297, d: 0.216, color: "#7a8070" },
  "staticobj_wall_tin6_2_4":          { w: 4.097, h:  2.059, d: 0.203, color: "#7a8070" },
  "staticobj_wall_tin7_8":            { w: 8.071, h:  3.634, d: 0.184, color: "#808070" },
  "staticobj_wall_tin7_4":            { w: 9.908, h:  4.134, d: 3.634, color: "#808070" },
  "staticobj_wall_tincom_3":          { w: 3.075, h:  3.000, d: 0.364, color: "#7a7a70" },

  // ── WOOD WALLS ───────────────────────────────────────────────────────────
  "staticobj_wall_wood1_5":           { w: 5.006, h:  1.958, d: 0.095, color: "#8d6e40" },
  "staticobj_wall_wood2_5":           { w: 5.000, h:  2.003, d: 0.095, color: "#8d6e40" },
  "staticobj_wall_wood3_4":           { w: 3.605, h:  1.867, d: 0.287, color: "#8d6e40" },
  "staticobj_wall_wood4_4":           { w: 3.888, h:  2.210, d: 0.452, color: "#8d6e40" },
  "staticobj_wall_woodf_5":           { w: 9.882, h:  5.225, d: 2.088, color: "#9a7a50" },
  "staticobj_wall_woodvil_4":         { w: 4.000, h:  2.019, d: 0.178, color: "#8d6e40" },
  "staticobj_wall_indvar1_5":         { w: 6.348, h:  3.802, d: 0.707, color: "#7a7060" },
  "staticobj_wall_indvar2_5":         { w: 5.054, h:  3.297, d: 0.566, color: "#7a7060" },
  "staticobj_wall_indvar3_5":         { w: 9.717, h:  5.054, d: 3.297, color: "#6a6a60" },

  // ── BRICK WALLS ───────────────────────────────────────────────────────────
  "staticobj_wall_cbrk_5":            { w: 5.012, h:  2.537, d: 0.621, color: "#9a7a70" },
  "staticobj_wall_cgry_5":            { w: 9.689, h:  5.010, d: 2.660, color: "#909090" },
  "staticobj_wall_cgrylow_5":         { w: 5.000, h:  1.537, d: 0.492, color: "#909090" },
  "staticobj_wall_cyel_5":            { w: 5.000, h:  2.592, d: 0.554, color: "#c8b870" },

  // ── MISC WALLS ─────────────────────────────────────────────────────────────
  "staticobj_wall_fenw_7":            { w: 1.484, h:  7.050, d: 2.061, color: "#8080a0" },
  "staticobj_wall_gate_ind3":         { w: 4.000, h:  4.000, d: 2.000, color: "#606060" },

  // ── FLOORS / PLATFORMS ───────────────────────────────────────────────────
  "staticobj_platform1_block":        { w: 2.000, h:  0.400, d: 2.000, color: "#999999" },
  "staticobj_misc_timbers_log4":      { w: 4.000, h:  0.400, d: 0.400, color: "#8d6e40" },
  "staticobj_misc_concretepanels":    { w: 2.295, h:  1.563, d: 3.366, color: "#888888" },

  // ── BRIDGES & PIERS ──────────────────────────────────────────────────────
  "staticobj_bridge_wood_50":         { w:50.000, h:  1.000, d: 4.000, color: "#7e5233" },
  "staticobj_bridge_wood_25":         { w:25.000, h:  1.000, d: 4.000, color: "#7e5233" },
  "land_woodenpier_15m":              { w:15.000, h:  1.000, d: 4.000, color: "#7e5233" },
  "staticobj_pier_wooden1":           { w:40.590, h:  5.231, d: 4.059, color: "#7e5233" },
  "staticobj_pier_concrete2":         { w:40.000, h: 48.000, d:20.070, color: "#888888" },
  "staticobj_boathouse":              { w:17.908, h: 17.925, d:21.274, color: "#7e5233" },
  "staticobj_lighthouse":             { w: 5.932, h:  8.137, d:19.912, color: "#e0e0e0" },

  // ── BARRIERS ─────────────────────────────────────────────────────────────
  "staticobj_mil_hbarrier_big":       { w:10.387, h:  2.939, d: 4.154, color: "#8a7a6a" },
  "staticobj_mil_hbarrier_6m":        { w: 6.855, h:  1.836, d: 2.660, color: "#8a7a6a" },
  "staticobj_mil_hbarrier_4m":        { w: 4.712, h:  1.657, d: 2.581, color: "#8a7a6a" },
  "staticobj_mil_hbarrier_1m":        { w: 2.279, h:  1.738, d: 2.538, color: "#8a7a6a" },
  "staticobj_mil_hbarrier_round":     { w: 6.817, h:  1.843, d: 3.523, color: "#8a7a6a" },
  "staticobj_roadblock_cncblock":     { w: 0.942, h:  0.698, d: 2.655, color: "#8a8a8a" },
  "staticobj_roadblock_cncblocks_long":{ w: 0.966, h: 1.378, d: 6.090, color: "#8a8a8a" },
  "staticobj_roadblock_cncblocks_short":{ w: 0.915,h: 1.354, d: 2.646, color: "#8a8a8a" },
  "staticobj_roadblock_pillbox":      { w: 5.640, h:  2.254, d: 5.209, color: "#8a8080" },
  "staticobj_misc_dragonteeth":       { w: 2.000, h:  1.200, d: 2.000, color: "#909090" },
  "staticobj_misc_dragonteeth_big":   { w: 2.500, h:  1.600, d: 2.500, color: "#909090" },
  "staticobj_misc_hedgehog_concrete": { w: 1.500, h:  1.500, d: 1.500, color: "#909090" },
  "staticobj_misc_hedgehog_iron":     { w: 1.500, h:  1.500, d: 1.500, color: "#707070" },
  "staticobj_misc_razorwire":         { w: 3.000, h:  0.500, d: 0.500, color: "#8a8a8a" },
  "staticobj_misc_barbedwire":        { w: 3.000, h:  0.500, d: 0.500, color: "#7a7a7a" },
  "staticobj_misc_bagfence_3m":       { w: 3.000, h:  1.000, d: 1.500, color: "#8a7a60" },
  "staticobj_misc_concreteblock1":    { w: 0.400, h:  0.505, d: 1.005, color: "#909090" },
  "staticobj_misc_concreteblock2":    { w: 2.600, h:  0.779, d: 0.363, color: "#909090" },

  // ── CONTAINERS ───────────────────────────────────────────────────────────
  "land_container_1bo":               { w: 2.702, h:  2.782, d:10.000, color: "#4a4a4a" },
  "land_container_1mo":               { w: 2.702, h:  2.782, d:10.000, color: "#5a5a4a" },
  "land_container_1moh":              { w: 2.702, h:  2.782, d:10.000, color: "#4a5a4a" },
  "land_container_1aoh":              { w: 2.705, h:  2.782, d:10.000, color: "#5a4a4a" },
  "land_container_1a":                { w: 6.714, h:  2.661, d: 2.705, color: "#3a4a5a" },
  "land_container_1b":                { w: 6.714, h:  2.661, d: 2.668, color: "#4a3a4a" },
  "land_container_1c":                { w: 6.714, h:  2.661, d: 2.668, color: "#3a4a3a" },
  "land_container_2a":                { w: 6.714, h:  2.672, d: 5.227, color: "#3a4a5a" },
  "land_container_2b":                { w: 6.669, h:  2.889, d: 5.231, color: "#3a3a5a" },
  "land_containerlocked":             { w: 2.702, h:  2.782, d:10.000, color: "#4a4a5a" },

  // ── CYLINDRICAL TANKS ────────────────────────────────────────────────────
  "land_dieselpowerplant_tank_big":   { w:18.068, h:  8.778, d:19.375, color: "#4a4a5a" },
  "land_dieselpowerplant_tank_small": { w: 6.066, h:  7.868, d:12.420, color: "#5a5a6a" },
  "land_dieselpowerplant_building":   { w:46.781, h: 24.791, d:42.020, color: "#4a5060" },
  "land_dieselpowerplant_cooling":    { w:10.103, h:  7.631, d: 7.268, color: "#5a6070" },
  "land_dieselpowerplant_transformer":{ w: 8.101, h:  3.735, d: 4.502, color: "#5a6070" },
  "land_tank_big":                    { w: 2.554, h: 15.124, d:11.673, color: "#5a5a6a" },
  "land_tank_medium":                 { w: 8.936, h:  2.539, d: 1.887, color: "#5a5a6a" },
  "land_tank_small_gas":              { w: 8.631, h:  1.704, d: 2.499, color: "#6a6a5a" },
  "land_tank_small_rusty":            { w: 6.421, h:  2.832, d: 2.862, color: "#7a6a5a" },
  "land_tank_small_white":            { w: 6.421, h:  2.832, d: 2.862, color: "#e0e0e0" },

  // ── BUNKER PANELS ────────────────────────────────────────────────────────
  "land_bunker1_double":              { w:11.965, h:  5.134, d:10.805, color: "#5a6a5a" },
  "land_bunker1_left":                { w:13.202, h:  5.179, d: 8.789, color: "#5a6a5a" },
  "land_bunker1_right":               { w:13.109, h:  5.179, d: 8.788, color: "#5a6a5a" },
  "land_bunker2_double":              { w:11.965, h:  5.134, d:10.805, color: "#6a6a5a" },
  "land_bunker2_left":                { w:13.202, h:  5.179, d: 8.789, color: "#6a6a5a" },
  "land_bunker2_right":               { w:13.109, h:  5.179, d: 8.788, color: "#6a6a5a" },

  // ── MILITARY STRUCTURES ──────────────────────────────────────────────────
  "land_mil_guardbox_smooth":         { w: 2.646, h:  5.566, d: 4.560, color: "#708090" },
  "land_mil_guardbox_green":          { w: 2.646, h:  5.566, d: 4.560, color: "#5a7a5a" },
  "land_mil_guardbox_brown":          { w: 2.646, h:  5.566, d: 4.560, color: "#7a6a5a" },
  "land_mil_guardshed":               { w: 2.863, h:  4.032, d: 2.063, color: "#6a7a6a" },
  "land_mil_barracks_round":          { w: 4.361, h:  6.142, d: 4.900, color: "#5a6a5a" },
  "land_mil_barracks1":               { w:18.330, h:  7.902, d:11.116, color: "#5a6a5a" },
  "land_mil_barracks2":               { w:21.461, h:  6.732, d: 8.599, color: "#5a6060" },
  "land_mil_barracks3":               { w:18.784, h:  7.662, d:15.117, color: "#5a6a5a" },
  "land_mil_barracks4":               { w:16.199, h:  6.524, d: 7.901, color: "#5a6060" },
  "land_mil_barracks5":               { w:32.752, h: 15.620, d:20.704, color: "#5a6060" },
  "land_mil_barracks6":               { w:31.508, h: 11.836, d:16.085, color: "#5a6a5a" },
  "land_mil_guardhouse1":             { w:12.065, h:  5.867, d: 9.166, color: "#607570" },
  "land_mil_guardhouse2":             { w:14.843, h:  4.780, d: 9.081, color: "#607570" },
  "land_mil_guardtower":              { w: 5.327, h: 13.518, d:12.635, color: "#607570" },
  "land_mil_tower_small":             { w: 3.592, h:  9.542, d: 4.860, color: "#708070" },
  "land_mil_atc_big":                 { w:30.000, h: 35.660, d:42.510, color: "#708090" },
  "land_mil_atc_small":               { w:21.959, h: 24.602, d:15.183, color: "#708090" },
  "land_mil_reinforcedtank1":         { w:21.312, h:  6.684, d:21.018, color: "#5a6a5a" },
  "land_mil_reinforcedtank2":         { w:37.931, h: 11.954, d:37.931, color: "#5a6a5a" },
  "land_mil_fortified_nest_big":      { w:11.049, h:  3.817, d:11.020, color: "#6a7060" },
  "land_mil_fortified_nest_small":    { w: 5.001, h:  2.571, d: 4.583, color: "#6a7060" },
  "land_mil_fortified_nest_watchtower":{ w: 6.976, h:  5.959, d:10.460, color: "#6a7060" },
  "land_mil_aircraftshelter":         { w:39.986, h: 10.953, d:50.046, color: "#607060" },
  "land_mil_airfield_hq":             { w:19.692, h: 11.750, d:22.522, color: "#607070" },
  "land_mil_blastcover1":             { w:35.001, h:  3.982, d:23.874, color: "#5a6a50" },
  "land_mil_blastcover2":             { w:34.665, h:  4.087, d:16.185, color: "#5a6a50" },
  "land_mil_blastcover3":             { w:27.297, h:  4.022, d:23.697, color: "#5a6a50" },
  "land_mil_blastcover4":             { w:53.040, h:  4.152, d:16.070, color: "#5a6a50" },
  "land_mil_radar_mobile1":           { w: 4.253, h: 13.968, d:14.817, color: "#708090" },
  "land_mil_radar_mobile2":           { w:16.504, h: 12.280, d:11.339, color: "#708090" },
  "land_mil_tent_big1_1":             { w: 6.181, h:  3.298, d: 7.704, color: "#6a7060" },
  "land_mil_tent_big2_1":             { w:10.270, h:  4.494, d: 6.012, color: "#6a7060" },
  "land_mil_tent_big3":               { w:15.671, h:  4.212, d:21.081, color: "#6a7060" },
  "land_mil_controltower":            { w:10.149, h: 18.267, d:10.118, color: "#708090" },

  // ── TISY MILITARY COMPLEX ─────────────────────────────────────────────────
  "land_tisy_barracks":               { w:35.890, h: 13.810, d:14.338, color: "#506060" },
  "land_tisy_hq":                     { w:34.596, h: 15.776, d:39.512, color: "#506060" },
  "land_tisy_garages":                { w:30.813, h:  8.142, d:42.362, color: "#506060" },
  "land_tisy_garages2":               { w:60.213, h:  8.890, d:43.350, color: "#506060" },
  "land_tisy_airshaft":               { w: 2.543, h:  5.912, d: 2.549, color: "#607070" },
  "land_tisy_base_cooler":            { w: 7.760, h:  8.307, d: 5.759, color: "#607070" },
  "land_tisy_kitchenroom":            { w:17.464, h: 11.000, d:28.666, color: "#607070" },
  "land_tisy_radarb_base":            { w:45.523, h: 10.162, d:24.748, color: "#708090" },
  "land_tisy_radarplatform_bot":      { w: 7.243, h: 11.180, d:43.128, color: "#708090" },
  "land_tisy_radarplatform_mid":      { w: 7.243, h: 18.349, d:32.144, color: "#708090" },
  "land_tisy_radarplatform_top":      { w:24.838, h: 19.818, d:41.297, color: "#708090" },

  // ── PRISON ───────────────────────────────────────────────────────────────
  "land_prison_main":                 { w:40.198, h: 39.494, d:47.455, color: "#7a7060" },
  "land_prison_side":                 { w:32.997, h: 16.147, d:21.652, color: "#7a7060" },
  "land_prison_wall_large":           { w:36.244, h:  9.531, d:11.673, color: "#80806a" },
  "land_prison_wall_small":           { w: 8.126, h: 17.255, d: 9.562, color: "#80806a" },

  // ── SMOKESTACKS ──────────────────────────────────────────────────────────
  "land_smokestack_big":              { w:19.879, h: 68.075, d:14.689, color: "#5a5a5a" },
  "land_smokestack_medium":           { w: 8.000, h: 48.800, d: 9.552, color: "#5a5a5a" },
  "land_smokestack_metal":            { w: 6.835, h: 38.337, d: 7.038, color: "#666666" },
  "land_smokestack_brick":            { w: 4.993, h: 31.626, d: 7.683, color: "#7a5a50" },
  "land_smokestack_big_ruin_low":     { w: 5.487, h: 23.422, d: 6.342, color: "#5a5a5a" },
  "land_smokestack_big_ruin_mid":     { w: 6.248, h: 22.154, d: 6.233, color: "#5a5a5a" },

  // ── TOWERS ───────────────────────────────────────────────────────────────
  "land_tower_tc1":                   { w: 5.155, h: 30.975, d: 5.173, color: "#888888" },
  "land_tower_tc2_base":              { w:19.730, h: 50.183, d:19.608, color: "#7a7a7a" },
  "land_tower_tc2_mid":               { w: 9.486, h: 49.943, d: 8.727, color: "#7a7a7a" },
  "land_tower_tc2_top":               { w: 8.477, h: 49.763, d: 8.725, color: "#7a7a7a" },
  "land_tower_tc3_grey":              { w:11.500, h: 50.503, d:11.500, color: "#888888" },
  "land_tower_tc3_red":               { w:11.500, h: 50.503, d:11.500, color: "#c04040" },
  "land_tower_tc4_base":              { w:24.531, h: 46.512, d:24.531, color: "#7a6a5a" },

  // ── AIRFIELD ─────────────────────────────────────────────────────────────
  "land_airfield_hangar_green":       { w:31.816, h: 13.710, d:51.593, color: "#4a6050" },
  "land_airfield_radar_tall":         { w: 4.752, h: 18.042, d:46.398, color: "#708090" },
  "land_airfield_servicehangar_l":    { w:43.649, h: 16.381, d:50.185, color: "#5a6050" },
  "land_airfield_servicehangar_r":    { w:42.893, h: 14.485, d:49.582, color: "#5a6050" },
  "land_mil_aircraftshelter_door_l":  { w: 6.908, h:  7.474, d: 2.449, color: "#607060" },
  "land_mil_aircraftshelter_door_r":  { w: 6.908, h:  7.474, d: 2.449, color: "#607060" },

  // ── PROPS ─────────────────────────────────────────────────────────────────
  "barrel_blue":                      { w: 0.700, h:  0.900, d: 0.700, color: "#2980b9" },
  "barrel_red":                       { w: 0.700, h:  0.900, d: 0.700, color: "#c0392b" },
  "barrel_yellow":                    { w: 0.700, h:  0.900, d: 0.700, color: "#f1c40f" },
  "barrel_green":                     { w: 0.700, h:  0.900, d: 0.700, color: "#27ae60" },
  "staticobj_misc_supplybox1":        { w: 1.000, h:  0.600, d: 0.800, color: "#8a7060" },
  "staticobj_misc_supplybox2":        { w: 1.500, h:  0.800, d: 1.000, color: "#8a7060" },
  "staticobj_misc_supplybox3":        { w: 2.000, h:  1.000, d: 1.200, color: "#8a7060" },
  "staticobj_misc_flagpole":          { w: 0.100, h:  6.000, d: 0.100, color: "#aaaaaa" },
  "staticobj_misc_gunrack":           { w: 2.000, h:  1.500, d: 0.500, color: "#707070" },

  // ── PIPES & TUBES ─────────────────────────────────────────────────────────
  "staticobj_misc_concretepipe":           { w: 2.805, h:  2.666, d: 3.814, color: "#7a7a7a" },
  "staticobj_misc_concretepipe_gate":      { w: 2.224, h:  2.224, d: 0.142, color: "#7a7a7a" },
  "staticobj_misc_boundarystone_tube":     { w: 0.300, h:  1.800, d: 0.300, color: "#6a5a4a" },
  "staticobj_pier_tube_big":               { w: 1.077, h: 19.950, d: 1.077, color: "#5a5a5a" },
  "staticobj_pier_tube_small":             { w: 0.833, h: 13.000, d: 0.850, color: "#5a5a5a" },
  "staticobj_pipe_big_18m":               { w: 4.184, h:  4.184, d:18.912, color: "#666666" },
  "staticobj_pipe_big_9m":                { w: 5.132, h:  4.415, d: 8.778, color: "#666666" },
  "staticobj_pipe_big_buildl":            { w:15.719, h:  9.004, d:10.349, color: "#666666" },
  "staticobj_pipe_big_cornerl":           { w: 6.497, h:  9.118, d: 6.385, color: "#666666" },
  "staticobj_pipe_med_9m":                { w: 8.735, h:  8.834, d: 6.596, color: "#6a6a6a" },
  "staticobj_pipe_medl_cornerl":          { w: 7.317, h:  4.241, d: 6.596, color: "#6a6a6a" },
  "staticobj_pipe_small_20m":             { w: 0.837, h:  1.704, d:21.818, color: "#707070" },
  "staticobj_pipe_small_broken":          { w: 0.834, h:  1.704, d: 7.594, color: "#707070" },
  "staticobj_pipe_small_l90":             { w: 3.117, h:  1.704, d: 3.580, color: "#707070" },
  "staticobj_pipe_small_l45":             { w: 2.349, h:  1.704, d: 4.959, color: "#707070" },
  "staticobj_pipe_small_r90":             { w: 3.116, h:  1.706, d: 3.580, color: "#707070" },
  "staticobj_pipe_small_r45":             { w: 2.336, h:  1.704, d: 4.933, color: "#707070" },
  "staticobj_pipe_small_u":               { w: 0.834, h:  4.957, d: 9.309, color: "#707070" },
  "staticobj_pipe_small_stairs":          { w: 8.929, h:  3.464, d: 7.594, color: "#707070" },
  "staticobj_pipe_small2_24m":            { w: 3.972, h:  3.434, d:25.415, color: "#6a6a6a" },
  "staticobj_pipe_small2_8m":             { w: 5.093, h:  2.987, d: 3.513, color: "#6a6a6a" },
  "staticobj_pipe_small2_high_24m":       { w: 3.995, h: 12.962, d:25.538, color: "#6a6a6a" },
  "staticobj_pipe_small2_high_8m":        { w: 5.085, h:  2.589, d:12.878, color: "#6a6a6a" },
  "staticobj_pipe_small2_curve":          { w: 3.090, h:  3.499, d: 3.804, color: "#6a6a6a" },
  "staticobj_pipe_small2_high_curve":     { w: 4.195, h: 13.047, d: 3.994, color: "#6a6a6a" },
  "staticobj_pipe_small2_block":          { w: 2.589, h: 12.742, d: 9.829, color: "#6a6a6a" },

  // ── MONUMENTS ─────────────────────────────────────────────────────────────
  "staticobj_monument_war1":          { w:12.516, h: 11.414, d:16.214, color: "#8a8a8a" },
  "staticobj_monument_war2":          { w:16.686, h: 10.946, d:13.794, color: "#8a8a8a" },
  "staticobj_monument_t34":           { w:16.588, h:  6.564, d:12.710, color: "#606060" },
  "staticobj_monument_soldiers":      { w:11.668, h: 10.005, d: 9.395, color: "#8a8a8a" },
  "staticobj_monument_wall":          { w: 3.766, h:  2.497, d: 0.487, color: "#8a8a8a" },
  "land_monument_mig21":              { w:39.004, h: 14.314, d: 7.128, color: "#8090a0" },
  "land_statue_general":              { w: 7.960, h:  3.759, d:12.423, color: "#8a8a8a" },

  // ── WRECKS ───────────────────────────────────────────────────────────────
  "wreck_ship_large_front":           { w:15.000, h:  7.000, d:10.000, color: "#5a6a7a" },
  "wreck_ship_large_mid":             { w:15.000, h:  6.000, d:10.000, color: "#5a6a7a" },
  "wreck_ship_large_back":            { w:15.000, h:  7.000, d:10.000, color: "#5a6a7a" },
  "staticobj_wreck_mining_excavator": { w:19.315, h: 20.530, d:30.150, color: "#5a5560" },
  "staticobj_wreck_mining_haultruck": { w:11.536, h:  8.413, d:17.434, color: "#5a5560" },
  "staticobj_wreck_tractor":          { w: 2.295, h:  2.792, d: 3.782, color: "#6a6050" },
  "staticobj_boat_small4":            { w: 3.779, h:  3.923, d: 2.297, color: "#5a6a7a" },
  "staticobj_boat_small5":            { w: 2.880, h:  2.669, d:10.956, color: "#5a6a7a" },
  "staticobj_boat_small6":            { w: 1.815, h:  6.890, d: 5.470, color: "#5a6a7a" },
};

const FALLBACK: MimicDef = { w: 2, h: 2, d: 2, color: "#4a7a50" };

export function getMimic(classname: string): MimicDef {
  if (!classname) return FALLBACK;
  const key = classname.toLowerCase();
  if (MIMICS[key]) return MIMICS[key];

  // Fuzzy fallbacks — ordered most-specific first
  if (key.includes("indcnch"))              return { w: 9.50, h:  1.1,  d: 9.50, color: "#607d8b" };
  if (key.includes("indcnc4_low"))          return { w: 8.00, h:  2.1,  d: 0.40, color: "#6a8a9a" };
  if (key.includes("indcnc4"))              return { w: 8.00, h:  3.00, d: 0.40, color: "#5a7a8a" };
  if (key.includes("indcnc"))               return { w: 9.00, h:  9.76, d: 1.00, color: "#546e7a" };
  if (key.includes("milcnc"))               return { w: 4.05, h:  4.74, d: 1.10, color: "#78909c" };
  if (key.includes("cncsmall_4"))           return { w: 4.02, h:  2.32, d: 0.54, color: "#aaaaaa" };
  if (key.includes("cncsmall") || key.includes("wall_cnc")) return { w: 8.01, h: 2.30, d: 0.53, color: "#aaaaaa" };
  if (key.includes("cncbarrier"))           return { w: 9.00, h:  1.84, d: 1.97, color: "#8a8a8a" };
  if (key.includes("barricade1"))           return { w: 8.00, h:  7.00, d: 2.00, color: "#7a7060" };
  if (key.includes("castle_wall2"))         return { w: 6.30, h: 30.53, d:20.00, color: "#6d4c41" };
  if (key.includes("castle_wall1"))         return { w: 7.67, h: 26.85, d:17.19, color: "#795548" };
  if (key.includes("castle_wall"))          return { w: 8.00, h:  2.00, d: 0.60, color: "#9e8b6c" };
  if (key.includes("wall_stone2"))          return { w: 9.41, h:  1.57, d: 1.45, color: "#c8b99a" };
  if (key.includes("wall_stone"))           return { w:10.06, h:  2.03, d: 1.95, color: "#6a6a6a" };
  if (key.includes("bunker2"))              return { w:12.00, h:  5.13, d:10.80, color: "#6a6a5a" };
  if (key.includes("bunker1"))              return { w:12.00, h:  5.13, d:10.80, color: "#5a6a5a" };
  if (key.includes("tank_big"))             return { w:18.07, h:  8.78, d:19.38, color: "#4a4a5a" };
  if (key.includes("tank_small"))           return { w: 6.07, h:  7.87, d:12.42, color: "#5a5a6a" };
  if (key.includes("container"))           return { w: 2.70, h:  2.78, d:10.00, color: "#3a3a3a" };
  if (key.includes("guardbox"))            return { w: 2.65, h:  5.57, d: 4.56, color: "#708090" };
  if (key.includes("barrel"))              return { w: 0.70, h:  0.90, d: 0.70, color: "#888888" };
  if (key.includes("hbarrier_big"))        return { w:10.39, h:  2.94, d: 4.15, color: "#8a7a6a" };
  if (key.includes("hbarrier"))            return { w: 6.00, h:  1.84, d: 2.66, color: "#8a7a6a" };
  if (key.includes("platform"))            return { w: 2.00, h:  0.40, d: 2.00, color: "#999999" };
  if (key.includes("pier_tube_big"))       return { w: 1.08, h: 19.95, d: 1.08, color: "#5a5a5a" };
  if (key.includes("pier_tube_small"))     return { w: 0.83, h: 13.00, d: 0.85, color: "#5a5a5a" };
  if (key.includes("pier") || key.includes("bridge")) return { w:15.00, h:  1.00, d: 4.00, color: "#7e5233" };
  if (key.includes("smokestack_big"))      return { w:19.88, h: 68.08, d:14.69, color: "#5a5a5a" };
  if (key.includes("smokestack"))          return { w: 8.00, h: 48.00, d: 8.00, color: "#5a5a5a" };
  if (key.includes("pipe_small"))          return { w: 0.84, h:  1.70, d:21.82, color: "#707070" };
  if (key.includes("pipe_big"))            return { w: 4.18, h:  4.18, d:18.91, color: "#666666" };
  if (key.includes("pipe_med"))            return { w: 8.74, h:  8.83, d: 6.60, color: "#6a6a6a" };
  if (key.includes("concretepipe"))        return { w: 2.81, h:  2.67, d: 3.81, color: "#7a7a7a" };
  if (key.includes("monument"))            return { w:12.52, h: 11.41, d:16.21, color: "#8a8a8a" };
  if (key.includes("mil_barracks"))        return { w:20.00, h:  8.00, d:12.00, color: "#5a6060" };
  if (key.includes("barracks_round"))      return { w: 4.36, h:  6.14, d: 4.90, color: "#5a6a5a" };
  if (key.includes("tisy"))               return { w:30.00, h: 12.00, d:30.00, color: "#506060" };
  if (key.includes("tower_tc"))           return { w:12.00, h: 50.00, d:12.00, color: "#7a7a7a" };
  if (key.includes("atc"))               return { w:25.00, h: 30.00, d:25.00, color: "#708090" };
  if (key.includes("hangar"))            return { w:35.00, h: 14.00, d:50.00, color: "#4a6050" };
  if (key.includes("blastcover"))        return { w:35.00, h:  4.00, d:20.00, color: "#5a6a50" };
  if (key.includes("fen5"))              return { w: 7.00, h:  2.85, d: 1.28, color: "#7a8a7a" };
  if (key.includes("indfnc"))            return { w: 6.00, h:  3.37, d: 0.40, color: "#6a7a6a" };
  if (key.includes("reinforcedtank"))    return { w:25.00, h:  8.00, d:25.00, color: "#5a6a5a" };

  return FALLBACK;
}
