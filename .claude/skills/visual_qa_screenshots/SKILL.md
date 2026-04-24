---
name: Visual QA via Multi-Angle Playwright Screenshots
description: How to programmatically screenshot every build from 3 angles + a zoom, then audit them for gaps, wrong shapes, and broken geometry. Critical for catching bugs type-check misses.
---

# Visual QA via Multi-Angle Playwright Screenshots

## Why

TypeScript + `applyLimit` checks only prove code runs — they don't prove a build *looks* right. A generator can compile, produce 400 valid Point3D objects, and still render as scattered panels with no recognizable shape. The only reliable check is rendering it in the 3D preview and looking.

Doing this by hand for 80 builds × 3 angles is impractical. The script at `tools/screenshot_builds.mjs` automates it.

## How to Run

```bash
# Start dev server first (port 5176 configured in script)
npm run dev &

# Screenshot every build (3 images each, saved to tools/screenshots/)
node tools/screenshot_builds.mjs

# Or screenshot a single build
node tools/screenshot_builds.mjs alcatraz_prison
```

Output per build:
- `<key>_a.png` — default 3/4 view (from AutoFrame)
- `<key>_b_zoom.png` — zoomed in 6 wheel-clicks for detail
- `<key>_c.png` — orbited ~120° to show the other side

## What to Look For

When auditing screenshots in bulk, classify each build into:

**CRITICAL (broken)**
- Scattered/disconnected panels (no recognizable shape) — usually a step or panel-size mismatch
- Missing whole sections (e.g. a "lighthouse" that renders as a tiny coil)
- Completely flat geometry that should be tall (walls too short for the radius)

**MAJOR (wrong but recognizable)**
- Visible horizontal stripes between rows — step scaling bug (see [panel_step_never_scale](../panel_step_never_scale/SKILL.md))
- Corners not joining (vertex notch) — see [polygon_corner_patterns](../polygon_corner_patterns/SKILL.md)
- One iconic feature missing (e.g. Eye of Sauron with no "eye")

**MINOR**
- Looks right but could be improved with detail objects
- Proportions slightly off

## Screenshot Script Search Quirks

The script clicks sidebar items by **text label** (not key). If the search word produces no results, the PREVIOUSLY-SELECTED build's screenshot is captured instead — you'll get a misleadingly-labelled image.

Fix: use a unique substring of the actual label, not the first word. The BUILDS table in the script maps each key to a search term that uniquely matches.

Special cases:
- `helms_deep` → search `"Deep"` (apostrophe strips to "Helms" which doesn't match "Helm's Deep")
- `atat_walker` → search `"AT-AT"` (not "ATAT")
- `barad_dur` → search `"Barad"` (not "Baraddr")
- `bridge_truss` → search `"Cable-Stayed"` (not "CableStayed")

## Diagnosis Shortcut

If a build looks wrong:
1. **Scattered panels** → likely `drawRing` radius too small for panel width (e.g. IND10 at r=5m only fits 3-4 panels)
2. **Horizontal stripes** → step*S scaling bug, fix by removing `*S` from panel height constants
3. **Solid mass from above** → too many interior panels/corridors; remove or reduce rings
4. **Flat lying on ground** → wall height (`h`) too small relative to radius; bump h to 20-30m+
5. **Wrong build shown** → sidebar search didn't match; check BUILDS label mapping

## Camera Controls via Playwright

The script uses `page.mouse.wheel` for zoom and `page.mouse.down/move/up` for orbit drag. This works because the 3D preview uses Three.js OrbitControls, which respond to native mouse events on the canvas.

To get a top-down view programmatically, drag `dy = -400` (large upward drag). For horizontal orbit, `dx = 400`.
