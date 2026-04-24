// Role templates — pick a primary+secondary+sidearm kind, an outfit theme,
// and a PvP-readiness level. buildLoadout() resolves these into a concrete kit.

import type { ClothingSet } from "./items";

export type RoleId =
  | "military_ak" | "military_m4" | "military_dmr"
  | "sniper_ghillie" | "sniper_mosin"
  | "police_tactical" | "prison_guard"
  | "bandit_raider" | "bandit_cannibal"
  | "hunter_woods";

export interface RoleTemplate {
  id: RoleId;
  label: string;
  description: string;
  primary:   string[];  // pool of weapon classnames for shoulderL
  secondary: string[];  // pool for shoulderR
  sidearm:   string[];  // pool for Belt pistol
  outfitSet: ClothingSet["id"];
  pvp: boolean;         // include full medical + extra mags
}

export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: "military_m4", label: "Military — M4A1 / M14", description: "NATO kit: M4A1 primary, M14 DMR, Glock19 sidearm",
    primary:   ["M4A1", "M4A1_Black", "M4A1_Green"],
    secondary: ["M14", "AUG"],
    sidearm:   ["Glock19", "FNX45"],
    outfitSet: "military_woodland", pvp: true,
  },
  {
    id: "military_ak", label: "Military — AKM / AK74", description: "Russian kit: AKM primary, VSS DMR, CZ75 sidearm",
    primary:   ["AKM", "AK74"],
    secondary: ["ASVAL", "VSS"],
    sidearm:   ["CZ75", "MakarovIJ70"],
    outfitSet: "military_woodland", pvp: true,
  },
  {
    id: "military_dmr", label: "Military — DMR Specialist", description: "VSD / M14 long-range + AKS74U CQB backup",
    primary:   ["VSD", "SVD_Wooden", "M14"],
    secondary: ["AKS74U", "MP5K"],
    sidearm:   ["Deagle", "FNX45"],
    outfitSet: "military_woodland", pvp: true,
  },
  {
    id: "sniper_ghillie", label: "Sniper — Ghillie", description: "Bolt-action sniper + suppressed M4 + FNX45",
    primary:   ["Mosin9130_Camo", "Mosin9130", "Winchester70_Black"],
    secondary: ["M4A1_Black", "Scout"],
    sidearm:   ["FNX45", "Glock19"],
    outfitSet: "sniper_ghillie", pvp: true,
  },
  {
    id: "sniper_mosin", label: "Sniper — Mosin Scout", description: "Budget sniper: Mosin + SKS + MakarovIJ70",
    primary:   ["Mosin9130"],
    secondary: ["SKS", "Winchester70"],
    sidearm:   ["MakarovIJ70", "Glock19"],
    outfitSet: "sniper_ghillie", pvp: false,
  },
  {
    id: "police_tactical", label: "Police — Tactical", description: "R12 shotgun + Scout + Deagle_Gold — Prison-event style",
    primary:   ["R12", "Mp133Shotgun"],
    secondary: ["Scout_Chernarus", "Scout"],
    sidearm:   ["Deagle_Gold", "Glock19"],
    outfitSet: "police", pvp: true,
  },
  {
    id: "prison_guard", label: "Prison Guard", description: "Shotgun + sniper Scout + ACOG — close/mid hybrid",
    primary:   ["MP133Shotgun", "Mp133Shotgun"],
    secondary: ["Scout"],
    sidearm:   ["Glock19"],
    outfitSet: "police", pvp: true,
  },
  {
    id: "bandit_raider", label: "Bandit — Raider", description: "M4A1 + ASVAL + Deagle_Gold — aggressive loadout",
    primary:   ["M4A1", "M4A1_Green"],
    secondary: ["ASVAL", "AKM"],
    sidearm:   ["Deagle_Gold", "Deagle"],
    outfitSet: "bandit", pvp: true,
  },
  {
    id: "bandit_cannibal", label: "Bandit — Cannibal", description: "FAL + Winchester70 + Deagle — Josie-style cannibal",
    primary:   ["FAL"],
    secondary: ["Winchester70_Black", "B95"],
    sidearm:   ["Deagle", "Deagle_Gold"],
    outfitSet: "bandit", pvp: true,
  },
  {
    id: "hunter_woods", label: "Hunter — Woods", description: "Winchester70 + Mp133 + MakarovIJ70 — survival hunter",
    primary:   ["Winchester70", "B95"],
    secondary: ["Mp133Shotgun"],
    sidearm:   ["MakarovIJ70", "Colt1911"],
    outfitSet: "hunter", pvp: false,
  },
];

export const ROLE_INDEX: Record<string, RoleTemplate> = Object.fromEntries(ROLE_TEMPLATES.map(r => [r.id, r]));
