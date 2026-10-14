/**
 * Local browser storage for named compositions.
 *
 * Uses localStorage so the app keeps working fully offline. The backend
 * composition methods are wired separately in `hooks/useComposition.ts` for
 * durable, cross-device saves.
 */

import {
  type Composition,
  type SavedComposition,
  isComposition,
} from "./types";

const STORAGE_KEY = "pulsegrid.compositions.v1";

function readAll(): SavedComposition[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedComposition);
  } catch {
    return [];
  }
}

function isSavedComposition(value: unknown): value is SavedComposition {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SavedComposition>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.createdAt === "number" &&
    isComposition(candidate.composition)
  );
}

function writeAll(items: SavedComposition[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function listLocalCompositions(): SavedComposition[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function saveLocalComposition(
  name: string,
  composition: Composition,
): SavedComposition {
  const now = Date.now();
  const items = readAll();
  const existing = items.find((item) => item.name === name);
  const record: SavedComposition = existing
    ? { ...existing, name, composition, updatedAt: now }
    : {
        id: `local-${now}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        createdAt: now,
        updatedAt: now,
        composition,
      };
  const next = existing
    ? items.map((item) => (item.id === record.id ? record : item))
    : [...items, record];
  writeAll(next);
  return record;
}

export function loadLocalComposition(id: string): SavedComposition | null {
  return readAll().find((item) => item.id === id) ?? null;
}

export function deleteLocalComposition(id: string): void {
  writeAll(readAll().filter((item) => item.id !== id));
}

/**
 * Record the numeric backend id for a locally saved composition so a later
 * delete can mirror to the backend. No-op when the local record is gone.
 */
export function setLocalCompositionBackendId(
  id: string,
  backendId: string,
): void {
  const items = readAll();
  let changed = false;
  const next = items.map((item) => {
    if (item.id !== id) return item;
    changed = true;
    return { ...item, backendId };
  });
  if (changed) writeAll(next);
}
