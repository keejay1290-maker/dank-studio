// Airdrop / dynamic event builder.
//
// Outputs three vanilla DayZ XML snippets that drop straight into a community
// server's mission folder:
//
//  1. types.xml          — defines loot type entries that get spawned
//  2. events.xml         — defines the event timing (lifetime, restock, max)
//  3. cfgeventspawns.xml — defines world coordinates where the event can fire
//
// Format validated against the DayZ File Toolbox NPC Event Maker schema
// (Event Name, Nominal/Min/Max, Lifetime, Restock, Safe/Distance/Cleanup
// Radius, Active, Deletable) and the official Bohemia event schema.

export interface AirdropPoint {
  x: number;
  y: number;   // height (usually -1 = ground)
  z: number;
  groupName?: string;   // optional logical grouping
}

export interface AirdropConfig {
  name:          string;     // e.g. "AirDropContainer_Military"
  containerType: string;     // classname of the dropped container/zone
  lootTier:      "basic" | "military" | "elite" | "contaminated";

  // event scheduling
  nominal:       number;     // typical active count
  min:           number;
  max:           number;
  lifetime:      number;     // seconds the airdrop persists once spawned
  restock:       number;     // seconds before respawn possible
  saveInterval:  number;     // seconds between persistence saves
  active:        boolean;
  deletable:     boolean;

  // safety zones (in metres)
  safeRadius:     number;    // no airdrop within radius of player
  distanceRadius: number;    // detection range
  cleanupRadius:  number;    // dead loot cleanup range

  // spawn locations
  positions:     AirdropPoint[];
}

export const LOOT_TIERS: Record<AirdropConfig["lootTier"], string[]> = {
  basic: [
    "BandageDressing", "Rag", "PeachesCan", "BakedBeansCan",
    "Mag_Glock_15Rnd", "Glock19", "AmmoBox_9x19_25rnd",
    "ChemLightYellow", "RoadFlare", "Matchbox",
  ],
  military: [
    "M4A1_Black", "Mag_STANAG_30Rnd", "AmmoBox_556x45_20Rnd",
    "AKM", "Mag_AKM_30Rnd", "AmmoBox_762x39_20Rnd",
    "PlateCarrierVest_Camo", "BallisticHelmet_Green", "AliceBag_Camo",
    "BandageDressing", "Morphine", "Epinephrine", "TacticalBaconCan",
    "NVGHeadstrap", "NVGoggles", "Battery9V",
  ],
  elite: [
    "VSD", "Mag_SVD_10Rnd", "AmmoBox_762x54_20Rnd", "PSO1Optic",
    "M4A1_Green", "Mag_STANAG_60Rnd", "ACOGOptic_6x", "M4_Suppressor",
    "Deagle_Gold", "Mag_Deagle_9rnd", "AmmoBox_357_20Rnd",
    "GhillieSuit_Mossy", "GhillieHood_Mossy", "GhillieAtt_Mossy",
    "PlateCarrierVest_Black", "BallisticHelmet_Black",
    "SalineBagIV", "TetracyclineAntibiotics", "Splint",
    "AssaultBag_Ttsko",
  ],
  contaminated: [
    "NBCJacketGray", "NBCPantsGray", "NBCGlovesGray", "NBCBootsGray",
    "GasMask_Filter", "AirborneMask",
    "TetracyclineAntibiotics", "Vitamin", "VitaminBottle", "CharcoalTabletsBottle",
    "BandageDressing", "BandageDressing", "SalineBagIV",
  ],
};

export function defaultAirdrop(): AirdropConfig {
  return {
    name:           "AirDrop_Military",
    containerType:  "Land_Container_1Mo",
    lootTier:       "military",
    nominal:        1,
    min:            0,
    max:            2,
    lifetime:       1800,         // 30 min on ground
    restock:        0,
    saveInterval:   60,
    active:         true,
    deletable:      true,
    safeRadius:     800,
    distanceRadius: 1500,
    cleanupRadius:  300,
    positions: [
      { x: 7500,  y: -1, z: 7500,  groupName: "central" },
      { x: 9000,  y: -1, z: 11000, groupName: "north_woods" },
      { x: 4500,  y: -1, z: 9500,  groupName: "south_coast" },
    ],
  };
}

