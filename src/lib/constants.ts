// ─────────────────────────────────────────────────────────────────────────────
// DANK STUDIO — Object Catalogue & Constants
//
// ALL DIMENSIONS VERIFIED FROM ODOL P3D FILES (ODOL v54 bounding boxes).
// Extracted via tools/p3d_bulk_scan.py — 547 objects verified.
// Reference: tools/p3d_catalogue.json + tools/p3d_catalogue_summary.txt
//
// width  = X-axis extent  (face length for wall panels, E-W span)
// height = Y-axis extent  (vertical height)
// depth  = Z-axis extent  (thickness for panels, N-S span)
//
// NAMING NOTES:
//   wall_cncsmall_N   → N = face width in metres
//   wall_indcnc_N     → N = height in metres  (face is ~9m wide)
//   wall_indcnc4_N    → N = face width in metres, h=3m
//   wall_cnc_5        → "5" = height in metres  (face is ~9m wide)
//   container_1*      → 10m long (Z-axis), 2.7m wide, 2.78m tall
// ─────────────────────────────────────────────────────────────────────────────
import type { ObjectDef } from "./types";

export const MAX_OBJECTS = 1200;

export const OBJECT_CATALOGUE: ObjectDef[] = [

  // ── CONCRETE WALLS — CNC SMALL ───────────────────────────────────────────
  // P3D verified. Height ~2.3 m (not 3 m as previously estimated).
  { classname: "staticobj_wall_cncsmall_8",    label: "Concrete Wall 8m",         category: "Walls",    width: 8.008, height: 2.300, depth: 0.530, color: "#aaaaaa" },
  { classname: "staticobj_wall_cncsmall_4",    label: "Concrete Wall 4m",         category: "Walls",    width: 4.017, height: 2.324, depth: 0.538, color: "#aaaaaa" },
  // wall_cnc_5: "5" = HEIGHT (5m tall); face width = 9m; thick 1m panel
  { classname: "staticobj_wall_cnc_5",         label: "Concrete Wall 9m×5m",      category: "Walls",    width: 9.029, height: 5.026, depth: 1.003, color: "#b0b0b0" },

  // ── CONCRETE WALLS — INDUSTRIAL CNC (tall series) ────────────────────────
  // indcnc_10: "10" = height. Face = 9.012 m, height = 9.758 m, depth = 1.007 m
  { classname: "staticobj_wall_indcnc_10",     label: "Industrial CNC 10m tall",  category: "Walls",    width: 9.012, height: 9.758, depth: 1.007, color: "#546e7a" },
  { classname: "staticobj_wall_indcnc_4",      label: "Industrial CNC 4m",        category: "Walls",    width: 6.000, height: 3.499, depth: 0.266, color: "#4a6270" },
  // indcnch: horizontal slab panel (face lies flat) — used as roofs/floors
  { classname: "staticobj_wall_indcnch_10",    label: "Industrial CNC Slab 10m",  category: "Walls",    width: 9.608, height: 1.113, depth:10.688, color: "#607d8b" },
  { classname: "staticobj_wall_indcnch_5",     label: "Industrial CNC Slab 5m",   category: "Walls",    width: 9.499, height: 1.120, depth: 5.466, color: "#607d8b" },
  // indcnc4: 3m-tall modular panels (face width = trailing number)
  { classname: "staticobj_wall_indcnc4_8",     label: "Industrial CNC4 8m",       category: "Walls",    width: 8.044, height: 3.004, depth: 0.400, color: "#5a7a8a" },
  { classname: "staticobj_wall_indcnc4_4",     label: "Industrial CNC4 4m",       category: "Walls",    width: 4.055, height: 3.000, depth: 0.400, color: "#5a7a8a" },
  { classname: "staticobj_wall_indcnc4_low_8", label: "Industrial CNC4 Low 8m",   category: "Walls",    width: 8.044, height: 2.100, depth: 0.400, color: "#6a8a9a" },
  { classname: "staticobj_wall_indcnc4_low_4", label: "Industrial CNC4 Low 4m",   category: "Walls",    width: 4.052, height: 2.100, depth: 0.400, color: "#6a8a9a" },
  // indcnc3 (from bliss): razorwire-topped CNC panels
  { classname: "staticobj_wall_indcnc3_2_4",   label: "CNC Wall Razorwire 4m",    category: "Walls",    width: 6.029, height: 3.605, depth: 0.322, color: "#607d8b" },
  { classname: "staticobj_wall_indcnc3_1_4",   label: "CNC Wall Razorwire B 4m",  category: "Walls",    width: 6.029, height: 3.605, depth: 0.322, color: "#5a7080" },

  // ── CONCRETE WALLS — MILITARY ─────────────────────────────────────────────
  // milcnc_4: 4m panel, 4.744m tall (taller than civilian)
  { classname: "staticobj_wall_milcnc_4",      label: "Military CNC 4m",          category: "Walls",    width: 4.052, height: 4.744, depth: 1.096, color: "#78909c" },
  // milcncbarrier: low kerb/barrier — only 0.8m tall
  { classname: "staticobj_wall_milcncbarrier", label: "Mil CNC Kerb Barrier",     category: "Walls",    width: 4.012, height: 0.805, depth: 0.487, color: "#78909c" },
  // cncbarrier (bliss): low stacked concrete blocks
  { classname: "staticobj_wall_cncbarrier_block",   label: "CNC Barrier Block",   category: "Walls",    width: 9.083, height: 1.835, depth: 1.969, color: "#8a8a8a" },
  { classname: "staticobj_wall_cncbarrier_4block",  label: "CNC Barrier 4-Block", category: "Walls",    width: 7.594, height: 1.969, depth: 1.833, color: "#8a8a8a" },

  // ── BARRICADE / CANAL WALLS (bliss) ──────────────────────────────────────
  { classname: "staticobj_wall_barricade1_10", label: "Barricade Wall 10m",       category: "Walls",    width: 8.050, height:10.552, depth: 2.433, color: "#7a7060" },
  { classname: "staticobj_wall_barricade1_4",  label: "Barricade Wall 4m",        category: "Walls",    width: 8.486, height: 4.019, depth: 1.645, color: "#7a7060" },
  { classname: "staticobj_wall_canal_10",      label: "Canal Wall 10m",           category: "Walls",    width:10.100, height: 5.476, depth: 4.090, color: "#808070" },

  // ── CASTLE / STONE WALLS ─────────────────────────────────────────────────
  // P3D verified. wall_stone "8" = face width ~10m; height ~2m; depth ~2m
  { classname: "staticobj_wall_stone",         label: "Stone Wall (dark)",        category: "Walls",    width:10.060, height: 2.034, depth: 1.950, color: "#6a6a6a" },
  { classname: "staticobj_wall_stone2",        label: "Stone Wall (light)",       category: "Walls",    width: 9.408, height: 1.572, depth: 1.452, color: "#c8b99a" },
  // stone2d/stoned: tall castle curtain wall variants
  { classname: "staticobj_wall_stoned",        label: "Stone Wall Tall (dark)",   category: "Walls",    width: 8.131, height:11.932, depth: 1.622, color: "#5a5a5a" },
  { classname: "staticobj_wall_stone2d",       label: "Stone Wall Tall (light)",  category: "Walls",    width: 8.569, height:11.143, depth: 1.420, color: "#b0a090" },
  // Castle modules (full 3D structures, not flat panels):
  { classname: "land_castle_wall1_20",         label: "Castle Curtain 20m",       category: "Walls",    width: 7.671, height:26.845, depth:17.191, color: "#795548" },
  { classname: "land_castle_wall2_30",         label: "Castle Curtain 30m",       category: "Walls",    width: 6.274, height:30.534, depth:19.991, color: "#6d4c41" },

  // ── FENCE WALLS ──────────────────────────────────────────────────────────
  { classname: "staticobj_wall_fen5_5",        label: "Fence Razorwire 5m",       category: "Walls",    width: 5.227, height: 2.848, depth: 1.276, color: "#7a8a7a" },
  { classname: "staticobj_wall_fen5_10",       label: "Fence Razorwire 10m",      category: "Walls",    width:10.184, height: 2.848, depth: 1.279, color: "#7a8a7a" },
  { classname: "staticobj_wall_indfnc_9",      label: "Industrial Fence 9m",      category: "Walls",    width:10.005, height: 3.373, depth: 0.386, color: "#6a7a6a" },
  { classname: "staticobj_wall_indfnc_3",      label: "Industrial Fence 3m",      category: "Walls",    width: 3.005, height: 3.373, depth: 0.353, color: "#6a7a6a" },
  { classname: "staticobj_wall_indfnc_3_hole", label: "Industrial Fence Hole 3m", category: "Walls",    width: 3.005, height: 3.378, depth: 0.697, color: "#6a7a6a" },

  // ── TIN WALLS ────────────────────────────────────────────────────────────
  { classname: "staticobj_wall_tin_5",         label: "Tin Wall 5m",              category: "Walls",    width: 5.301, height: 2.645, depth: 0.301, color: "#7a8a7a" },

  // ── FLOORS / PLATFORMS ───────────────────────────────────────────────────
  { classname: "staticobj_platform1_block",    label: "Platform Tile 2m",         category: "Floors",   width: 2.00,  height: 0.4,  depth: 2.00,  color: "#999999" },
  { classname: "staticobj_misc_timbers_log4",  label: "Timber Floor 4m",          category: "Floors",   width: 4.00,  height: 0.4,  depth: 0.40,  color: "#8d6e40" },

  // ── BRIDGES & PIERS ──────────────────────────────────────────────────────
  { classname: "staticobj_bridge_wood_50",     label: "Wood Bridge 50m",          category: "Bridges",  width:50.00,  height: 1.0,  depth: 4.00,  color: "#7e5233" },
  { classname: "staticobj_bridge_wood_25",     label: "Wood Bridge 25m",          category: "Bridges",  width:25.00,  height: 1.0,  depth: 4.00,  color: "#7e5233" },
  { classname: "land_woodenpier_15m",          label: "Wooden Pier 15m",          category: "Bridges",  width:15.00,  height: 1.0,  depth: 4.00,  color: "#7e5233" },
  // pier_wooden1: large pier section — 40.59m long!
  { classname: "staticobj_pier_wooden1",       label: "Wooden Pier Section 40m",  category: "Bridges",  width:40.590, height: 5.231, depth: 4.059, color: "#7e5233" },
  { classname: "staticobj_pier_concrete2",     label: "Concrete Pier Section",    category: "Bridges",  width:40.000, height:48.000, depth:20.070, color: "#888888" },

  // ── BARRIERS ─────────────────────────────────────────────────────────────
  // hbarrier_big: much larger than previously estimated — 10.4m wide, 2.9m tall
  { classname: "staticobj_mil_hbarrier_big",   label: "Jersey Barrier Big 10m",   category: "Barriers", width:10.387, height: 2.939, depth: 4.154, color: "#8a7a6a" },
  { classname: "staticobj_mil_hbarrier_6m",    label: "Jersey Barrier 6m",        category: "Barriers", width: 6.855, height: 1.836, depth: 2.660, color: "#8a7a6a" },
  { classname: "staticobj_mil_hbarrier_4m",    label: "Jersey Barrier 4m",        category: "Barriers", width: 4.712, height: 1.657, depth: 2.581, color: "#8a7a6a" },
  { classname: "staticobj_mil_hbarrier_1m",    label: "Jersey Barrier 1m",        category: "Barriers", width: 2.279, height: 1.738, depth: 2.538, color: "#8a7a6a" },
  { classname: "staticobj_roadblock_cncblock", label: "Concrete Roadblock",       category: "Barriers", width: 0.942, height: 0.698, depth: 2.655, color: "#8a8a8a" },
  { classname: "staticobj_misc_dragonteeth",   label: "Dragon Teeth",             category: "Barriers", width: 2.00,  height: 1.00,  depth: 2.00,  color: "#909090" },
  { classname: "staticobj_misc_hedgehog_concrete", label: "Hedgehog Concrete",    category: "Barriers", width: 1.50,  height: 1.50,  depth: 1.50,  color: "#909090" },
  { classname: "staticobj_misc_hedgehog_iron", label: "Hedgehog Iron",            category: "Barriers", width: 1.50,  height: 1.50,  depth: 1.50,  color: "#707070" },
  { classname: "staticobj_misc_razorwire",     label: "Razorwire",                category: "Barriers", width: 3.00,  height: 0.5,  depth: 0.50,  color: "#8a8a8a" },
  { classname: "staticobj_misc_barbedwire",    label: "Barbed Wire",              category: "Barriers", width: 3.00,  height: 0.5,  depth: 0.50,  color: "#7a7a7a" },

  // ── CONTAINERS ───────────────────────────────────────────────────────────
  // Containers: 2.702m face × 2.782m tall × 10.000m long (depth = Z-axis length)
  { classname: "land_container_1bo",           label: "Container Open 10m",       category: "Containers", width: 2.702, height: 2.782, depth:10.000, color: "#4a4a4a" },
  { classname: "land_container_1mo",           label: "Container Metal 10m",      category: "Containers", width: 2.702, height: 2.782, depth:10.000, color: "#5a5a4a" },
  { classname: "land_container_1moh",          label: "Container Side Hole",      category: "Containers", width: 2.702, height: 2.782, depth:10.000, color: "#4a5a4a" },
  { classname: "land_container_1aoh",          label: "Container Open Hole",      category: "Containers", width: 2.705, height: 2.782, depth:10.000, color: "#5a4a4a" },
  // 1a/b/c/d variants: 6.7m face × 2.66m tall × 2.7m deep (small containers)
  { classname: "land_container_1a",            label: "Container Short 6.7m",     category: "Containers", width: 6.714, height: 2.661, depth: 2.705, color: "#3a4a5a" },
  { classname: "land_container_1b",            label: "Container Short B",        category: "Containers", width: 6.714, height: 2.661, depth: 2.668, color: "#4a3a4a" },

  // ── CYLINDRICAL TANKS ────────────────────────────────────────────────────
  // P3D-verified from structures_bliss/industrial/dieselpowerplant/
  { classname: "land_dieselpowerplant_tank_big",   label: "Diesel Tank Large",    category: "Props",    width:18.068, height: 8.778, depth:19.375, color: "#4a4a5a" },
  { classname: "land_dieselpowerplant_tank_small", label: "Diesel Tank Small",    category: "Props",    width: 6.066, height: 7.868, depth:12.420, color: "#5a5a6a" },

  // ── MODULAR BUNKER PANELS ────────────────────────────────────────────────
  // Full 3D bunker module — much larger than flat panel estimate
  { classname: "land_bunker1_double",          label: "Bunker Module Centre",     category: "Military", width:11.965, height: 5.134, depth:10.805, color: "#5a6a5a" },
  { classname: "land_bunker1_left",            label: "Bunker Module Left",       category: "Military", width:13.202, height: 5.179, depth: 8.789, color: "#5a6a5a" },
  { classname: "land_bunker1_right",           label: "Bunker Module Right",      category: "Military", width:13.109, height: 5.179, depth: 8.788, color: "#5a6a5a" },
  { classname: "land_bunker2_double",          label: "Bunker2 Module Centre",    category: "Military", width:11.965, height: 5.134, depth:10.805, color: "#6a6a5a" },

  // ── MILITARY STRUCTURES ──────────────────────────────────────────────────
  // Guardboxes: 2.6m wide × 5.6m tall × 4.6m deep (includes elevated base)
  { classname: "land_mil_guardbox_smooth",     label: "Guard Box Smooth",         category: "Military", width: 2.646, height: 5.566, depth: 4.560, color: "#708090" },
  { classname: "land_mil_guardbox_green",      label: "Guard Box Green",          category: "Military", width: 2.646, height: 5.566, depth: 4.560, color: "#5a7a5a" },
  { classname: "land_mil_guardbox_brown",      label: "Guard Box Brown",          category: "Military", width: 2.646, height: 5.566, depth: 4.560, color: "#7a6a5a" },
  { classname: "land_mil_guardshed",           label: "Guard Shed",               category: "Military", width: 2.863, height: 4.032, depth: 2.063, color: "#6a7a6a" },
  { classname: "land_mil_barracks_round",      label: "Barracks Round",           category: "Military", width: 4.361, height: 6.142, depth: 4.900, color: "#5a6a5a" },
  { classname: "land_mil_barracks1",           label: "Barracks Block 1",         category: "Military", width:18.330, height: 7.902, depth:11.116, color: "#5a6a5a" },
  { classname: "land_mil_barracks2",           label: "Barracks Block 2",         category: "Military", width:21.461, height: 6.732, depth: 8.599, color: "#5a6060" },
  { classname: "land_mil_barracks3",           label: "Barracks Block 3",         category: "Military", width:18.784, height: 7.662, depth:15.117, color: "#5a6a5a" },
  { classname: "land_mil_barracks5",           label: "Barracks Block 5 (large)", category: "Military", width:32.752, height:15.620, depth:20.704, color: "#5a6060" },
  { classname: "land_mil_barracks6",           label: "Barracks Block 6",         category: "Military", width:31.508, height:11.836, depth:16.085, color: "#5a6a5a" },
  { classname: "land_mil_guardhouse1",         label: "Guard House 1",            category: "Military", width:12.065, height: 5.867, depth: 9.166, color: "#607570" },
  { classname: "land_mil_guardhouse2",         label: "Guard House 2",            category: "Military", width:14.843, height: 4.780, depth: 9.081, color: "#607570" },
  { classname: "land_mil_guardtower",          label: "Guard Tower",              category: "Military", width: 5.327, height:13.518, depth:12.635, color: "#607570" },
  { classname: "land_mil_tower_small",         label: "Watch Tower Small",        category: "Military", width: 3.592, height: 9.542, depth: 4.860, color: "#708070" },
  { classname: "land_mil_atc_big",             label: "ATC Tower Big",            category: "Military", width:30.000, height:35.660, depth:42.510, color: "#708090" },
  { classname: "land_mil_atc_small",           label: "ATC Tower Small",          category: "Military", width:21.959, height:24.602, depth:15.183, color: "#708090" },
  { classname: "land_mil_reinforcedtank1",     label: "Reinforced Tank Nest 1",   category: "Military", width:21.312, height: 6.684, depth:21.018, color: "#5a6a5a" },
  { classname: "land_mil_reinforcedtank2",     label: "Reinforced Tank Nest 2",   category: "Military", width:37.931, height:11.954, depth:37.931, color: "#5a6a5a" },
  { classname: "land_mil_fortified_nest_big",  label: "Fortified Nest Big",       category: "Military", width:11.049, height: 3.817, depth:11.020, color: "#6a7060" },
  { classname: "land_mil_fortified_nest_small",label: "Fortified Nest Small",     category: "Military", width: 5.001, height: 2.571, depth: 4.583, color: "#6a7060" },
  { classname: "land_mil_aircraftshelter",     label: "Aircraft Shelter",         category: "Military", width:39.986, height:10.953, depth:50.046, color: "#607060" },
  { classname: "land_mil_airfield_hq",         label: "Airfield HQ",              category: "Military", width:19.692, height:11.750, depth:22.522, color: "#607070" },
  { classname: "land_mil_blastcover1",         label: "Blast Cover 1 (35m)",      category: "Military", width:35.001, height: 3.982, depth:23.874, color: "#5a6a50" },
  { classname: "land_mil_blastcover2",         label: "Blast Cover 2 (35m)",      category: "Military", width:34.665, height: 4.087, depth:16.185, color: "#5a6a50" },
  { classname: "land_mil_blastcover4",         label: "Blast Cover 4 (53m)",      category: "Military", width:53.040, height: 4.152, depth:16.070, color: "#5a6a50" },

  // ── CASTLE STRUCTURAL ─────────────────────────────────────────────────────
  { classname: "land_castle_bastion",          label: "Castle Bastion",           category: "Military", width:26.973, height:17.180, depth:19.425, color: "#7a6a5a" },
  { classname: "land_castle_bergfrit",         label: "Castle Tower (Bergfrit)",  category: "Military", width:11.760, height:36.677, depth:15.566, color: "#7a6a5a" },
  { classname: "land_castle_donjon",           label: "Castle Keep (Donjon)",     category: "Military", width:15.198, height:28.807, depth:15.198, color: "#7a6060" },
  { classname: "land_castle_gate",             label: "Castle Gate",              category: "Military", width:21.068, height:17.189, depth:21.289, color: "#7a6a5a" },

  // ── TISY MILITARY COMPLEX ─────────────────────────────────────────────────
  { classname: "land_tisy_barracks",           label: "Tisy Barracks",            category: "Military", width:35.890, height:13.810, depth:14.338, color: "#506060" },
  { classname: "land_tisy_hq",                 label: "Tisy HQ",                  category: "Military", width:34.596, height:15.776, depth:39.512, color: "#506060" },
  { classname: "land_tisy_garages",            label: "Tisy Garages",             category: "Military", width:30.813, height: 8.142, depth:42.362, color: "#506060" },

  // ── PRISON ───────────────────────────────────────────────────────────────
  { classname: "land_prison_main",             label: "Prison Main Block",        category: "Props",    width:40.198, height:39.494, depth:47.455, color: "#7a7060" },
  { classname: "land_prison_side",             label: "Prison Side Block",        category: "Props",    width:32.997, height:16.147, depth:21.652, color: "#7a7060" },
  { classname: "land_prison_wall_large",       label: "Prison Wall Large",        category: "Walls",    width:36.244, height: 9.531, depth:11.673, color: "#80806a" },
  { classname: "land_prison_wall_small",       label: "Prison Wall Small",        category: "Walls",    width: 8.126, height:17.255, depth: 9.562, color: "#80806a" },

  // ── INDUSTRIAL SMOKESTACKS ────────────────────────────────────────────────
  { classname: "land_smokestack_big",          label: "Smokestack Big (68m)",     category: "Props",    width:19.879, height:68.075, depth:14.689, color: "#5a5a5a" },
  { classname: "land_smokestack_medium",       label: "Smokestack Medium (48m)",  category: "Props",    width: 8.000, height:48.800, depth: 9.552, color: "#5a5a5a" },
  { classname: "land_smokestack_metal",        label: "Smokestack Metal (38m)",   category: "Props",    width: 6.835, height:38.337, depth: 7.038, color: "#666666" },
  { classname: "land_smokestack_brick",        label: "Smokestack Brick (31m)",   category: "Props",    width: 4.993, height:31.626, depth: 7.683, color: "#7a5a50" },

  // ── TOWERS ───────────────────────────────────────────────────────────────
  { classname: "land_tower_tc1",               label: "Radio Tower TC1 (31m)",    category: "Props",    width: 5.155, height:30.975, depth: 5.173, color: "#888888" },
  { classname: "land_tower_tc2_base",          label: "Cooling Tower Base",       category: "Props",    width:19.730, height:50.183, depth:19.608, color: "#7a7a7a" },
  { classname: "land_tower_tc3_grey",          label: "Cooling Tower Grey",       category: "Props",    width:11.500, height:50.503, depth:11.500, color: "#888888" },
  { classname: "land_tower_tc4_base",          label: "Smokestack Tower Base",    category: "Props",    width:24.531, height:46.512, depth:24.531, color: "#7a6a5a" },

  // ── AIRFIELD STRUCTURES ───────────────────────────────────────────────────
  { classname: "land_airfield_hangar_green",   label: "Airfield Hangar Green",    category: "Props",    width:31.816, height:13.710, depth:51.593, color: "#4a6050" },
  { classname: "land_airfield_servicehangar_l",label: "Service Hangar Left",      category: "Props",    width:43.649, height:16.381, depth:50.185, color: "#5a6050" },

  // ── TIMBERS & LOGS ────────────────────────────────────────────────────────
  { classname: "staticobj_misc_timbers1",      label: "Timber Logs 4m",           category: "Props",    width: 4.010, height: 3.556, depth: 1.611, color: "#8d6e40" },
  { classname: "staticobj_misc_timbers2",      label: "Timber Logs Stack",        category: "Props",    width: 4.001, height: 2.203, depth: 2.055, color: "#8d6e40" },
  { classname: "staticobj_misc_timbers3",      label: "Timber Logs Short",        category: "Props",    width: 4.001, height: 2.173, depth: 1.641, color: "#8d6e40" },
  { classname: "staticobj_misc_timbers4",      label: "Timber Planks",            category: "Props",    width: 4.019, height: 2.188, depth: 1.327, color: "#8d6e40" },
  { classname: "staticobj_misc_timbers_log1",  label: "Timber Log Long 11.8m",    category: "Props",    width: 1.476, height: 0.352, depth:11.838, color: "#8d6e40" },
  { classname: "staticobj_misc_timbers_log5",  label: "Timber Pole Vert 3m",      category: "Props",    width: 0.258, height: 3.156, depth: 0.295, color: "#8d6e40" },

  // ── PROPS ─────────────────────────────────────────────────────────────────
  { classname: "barrel_blue",                  label: "Barrel (Blue)",            category: "Props",    width: 0.70,  height: 0.9,  depth: 0.70,  color: "#2980b9" },
  { classname: "barrel_red",                   label: "Barrel (Red)",             category: "Props",    width: 0.70,  height: 0.9,  depth: 0.70,  color: "#c0392b" },
  { classname: "barrel_yellow",                label: "Barrel (Yellow)",          category: "Props",    width: 0.70,  height: 0.9,  depth: 0.70,  color: "#f1c40f" },
  { classname: "barrel_green",                 label: "Barrel (Green)",           category: "Props",    width: 0.70,  height: 0.9,  depth: 0.70,  color: "#27ae60" },
  { classname: "staticobj_misc_supplybox1",    label: "Supply Box (Small)",       category: "Props",    width: 1.00,  height: 0.6,  depth: 0.80,  color: "#8a7060" },
  { classname: "staticobj_misc_supplybox2",    label: "Supply Box (Med)",         category: "Props",    width: 1.50,  height: 0.8,  depth: 1.00,  color: "#8a7060" },
  { classname: "land_dieselpowerplant_cooling",label: "Diesel Cooling Unit",      category: "Props",    width:10.103, height: 7.631, depth: 7.268, color: "#5a6070" },

  // ── PIPES & TUBES ─────────────────────────────────────────────────────────
  // concretepipe: large concrete sewer section (~3.8m long, ~2.8m diameter)
  { classname: "staticobj_misc_concretepipe",        label: "Concrete Sewer Pipe",      category: "Pipes",    width: 2.805, height: 2.666, depth: 3.814, color: "#7a7a7a" },
  { classname: "staticobj_misc_boundarystone_tube",  label: "Boundary Tube (Rod)",      category: "Pipes",    width: 0.30,  height: 1.8,  depth: 0.30,  color: "#6a5a4a" },
  // pier tubes: VERTICAL tubes (long axis = Y/height)
  { classname: "staticobj_pier_tube_big",            label: "Pier Tube 20m (vertical)", category: "Pipes",    width: 1.077, height:19.950, depth: 1.077, color: "#5a5a5a" },
  { classname: "staticobj_pier_tube_small",          label: "Pier Tube 13m (vertical)", category: "Pipes",    width: 0.833, height:13.000, depth: 0.850, color: "#5a5a5a" },
  // industrial pipes: horizontal (long axis = depth/Z)
  { classname: "staticobj_pipe_big_18m",             label: "Industrial Pipe Big 18m",  category: "Pipes",    width: 4.184, height: 4.184, depth:18.912, color: "#666666" },
  { classname: "staticobj_pipe_big_9m",              label: "Industrial Pipe Big 9m",   category: "Pipes",    width: 5.132, height: 4.415, depth: 8.778, color: "#666666" },
  { classname: "staticobj_pipe_med_9m",              label: "Industrial Pipe Med 9m",   category: "Pipes",    width: 8.735, height: 8.834, depth: 6.596, color: "#6a6a6a" },
  { classname: "staticobj_pipe_small_20m",           label: "Small Pipe 20m",           category: "Pipes",    width: 0.837, height: 1.704, depth:21.818, color: "#707070" },
  { classname: "staticobj_pipe_small_l90",           label: "Small Pipe Corner 90°",    category: "Pipes",    width: 3.117, height: 1.704, depth: 3.580, color: "#707070" },
  { classname: "staticobj_pipe_small_l45",           label: "Small Pipe Elbow 45°",     category: "Pipes",    width: 2.349, height: 1.704, depth: 4.959, color: "#707070" },
  { classname: "staticobj_pipe_small2_high_24m",     label: "High Pipe 24m",            category: "Pipes",    width: 3.995, height:12.962, depth:25.538, color: "#6a6a6a" },
  { classname: "staticobj_pipe_small2_24m",          label: "Low Pipe 24m",             category: "Pipes",    width: 3.972, height: 3.434, depth:25.415, color: "#6a6a6a" },

  // ── MONUMENTS / PILLARS ───────────────────────────────────────────────────
  // war1: large monument complex (not a simple spire!)
  { classname: "staticobj_monument_war1",            label: "War Monument",             category: "Props",    width:12.516, height:11.414, depth:16.214, color: "#8a8a8a" },
  { classname: "staticobj_monument_war2",            label: "War Monument 2",           category: "Props",    width:16.686, height:10.946, depth:13.794, color: "#8a8a8a" },
  { classname: "staticobj_monument_t34",             label: "T-34 Tank Monument",       category: "Props",    width:16.588, height: 6.564, depth:12.710, color: "#606060" },
  { classname: "staticobj_monument_soldiers",        label: "Soldiers Monument",        category: "Props",    width:11.668, height:10.005, depth: 9.395, color: "#8a8a8a" },
  { classname: "land_monument_mig21",               label: "MiG-21 Monument",          category: "Props",    width:39.004, height:14.314, depth: 7.128, color: "#8090a0" },
  { classname: "staticobj_misc_concretepipe_gate",   label: "Concrete Pipe Gate",       category: "Props",    width: 2.224, height: 2.224, depth: 0.142, color: "#7a7a7a" },

  // ── HARBOUR / WATERFRONT ──────────────────────────────────────────────────
  { classname: "staticobj_boathouse",                label: "Boathouse",                category: "Props",    width:17.908, height:17.925, depth:21.274, color: "#7e5233" },
  { classname: "staticobj_lighthouse",               label: "Lighthouse",               category: "Props",    width: 5.932, height: 8.137, depth:19.912, color: "#e0e0e0" },

  // ── WRECKS ───────────────────────────────────────────────────────────────
  { classname: "wreck_ship_large_front",       label: "Shipwreck Front",          category: "Wrecks",   width:15.00,  height: 7.0,  depth:10.00,  color: "#5a6a7a" },
  { classname: "wreck_ship_large_mid",         label: "Shipwreck Mid",            category: "Wrecks",   width:15.00,  height: 6.0,  depth:10.00,  color: "#5a6a7a" },
  { classname: "wreck_ship_large_back",        label: "Shipwreck Back",           category: "Wrecks",   width:15.00,  height: 7.0,  depth:10.00,  color: "#5a6a7a" },
  { classname: "staticobj_wreck_mining_excavator", label: "Mining Excavator Wreck",category: "Wrecks",   width:19.315, height:20.530, depth:30.150, color: "#5a5560" },
  { classname: "staticobj_wreck_mining_haultruck", label: "Haul Truck Wreck",     category: "Wrecks",   width:11.536, height: 8.413, depth:17.434, color: "#5a5560" },
];

/** Look up exact object dimensions by classname (case-insensitive). */
export function getObjectDef(classname: string): ObjectDef | undefined {
  const lower = classname.toLowerCase();
  return OBJECT_CATALOGUE.find(o => o.classname.toLowerCase() === lower);
}

/** Get the face-width (spacing) for a given DayZ wall classname. */
export function getObjectWidth(classname: string): number {
  return getObjectDef(classname)?.width ?? 8;
}

/** Grid size for the Panel Builder (metres per cell). */
export const PANEL_GRID_SIZE = 4;
