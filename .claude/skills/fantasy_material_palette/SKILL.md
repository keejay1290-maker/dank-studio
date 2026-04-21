# 🎨 FANTASY & FICTION MATERIAL PALETTE

**When to use:** Any time you're picking wall materials for a fictional or historical build.

---

## QUICK REFERENCE TABLE

| Setting / Aesthetic | Primary | Secondary | Battlements |
|---|---|---|---|
| Medieval castle (light) | STONE2 | STONE2 | CASTLE |
| Medieval castle (dark) | STONE | STONE | CASTLE |
| Gothic / Hogwarts | CASTLE | CASTLE | CASTLE |
| Ancient ruins | STONE | STONE2 | STONE |
| Ice / Arctic / Crystal | STONE2 | STONE2 | STONE2 |
| Concrete bunker / prison | CNC8 | MILCNC | CNC8 |
| Military fortress | MILCNC | CNC4 | MILCNC |
| Industrial / sci-fi | IND10 | MILCNC | CNC8 |
| Dark tower / evil fortress | IND10 | CNC8 | CNC8 |
| Modern / brutalist | CNC8 | CNC4 | CNC8 |

---

## NOTABLE USES

| Build | Material logic |
|---|---|
| Hogwarts | CASTLE throughout — gothic, step=2*S |
| Minas Tirith / Helms Deep | STONE2 walls + CASTLE battlements |
| Eye of Sauron | IND10 tower + CNC8 crown + MILCNC spires |
| Azkaban Prison | IND10 — dark, industrial, oppressive |
| Fortress of Solitude | STONE2 — closest to white/light "crystal" |
| The Wall (GoT) | IND10 — massive ice blocks |
| Bunker / Pentagon | CNC8 + MILCNC — concrete |

---

## STEP SIZE REMINDER

| Material | Step (× S) |
|---|---|
| CASTLE | 2.0 |
| STONE / STONE2 | 1.572 |
| CNC4 / CNC8 | 2.3 |
| MILCNC | 4.5 (thin shafts), 4.7 (large radius) |
| IND10 | 9.5 (large radius), 8.0 (thin shafts) |

Always `step = panelH * S`.
