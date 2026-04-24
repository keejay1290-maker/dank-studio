// DayZ item database extracted from reference configs.
// Source of truth: types.xml + Josie's NPC Workshop.
// Extend this as you add items to your server.

export type SlotName =
  | "shoulderL" | "shoulderR" | "Hands"
  | "Body" | "Vest" | "Back"
  | "Legs" | "Feet" | "Headgear"
  | "Mask" | "Eyewear" | "Gloves"
  | "Armband" | "Belt" | "Hips";

export interface WeaponDef {
  name: string;           // classname
  caliber: string;        // e.g. "556x45", "762x39"
  mags: string[];         // compatible magazines (classnames)
  ammo: string[];         // compatible ammo boxes/rounds
  attachments?: string[]; // common attachments (optics/stocks/handguards/suppressors)
  kind: "rifle" | "sniper" | "dmr" | "smg" | "shotgun" | "pistol";
}

export interface ClothingSet {
  id: string;
  label: string;
  theme: "military" | "sniper" | "bandit" | "police" | "civilian" | "cowboy" | "hunter" | "prison" | "firefighter";
  items: Partial<Record<SlotName, string[]>>; // slot → item classnames (pick 1 per slot)
}

// ── CORE WEAPONS ──────────────────────────────────────────────────────────────
export const WEAPONS: WeaponDef[] = [
  // 5.56
  { name: "M4A1",        caliber: "556x45", kind: "rifle", mags: ["Mag_STANAG_30Rnd", "Mag_STANAG_60Rnd", "Mag_CMAG_30Rnd", "Mag_CMAG_40Rnd", "Mag_STANAGCoupled_30Rnd"], ammo: ["AmmoBox_556x45_20Rnd", "AmmoBox_556x45Tracer_20Rnd"], attachments: ["ACOGOptic", "ACOGOptic_6x", "M68Optic", "ReflexOptic", "M4_T3NRDSOptic", "M4_Suppressor", "M4_MPBttstck", "M4_CQBBttstck", "M4_OEBttstck_Black", "M4_RISHndgrd", "M4_PlasticHndgrd_Black", "UniversalLight"] },
  { name: "M4A1_Black",  caliber: "556x45", kind: "rifle", mags: ["Mag_STANAG_30Rnd", "Mag_STANAG_60Rnd"], ammo: ["AmmoBox_556x45_20Rnd"], attachments: ["ACOGOptic", "M4_Suppressor", "M4_OEBttstck_Black", "M4_PlasticHndgrd_Black"] },
  { name: "M4A1_Green",  caliber: "556x45", kind: "rifle", mags: ["Mag_STANAG_30Rnd", "Mag_STANAG_60Rnd"], ammo: ["AmmoBox_556x45_20Rnd"], attachments: ["ACOGOptic", "M4_Suppressor", "M4_MPBttstck_Green", "M4_RISHndgrd_Green"] },
  { name: "M16A2",       caliber: "556x45", kind: "rifle", mags: ["Mag_STANAG_30Rnd", "Mag_STANAG_60Rnd"], ammo: ["AmmoBox_556x45_20Rnd"] },
  { name: "FAMAS",       caliber: "556x45", kind: "rifle", mags: ["Mag_FAMAS_25Rnd"], ammo: ["AmmoBox_556x45_20Rnd"] },
  { name: "Aug",         caliber: "556x45", kind: "rifle", mags: ["Mag_Aug_30Rnd", "Mag_STANAG_60Rnd"], ammo: ["AmmoBox_556x45_20Rnd"], attachments: ["ReflexOptic", "AugOptic"] },
  { name: "AUG",         caliber: "556x45", kind: "rifle", mags: ["Mag_Aug_30Rnd", "Mag_STANAG_60Rnd"], ammo: ["AmmoBox_556x45_20Rnd"], attachments: ["ReflexOptic", "AugOptic"] },

  // 7.62x39
  { name: "AKM",         caliber: "762x39", kind: "rifle", mags: ["Mag_AKM_30Rnd"], ammo: ["AmmoBox_762x39_20Rnd", "AmmoBox_762x39Tracer_20Rnd"], attachments: ["AK_WoodBttstck", "AK_WoodHndgrd", "AK_Suppressor", "KobraOptic", "PSO1Optic"] },
  { name: "SKS",         caliber: "762x39", kind: "rifle", mags: [], ammo: ["AmmoBox_762x39_20Rnd"], attachments: ["PUScopeOptic"] },
  { name: "AK101",       caliber: "556x45", kind: "rifle", mags: ["Mag_AK101_30Rnd"], ammo: ["AmmoBox_556x45_20Rnd"], attachments: ["AK_PlasticBttstck", "AK_PlasticHndgrd"] },

  // 5.45x39
  { name: "AK74",        caliber: "545x39", kind: "rifle", mags: ["Mag_AK74_30Rnd", "Mag_AK74_45Rnd"], ammo: ["AmmoBox_545x39_20Rnd", "AmmoBox_545x39Tracer_20Rnd"], attachments: ["AK74_WoodBttstck", "AK74_Hndgrd"] },
  { name: "AKS74U",      caliber: "545x39", kind: "smg",   mags: ["Mag_AK74_30Rnd"], ammo: ["AmmoBox_545x39_20Rnd"], attachments: ["AKS74U_Bttstck"] },

  // 7.62x51 / .308
  { name: "M14",         caliber: "308",    kind: "dmr",   mags: ["Mag_M14_20Rnd"], ammo: ["AmmoBox_308Win_20Rnd", "AmmoBox_308WinTracer_20Rnd"], attachments: ["MK4Optic", "MK4Optic_Black"] },
  { name: "FAL",         caliber: "308",    kind: "rifle", mags: ["Mag_FAL_20Rnd"], ammo: ["AmmoBox_308Win_20Rnd"], attachments: ["ReflexOptic", "Fal_FoldingBttstck", "Fal_OeBttstck", "ACOGOptic", "ImprovisedSuppressor"] },
  { name: "Winchester70",       caliber: "308", kind: "sniper", mags: [], ammo: ["AmmoBox_308Win_20Rnd"], attachments: ["HuntingOptic"] },
  { name: "Winchester70_Black", caliber: "308", kind: "sniper", mags: [], ammo: ["AmmoBox_308Win_20Rnd"], attachments: ["HuntingOptic"] },
  { name: "B95",         caliber: "308",    kind: "sniper", mags: [], ammo: ["AmmoBox_308Win_20Rnd"], attachments: ["HuntingOptic"] },

  // 7.62x54
  { name: "Mosin9130",   caliber: "762x54", kind: "sniper", mags: [], ammo: ["AmmoBox_762x54_20Rnd"], attachments: ["PUScopeOptic"] },
  { name: "Mosin9130_Camo", caliber: "762x54", kind: "sniper", mags: [], ammo: ["AmmoBox_762x54_20Rnd"], attachments: ["PUScopeOptic", "GhillieAtt_Mossy"] },
  { name: "VSD",         caliber: "762x54", kind: "sniper", mags: ["Mag_SVD_10Rnd"], ammo: ["AmmoBox_762x54_20Rnd"], attachments: ["PSO6Optic"] },
  { name: "SVD_Wooden",  caliber: "762x54", kind: "sniper", mags: ["Mag_SVD_10Rnd"], ammo: ["AmmoBox_762x54_20Rnd"], attachments: ["PSO6Optic"] },
  { name: "SV98",        caliber: "762x54", kind: "sniper", mags: ["Mag_SV98_10Rnd"], ammo: ["AmmoBox_762x54_20Rnd"], attachments: ["MK4Optic_Black"] },

  // Subsonic / 9x39
  { name: "VSS",         caliber: "9x39",   kind: "dmr",   mags: ["Mag_Vikhr_30Rnd"], ammo: ["AmmoBox_9x39_20Rnd", "AmmoBox_9x39AP_20Rnd"], attachments: ["PSO6Optic"] },
  { name: "ASVAL",       caliber: "9x39",   kind: "dmr",   mags: ["Mag_Vikhr_30Rnd", "Mag_VAL_20Rnd"], ammo: ["AmmoBox_9x39_20Rnd", "AmmoBox_9x39AP_20Rnd"], attachments: ["ReflexOptic", "ACOGOptic"] },
  { name: "Vikhr",       caliber: "9x39",   kind: "dmr",   mags: ["Mag_Vikhr_30Rnd"], ammo: ["AmmoBox_9x39_20Rnd"] },

  // Shotguns
  { name: "Mp133Shotgun", caliber: "12ga",  kind: "shotgun", mags: [], ammo: ["AmmoBox_00buck_10rnd", "AmmoBox_12gaSlug_10Rnd"], attachments: ["FNP45_MRDSOptic"] },
  { name: "MP133Shotgun", caliber: "12ga",  kind: "shotgun", mags: [], ammo: ["AmmoBox_00buck_10rnd", "AmmoBox_12gaSlug_10Rnd"] },
  { name: "Saiga",       caliber: "12ga",   kind: "shotgun", mags: ["Mag_Saiga_Drum20Rnd"], ammo: ["AmmoBox_00buck_10rnd"], attachments: ["Saiga_Bttstck"] },
  { name: "R12",         caliber: "12ga",   kind: "shotgun", mags: [], ammo: ["AmmoBox_00buck_10rnd"], attachments: ["UniversalLight", "ReflexOptic"] },

  // Bolt-action .308 scout
  { name: "Scout",             caliber: "308", kind: "sniper", mags: ["Mag_Scout_5Rnd"], ammo: ["AmmoBox_308Win_20Rnd"], attachments: ["M68Optic", "ACOGOptic", "ACOGOptic_6x", "M4_Suppressor"] },
  { name: "Scout_Chernarus",   caliber: "308", kind: "sniper", mags: ["Mag_Scout_5Rnd"], ammo: ["AmmoBox_308Win_20Rnd"], attachments: ["M68Optic", "ACOGOptic_6x"] },
  { name: "Scout_Livonia",     caliber: "308", kind: "sniper", mags: ["Mag_Scout_5Rnd"], ammo: ["AmmoBox_308Win_20Rnd"], attachments: ["M68Optic", "ACOGOptic_6x"] },

  // SSG82
  { name: "SSG82",       caliber: "5.45",   kind: "sniper", mags: ["Mag_SSG82_5rnd"], ammo: ["AmmoBox_545x39_20Rnd"], attachments: ["SSG82Optic"] },

  // SMGs / PDW
  { name: "MP5K",        caliber: "9x19",   kind: "smg",   mags: ["Mag_MP5_30Rnd"], ammo: ["AmmoBox_9x19_25rnd"], attachments: ["MP5_RailHndgrd", "MP5k_StockBttstck", "ReflexOptic", "PistolSuppressor"] },
  { name: "UMP45",       caliber: "45ACP",  kind: "smg",   mags: ["Mag_UMP_25Rnd"], ammo: ["AmmoBox_45ACP_25Rnd"], attachments: ["ReflexOptic", "PistolSuppressor"] },
  { name: "PP19",        caliber: "9x19",   kind: "smg",   mags: ["Mag_PP19_64Rnd"], ammo: ["AmmoBox_9x19_25rnd"], attachments: ["PistolSuppressor", "PP19_Bttstck", "KobraOptic"] },
  { name: "CZ61",        caliber: "32ACP",  kind: "smg",   mags: ["Mag_CZ61_20Rnd"], ammo: ["Ammo_32ACP"], attachments: ["PistolSuppressor"] },
  { name: "PM73Rak",     caliber: "9x18",   kind: "smg",   mags: ["Mag_PM73_25Rnd", "Mag_PM73_15Rnd"], ammo: ["Ammo_9x18"] },

  // Pistols (sidearms)
  { name: "Glock19",     caliber: "9x19",   kind: "pistol", mags: ["Mag_Glock_15Rnd"], ammo: ["AmmoBox_9x19_25rnd"], attachments: ["PistolSuppressor", "TLRLight", "FNP45_MRDSOptic"] },
  { name: "FNX45",       caliber: "45ACP",  kind: "pistol", mags: ["Mag_FNX45_15Rnd"], ammo: ["AmmoBox_45ACP_25Rnd"], attachments: ["PistolSuppressor", "FNP45_MRDSOptic"] },
  { name: "Colt1911",    caliber: "45ACP",  kind: "pistol", mags: ["Mag_1911_7Rnd"], ammo: ["AmmoBox_45ACP_25Rnd"], attachments: ["PistolSuppressor"] },
  { name: "Engraved1911",caliber: "45ACP",  kind: "pistol", mags: ["Mag_1911_7Rnd"], ammo: ["AmmoBox_45ACP_25Rnd"], attachments: ["PistolSuppressor"] },
  { name: "CZ75",        caliber: "9x19",   kind: "pistol", mags: ["Mag_CZ75_15Rnd"], ammo: ["AmmoBox_9x19_25rnd"], attachments: ["PistolSuppressor", "TLRLight"] },
  { name: "MakarovIJ70", caliber: "9x18",   kind: "pistol", mags: ["Mag_IJ70_8Rnd"], ammo: ["Ammo_9x18"] },
  { name: "MKII",        caliber: "22LR",   kind: "pistol", mags: ["Mag_MKII_10Rnd"], ammo: ["Ammo_22"] },
  { name: "Deagle",      caliber: "357",    kind: "pistol", mags: ["Mag_Deagle_9rnd"], ammo: ["Ammo_357", "AmmoBox_357_20Rnd"], attachments: ["PistolOptic"] },
  { name: "Deagle_Gold", caliber: "357",    kind: "pistol", mags: ["Mag_Deagle_9rnd"], ammo: ["Ammo_357", "AmmoBox_357_20Rnd"], attachments: ["PistolOptic"] },
  { name: "LongHorn",    caliber: "308",    kind: "pistol", mags: [], ammo: ["AmmoBox_308Win_20Rnd"], attachments: ["PistolOptic"] },
  { name: "P1",          caliber: "9x19",   kind: "pistol", mags: ["Mag_P1_8Rnd"], ammo: ["AmmoBox_9x19_25rnd"], attachments: ["PistolSuppressor"] },
];

