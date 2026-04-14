// ─────────────────────────────────────────────────────────────────────────────
// DANK STUDIO — Main App
// 3-mode layout: Library (generate builds) | Draw (free canvas) | Panel (grid)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import type { Point3D, DrawnWall, DrawnObject, AppMode } from "./lib/types";
import { generate } from "./lib/generators/index";
import { exportGeneratorPoints, exportDrawnWalls, exportDrawnObjects } from "./lib/exporter";
import { ALL_BUILDS, CATEGORIES, type BuildEntry } from "./lib/builds";
import { Preview3D } from "./components/Preview3D";
import { DrawCanvas, type DrawMode } from "./components/DrawCanvas";
import { PanelBuilder, panelStateToPoints, type PanelState } from "./components/PanelBuilder";
import { ObjectPicker } from "./components/ObjectPicker";
import type { DrawCanvasHandle } from "./components/DrawCanvas";

// ── Shared helper: DrawnWall[] → Point3D[] midpoints for 3D preview ──────────
function wallsToPoints(ws: DrawnWall[]): Point3D[] {
  return ws.map(w => ({
    x: (w.x1 + w.x2) / 2, y: 0, z: (w.z1 + w.z2) / 2,
    yaw: Math.atan2(w.x2 - w.x1, w.z2 - w.z1) * 180 / Math.PI + 90,
    name: w.classname,
  }));
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode] = useState<AppMode>("library");

  // ── Library state ─────────────────────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedBuild, setSelectedBuild] = useState<BuildEntry | null>(null);
  const [params, setParams] = useState<Record<string, number>>({});
  const [points, setPoints] = useState<Point3D[]>([]);
  const [code, setCode] = useState("");
  const [originX, setOriginX] = useState(0);
  const [originY, setOriginY] = useState(0);
  const [originZ, setOriginZ] = useState(0);

  // ── Draw state ────────────────────────────────────────────────────────────
  const [walls, setWalls]     = useState<DrawnWall[]>([]);
  const [objects, setObjects] = useState<DrawnObject[]>([]);
  const [drawMode, setDrawMode] = useState<DrawMode>("wall");
  const [wallClass, setWallClass]     = useState("staticobj_castle_wall3");
  const [objectClass, setObjectClass] = useState("staticobj_castle_wall3");
  const [showWallPicker,   setShowWallPicker]   = useState(false);
  const [showObjectPicker, setShowObjectPicker] = useState(false);
  const drawCanvasRef = useRef<DrawCanvasHandle>(null);

  // ── Panel state ───────────────────────────────────────────────────────────
  const [panelState, setPanelState] = useState<PanelState>({
    floors:     new Set(),
    walls:      new Set(),
    wallClass:  "staticobj_castle_wall3",
    floorClass: "staticobj_platform1_block",
  });

  // ── Search ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");

  // ── Origin auto-regenerate: re-export code when origin changes ────────────
  useEffect(() => {
    if (!selectedBuild || !points.length) return;
    setCode(exportGeneratorPoints(points, { label: selectedBuild.label, originX, originY, originZ }));
  }, [originX, originY, originZ]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Library: select + generate ────────────────────────────────────────────
  function selectBuild(build: BuildEntry) {
    setSelectedBuild(build);
    const p = { ...build.defaultParams };
    setParams(p);
    const pts = generate(build.key, p);
    setPoints(pts);
    setCode(exportGeneratorPoints(pts, { label: build.label, originX, originY, originZ }));
  }

  function handleGenerate(overrideParams?: Record<string, number>) {
    if (!selectedBuild) return;
    const p = overrideParams ?? params;
    const pts = generate(selectedBuild.key, p);
    setPoints(pts);
    setCode(exportGeneratorPoints(pts, { label: selectedBuild.label, originX, originY, originZ }));
  }

  const [copied, setCopied] = useState(false);
  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleDownloadJSON() {
    if (!points.length) return;
    const label = selectedBuild?.label ?? "build";
    const ox = originX, oy = originY, oz = originZ;
    const payload = {
      label,
      objectCount: points.length,
      Objects: points.map(p => ({
        name:  p.name ?? "staticobj_castle_wall3",
        pos:   [+(ox + p.x).toFixed(3), +(oy + p.y).toFixed(3), +(oz + p.z).toFixed(3)],
        ypr:   [+(p.yaw ?? 0).toFixed(3), +(p.pitch ?? 0).toFixed(3), +(p.roll ?? 0).toFixed(3)],
        scale: +(p.scale ?? 1).toFixed(4),
        enableCEPersistency: 0,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${label.replace(/\s+/g, "_").toLowerCase()}_${points.length}obj.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Draw: CRUD ────────────────────────────────────────────────────────────
  const addWall = useCallback((w: Omit<DrawnWall, "id">) =>
    setWalls(prev => [...prev, { ...w, id: Math.random().toString(36).slice(2) }]), []);
  const addObject = useCallback((o: Omit<DrawnObject, "id">) =>
    setObjects(prev => [...prev, { ...o, id: Math.random().toString(36).slice(2) }]), []);
  const removeWall = useCallback((id: string) =>
    setWalls(prev => prev.filter(w => w.id !== id)), []);
  const removeObject = useCallback((id: string) =>
    setObjects(prev => prev.filter(o => o.id !== id)), []);
  const replaceWall = useCallback((id: string, cls: string) =>
    setWalls(prev => prev.map(w => w.id === id ? { ...w, classname: cls } : w)), []);
  const replaceObject = useCallback((id: string, cls: string) =>
    setObjects(prev => prev.map(o => o.id === id ? { ...o, classname: cls } : o)), []);

  function applyExport(ws: DrawnWall[], os: DrawnObject[]) {
    const wallCode = exportDrawnWalls(ws,  { originX, originY, originZ });
    const objCode  = exportDrawnObjects(os, { originX, originY, originZ });
    setCode([wallCode, objCode].filter(s => s.trim().length > 20).join("\n\n"));
    setPoints([
      ...wallsToPoints(ws),
      ...os.map(o => ({ x: o.x, y: o.y, z: o.z, yaw: o.yaw, name: o.classname })),
    ]);
  }

  function exportDraw() {
    applyExport(walls, objects);
  }

  // ── Panel: export ─────────────────────────────────────────────────────────
  function handlePanelExport(state: PanelState) {
    const { walls: pw, objects: po } = panelStateToPoints(state);
    setWalls(pw);
    setObjects(po);
    applyExport(pw, po);
    setMode("library");
  }

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
      (b.description ?? "").toLowerCase().includes(q),
    );
  }, [selectedCategory, search]);

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-200 overflow-hidden select-none">

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-0 px-3 border-b border-zinc-800 h-10 flex-shrink-0">
        <span className="text-sm font-bold text-indigo-400 tracking-widest mr-4">DANK STUDIO</span>

        {(["library", "draw", "panel"] as AppMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 h-full text-xs font-semibold uppercase tracking-wide border-b-2 transition-colors ${
              mode === m
                ? "border-indigo-500 text-indigo-300"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {m === "library" ? "Build Library" : m === "draw" ? "Free Draw" : "Panel Builder"}
          </button>
        ))}

        <div className="flex-1" />

        <span className="text-xs text-zinc-600 mr-2">Origin:</span>
        {(["X","Y","Z"] as const).map((axis, i) => {
          const val  = [originX, originY, originZ][i];
          const setV = [setOriginX, setOriginY, setOriginZ][i];
          return (
            <label key={axis} className="flex items-center gap-1 mr-2">
              <span className="text-xs text-zinc-500">{axis}</span>
              <input
                type="number"
                value={val}
                onChange={e => setV(Number(e.target.value))}
                className="w-20 bg-zinc-800 text-zinc-300 text-xs rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
          );
        })}
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar ─────────────────────────────────────────────── */}
        <aside className="w-60 flex-shrink-0 border-r border-zinc-800 flex flex-col overflow-hidden">

          {mode === "library" && (
            <>
              <div className="flex flex-wrap gap-1 p-2 border-b border-zinc-800">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setSearch(""); }}
                    className={`text-xs px-2 py-0.5 rounded ${
                      selectedCategory === cat
                        ? "bg-indigo-700 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    }`}
                  >{cat}</button>
                ))}
              </div>

              <div className="px-2 py-1.5 border-b border-zinc-800">
                <input
                  type="text"
                  placeholder="Search builds…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-zinc-800 text-zinc-300 text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500 placeholder-zinc-600"
                />
              </div>

              <div className="flex-1 overflow-y-auto py-1">
                {selectedCategory === "All" && !search.trim()
                  ? CATEGORIES.slice(1).map(cat => {
                      const catBuilds = ALL_BUILDS.filter(b => b.category === cat);
                      return (
                        <div key={cat}>
                          <div className="px-3 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">{cat}</div>
                          {catBuilds.map(build => (
                            <button
                              key={build.key}
                              onClick={() => selectBuild(build)}
                              className={`w-full text-left px-3 py-1.5 hover:bg-zinc-800 transition-colors ${
                                selectedBuild?.key === build.key ? "bg-zinc-800/80 text-indigo-300" : "text-zinc-300"
                              }`}
                            >
                              <span className="block text-sm">{build.label}</span>
                              {build.description && (
                                <span className="block text-xs text-zinc-600 truncate">{build.description}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      );
                    })
                  : categoryBuilds.map(build => (
                      <button
                        key={build.key}
                        onClick={() => selectBuild(build)}
                        className={`w-full text-left px-3 py-2 hover:bg-zinc-800 transition-colors ${
                          selectedBuild?.key === build.key ? "bg-zinc-800/80 text-indigo-300" : "text-zinc-300"
                        }`}
                      >
                        <span className="block text-sm">{build.label}</span>
                        {build.description && (
                          <span className="block text-xs text-zinc-600 truncate">{build.description}</span>
                        )}
                      </button>
                    ))
                }
              </div>
            </>
          )}

          {mode === "draw" && (
            <div className="p-3 flex flex-col gap-3 flex-1 overflow-y-auto">
              <div>
                <p className="text-xs text-zinc-500 mb-1.5 font-semibold uppercase tracking-wide">Draw Tool</p>
                {(["wall", "place", "select"] as DrawMode[]).map(dm => (
                  <button
                    key={dm}
                    onClick={() => setDrawMode(dm)}
                    className={`w-full text-left text-xs px-2 py-1.5 rounded mb-1 ${
                      drawMode === dm ? "bg-indigo-700 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    {dm === "wall" ? "Draw Wall" : dm === "place" ? "Place Object" : "Select / Replace"}
                  </button>
                ))}
              </div>

              {drawMode === "wall" && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1 font-semibold uppercase tracking-wide">Wall Type</p>
                  <button
                    onClick={() => setShowWallPicker(true)}
                    className="w-full text-left text-xs px-2 py-1.5 bg-zinc-800 rounded text-zinc-300 hover:bg-zinc-700 truncate"
                  >{wallClass}</button>
                </div>
              )}

              {drawMode === "place" && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1 font-semibold uppercase tracking-wide">Object</p>
                  <button
                    onClick={() => setShowObjectPicker(true)}
                    className="w-full text-left text-xs px-2 py-1.5 bg-zinc-800 rounded text-zinc-300 hover:bg-zinc-700 truncate"
                  >{objectClass}</button>
                </div>
              )}

              <div className="flex-1" />

              <button
                onClick={exportDraw}
                className="w-full text-xs px-2 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded font-semibold"
              >Export & Preview 3D</button>

              <button
                onClick={() => { setWalls([]); setObjects([]); setPoints([]); setCode(""); }}
                className="w-full text-xs px-2 py-1.5 bg-zinc-800 hover:bg-red-900/40 text-red-400 rounded"
              >Clear All</button>

              <p className="text-xs text-zinc-600">
                {walls.length} walls · {objects.length} objects
              </p>
            </div>
          )}

          {mode === "panel" && (
            <div className="p-3 text-xs text-zinc-500 flex flex-col gap-2">
              <p className="font-semibold text-zinc-300 uppercase text-xs tracking-wide">How to use</p>
              <p className="leading-relaxed"><span className="text-zinc-400">Floor tool</span> — click cells to paint floor tiles.</p>
              <p className="leading-relaxed"><span className="text-zinc-400">Wall tool</span> — click edges between cells to place walls.</p>
              <p className="leading-relaxed">Hit <span className="text-zinc-400">Export</span> in the toolbar to convert to DayZ code and see in 3D.</p>
              <p className="text-zinc-600 mt-2">Each cell = 4m × 4m</p>
            </div>
          )}
        </aside>

        {/* ── Centre ────────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {mode === "library" && selectedBuild && selectedBuild.params.length > 0 && (
            <div className="flex items-center gap-4 px-4 py-2 border-b border-zinc-800 flex-shrink-0 overflow-x-auto">
              {selectedBuild.params.map(pd => {
                const val = params[pd.key] ?? pd.default;
                const clamp = (v: number) => Math.max(pd.min, Math.min(pd.max, Math.round(v / pd.step) * pd.step));
                const applyVal = (newVal: number) => {
                  const clamped = clamp(newVal);
                  const newParams = { ...params, [pd.key]: clamped };
                  setParams(newParams);
                  handleGenerate(newParams);
                };
                return (
                  <div key={pd.key} className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs text-zinc-400 whitespace-nowrap">{pd.label}</span>
                    <button
                      onClick={() => applyVal(val - pd.step)}
                      className="w-5 h-5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded text-xs font-bold flex items-center justify-center"
                    >−</button>
                    <input
                      type="range"
                      min={pd.min} max={pd.max} step={pd.step}
                      value={val}
                      onChange={e => setParams(p => ({ ...p, [pd.key]: Number(e.target.value) }))}
                      onMouseUp={() => handleGenerate()}
                      onTouchEnd={() => handleGenerate()}
                      className="w-28 accent-indigo-500"
                    />
                    <button
                      onClick={() => applyVal(val + pd.step)}
                      className="w-5 h-5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded text-xs font-bold flex items-center justify-center"
                    >+</button>
                    <span className="text-xs text-zinc-300 w-8 text-right tabular-nums">{val}</span>
                    <button
                      onClick={() => applyVal(pd.default)}
                      className="text-xs px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 rounded"
                      title="Reset to default"
                    >↺</button>
                  </div>
                );
              })}
              <button
                onClick={() => handleGenerate()}
                className="text-xs px-3 py-1 bg-indigo-700 hover:bg-indigo-600 text-white rounded font-semibold flex-shrink-0"
              >Generate</button>
            </div>
          )}

          {mode === "library" && (
            <div className="flex-1 overflow-hidden">
              <Preview3D points={points} />
            </div>
          )}

          {mode === "draw" && (
            <div className="flex-1 overflow-hidden">
              <DrawCanvas
                ref={drawCanvasRef}
                walls={walls}
                objects={objects}
                onAddWall={addWall}
                onAddObject={addObject}
                onRemoveWall={removeWall}
                onRemoveObject={removeObject}
                onReplaceWall={replaceWall}
                onReplaceObject={replaceObject}
                mode={drawMode}
                wallClass={wallClass}
                objectClass={objectClass}
              />
            </div>
          )}

          {mode === "panel" && (
            <div className="flex-1 overflow-hidden">
              <PanelBuilder
                state={panelState}
                onChange={setPanelState}
                onExport={handlePanelExport}
              />
            </div>
          )}
        </main>

        {/* ── Right — code output ───────────────────────────────────────── */}
        <aside className="w-80 flex-shrink-0 border-l border-zinc-800 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 flex-shrink-0">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">DayZ Export</span>
            <div className="flex gap-1">
              {mode === "draw" && (
                <button
                  onClick={exportDraw}
                  className="text-xs px-2 py-0.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded"
                >Export</button>
              )}
              {code && (
                <>
                  <button
                    onClick={() => handleCopy(code)}
                    className="text-xs px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    onClick={handleDownloadJSON}
                    className="text-xs px-2 py-0.5 bg-green-800 hover:bg-green-700 text-white rounded"
                    title="Download DayZ Object Builder JSON"
                  >JSON</button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {code ? (
              <pre className="text-xs text-zinc-400 font-mono whitespace-pre-wrap leading-5 break-all">
                {code}
              </pre>
            ) : (
              <p className="text-xs text-zinc-600 mt-6 text-center px-4">
                Select a build or export your drawing to see DayZ spawn code here.
              </p>
            )}
          </div>

          {code && (
            <div className="px-3 py-1.5 border-t border-zinc-800 text-xs text-zinc-600 flex-shrink-0">
              {spawnCount.toLocaleString()} SpawnObject() calls
            </div>
          )}
        </aside>
      </div>

      {/* ── Object pickers ─────────────────────────────────────────────── */}
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
