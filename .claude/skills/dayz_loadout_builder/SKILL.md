# 🎒 DAYZ LOADOUT BUILDER — Storage Math + Community Source Map

Use when working on the NPC/Loadout Builder (`src/components/NpcLoadoutBuilder.tsx`,
`src/lib/dayz/*`). This skill encodes the validated facts so future sessions don't
re-derive them.

## Hard rules

1. **Storage capacity is in `CONTAINER_SLOTS`** (`items.ts`). Add to that map for
   any new backpack/vest/jacket/pants. **Never** hardcode slot counts elsewhere.
2. **GhillieSuit_* has 0 storage.** It occupies the `Back` slot but is camouflage,
   not a backpack. `buildLoadout()` already handles this — `loadout.backpack` is
   `null` when Back = ghillie.
3. **Item slot cost is in `ITEM_SIZE`.** Rifle mags = 2, pistol mags = 1, ammo
   boxes = 2, drum mags = 4, food cans = 1, TacticalBaconCan = 2, Canteen = 2.
4. **100% full rule.** `buildLoadout()` calculates `totalSlots` and pads `filler[]`
   so `usedSlots === totalSlots`. The UI's progress bar goes green at 100%.

## Reference loadouts (pre-downloaded)

`reference/community_loadouts/` contains 8 real `playerspawngear.json` files:
- 4 from `PaPaSc0oBy42o/DayZ-Complete-Spawn-Kits` (M4A1, SVD, AUG, DMR)
- 4 from `scalespeeder` (NBC Medic, Police, AKM Military, Frostline Winter M4A1)

When asked "is X a real DayZ classname?" — `grep` these files first before
inventing a name.

## Adding a new role

1. Add an entry to `RoleId` union in `roles.ts`.
2. Add a `RoleTemplate` to `ROLE_TEMPLATES`.
3. Reference a `ClothingSet.id` for `outfitSet`.
4. If the new role needs a clothing set that doesn't exist, add it to
   `CLOTHING_SETS` in `items.ts` AND ensure every item in it has an entry in
   `CONTAINER_SLOTS` (if it's a container) — otherwise it counts as 0 slots.

## Key validated patterns from community repos

- **Vest** carries `PlateCarrierHolster` (simple) + `FNX45` (complex child).
- **Belt** carries `NylonKnifeSheath`, `PlateCarrierHolster_Camo`, `Canteen`.
- **Boots** carry `CombatKnife` as simple child.
- **Backpack** pre-stocks 2-3× rifle mags + 1× ammo box + meds + food.
- **Snipers** use `GhillieAtt_Mossy` as a weapon attachment (not just on the suit).

## Themes available

`military_woodland`, `military_desert`, `sniper_ghillie`, `bandit`, `police`,
`hunter`, `winter_operator` (Frostline), `russian_spec` (Gorka), `nbc_medic`.

## Common pitfalls

- **Don't fill 0-slot bags.** If `loadout.backpack === null`, the JSON exporter
  skips backpack assignment automatically.
- **Don't add GhillieSuit to CONTAINER_SLOTS with > 0.** It is set to 0 on purpose.
- **`MountainBag` is 35 slots, not 64.** It's a hiking pack, not Alice/Assault.

## Useful CLI

```bash
# List every classname mentioned across all community loadouts
python3 -c "
import json,glob,re
classes = set()
for f in glob.glob('reference/community_loadouts/*.json'):
    text = open(f).read()
    classes.update(re.findall(r'\"itemType\":\\s*\"([A-Za-z][A-Za-z0-9_]+)\"', text))
print('\n'.join(sorted(classes)))
"
```
