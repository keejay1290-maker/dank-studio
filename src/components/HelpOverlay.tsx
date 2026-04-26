// Keyboard shortcut + tab navigation help, triggered by `?` globally.
// Renders nothing when closed, no portal needed (already z-50).

import { useEffect } from "react";

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["?"],          label: "Open / close this help" },
  { keys: ["/"],          label: "Focus library search (library tab)" },
  { keys: ["Ctrl", "C"],  label: "Copy generated JSON" },
  { keys: ["Ctrl", "S"],  label: "Download generated JSON" },
  { keys: ["Esc"],        label: "Close modal / deselect node" },
];

const TABS: { key: string; label: string; hint: string }[] = [
  { key: "library",  label: "Library",         hint: "95+ pre-built generators across Sci-Fi, Landmarks, Containers, Structures…" },
  { key: "draw",     label: "Free Draw",       hint: "Click-and-drag wall lines + place individual objects" },
  { key: "panel",    label: "Panel Builder",   hint: "Spreadsheet-style numerical placement" },
  { key: "npc",      label: "NPC Builder",     hint: "cfgspawnabletypes.xml for NPC spawns (Josie format)" },
  { key: "loadout",  label: "Loadout Builder", hint: "playerspawngear.json for player kits" },
  { key: "airdrop",    label: "Airdrop",           hint: "events.xml + cfgeventspawns.xml + types.xml for dynamic events" },
  { key: "console",    label: "Console",           hint: "init.c snippets, GiveItem, SetPos, kill-zones" },
  { key: "community",  label: "Community Builds",  hint: "3,845 community JSONs with image previews — browse, hover to flip images, download instantly" },
];

export function HelpOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in-up"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-[min(640px,90vw)] max-h-[85vh] overflow-y-auto bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs font-black uppercase tracking-[0.25em] text-amber-400">Help · Shortcuts</h2>
          <button onClick={onClose}
            className="text-zinc-500 hover:text-white text-xl leading-none">×</button>
        </div>

        <section className="mb-6">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Keyboard</h3>
          <div className="space-y-1.5">
            {SHORTCUTS.map(s => (
              <div key={s.label} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/5">
                <span className="text-xs text-zinc-300">{s.label}</span>
                <span className="flex gap-1">
                  {s.keys.map(k => (
                    <kbd key={k} className="px-2 py-0.5 text-[10px] font-mono font-bold bg-black/40 border border-amber-500/20 rounded text-amber-300">{k}</kbd>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Tabs</h3>
          <div className="grid grid-cols-1 gap-1.5">
            {TABS.map(t => (
              <div key={t.key} className="py-1.5 px-3 rounded-lg bg-white/5">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] font-bold text-zinc-200">{t.label}</span>
                  <code className="text-[9px] text-zinc-600">{t.key}</code>
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5">{t.hint}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="text-[9px] text-zinc-600 mt-5 text-center">
          Press <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-black/40 border border-amber-500/20 rounded text-amber-400/70">Esc</kbd> or click outside to close
        </p>
      </div>
    </div>
  );
}
