// Lightweight toast notification system. No external deps, no providers —
// uses a single global event bus + a stack rendered at the app root.
//
// Usage anywhere:  toast.success("Copied to clipboard"); toast.error("Failed");

import { useEffect, useState } from "react";

type ToastKind = "success" | "error" | "info";
interface ToastEntry { id: number; kind: ToastKind; msg: string; }

const listeners = new Set<(t: ToastEntry) => void>();
let counter = 0;

function emit(kind: ToastKind, msg: string) {
  const entry: ToastEntry = { id: ++counter, kind, msg };
  for (const fn of listeners) fn(entry);
}

export const toast = {
  success: (msg: string) => emit("success", msg),
  error:   (msg: string) => emit("error",   msg),
  info:    (msg: string) => emit("info",    msg),
};

export function ToastStack() {
  const [items, setItems] = useState<ToastEntry[]>([]);
  useEffect(() => {
    const fn = (t: ToastEntry) => {
      setItems(prev => [...prev, t]);
      setTimeout(() => setItems(prev => prev.filter(p => p.id !== t.id)), 2400);
    };
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {items.map(t => (
        <div key={t.id}
          className={`px-4 py-2.5 rounded-lg backdrop-blur-md border text-[11px] font-bold uppercase tracking-widest shadow-2xl pointer-events-auto animate-fade-in-up ${
            t.kind === "success" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200"
            : t.kind === "error" ? "bg-rose-500/20    border-rose-500/50    text-rose-200"
            :                       "bg-amber-500/15   border-amber-500/40   text-amber-200"
          }`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
