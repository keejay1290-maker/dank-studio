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
    defaultParams: { r: 40 },
    params: [
      { key: "r", label: "Radius (m)", min: 20, max: 55, step: 2, default: 40 },
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
    key: "pentagram", label: "Pentagram", category: "Structures",
    description: "5-pointed star of castle battlement walls with tower tips at each vertex",
    defaultParams: { r: 22, scale: 1 },
    params: [
      { key: "r", label: "Radius (m)", min: 10, max: 60, step: 2, default: 22 },
      { key: "scale", label: "Wall Scale", min: 0.5, max: 2, step: 0.5, default: 1 },
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
    description: "Paris, 1836. 50m limestone triumphal arch — main 29m semicircular arch on N/S faces, secondary 18.7m arches on E/W faces, carved attic above.",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.25, default: 1 },
    ],
  },
  {
    key: "sydney_opera", label: "Sydney Opera House", category: "Monuments",
    description: "Sydney, 1973. Utzon's sail-shell masterpiece — 3-tier podium on Bennelong Point, Concert Hall (west, 67m) and Opera Theatre (east, 59m) as nested paired vaults tapering from front to rear.",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.25, default: 1 },
    ],
  },
  {
    key: "cn_tower", label: "CN Tower", category: "Monuments",
    description: "Toronto, 1976. 553m free-standing concrete tower — Y-shaped tripod base with 3 massive fins, tapered hexagonal shaft, wide observation pod at 342m with glass-floor deck, SkyPod disc at 447m, tapering antenna spire.",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.25, default: 1 },
    ],
  },
  {
    key: "space_needle", label: "Space Needle", category: "Monuments",
    description: "Seattle, 1962. 184m — three-legged tripod base converging to an ultra-thin shaft, iconic flying-saucer observation deck with flared underside, tapering spire.",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.25, default: 1 },
    ],
  },
  {
    key: "leaning_pisa", label: "Leaning Tower of Pisa", category: "Monuments",
    description: "Pisa, 1372. 56m white marble campanile with 3.97° southward lean — 8 tiers with projecting open colonnades at each gallery floor, narrow belfry at crown.",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.25, default: 1 },
    ],
  },
  {
    key: "mont_saint_michel", label: "Mont-Saint-Michel", category: "Monuments",
    description: "Norman tidal island abbey — 5 ascending stone tiers crowned by a Gothic Benedictine church and slender spire",
    defaultParams: { scale: 1 },
    params: [{ key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.25, default: 1 }],
  },
  {
    key: "sagrada_familia", label: "Sagrada Família", category: "Monuments",
    description: "Gaudí's organic Barcelona basilica — 13 parabolic stone towers with distinctive corn-cob taper",
    defaultParams: { scale: 0.5 },
    params: [{ key: "scale", label: "Scale", min: 0.25, max: 1, step: 0.25, default: 0.5 }],
  },
  {
    key: "chrysler_building", label: "Chrysler Building", category: "Monuments",
    description: "Art Deco NYC skyscraper — IND10 ziggurat setbacks, eagle gargoyles, 7-tier sunburst crown, MILCNC needle spire",
    defaultParams: { scale: 1 },
    params: [{ key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.25, default: 1 }],
  },
  {
    key: "tower_of_london", label: "Tower of London", category: "Monuments",
    description: "Norman fortress — White Tower central keep, concentric curtain walls, 13 towers, Traitors' Gate",
    defaultParams: { scale: 0.5 },
    params: [{ key: "scale", label: "Scale", min: 0.25, max: 1, step: 0.25, default: 0.5 }],
  },
  {
    key: "great_wall", label: "Great Wall of China", category: "Monuments",
    description: "IND10 dual-face fortification with watchtowers every 40m — parameterised length from 80m to 300m",
    defaultParams: { length: 160 },
    params: [{ key: "length", label: "Length (m)", min: 80, max: 300, step: 10, default: 160 }],
  },
  {
    key: "alhambra_palace", label: "Alhambra Palace", category: "Monuments",
    description: "Nasrid Moorish fortress-palace, Granada — Court of the Lions CNC4 arcade, central fountain, Comares Tower (45m IND10), STONE2 outer curtain wall with MILCNC square towers every 25m",
    defaultParams: { scale: 0.5 },
    params: [{ key: "scale", label: "Scale", min: 0.25, max: 1, step: 0.25, default: 0.5 }],
  },
  {
    key: "hagia_sophia", label: "Hagia Sophia", category: "Monuments",
    description: "Byzantine basilica, Istanbul (537 AD) — IND10 nave, STONE2 central dome (31m dia), two flanking half-domes, 4 tapering MILCNC minarets at corners",
    defaultParams: { scale: 0.5 },
    params: [{ key: "scale", label: "Scale", min: 0.25, max: 1, step: 0.25, default: 0.5 }],
  },
  {
    key: "rivendell", label: "Rivendell", category: "Monuments",
    description: "LOTR Elven valley refuge — 5 STONE2 terraces stepping into a mountain gorge, CNC4 spire towers, arched bridge spanning the gorge, waterfall cascade column",
    defaultParams: { scale: 0.5 },
    params: [{ key: "scale", label: "Scale", min: 0.25, max: 1, step: 0.25, default: 0.5 }],
  },
  {
    key: "isengard", label: "Isengard / Orthanc", category: "Monuments",
    description: "LOTR Saruman's fortress — hexagonal IND10 Orthanc spire (80m, slight taper), 4 MILCNC horn pinnacles at crown, outer IND10 ring wall with Ent-breach gaps, barrel_red furnace pits",
    defaultParams: { scale: 0.5 },
    params: [{ key: "scale", label: "Scale", min: 0.25, max: 1, step: 0.25, default: 0.5 }],
  },
];

