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
  theme: "military" | "sniper" | "bandit" | "police" | "civilian" | "cowboy" | "hunter" | "prison" | "firefighter" | "winter" | "russian" | "nbc";
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
  { name: "AKM",         caliber: "762x39", kind: "rifle", mags: ["Mag_AKM_30Rnd", "Mag_AKM_Drum75Rnd"], ammo: ["AmmoBox_762x39_20Rnd", "AmmoBox_762x39Tracer_20Rnd"], attachments: ["AK_WoodBttstck", "AK_PlasticBttstck", "AK_WoodHndgrd", "AK_PlasticHndgrd", "AK_Suppressor", "AK_Bayonet", "KobraOptic", "PSO1Optic", "PSO11Optic"] },
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
  { name: "VSD",         caliber: "762x54", kind: "sniper", mags: ["Mag_SVD_10Rnd"], ammo: ["AmmoBox_762x54_20Rnd"], attachments: ["PSO1Optic", "PSO6Optic", "GhillieAtt_Mossy", "AK_Suppressor"] },
  { name: "SVD",         caliber: "762x54", kind: "sniper", mags: ["Mag_SVD_10Rnd"], ammo: ["AmmoBox_762x54_20Rnd"], attachments: ["PSO1Optic", "PSO6Optic", "GhillieAtt_Mossy", "AK_Suppressor"] },
  { name: "SVD_Wooden",  caliber: "762x54", kind: "sniper", mags: ["Mag_SVD_10Rnd"], ammo: ["AmmoBox_762x54_20Rnd"], attachments: ["PSO6Optic", "GhillieAtt_Mossy"] },
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
  // ── Community-sourced sets (PaPaSc0oBy42o, scalespeeder Frostline, NBC Medic) ──
  {
    id: "winter_operator", label: "Winter Operator (Frostline)", theme: "winter",
    items: {
      Headgear: ["BallisticHelmet_Winter", "BallisticHelmet_Navy"],
      Mask:     ["Balaclava3Holes_White"],
      Body:     ["GorkaEJacket_Winter", "OMKJacket_Navy"],
      Legs:     ["GorkaPants_Winter", "OMKPants_Navy"],
      Feet:     ["MilitaryBoots_Bluerock", "MilitaryBoots_Black", "MilitaryBoots_Brown"],
      Gloves:   ["WoolGloves_White", "WoolGlovesFingerless_White"],
      Vest:     ["PlateCarrierVest_Winter"],
      Back:     ["CoyoteBag_Winter"],
      Eyewear:  ["NVGHeadstrap"],
      Belt:     ["MilitaryBelt"],
      Armband:  ["Armband_Chernarus", "Armband_Livonia"],
    }
  },
  {
    id: "russian_spec", label: "Russian Spec-Ops (Gorka)", theme: "russian",
    items: {
      Headgear: ["Ssh68Helmet", "GorkaHelmet"],
      Mask:     ["BalaclavaMask_Green", "BalaclavaMask_Black"],
      Body:     ["GorkaEJacket_Flat", "GorkaEJacket_Autumn", "GorkaEJacket_PautRev"],
      Legs:     ["GorkaPants_Flat", "GorkaPants_Autumn", "GorkaPants_PautRev"],
      Feet:     ["MilitaryBoots_Bluerock", "MilitaryBoots_Black", "MilitaryBoots_Brown", "TTSKOBoots"],
      Gloves:   ["TacticalGloves_Black", "TacticalGloves_Green"],
      Vest:     ["PlateCarrierVest", "PlateCarrierVest_Camo", "PlateCarrierVest_Green", "PlateCarrierVest_Black"],
      Back:     ["AssaultBag_Ttsko", "AssaultBag_Green", "AliceBag_Camo"],
      Eyewear:  ["NVGHeadstrap"],
      Belt:     ["MilitaryBelt"],
      Armband:  ["Armband_Chernarus", "Armband_Livonia"],
    }
  },
  {
    id: "nbc_medic", label: "NBC Medical Team", theme: "nbc",
    items: {
      Headgear: ["BallisticHelmet_UN", "BallisticHelmet_Black"],
      Mask:     ["AirborneMask"],
      Body:     ["NBCJacketGray", "NBCJacketYellow"],
      Legs:     ["NBCPantsGray", "NBCPantsYellow"],
      Feet:     ["NBCBootsGray", "NBCBootsYellow", "MilitaryBoots_Black"],
      Gloves:   ["NBCGlovesGray", "NBCGlovesYellow"],
      Vest:     ["PlateCarrierVest", "PlateCarrierVest_Black", "PlateCarrierVest_Camo", "PlateCarrierVest_Green"],
      Back:     ["MountainBag_Blue", "MountainBag_Green", "MountainBag_Red"],
      Eyewear:  ["NVGHeadstrap"],
      Belt:     ["MilitaryBelt"],
      Armband:  ["Armband_CDF", "Armband_LivoniaArmy"],
    }
  },
];

