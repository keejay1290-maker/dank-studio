# Dank Studio — Project Context

## Read this first
- **[AI_GUIDE.md](AI_GUIDE.md)** — comprehensive guide for any AI assistant: file map, conventions,
  draw helpers, param naming rules, common pitfalls, step-by-step generator guide.
- **[DANK_RULES.md](DANK_RULES.md)** — gold-standard build/render/QA rules. Apply to every change.

## Skills (auto-loaded from `.claude/skills/`)
- `dank_studio_architecture` — overall app/pipeline layout
- `dank_studio_preview_renderer` — 3D preview / Preview3D.tsx
- `dank_studio_sphere_math` — sphere/dome panel math, gap elimination
- `dank_studio_adding_generators` — how to add a new shape generator
- `architectural_perfection` — zero-gap algorithmic sweep methodology
- `high_fidelity_gen`, `dank_mockup_gen`, `master_stylist`, `dank_sdk`, `perfection_checker`

## Conventions
- Generators live in [src/lib/generators/](src/lib/generators/).
- 3D preview in [src/components/Preview3D.tsx](src/components/Preview3D.tsx).
- Build registry: [src/lib/builds.ts](src/lib/builds.ts).
- Param key in builds.ts **must exactly match** p.xxx in the generator — mismatches silence sliders.
- Do not edit `Dank-editor-preview/` — it is the old project, being phased out.
