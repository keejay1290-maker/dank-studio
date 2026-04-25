// Console / Command Tool — quick generators for DayZ server admin commands,
// init.c snippets, types.xml fragments, and CFG flags.
// Source patterns: scalespeeder server snippets + DayZ Bohemia community wiki.

import { useState, useMemo } from "react";
import { toast } from "./Toast";

type Tool = "spawn_loadout" | "give_item" | "set_pos" | "init_random_loadout" | "cfgignore" | "kill_zones";

const TOOLS: { id: Tool; label: string; description: string }[] = [
  { id: "spawn_loadout",        label: "Fresh-Spawn Init.c Snippet", description: "init.c StartingEquipSetup() block" },
  { id: "init_random_loadout",  label: "Random Multi-Loadout Init.c", description: "init.c with Math.RandomIntInclusive picking from 3 presets" },
  { id: "give_item",            label: "Give-Item Console",          description: "Server-console GiveItem command" },
  { id: "set_pos",              label: "Teleport / SetPos",          description: "SetPosition command for admin teleport" },
  { id: "cfgignore",            label: "cfgignorelist.xml Wipe",     description: "Wipe vehicles/storage on next restart" },
  { id: "kill_zones",           label: "ContaminatedZone (events)",  description: "events.xml block for static contaminated zones" },
];

export function ConsoleTools() {
  const [tool, setTool] = useState<Tool>("spawn_loadout");

  // shared state pieces (only relevant ones used per tool)
  const [primary,  setPrimary]  = useState("M4A1_Black");
  const [mag,      setMag]      = useState("Mag_STANAG_30Rnd");
  const [sidearm,  setSidearm]  = useState("Glock19");
  const [item,     setItem]     = useState("BandageDressing");
  const [qty,      setQty]      = useState(1);
  const [name,     setName]     = useState("PlayerName");
  const [x,        setX]        = useState(7500);
  const [y,        setY]        = useState(0);
  const [z,        setZ]        = useState(7500);

  const code = useMemo(() => generate(tool, { primary, mag, sidearm, item, qty, name, x, y, z }), [tool, primary, mag, sidearm, item, qty, name, x, y, z]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(code); toast.success("Copied snippet"); }
    catch { toast.error("Clipboard access denied"); }
  };
  const download = () => {
    const ext = tool === "cfgignore" || tool === "kill_zones" ? "xml" : "c";
    const blob = new Blob([code], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${tool}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${a.download}`);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="w-[360px] flex-shrink-0 border-r border-white/5 overflow-y-auto p-4 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">CONSOLE TOOLS</h2>
        <p className="text-[10px] text-zinc-500 leading-relaxed">
          Quick admin command + init.c snippet generators. Output drops directly into your server config.
        </p>

        <div className="space-y-1">
          {TOOLS.map(t => (
            <button key={t.id} onClick={() => setTool(t.id)}
              className={`w-full text-left px-3 py-2 rounded border text-[11px] transition-colors ${
                tool === t.id
                  ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                  : "bg-black/20 border-white/5 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <div className="font-bold uppercase tracking-wider text-[10px]">{t.label}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{t.description}</div>
            </button>
          ))}
        </div>

        {/* Conditional fields */}
        {(tool === "spawn_loadout" || tool === "init_random_loadout") && (
          <>
            <Field label="Primary classname"><Mono value={primary} onChange={setPrimary} /></Field>
            <Field label="Magazine classname"><Mono value={mag}     onChange={setMag} /></Field>
            <Field label="Sidearm classname"><Mono value={sidearm} onChange={setSidearm} /></Field>
          </>
        )}

        {tool === "give_item" && (
          <>
            <Field label="Item classname"><Mono value={item} onChange={setItem} /></Field>
            <Field label="Quantity"><Mono value={String(qty)} onChange={v => setQty(Number(v) || 1)} /></Field>
            <Field label="Player name"><Mono value={name} onChange={setName} /></Field>
          </>
        )}

        {tool === "set_pos" && (
          <>
            <Field label="Player name"><Mono value={name} onChange={setName} /></Field>
            <div className="grid grid-cols-3 gap-2">
              <NumField label="X" value={x} onChange={setX} />
              <NumField label="Y" value={y} onChange={setY} />
              <NumField label="Z" value={z} onChange={setZ} />
            </div>
          </>
        )}

        <div className="flex gap-2 pt-2">
          <button onClick={copy}
            className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/50 rounded text-cyan-300">
            Copy
          </button>
          <button onClick={download}
            className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/50 rounded text-emerald-300">
            Download
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-4 bg-black/20">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            {TOOLS.find(t => t.id === tool)?.label}
          </span>
          <span className="text-[10px] text-zinc-600 font-mono">{code.split("\n").length} lines</span>
        </div>
        <pre className="text-[11px] font-mono text-zinc-300 whitespace-pre leading-[1.5] bg-black/30 p-4 rounded border border-white/5 overflow-x-auto">
          {code}
        </pre>
      </main>
    </div>
  );
}