// ── Fantasy / Fiction ─────────────────────────────────────────────────────────
const FANTASY: BuildEntry[] = [
  {
    key: "hogwarts", label: "Hogwarts Castle", category: "Fantasy",
    description: "Scottish Gothic castle — main keep with parapets, Great Hall south wing with pointed gable, Astronomy Tower (NE, tallest), 3 corner towers at varied heights, Clock Tower annex, viaduct bridge.",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.25, default: 1 },
    ],
  },
  {
    key: "minas_tirith", label: "Minas Tirith", category: "Fantasy",
    description: "City of Kings, Gondor — seven concentric stone tiers carved into Mount Mindolluin, each set back above the last, crowned by the White Tower of Ecthelion.",
    defaultParams: { scale: 0.5 },
    params: [
      { key: "scale", label: "Scale", min: 0.25, max: 1, step: 0.25, default: 0.5 },
    ],
  },
  {
    key: "helms_deep", label: "Helm's Deep", category: "Fantasy",
    description: "The Hornburg fortress of Rohan — the great Deeping Wall curtain wall with interval towers, the large circular Hornburg keep on the west rock, and the Deeping Tower at the east end.",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.25, default: 1 },
    ],
  },
  {
    key: "the_wall_game_of_thrones", label: "The Wall (GoT)", category: "Fantasy",
    description: "Colossal Night's Watch ice fortification on the northern border of Westeros — dual-face curtain wall game-scaled to 60m, with CASTLE battlements and evenly-spaced waycastles along the parapet.",
    defaultParams: { length: 200 },
    params: [
      { key: "length", label: "Length (m)", min: 80, max: 400, step: 20, default: 200 },
    ],
  },
  {
    key: "azkaban_prison", label: "Azkaban Prison", category: "Fantasy",
    description: "Remote North Sea island fortress from Harry Potter — triangular IND10 dark keep, three corner watchtowers, and a central tapering spire housing the Dementor cells.",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.25, default: 1 },
    ],
  },
  {
    key: "eye_of_sauron", label: "Eye of Sauron", category: "Fantasy",
    description: "Barad-dûr tower crown, LOTR. Tapered dark IND10 tower, CNC8 crown battlements, twin flanking horn spires arching outward, fiery barrel_red elliptical pupil slit at the summit.",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.25, default: 1 },
    ],
  },
  {
    key: "fortress_of_solitude", label: "Fortress of Solitude", category: "Fantasy",
    description: "Superman's Arctic sanctuary — Kryptonian-grown white crystal spires in three rings: 6 outer tall spires, 4 inner medium spires, central mega-spire tapering to a point.",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.25, default: 1 },
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
  {
    key: "camelot", label: "Camelot Castle", category: "Fantasy",
    description: "Arthurian legend — concentric STONE2 outer & inner wards with D-shaped corner towers, central IND10 Great Hall (3 tiers), Round Table courtyard with CNC4 decorative ring",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.25, default: 1 },
    ],
  },
  {
    key: "winterfell", label: "Winterfell (GoT)", category: "Fantasy",
    description: "Stark ancestral seat from Game of Thrones — outer STONE2 walls with 4 corner towers, IND10 Great Keep, partially ruined Broken Tower, CNC4 Glass Gardens greenhouse, crypts entrance",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.25, default: 1 },
    ],
  },
  {
    key: "black_gate", label: "Black Gate (Morannon)", category: "Fantasy",
    description: "LOTR gates of Mordor — twin IND10 flanking towers (40m), portcullis frame wall with central gap, raised gate tower, secondary defence wall, barrel_red Orc fire pits",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.25, default: 1 },
    ],
  },
  {
    key: "gondor_beacon", label: "Gondor Beacon Tower", category: "Fantasy",
    description: "LOTR White Mountains signal beacon (Amon Dîn) — tall STONE2 watchtower, CASTLE crenellated parapet, barrel_red/yellow beacon pyre at summit, 4 buttress fins, CNC4 gateway arch",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.25, default: 1 },
    ],
  },
  {
    key: "stormwind", label: "Stormwind City (WoW)", category: "Fantasy",
    description: "World of Warcraft Alliance capital — CNC4 Cathedral of Light with Gothic spire, Trade District IND10 buildings around fountain, Stormwind Keep with 3 towers, STONE2 outer city walls, CNC8 Throne Room spire",
    defaultParams: { scale: 0.5 },
    params: [
      { key: "scale", label: "Scale", min: 0.25, max: 1.5, step: 0.25, default: 0.5 },
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
  {
    key: "container_fortress", label: "Container Fortress", category: "Containers",
    description: "Square container perimeter wall with raised corner watchtowers and rooftop edge — no gaps, grid-aligned rotation",
    defaultParams: { tiers: 4, side: 5 },
    params: [
      { key: "tiers",  label: "Wall Height (tiers)", min: 2, max: 8,  step: 1, default: 4 },
      { key: "side",   label: "Containers Per Side",  min: 3, max: 10, step: 1, default: 5 },
    ],
  },
  {
    key: "container_starport", label: "Container Starport", category: "Containers",
    description: "Circular landing pad with container ring, IND10 tarmac, control tower, radar dish and refuelling bay",
    defaultParams: { r: 40, tiers: 3 },
    params: [
      { key: "r",     label: "Pad Radius (m)",  min: 20, max: 80, step: 5,  default: 40 },
      { key: "tiers", label: "Ring Height",      min: 1,  max: 6,  step: 1,  default: 3  },
    ],
  },
  {
    key: "container_shantytown", label: "Container Shantytown", category: "Containers",
    description: "Irregular stacked container settlement — ramshackle multi-level grid with alleyways, overhangs and barrel details",
    defaultParams: { density: 4, height: 3 },
    params: [
      { key: "density", label: "Grid Density", min: 2, max: 7, step: 1, default: 4 },
      { key: "height",  label: "Max Stack Height", min: 1, max: 5, step: 1, default: 3 },
    ],
  },
];

// ── Structures / Military ─────────────────────────────────────────────────────
const STRUCTURES: BuildEntry[] = [
  {
    key: "bunker_complex", label: "Bunker Complex", category: "Structures",
    description: "Underground concrete bunker — front entrance passage, internal corridor, 3 exploration rooms, ventilation towers",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.25, default: 1 },
    ],
  },
  {
    key: "the_pentagon", label: "The Pentagon", category: "Structures",
    description: "US Department of Defense HQ, Arlington, Virginia (1943) — five concentric pentagonal rings of 4-storey MILCNC office buildings connected by 5 radial spoke corridors.",
    defaultParams: { r: 100 },
    params: [
      { key: "r", label: "Radius (m)", min: 40, max: 200, step: 10, default: 100 },
    ],
  },
  {
    key: "star_fort", label: "Star Fort", category: "Structures",
    description: "Vauban-style trace italienne star fort — outer star polygon of angled bastion tips and gorge corners designed to eliminate cannon blind spots, with inner citadel ring.",
    defaultParams: { r: 80, points: 5 },
    params: [
      { key: "r", label: "Radius (m)", min: 30, max: 160, step: 10, default: 80 },
      { key: "points", label: "Points", min: 4, max: 8, step: 1, default: 5 },
    ],
  },
  {
    key: "arena_fort", label: "Arena Fort", category: "Structures",
    description: "Circular curtain-wall fort — IND10 ring wall with CASTLE battlements, four D-shaped projecting towers at the cardinal points, and a taller circular inner keep.",
    defaultParams: { r: 60 },
    params: [
      { key: "r", label: "Radius (m)", min: 30, max: 120, step: 10, default: 60 },
    ],
  },
  {
    key: "gatehouse", label: "Gatehouse", category: "Structures",
    description: "Medieval fortified gate passage — twin STONE2 cylindrical flanking towers with CASTLE battlements, connecting curtain walls, and a pointed arch spanning the gate.",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.25, default: 1 },
    ],
  },
  {
    key: "normandy_bunkers", label: "Normandy Bunkers", category: "Structures",
    description: "Atlantic Wall Widerstandsnest, D-Day 1944 — staggered line of Tobruk-style CNC8 bunkers with stepped roofs and gun slits, fronted by a barbed wire barrier line.",
    defaultParams: { spread: 80 },
    params: [
      { key: "spread", label: "Spread (m)", min: 40, max: 160, step: 20, default: 80 },
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
    description: "Nimitz-class supercarrier — 200m flight deck, island superstructure, catapult tracks",
    defaultParams: { length: 200 },
    params: [
      { key: "length", label: "Length (m)", min: 100, max: 250, step: 10, default: 200 },
    ],
  },
  {
    key: "submarine", label: "Submarine", category: "Naval",
    description: "Los Angeles-class nuclear submarine — tapered pressure hull, conning sail, cruciform fins",
    defaultParams: { length: 100 },
    params: [
      { key: "length", label: "Length (m)", min: 50, max: 150, step: 10, default: 100 },
    ],
  },
  {
    key: "oil_rig", label: "Oil Rig", category: "Naval",
    description: "North Sea semi-submersible — 4 pontoon legs, lattice deck, 50m drill derrick, flare stack",
    defaultParams: {},
    params: [],
  },
  {
    key: "pirate_ship", label: "Pirate Ship", category: "Naval",
    description: "17th-century galleon — tapered hull, forecastle, sterncastle, 3 masts with crow's nests, 8 cannon ports",
    defaultParams: { length: 60 },
    params: [
      { key: "length", label: "Length (m)", min: 40, max: 90, step: 5, default: 60 },
    ],
  },
  {
    key: "bridge_truss", label: "Truss Bridge", category: "Naval",
    description: "Warren truss road bridge — diagonal V-pattern steel, 2 suspension towers, MILCNC deck",
    defaultParams: { length: 120 },
    params: [
      { key: "length", label: "Span (m)", min: 60, max: 200, step: 10, default: 120 },
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

// ── Creative Megastructures ───────────────────────────────────────────────────
const CREATIVE: BuildEntry[] = [
  {
    key: "dyson_sphere", label: "Dyson Sphere", category: "Creative",
    description: "Partial megastructure framework surrounding a central star — latitude rings, longitude struts and equatorial maintenance bays at enormous scale",
    defaultParams: { r: 80 },
    params: [
      { key: "r", label: "Radius (m)", min: 40, max: 150, step: 5, default: 80 },
    ],
  },
  {
    key: "barad_dur", label: "Barad-dûr", category: "Creative",
    description: "Sauron's Dark Tower — three IND10 base tiers, tapering MILCNC shaft, mid-shaft buttress fins, flared crown with Eye of Sauron and horn battlements",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.25, max: 2, step: 0.25, default: 1 },
    ],
  },
  {
    key: "mass_effect_citadel", label: "Mass Effect Citadel", category: "Creative",
    description: "Presidium ring torus with five radiating Ward arms at 72° intervals, CNC8 arm-tip terminals, Keeper hub spire, and barrel_blue navigation lights",
    defaultParams: { scale: 1 },
    params: [
      { key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.25, default: 1 },
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
  ...CREATIVE,
];

export const CATEGORIES = ["All", ...Array.from(new Set(ALL_BUILDS.map(b => b.category)))];

export function getBuild(key: string): BuildEntry | undefined {
  return ALL_BUILDS.find(b => b.key === key);
}
