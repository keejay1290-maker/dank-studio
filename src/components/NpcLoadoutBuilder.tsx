// Shared UI used by both NPC Builder and Loadout Builder tabs.
// Left: controls (role, character types, name, seed). Right: export preview.

import { useMemo, useState } from "react";
import { ROLE_TEMPLATES } from "../lib/dayz/roles";
import { ALL_SURVIVORS, SURVIVORS_MALE, SURVIVORS_FEMALE, CLOTHING_SET_INDEX, WEAPON_INDEX } from "../lib/dayz/items";
import { buildLoadout, toCfgSpawnableXml, toPlayerSpawnGearJson } from "../lib/dayz/build";

export type BuilderMode = "npc" | "loadout";

export function NpcLoadoutBuilder({ mode }: { mode: BuilderMode }) {
  const [roleId, setRoleId]     = useState(ROLE_TEMPLATES[0].id);
  const [name, setName]         = useState("");
  const [seed, setSeed]         = useState(0);
  const [survType, setSurvType] = useState("SurvivorM_Peter");
  const [charSel, setCharSel]   = useState<"all" | "male" | "female" | "single">("all");

  const characterTypes = useMemo(() => {
    if (charSel === "all")    return ALL_SURVIVORS;
    if (charSel === "male")   return SURVIVORS_MALE;
    if (charSel === "female") return SURVIVORS_FEMALE;
    return [survType];
  }, [charSel, survType]);

  const loadout = useMemo(() => {
    try {
      return buildLoadout({ roleId: roleId as any, name: name || undefined, characterTypes, seed });
    } catch (e) {
      return null;
    }
  }, [roleId, name, characterTypes, seed]);

  const exportText = useMemo(() => {
    if (!loadout) return "// invalid loadout";
    if (mode === "npc")     return toCfgSpawnableXml(loadout, survType);
    else                    return JSON.stringify(toPlayerSpawnGearJson(loadout), null, 2);
  }, [loadout, mode, survType]);

  const role = ROLE_TEMPLATES.find(r => r.id === roleId)!;
  const outfit = CLOTHING_SET_INDEX[role.outfitSet];

  const copy = () => navigator.clipboard.writeText(exportText);
  const download = () => {
    const ext = mode === "npc" ? "xml" : "json";
    const blob = new Blob([exportText], { type: mode === "npc" ? "application/xml" : "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `${loadout?.name.replace(/\s+/g, "_") ?? "loadout"}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Left controls ──────────────────────────────────────────────────── */}
      <aside className="w-[380px] flex-shrink-0 border-r border-white/5 overflow-y-auto p-4 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">
          {mode === "npc" ? "NPC BUILDER" : "LOADOUT BUILDER"}
        </h2>

        <Field label="Role Template">
          <select
            value={roleId}
            onChange={e => setRoleId(e.target.value as any)}
            className="w-full bg-black/20 text-zinc-200 text-xs rounded px-2 py-2 border border-white/5 focus:border-indigo-500/50 outline-none"
          >
            {ROLE_TEMPLATES.map(r => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
          <p className="text-[10px] text-zinc-500 mt-1">{role.description}</p>
        </Field>

        <Field label="Name">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={role.label}
            className="w-full bg-black/20 text-zinc-200 text-xs rounded px-2 py-2 border border-white/5 focus:border-indigo-500/50 outline-none"
          />
        </Field>

        <Field label="Character Pool">
          <div className="flex gap-1 text-[10px] font-bold uppercase">
            {(["all","male","female","single"] as const).map(opt => (
              <button
                key={opt}
                onClick={() => setCharSel(opt)}
                className={`flex-1 px-2 py-1.5 rounded border ${
                  charSel === opt
                    ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                    : "bg-black/20 border-white/5 text-zinc-500 hover:text-zinc-300"
                }`}
              >{opt}</button>
            ))}
          </div>
          {charSel === "single" && (
            <select
              value={survType}
              onChange={e => setSurvType(e.target.value)}
              className="w-full mt-2 bg-black/20 text-zinc-200 text-xs rounded px-2 py-2 border border-white/5 outline-none"
            >
              {ALL_SURVIVORS.map(s => <option key={s}>{s}</option>)}
            </select>
          )}
        </Field>

        {mode === "npc" && (
          <Field label="Target NPC Type (XML <type name>)">
            <select
              value={survType}
              onChange={e => setSurvType(e.target.value)}
              className="w-full bg-black/20 text-zinc-200 text-xs rounded px-2 py-2 border border-white/5 outline-none"
            >
              {ALL_SURVIVORS.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
        )}

        <Field label={`Seed (${seed})`}>
          <input type="range" min={0} max={100} value={seed}
            onChange={e => setSeed(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </Field>

        {/* Resolved gear summary */}
        <div className="mt-4 space-y-2 text-[11px]">
          <Summary label="Primary"   value={loadout?.primary.classname} sub={loadout?.primary.attachments.join(", ")} />
          <Summary label="Secondary" value={loadout?.secondary?.classname} sub={loadout?.secondary?.attachments.join(", ")} />
          <Summary label="Sidearm"   value={loadout?.sidearm.classname} sub={loadout?.sidearm.attachments.join(", ")} />
          <Summary label="Outfit"    value={outfit?.label} />
          <Summary label="NVG"       value={loadout?.nvg ? "Yes (Headstrap + Goggles + Battery9V)" : "No"} />
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={copy}
            className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/50 rounded text-indigo-300">
            Copy
          </button>
          <button onClick={download}
            className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/50 rounded text-emerald-300">
            Download
          </button>
        </div>
      </aside>

      {/* ── Right export preview ───────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto p-4 bg-black/20">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            {mode === "npc" ? "cfgspawnabletypes.xml" : "playerspawngear.json"}
          </span>
          <span className="text-[10px] text-zinc-600">
            {role.pvp ? "PVP KIT (full medical)" : "BASIC KIT"} · NVG ON · all slots filled
          </span>
        </div>
        <pre className="text-[11px] font-mono text-zinc-300 whitespace-pre leading-[1.5] bg-black/30 p-4 rounded border border-white/5 overflow-x-auto">
          {exportText}
        </pre>

        <div className="mt-6 text-[10px] text-zinc-600 leading-relaxed">
          <p className="mb-2 font-bold text-zinc-400 uppercase tracking-widest">Hard Rules Applied</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Primary + Secondary + Sidearm (3 firearms total)</li>
            <li>NVG: NVGHeadstrap + NVGoggles + Battery9V mandatory</li>
            <li>Weapon → mag → ammo mapping from items.ts (P3D-verified)</li>
            <li>Outfit sourced from themed set — colors/role match</li>
            <li>Backpack filled with extra mags + meds + food + filler</li>
            <li>{role.pvp ? "PVP medical kit: bandages, antibiotics, splint, morphine, saline" : "Basic medical: bandages + vitamins"}</li>
          </ul>
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

function Summary({ label, value, sub }: { label: string; value?: string | null; sub?: string | null }) {
  return (
    <div className="flex items-start justify-between py-1 border-b border-white/5">
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
      <div className="text-right">
        <div className="text-zinc-300 font-mono">{value ?? "—"}</div>
        {sub && <div className="text-[10px] text-zinc-600 font-mono">{sub}</div>}
      </div>
    </div>
  );
}

// Tiny helper export for TS type check of WEAPON_INDEX usage (prevents tree-shake warning)
export const __weaponCount = Object.keys(WEAPON_INDEX).length;
