import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "./Toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BuildMeta {
  id: string;
  name: string;
  category: string;
  jsonFile: string;
  extraJsons: string[];
  images: string[];
}

interface Manifest {
  builds: BuildMeta[];
}

// ── Category grouping ─────────────────────────────────────────────────────────

const CATEGORY_GROUPS: Record<string, string[]> = {
  "🏗️ Structures": ["bases", "bennetts_builds", "bunkers", "castles", "caves", "faction_bases", "houses_cabins", "military", "oil_rigs", "ships", "treehouses", "walls_structures", "hospitals_medical", "police_stations", "banks_economy", "water_sources", "industry_factory", "bridges_roads", "trains_railway"],
  "⚡ Events":      ["air_drops", "missions_events", "pvp_events", "racing", "safezones", "seasonal", "ufc_fighting"],
  "📦 Content":     ["building_supplies", "loadouts", "loot_configs", "points_of_interest", "traders", "weapons", "explosives_boom", "food_drinks", "clothing_gear", "decorations", "furniture_interior", "signs", "flags"],
  "⚙️ Config":      ["npc_ai", "other_configs", "overhauls", "server_config", "teleporters", "vehicles"],
  "🗺️ Maps":        ["livonia", "sakhal", "winter_maps", "nature_foliage"],
};

const CAT_LABEL: Record<string, string> = {
  air_drops:        "✈️ Air Drops",
  bases:            "🏠 Bases",
  bennetts_builds:  "⭐ Bennett's Builds",
  building_supplies:"🧱 Building Supplies",
  bunkers:          "🔒 Bunkers",
  castles:          "🏰 Castles",
  caves:            "🌑 Caves",
  faction_bases:    "⚔️ Faction Bases",
  houses_cabins:    "🏡 Houses & Cabins",
  junk_test:        "🗑️ Junk / Test",
  livonia:          "🌿 Livonia",
  loadouts:         "🎒 Loadouts",
  loot_configs:     "💰 Loot Configs",
  military:         "🪖 Military",
  missions_events:  "🎯 Missions & Events",
  npc_ai:           "🤖 NPC / AI",
  oil_rigs:         "🛢️ Oil Rigs",
  other_configs:    "⚙️ Other Configs",
  overhauls:        "🔧 Overhauls",
  points_of_interest:"📍 Points of Interest",
  pvp_events:       "🔥 PvP Events",
  racing:           "🏎️ Racing",
  safezones:        "🛡️ Safe Zones",
  sakhal:           "❄️ Sakhal",
  seasonal:         "🎄 Seasonal",
  server_config:    "🖥️ Server Config",
  ships:            "⛵ Ships",
  teleporters:      "🌀 Teleporters",
  traders:          "💼 Traders",
  treehouses:       "🌲 Treehouses",
  ufc_fighting:     "🥊 UFC / Fighting",
  vehicles:         "🚗 Vehicles",
  walls_structures: "🏗️ Walls & Structures",
  weapons:          "🔫 Weapons",
  winter_maps:      "❄️ Winter Maps",
  hospitals_medical: "🏥 Hospitals & Medical",
  police_stations:   "👮 Police & Prisons",
  banks_economy:     "🏦 Banks & Economy",
  water_sources:     "⛲ Water Sources",
  industry_factory:  "🏭 Industrial & Factory",
  bridges_roads:     "🌉 Bridges & Roads",
  trains_railway:    "🚂 Railway & Trains",
  decorations:       "🎀 Decorations",
  furniture_interior:"🛋️ Interior & Furniture",
  nature_foliage:    "🌳 Nature & Foliage",
  food_drinks:       "🍎 Food & Drinks",
  explosives_boom:   "💥 Explosives & Boom",
  clothing_gear:     "👕 Clothing & Gear",
  signs:             "🪧 Signs & Billboards",
  flags:             "🚩 Flags",
};

const IMG_URL = (build: BuildMeta, img: string) =>
  `/community-api/file/${encodeURIComponent(build.category)}/${encodeURIComponent(build.name)}/${encodeURIComponent(img)}`;

