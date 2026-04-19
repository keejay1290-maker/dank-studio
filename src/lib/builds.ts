// ─────────────────────────────────────────────────────────────────────────────
// DANK STUDIO — Build Library
// All entries shown in the sidebar. Each maps to a generator key + params.
// ─────────────────────────────────────────────────────────────────────────────

export interface ParamDef {
  key:     string;
  label:   string;
  min:     number;
  max:     number;
  step:    number;
  default: number;
}

export interface BuildEntry {
  key:           string;        // registry key in generators/index.ts
  label:         string;
  category:      string;
  description?:  string;
  defaultParams: Record<string, number>;
  params:        ParamDef[];
}

// ── Sci-Fi ────────────────────────────────────────────────────────────────────
const SCI_FI: BuildEntry[] = [
  {
    key: "death_star", label: "Death Star", category: "Sci-Fi",
    description: "Imperial battle station — superlaser dish, equatorial trench, panelled hull",
    defaultParams: { r: 35 },
    params: [
      { key: "r", label: "Radius (m)", min: 20, max: 60, step: 2, default: 35 },
    ],
  },
  {
    key: "atat_walker", label: "AT-AT Walker", category: "Sci-Fi",
    description: "Imperial All Terrain Armored Transport walker",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.1, default: 1 },
    ],
  },
  {
    key: "tie_fighter", label: "TIE Fighter", category: "Sci-Fi",
    description: "Imperial TIE/LN starfighter — twin hexagonal IND10 solar panels, triple-ring cockpit pod, arm pylons",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.5, default: 1 },
    ],
  },
  {
    key: "xwing", label: "X-Wing Fighter", category: "Sci-Fi",
    description: "Rebel starfighter with S-foils open",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 4, step: 0.1, default: 1 },
    ],
  },
  {
    key: "millennium_falcon", label: "Millennium Falcon", category: "Sci-Fi",
    description: "The fastest hunk of junk in the galaxy",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.1, default: 1 },
    ],
  },
  {
    key: "star_destroyer", label: "Star Destroyer", category: "Sci-Fi",
    description: "Imperial-class Star Destroyer",
    defaultParams: { scale: 0.75 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 1.5, step: 0.05, default: 0.75 },
    ],
  },
  {
    key: "stargate_portal", label: "Stargate Portal", category: "Sci-Fi",
    description: "Interstellar Chappa'ai portal with 9 unlocking chevrons",
    defaultParams: { r: 20 },
    params: [
      { key: "r", label: "Radius (m)", min: 10, max: 50, step: 2, default: 20 },
    ],
  },


  {
    key: "tony_stark_tower", label: "Stark Tower", category: "Sci-Fi",
    description: "Avengers command spire and energy arc reactor",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.25, default: 1 },
    ],
  },
  {
    key: "cyberpunk_nexus", label: "Cyberpunk Nexus", category: "Sci-Fi",
    description: "Neon-soaked dystopian arcology — ziggurat megastructure with 4 flanking towers, skybridges, and rooftop antenna forest",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.1, default: 1 },
    ],
  },
  {
    key: "borg_cube", label: "Borg Cube", category: "Sci-Fi",
    description: "Borg assimilation vessel — stochastic decay hull, CNC8 sub-modules, green conduit glow",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.1, default: 1 },
    ],
  },
  {
    key: "halo_installation", label: "Halo Installation", category: "Sci-Fi",
    description: "Forerunner ring world — outer IND10 ring, terrain band, 12 structural ribs, Forerunner engines",
    defaultParams: { r: 60 },
    params: [
      { key: "r", label: "Ring Radius (m)", min: 30, max: 100, step: 5, default: 60 },
    ],
  },
  {
    key: "saturn", label: "Planet Saturn", category: "Sci-Fi",
    description: "Gas giant featuring mathematically perfect orbital rings",
    defaultParams: { r: 35 },
    params: [
      { key: "r", label: "Radius (m)", min: 20, max: 45, step: 5, default: 35 },
    ],
  },
  {
    key: "uss_enterprise", label: "USS Enterprise NCC-1701", category: "Sci-Fi",
    description: "Iconic Starfleet starship — saucer hull, engineering section, twin warp nacelles",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.25, default: 1 },
    ],
  },
];

