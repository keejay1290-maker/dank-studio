// Airdrop Builder UI — generates events.xml + cfgeventspawns.xml + types.xml
// snippets for community DayZ servers. Format validated against DayZ File
// Toolbox NPC Event Maker schema.

import { useMemo, useState } from "react";
import {
  defaultAirdrop, toEventsXml, toCfgEventSpawnsXml,
  toLootTypesXml, toCombinedXml, LOOT_TIERS,
} from "../lib/dayz/airdrop";
import type { AirdropConfig, AirdropPoint } from "../lib/dayz/airdrop";
import { toast } from "./Toast";

export function AirdropBuilder() {
  const [cfg, setCfg]       = useState<AirdropConfig>(() => defaultAirdrop());
  const [tab, setTab]       = useState<"events" | "spawns" | "types" | "combined">("combined");

  const exportText = useMemo(() => {
    if (tab === "events")   return toEventsXml(cfg);
    if (tab === "spawns")   return toCfgEventSpawnsXml(cfg);
    if (tab === "types")    return toLootTypesXml(cfg);
    return toCombinedXml(cfg);
  }, [cfg, tab]);

  const update = <K extends keyof AirdropConfig>(k: K, v: AirdropConfig[K]) => setCfg(c => ({ ...c, [k]: v }));

  const addPos = () => setCfg(c => ({ ...c, positions: [...c.positions, { x: 7500, y: -1, z: 7500, groupName: "" }] }));
  const removePos = (i: number) => setCfg(c => ({ ...c, positions: c.positions.filter((_, j) => j !== i) }));
  const updatePos = (i: number, patch: Partial<AirdropPoint>) =>
    setCfg(c => ({ ...c, positions: c.positions.map((p, j) => j === i ? { ...p, ...patch } : p) }));

  const copy = async () => {
    try { await navigator.clipboard.writeText(exportText); toast.success(`Copied ${tab} XML`); }
    catch { toast.error("Clipboard access denied"); }
  };
  const download = () => {
    const blob = new Blob([exportText], { type: "application/xml" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${cfg.name}_${tab}.xml`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${a.download}`);
  };

  const lootCount = LOOT_TIERS[cfg.lootTier].length;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Left controls ──────────────────────────────────────────────────── */}
      <aside className="w-[400px] flex-shrink-0 border-r border-white/5 overflow-y-auto p-4 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
          AIRDROP BUILDER
        </h2>
        <p className="text-[10px] text-zinc-500 leading-relaxed">
          Generates vanilla DayZ event XML — drops directly into <code className="text-amber-300">events.xml</code>,{" "}
          <code className="text-amber-300">cfgeventspawns.xml</code>, and{" "}
          <code className="text-amber-300">types.xml</code>.
        </p>

        <Field label="Event Name">
          <input value={cfg.name} onChange={e => update("name", e.target.value)}
            className="w-full bg-black/20 text-zinc-200 text-xs rounded px-2 py-2 border border-white/5 focus:border-amber-500/50 outline-none font-mono" />
        </Field>

        <Field label="Container / Drop Type (classname)">
          <input value={cfg.containerType} onChange={e => update("containerType", e.target.value)}
            className="w-full bg-black/20 text-zinc-200 text-xs rounded px-2 py-2 border border-white/5 outline-none font-mono" />
          <p className="text-[10px] text-zinc-600 mt-1">e.g. Land_Container_1Mo, Wreck_C130, ContaminatedZone_Static</p>
        </Field>

        <Field label="Loot Tier">
          <div className="flex gap-1 text-[10px] font-bold uppercase">
            {(["basic", "military", "elite", "contaminated"] as const).map(t => (
              <button key={t} onClick={() => update("lootTier", t)}
                className={`flex-1 px-2 py-1.5 rounded border transition-colors ${
                  cfg.lootTier === t
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                    : "bg-black/20 border-white/5 text-zinc-500 hover:text-zinc-300"
                }`}
              >{t}</button>
            ))}
          </div>
          <p className="text-[10px] text-zinc-600 mt-1">{lootCount} item types in this tier</p>
        </Field>

        <details className="bg-black/20 rounded border border-white/5">
          <summary className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-2 py-1.5 cursor-pointer">
            Loot Pool ({lootCount} items)
          </summary>
          <div className="px-2 pb-2 text-[10px] text-zinc-500 font-mono leading-tight">
            {LOOT_TIERS[cfg.lootTier].join(", ")}
          </div>
        </details>

        {/* Scheduling */}
        <div className="grid grid-cols-3 gap-2">
          <NumField label="Nominal" value={cfg.nominal}  onChange={v => update("nominal",  v)} />
          <NumField label="Min"     value={cfg.min}       onChange={v => update("min",      v)} />
          <NumField label="Max"     value={cfg.max}       onChange={v => update("max",      v)} />
          <NumField label="Lifetime (s)" value={cfg.lifetime} onChange={v => update("lifetime", v)} />
          <NumField label="Restock (s)"  value={cfg.restock}  onChange={v => update("restock",  v)} />
          <NumField label="Save (s)"     value={cfg.saveInterval} onChange={v => update("saveInterval", v)} />
          <NumField label="Safe (m)"     value={cfg.safeRadius}     onChange={v => update("safeRadius",     v)} />
          <NumField label="Distance (m)" value={cfg.distanceRadius} onChange={v => update("distanceRadius", v)} />
          <NumField label="Cleanup (m)"  value={cfg.cleanupRadius}  onChange={v => update("cleanupRadius",  v)} />
        </div>

        <div className="flex gap-3 text-[10px]">
          <label className="flex items-center gap-1.5 text-zinc-400">
            <input type="checkbox" checked={cfg.active} onChange={e => update("active", e.target.checked)} className="accent-amber-500" />
            Active
          </label>
          <label className="flex items-center gap-1.5 text-zinc-400">
            <input type="checkbox" checked={cfg.deletable} onChange={e => update("deletable", e.target.checked)} className="accent-amber-500" />
            Deletable
          </label>
        </div>

        {/* Spawn positions */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Spawn Positions ({cfg.positions.length})</span>
            <button onClick={addPos} className="text-[10px] text-amber-400 hover:text-amber-300 px-2 py-0.5 border border-amber-500/30 rounded">+ Add</button>
          </div>
          <div className="space-y-2">
            {cfg.positions.map((p, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1 items-center">
                <input type="number" value={p.x} onChange={e => updatePos(i, { x: Number(e.target.value) })} className="bg-black/20 text-[11px] text-zinc-300 rounded px-1.5 py-1 border border-white/5 font-mono" placeholder="X" />
                <input type="number" value={p.z} onChange={e => updatePos(i, { z: Number(e.target.value) })} className="bg-black/20 text-[11px] text-zinc-300 rounded px-1.5 py-1 border border-white/5 font-mono" placeholder="Z" />
                <input value={p.groupName ?? ""} onChange={e => updatePos(i, { groupName: e.target.value })} className="bg-black/20 text-[11px] text-zinc-300 rounded px-1.5 py-1 border border-white/5 font-mono" placeholder="group" />
                <button onClick={() => removePos(i)} className="text-rose-400 text-xs px-1">×</button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={copy}
            className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/50 rounded text-amber-300">
            Copy {tab}
          </button>
          <button onClick={download}
            className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/50 rounded text-emerald-300">
            Download
          </button>
        </div>
      </aside>

      {/* ── Right output ──────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto p-4 bg-black/20">
        <div className="mb-3 flex items-center gap-2">
          {(["combined", "events", "spawns", "types"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded border transition-colors ${
                tab === t
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                  : "bg-black/20 border-white/5 text-zinc-500 hover:text-zinc-300"
              }`}
            >{t === "spawns" ? "cfgeventspawns" : t}</button>
          ))}
        </div>

        <pre className="text-[11px] font-mono text-zinc-300 whitespace-pre leading-[1.5] bg-black/30 p-4 rounded border border-white/5 overflow-x-auto">
          {exportText}
        </pre>

        <div className="mt-6 text-[10px] text-zinc-600 leading-relaxed">
          <p className="mb-2 font-bold text-zinc-400 uppercase tracking-widest">Server install steps</p>
          <ol className="list-decimal pl-4 space-y-0.5">
            <li>Paste the <code className="text-amber-400">events.xml</code> block into your server's <code>db/events.xml</code> inside the root <code>&lt;events&gt;</code> tag.</li>
            <li>Paste the <code className="text-amber-400">cfgeventspawns.xml</code> block into <code>cfgeventspawns.xml</code> alongside other event spawn definitions.</li>
            <li>Paste the loot pool entries into <code>types.xml</code> under the root <code>&lt;types&gt;</code> tag (or merge if items already exist).</li>
            <li>Restart the server. Dynamic events will spawn at one of your defined positions, persisting for {cfg.lifetime}s.</li>
          </ol>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full bg-black/20 text-zinc-200 text-xs rounded px-2 py-1.5 border border-white/5 outline-none font-mono"
      />
    </div>
  );
}