export const CLOTHING_SET_INDEX: Record<string, ClothingSet> = Object.fromEntries(CLOTHING_SETS.map(s => [s.id, s]));

// ── CONTAINER STORAGE CAPACITY (inventory slot counts) ───────────────────────
// Back slot: real backpacks have slots; GhillieSuit occupies Back but stores nothing.
// Vest, Body, Legs: pockets. Weapons/NVG/worn items don't consume these slots.
export const CONTAINER_SLOTS: Record<string, number> = {
  // ── BACKPACKS ────────────────────────
  AliceBag: 64, AliceBag_Camo: 64, AliceBag_Green: 64, AliceBag_Black: 64,
  AssaultBag: 64, AssaultBag_Black: 64, AssaultBag_Green: 64, AssaultBag_Ttsko: 64,
  CoyoteBag_Green: 42, CoyoteBag_Brown: 42, CoyoteBag_Winter: 42,
  HuntingBag: 32,
  MountainBag_Blue: 35, MountainBag_Green: 35, MountainBag_Red: 35, MountainBag_Orange: 35,
  TaloonBag_Blue: 35, TaloonBag_Green: 35, TaloonBag_Orange: 35, TaloonBag_Violet: 35,
  DryBag_Black: 20, DryBag_Blue: 20, DryBag_Red: 20, DryBag_Yellow: 20, DryBag_Orange: 20,
  LeatherSack_Brown: 12, LeatherSack_Natural: 12,
  // GhillieSuits occupy the Back slot but are camouflage — zero storage
  GhillieSuit_Mossy: 0, GhillieSuit_Woodland: 0, GhillieSuit_Tan: 0,
  // ── VESTS ─────────────────────────────
  PlateCarrierVest: 12, PlateCarrierVest_Camo: 12, PlateCarrierVest_Black: 12,
  PlateCarrierVest_Green: 12, PlateCarrierVest_Winter: 12,
  SmershVest: 12, HuntingVest: 12, HighCapacityVest_Black: 12,
  PressVest_Blue: 12, PressVest_LightBlue: 12,
  // ── JACKETS / BODY ────────────────────
  BDUJacket: 8,
  M65Jacket_Olive: 8, M65Jacket_Khaki: 8, M65Jacket_Black: 8, M65Jacket_Tan: 8,
  TacticalShirt_Olive: 4, TacticalShirt_Tan: 4, TacticalShirt_Grey: 4, TacticalShirt_Black: 4,
  HuntingJacket_Autumn: 8, HuntingJacket_Brown: 8, HuntingJacket_Spring: 8, HuntingJacket_Summer: 8,
  PoliceJacket: 8, PoliceJacketOrel: 8, USMCJacket_Desert: 8,
  GorkaEJacket_Flat: 8, GorkaEJacket_Autumn: 8, GorkaEJacket_PautRev: 8, GorkaEJacket_Winter: 8,
  OMKJacket_Navy: 8,
  NBCJacketGray: 8, NBCJacketYellow: 8,
  // ── PANTS ─────────────────────────────
  BDUPants: 8, USMCPants_Woodland: 8, USMCPants_Desert: 8,
  CargoPants_Green: 8, CargoPants_Black: 8, CargoPants_Beige: 8,
  HunterPants_Spring: 6, HunterPants_Autumn: 6, HunterPants_Brown: 6,
  PolicePants: 8, PolicePantsOrel: 8,
  GorkaPants_Flat: 8, GorkaPants_Autumn: 8, GorkaPants_PautRev: 8, GorkaPants_Winter: 8,
  OMKPants_Navy: 8,
  NBCPantsGray: 8, NBCPantsYellow: 8,
};