export const WEAPON_INDEX: Record<string, WeaponDef> = Object.fromEntries(WEAPONS.map(w => [w.name, w]));

// ── THEMED CLOTHING SETS ──────────────────────────────────────────────────────
export const CLOTHING_SETS: ClothingSet[] = [
  {
    id: "military_woodland", label: "Military — Woodland", theme: "military",
    items: {
      Headgear: ["BallisticHelmet_Green", "Mich2001Helmet", "GorkaHelmet"],
      Mask:     ["BalaclavaMask_Green", "BalaclavaMask_Black"],
      Body:     ["BDUJacket", "M65Jacket_Olive", "M65Jacket_Khaki", "TacticalShirt_Olive"],
      Legs:     ["BDUPants", "USMCPants_Woodland", "CargoPants_Green"],
      Feet:     ["MilitaryBoots_Black", "MilitaryBoots_Bluerock", "TTSKOBoots"],
      Gloves:   ["TacticalGloves_Green", "TacticalGloves_Black"],
      Vest:     ["PlateCarrierVest_Camo", "PlateCarrierVest", "SmershVest"],
      Back:     ["AliceBag_Camo", "AliceBag_Green", "CoyoteBag_Green"],
      Eyewear:  ["NVGHeadstrap"],
      Belt:     ["MilitaryBelt"],
      Armband:  ["Armband_CDF", "Armband_LivoniaArmy"],
    }
  },
  {
    id: "military_desert", label: "Military — Desert", theme: "military",
    items: {
      Headgear: ["GorkaHelmet_Black", "BallisticHelmet_Black", "Mich2001Helmet"],
      Mask:     ["BalaclavaMask_Beige", "ShemaghMask_Khaki"],
      Body:     ["TacticalShirt_Tan", "USMCJacket_Desert", "M65Jacket_Tan"],
      Legs:     ["USMCPants_Desert", "CargoPants_Beige"],
      Feet:     ["MilitaryBoots_Brown", "TTSKOBoots"],
      Gloves:   ["TacticalGloves_Beige"],
      Vest:     ["PlateCarrierVest_Camo", "PlateCarrierVest"],
      Back:     ["AliceBag_Camo", "CoyoteBag_Brown"],
      Eyewear:  ["NVGHeadstrap"],
      Belt:     ["MilitaryBelt"],
    }
  },
  {
    id: "sniper_ghillie", label: "Sniper — Ghillie", theme: "sniper",
    items: {
      Headgear: ["GhillieHood_Mossy", "GhillieHood_Woodland", "GhillieHood_Tan"],
      Mask:     ["BalaclavaMask_Green", "BalaclavaMask_Black"],
      Body:     ["HuntingJacket_Spring", "HuntingJacket_Autumn", "HuntingJacket_Summer"],
      Legs:     ["HunterPants_Spring", "HunterPants_Autumn", "HunterPants_Brown"],
      Feet:     ["MilitaryBoots_Black", "TTSKOBoots"],
      Gloves:   ["PaddedGloves_Threat", "TacticalGloves_Green"],
      Vest:     ["PlateCarrierVest_Camo", "HuntingVest"],
      Back:     ["GhillieSuit_Mossy", "GhillieSuit_Woodland", "GhillieSuit_Tan"],
      Eyewear:  ["NVGHeadstrap"],
      Belt:     ["MilitaryBelt"],
    }
  },
  {
    id: "bandit", label: "Bandit — Raider", theme: "bandit",
    items: {
      Headgear: ["WitchHood_Black", "WitchHood_Brown"],
      Mask:     ["BalaclavaMask_Blackskull", "AirborneMask", "BalaclavaMask_Black"],
      Body:     ["M65Jacket_Black", "TacticalShirt_Black", "HuntingJacket_Brown"],
      Legs:     ["CargoPants_Black", "HunterPants_Brown"],
      Feet:     ["MilitaryBoots_Black", "MilitaryBoots_Redpunk"],
      Gloves:   ["TacticalGloves_Black", "OMNOGloves_Gray"],
      Vest:     ["HighCapacityVest_Black", "PressVest_Blue"],
      Back:     ["DryBag_Black", "AssaultBag_Black", "LeatherSack_Brown"],
      Eyewear:  ["NVGHeadstrap"],
      Armband:  ["Armband_Black", "Armband_Red"],
      Belt:     ["CivilianBelt", "MilitaryBelt"],
    }
  },
  {
    id: "police", label: "Police — Tactical", theme: "police",
    items: {
      Headgear: ["PoliceCap", "BallisticHelmet_Black"],
      Mask:     ["Balaclava3Holes_Blue", "BalaclavaMask_Black"],
      Body:     ["PoliceJacket", "PoliceJacketOrel", "TacticalShirt_Grey"],
      Legs:     ["PolicePants", "PolicePantsOrel"],
      Feet:     ["MilitaryBoots_Bluerock", "MilitaryBoots_Black"],
      Gloves:   ["LeatherGloves_Black", "TacticalGloves_Black"],
      Vest:     ["PressVest_Blue", "PressVest_LightBlue", "PlateCarrierVest_Black"],
      Back:     ["DryBag_Blue", "AssaultBag_Black"],
      Eyewear:  ["NVGHeadstrap"],
      Belt:     ["MilitaryBelt"],
    }
  },
  {
    id: "hunter", label: "Hunter — Woods", theme: "hunter",
    items: {
      Headgear: ["BoonieHat_Olive", "BoonieHat_Tan"],
      Body:     ["HuntingJacket_Autumn", "HuntingJacket_Brown", "HuntingJacket_Summer"],
      Legs:     ["HunterPants_Autumn", "HunterPants_Brown"],
      Feet:     ["MilitaryBoots_Brown"],
      Gloves:   ["WorkingGloves_Beige"],
      Vest:     ["HuntingVest"],
      Back:     ["HuntingBag", "CoyoteBag_Brown"],
      Belt:     ["CivilianBelt"],
    }
  },
];

