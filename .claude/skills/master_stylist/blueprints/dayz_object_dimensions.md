# DayZ Object Dimensions — P3D Verified Reference

**Source**: ODOL v54 bounding box extraction from `C:\Users\Shadow\Documents\DayZ Projects\DZ\`  
**Tool**: `tools/p3d_bulk_scan.py` — 547 objects verified from `structures/` and `structures_bliss/`  
**Full data**: `tools/p3d_catalogue.json` (machine-readable) + `tools/p3d_catalogue_summary.txt`

## Axis Convention

- **w** = X-axis (face width, East-West span)
- **h** = Y-axis (vertical height)
- **d** = Z-axis (depth/thickness, or length for horizontal elements)

---

## KEY WALL PANELS (corrected from old estimates)

| Classname | W (face) | H | D (thick) | Notes |
|---|---|---|---|---|
| staticobj_wall_cncsmall_8 | 8.008 | 2.300 | 0.530 | Height was 3m — now 2.3m |
| staticobj_wall_cncsmall_4 | 4.017 | 2.324 | 0.538 | Height was 3m — now 2.3m |
| staticobj_wall_cnc_5 | 9.029 | 5.026 | 1.003 | "5"=height NOT width; face=9m |
| staticobj_wall_indcnc_10 | 9.012 | 9.758 | 1.007 | Face was 8.75m — now 9.012m |
| staticobj_wall_indcnc_4 | 6.000 | 3.499 | 0.266 | Was 4×10×0.5 — completely wrong |
| staticobj_wall_indcnch_10 | 9.608 | 1.113 | 10.688 | HORIZONTAL SLAB (roof/floor panel) |
| staticobj_wall_indcnch_5 | 9.499 | 1.120 | 5.466 | HORIZONTAL SLAB (roof/floor panel) |
| staticobj_wall_indcnc4_8 | 8.044 | 3.004 | 0.400 | Height was 8m — now 3m! |
| staticobj_wall_indcnc4_4 | 4.055 | 3.000 | 0.400 | Height was 8m — now 3m! |
| staticobj_wall_indcnc4_low_8 | 8.044 | 2.100 | 0.400 | |
| staticobj_wall_indcnc4_low_4 | 4.052 | 2.100 | 0.400 | |
| staticobj_wall_milcnc_4 | 4.052 | 4.744 | 1.096 | 4.74m tall (not 3m) |
| staticobj_wall_milcncbarrier | 4.012 | 0.805 | 0.487 | LOW KERB only 0.8m tall |
| staticobj_wall_stone | 10.060 | 2.034 | 1.950 | Face 10m not 8m, h=2m not 3.5m |
| staticobj_wall_stone2 | 9.408 | 1.572 | 1.452 | |
| staticobj_wall_tin_5 | 5.301 | 2.645 | 0.301 | |
| staticobj_wall_indcnc3_2_4 | 6.029 | 3.605 | 0.322 | Razorwire-topped CNC |
| staticobj_wall_barricade1_10 | 8.050 | 10.552 | 2.433 | TALL barricade wall |
| staticobj_wall_canal_10 | 10.100 | 5.476 | 4.090 | Thick canal wall |
| staticobj_wall_cncbarrier_block | 9.083 | 1.835 | 1.969 | Low stacked barriers |
| staticobj_wall_stoned | 8.131 | 11.932 | 1.622 | TALL stone curtain |

## SPACING GUIDE for drawWall

For `drawWall(pts, x1,y1,z1, x2,y2,z2, classname)`:
- **cncsmall_8** → space every **8.008m**
- **cncsmall_4** → space every **4.017m**
- **indcnc_10** → space every **9.012m**
- **indcnc4_8** → space every **8.044m**
- **indcnc4_4** → space every **4.055m**
- **milcnc_4** → space every **4.052m**
- **stone** → space every **10.060m**
- **fen5_5** → space every **5.227m**
- **indfnc_9** → space every **10.005m**

---

## CONTAINERS

All `land_container_1*o*` variants: **2.702w × 2.782h × 10.000d**  
Long axis = Z (depth). The "face" shown from the front is 2.7m wide × 2.78m tall.  
Short variants `1a/1b/1c`: 6.714w × 2.661h × 2.705d

---

## BUNKERS (much larger than flat panels)

Full 3D bunker modules — not flat panels:
- `land_bunker1_double`: 11.965 × 5.134 × 10.805
- `land_bunker1_left`: 13.202 × 5.179 × 8.789
- `land_bunker2_double`: same as bunker1_double

---

## BARRIERS

| Classname | W | H | D | Notes |
|---|---|---|---|---|
| staticobj_mil_hbarrier_big | 10.387 | 2.939 | 4.154 | 10.4m wide (not 4.5m!) |
| staticobj_mil_hbarrier_6m | 6.855 | 1.836 | 2.660 | |
| staticobj_mil_hbarrier_4m | 4.712 | 1.657 | 2.581 | |
| staticobj_mil_hbarrier_1m | 2.279 | 1.738 | 2.538 | |
| staticobj_roadblock_cncblock | 0.942 | 0.698 | 2.655 | Tiny block |
| staticobj_roadblock_pillbox | 5.640 | 2.254 | 5.209 | |

---

## PIPES & TUBES

**Pier tubes are VERTICAL** (long axis = height):
- `staticobj_pier_tube_big`: 1.077w × **19.950h** × 1.077d — 20m tall vertical tube
- `staticobj_pier_tube_small`: 0.833w × **13.000h** × 0.850d — 13m tall vertical tube

**Industrial pipes are HORIZONTAL** (long axis = depth/Z):
- `staticobj_pipe_big_18m`: 4.184w × 4.184h × **18.912d**
- `staticobj_pipe_big_9m`: 5.132w × 4.415h × **8.778d**
- `staticobj_pipe_small_20m`: 0.837w × 1.704h × **21.818d**
- `staticobj_pipe_small2_24m`: 3.972w × 3.434h × **25.415d**
- `staticobj_pipe_small2_high_24m`: 3.995w × 12.962h × **25.538d** (elevated)
- `staticobj_misc_concretepipe`: 2.805w × 2.666h × 3.814d (sewer section)

---

## TANKS & INDUSTRIAL

- `land_dieselpowerplant_tank_big`: 18.068 × 8.778 × 19.375
- `land_dieselpowerplant_tank_small`: 6.066 × 7.868 × 12.420
- `land_smokestack_big`: 19.879 × **68.075h** × 14.689 (tallest!)
- `land_smokestack_medium`: 8.000 × **48.800h** × 9.552
- `land_smokestack_metal`: 6.835 × **38.337h** × 7.038
- `land_smokestack_brick`: 4.993 × **31.626h** × 7.683

---

## TOWERS

- `land_tower_tc1`: 5.155 × **30.975h** × 5.173 (radio tower)
- `land_tower_tc2_base`: 19.730 × **50.183h** × 19.608
- `land_tower_tc3_grey`: 11.500 × **50.503h** × 11.500
- `land_tower_tc4_base`: 24.531 × **46.512h** × 24.531
- `land_mil_atc_big`: 30.000 × **35.660h** × 42.510
- `land_mil_atc_small`: 21.959 × **24.602h** × 15.183
- `land_mil_guardtower`: 5.327 × **13.518h** × 12.635

---

## CASTLE STRUCTURES

Full 3D structure dimensions (not flat panels):
- `land_castle_wall1_20`: 7.671w × 26.845h × 17.191d (face=17m, 27m tall!)
- `land_castle_wall2_30`: 6.274w × 30.534h × 19.991d (30m tall!)
- `land_castle_bastion`: 26.973 × 17.180 × 19.425 (massive round tower)
- `land_castle_bergfrit`: 11.760 × **36.677h** × 15.566 (keep tower)
- `land_castle_donjon`: 15.198 × **28.807h** × 15.198 (square keep)
- `land_castle_gate`: 21.068 × 17.189 × 21.289

---

## MILITARY STRUCTURES

- `land_mil_guardbox_*`: 2.646 × **5.566h** × 4.560 (includes elevated base)
- `land_mil_guardshed`: 2.863 × 4.032 × 2.063
- `land_mil_barracks_round`: 4.361 × 6.142 × 4.900
- `land_mil_barracks1`: 18.330 × 7.902 × 11.116
- `land_mil_barracks5`: 32.752 × 15.620 × 20.704 (large)
- `land_mil_reinforcedtank1`: 21.312 × 6.684 × 21.018
- `land_mil_reinforcedtank2`: 37.931 × 11.954 × 37.931 (huge)
- `land_mil_aircraftshelter`: 39.986 × 10.953 × 50.046
- `land_mil_blastcover1`: **35.001w** × 3.982 × 23.874 (wide blast wall)
- `land_mil_blastcover4`: **53.040w** × 4.152 × 16.070 (largest)

---

## MONUMENTS

Not simple obelisks — full complex structures:
- `staticobj_monument_war1`: 12.516 × 11.414 × 16.214
- `staticobj_monument_t34`: 16.588 × 6.564 × 12.710 (tank on plinth)
- `land_monument_mig21`: **39.004w** × 14.314 × 7.128 (MiG on display)

---

## AIRFIELD

- `land_airfield_hangar_green`: 31.816 × 13.710 × **51.593d**
- `land_airfield_servicehangar_l`: 43.649 × 16.381 × **50.185d**
- `land_mil_aircraftshelter`: 39.986 × 10.953 × **50.046d**

---

## HOW TO USE IN GENERATORS

```typescript
// Use getObjectWidth() for wall panel face spacing:
const spacing = getObjectWidth("staticobj_wall_indcnc_10");  // = 9.012

// Use getMimic() for 3D preview box sizing:
const { w, h, d } = getMimic("staticobj_wall_cncsmall_8");  // 8.008, 2.300, 0.530

// Key design patterns:
// Wall panels: drawWall auto-spaces by classname width
// Pier tubes: vertical — use as columns/pillars (20m and 13m tall)
// Industrial pipes: horizontal along Z-axis — rotate for different directions
// indcnch panels: lie FLAT — use as roofs/floors (slab orientation)
// Containers: 10m long along Z — face is 2.7m wide × 2.78m tall
```

---

## SCANNER TOOL

`tools/p3d_bulk_scan.py` — rerun any time to refresh dimensions:
```bash
cd "C:/Users/Shadow/Downloads/dank-studio"
python tools/p3d_bulk_scan.py
```
Outputs:
- `tools/p3d_catalogue.json` — full machine-readable data (547 objects)
- `tools/p3d_catalogue_summary.txt` — human-readable sorted table

DayZ game files: `C:\Users\Shadow\Documents\DayZ Projects\DZ\`
- `structures/` — original Chernarus objects
- `structures_bliss/` — Livonia/newer objects (guardboxes, bunkers, new walls)
