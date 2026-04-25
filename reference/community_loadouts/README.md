# Community DayZ Loadouts — Source of Truth

Real `playerspawngear.json` files scraped from public GitHub repos.
Used as ground-truth references for `src/lib/dayz/items.ts` and `src/lib/dayz/roles.ts`.

## Files

| File | Source | Style |
|------|--------|-------|
| m4a1_loadout.json | PaPaSc0oBy42o/DayZ-Complete-Spawn-Kits | NATO M4A1 + ghillie |
| svd_loadout.json | PaPaSc0oBy42o/DayZ-Complete-Spawn-Kits | Ghillie sniper, SVD + Mossy attachment |
| aug_loadout.json | PaPaSc0oBy42o/DayZ-Complete-Spawn-Kits | Aug + 60Rnd mag + suppressor |
| dmr_loadout.json | PaPaSc0oBy42o/DayZ-Complete-Spawn-Kits | M14 DMR + ImprovisedSuppressor |
| nbc_medic_loadout.json | scalespeeder/DayZ-123-NBC-Medic-Police-... | Hazmat NBC team — gas mask, MountainBag |
| police_loadout.json | scalespeeder/DayZ-123-NBC-Medic-Police-... | Scout_Chernarus + Handcuffs + TaloonBag |
| akm_loadout.json | scalespeeder/DayZ-123-Military-AKM-and-DMR... | AKM + Drum75Rnd + Gorka uniform |
| frostline_m4a1_loadout.json | scalespeeder/DayZ-Frostline-Sakhal-Winter... | Sakhal winter — PlateCarrierVest_Winter, OMK |

## Key classnames discovered (now in items.ts)

**Backpacks:** `MountainBag_*`, `TaloonBag_*`, `AssaultBag_Ttsko`, `CoyoteBag_Winter`, `AliceBag_Black`
**Vests:** `PlateCarrierVest_Winter`, `PlateCarrierVest_Green`
**Vest pouches:** `PlateCarrierPouches_Winter`, `PlateCarrierHolster_Winter`
**Helmets:** `BallisticHelmet_UN`, `BallisticHelmet_Winter`, `BallisticHelmet_Navy`, `Ssh68Helmet`
**Russian:** `GorkaEJacket_Flat/Autumn/PautRev/Winter`, `GorkaPants_*`, `OMKJacket_Navy`, `OMKPants_Navy`
**NBC:** `NBCJacketGray/Yellow`, `NBCPantsGray/Yellow`, `NBCGlovesGray/Yellow`, `NBCBootsGray/Yellow`, `AirborneMask`, `GasMask_Filter`
**Police-only:** `Handcuffs`, `HandcuffKeys`, `Scout_Chernarus`, `Scout_Livonia`
**Weapon attachments:** `GhillieAtt_Mossy`, `AK_Bayonet`, `Mag_AKM_Drum75Rnd`, `PSO11Optic`
**Gloves:** `WoolGloves_White`, `WoolGlovesFingerless_White`
**Masks:** `Balaclava3Holes_White`

## Patterns adopted

1. **Multi-option slots** — community files list 3+ alternatives per slot in `discreteItemSets[]`. Our build.ts could expose this as alternates (currently picks one deterministically).
2. **Vest children** — `PlateCarrierHolster` is consistently a `simpleChildrenTypes` of the vest, and `FNX45` is a `complexChildrenTypes` (so the holster carries the pistol).
3. **Backpack pre-fill** — every loadout pre-stocks 2-3 mags in `simpleChildrenTypes` of the backpack.
4. **Boot knife** — `CombatKnife` consistently appears in `MilitaryBoots_*` simpleChildrenTypes.
5. **Belt items** — `NylonKnifeSheath`, `PlateCarrierHolster_Camo`, `Canteen` go in MilitaryBelt complexChildrenTypes.
