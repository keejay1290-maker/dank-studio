# DANK Design System Skill

## When to load
Load this skill when: making any UI changes, adding new components, or continuing the UI overhaul.

## Core Palette

| Token | Value | Usage |
|---|---|---|
| `--accent` | `#d4af37` | Gold — primary, active states, borders |
| `--accent-bright` | `#f0c850` | Gold hover |
| `--accent-glow` | `rgba(212,175,55,0.35)` | Glow on active elements |
| `--bg-deep` | `#050503` | Near-black background |
| `--bg-card` | `rgba(12,10,8,0.88)` | Glass surfaces |
| `--border` | `rgba(212,175,55,0.10)` | Subtle gold-tinted border |
| `--green` | `#22c55e` | Download / success / export |

## DANK Wordmark (top-left of every page)
```tsx
<div className="flex items-baseline gap-1.5 mr-4 flex-shrink-0 select-none">
  <span className="text-[19px] font-black tracking-tight leading-none"
    style={{ color: "var(--accent)", textShadow: "0 0 18px var(--accent-glow)" }}>DANK</span>
  <span className="text-[8px] font-bold tracking-[0.35em] text-zinc-600 uppercase pb-px">STUDIO</span>
</div>
```

## Tab Header Structure
Two groups separated by `border-l border-white/5`:
- **Build tools**: Library | Draw | Panel
- **XML tools**: NPC | Loadout | Airdrop | Console

Active tab: `text-[var(--accent)]` + `h-0.5 bg-[var(--accent)] shadow-[0_0_8px_var(--accent-glow)]` underline bar.

## Button Hierarchy

1. **Gold primary** (Re-Gen, active state): `bg-[var(--accent)] hover:bg-[var(--accent-bright)] text-black`
2. **Green action** (Download, Export): `bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white border border-green-500/30`
3. **Ghost** (Reset, secondary): `bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10`
4. **Destructive** (Delete): `bg-red-500/10 hover:bg-red-500/20 text-red-500`

## Category Chips
```tsx
// Active
"bg-[var(--accent)] text-black shadow-lg shadow-amber-900/30"
// Inactive
"bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300"
```

## BuildRow Selected State
```tsx
"bg-amber-400/8 border-r-2 border-[var(--accent)]"
```

## What NOT to use
- ❌ `indigo-*` Tailwind classes (old theme, fully replaced)
- ❌ Hard-coded `#6366f1` anywhere

## Full doc
See `DESIGN_SYSTEM.md` at the repo root for the complete token table and component patterns.
