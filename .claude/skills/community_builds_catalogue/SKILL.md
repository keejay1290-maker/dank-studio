# Community Builds Catalogue

## Source
`C:\Users\Shadow\Desktop\dayz community` — curated by the user.
34 categories · 5,005 JSON · 718 XML · 10,535 files total

## Folder Map

| Folder | Content |
|---|---|
| `air_drops` | Plane crash / airdrop event layouts |
| `bases` | Player/admin base designs |
| `bennetts_builds` | 200+ builds by Bennett — castles, bunkers, traders, races |
| `building_supplies` | Supply drop crates |
| `bunkers` | 195 bunker/underground builds |
| `castles` | 84 castle builds |
| `caves` | Cave hideouts |
| `faction_bases` | Faction compound layouts |
| `houses_cabins` | Small residential builds |
| `loadouts` | 250+ `cfggameplay.json` playerspawnloadout files |
| `loot_configs` | `cfgspawnabletypes.xml`, `types.xml`, `cfgeconomycore.json` |
| `military` | Military base overhauls |
| `missions_events` | Dynamic area / contaminated zone configs |
| `npc_ai` | AI patrol settings JSONs |
| `oil_rigs` | 18 offshore oil rig builds |
| `points_of_interest` | Community POI decorations |
| `pvp_events` | PvP arena / event layouts |
| `racing` | Racing track builds |
| `safezones` | 13 safezone layouts |
| `sakhal` | Sakhal-specific builds |
| `ships` | 26 ship/carrier builds |
| `teleporters` | Teleport trigger JSONs |
| `traders` | Trader compound builds |
| `treehouses` | 23 treehouse/tower builds |
| `walls_structures` | Bridges, walls, forts, towers |
| `weapons` | Weapon cache spawns |
| `winter_maps` | Winter-themed builds |

## Top Community-Used Structural Classnames

(Full list in memory: `project_community_classnames.md`)

### Castle
- `Land_Castle_Wall1_20` — **20m wide**, THE castle wall (27k uses)
- `Land_Castle_Wall1_20_nolc` — same without landscape clutter
- `Land_Castle_Donjon` — round tower module (4.7k uses)
- `Land_Castle_Gate` — gate piece
- `Land_Castle_Stairs` — stairs
- `Land_Castle_Wall1_Corner1`, `Land_Castle_Wall2_Corner2` — corners

### Bridges
- `StaticObj_Bridge_Metal_25_1` — **24.5m per span** (8.4k uses; chain at correct step)
- `StaticObj_Bridge_Stone_25` — stone arch ~25m
- `StaticObj_Bridge_Wood_25` — wooden 25m
- **Spacing formula**: place pieces at `i * 24.5m` along direction vector

### Platform Blocks (universal scaffolding)
- `StaticObj_Platform1_Block` — small platform (21k uses)
- `StaticObj_Platform2_Block` — taller block (11.7k uses)
- `StaticObj_Platform1_Stairs_Block` — with stairs integrated
- `StaticObj_Platform1_Wall` — wall panel for platforms

### Underground / Bunker
Full module system:
1. `Land_Underground_Entrance` — surface entry
2. `Land_Underground_Tunnel_Single` — tunnel run
3. `Land_Underground_Stairs_Block` — stairs down
4. `Land_Underground_Panel` / `Land_Underground_Panel_Lever` — interior props
5. `StaticObj_Underground_Corridor_Main_Gate_L/R` — corridor gate

### Pier / Dock
- `StaticObj_Pier_Concrete2` — chainable pier section
- `Land_Pier_Floating_50m` — floating platform 50m
- `StaticObj_Pier_Wooden3_Platform` — wooden platform

### Oil Rig
- `StaticObj_Wall_GarbCont` + `StaticObj_Wall_GarbCont_Corner` — garbage container walls
- `StaticObj_pipe_small_20m` — vertical pipes
- Platform blocks + containers for decks

### Military Props
- `StaticObj_Mil_HBarrier_6m` (2.6k) — HESCO 6m
- `StaticObj_Mil_HBarrier_Big` — 10.387m wide HESCO
- `StaticObj_Mil_Artilery_Rampart` — fortification
- `Land_Mil_GuardTower`, `Land_Mil_ControlTower`

### Road / Decal (safezones, parking)
- `StaticObj_Decal_Crosswalk` — 69k uses! Road/parking markings
- `StaticObj_Sidewalk2_5m`, `StaticObj_Sidewalk1_10m`
- `StaticObj_BusStation_wall` — bus stop wall (8.5k uses)

## Loadout Format (cfggameplay.json)

```json
{
  "spawnWeight": 1,
  "name": "LoadoutName",
  "characterTypes": ["SurvivorM_Mirek", ...],
  "attachmentSlotItemSets": [
    {
      "slotName": "shoulderL",
      "discreteItemSets": [{
        "itemType": "M4A1_Green",
        "spawnWeight": 1,
        "attributes": { "healthMin": 1.0, "healthMax": 1.0, "quantityMin": 1.0, "quantityMax": 1.0 },
        "quickBarSlot": 1,
        "simpleChildrenTypes": ["M4_Suppressor", "Mag_STANAG_60Rnd"],
        "complexChildrenTypes": []
      }]
    }
  ]
}
```

Slots: `shoulderL`, `shoulderR`, `Vest`, `Back`, `Body`, `Legs`, `Head`, `Headgear`, `Eyewear`, `Gloves`

## NPC AI Format

```json
{
  "m_Version": 27,
  "Enabled": 1,
  "DespawnTime": 300,
  "RespawnTime": 600,
  "AccuracyMin": 0.3,
  "AccuracyMax": 0.7,
  "LoadBalancingCategories": { "Patrols": [{ "MaxPatrols": 10 }] }
}
```

## Bennett's Builds (Special Resource)

200+ named builds from one creator. Notable types:
- `BennettsCastle_*`, `BennettsClanCastle*` — castle variety
- `BennettsBunker_*` — 20+ bunker variants
- `BennettsTraderShip_*`, `BennettsTraderCompound` — trader layouts
- `BennettsColosseum`, `BennettsMachuPichu`, `BennettsMayanRuins` — landmarks
- `BennettsOilRig`, `BennettsOilRig2` — oil rig
- `BennettsPrisonIsland`, `BennettsGulag_Rust` — prison/gulag themes

## How to use this data

1. When building a **new generator**, check `project_community_classnames.md` for the community-validated classname and approximate dimensions.
2. When the user asks about **loadout format**, this file has the exact JSON schema.
3. When looking for **build inspiration**, Bennett's builds folder has examples for almost every structure type.
4. **Dimensions not in P3D catalogue** — derive from community JSON spacing (e.g., bridge span from consecutive piece positions).
