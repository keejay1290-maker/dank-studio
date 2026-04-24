# DayZ Server Config Reference

Authoritative reference files for the NPC Builder + Loadout Builder tabs.

## Files

- `cfgspawnabletypes.xml` — Josie-style NPC loadouts (XML format, attachments with chances).
  Each `<type name="SurvivorM_X">` defines what gear a spawned NPC can wear.
- `PVPLoadout1.json` — Military M4A1 player loadout (JSON, slots with discrete item sets)
- `PVPLoadout2.json` — Military AKM player loadout
- `Prison_event_loadout.json` — Themed event loadout (police/prison)
- `Ghillie_m4_moisin.json` — Sniper ghillie loadout
- `NPC_Workshop_By_Josie_Garfunkle.txt` — Josie's NPC build tutorials and examples

## Formats

### NPC (cfgspawnabletypes.xml)

```xml
<type name="SurvivorM_Peter">
  <attachments chance="1">
    <item name="M16A2" chance="1" />
  </attachments>
  <attachments chance="1">
    <item name="Mag_STANAG_30Rnd" chance="0.3" />
    <item name="Mag_STANAG_60Rnd" chance="0.15" />
  </attachments>
  <!-- ... -->
</type>
```

`<attachments>` block = one slot. Inside, multiple `<item>` entries are weighted alternatives (their `chance` values should sum to ≤1).

### Player Loadout (playerspawngear.json)

```json
{
  "name": "Military - m4a1",
  "characterTypes": ["SurvivorM_Mirek", "..."],
  "attachmentSlotItemSets": [
    {
      "slotName": "shoulderL",
      "discreteItemSets": [
        {
          "itemType": "M4A1_Black",
          "complexChildrenTypes": [
            { "itemType": "ACOGOptic_6x", ... },
            { "itemType": "Mag_STANAG_30Rnd", ... }
          ],
          "simpleChildrenTypes": ["M4_MPBttstck"]
        }
      ]
    }
  ]
}
```

`slotName` is one of: `shoulderL`, `shoulderR`, `Hands`, `Body`, `Vest`, `Back`, `Legs`, `Feet`, `Headgear`, `Mask`, `Eyewear`, `Gloves`, `Armband`, `Belt`, `Hips`.

`complexChildrenTypes` = items with their own attachments (e.g. scope with battery).
`simpleChildrenTypes` = flat list of attachments that go directly on the parent.

## Hard rules (from user spec)

1. Every loadout MUST have ≥2 firearms + always a pistol sidearm.
2. Every loadout MUST include NVG + headstrap + Battery9V.
3. Every inventory slot MUST be filled (food/bandages/meds/cannabis as filler).
4. Clothing MUST be themed & colour-matched (military / sniper / bandit / cowboy / police / civilian).
5. Weapon → mag → ammo → attachments must be compatible (never mix).
6. All classnames must exist in `types.xml` (never invent names).
7. PvP loadouts always include: bandages, antibiotics, splint, morphine, extra mags/ammo.
