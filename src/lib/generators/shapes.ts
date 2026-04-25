// ─────────────────────────────────────────────────────────────────────────────
// DANK STUDIO — All Shape Generators (BARREL)
//
// Generators are organised by category under `generators/categories/*.ts`.
// Shared constants + the `GenParams` type live in `generators/_constants.ts`.
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
//  1. Pick the right category file in `generators/categories/`
//  2. Write `export function gen_myname(p: GenParams): Point3D[] { ... }`
//  3. Add a registry entry in `generators/index.ts`
// ─────────────────────────────────────────────────────────────────────────────

export type { GenParams } from "./_constants";
export {
  CASTLE, STONE, STONE2, CNC8, CNC4, MILCNC, IND10,
  _CD, _CH, _CW, _C_PALETTE, _cpick,
} from "./_constants";

export * from "./categories/category_scifi";
export * from "./categories/category_monuments";
export * from "./categories/category_fantasy";
export * from "./categories/category_containers";
export * from "./categories/category_structures";
export * from "./categories/category_naval";
export * from "./categories/category_geometric";
export * from "./categories/category_primitives";
export * from "./categories/category_landmarks_extra";
