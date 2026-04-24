// buildLoadout — resolves a RoleTemplate + character set into concrete gear.
// Used by both XML (NPC) and JSON (player spawn) exporters.

import { WEAPON_INDEX, CLOTHING_SET_INDEX, PVP_MEDICAL_KIT, FOOD_CANS, FILLER_CANNABIS, NVG_KIT, ALL_SURVIVORS } from "./items";
import type { SlotName } from "./items";
import type { RoleTemplate } from "./roles";

export interface ResolvedWeapon {
  classname: string;
  attachments: string[];   // mags + optics + stocks etc — flat list
  mags: string[];          // magazine classnames separately (for counts)
  ammo: string[];          // ammo box classnames
}

export interface ResolvedLoadout {
  name: string;
  characterTypes: string[];
  primary:   ResolvedWeapon;
  secondary: ResolvedWeapon | null;
  sidearm:   ResolvedWeapon;
  clothing:  Partial<Record<SlotName, string>>;   // slot → chosen classname
  backpack:  string | null;
  vest:      string | null;
  nvg:       boolean;
  medical:   string[];
  food:      string[];
  filler:    string[];
}

export interface BuildOptions {
  roleId:   RoleTemplate["id"];
  name?:    string;                  // loadout display name
  characterTypes?: string[];         // defaults to ALL_SURVIVORS
  seed?:    number;                  // for deterministic pick
}

// Deterministic pick helper
function pickWith(seed: number, pool: string[]): string {
  if (pool.length === 0) return "";
  return pool[Math.abs(seed) % pool.length];
}

function resolveWeapon(classname: string, seed: number): ResolvedWeapon {
  const def = WEAPON_INDEX[classname];
  if (!def) {
    // Unknown weapon — pass through with empty attachment lists; caller should validate
    return { classname, attachments: [], mags: [], ammo: [] };
  }
  const attachments: string[] = [];
  // Pick 1-2 attachments (optic + suppressor/stock) from pool
  if (def.attachments && def.attachments.length > 0) {
    // Rotate through: optic-like first, then rest
    const opticLike = def.attachments.filter(a => /Optic|Scope/i.test(a));
    const others    = def.attachments.filter(a => !/Optic|Scope/i.test(a));
    if (opticLike.length) attachments.push(pickWith(seed, opticLike));
    if (others.length)    attachments.push(pickWith(seed + 1, others));
  }
  return {
    classname,
    attachments,
    mags: def.mags,
    ammo: def.ammo,
  };
}

import { ROLE_INDEX } from "./roles";

