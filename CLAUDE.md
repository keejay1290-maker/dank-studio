# Dank Studio — Project Context

## Read this first
- **[AI_GUIDE.md](AI_GUIDE.md)** — comprehensive guide for any AI assistant: file map, conventions,
  draw helpers, param naming rules, common pitfalls, step-by-step generator guide.
- **[DANK_RULES.md](DANK_RULES.md)** — gold-standard build/render/QA rules. Apply to every change.

## Skills (invoke only what the task needs — saves tokens)

**Architecture / renderer** (load when adding/debugging generators or 3D preview):
- `dank_studio_architecture` — file map, pipeline layout
- `dank_studio_preview_renderer` — Preview3D.tsx internals
- `dank_studio_adding_generators` — step-by-step generator creation

**Math / coverage** (load when fixing gaps, spheres, or rotations):
- `dank_studio_sphere_math` — sphere/dome panel math, gap elimination
- `flush_panel_coverage` — step sizes, S-scaling, zero-gap stacking
- `panel_orientation_math` — yaw/pitch formulas for curved/angled surfaces

**Corner & connection fixes** (load when build has notches or float gaps):
- `wall_junction_fills` — drawRect corner notches, wall/tower junctions, dual-face walls
- `polygon_corner_patterns` — convex polygon vertex notch fix (pentagon, triangle)
- `building_connection_patterns` — gap calculation, connector wall, TS const scope trap

**Material & style** (load when choosing panels or material palette):
- `fantasy_material_palette` — material by setting; step sizes
- `curtain_wall_patterns` — dual-face walls, interval towers, battlements
- `gateway_arch_patterns` — pointed/round arches, front+rear faces
- `spire_taper_patterns` — safe taper formula, negative-radius guard
- `r_param_generators` — when generator uses r/spread instead of scale

**Quality / generation** (load for new builds or QA passes):
- `generator_rework_checklist` — 10-step rework checklist
- `architectural_perfection` — zero-gap algorithmic sweep methodology
- `high_fidelity_gen`, `dank_mockup_gen`, `master_stylist`, `dank_sdk`
- `glb_rendering_rules` — when to use GLB vs BoxGeometry

## Conventions
- Generators live in [src/lib/generators/](src/lib/generators/).
- 3D preview in [src/components/Preview3D.tsx](src/components/Preview3D.tsx).
- Build registry: [src/lib/builds.ts](src/lib/builds.ts).
- Param key in builds.ts **must exactly match** p.xxx in the generator — mismatches silence sliders.
- Do not edit `Dank-editor-preview/` — it is the old project, being phased out.
