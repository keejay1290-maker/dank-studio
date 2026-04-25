// localStorage-backed favorites for build keys.
// Persists across reloads. Returns a stable Set + helpers.

import { useEffect, useState } from "react";

const KEY = "dank-studio-favorites-v1";

function readStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s): s is string => typeof s === "string") : [];
  } catch { return []; }
}

export function useFavorites() {
  const [favs, setFavs] = useState<Set<string>>(() => new Set(readStorage()));

  // Persist on every change
  useEffect(() => {
    try { window.localStorage.setItem(KEY, JSON.stringify(Array.from(favs))); } catch { /* quota / privacy mode */ }
  }, [favs]);

  const toggle = (key: string) => setFavs(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const isFavorite = (key: string) => favs.has(key);

  return { favs, toggle, isFavorite };
}
