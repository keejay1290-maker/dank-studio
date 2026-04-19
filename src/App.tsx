import { useState, useMemo, useEffect, useCallback } from "react";
import { Preview3D } from "./components/Preview3D";
import { ObjectPicker } from "./components/ObjectPicker";
import { ALL_BUILDS, CATEGORIES } from "./lib/builds";
import {
  exportCombinedDraw,
  wallsToPoints,
  generate
} from "./lib/generators";
import type { Point3D, DrawnWall, DrawnObject, BuildEntry } from "./lib/types";
import "./App.css";

type AppMode = "library" | "draw" | "panel";
type DrawMode = "wall" | "place" | "select";

function App() {
  const [mode, setMode] = useState<AppMode>("library");
  const [selectedBuild, setSelectedBuild] = useState<BuildEntry | null>(null);
  const [params, setParams] = useState<Record<string, number>>({});
  const [points, setPoints] = useState<Point3D[]>([]);
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [manualPoints, setManualPoints] = useState<Point3D[]>([]);
  const [nodeOverrides, setNodeOverrides] = useState<Record<string, string>>({});

  // Container mode — replace wall panels with stacked land_container_1bo
  const [containerMode, setContainerMode] = useState(false);

  // Origin shift
  const [originX, setOriginX] = useState(0);
  const [originY, setOriginY] = useState(0);
  const [originZ, setOriginZ] = useState(0);

  // Free draw state
  const [walls, setWalls] = useState<DrawnWall[]>([]);
  const [objects, setObjects] = useState<DrawnObject[]>([]);
  const [drawMode, setDrawMode] = useState<DrawMode>("wall");
  const [wallClass, setWallClass] = useState("staticobj_castle_wall3");
  const [objectClass, setObjectClass] = useState("barrel_blue");
  const [showWallPicker, setShowWallPicker] = useState(false);
  const [showObjectPicker, setShowObjectPicker] = useState(false);

  // ── Library: handle selection ───────────────────────────────────────────
  function selectBuild(build: BuildEntry) {
    setSelectedBuild(build);
    const initialParams: Record<string, number> = {};
    build.params.forEach(p => initialParams[p.key] = p.default);
    setParams(initialParams);

    const pts = generate(build.key, { ...initialParams, container_mode: containerMode ? 1 : 0 });
    setPoints(pts);
    updateCode(pts);
  }

  // ── Generate from current params ────────────────────────────────────────
  function handleGenerate(overrideParams?: Record<string, number>) {
    if (!selectedBuild) return;
    const p = { ...(overrideParams || params), container_mode: containerMode ? 1 : 0 };

    // Generate base points
    const basePoints = generate(selectedBuild.key, p);
    
    // Sanitize and ID base points
    const sanitizedBase = basePoints.map((pt, i) => {
      const id = `auto-${i}`;
      return {
        ...pt,
        id,
        name: nodeOverrides[id] || pt.name || "staticobj_castle_wall3",
        x: isNaN(pt.x) ? 0 : pt.x,
        y: isNaN(pt.y) ? 0 : pt.y,
        z: isNaN(pt.z) ? 0 : pt.z,
        pitch: pt.pitch || 0,
        yaw: pt.yaw || 0,
        roll: pt.roll || 0
      } as Point3D;
    });

    const finalPoints = [...sanitizedBase, ...manualPoints];
    setPoints(finalPoints);
    updateCode(finalPoints);
  }

  function ptsToEditorJSON(pts: Point3D[]): string {
    return JSON.stringify({
      Objects: pts.map(pt => ({
        name:  pt.name ?? "staticobj_castle_wall3",
        pos:   [
          Math.round((pt.x + originX) * 1000) / 1000,
          Math.round((pt.y + originY) * 1000) / 1000,
          Math.round((pt.z + originZ) * 1000) / 1000,
        ],
        ypr:   [pt.yaw ?? 0, pt.pitch ?? 0, pt.roll ?? 0],
        scale: pt.scale ?? 1,
      })),
    }, null, 4);
  }

  function updateCode(pts: Point3D[]) {
    setCode(ptsToEditorJSON(pts));
  }

  // Update code when origin changes
  useEffect(() => {
    if (points.length > 0) {
      setCode(ptsToEditorJSON(points));
    }
  }, [originX, originY, originZ, points]);

  // ── Utils ───────────────────────────────────────────────────────────────
  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadJSON() {
    const data = {
      Objects: points.map(p => ({
        name:  p.name ?? "staticobj_castle_wall3",
        pos:   [
          Math.round((p.x + originX) * 1000) / 1000,
          Math.round((p.y + originY) * 1000) / 1000,
          Math.round((p.z + originZ) * 1000) / 1000,
        ],
        ypr:   [p.yaw ?? 0, p.pitch ?? 0, p.roll ?? 0],
        scale: p.scale ?? 1,
      }))
    };
    const blob = new Blob([JSON.stringify(data, null, 4)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dank_masterpiece_${selectedBuild?.key || "custom"}.json`;
    a.click();
  }

  // ── Free Draw: internal state management ──────────────────────────────────
  function applyExport(ws: DrawnWall[], os: DrawnObject[]) {
    const combined = exportCombinedDraw(ws, os, { originX, originY, originZ });
    setCode(combined);
    setPoints([
      ...wallsToPoints(ws),
      ...os.map(o => ({ x: o.x, y: o.y, z: o.z, yaw: o.yaw, name: o.classname, id: o.id } as Point3D)),
    ]);
  }

  function exportDraw() { applyExport(walls, objects); }

  const handlePlacePoint = (pos: [number, number, number]) => {
    const newPt: Point3D = {
      id: `manual-${Date.now()}`,
      x: pos[0], y: pos[1], z: pos[2],
      name: objectClass === "barrel_black" ? "barrel_blue" : objectClass,
      yaw: 0, scale: 1
    };
    setManualPoints(prev => [...prev, newPt]);
    setPoints(pts => [...pts, newPt]);
  };

  const handleSelectObject = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const updateSelectedClass = (name: string) => {
    if (!selectedId) return;
    if (selectedId.startsWith("manual-")) {
      setManualPoints(prev => prev.map(p => p.id === selectedId ? { ...p, name } : p));
    } else {
      setNodeOverrides(prev => ({ ...prev, [selectedId]: name }));
    }
    setPoints(pts => pts.map(p => p.id === selectedId ? { ...p, name } : p));
  };

  const spawnCount = useMemo(() => (code.match(/SpawnObject/g) ?? []).length, [code]);
  
  const categoryBuilds = useMemo(() => {
    const base = selectedCategory === "All"
      ? ALL_BUILDS
      : ALL_BUILDS.filter(b => b.category === selectedCategory);
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter(b =>
      b.label.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      (b.description ?? "").toLowerCase().includes(q)
    );
  }, [selectedCategory, search]);

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-200 overflow-hidden select-none">

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-0 px-4 glass h-12 flex-shrink-0 z-20">
        <span className="text-sm font-black text-white tracking-[0.2em] mr-8">DANK STUDIO</span>

        {(["library", "draw", "panel"] as AppMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 h-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 relative ${
              mode === m
                ? "text-indigo-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {m === "library" ? "Library" : m === "draw" ? "Free Draw" : "Panel Builder"}
            {mode === m && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_8px_var(--accent)]" />
            )}
          </button>
        ))}

        <div className="flex-1" />

        <div className="flex items-center gap-3 glass-hover px-3 py-1 rounded-full border border-white/5">
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">Origin</span>
          {(["X","Y","Z"] as const).map((axis, i) => {
            const val  = [originX, originY, originZ][i];
            const setV = [setOriginX, setOriginY, setOriginZ][i];
            return (
              <label key={axis} className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-500 font-bold">{axis}</span>
                <input
                  type="number"
                  value={val}
                  onChange={e => setV(Number(e.target.value))}
                  className="w-14 bg-transparent text-zinc-300 text-xs outline-none font-mono focus:text-indigo-400"
                />
              </label>
            );
          })}
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Left sidebar ─────────────────────────────────────────────── */}
        <aside className="w-72 flex-shrink-0 glass border-r-0 flex flex-col overflow-hidden m-2 rounded-xl z-10 shadow-2xl">

          {mode === "library" && (
            <>
              <div className="flex flex-wrap gap-1 p-3 border-b border-white/5 bg-white/5">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setSearch(""); }}
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md transition-all ${
                      selectedCategory === cat
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40"
                        : "bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300"
                    }`}
                  >{cat}</button>
                ))}
              </div>

              <div className="px-3 py-2 border-b border-white/5">
                <input
                  type="text"
                  placeholder="SEARCH CATALOGUE..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-black/20 text-indigo-100 text-[10px] font-bold uppercase tracking-widest rounded-lg px-3 py-2 outline-none border border-white/5 focus:border-indigo-500/50 transition-colors placeholder-zinc-700"
                />
              </div>

              <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                {selectedCategory === "All" && !search.trim()
                  ? CATEGORIES.slice(1).map(cat => {
                      const catBuilds = ALL_BUILDS.filter(b => b.category === cat);
                      return (
                        <div key={cat} className="mb-4">
                          <div className="px-4 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 border-l-2 border-indigo-900/30 ml-1">{cat}</div>
                          <div className="mt-1">
                            {catBuilds.map(build => (
                              <button
                                key={build.key}
                                onClick={() => selectBuild(build)}
                                className={`w-full text-left px-5 py-2.5 transition-all group ${
                                  selectedBuild?.key === build.key 
                                    ? "bg-indigo-600/10 border-r-4 border-indigo-500" 
                                    : "hover:bg-white/5"
                                }`}
                              >
                                <span className={`block text-xs font-semibold ${selectedBuild?.key === build.key ? "text-indigo-300" : "text-zinc-300 group-hover:text-white"}`}>
                                  {build.label}
                                </span>
                                {build.description && (
                                  <span className="block text-[10px] text-zinc-600 truncate group-hover:text-zinc-500">{build.description}</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  : (
                    <div className="mt-2">
                      {categoryBuilds.map(build => (
                        <button
                          key={build.key}
                          onClick={() => selectBuild(build)}
                          className={`w-full text-left px-5 py-2.5 transition-all group ${
                            selectedBuild?.key === build.key 
                              ? "bg-indigo-600/10 border-r-4 border-indigo-500" 
                              : "hover:bg-white/5"
                          }`}
                        >
                          <span className={`block text-xs font-semibold ${selectedBuild?.key === build.key ? "text-indigo-300" : "text-zinc-300 group-hover:text-white"}`}>
                            {build.label}
                          </span>
                          {build.description && (
                            <span className="block text-[10px] text-zinc-600 truncate group-hover:text-zinc-500">{build.description}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )
                }
              </div>
            </>
          )}

          {mode === "draw" && (
            <div className="p-4 flex flex-col gap-4 flex-1 overflow-y-auto">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Drawing Tools</p>
              {(["wall", "place", "select"] as DrawMode[]).map(dm => (
                <button
                  key={dm}
                  onClick={() => setDrawMode(dm)}
                  className={`w-full text-left text-[11px] font-bold uppercase tracking-wider px-3 py-2.5 rounded-lg mb-0.5 transition-all ${
                    drawMode === dm ? "bg-indigo-600 text-white shadow-lg" : "bg-white/5 text-zinc-400 hover:bg-white/10"
                  }`}
                >
                  {dm === "wall" ? "Draw Wall Line" : dm === "place" ? "Place Single Object" : "Select & Replace"}
                </button>
              ))}
              <div className="flex-1" />
              <button
                onClick={exportDraw}
                className="w-full text-xs font-black uppercase tracking-widest py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xl transition-all"
              >Export To Preview</button>
              <button
                onClick={() => { setWalls([]); setObjects([]); setPoints([]); setCode(""); }}
                className="w-full text-[10px] font-bold uppercase tracking-widest py-2 text-red-500/60 hover:text-red-400"
              >Clear All</button>
            </div>
          )}
        </aside>

        {/* ── Centre ────────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {mode === "library" && selectedBuild && selectedBuild.params.length > 0 && (
            <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-6 px-6 py-3 glass rounded-2xl pointer-events-auto shadow-2xl">
                {selectedBuild.params.map(pd => {
                  const val = params[pd.key] ?? pd.default;
                  return (
                    <div key={pd.key} className="flex flex-col gap-1 w-32">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{pd.label}</span>
                        <span className="text-[10px] font-bold text-indigo-400 font-mono">{val}</span>
                      </div>
                      <input
                        type="range"
                        min={pd.min} max={pd.max} step={pd.step}
                        value={val}
                        onChange={e => setParams(p => ({ ...p, [pd.key]: Number(e.target.value) }))}
                        onMouseUp={() => handleGenerate()}
                        className="w-full"
                      />
                    </div>
                  );
                })}
                <div className="w-px h-8 bg-white/10 mx-2" />
                <button
                  onClick={() => {
                    const next = !containerMode;
                    setContainerMode(next);
                    if (selectedBuild) {
                      const p = { ...params, container_mode: next ? 1 : 0 };
                      const basePoints = generate(selectedBuild.key, p);
                      const sanitized = basePoints.map((pt, i) => ({ ...pt, id: `auto-${i}`, name: pt.name ?? "staticobj_castle_wall3", x: isNaN(pt.x) ? 0 : pt.x, y: isNaN(pt.y) ? 0 : pt.y, z: isNaN(pt.z) ? 0 : pt.z, pitch: pt.pitch || 0, yaw: pt.yaw || 0, roll: pt.roll || 0 } as Point3D));
                      const final = [...sanitized, ...manualPoints];
                      setPoints(final);
                      updateCode(final);
                    }
                  }}
                  className={`px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg transition-all border ${
                    containerMode
                      ? "bg-amber-600 hover:bg-amber-500 text-white border-amber-400/50"
                      : "bg-white/5 hover:bg-white/10 text-zinc-400 border-white/10"
                  }`}
                >📦 Containers</button>
                <button
                  onClick={() => handleGenerate()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg transition-all"
                >Re-Gen</button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-hidden rounded-3xl m-2 bg-black shadow-inner relative group">
            <Preview3D 
              points={points} 
              onPlacePoint={handlePlacePoint} 
              selectedId={selectedId || undefined} 
              onSelect={handleSelectObject} 
            />
            
            {/* ── Selection HUD ─────────────────────────────────────────── */}
            {selectedId && (
              <div className="absolute top-4 right-4 z-40 animate-in">
                <div className="glass p-5 rounded-2xl w-64 shadow-2xl border-indigo-500/30">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Active Selection</span>
                    <button onClick={() => setSelectedId(null)} className="text-zinc-600 hover:text-white transition-colors">✕</button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1.5 ml-1">Classname</label>
                      <input 
                        type="text"
                        value={points.find(p => p.id === selectedId)?.name || ""}
                        onChange={(e) => updateSelectedClass(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                       <button 
                        onClick={() => {
                          setManualPoints(prev => prev.filter(p => p.id !== selectedId));
                          setPoints(pts => pts.filter(p => p.id !== selectedId));
                          setSelectedId(null);
                        }}
                        className="col-span-2 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                       >Delete Node</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* ── Instruction Overlay ───────────────────────────────────── */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 glass rounded-full text-[10px] font-bold text-zinc-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <span className="text-indigo-400">Shift + Click</span> to Place • <span className="text-indigo-400">Click</span> to Select
            </div>
          </div>
        </main>

        {/* ── Right sidebar ─────────────────────────────────────────────── */}
        <aside className="w-80 flex-shrink-0 glass flex flex-col overflow-hidden m-2 rounded-xl z-10 shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Live Export</span>
            {code && (
              <button
                onClick={() => handleCopy(code)}
                className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-md transition-all"
              >{copied ? "COPIED" : "COPY CODE"}</button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/40">
            {code ? (
              <pre className="text-[10px] text-indigo-100/60 font-mono whitespace-pre-wrap leading-relaxed break-all">
                {code}
              </pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-8">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center mb-4 text-zinc-800 text-lg">?</div>
                <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest leading-relaxed">
                  Generate a build to view Init.c / JSON data
                </p>
              </div>
            )}
          </div>

          {code && (
            <div className="p-4 border-t border-white/5 flex flex-col gap-3 bg-white/5">
              <div className="flex justify-between items-center px-1">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Efficiency</span>
                <span className="text-[10px] font-bold text-zinc-400 font-mono">{spawnCount} Objects</span>
              </div>
              <button
                onClick={handleDownloadJSON}
                className="w-full py-2.5 bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white border border-green-500/30 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] transition-all"
              >Download Masterpiece JSON</button>
            </div>
          )}
        </aside>
      </div>

      {showWallPicker && (
        <ObjectPicker
          current={wallClass}
          onSelect={c => { setWallClass(c); setShowWallPicker(false); }}
          onClose={() => setShowWallPicker(false)}
        />
      )}
      {showObjectPicker && (
        <ObjectPicker
          current={objectClass}
          onSelect={c => { setObjectClass(c); setShowObjectPicker(false); }}
          onClose={() => setShowObjectPicker(false)}
        />
      )}
    </div>
  );
}

export default App;
