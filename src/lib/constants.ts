// ─────────────────────────────────────────────────────────────────────────────
// DANK STUDIO — Object Catalogue & Constants
//
// Dimensions verified against real placed-object measurements from LordBionik
// JSON exports (AnzaliBunker, BunkerFive) and DayZ naming convention analysis.
//
// Naming convention: trailing number = face LENGTH in metres (except indcnc
// where the number is HEIGHT and face width is ~8.75m).
//
// width  = metres along the face (drawWall spacing key)
// height = metres tall (drawSphere ring-step key)
// depth  = metres thick
// ─────────────────────────────────────────────────────────────────────────────
import type { ObjectDef } from "./types";

export const MAX_OBJECTS = 1200;

export const OBJECT_CATALOGUE: ObjectDef[] = [

  // ── CONCRETE WALLS (small/standard) ─────────────────────────────────────
  // cncsmall: face width = trailing number, height ~3 m, depth ~0.4 m
  { classname: "staticobj_wall_cncsmall_8",    label: "Concrete Wall 8m",          category: "Walls",    width:  8.00, height:  3.0, depth: 0.40, color: "#aaaaaa" },
  { classname: "staticobj_wall_cncsmall_4",    label: "Concrete Wall 4m",          category: "Walls",    width:  4.00, height:  3.0, depth: 0.40, color: "#aaaaaa" },
  { classname: "staticobj_wall_cnc_5",         label: "Concrete Wall 5m",          category: "Walls",    width:  5.00, height:  3.0, depth: 0.50, color: "#b0b0b0" },

  // ── INDUSTRIAL CONCRETE WALLS ────────────────────────────────────────────
  // indcnc_10: face = 8.75 m (measured), HEIGHT = 10 m — confirmed via spacing
  { classname: "staticobj_wall_indcnc_10",     label: "Industrial CNC 10m tall",   category: "Walls",    width:  8.75, height: 10.0, depth: 0.50, color: "#546e7a" },
  { classname: "staticobj_wall_indcnc_4",      label: "Industrial CNC 4m wide",    category: "Walls",    width:  4.00, height: 10.0, depth: 0.50, color: "#4a6270" },
  { classname: "staticobj_wall_indcnch_10",    label: "Industrial CNC Half 10m",   category: "Walls",    width:  8.75, height:  5.0, depth: 0.50, color: "#607d8b" },
  { classname: "staticobj_wall_indcnch_5",     label: "Industrial CNC Half 5m",    category: "Walls",    width:  4.375,height:  5.0, depth: 0.50, color: "#607d8b" },
  { classname: "staticobj_wall_indcnc4_8",     label: "Industrial CNC4 8m",        category: "Walls",    width:  8.00, height:  8.0, depth: 0.50, color: "#5a7a8a" },
  { classname: "staticobj_wall_indcnc4_4",     label: "Industrial CNC4 4m",        category: "Walls",    width:  4.00, height:  8.0, depth: 0.50, color: "#5a7a8a" },
  { classname: "staticobj_wall_indcnc4_low_8", label: "Industrial CNC4 Low 8m",    category: "Walls",    width:  8.00, height:  4.0, depth: 0.50, color: "#6a8a9a" },
  { classname: "staticobj_wall_indcnc4_low_4", label: "Industrial CNC4 Low 4m",    category: "Walls",    width:  4.00, height:  4.0, depth: 0.50, color: "#6a8a9a" },

  // ── MILITARY CONCRETE WALLS ──────────────────────────────────────────────
  // milcnc_4: face = 4 m, height = 3 m (confirmed by name + measured data)
  { classname: "staticobj_wall_milcnc_4",      label: "Military CNC 4m",           category: "Walls",    width:  4.00, height:  3.0, depth: 0.30, color: "#78909c" },

  // ── CASTLE / STONE WALLS ─────────────────────────────────────────────────
  { classname: "staticobj_castle_wall3",       label: "Castle Wall 8m",            category: "Walls",    width:  8.00, height:  2.0, depth: 0.60, color: "#9e8b6c" },
  { classname: "staticobj_wall_stone2",        label: "Stone Wall 8m (light)",     category: "Walls",    width:  8.00, height:  3.5, depth: 0.60, color: "#c8b99a" },
  { classname: "staticobj_wall_stone",         label: "Stone Wall 8m (dark)",      category: "Walls",    width:  8.00, height:  3.5, depth: 0.60, color: "#6a6a6a" },
  { classname: "land_castle_wall1_20",         label: "Castle Wall Large 20m",     category: "Walls",    width: 20.00, height:  8.0, depth: 1.00, color: "#795548" },
  { classname: "land_castle_wall2_30",         label: "Castle Wall 30m",           category: "Walls",    width: 30.00, height:  8.0, depth: 1.00, color: "#6d4c41" },

  // ── TIN / WOOD WALLS ─────────────────────────────────────────────────────
  { classname: "staticobj_wall_tin_5",         label: "Tin Wall 5m",               category: "Walls",    width:  5.00, height:  2.0, depth: 0.30, color: "#7a8a7a" },

  // ── FLOORS / PLATFORMS ───────────────────────────────────────────────────
  { classname: "staticobj_platform1_block",    label: "Platform Tile 2m",          category: "Floors",   width:  2.00, height:  0.4, depth: 2.00, color: "#999999" },
  { classname: "staticobj_misc_timbers_log4",  label: "Timber Floor 4m",           category: "Floors",   width:  4.00, height:  0.4, depth: 0.40, color: "#8d6e40" },

  // ── BRIDGES & PIERS ──────────────────────────────────────────────────────
  { classname: "staticobj_bridge_wood_50",     label: "Wood Bridge 50m",           category: "Bridges",  width: 50.00, height:  1.0, depth: 4.00, color: "#7e5233" },
  { classname: "staticobj_bridge_wood_25",     label: "Wood Bridge 25m",           category: "Bridges",  width: 25.00, height:  1.0, depth: 4.00, color: "#7e5233" },
  { classname: "land_woodenpier_15m",          label: "Wooden Pier 15m",           category: "Bridges",  width: 15.00, height:  1.0, depth: 4.00, color: "#7e5233" },
  { classname: "staticobj_pier_wooden1",       label: "Wooden Pier Short",         category: "Bridges",  width:  8.00, height:  1.0, depth: 2.00, color: "#7e5233" },
  { classname: "staticobj_pier_concrete2",     label: "Concrete Pier",             category: "Bridges",  width:  8.00, height:  1.0, depth: 2.00, color: "#888888" },

  // ── BARRIERS ─────────────────────────────────────────────────────────────
  { classname: "staticobj_mil_hbarrier_big",   label: "Jersey Barrier 4.5m",       category: "Barriers", width:  4.50, height:  1.8, depth: 1.50, color: "#8a7a6a" },
  { classname: "staticobj_mil_hbarrier_6m",    label: "Jersey Barrier 6m",         category: "Barriers", width:  6.00, height:  1.8, depth: 1.50, color: "#8a7a6a" },
  { classname: "staticobj_roadblock_cncblock", label: "Concrete Block",            category: "Barriers", width:  3.00, height:  1.0, depth: 1.20, color: "#8a8a8a" },
  { classname: "staticobj_wall_milcncbarrier", label: "Military CNC Barrier",      category: "Barriers", width:  4.00, height:  2.0, depth: 1.20, color: "#78909c" },

  // ── CONTAINERS ───────────────────────────────────────────────────────────
  // Containers: ~6 m long × 2.9 m tall — confirmed universal stacker
  { classname: "land_container_1bo",           label: "Container (Open) 6m",       category: "Containers", width: 6.00, height: 2.9, depth: 2.40, color: "#4a4a4a" },
  { classname: "land_container_1mo",           label: "Container (Metal) 6m",      category: "Containers", width: 6.00, height: 2.9, depth: 2.40, color: "#5a5a4a" },
  { classname: "land_container_1moh",          label: "Container (Side Hole)",     category: "Containers", width: 6.00, height: 2.9, depth: 2.40, color: "#4a5a4a" },

  // ── MODULAR BUNKER PANELS ────────────────────────────────────────────────
  // bunker1/2: ~8 m wide × 3.5 m tall — modular L/centre/R system
  { classname: "land_bunker1_double",          label: "Bunker Panel Centre",       category: "Walls",    width:  8.00, height:  3.5, depth: 0.60, color: "#5a6a5a" },
  { classname: "land_bunker1_left",            label: "Bunker Panel Left",         category: "Walls",    width:  4.00, height:  3.5, depth: 0.60, color: "#5a6a5a" },
  { classname: "land_bunker1_right",           label: "Bunker Panel Right",        category: "Walls",    width:  4.00, height:  3.5, depth: 0.60, color: "#5a6a5a" },
  { classname: "land_bunker2_double",          label: "Bunker Panel B Centre",     category: "Walls",    width:  8.00, height:  3.5, depth: 0.60, color: "#6a6a5a" },

  // ── CYLINDRICAL TANKS ────────────────────────────────────────────────────
  { classname: "land_dieselpowerplant_tank_small", label: "Diesel Tank Small",    category: "Props",    width:  6.00, height:  6.0, depth: 6.00, color: "#5a5a6a" },
  { classname: "land_dieselpowerplant_tank_big",   label: "Diesel Tank Large",    category: "Props",    width: 10.00, height: 10.0, depth:10.00, color: "#4a4a5a" },

  // ── MILITARY STRUCTURES ──────────────────────────────────────────────────
  { classname: "land_mil_guardbox_smooth",     label: "Guard Box Smooth",          category: "Props",    width:  2.50, height:  2.5, depth: 2.50, color: "#708090" },
  { classname: "land_mil_guardbox_green",      label: "Guard Box Green",           category: "Props",    width:  2.50, height:  2.5, depth: 2.50, color: "#5a7a5a" },
  { classname: "land_mil_guardshed",           label: "Guard Shed",                category: "Props",    width:  4.00, height:  3.5, depth: 3.00, color: "#6a7a6a" },
  { classname: "land_mil_barracks_round",      label: "Barracks Round",            category: "Props",    width:  8.00, height:  5.0, depth: 8.00, color: "#5a6a5a" },

  // ── PROPS ─────────────────────────────────────────────────────────────────
  { classname: "barrel_blue",                  label: "Barrel (Blue)",             category: "Props",    width:  0.70, height:  0.9, depth: 0.70, color: "#2980b9" },
  { classname: "barrel_red",                   label: "Barrel (Red)",              category: "Props",    width:  0.70, height:  0.9, depth: 0.70, color: "#c0392b" },
  { classname: "barrel_yellow",                label: "Barrel (Yellow)",           category: "Props",    width:  0.70, height:  0.9, depth: 0.70, color: "#f1c40f" },
  { classname: "barrel_green",                 label: "Barrel (Green)",            category: "Props",    width:  0.70, height:  0.9, depth: 0.70, color: "#27ae60" },

  // ── PIPES & TUBES (from DAYZ_OBJECT_CATALOGUE.txt) ───────────────────────
  // Dimensions are measured estimates — verify in-game if using for precision builds.
  // concretepipe: short large-diameter drainage section (sewage pipe look)
  { classname: "staticobj_misc_concretepipe",       label: "Concrete Pipe",             category: "Pipes",    width:  2.00, height:  2.0, depth: 2.00, color: "#7a7a7a" },
  // boundarystone_tube: tiny thin cigar/rod — perfect for thin gun barrels, railings
  { classname: "staticobj_misc_boundarystone_tube", label: "Boundary Tube (Tiny Pipe)", category: "Pipes",    width:  0.30, height:  1.8, depth: 0.30, color: "#6a5a4a" },
  // pier_tube: dock bollard tubes — thick and cylindrical
  { classname: "staticobj_pier_tube_big",           label: "Pier Tube (Big)",           category: "Pipes",    width:  1.50, height:  3.0, depth: 1.50, color: "#5a5a5a" },
  { classname: "staticobj_pier_tube_small",         label: "Pier Tube (Small)",         category: "Pipes",    width:  0.80, height:  1.5, depth: 0.80, color: "#5a5a5a" },
  // pipe_big_18m: large industrial pipe section — great for stacks, engine nacelles
  { classname: "staticobj_pipe_big_18m",            label: "Industrial Pipe 18m",       category: "Pipes",    width:  1.50, height:  1.5, depth:18.00, color: "#666666" },
  // pipe_med_9m: medium pipe section
  { classname: "staticobj_pipe_med_9m",             label: "Industrial Pipe 9m",        category: "Pipes",    width:  0.90, height:  0.9, depth: 9.00, color: "#6a6a6a" },
  // pipe_small_20m: long thin pipe — railings, antenna masts, antenna arrays
  { classname: "staticobj_pipe_small_20m",          label: "Small Pipe 20m",            category: "Pipes",    width:  0.40, height:  0.4, depth:20.00, color: "#707070" },

  // ── MONUMENTS / PILLARS ──────────────────────────────────────────────────
  // war1: tall concrete obelisk / pointy column — great for spires
  { classname: "staticobj_monument_war1",           label: "Obelisk / Concrete Spire",  category: "Props",    width:  2.00, height: 12.0, depth: 2.00, color: "#8a8a8a" },
  // enoch1: small concrete pillar / marker
  { classname: "staticobj_monument_enoch1",         label: "Concrete Pillar (Small)",   category: "Props",    width:  1.00, height:  3.0, depth: 1.00, color: "#8a8a8a" },

  // ── CASTLE STRUCTURAL ────────────────────────────────────────────────────
  // Castle_Bastion: round stone tower section — half-tunnel / circular bastion
  { classname: "Land_Castle_Bastion",               label: "Castle Bastion (Round)",    category: "Walls",    width:  6.00, height:  8.0, depth: 6.00, color: "#7a6a5a" },

  // ── WRECKS ───────────────────────────────────────────────────────────────
  { classname: "wreck_ship_large_front",       label: "Shipwreck Front",           category: "Wrecks",   width: 15.00, height:  7.0, depth:10.00, color: "#5a6a7a" },
  { classname: "wreck_ship_large_mid",         label: "Shipwreck Mid",             category: "Wrecks",   width: 15.00, height:  6.0, depth:10.00, color: "#5a6a7a" },
  { classname: "wreck_ship_large_back",        label: "Shipwreck Back",            category: "Wrecks",   width: 15.00, height:  7.0, depth:10.00, color: "#5a6a7a" },
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
