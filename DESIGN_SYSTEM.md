# DANK STUDIO — Design System

## Colour Tokens (defined in `src/index.css` and `src/App.css`)

| Token | Value | Usage |
|---|---|---|
| `--accent` | `#d4af37` | Gold — primary CTA, active tab, borders |
| `--accent-bright` | `#f0c850` | Gold hover state |
| `--accent-glow` | `rgba(212,175,55,0.35)` | Glow shadows on active elements |
| `--bg-deep` | `#050503` | Page background |
| `--bg-card` | `rgba(12,10,8,0.88)` | Glass card background |
| `--border` | `rgba(212,175,55,0.10)` | Default border (subtle gold tint) |
| `--border-dim` | `rgba(255,255,255,0.06)` | Dimmer borders |
| `--green` | `#22c55e` | Success / download / export actions |
| `--green-dim` | `rgba(34,197,94,0.15)` | Green tinted backgrounds |
| `--text-main` | `#f0ede6` | Body text (warm white) |
| `--text-dim` | `#a09070` | Secondary text (warm grey) |

## Typography

- **Font**: Outfit (Google Fonts, weights 300–700)
- **Wordmark**: `DANK` — 19px, font-black, `var(--accent)` with `textShadow: 0 0 18px var(--accent-glow)`
- **Sub-brand**: `STUDIO` — 8px, font-bold, tracking-[0.35em], text-zinc-600

## Component Patterns

### Active tab
```
text-[var(--accent)] + bottom 0.5px border bg-[var(--accent)] shadow-[0_0_8px_var(--accent-glow)]
```

### Gold primary button
```
bg-[var(--accent)] hover:bg-[var(--accent-bright)] text-black
```

### Green secondary button (download / export)
```
bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white border border-green-500/30
```

### Category chip — active
```
bg-[var(--accent)] text-black shadow-lg shadow-amber-900/30
```

### Category chip — inactive
```
bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300
```

### BuildRow — selected
```
bg-amber-400/8 border-r-2 border-[var(--accent)]
```

### Glass panel
```
.glass — bg-[var(--bg-card)] backdrop-blur-12px border border-[var(--border)]
```

## Header Structure

```
[DANK STUDIO wordmark] | [Library] [Draw] [Panel] | [NPC] [Loadout] [Airdrop] [Console] | ────── | [?] | [Origin X Y Z]
                         ↑ Build tools group         ↑ XML tools group
```

Tab groups are separated by `border-l border-white/5`.

## Tailwind Colour Mapping (old indigo → new gold)

| Old | New |
|---|---|
| `text-indigo-400` | `text-amber-400` or `text-[var(--accent)]` |
| `text-indigo-300` | `text-amber-300` |
| `bg-indigo-600` | `bg-[var(--accent)]` + `text-black` |
| `border-indigo-500` | `border-amber-500` |
| `focus:border-indigo-500` | `focus:border-amber-500/50` |
| `hover:bg-indigo-500/20` | `hover:bg-amber-500/15` |

## File Locations

| File | Purpose |
|---|---|
| `src/index.css` | Master CSS tokens, glass utils, animations |
| `src/App.css` | Duplicate CSS vars (for legacy components), scrollbar, range inputs |
| `src/App.tsx` | Main layout, header, tabs, library, sidebars |
| `src/components/Toast.tsx` | Toast notification colours |
| `src/components/HelpOverlay.tsx` | Help modal (? key) |
| `src/components/NpcLoadoutBuilder.tsx` | NPC + Loadout tabs |
| `src/components/AirdropBuilder.tsx` | Airdrop tab |
| `src/components/ConsoleTools.tsx` | Console tab |