// ── Monuments ─────────────────────────────────────────────────────────────────
const MONUMENTS: BuildEntry[] = [
  {
    key: "eiffel_tower", label: "Eiffel Tower", category: "Monuments",
    description: "Iconic Parisian wrought-iron lattice spire",
    defaultParams: { scale: 0.5 },
    params: [
      { key: "scale", label: "Scale", min: 0.25, max: 1, step: 0.25, default: 0.5 },
    ],
  },
  {
    key: "taj_mahal", label: "Taj Mahal", category: "Monuments",
    description: "Pristine marble mausoleum with grand dome and minarets",
    defaultParams: { scale: 0.5 },
    params: [
      { key: "scale", label: "Scale", min: 0.25, max: 2, step: 0.25, default: 0.5 },
    ],
  },
  {
    key: "colosseum", label: "Colosseum", category: "Monuments",
    description: "Roman amphitheatre — 4-tiered elliptical arched facade with cardinal entrances",
    defaultParams: { r: 80, tiers: 3 },
    params: [
      { key: "r", label: "Outer Radius (m)", min: 40, max: 150, step: 5, default: 80 },
      { key: "tiers", label: "Tiers", min: 1, max: 5, step: 1, default: 3 },
    ],
  },
  {
    key: "pyramid_giza", label: "Great Pyramid", category: "Monuments",
    description: "Ancient wonder of the world — stepped limestone casing with mortuary complex",
    defaultParams: { base: 80, height: 60 },
    params: [
      { key: "base", label: "Base Width (m)", min: 40, max: 140, step: 10, default: 80 },
      { key: "height", label: "Height (m)", min: 20, max: 100, step: 5, default: 60 },
    ],
  },
  {
    key: "stonehenge", label: "Stonehenge", category: "Monuments",
    description: "Neolithic monument — 30 container monoliths with lintels, inner trilithon horseshoe, altar and heel stone",
    defaultParams: { r: 30 },
    params: [
      { key: "r", label: "Ring Radius (m)", min: 20, max: 60, step: 5, default: 30 },
    ],
  },
  {
    key: "big_ben", label: "Big Ben", category: "Monuments",
    description: "Elizabeth Tower, Westminster — Gothic limestone shaft with 4 clock faces, belfry, corner pinnacles and spire",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.25, default: 1 },
    ],
  },
  {
    key: "angkor_wat", label: "Angkor Wat", category: "Monuments",
    description: "Khmer temple complex — 3 concentric galleries, 5 lotus towers, causeway approach",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.25, default: 1 },
    ],
  },
  {
    key: "parthenon", label: "Parthenon", category: "Monuments",
    description: "Doric temple of Athena, Athens — 8×17 cylindrical columns, 3-step marble stylobate, triglyphed entablature, raking pediments and inner cella",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.25, default: 1 },
    ],
  },
  {
    key: "arc_triomphe", label: "Arc de Triomphe", category: "Monuments",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.25, default: 1 },
    ],
  },
  {
    key: "sydney_opera", label: "Sydney Opera House", category: "Monuments",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.25, default: 1 },
    ],
  },
  {
    key: "cn_tower", label: "CN Tower", category: "Monuments",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.25, default: 1 },
    ],
  },
  {
    key: "space_needle", label: "Space Needle", category: "Monuments",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.25, default: 1 },
    ],
  },
  {
    key: "leaning_pisa", label: "Leaning Tower of Pisa", category: "Monuments",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.25, default: 1 },
    ],
  },
];

