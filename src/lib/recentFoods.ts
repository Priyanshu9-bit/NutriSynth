// Recent + favorite foods.
//
// localStorage is the fast, synchronous layer the UI reads from (and the
// fallback when Firebase isn't configured). When Firebase is configured,
// every change is also written through to Firestore, and
// syncFoodListsFromCloud() merges the cloud copy back into localStorage.

import { deleteFoodEntry, loadFoodEntries, saveFoodEntry } from '@/lib/cloudStore';

const RECENT_KEY = 'nutrisynth.recentFoods.v1';
const FAVORITES_KEY = 'nutrisynth.favoriteFoods.v1';
const MAX_ENTRIES = 12;

export interface FoodEntry {
  /** Provider id, e.g. "local:rice", "usda:169756". */
  id: string;
  name: string;
  addedAt: number;
}

function readList(key: string): FoodEntry[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList(key: string, list: FoodEntry[]) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // Storage unavailable or quota exceeded — recent/favorites are a nicety, fail silently.
  }
}

export function getRecentFoods(): FoodEntry[] {
  return readList(RECENT_KEY);
}

export function addRecentFood(entry: { id: string; name: string }): void {
  const list = readList(RECENT_KEY).filter((e) => e.id !== entry.id);
  const saved: FoodEntry = { ...entry, addedAt: Date.now() };
  list.unshift(saved);
  writeList(RECENT_KEY, list.slice(0, MAX_ENTRIES));
  void saveFoodEntry('recentFoods', saved);
}

export function getFavoriteFoods(): FoodEntry[] {
  return readList(FAVORITES_KEY);
}

export function isFavoriteFood(id: string): boolean {
  return readList(FAVORITES_KEY).some((e) => e.id === id);
}

/** Toggles favorite status and returns the new state (true = now favorited). */
export function toggleFavoriteFood(entry: { id: string; name: string }): boolean {
  const list = readList(FAVORITES_KEY);
  const idx = list.findIndex((e) => e.id === entry.id);
  if (idx >= 0) {
    list.splice(idx, 1);
    writeList(FAVORITES_KEY, list);
    void deleteFoodEntry('favoriteFoods', entry.id);
    return false;
  }
  const saved: FoodEntry = { ...entry, addedAt: Date.now() };
  list.unshift(saved);
  writeList(FAVORITES_KEY, list.slice(0, MAX_ENTRIES));
  void saveFoodEntry('favoriteFoods', saved);
  return true;
}

function mergeLists(a: FoodEntry[], b: FoodEntry[]): FoodEntry[] {
  const byId = new Map<string, FoodEntry>();
  for (const e of [...a, ...b]) {
    const existing = byId.get(e.id);
    if (!existing || e.addedAt > existing.addedAt) byId.set(e.id, e);
  }
  return [...byId.values()].sort((x, y) => y.addedAt - x.addedAt).slice(0, MAX_ENTRIES);
}

/** Pulls recent + favorite foods from Firestore and merges them into local storage. No-op without Firebase. */
export async function syncFoodListsFromCloud(): Promise<void> {
  const [recent, favorites] = await Promise.all([
    loadFoodEntries('recentFoods', MAX_ENTRIES),
    loadFoodEntries('favoriteFoods', MAX_ENTRIES),
  ]);
  if (recent.length) writeList(RECENT_KEY, mergeLists(readList(RECENT_KEY), recent));
  if (favorites.length) writeList(FAVORITES_KEY, mergeLists(readList(FAVORITES_KEY), favorites));
}
