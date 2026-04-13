// ─────────────────────────────────────────────────────────────────────────────
// DANK STUDIO — 3D Preview Object Dimensions
// Maps DayZ classname → approximate box/shape for the Three.js preview.
// [width, height, depth] in metres.
// ─────────────────────────────────────────────────────────────────────────────

export interface MimicDef {
  w: number; h: number; d: number;
  color: string;
}

const MIMICS: Record<string, MimicDef> = {
  // Walls
  "staticobj_castle_wall3":       { w: 8.0,  h: 2.0,  d: 0.6, color: "#9e8b6c" },
  "staticobj_wall_stone2":        { w: 8.0,  h: 3.5,  d: 0.6, color: "#c8b99a" },
  "staticobj_wall_stone":         { w: 8.0,  h: 3.5,  d: 0.6, color: "#6a6a6a" },
  "staticobj_wall_cncsmall_8":    { w: 8.0,  h: 3.0,  d: 0.4, color: "#aaaaaa" },
  "staticobj_wall_cncsmall_4":    { w: 4.0,  h: 3.0,  d: 0.4, color: "#aaaaaa" },
  "staticobj_wall_milcnc_4":      { w: 4.0,  h: 3.0,  d: 0.3, color: "#78909c" },
  "staticobj_wall_indcnc_10":     { w: 8.75, h: 10.0, d: 0.5, color: "#546e7a" },
  "land_castle_wall1_20":         { w: 20.0, h: 8.0,  d: 1.0, color: "#795548" },
  "land_castle_wall2_30":         { w: 30.0, h: 8.0,  d: 1.0, color: "#6d4c41" },
  "staticobj_wall_tin_5":         { w: 5.0,  h: 2.0,  d: 0.3, color: "#7a8a7a" },
  // Floors
  "staticobj_platform1_block":    { w: 2.0,  h: 0.4,  d: 2.0, color: "#999" },
  "staticobj_misc_timbers_log4":  { w: 4.0,  h: 0.4,  d: 0.4, color: "#8d6e40" },
  // Bridges
  "staticobj_bridge_wood_50":     { w: 50.0, h: 1.0,  d: 4.0, color: "#7e5233" },
  "staticobj_bridge_wood_25":     { w: 25.0, h: 1.0,  d: 4.0, color: "#7e5233" },
  "land_woodenpier_15m":          { w: 15.0, h: 1.0,  d: 4.0, color: "#7e5233" },
  // Barriers
  "staticobj_mil_hbarrier_big":   { w: 4.5,  h: 1.8,  d: 1.5, color: "#8a7a6a" },
  "staticobj_mil_hbarrier_6m":    { w: 6.0,  h: 1.8,  d: 1.5, color: "#8a7a6a" },
  "staticobj_roadblock_cncblock": { w: 3.0,  h: 1.0,  d: 1.2, color: "#8a8a8a" },
  // Containers
  "land_container_1bo":           { w: 6.0,  h: 2.6,  d: 2.4, color: "#4a4a4a" },
  "land_container_1mo":           { w: 6.0,  h: 2.6,  d: 2.4, color: "#5a5a4a" },
  // Props
  "barrel_blue":                  { w: 0.7,  h: 0.9,  d: 0.7, color: "#2980b9" },
  "barrel_red":                   { w: 0.7,  h: 0.9,  d: 0.7, color: "#c0392b" },
  "barrel_yellow":                { w: 0.7,  h: 0.9,  d: 0.7, color: "#f1c40f" },
  "barrel_green":                 { w: 0.7,  h: 0.9,  d: 0.7, color: "#27ae60" },
  // Wrecks / vehicles
  "wreck_ship_large_front":       { w: 15.0, h: 7.0,  d: 10.0,color: "#5a6a7a" },
  "wreck_ship_large_mid":         { w: 15.0, h: 6.0,  d: 10.0,color: "#5a6a7a" },
  "wreck_ship_large_back":        { w: 15.0, h: 7.0,  d: 10.0,color: "#5a6a7a" },
};

const FALLBACK: MimicDef = { w: 2, h: 2, d: 2, color: "#4a7a50" };

export function getMimic(classname: string): MimicDef {
  if (!classname) return FALLBACK;
  const key = classname.toLowerCase();
  if (MIMICS[key]) return MIMICS[key];

  // Fuzzy fallback
  if (key.includes("castle_wall"))  return { w: 8, h: 2, d: 0.6, color: "#9e8b6c" };
  if (key.includes("wall_stone2"))  return { w: 8, h: 3.5, d: 0.6, color: "#c8b99a" };
  if (key.includes("wall_stone"))   return { w: 8, h: 3.5, d: 0.6, color: "#6a6a6a" };
  if (key.includes("indcnc"))       return { w: 8.75, h: 10, d: 0.5, color: "#546e7a" };
  if (key.includes("cncsmall_4"))   return { w: 4, h: 3, d: 0.4, color: "#aaaaaa" };
  if (key.includes("cncsmall") || key.includes("wall_cnc")) return { w: 8, h: 3, d: 0.4, color: "#aaaaaa" };
  if (key.includes("milcnc"))       return { w: 4, h: 3, d: 0.3, color: "#78909c" };
  if (key.includes("container"))    return { w: 6, h: 2.6, d: 2.4, color: "#3a3a3a" };
  if (key.includes("barrel"))       return { w: 0.7, h: 0.9, d: 0.7, color: "#888" };
  if (key.includes("hbarrier"))     return { w: 5, h: 1.8, d: 1.5, color: "#8a7a6a" };
  if (key.includes("platform"))     return { w: 2, h: 0.4, d: 2, color: "#999" };
  if (key.includes("pier") || key.includes("bridge")) return { w: 15, h: 1, d: 4, color: "#7e5233" };

  return FALLBACK;
}