// ── Fantasy / Fiction ─────────────────────────────────────────────────────────
const FANTASY: BuildEntry[] = [
  {
    key: "hogwarts", label: "Hogwarts Castle", category: "Fantasy",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.25, default: 1 },
    ],
  },
  {
    key: "minas_tirith", label: "Minas Tirith", category: "Fantasy",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.25, default: 1 },
    ],
  },
  {
    key: "helms_deep", label: "Helm's Deep", category: "Fantasy",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.25, default: 1 },
    ],
  },
  {
    key: "the_wall_game_of_thrones", label: "The Wall (GoT)", category: "Fantasy",
    defaultParams: { length: 200 },
    params: [
      { key: "length", label: "Length (m)", min: 80, max: 400, step: 20, default: 200 },
    ],
  },
  {
    key: "azkaban_prison", label: "Azkaban Prison", category: "Fantasy",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.25, default: 1 },
    ],
  },
  {
    key: "eye_of_sauron", label: "Eye of Sauron", category: "Fantasy",
    defaultParams: { r: 50 },
    params: [
      { key: "r", label: "Tower Radius (m)", min: 20, max: 100, step: 5, default: 50 },
    ],
  },
  {
    key: "fortress_of_solitude", label: "Fortress of Solitude", category: "Fantasy",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.25, default: 1 },
    ],
  },
  {
    key: "iron_throne", label: "Iron Throne (GoT)", category: "Fantasy",
    description: "Game of Thrones — tiered base, deep seat cavity, sword-spine fan rising from CNC backrest",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.25, default: 1 },
    ],
  },
];

// ── Container Builds ──────────────────────────────────────────────────────────
const CONTAINER_BUILDS: BuildEntry[] = [
  {
    key: "sky_fort", label: "Sky Fort", category: "Containers",
    description: "Elevated container fortress on stilt columns — perimeter walls, corner towers, barrel rooftop",
    defaultParams: { scale: 1, elevation: 20 },
    params: [
      { key: "scale",     label: "Scale",           min: 0.5, max: 2,  step: 0.5,  default: 1  },
      { key: "elevation", label: "Elevation (m)",   min: 8,   max: 40, step: 4,    default: 20 },
    ],
  },
  {
    key: "container_pyramid", label: "Container Ziggurat", category: "Containers",
    description: "Stepped Mesopotamian pyramid built entirely from shipping containers, colour-banded per tier",
    defaultParams: { scale: 1, tiers: 5 },
    params: [
      { key: "scale", label: "Scale",  min: 0.5, max: 2, step: 0.5, default: 1 },
      { key: "tiers", label: "Tiers",  min: 3,   max: 7, step: 1,   default: 5 },
    ],
  },
  {
    key: "container_drum", label: "Container Drum Tower", category: "Containers",
    description: "Circular drum tower — outer ring + inner ring, crenellated battlements, barrel courtyard accents",
    defaultParams: { scale: 1, tiers: 6 },
    params: [
      { key: "scale", label: "Scale",  min: 0.5, max: 2, step: 0.5, default: 1 },
      { key: "tiers", label: "Height", min: 3,   max: 10, step: 1,  default: 6 },
    ],
  },
  {
    key: "container_helix", label: "Container Double Helix", category: "Containers",
    description: "Counter-rotating dual spiral tower — outer and inner helix of containers climbing in opposite directions",
    defaultParams: { scale: 1, turns: 4 },
    params: [
      { key: "scale", label: "Scale",  min: 0.5, max: 2, step: 0.5, default: 1 },
      { key: "turns", label: "Turns",  min: 2,   max: 6, step: 1,   default: 4 },
    ],
  },
  {
    key: "container_station", label: "Container Space Station", category: "Containers",
    description: "Sci-fi orbital outpost — cruciform core, 4 radiating arms, outer ring, barrel navigation beacons",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.5, default: 1 },
    ],
  },
];