const JSON_URL = (build: BuildMeta, file?: string) =>
  `/community-api/file/${encodeURIComponent(build.category)}/${encodeURIComponent(build.name)}/${encodeURIComponent(file ?? build.jsonFile)}`;

const PAGE_SIZE = 48;

// ── Main component ────────────────────────────────────────────────────────────

export function CommunityBuilds() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedCat, setSelectedCat] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<BuildMeta | null>(null);

  useEffect(() => {
    fetch("/community-api/manifest")
      .then(r => r.json())
      .then((m: Manifest) => { setManifest(m); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  useEffect(() => { setPage(0); }, [selectedCat, search]);

  const catCounts = useMemo(() => {
    if (!manifest) return {} as Record<string, number>;
    const c: Record<string, number> = { All: manifest.builds.length };
    for (const b of manifest.builds) c[b.category] = (c[b.category] ?? 0) + 1;
    return c;
  }, [manifest]);

  const filtered = useMemo(() => {
    if (!manifest) return [];
    let all = selectedCat === "All" ? manifest.builds : manifest.builds.filter(b => b.category === selectedCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      all = all.filter(b => b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q));
    }
    return all;
  }, [manifest, selectedCat, search]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-spin" style={{ display: "inline-block" }}>⚙️</div>
        <div className="w-32 h-0.5 bg-zinc-800 rounded-full mx-auto mb-3 overflow-hidden">
          <div className="h-full bg-[var(--accent)] rounded-full animate-pulse w-1/2" />
        </div>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Loading community builds…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex-1 flex items-center justify-center text-center px-8">
      <div>
        <div className="text-4xl mb-4">❌</div>
        <p className="text-sm font-bold text-rose-400 mb-2">Community folder not found</p>
        <p className="text-[11px] text-zinc-600 font-mono">C:\Users\Shadow\Desktop\dayz community</p>
        <p className="text-[10px] text-zinc-700 mt-2 uppercase tracking-widest">Make sure dev server is running</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 overflow-hidden">

      {/* ── Left sidebar ───────────────────────────────────────────────────── */}
      <aside className="w-56 flex-shrink-0 glass border-r-0 flex flex-col overflow-hidden m-2 rounded-xl z-10 shadow-2xl">
        <div className="px-3 py-2.5 border-b border-white/5 bg-white/5">
          <input
            type="text"
            placeholder="SEARCH BUILDS..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-black/20 text-amber-100 text-[10px] font-bold uppercase tracking-widest rounded-lg px-2.5 py-1.5 outline-none border border-white/5 focus:border-amber-500/40 transition-colors placeholder-zinc-700"
          />
        </div>

        <div className="flex-1 overflow-y-auto py-1 custom-scrollbar">
          <button
            onClick={() => setSelectedCat("All")}
            className={`w-full text-left px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-between ${
              selectedCat === "All" ? "text-[var(--accent)] bg-amber-400/8" : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
            }`}
          >
            <span>🌐 All</span>
            <span className="text-[9px] font-mono text-zinc-600">{catCounts.All ?? 0}</span>
          </button>

          {Object.entries(CATEGORY_GROUPS).map(([group, cats]) => {
            const groupCats = cats.filter(c => catCounts[c]);
            if (!groupCats.length) return null;
            return (
              <div key={group} className="mt-4 first:mt-2 pt-2 first:pt-0 border-t first:border-t-0 border-white/5">
                <div className="px-3 py-1 text-[9px] font-black uppercase tracking-[0.25em] text-amber-500/90 shadow-sm mb-1 flex items-center gap-2">
                  <span className="w-1 h-3 bg-amber-600/30 rounded-full" />
                  {group}
                </div>
                {groupCats.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCat(cat)}
                    className={`w-full text-left px-3 py-1.5 text-[10px] font-medium transition-all flex items-center justify-between group ${
                      selectedCat === cat ? "text-amber-100 bg-amber-500/10 border-r-2 border-amber-500" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{CAT_LABEL[cat] ?? cat}</span>
                    <span className={`text-[9px] font-mono flex-shrink-0 ml-1 ${selectedCat === cat ? "text-amber-400/60" : "text-zinc-600 group-hover:text-zinc-400"}`}>{catCounts[cat]}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/3 flex-shrink-0">
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">
            Community Builds
            <span className="ml-2 text-zinc-600 font-mono">{filtered.length.toLocaleString()}</span>
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="px-2 py-0.5 text-[10px] font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded transition-all">‹</button>
              <span className="text-[10px] text-zinc-500">{page + 1} / {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                className="px-2 py-0.5 text-[10px] font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded transition-all">›</button>
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          {paged.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center py-20">
              <span className="text-5xl opacity-20">🏗️</span>
              <p className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest">No builds match your filter</p>
              <p className="text-[10px] text-zinc-700">Try a different category or clear the search</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
              {paged.map(build => (
                <BuildCard key={build.id} build={build} onSelect={setDetail} />
              ))}
            </div>
          )}
        </div>

        {/* Bottom pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-2 border-t border-white/5 flex-shrink-0">
            <button disabled={page === 0} onClick={() => setPage(0)}
              className="px-2 py-1 text-[10px] font-bold text-zinc-500 hover:text-white disabled:opacity-30 transition-all">«</button>
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 text-[10px] font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded transition-all">Prev</button>
            <span className="text-[10px] text-zinc-500 font-mono w-20 text-center">
              {page + 1} / {totalPages}
            </span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 text-[10px] font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded transition-all">Next</button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}
              className="px-2 py-1 text-[10px] font-bold text-zinc-500 hover:text-white disabled:opacity-30 transition-all">»</button>
          </div>
        )}
      </main>

      {/* ── Detail overlay ─────────────────────────────────────────────────── */}
      {detail && (
        <BuildDetail build={detail} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}

// ── Build card ────────────────────────────────────────────────────────────────

function BuildCard({ build, onSelect }: { build: BuildMeta; onSelect: (b: BuildMeta) => void }) {
  const [imgIdx, setImgIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (build.images.length > 1) {
      intervalRef.current = setInterval(() => {
        setImgIdx(i => (i + 1) % build.images.length);
      }, 650);
    }
  }, [build.images.length]);

  const handleMouseLeave = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setImgIdx(0);
  }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const handleDownload = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const url = JSON_URL(build);
      const resp = await fetch(url);
      const blob = await resp.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = build.jsonFile;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(`Downloaded ${build.jsonFile}`);
    } catch {
      toast.error("Download failed");
    }
  }, [build]);

  const imgSrc = build.images.length > 0 ? IMG_URL(build, build.images[imgIdx]) : null;

  return (
    <div
      className="bg-zinc-900/60 border border-white/5 hover:border-amber-500/30 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 card-hover-glow group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onSelect(build)}
    >
      {/* Image */}
      <div className="relative w-full aspect-video bg-zinc-950 overflow-hidden">
        {imgSrc ? (
          <img
            key={imgSrc}
            src={imgSrc}
            alt={build.name}
            className="w-full h-full object-cover transition-opacity duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <span className="text-3xl opacity-10">🏗</span>
            <span className="text-[9px] text-zinc-700 uppercase tracking-widest">No preview</span>
          </div>
        )}
        {build.images.length > 1 && (
          <div className="absolute bottom-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {build.images.map((_, i) => (
              <div key={i} className={`w-1 h-1 rounded-full transition-all ${i === imgIdx ? "bg-[var(--accent)]" : "bg-white/30"}`} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-2.5 py-2 flex items-center justify-between gap-1">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-zinc-200 group-hover:text-white transition-colors truncate leading-tight">
            {build.name.replace(/_/g, " ")}
          </p>
          <p className="text-[9px] text-zinc-600 uppercase tracking-wider mt-0.5 truncate">
            {CAT_LABEL[build.category] ?? build.category}
          </p>
        </div>
        <button
          onClick={handleDownload}
          title="Download JSON"
          className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-zinc-600 hover:text-[var(--accent)] hover:bg-amber-500/10 transition-all text-xs font-bold"
        >↓</button>
      </div>
    </div>
  );
}

// ── Build detail panel ────────────────────────────────────────────────────────

function BuildDetail({ build, onClose }: { build: BuildMeta; onClose: () => void }) {
  const [activeImg, setActiveImg] = useState(0);
  const [objCount, setObjCount] = useState<number | null>(null);
  const [topObjects, setTopObjects] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    setActiveImg(0);
    setObjCount(null);
    setTopObjects([]);
    // Fetch + parse JSON to get object count
    fetch(JSON_URL(build))
      .then(r => r.json())
      .then((d: any) => {
        if (d.Objects && Array.isArray(d.Objects)) {
          setObjCount(d.Objects.length);
          const counts: Record<string, number> = {};
          for (const o of d.Objects) {
            const n = o.name ?? "unknown";
            counts[n] = (counts[n] ?? 0) + 1;
          }
          const top = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, count]) => ({ name, count }));
          setTopObjects(top);
        } else if (d.playerLoadouts || d.attachmentSlotItemSets) {
          setObjCount(-1); // loadout
        }
      })
      .catch(() => {});
  }, [build]);

  const handleDownload = async () => {
    try {
      const resp = await fetch(JSON_URL(build));
      const blob = await resp.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = build.jsonFile;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(`Downloaded ${build.jsonFile}`);
    } catch {
      toast.error("Download failed");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in-up"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-[min(900px,92vw)] max-h-[88vh] overflow-y-auto bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
          <div>
            <h2 className="text-sm font-black text-white">{build.name.replace(/_/g, " ")}</h2>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">
              {CAT_LABEL[build.category] ?? build.category}
              {objCount !== null && objCount > 0 && <span className="ml-3 text-amber-400">{objCount.toLocaleString()} objects</span>}
              {objCount === -1 && <span className="ml-3 text-amber-400">Loadout / Config</span>}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl leading-none px-2">×</button>
        </div>

        <div className="flex gap-4 p-5">
          {/* Images column */}
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            {build.images.length > 0 ? (
              <>
                <div className="w-full rounded-xl overflow-hidden bg-zinc-900 border border-white/5">
                  <img
                    key={build.images[activeImg]}
                    src={IMG_URL(build, build.images[activeImg])}
                    alt={build.name}
                    className="w-full object-contain max-h-[380px]"
                  />
                </div>
                {build.images.length > 1 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {build.images.map((img, i) => (
                      <button
                        key={img}
                        onClick={() => setActiveImg(i)}
                        className={`w-14 h-10 rounded-md overflow-hidden border-2 transition-all flex-shrink-0 ${
                          i === activeImg ? "border-[var(--accent)]" : "border-white/10 hover:border-white/30"
                        }`}
                      >
                        <img src={IMG_URL(build, img)} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full aspect-video rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center">
                <span className="text-zinc-700 text-sm">No preview images</span>
              </div>
            )}
          </div>

          {/* Info column */}
          <div className="w-52 flex-shrink-0 flex flex-col gap-3">
            {/* Download buttons */}
            <button
              onClick={handleDownload}
              className="w-full py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-bright)] text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all"
            >
              ↓ Download JSON
            </button>

            {build.extraJsons.length > 0 && (
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Extra files</p>
                {build.extraJsons.map(f => (
                  <button
                    key={f}
                    onClick={async () => {
                      const resp = await fetch(JSON_URL(build, f));
                      const blob = await resp.blob();
                      const a = document.createElement("a");
                      a.href = URL.createObjectURL(blob);
                      a.download = f;
                      a.click();
                    }}
                    className="w-full text-left py-1.5 px-2.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-[10px] rounded-lg border border-white/5 truncate transition-all"
                  >↓ {f}</button>
                ))}
              </div>
            )}

            {/* Top objects */}
            {topObjects.length > 0 && (
              <div>
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">Top objects</p>
                <div className="space-y-1">
                  {topObjects.map(o => (
                    <div key={o.name} className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-400 truncate text-[9px] font-mono">{o.name.split("_").slice(-2).join("_")}</span>
                      <span className="text-amber-400/70 font-bold flex-shrink-0 ml-1">{o.count}×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Image count badge */}
            {build.images.length > 0 && (
              <div className="px-2.5 py-1.5 bg-white/5 rounded-lg text-center">
                <span className="text-[9px] text-zinc-600 uppercase tracking-widest">{build.images.length} preview image{build.images.length > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
