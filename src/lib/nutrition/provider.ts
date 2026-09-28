// Composite nutrition provider + shared meal-cart math.
//
// This is the single entry point the UI (ScanFood, SearchFood, EnterFood,
// NutritionHub) should import from. It tries the real USDA/Edamam-backed
// Edge Functions first and transparently falls back to the local database
// if Supabase isn't configured or a request fails — so the app keeps
// working out of the box, while a configured deployment gets real data.
//
// It also holds the small set of pure functions (scaling, totals, MealItem
// conversion) that Scan/Search/Enter Food all need identically, so the
// three entry points can never drift into separate calculation logic.

import type { MealItem } from '@/lib/calculations';
import { edgeFunctionProvider } from './edgeFunctionProvider';
import { localProvider } from './localAdapter';
import { normalizeFoodName } from './normalize';
import type {
  FoodSearchHit,
  NormalizedFood,
  NutrientKey,
  NutrientMap,
  NutritionSource,
  ResolvedFoodItem,
} from './types';
import { computeMultiplier } from './units';
import { isSupabaseConfigured } from '@/lib/supabaseClient';

export function sourceLabel(source: NutritionSource): string {
  switch (source) {
    case 'usda':
      return 'USDA FoodData Central';
    case 'edamam':
      return 'Edamam';
    default:
      return 'NutriSynth database';
  }
}

// Session caches — identical searches / food lookups reuse earlier results
// instead of spending another USDA / Edge Function request. Only successful
// backend responses are cached, so a failed request is retried next time.
const remoteSearchCache = new Map<string, FoodSearchHit[]>();
const detailsCache = new Map<string, NormalizedFood>();

/** Searches USDA + Edamam (via the backend) and merges in local matches, de-duped by name. */
export async function searchFood(query: string): Promise<FoodSearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const cacheKey = q.toLowerCase();

  let remote: FoodSearchHit[] = [];
  if (isSupabaseConfigured) {
    const cached = remoteSearchCache.get(cacheKey);
    if (cached) {
      remote = cached;
    } else {
      try {
        remote = await edgeFunctionProvider.searchFood(q);
        remoteSearchCache.set(cacheKey, remote);
      } catch (err) {
        console.warn('[NutriSynth] Nutrition search backend unavailable, using local database.', err);
      }
    }
  }

  const local = await localProvider.searchFood(q);
  const seen = new Set(remote.map((r) => r.name.toLowerCase()));
  const merged = [...remote, ...local.filter((l) => !seen.has(l.name.toLowerCase()))];
  return merged.slice(0, 25);
}

/** Resolves a search hit to its full, normalized nutrition record. */
export async function getFoodDetails(hit: FoodSearchHit, unit?: string): Promise<NormalizedFood | null> {
  if (hit.source === 'local') return localProvider.getFoodDetails(hit);
  const cacheKey = `${hit.id}|${unit ?? ''}`;
  const cached = detailsCache.get(cacheKey);
  if (cached) return cached;
  try {
    const food = await edgeFunctionProvider.getFoodDetails(hit, unit);
    if (food) detailsCache.set(cacheKey, food);
    return food;
  } catch (err) {
    console.warn('[NutriSynth] Nutrition details backend unavailable.', err);
    return null;
  }
}

/** Same as getFoodDetails, but from a bare id string (e.g. from Recent Foods). */
export async function getFoodDetailsById(id: string): Promise<NormalizedFood | null> {
  if (id.startsWith('local:')) return localProvider.getFoodDetails(id);
  const cached = detailsCache.get(id);
  if (cached) return cached;
  try {
    const food = await edgeFunctionProvider.getFoodDetails(id);
    if (food) detailsCache.set(id, food);
    return food;
  } catch (err) {
    console.warn('[NutriSynth] Nutrition details backend unavailable.', err);
    return null;
  }
}

/**
 * Resolves a detected/parsed food name + quantity into a ready-to-render
 * ResolvedFoodItem, using the best search match. Returns null when nothing
 * suitable was found — callers must surface this as "food not found" and
 * let the user search manually, never invent nutrition data.
 */
export async function resolveFoodItem(
  rawName: string,
  quantity: number,
  unit: string,
  confidence?: number
): Promise<ResolvedFoodItem | null> {
  const query = normalizeFoodName(rawName);
  const hits = await searchFood(query);
  if (hits.length === 0) return null;

  // Try top hits in order: if one lacks usable nutrient data, fall through to the next.
  let food: NormalizedFood | null = null;
  for (const hit of hits.slice(0, 3)) {
    food = await getFoodDetails(hit, unit);
    if (food) break;
  }
  if (!food) return null;

  const multiplier = computeMultiplier(quantity, unit, food.serving);
  return {
    uid: `${food.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    food,
    multiplier,
    confidence,
  };
}

/** A resolved item's nutrients scaled by its portion multiplier. */
export function scaledNutrients(item: ResolvedFoodItem): NutrientMap {
  const out: NutrientMap = {};
  for (const [key, value] of Object.entries(item.food.nutrients) as [NutrientKey, number | undefined][]) {
    if (typeof value === 'number') out[key] = value * item.multiplier;
  }
  return out;
}

export interface MealTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export function totalsFor(items: ResolvedFoodItem[]): MealTotals {
  return items.reduce<MealTotals>(
    (acc, item) => {
      const n = scaledNutrients(item);
      return {
        calories: acc.calories + (n.calories ?? 0),
        protein: acc.protein + (n.protein ?? 0),
        carbs: acc.carbs + (n.carbs ?? 0),
        fat: acc.fat + (n.fat ?? 0),
        fiber: acc.fiber + (n.fiber ?? 0),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

/**
 * Converts a resolved-item cart into the existing app's MealItem shape, so
 * it can go straight into the existing daily-intake system (result.meals)
 * with no separate tracker. `components` carries provider ids (e.g.
 * "usda:169756") rather than only local-DB keys — analyzeFood/getMealReasoning
 * already look these up with an optional-chain, so an unrecognized id just
 * contributes no dietary tags instead of breaking.
 */
export function toMealItem(items: ResolvedFoodItem[], mealName: string, mealType: string): MealItem {
  const totals = totalsFor(items);
  const fallbackName = items.map((i) => i.food.name).filter(Boolean).join(' + ');
  const finalName = mealName.trim() || fallbackName || 'Meal';
  return {
    name: mealType === 'Custom' ? finalName : mealType,
    food: finalName,
    details: {
      calories: Math.round(totals.calories),
      protein: +totals.protein.toFixed(1),
      carbs: +totals.carbs.toFixed(1),
      fat: +totals.fat.toFixed(1),
      fiber: +totals.fiber.toFixed(1),
    },
    components: items.map((i) => i.food.id),
    icon: 'Camera',
  };
}