export function buildLoadout(opts: BuildOptions): ResolvedLoadout {
  const role = ROLE_INDEX[opts.roleId];
  if (!role) throw new Error(`Unknown role: ${opts.roleId}`);

  const seed = opts.seed ?? 0;
  const primary   = resolveWeapon(pickWith(seed,     role.primary),   seed);
  const secondary = role.secondary.length > 0 ? resolveWeapon(pickWith(seed + 7, role.secondary), seed + 7) : null;
  const sidearm   = resolveWeapon(pickWith(seed + 13, role.sidearm),   seed + 13);

  const outfit = CLOTHING_SET_INDEX[role.outfitSet];
  const clothing: Partial<Record<SlotName, string>> = {};
  if (outfit) {
    for (const [slot, pool] of Object.entries(outfit.items)) {
      if (pool && pool.length > 0) {
        clothing[slot as SlotName] = pickWith(seed + slot.length, pool);
      }
    }
  }

  const backpack = clothing.Back ?? null;
  const vest     = clothing.Vest ?? null;

  return {
    name: opts.name ?? role.label,
    characterTypes: opts.characterTypes ?? ALL_SURVIVORS,
    primary, secondary, sidearm,
    clothing, backpack, vest,
    nvg: true,
    medical: role.pvp ? [...PVP_MEDICAL_KIT] : ["BandageDressing", "BandageDressing", "VitaminBottle"],
    food: [...FOOD_CANS, FOOD_CANS[0]],
    filler: [...FILLER_CANNABIS],
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// XML EXPORT — cfgspawnabletypes.xml format (Josie-style)
// ──────────────────────────────────────────────────────────────────────────────

export function toCfgSpawnableXml(loadout: ResolvedLoadout, surivorType: string = "SurvivorM_Peter"): string {
  const L = loadout;
  const lines: string[] = [];
  lines.push(`<type name="${surivorType}">`);

  const pushAttachment = (...items: { name: string; chance?: number }[]) => {
    lines.push(`\t<attachments chance="1">`);
    for (const it of items) lines.push(`\t\t<item name="${it.name}" chance="${(it.chance ?? 1).toFixed(2)}" />`);
    lines.push(`\t</attachments>`);
  };

  // Primary weapon + its attachments (each as separate attachments block)
  pushAttachment({ name: L.primary.classname });
  if (L.primary.mags.length) pushAttachment({ name: L.primary.mags[0] });
  for (const att of L.primary.attachments) pushAttachment({ name: att });

  // Secondary
  if (L.secondary) {
    pushAttachment({ name: L.secondary.classname });
    if (L.secondary.mags.length) pushAttachment({ name: L.secondary.mags[0] });
    for (const att of L.secondary.attachments) pushAttachment({ name: att });
  }

  // Sidearm
  pushAttachment({ name: "PlateCarrierHolster" });
  pushAttachment({ name: L.sidearm.classname });
  if (L.sidearm.mags.length) pushAttachment({ name: L.sidearm.mags[0] });
  for (const att of L.sidearm.attachments) pushAttachment({ name: att });

  // Clothing (each slot one line)
  for (const [_slot, cls] of Object.entries(L.clothing)) {
    if (cls) pushAttachment({ name: cls });
  }

  // NVG trio
  if (L.nvg) {
    pushAttachment({ name: NVG_KIT.headstrap });
    pushAttachment({ name: NVG_KIT.goggles });
    pushAttachment({ name: NVG_KIT.battery });
  }

  // Extra mags (5x for primary)
  for (let i = 0; i < 4 && L.primary.mags.length; i++) pushAttachment({ name: L.primary.mags[0] });
  // Extra sidearm mags
  for (let i = 0; i < 4 && L.sidearm.mags.length; i++) pushAttachment({ name: L.sidearm.mags[0] });
  // Ammo boxes
  for (const a of L.primary.ammo.slice(0, 3))  pushAttachment({ name: a });
  if (L.secondary) for (const a of L.secondary.ammo.slice(0, 2)) pushAttachment({ name: a });

  // Medical
  for (const m of L.medical) pushAttachment({ name: m });
  // Food
  for (const f of L.food) pushAttachment({ name: f });
  // Canteen + filler
  pushAttachment({ name: "Canteen" });
  for (const f of L.filler) pushAttachment({ name: f });

  lines.push(`</type>`);
  return lines.join("\n");
}

// ──────────────────────────────────────────────────────────────────────────────
// JSON EXPORT — playerspawngear format
// ──────────────────────────────────────────────────────────────────────────────

const defaultAttrs = { healthMin: 0.9, healthMax: 1, quantityMin: 1, quantityMax: 1 };

function weaponToSlotSet(w: ResolvedWeapon, quickBarSlot: number) {
  const complexChildrenTypes = [
    ...w.attachments.map(a => ({
      itemType: a, attributes: defaultAttrs, quickBarSlot: -1,
      simpleChildrenTypes: /Optic|Scope/i.test(a) ? ["Battery9V"] : [],
      simpleChildrenUseDefaultAttributes: true,
    })),
    ...w.mags.slice(0, 1).map(m => ({
      itemType: m, attributes: defaultAttrs, quickBarSlot: -1,
      simpleChildrenTypes: [], simpleChildrenUseDefaultAttributes: true,
    })),
  ];
  return {
    itemType: w.classname, spawnWeight: 1, attributes: defaultAttrs, quickBarSlot,
    complexChildrenTypes, simpleChildrenTypes: [], simpleChildrenUseDefaultAttributes: true,
  };
}

export function toPlayerSpawnGearJson(loadout: ResolvedLoadout): object {
  const L = loadout;
  const attachmentSlotItemSets: object[] = [];

  // shoulderL = primary
  attachmentSlotItemSets.push({ slotName: "shoulderL", discreteItemSets: [weaponToSlotSet(L.primary, 1)] });
  // shoulderR = secondary
  if (L.secondary) attachmentSlotItemSets.push({ slotName: "shoulderR", discreteItemSets: [weaponToSlotSet(L.secondary, 2)] });

  // Hips = belt with sidearm + canteen + holster
  attachmentSlotItemSets.push({
    slotName: "Hips", discreteItemSets: [{
      itemType: L.clothing.Belt ?? "MilitaryBelt", spawnWeight: 1, attributes: defaultAttrs, quickBarSlot: -1,
      complexChildrenTypes: [
        { itemType: "Canteen", attributes: defaultAttrs, quickBarSlot: -1, simpleChildrenTypes: [], simpleChildrenUseDefaultAttributes: true },
        { itemType: "PlateCarrierHolster", attributes: defaultAttrs, quickBarSlot: -1, simpleChildrenTypes: [], simpleChildrenUseDefaultAttributes: true },
        { ...weaponToSlotSet(L.sidearm, 3) },
      ],
      simpleChildrenTypes: [], simpleChildrenUseDefaultAttributes: true,
    }]
  });

  // Vest
  if (L.vest) {
    attachmentSlotItemSets.push({
      slotName: "Vest", discreteItemSets: [{
        itemType: L.vest, spawnWeight: 1, attributes: defaultAttrs, quickBarSlot: -1,
        complexChildrenTypes: [], simpleChildrenTypes: ["PlateCarrierHolster"], simpleChildrenUseDefaultAttributes: true,
      }]
    });
  }

  // Back = backpack + extra mags + meds
  if (L.backpack) {
    const extraMags = [...Array(5).fill(L.primary.mags[0]).filter(Boolean), ...Array(2).fill(L.sidearm.mags[0]).filter(Boolean)];
    const simpleChildrenTypes = [...extraMags, ...L.primary.ammo.slice(0, 2), ...L.medical, ...L.food, ...L.filler];
    attachmentSlotItemSets.push({
      slotName: "Back", discreteItemSets: [{
        itemType: L.backpack, spawnWeight: 1, attributes: { ...defaultAttrs, healthMin: 0.8 }, quickBarSlot: -1,
        complexChildrenTypes: [], simpleChildrenTypes, simpleChildrenUseDefaultAttributes: true,
      }]
    });
  }

  // Headgear + NVG on separate eyewear slot
  if (L.clothing.Headgear) {
    attachmentSlotItemSets.push({
      slotName: "Headgear", discreteItemSets: [{
        itemType: L.clothing.Headgear, spawnWeight: 1, attributes: defaultAttrs, quickBarSlot: -1,
        complexChildrenTypes: [], simpleChildrenTypes: [], simpleChildrenUseDefaultAttributes: true,
      }]
    });
  }
  if (L.nvg) {
    attachmentSlotItemSets.push({
      slotName: "Eyewear", discreteItemSets: [{
        itemType: "NVGHeadstrap", spawnWeight: 1, attributes: defaultAttrs, quickBarSlot: -1,
        complexChildrenTypes: [{
          itemType: "NVGoggles", attributes: defaultAttrs, quickBarSlot: -1,
          simpleChildrenTypes: ["Battery9V"], simpleChildrenUseDefaultAttributes: true,
        }],
        simpleChildrenTypes: [], simpleChildrenUseDefaultAttributes: true,
      }]
    });
  }

  // Remaining simple clothing slots
  const simpleSlots: (keyof typeof L.clothing)[] = ["Mask", "Gloves", "Armband", "Body", "Legs", "Feet"];
  for (const s of simpleSlots) {
    const cls = L.clothing[s];
    if (cls) attachmentSlotItemSets.push({
      slotName: s, discreteItemSets: [{
        itemType: cls, spawnWeight: 1, attributes: defaultAttrs, quickBarSlot: -1,
        complexChildrenTypes: [], simpleChildrenTypes: [], simpleChildrenUseDefaultAttributes: true,
      }]
    });
  }

  return {
    name: L.name,
    spawnWeight: 1,
    characterTypes: L.characterTypes,
    attachmentSlotItemSets,
    discreteUnsortedItemSets: [],
  };
}
