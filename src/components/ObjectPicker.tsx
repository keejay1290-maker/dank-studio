// ─────────────────────────────────────────────────────────────────────────────
// DANK STUDIO — Object Picker Modal
// Lets the user select a DayZ classname from the catalogue.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { OBJECT_CATALOGUE } from "../lib/constants";

interface Props {
  current?: string;
  onSelect: (classname: string) => void;
  onClose:  () => void;
}

export function ObjectPicker({ current, onSelect, onClose }: Props) {
  const [search, setSearch] = useState("");

  const categories = Array.from(new Set(OBJECT_CATALOGUE.map(o => o.category)));

  const filtered = OBJECT_CATALOGUE.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    o.classname.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl w-[480px] max-h-[80vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
          <span className="text-sm font-bold text-zinc-200">Select Object</span>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 text-lg leading-none"
          >✕</button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-zinc-800">
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search objects…"
            className="w-full bg-zinc-800 text-zinc-200 text-sm rounded px-3 py-1.5 outline-none placeholder-zinc-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 py-2">
          {search
            ? /* flat filtered list */
              filtered.map(o => (
                <ObjectRow
                  key={o.classname}
                  def={o}
                  selected={o.classname === current}
                  onSelect={onSelect}
                />
              ))
            : /* grouped by category */
              categories.map(cat => {
                const items = OBJECT_CATALOGUE.filter(o => o.category === cat);
                return (
                  <div key={cat}>
                    <div className="px-4 py-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      {cat}
                    </div>
                    {items.map(o => (
                      <ObjectRow
                        key={o.classname}
                        def={o}
                        selected={o.classname === current}
                        onSelect={onSelect}
                      />
                    ))}
                  </div>
                );
              })
          }
          {search && filtered.length === 0 && (
            <p className="text-center text-zinc-600 text-sm py-6">No results</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ObjectRow({
  def, selected, onSelect,
}: {
  def: { classname: string; label: string; width: number; height: number; color: string };
  selected: boolean;
  onSelect: (c: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(def.classname)}
      className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-zinc-800 transition-colors ${
        selected ? "bg-amber-900/30" : ""
      }`}
    >
      {/* Color swatch */}
      <span
        className="w-3 h-3 rounded-sm flex-shrink-0"
        style={{ background: def.color }}
      />
      <span className="flex-1">
        <span className="text-sm text-zinc-200">{def.label}</span>
        <span className="block text-xs text-zinc-500">{def.classname}</span>
      </span>
      <span className="text-xs text-zinc-600">{def.width}m</span>
      {selected && <span className="text-amber-400 text-xs">✓</span>}
    </button>
  );
}
