// Tracks the last N selected build keys in localStorage.
// Library shows them in a "Recent" group at the top of the unfiltered view.

import { useCallback, useEffect, useState } from "react";

const KEY = "dank-studio-recent-builds-v1";
const MAX = 5;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s): s is string => typeof s === "string").slice(0, MAX) : [];
  } catch { return []; }
}

export function useRecentBuilds() {
  const [recent, setRecent] = useState<string[]>(() => read());

  useEffect(() => {
    try { window.localStorage.setItem(KEY, JSON.stringify(recent)); } catch { /* ignore */ }
  }, [recent]);

  const push = useCallback((buildKey: string) => {
    setRecent(prev => {
      const next = [buildKey, ...prev.filter(k => k !== buildKey)].slice(0, MAX);
      return next;
    });
  }, []);

  return { recent, push };
}
