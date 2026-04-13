// ─────────────────────────────────────────────────────────────────────────────
// DANK STUDIO — Object Catalogue & Constants
// ─────────────────────────────────────────────────────────────────────────────
import type { ObjectDef } from "./types";

export const MAX_OBJECTS = 1200;

// ── Object catalogue ─────────────────────────────────────────────────────────
// width  = metres along the face (used for drawWall spacing)
// height = metres tall
// depth  = metres thick

export const OBJECT_CATALOGUE: ObjectDef[] = [
  // ── WALLS ────────────────────────────────────────────────────────────────
  { classname: "staticobj_castle_wall3",       label: "Castle Wall 8m",          category: "Walls",   width: 8.00,  height: 2.0,  depth: 0.6,  color: "#9e8b6c" },
  { classname: "staticobj_wall_stone2",        label: "Stone Wall 8m (light)",   category: "Walls",   width: 8.00,  height: 3.5,  depth: 0.6,  color: "#c8b99a" },
  { classname: "staticobj_wall_stone",         label: "Stone Wall 8m (dark)",    category: "Walls",   width: 8.00,  height: 3.5,  depth: 0.6,  color: "#6a6a6a" },
  { classname: "staticobj_wall_cncsmall_8",    label: "Concrete Wall 8m",        category: "Walls",   width: 8.00,  height: 3.0,  depth: 0.4,  color: "#aaaaaa" },
  { classname: "staticobj_wall_cncsmall_4",    label: "Concrete Wall 4m",        category: "Walls",   width: 4.00,  height: 3.0,  depth: 0.4,  color: "#aaaaaa" },
  { classname: "staticobj_wall_milcnc_4",      label: "Military CNC 4m",         category: "Walls",   width: 4.00,  height: 3.0,  depth: 0.3,  color: "#78909c" },
  { classname: "staticobj_wall_indcnc_10",     label: "Industrial CNC 10m",      category: "Walls",   width: 8.75,  height: 10.0, depth: 0.5,  color: "#546e7a" },
  { classname: "land_castle_wall1_20",         label: "Castle Wall Large 20m",   category: "Walls",   width: 20.00, height: 8.0,  depth: 1.0,  color: "#795548" },
  { classname: "land_castle_wall2_30",         label: "Castle Wall 30m",         category: "Walls",   width: 30.00, height: 8.0,  depth: 1.0,  color: "#6d4c41" },
  { classname: "staticobj_wall_tin_5",         label: "Tin Wall 5m",             category: "Walls",   width: 5.00,  height: 2.0,  depth: 0.3,  color: "#7a8a7a" },

  // ── FLOORS / PLATFORMS ───────────────────────────────────────────────────
  { classname: "staticobj_platform1_block",    label: "Platform Tile 2m",        category: "Floors",  width: 2.0,   height: 0.4,  depth: 2.0,  color: "#999999" },
  { classname: "staticobj_misc_timbers_log4",  label: "Timber Floor 4m",         category: "Floors",  width: 4.0,   height: 0.4,  depth: 0.4,  color: "#8d6e40" },

  // ── BRIDGES & PIERS ──────────────────────────────────────────────────────
  { classname: "staticobj_bridge_wood_50",     label: "Wood Bridge 50m",         category: "Bridges", width: 50.00, height: 1.0,  depth: 4.0,  color: "#7e5233" },
  { classname: "staticobj_bridge_wood_25",     label: "Wood Bridge 25m",         category: "Bridges", width: 25.00, height: 1.0,  depth: 4.0,  color: "#7e5233" },
  { classname: "land_woodenpier_15m",          label: "Wooden Pier 15m",         category: "Bridges", width: 15.00, height: 1.0,  depth: 4.0,  color: "#7e5233" },
  { classname: "staticobj_pier_wooden1",       label: "Wooden Pier Short",       category: "Bridges", width: 8.00,  height: 1.0,  depth: 2.0,  color: "#7e5233" },
  { classname: "staticobj_pier_concrete2",     label: "Concrete Pier",           category: "Bridges", width: 8.00,  height: 1.0,  depth: 2.0,  color: "#888" },

  // ── BARRIERS ─────────────────────────────────────────────────────────────
  { classname: "staticobj_mil_hbarrier_big",   label: "Jersey Barrier 4.5m",     category: "Barriers",width: 4.50,  height: 1.8,  depth: 1.5,  color: "#8a7a6a" },
  { classname: "staticobj_mil_hbarrier_6m",    label: "Jersey Barrier 6m",       category: "Barriers",width: 6.00,  height: 1.8,  depth: 1.5,  color: "#8a7a6a" },
  { classname: "staticobj_roadblock_cncblock", label: "Concrete Block",          category: "Barriers",width: 3.00,  height: 1.0,  depth: 1.2,  color: "#8a8a8a" },

  // ── CONTAINERS ───────────────────────────────────────────────────────────
  { classname: "land_container_1bo",           label: "Container (Open) 6m",     category: "Containers", width: 6.0, height: 2.6, depth: 2.4, color: "#4a4a4a" },
  { classname: "land_container_1mo",           label: "Container (Metal) 6m",    category: "Containers", width: 6.0, height: 2.6, depth: 2.4, color: "#5a5a4a" },

  // ── PROPS ─────────────────────────────────────────────────────────────────
  { classname: "barrel_blue",                  label: "Barrel (Blue)",            category: "Props",  width: 0.7,   height: 0.9,  depth: 0.7,  color: "#2980b9" },
  { classname: "barrel_red",                   label: "Barrel (Red)",             category: "Props",  width: 0.7,   height: 0.9,  depth: 0.7,  color: "#c0392b" },
  { classname: "barrel_yellow",                label: "Barrel (Yellow)",          category: "Props",  width: 0.7,   height: 0.9,  depth: 0.7,  color: "#f1c40f" },
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
export const PANEL_GRID_SIZE = 4; // 4m cells fits neatly with 4m/8m walls