// ── ITEM SIZE IN INVENTORY (slots consumed when placed in a container) ────────
// Most small items = 1×1 (1 slot). Rifle mags/ammo boxes = 1×2 (2 slots).
export const ITEM_SIZE: Record<string, number> = {
  // Rifle / DMR magazines — 1×2 = 2 slots
  Mag_STANAG_30Rnd: 2, Mag_STANAG_60Rnd: 2, Mag_CMAG_30Rnd: 2, Mag_CMAG_40Rnd: 2,
  Mag_STANAGCoupled_30Rnd: 2,
  Mag_AKM_30Rnd: 2, Mag_AKM_Drum75Rnd: 4, Mag_AK74_30Rnd: 2, Mag_AK74_45Rnd: 2, Mag_AK101_30Rnd: 2,
  Mag_M14_20Rnd: 2, Mag_FAL_20Rnd: 2,
  Mag_SVD_10Rnd: 2, Mag_SV98_10Rnd: 2,
  Mag_Vikhr_30Rnd: 2, Mag_VAL_20Rnd: 2,
  Mag_Aug_30Rnd: 2, Mag_Saiga_Drum20Rnd: 2, Mag_PP19_64Rnd: 2,
  // Scout / pistol / SMG magazines — 1×1 = 1 slot
  Mag_Scout_5Rnd: 1,
  Mag_MP5_30Rnd: 1, Mag_UMP_25Rnd: 1, Mag_CZ61_20Rnd: 1,
  Mag_Glock_15Rnd: 1, Mag_FNX45_15Rnd: 1, Mag_1911_7Rnd: 1,
  Mag_CZ75_15Rnd: 1, Mag_IJ70_8Rnd: 1, Mag_Deagle_9rnd: 1, Mag_P1_8Rnd: 1,
  // Ammo boxes — 1×2 = 2 slots
  AmmoBox_556x45_20Rnd: 2, AmmoBox_556x45Tracer_20Rnd: 2,
  AmmoBox_762x39_20Rnd: 2, AmmoBox_762x39Tracer_20Rnd: 2,
  AmmoBox_545x39_20Rnd: 2, AmmoBox_545x39Tracer_20Rnd: 2,
  AmmoBox_308Win_20Rnd: 2, AmmoBox_308WinTracer_20Rnd: 2,
  AmmoBox_762x54_20Rnd: 2,
  AmmoBox_9x39_20Rnd: 2, AmmoBox_9x39AP_20Rnd: 2,
  AmmoBox_9x19_25rnd: 2, AmmoBox_45ACP_25Rnd: 2,
  AmmoBox_00buck_10rnd: 2, AmmoBox_12gaSlug_10Rnd: 2,
  // Medical — 1×1 = 1 slot each, SalineBagIV = 2
  BandageDressing: 1, Morphine: 1, Epinephrine: 1,
  TetracyclineAntibiotics: 1, VitaminBottle: 1,
  SalineBagIV: 2, Splint: 1,
  // Food — 1 slot each; TacticalBaconCan = 2
  PeachesCan: 1, BakedBeansCan: 1, SpaghettiCan: 1, TacticalBaconCan: 2, SardinesCan: 1,
  // Other consumables
  Canteen: 2,
  CanabisSeedsPack: 1, CannabisSeedsPack: 1,
  ChemLightYellow: 1, ChemLightRed: 1, RoadFlare: 1, Rag: 1, Matchbox: 1,
  Battery9V: 1,
};

// Filler rotation used to pad containers to 100% capacity
export const FILLER_POOL = [
  "BandageDressing", "ChemLightYellow", "Rag", "RoadFlare", "CanabisSeedsPack",
] as const;

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

// ── STANDARD MED/FOOD KITS ────────────────────────────────────────────────────
export const PVP_MEDICAL_KIT = ["BandageDressing", "BandageDressing", "TetracyclineAntibiotics", "VitaminBottle", "Morphine", "Epinephrine", "SalineBagIV", "Splint"];
export const FOOD_CANS       = ["PeachesCan", "BakedBeansCan", "SpaghettiCan", "TacticalBaconCan"];

// ── NVG KIT (MANDATORY per hard rules) ─────────────────────────────────────────
export const NVG_KIT = { headstrap: "NVGHeadstrap", goggles: "NVGoggles", battery: "Battery9V" };