// ── Structures / Military ─────────────────────────────────────────────────────
const STRUCTURES: BuildEntry[] = [
  {
    key: "bunker_complex", label: "Bunker Complex", category: "Structures",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.25, default: 1 },
    ],
  },
  {
    key: "the_pentagon", label: "The Pentagon", category: "Structures",
    defaultParams: { r: 100 },
    params: [
      { key: "r", label: "Radius (m)", min: 40, max: 200, step: 10, default: 100 },
    ],
  },
  {
    key: "star_fort", label: "Star Fort", category: "Structures",
    defaultParams: { r: 80, points: 5 },
    params: [
      { key: "r", label: "Radius (m)", min: 30, max: 160, step: 10, default: 80 },
      { key: "points", label: "Points", min: 4, max: 8, step: 1, default: 5 },
    ],
  },
  {
    key: "arena_fort", label: "Arena Fort", category: "Structures",
    defaultParams: { r: 60 },
    params: [
      { key: "r", label: "Radius (m)", min: 30, max: 120, step: 10, default: 60 },
    ],
  },
  {
    key: "gatehouse", label: "Gatehouse", category: "Structures",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.25, default: 1 },
    ],
  },
  {
    key: "normandy_bunkers", label: "Normandy Bunkers", category: "Structures",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.25, default: 1 },
    ],
  },
  {
    key: "alcatraz_prison", label: "Alcatraz Prison", category: "Structures",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.25, default: 1 },
    ],
  },
];

// ── Naval / Industrial ────────────────────────────────────────────────────────
const NAVAL: BuildEntry[] = [
  {
    key: "aircraft_carrier", label: "Aircraft Carrier", category: "Naval",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.25, default: 1 },
    ],
  },
  {
    key: "submarine", label: "Submarine", category: "Naval",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.25, default: 1 },
    ],
  },
  {
    key: "oil_rig", label: "Oil Rig", category: "Naval",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.25, default: 1 },
    ],
  },
  {
    key: "pirate_ship", label: "Pirate Ship", category: "Naval",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.25, default: 1 },
    ],
  },
  {
    key: "bridge_truss", label: "Truss Bridge", category: "Naval",
    defaultParams: { length: 120 },
    params: [
      { key: "length", label: "Length (m)", min: 40, max: 300, step: 20, default: 120 },
    ],
  },
];

// ── Geometric / Unique ────────────────────────────────────────────────────────
const GEOMETRIC: BuildEntry[] = [
  {
    key: "celtic_ring", label: "Celtic Ring Fort", category: "Geometric",
    defaultParams: { r: 40 },
    params: [
      { key: "r", label: "Radius (m)", min: 15, max: 80, step: 5, default: 40 },
    ],
  },
  {
    key: "dna_double", label: "DNA Double Helix", category: "Geometric",
    defaultParams: { height: 60 },
    params: [
      { key: "height", label: "Height (m)", min: 20, max: 120, step: 5, default: 60 },
    ],
  },
  {
    key: "amphitheater", label: "Amphitheater", category: "Geometric",
    defaultParams: { r: 60, tiers: 5 },
    params: [
      { key: "r", label: "Outer Radius (m)", min: 30, max: 120, step: 5, default: 60 },
      { key: "tiers", label: "Tiers", min: 2, max: 8, step: 1, default: 5 },
    ],
  },
  {
    key: "roman_aqueduct", label: "Roman Aqueduct", category: "Geometric",
    defaultParams: { length: 150, arches: 8 },
    params: [
      { key: "length", label: "Length (m)", min: 50, max: 300, step: 10, default: 150 },
      { key: "arches", label: "Arches", min: 3, max: 16, step: 1, default: 8 },
    ],
  },
  {
    key: "gothic_arch", label: "Gothic Arch Gate", category: "Geometric",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 4, step: 0.25, default: 1 },
    ],
  },
  {
    key: "dragon", label: "Dragon", category: "Geometric",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.25, default: 1 },
    ],
  },
];

