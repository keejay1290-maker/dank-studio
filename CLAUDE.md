# Dank Studio — Project Context

## Source of truth
- **Rules**: [DANK_RULES.md](DANK_RULES.md) — gold-standard build/render/QA rules. Apply to every change.
- **Handover**: [handover.txt](handover.txt) — last session's state, completed work, and roadmap.

## Skills (auto-loaded from `.claude/skills/`)
Use these when relevant — read the SKILL.md before working in the matching area:
- `dank_studio_architecture` — overall app/pipeline layout
- `dank_studio_preview_renderer` — 3D preview / Preview3D.tsx
- `dank_studio_sphere_math` — sphere/dome panel math, gap elimination
- `dank_studio_adding_generators` — how to add a new shape generator
- `architectural_perfection` — zero-gap algorithmic sweep methodology
- `high_fidelity_gen`, `dank_mockup_gen`, `master_stylist`, `dank_sdk`, `perfection_checker`

## Conventions
- This is the active project. The old `Dank-editor-preview/` is being phased out — do not edit it; pull anything still needed into here.
- Generators live in [src/lib/generators/](src/lib/generators/).
- 3D preview in [src/components/Preview3D.tsx](src/components/Preview3D.tsx).
- Build registry: [src/lib/builds.ts](src/lib/builds.ts).

## Active work
See [handover.txt](handover.txt) for the current roadmap (zero-gap sweep, generator consolidation, camera zoom fix).