export const CLOTHING_SET_INDEX: Record<string, ClothingSet> = Object.fromEntries(CLOTHING_SETS.map(s => [s.id, s]));

// ── SURVIVOR CHARACTER TYPES ──────────────────────────────────────────────────
export const SURVIVORS_MALE = [
  "SurvivorM_Mirek","SurvivorM_Boris","SurvivorM_Cyril","SurvivorM_Denis","SurvivorM_Elias",
  "SurvivorM_Francis","SurvivorM_Guo","SurvivorM_Hassan","SurvivorM_Indar","SurvivorM_Jose",
  "SurvivorM_Kaito","SurvivorM_Lewis","SurvivorM_Manua","SurvivorM_Niki","SurvivorM_Oliver",
  "SurvivorM_Peter","SurvivorM_Quinn","SurvivorM_Rolf","SurvivorM_Seth","SurvivorM_Taiki",
];
export const SURVIVORS_FEMALE = [
  "SurvivorF_Eva","SurvivorF_Frida","SurvivorF_Gabi","SurvivorF_Helga","SurvivorF_Irena",
  "SurvivorF_Judy","SurvivorF_Keiko","SurvivorF_Linda","SurvivorF_Maria","SurvivorF_Naomi","SurvivorF_Baty",
];
export const ALL_SURVIVORS = [...SURVIVORS_MALE, ...SURVIVORS_FEMALE];

// ── STANDARD MED/FOOD FILLERS ─────────────────────────────────────────────────
export const PVP_MEDICAL_KIT = ["BandageDressing", "BandageDressing", "TetracyclineAntibiotics", "VitaminBottle", "Morphine", "Epinephrine", "SalineBagIV", "Splint"];
export const FOOD_CANS       = ["PeachesCan", "BakedBeansCan", "SpaghettiCan", "TacticalBaconCan"];
export const FILLER_CANNABIS = ["CanabisSeedsPack", "CannabisSeedsPack"];

// ── NVG KIT (MANDATORY per hard rules) ─────────────────────────────────────────
export const NVG_KIT = { headstrap: "NVGHeadstrap", goggles: "NVGoggles", battery: "Battery9V" };
