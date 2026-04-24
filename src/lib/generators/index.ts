import type { Point3D, DrawnWall, DrawnObject, PanelState } from "../types";
import { applyLimit, drawWall } from "../draw";
import { getMimic } from "../mimic";
import * as G from "./shapes";

export { exportCombinedDraw } from "../exporter";

export type GenParams = Record<string, number>;

export function generate(shape: string, params: GenParams): Point3D[] {
  const fn = REGISTRY[shape.toLowerCase()];
  if (!fn) return [];
  const raw = applyLimit(fn(params));
  if ((params.container_mode ?? 0) > 0.5) return containerify(raw);
  return raw;
}

// ── Container Mode post-processor ─────────────────────────────────────────────
// Replaces wall panels with stacked land_container_1bo objects that precisely
// match each panel's face width and approximate its height.
//
// Container dimensions (P3D-verified): w=2.702 × h=2.782 × d=10.000m
// Long axis (depth, 10m) = Z direction at yaw=0.
// To align the long axis along a wall running perpendicular to yaw, rotate +90°.
const CONT_CLASS = "land_container_1bo";
const CONT_H = 2.782;  // container height
const CONT_D = 10.000; // container long-axis length

// Classnames that should NOT be converted (already containers, barrels, organic shapes)
const KEEP_AS_IS = new Set([
  "land_container_1bo", "land_container_1mo", "land_container_1moh",
  "land_container_1aoh", "land_container_1a", "land_container_1b",
  "land_container_1c", "land_container_2a", "land_container_2b",
  "land_containerlocked",
  "barrel_blue", "barrel_red", "barrel_yellow", "barrel_green",
  "staticobj_pier_tube_big", "staticobj_pier_tube_small",
]);

function containerify(pts: Point3D[]): Point3D[] {
  const out: Point3D[] = [];

  for (const pt of pts) {
    const name = pt.name ?? "staticobj_castle_wall3";

    // Pass through objects that shouldn't be containerised
    if (KEEP_AS_IS.has(name) || name.includes("container") || name.includes("barrel")) {
      out.push(pt);
      continue;
    }

    const m = getMimic(name);
    const sc = pt.scale ?? 1;
    const pitch = pt.pitch ?? 0;
    const isPitched = Math.abs(Math.abs(pitch) - 90) < 10;

    // Scale the container so its long axis (10m) matches the panel's face width
    const faceW = m.w * sc;
    const scC = +(faceW / CONT_D).toFixed(4);

    if (isPitched) {
      // Flat panel (floor/roof) — use one container lying flat, same orientation
      out.push({ ...pt, name: CONT_CLASS, scale: scC });
    } else {
      // Vertical or near-vertical panel — stack containers to match panel height
      const rowH = CONT_H * scC;
      const rows = Math.max(1, Math.ceil(m.h / rowH));
      const contYaw = (pt.yaw ?? 0) + 90; // rotate so long axis runs along the wall
      for (let r = 0; r < rows; r++) {
        out.push({
          x: pt.x,
          y: pt.y + r * rowH,
          z: pt.z,
          yaw: contYaw,
          pitch: 0,
          roll: pt.roll,
          scale: scC,
          name: CONT_CLASS,
        });
      }
    }
  }

  return applyLimit(out, 1150);
}

const REGISTRY: Record<string, (p: GenParams) => Point3D[]> = {
  // ── Sci-Fi ──────────────────────────────────────────────────────────────
  death_star:              G.gen_death_star,
  atat_walker:             G.gen_atat_walker,
  tie_fighter:             G.gen_tie_fighter,
  xwing:                   G.gen_xwing,
  millennium_falcon:       G.gen_millennium_falcon,
  star_destroyer:          G.gen_star_destroyer,
  stargate_portal:         G.gen_stargate_portal,


  tony_stark_tower:        G.gen_stark_tower,
  cyberpunk_nexus:         G.gen_cyberpunk,
  saturn:                  G.gen_saturn,
  borg_cube:               G.gen_borg_cube,
  halo_installation:       G.gen_halo_ring,
  uss_enterprise:          G.gen_enterprise,

  // ── Monuments ───────────────────────────────────────────────────────────
  eiffel_tower:            G.gen_eiffel_tower,
  taj_mahal:               G.gen_taj_mahal,
  colosseum:               G.gen_colosseum,
  pyramid_giza:            G.gen_pyramid,
  stonehenge:              G.gen_stonehenge,
  pentagram:               G.gen_pentagram,
  big_ben:                 G.gen_big_ben,
  angkor_wat:              G.gen_angkor_wat,
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
  iron_throne:             G.gen_iron_throne,
  camelot:                 G.gen_camelot,
  winterfell:              G.gen_winterfell,
  black_gate:              G.gen_black_gate,
  gondor_beacon:           G.gen_gondor_beacon,
  stormwind:               G.gen_stormwind,

  // ── Container Builds ────────────────────────────────────────────────────
  sky_fort:                G.gen_sky_fort,
  container_pyramid:       G.gen_container_pyramid,
  container_drum:          G.gen_container_drum,
  container_helix:         G.gen_container_helix,
  container_station:       G.gen_container_station,
  container_fortress:      G.gen_container_fortress,
  container_starport:      G.gen_container_starport,
  container_shantytown:    G.gen_container_shantytown,

  // ── Structures / Military ───────────────────────────────────────────────
  bunker_complex:          G.gen_bunker,
  the_pentagon:            G.gen_pentagon,
  star_fort:               G.gen_star_fort,
  arena_fort:              G.gen_arena_fort,
  gatehouse:               G.gen_gatehouse,
  normandy_bunkers:        G.gen_normandy,
  alcatraz_prison:         G.gen_alcatraz,

  // ── World Monuments ─────────────────────────────────────────────────────
  mont_saint_michel:       G.gen_mont_saint_michel,
  sagrada_familia:         G.gen_sagrada_familia,
  chrysler_building:       G.gen_chrysler_building,
  tower_of_london:         G.gen_tower_of_london,
  great_wall:              G.gen_great_wall,
  alhambra_palace:         G.gen_alhambra,
  hagia_sophia:            G.gen_hagia_sophia,
  rivendell:               G.gen_rivendell,
  isengard:                G.gen_isengard,

  // ── Naval / Industrial ──────────────────────────────────────────────────
  aircraft_carrier:        G.gen_carrier,
  submarine:               G.gen_submarine,
  oil_rig:                 G.gen_oil_rig,
  pirate_ship:             G.gen_pirate_ship,
  bridge_truss:            G.gen_bridge_truss,

  // ── Creative Megastructures ─────────────────────────────────────────────────
  dyson_sphere:            G.gen_dyson_sphere,
  barad_dur:               G.gen_barad_dur,
  mass_effect_citadel:     G.gen_mass_effect_citadel,

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