// ── EVENTS.XML EXPORT ─────────────────────────────────────────────────────────
export function toEventsXml(c: AirdropConfig): string {
  const L: string[] = [];
  L.push(`<event name="${c.name}">`);
  L.push(`\t<nominal>${c.nominal}</nominal>`);
  L.push(`\t<min>${c.min}</min>`);
  L.push(`\t<max>${c.max}</max>`);
  L.push(`\t<lifetime>${c.lifetime}</lifetime>`);
  L.push(`\t<restock>${c.restock}</restock>`);
  L.push(`\t<saveinterval>${c.saveInterval}</saveinterval>`);
  L.push(`\t<active>${c.active ? 1 : 0}</active>`);
  L.push(`\t<deletable>${c.deletable ? 1 : 0}</deletable>`);
  L.push(`\t<position>fixed</position>`);
  L.push(`\t<limit>custom</limit>`);
  L.push(`\t<safe>${c.safeRadius}</safe>`);
  L.push(`\t<distance>${c.distanceRadius}</distance>`);
  L.push(`\t<cleanupRadius>${c.cleanupRadius}</cleanupRadius>`);
  L.push(`\t<children>`);
  L.push(`\t\t<child lootmax="0" lootmin="0" max="1" min="1" type="${c.containerType}" />`);
  L.push(`\t</children>`);
  L.push(`</event>`);
  return L.join("\n");
}

// ── CFGEVENTSPAWNS.XML EXPORT ─────────────────────────────────────────────────
export function toCfgEventSpawnsXml(c: AirdropConfig): string {
  const L: string[] = [];
  L.push(`<event name="${c.name}">`);
  for (const p of c.positions) {
    const grp = p.groupName ? ` group="${p.groupName}"` : "";
    L.push(`\t<pos x="${p.x.toFixed(2)}" z="${p.z.toFixed(2)}" a="0" smnpc="" smin="0" smax="0" dmin="0" dmax="0"${grp} />`);
  }
  L.push(`</event>`);
  return L.join("\n");
}

// ── TYPES.XML EXPORT (loot table) ─────────────────────────────────────────────
export function toLootTypesXml(c: AirdropConfig): string {
  const L: string[] = [];
  L.push(`<!-- Loot pool for ${c.name} (${c.lootTier} tier) — paste into types.xml under <types> -->`);
  for (const item of LOOT_TIERS[c.lootTier]) {
    L.push(`<type name="${item}">`);
    L.push(`\t<nominal>15</nominal>`);
    L.push(`\t<lifetime>${c.lifetime}</lifetime>`);
    L.push(`\t<restock>0</restock>`);
    L.push(`\t<min>5</min>`);
    L.push(`\t<quantmin>-1</quantmin>`);
    L.push(`\t<quantmax>-1</quantmax>`);
    L.push(`\t<cost>100</cost>`);
    L.push(`\t<flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="1"/>`);
    L.push(`\t<category name="containers"/>`);
    L.push(`\t<usage name="Military"/>`);
    L.push(`</type>`);
  }
  return L.join("\n");
}

// ── COMBINED EXPORT (all three snippets in one document) ──────────────────────
export function toCombinedXml(c: AirdropConfig): string {
  return [
    `<!-- ═════════ events.xml ═════════ -->`,
    toEventsXml(c),
    ``,
    `<!-- ═════════ cfgeventspawns.xml ═════════ -->`,
    toCfgEventSpawnsXml(c),
    ``,
    `<!-- ═════════ types.xml (loot pool) ═════════ -->`,
    toLootTypesXml(c),
  ].join("\n");
}
