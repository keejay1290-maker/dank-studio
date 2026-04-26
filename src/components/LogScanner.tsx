import { useState, useMemo, useEffect } from "react";
import { toast } from "./Toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LogFile {
  name: string;
  size: number;
  mtime: string;
}

interface LogEvent {
  id: string;
  time: string;
  type: "Combat" | "Vehicle" | "Build" | "System" | "Chat" | "Movement";
  player?: string;
  playerId?: string;
  pos?: string;
  message: string;
  details?: string;
  raw: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LogScanner() {
  const [files, setFiles] = useState<LogFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<string[]>(["Combat", "Vehicle", "Build", "System", "Chat", "Movement"]);

  useEffect(() => {
    fetch("/log-api/scan")
      .then(r => r.json())
      .then(data => setFiles(data.files))
      .catch(() => toast.error("Failed to scan Downloads folder"));
  }, []);

  const handleScanFile = async (fileName: string) => {
    setLoading(true);
    setSelectedFile(fileName);
    try {
      const resp = await fetch(`/log-api/read/${encodeURIComponent(fileName)}`);
      const text = await resp.text();
      const parsed = parseLog(text);
      setEvents(parsed);
      toast.success(`Analyzed ${parsed.length} events from ${fileName}`);
    } catch {
      toast.error("Failed to read log file");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setSelectedFile(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseLog(text);
      setEvents(parsed);
      toast.success(`Successfully uploaded and analyzed ${file.name}`);
      setLoading(false);
    };
    reader.onerror = () => {
      toast.error("Failed to read uploaded file");
      setLoading(false);
    };
    reader.readAsText(file);
  };

  const handleRadiusSearch = (targetPos: string, targetTime: string) => {
    const coords = targetPos.split(", ").map(Number);
    if (coords.length < 2) return;
    const tx = coords[0];
    const ty = coords.length === 3 ? coords[1] : 0;
    const tz = coords.length === 3 ? coords[2] : coords[1];

    const [th, tm] = targetTime.split(":").map(Number);
    const targetTotalSec = th * 3600 + tm * 60;
    
    // Filter events within 15 minutes and 500m
    const nearby = events.filter(e => {
      if (!e.pos) return false;
      const ec = e.pos.split(", ").map(Number);
      const ex = ec[0];
      const ez = ec.length === 3 ? ec[2] : ec[1];
      
      const [eh, em] = e.time.split(":").map(Number);
      const eTotalSec = eh * 3600 + em * 60;
      
      const dist = Math.sqrt(Math.pow(ex - tx, 2) + Math.pow(ez - tz, 2));
      const timeDiff = Math.abs(eTotalSec - targetTotalSec);
      
      return dist < 800 && timeDiff < 1200; // 800m and 20 mins
    });
    
    setEvents(nearby);
    setSearch("");
    toast.success(`Nearby Search: Found ${nearby.length} events within 800m`);
  };

  const resetLog = () => {
    if (selectedFile) handleScanFile(selectedFile);
    else { setEvents([]); setSelectedFile(null); }
    setSearch("");
    toast.info("Investigation reset to full log");
  };

  const filteredEvents = useMemo(() => {
    let result = events.filter(e => filters.includes(e.type));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e => 
        e.player?.toLowerCase().includes(q) || 
        e.playerId?.toLowerCase().includes(q) || 
        e.message.toLowerCase().includes(q)
      );
    }
    return result;
  }, [events, search, filters]);

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-xl border border-white/5 m-2 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/2">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-sm font-black text-amber-400 uppercase tracking-[0.3em]">Log Forensic Scanner</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Analyzing RPT/ADM evidence for server incidents</p>
          </div>
          {events.length > 0 && (
            <button 
              onClick={resetLog}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-[9px] font-black uppercase text-zinc-400 hover:text-white transition-all"
            >
              🔄 Reset Investigation
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center justify-center h-10 px-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-500 text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all gap-2">
            📂 Upload Evidence
            <input type="file" className="hidden" accept=".adm,.rpt,.log" onChange={handleUpload} />
          </label>
          <input 
            type="text" 
            placeholder="Search Player / Steam64ID / Action..."
            className="h-10 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-xs text-amber-100 w-80 focus:border-amber-500/50 outline-none transition-all font-medium"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Files & Players */}
        <div className="w-72 border-r border-white/5 flex flex-col overflow-hidden bg-black/20">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4 border-b border-white/5 text-[9px] font-black text-zinc-600 uppercase tracking-widest bg-white/2">Evidence Files</div>
            {files.slice(0, 5).map(f => (
              <button
                key={f.name}
                onClick={() => handleScanFile(f.name)}
                className={`w-full text-left px-4 py-3 border-b border-white/5 transition-all text-xs flex flex-col gap-1 ${
                  selectedFile === f.name ? "bg-amber-500/10 border-l-2 border-amber-500" : "hover:bg-white/5"
                }`}
              >
                <span className={`font-bold truncate ${selectedFile === f.name ? "text-amber-100" : "text-zinc-500"}`}>
                  {f.name}
                </span>
                <div className="flex items-center justify-between opacity-40 text-[9px]">
                  <span>{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                  <span>{new Date(f.mtime).toLocaleTimeString()}</span>
                </div>
              </button>
            ))}

            {events.length > 0 && (
              <>
                <div className="p-4 border-b border-white/5 text-[9px] font-black text-zinc-600 uppercase tracking-widest bg-white/2 mt-4">Identified Subjects</div>
                {[...new Set(events.filter(e => e.player).map(e => e.player!))].sort().map(p => {
                  const pEvents = events.filter(e => e.player === p);
                  const lastPos = [...pEvents].reverse().find(e => e.pos)?.pos;
                  return (
                    <button
                      key={p}
                      onClick={() => setSearch(p)}
                      className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-all text-xs flex flex-col gap-1 ${search === p ? "bg-indigo-500/10 border-l-2 border-indigo-500" : ""}`}
                    >
                      <span className="font-bold text-zinc-300">{p}</span>
                      <div className="flex items-center justify-between opacity-50 text-[9px]">
                        <span className="text-amber-500">{pEvents.length} actions</span>
                        <span className="truncate max-w-[100px]">{lastPos || "Unknown Pos"}</span>
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Content: Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden relative bg-zinc-950/20">
          {loading && (
            <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
              <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin shadow-[0_0_20px_rgba(245,158,11,0.2)]" />
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] animate-pulse">Processing Digital Forensics...</p>
            </div>
          )}

          {selectedFile && (
            <div className="px-6 py-3 bg-indigo-500/5 border-b border-white/5 flex items-center gap-6 overflow-x-auto no-scrollbar">
              <div className="flex flex-col">
                <span className="text-[8px] text-indigo-400 font-black uppercase tracking-widest">Active Investigation</span>
                <span className="text-xs font-mono text-zinc-400">{selectedFile}</span>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="flex gap-4">
                <div className="flex flex-col shrink-0">
                  <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Global Kills</span>
                  <span className="text-xs font-mono text-rose-500 font-bold">{events.filter(e => e.message.includes("killed by")).length}</span>
                </div>
                <div className="flex flex-col shrink-0">
                  <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Vehicle Events</span>
                  <span className="text-xs font-mono text-amber-500 font-bold">{events.filter(e => e.type === "Vehicle").length}</span>
                </div>
                <div className="flex flex-col shrink-0">
                  <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Unique Subjects</span>
                  <span className="text-xs font-mono text-indigo-400 font-bold">{new Set(events.filter(e => e.player).map(e => e.player)).size}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between px-4 py-3 bg-white/2 border-b border-white/5">
            <div className="flex gap-2">
              {["Combat", "Vehicle", "Build", "Chat", "Movement", "System"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                    filters.includes(f) 
                      ? "bg-amber-500 text-black border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]" 
                      : "bg-white/5 text-zinc-500 border-white/5 hover:text-zinc-300"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {filteredEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-center py-20">
                <span className="text-7xl mb-6">🔍</span>
                <p className="text-sm font-black uppercase tracking-[0.4em] text-zinc-400">Zero Evidence Points</p>
                <p className="text-xs mt-3 text-zinc-500">Scan a log file or broaden your filters</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1 font-mono">
                {filteredEvents.map((e, idx) => {
                  let isSuspicious = false;
                  if (e.type === "Movement" && idx > 0) {
                    const prev = filteredEvents.slice(0, idx).reverse().find(pe => pe.player === e.player && pe.pos);
                    if (prev && e.pos && prev.pos) {
                      const pc = prev.pos.split(", ").map(Number);
                      const ec = e.pos.split(", ").map(Number);
                      const dist = Math.sqrt(Math.pow(ec[0]-pc[0], 2) + Math.pow(ec[ec.length-1]-pc[pc.length-1], 2));
                      if (dist > 3500) isSuspicious = true; 
                    }
                  }

                  return (
                    <div key={e.id} className={`group flex gap-4 p-2 rounded transition-all text-[11px] leading-relaxed border-l-2 ${
                      isSuspicious ? "bg-rose-500/10 border-rose-500" : "hover:bg-white/5 border-transparent"
                    }`}>
                      <span className="text-zinc-600 font-bold shrink-0 tabular-nums w-12">{e.time}</span>
                      
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-black text-black uppercase ${
                            e.type === "Combat" ? "bg-rose-500" :
                            e.type === "Vehicle" ? "bg-amber-500" :
                            e.type === "Build" ? "bg-emerald-500" :
                            e.type === "Chat" ? "bg-sky-500" :
                            e.type === "Movement" ? "bg-indigo-500" : "bg-zinc-600"
                          }`}>
                            {e.type}
                          </span>
                          {e.player && (
                            <span className="text-amber-100 font-bold cursor-pointer hover:text-amber-400 transition-colors" onClick={() => setSearch(e.player!)}>
                              {e.player}
                            </span>
                          )}
                          {e.pos && (
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-600 hover:text-zinc-400 truncate cursor-copy flex items-center gap-1 group/pos" onClick={() => {
                                navigator.clipboard.writeText(e.pos!);
                                toast.success("Coords copied");
                              }}>
                                <span className="text-[10px] opacity-0 group-hover/pos:opacity-100 transition-opacity">📍</span>
                                {e.pos}
                              </span>
                              <button 
                                onClick={() => handleRadiusSearch(e.pos!, e.time)}
                                className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 bg-white/5 hover:bg-amber-500/20 text-amber-500 text-[8px] font-black rounded border border-amber-500/20 transition-all uppercase"
                                title="Find everyone near this event"
                              >
                                🛰️ Find Nearby
                              </button>
                            </div>
                          )}
                          {isSuspicious && (
                            <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded animate-pulse">TELEPORT</span>
                          )}
                        </div>
                        <p className={`break-words ${e.type === "Combat" ? "text-rose-100/90" : "text-zinc-300"}`}>{e.message}</p>
                        {e.details && <p className="text-[10px] text-zinc-500 italic border-l border-white/10 pl-2 mt-0.5">{e.details}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Log Parsing Logic ─────────────────────────────────────────────────────────

function parseLog(text: string): LogEvent[] {
  const lines = text.split(/\r?\n/);
  const events: LogEvent[] = [];

  // Regex Patterns
  const playerBase = /Player\s+\"(.+?)\"\s+\(id=(.+?)(?:\s+pos=<(.+?)>)?\)/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes(" | ")) continue;

    const [time, content] = line.split(" | ");
    const eventId = `ev-${i}`;

    // 1. COMBAT: Hits / Kills
    if (content.includes("hit by") || content.includes("killed by")) {
      const match = content.match(playerBase);
      events.push({
        id: eventId,
        time,
        type: "Combat",
        player: match?.[1],
        playerId: match?.[2],
        pos: match?.[3],
        message: content.split(") ").pop() || content,
        raw: line
      });
    }
    // 2. BUILDING: 
    else if (content.includes("Built") || content.includes("Dismantled")) {
      const match = content.match(playerBase);
      events.push({
        id: eventId,
        time,
        type: "Build",
        player: match?.[1],
        playerId: match?.[2],
        pos: match?.[3],
        message: content.split(") ").pop() || content,
        raw: line
      });
    }
    // 3. VEHICLES / ACTIONS (using "with" as marker for hands)
    else if (content.includes("with") || content.includes("entered") || content.includes("Vehicle")) {
      const match = content.match(playerBase);
      events.push({
        id: eventId,
        time,
        type: content.includes("Vehicle") || content.includes("entered") ? "Vehicle" : "Combat",
        player: match?.[1],
        playerId: match?.[2],
        pos: match?.[3],
        message: content.split(") ").pop() || content,
        raw: line
      });
    }
    // 4. CHAT
    else if (content.includes("Chat:")) {
      events.push({ id: eventId, time, type: "Chat", message: content, raw: line });
    }
    // 5. MOVEMENT / POSITION LOGS
    else if (content.includes("Player \"") && !content.includes("is connected") && !content.includes("is connecting")) {
      const match = content.match(playerBase);
      if (match) {
        events.push({
          id: eventId,
          time,
          type: "Movement",
          player: match[1],
          playerId: match[2],
          pos: match[3],
          message: `Position Update`,
          raw: line
        });
      }
    }
    // 6. SYSTEM: Connections
    else if (content.includes("connecting") || content.includes("connected") || content.includes("disconnected")) {
      const match = content.match(playerBase);
      events.push({
        id: eventId,
        time,
        type: "System",
        player: match?.[1],
        message: content,
        raw: line
      });
    }
  }

  return events;
}