// ── Primitives ────────────────────────────────────────────────────────────────
const PRIMITIVES: BuildEntry[] = [
  {
    key: "sphere", label: "Sphere", category: "Primitives",
    defaultParams: { r: 40 },
    params: [
      { key: "r", label: "Radius (m)", min: 8, max: 120, step: 4, default: 40 },
    ],
  },
  {
    key: "ring", label: "Ring", category: "Primitives",
    defaultParams: { r: 30 },
    params: [
      { key: "r", label: "Radius (m)", min: 8, max: 100, step: 4, default: 30 },
    ],
  },
  {
    key: "cylinder", label: "Cylinder", category: "Primitives",
    defaultParams: { r: 20, h: 20 },
    params: [
      { key: "r", label: "Radius (m)", min: 8, max: 80, step: 4, default: 20 },
      { key: "h", label: "Height (m)", min: 4, max: 80, step: 4, default: 20 },
    ],
  },
  {
    key: "pyramid", label: "Pyramid", category: "Primitives",
    defaultParams: { base: 48, height: 32 },
    params: [
      { key: "base", label: "Base Width (m)", min: 16, max: 160, step: 8, default: 48 },
      { key: "height", label: "Height (m)", min: 8, max: 80, step: 4, default: 32 },
    ],
  },
  {
    key: "dome", label: "Dome", category: "Primitives",
    defaultParams: { r: 40 },
    params: [
      { key: "r", label: "Radius (m)", min: 8, max: 100, step: 4, default: 40 },
    ],
  },
  {
    key: "torus", label: "Torus", category: "Primitives",
    defaultParams: { R: 40, r: 10 },
    params: [
      { key: "R", label: "Major Radius (m)", min: 16, max: 100, step: 4, default: 40 },
      { key: "r", label: "Tube Radius (m)", min: 4, max: 30, step: 2, default: 10 },
    ],
  },
  {
    key: "cube", label: "Cube / Box", category: "Primitives",
    defaultParams: { size: 32 },
    params: [
      { key: "size", label: "Side Length (m)", min: 8, max: 160, step: 8, default: 32 },
    ],
  },
  {
    key: "spiral", label: "Spiral Ramp", category: "Primitives",
    defaultParams: { r: 24, height: 40, turns: 3 },
    params: [
      { key: "r",      label: "Radius (m)",  min: 8, max: 80, step: 4, default: 24 },
      { key: "height", label: "Height (m)",  min: 8, max: 80, step: 4, default: 40 },
      { key: "turns",  label: "Turns",       min: 1, max: 6,  step: 1, default: 3  },
    ],
  },
  {
    key: "wall_line", label: "Wall Line", category: "Primitives",
    defaultParams: { length: 64 },
    params: [
      { key: "length", label: "Length (m)", min: 8, max: 400, step: 8, default: 64 },
    ],
  },
  {
    key: "arc", label: "Arc", category: "Primitives",
    defaultParams: { r: 40, angle: 180 },
    params: [
      { key: "r",     label: "Radius (m)", min: 8, max: 100, step: 4, default: 40  },
      { key: "angle", label: "Arc Angle",  min: 30, max: 360, step: 15, default: 180 },
    ],
  },
];

// ── Full catalogue ────────────────────────────────────────────────────────────
export const ALL_BUILDS: BuildEntry[] = [
  ...SCI_FI,
  ...MONUMENTS,
  ...FANTASY,
  ...CONTAINER_BUILDS,
  ...STRUCTURES,
  ...NAVAL,
  ...GEOMETRIC,
  ...PRIMITIVES,
];

export const CATEGORIES = ["All", ...Array.from(new Set(ALL_BUILDS.map(b => b.category)))];

export function getBuild(key: string): BuildEntry | undefined {
  return ALL_BUILDS.find(b => b.key === key);
}
