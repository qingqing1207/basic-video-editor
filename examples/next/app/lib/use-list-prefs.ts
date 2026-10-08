"use client";
import { useEffect, useState } from "react";
import type { ProjectSortKey, SortOrder } from "./project-actions";

export interface ListPrefs {
  viewMode: "grid" | "list";
  sortKey: ProjectSortKey;
  sortOrder: SortOrder;
}
const DEFAULTS: ListPrefs = { viewMode: "grid", sortKey: "updatedAt", sortOrder: "desc" };
const KEY = "bve-next-list-prefs";

/** Host-owned UI preference (not part of the editor). */
export function useListPrefs() {
  const [prefs, setPrefs] = useState<ListPrefs>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored) setPrefs({ ...DEFAULTS, ...JSON.parse(stored) });
    } catch {}
    setHydrated(true);
  }, []);
  const update = (patch: Partial<ListPrefs>) =>
    setPrefs((current) => {
      const next = { ...current, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  return { prefs, update, hydrated };
}
