import type { Point3D, DrawnWall, DrawnObject, PanelState } from "../types";
import { applyLimit, drawWall } from "../draw";
import * as G from "./shapes";

export { exportDrawnWalls, exportDrawnObjects } from "../exporter";

export type GenParams = Record<string, number>;

export function generate(shape: string, params: GenParams): Point3D[] {
  const fn = REGISTRY[shape.toLowerCase()];
  if (!fn) return [];
  return applyLimit(fn(params));
}

const REGISTRY: Record<string, (p: GenParams) => Point3D[]> = {
  // ── Sci-Fi ──────────────────────────────────────────────────────────────
  death_star:              G.gen_death_star,
  atat_walker:             G.gen_atat_walker,
  xwing:                   G.gen_xwing,
  millennium_falcon:       G.gen_millennium_falcon,
  star_destroyer:          G.gen_star_destroyer,
  stargate_portal:         G.gen_stargate_portal,


  tony_stark_tower:        G.gen_stark_tower,
  cyberpunk_nexus:         G.gen_cyberpunk,
  saturn:                  G.gen_saturn,

  // ── Monuments ───────────────────────────────────────────────────────────
  eiffel_tower:            G.gen_eiffel_tower,
  taj_mahal:               G.gen_taj_mahal,
  colosseum:               G.gen_colosseum,
  pyramid_giza:            G.gen_pyramid,
  stonehenge:              G.gen_stonehenge,
  big_ben:                 G.gen_big_ben,
  statue_liberty:          G.gen_statue_liberty,
  christ_redeemer:         G.gen_christ_redeemer,
  parthenon:               G.gen_parthenon,
  arc_triomphe:            G.gen_arc_triomphe,
  sydney_opera:            G.gen_sydney_opera,
  cn_tower:                G.gen_cn_tower,
  space_needle:            G.gen_space_needle,
  leaning_pisa:            G.gen_pisa,

  // ── Fantasy / Fiction ───────────────────────────────────────────────────
  hogwarts:                G.gen_hogwarts,
  minas_tirith:            G.gen_minas_tirith,
  helms_deep:              G.gen_helms_deep,
  the_wall_game_of_thrones:G.gen_the_wall,
  azkaban_prison:          G.gen_azkaban,
  eye_of_sauron:           G.gen_eye_of_sauron,
  fortress_of_solitude:    G.gen_fortress_solitude,

  // ── Structures / Military ───────────────────────────────────────────────
  bunker_complex:          G.gen_bunker,
  the_pentagon:            G.gen_pentagon,
  star_fort:               G.gen_star_fort,
  arena_fort:              G.gen_arena_fort,
  gatehouse:               G.gen_gatehouse,
  normandy_bunkers:        G.gen_normandy,
  alcatraz_prison:         G.gen_alcatraz,

  // ── Naval / Industrial ──────────────────────────────────────────────────
  aircraft_carrier:        G.gen_carrier,
  submarine:               G.gen_submarine,
  oil_rig:                 G.gen_oil_rig,
  pirate_ship:             G.gen_pirate_ship,
  bridge_truss:            G.gen_bridge_truss,

  // ── Geometric / Unique ──────────────────────────────────────────────────
  celtic_ring:             G.gen_celtic_ring,
  dna_double:              G.gen_dna_helix,
  amphitheater:            G.gen_amphitheater,
  roman_aqueduct:          G.gen_aqueduct,
  gothic_arch:             G.gen_gothic_arch,
  dragon:                  G.gen_dragon,

  // ── Primitives ──────────────────────────────────────────────────────────
  sphere:                  G.gen_sphere,
  ring:                    G.gen_ring,
  cylinder:                G.gen_cylinder,
  pyramid:                 G.gen_pyramid_basic,
  torus:                   G.gen_torus,
  cube:                    G.gen_cube,
  dome:                    G.gen_dome,
  spiral:                  G.gen_spiral,
  wall_line:               G.gen_wall_line,
  arc:                     G.gen_arc,
};

// ── Utilities ─────────────────────────────────────────────────────────────

/** Convert free-draw wall segments into a flat list of renderable points. */
export function wallsToPoints(walls: DrawnWall[]): Point3D[] {
  const pts: Point3D[] = [];
  for (const w of walls) {
    drawWall(pts, w.x1, w.y1, w.z1, w.x2, w.y2, w.z2, w.classname);
  }
  return pts;
}

/** Convert a the cellular PanelBuilder state into renderable wall/object lists. */
export function panelStateToPoints(state: PanelState): { walls: DrawnWall[], objects: DrawnObject[] } {
  const walls: DrawnWall[] = [];
  const objects: DrawnObject[] = [];
  const CELL_SIZE = 4; // Each grid cell is 4m x 4m

  // Floors are represented as objects at cell centers
  for (const cell of state.cells) {
    objects.push({
      id: `floor-${cell.x}-${cell.y}`,
      x: cell.x * CELL_SIZE + CELL_SIZE / 2,
      y: 0,
      z: cell.y * CELL_SIZE + CELL_SIZE / 2,
      yaw: 0, pitch: -90, roll: 0, scale: 1,
      classname: cell.type || "staticobj_platform1_block"
    });
  }

  // Edges are converted to wall segments
  for (const edge of state.wallEdges) {
    // Align wall to the edge of the cell
    walls.push({
      id: `edge-${edge.x1}-${edge.y1}-${edge.x2}-${edge.y2}`,
      x1: edge.x1 * CELL_SIZE, y1: 0, z1: edge.y1 * CELL_SIZE,
      x2: edge.x2 * CELL_SIZE, y2: 0, z2: edge.y2 * CELL_SIZE,
      classname: edge.type || "staticobj_castle_wall3"
    });
  }

  return { walls, objects };
}
