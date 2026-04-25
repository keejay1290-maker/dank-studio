// buildLoadout — resolves a RoleTemplate + character set into concrete gear.
// Used by both XML (NPC) and JSON (player spawn) exporters.

import { WEAPON_INDEX, CLOTHING_SET_INDEX, PVP_MEDICAL_KIT, FOOD_CANS, NVG_KIT, ALL_SURVIVORS, CONTAINER_SLOTS, ITEM_SIZE, FILLER_POOL } from "./items";
import type { SlotName } from "./items";
import type { RoleTemplate } from "./roles";

export interface ResolvedWeapon {
  classname: string;
  attachments: string[];   // optics + stocks etc
  mags: string[];          // magazine classnames
  ammo: string[];          // ammo box classnames
}

export interface ResolvedLoadout {
  name: string;
  characterTypes: string[];
  primary:        ResolvedWeapon;
  secondary:      ResolvedWeapon | null;
  sidearm:        ResolvedWeapon;
  clothing:       Partial<Record<SlotName, string>>;
  backpack:       string | null;   // null if Back slot = GhillieSuit (0 storage)
  vest:           string | null;
  nvg:            boolean;
  // ── Container contents (packed items) ────────────────────────────────────
  extraMags:      string[];   // 5× primary extra mags
  extraSidearmMags: string[]; // 3× sidearm extra mags
  ammoBoxes:      string[];   // primary + secondary ammo boxes
  medical:        string[];
  food:           string[];
  filler:         string[];   // calculated to fill remaining container capacity
  // ── Storage accounting ────────────────────────────────────────────────────
  totalSlots:     number;     // total available container slots (back+vest+body+legs)
  usedSlots:      number;     // slots consumed by packed items
}

export interface BuildOptions {
  roleId:          RoleTemplate["id"];
  name?:           string;
  characterTypes?: string[];
  seed?:           number;
}

function pickWith(seed: number, pool: string[]): string {
  if (pool.length === 0) return "";
  return pool[Math.abs(seed) % pool.length];
}

function resolveWeapon(classname: string, seed: number): ResolvedWeapon {
  const def = WEAPON_INDEX[classname];
  if (!def) return { classname, attachments: [], mags: [], ammo: [] };
  const attachments: string[] = [];
  if (def.attachments && def.attachments.length > 0) {
    const opticLike = def.attachments.filter(a => /Optic|Scope/i.test(a));
    const others    = def.attachments.filter(a => !/Optic|Scope/i.test(a));
    if (opticLike.length) attachments.push(pickWith(seed, opticLike));
    if (others.length)    attachments.push(pickWith(seed + 1, others));
  }
  return { classname, attachments, mags: def.mags, ammo: def.ammo };
}

function countSlots(items: string[]): number {
  return items.reduce((n, item) => n + (ITEM_SIZE[item] ?? 1), 0);
}

import { ROLE_INDEX } from "./roles";