interface Args { primary: string; mag: string; sidearm: string; item: string; qty: number; name: string; x: number; y: number; z: number; }

function generate(tool: Tool, a: Args): string {
  switch (tool) {
    case "spawn_loadout":
      return `void StartingEquipSetup(PlayerBase player, bool clothesChosen)
{
\tEntityAI item;
\titem = player.GetInventory().CreateInInventory("${a.primary}");
\tif (item) item.GetInventory().CreateAttachment("${a.mag}");
\tplayer.GetInventory().CreateInInventory("${a.sidearm}");
\tplayer.GetInventory().CreateInInventory("BandageDressing");
\tplayer.GetInventory().CreateInInventory("Rag");
\tplayer.GetInventory().CreateInInventory("Apple");
\tplayer.GetInventory().CreateInInventory("Canteen");
}`;

    case "init_random_loadout":
      return `void StartingEquipSetup(PlayerBase player, bool clothesChosen)
{
\tint pick = Math.RandomIntInclusive(1, 3);
\tEntityAI w;
\tswitch (pick)
\t{
\t\tcase 1:  // ${a.primary}
\t\t\tw = player.GetInventory().CreateInInventory("${a.primary}");
\t\t\tif (w) w.GetInventory().CreateAttachment("${a.mag}");
\t\t\tbreak;
\t\tcase 2:  // AKM kit
\t\t\tw = player.GetInventory().CreateInInventory("AKM");
\t\t\tif (w) w.GetInventory().CreateAttachment("Mag_AKM_30Rnd");
\t\t\tbreak;
\t\tcase 3:  // SVD sniper
\t\t\tw = player.GetInventory().CreateInInventory("VSD");
\t\t\tif (w) w.GetInventory().CreateAttachment("Mag_SVD_10Rnd");
\t\t\tbreak;
\t}
\tplayer.GetInventory().CreateInInventory("${a.sidearm}");
\tplayer.GetInventory().CreateInInventory("BandageDressing");
\tplayer.GetInventory().CreateInInventory("Canteen");
}`;

    case "give_item":
      return `// Server console — give item to player
#giveItem ${a.name} ${a.item} ${a.qty}

// Or via in-game admin command (Expansion / VPP):
/giveitem "${a.name}" "${a.item}" ${a.qty}`;

    case "set_pos":
      return `// Server console — teleport player to coordinates
#position ${a.name} ${a.x} ${a.y} ${a.z}

// Expansion / VPP equivalent:
/tp "${a.name}" ${a.x} ${a.y} ${a.z}`;

    case "cfgignore":
      return `<?xml version="1.0" encoding="UTF-8"?>
<!-- cfgignorelist.xml — wipe these on next restart, keep secret items -->
<ignore_list>
\t<type name="OffroadHatchback"/>
\t<type name="Sedan_02"/>
\t<type name="Hatchback_02"/>
\t<type name="Truck_01_Covered"/>
\t<type name="Truck_02"/>
\t<type name="V3S_Cargo"/>
\t<type name="Lada"/>
\t<!-- containers / storage -->
\t<type name="LargeTentBackPack"/>
\t<type name="MediumTent"/>
\t<type name="ShelterKit"/>
\t<type name="StashSmall"/>
\t<type name="UndergroundStash"/>
</ignore_list>`;

    case "kill_zones":
      return `<!-- Static contaminated/kill zone — paste into events.xml -->
<event name="StaticContaminatedArea">
\t<nominal>1</nominal>
\t<min>0</min>
\t<max>1</max>
\t<lifetime>3888000</lifetime>
\t<restock>0</restock>
\t<saveinterval>60</saveinterval>
\t<active>1</active>
\t<deletable>0</deletable>
\t<position>fixed</position>
\t<limit>custom</limit>
\t<children>
\t\t<child lootmax="0" lootmin="0" max="1" min="1" type="ContaminatedArea_Static"/>
\t</children>
</event>

<!-- cfgeventspawns.xml position -->
<event name="StaticContaminatedArea">
\t<pos x="${a.x}" z="${a.z}" a="0" smnpc="" smin="0" smax="0" dmin="0" dmax="0"/>
</event>`;
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
function Mono({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input value={value} onChange={e => onChange(e.target.value)}
    className="w-full bg-black/20 text-zinc-200 text-xs rounded px-2 py-2 border border-white/5 outline-none font-mono" />;
}
function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">{label}</label>
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full bg-black/20 text-zinc-200 text-xs rounded px-2 py-1.5 border border-white/5 outline-none font-mono" />
    </div>
  );
}