export function buildLoadout(opts: BuildOptions): ResolvedLoadout {
  const role = ROLE_INDEX[opts.roleId];
  if (!role) throw new Error(`Unknown role: ${opts.roleId}`);

  const seed      = opts.seed ?? 0;
  const primary   = resolveWeapon(pickWith(seed,      role.primary),   seed);
  const secondary = role.secondary.length > 0 ? resolveWeapon(pickWith(seed + 7, role.secondary), seed + 7) : null;
  const sidearm   = resolveWeapon(pickWith(seed + 13, role.sidearm),   seed + 13);

  const outfit = CLOTHING_SET_INDEX[role.outfitSet];
  const clothing: Partial<Record<SlotName, string>> = {};
  if (outfit) {
    for (const [slot, pool] of Object.entries(outfit.items)) {
      if (pool && pool.length > 0) clothing[slot as SlotName] = pickWith(seed + slot.length, pool);
    }
  }

  // GhillieSuit occupies Back but stores nothing — backpack is null in that case
  const backItem  = clothing.Back ?? null;
  const backSlots = backItem ? (CONTAINER_SLOTS[backItem] ?? 0) : 0;
  const backpack  = backSlots > 0 ? backItem : null;
  const vest      = clothing.Vest ?? null;

  // ── Total container capacity ───────────────────────────────────────────────
  const totalSlots = (["Back", "Vest", "Body", "Legs"] as const)
    .reduce((n, slot) => n + (CONTAINER_SLOTS[clothing[slot] ?? ""] ?? 0), 0);

  // ── Fixed packed items ─────────────────────────────────────────────────────
  const extraMags       = primary.mags[0]  ? Array<string>(5).fill(primary.mags[0])  : [];
  const extraSidearmMags = sidearm.mags[0] ? Array<string>(3).fill(sidearm.mags[0]) : [];
  const ammoBoxes       = [...primary.ammo.slice(0, 3), ...(secondary ? secondary.ammo.slice(0, 2) : [])];
  const medical         = role.pvp ? [...PVP_MEDICAL_KIT] : ["BandageDressing", "BandageDressing", "VitaminBottle"];
  const food            = [...FOOD_CANS, FOOD_CANS[0]];   // 5 cans
  const canteen         = ["Canteen"];

  const fixedItems  = [...extraMags, ...extraSidearmMags, ...ammoBoxes, ...medical, ...food, ...canteen];
  const fixedSlots  = countSlots(fixedItems);

  // ── Fill remaining capacity with filler (rotate through FILLER_POOL) ───────
  const filler: string[] = [];
  let usedSlots = fixedSlots;
  let fi = 0;
  while (usedSlots < totalSlots) {
    const item = FILLER_POOL[fi % FILLER_POOL.length];
    const size = ITEM_SIZE[item] ?? 1;
    if (usedSlots + size > totalSlots) break;
    filler.push(item);
    usedSlots += size;
    fi++;
  }

  return {
    name: opts.name ?? role.label,
    characterTypes: opts.characterTypes ?? ALL_SURVIVORS,
    primary, secondary, sidearm,
    clothing, backpack, vest,
    nvg: true,
    extraMags, extraSidearmMags, ammoBoxes,
    medical, food, filler,
    totalSlots, usedSlots,
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

  // Weapons (worn — not in containers)
  pushAttachment({ name: L.primary.classname });
  if (L.primary.mags.length)   pushAttachment({ name: L.primary.mags[0] });
  for (const att of L.primary.attachments) pushAttachment({ name: att });

  if (L.secondary) {
    pushAttachment({ name: L.secondary.classname });
    if (L.secondary.mags.length) pushAttachment({ name: L.secondary.mags[0] });
    for (const att of L.secondary.attachments) pushAttachment({ name: att });
  }

  pushAttachment({ name: "PlateCarrierHolster" });
  pushAttachment({ name: L.sidearm.classname });
  if (L.sidearm.mags.length) pushAttachment({ name: L.sidearm.mags[0] });
  for (const att of L.sidearm.attachments) pushAttachment({ name: att });

  // Clothing
  for (const [_slot, cls] of Object.entries(L.clothing)) {
    if (cls) pushAttachment({ name: cls });
  }

  // NVG trio
  if (L.nvg) {
    pushAttachment({ name: NVG_KIT.headstrap });
    pushAttachment({ name: NVG_KIT.goggles });
    pushAttachment({ name: NVG_KIT.battery });
  }

  // Packed items (fills containers to 100%)
  for (const m of L.extraMags)       pushAttachment({ name: m });
  for (const m of L.extraSidearmMags) pushAttachment({ name: m });
  for (const a of L.ammoBoxes)       pushAttachment({ name: a });
  for (const m of L.medical)         pushAttachment({ name: m });
  for (const f of L.food)            pushAttachment({ name: f });
  pushAttachment({ name: "Canteen" });
  for (const f of L.filler)          pushAttachment({ name: f });

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

  attachmentSlotItemSets.push({ slotName: "shoulderL", discreteItemSets: [weaponToSlotSet(L.primary, 1)] });
  if (L.secondary) attachmentSlotItemSets.push({ slotName: "shoulderR", discreteItemSets: [weaponToSlotSet(L.secondary, 2)] });

  // Belt: canteen + holster + sidearm
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

  // Vest — fill pockets with sidearm mags + some medical
  if (L.vest) {
    const vestMags    = L.extraSidearmMags.slice(0, 2);
    const vestMedical = L.medical.slice(0, 3);   // morphine, bandage, epi in vest
    attachmentSlotItemSets.push({
      slotName: "Vest", discreteItemSets: [{
        itemType: L.vest, spawnWeight: 1, attributes: defaultAttrs, quickBarSlot: -1,
        complexChildrenTypes: [],
        simpleChildrenTypes: [...vestMags, ...vestMedical],
        simpleChildrenUseDefaultAttributes: true,
      }]
    });
  }

  // Backpack — everything else (real backpack only; GhillieSuit is worn, not a container)
  if (L.backpack) {
    const backpackItems = [
      ...L.extraMags,
      ...L.extraSidearmMags.slice(2),    // remaining sidearm mags after vest
      ...L.ammoBoxes,
      ...L.medical.slice(3),             // remaining medical after vest
      ...L.food,
      ...L.filler,
    ];
    attachmentSlotItemSets.push({
      slotName: "Back", discreteItemSets: [{
        itemType: L.backpack, spawnWeight: 1, attributes: { ...defaultAttrs, healthMin: 0.8 }, quickBarSlot: -1,
        complexChildrenTypes: [], simpleChildrenTypes: backpackItems, simpleChildrenUseDefaultAttributes: true,
      }]
    });
  }

  // Headgear
  if (L.clothing.Headgear) {
    attachmentSlotItemSets.push({
      slotName: "Headgear", discreteItemSets: [{
        itemType: L.clothing.Headgear, spawnWeight: 1, attributes: defaultAttrs, quickBarSlot: -1,
        complexChildrenTypes: [], simpleChildrenTypes: [], simpleChildrenUseDefaultAttributes: true,
      }]
    });
  }

  // NVG
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

  // Simple clothing slots
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
