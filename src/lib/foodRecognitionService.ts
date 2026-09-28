// Food recognition service — abstraction layer for the Scan Food feature.
//
// This layer exists so the Scan Food UI never talks to an AI vision provider
// directly. Today `recognizeFood` is a local stub that returns a curated list
// of commonly-scanned dishes for the user to confirm, search, and adjust —
// it does not invent nutrition data; every candidate maps to a real entry in
// the existing `foodNutritionData` database (see src/data/foods.ts).
//
// To connect a real vision model later (OpenAI Vision, Gemini Vision, a
// local CV model, etc.), replace the body of `recognizeFood` with a call to
// that provider and map its output back to keys in `foodNutritionData`
// (or extend the database first). Nothing else in the app needs to change —
// the UI only ever depends on this file's exported functions and types.

import { foodNutritionData, type FoodData } from '@/data/foods';

export interface DetectedFoodCandidate {
  /** Key into foodNutritionData */
  key: string;
  /** 0-1 confidence score, when a real recognizer provides one */
  confidence?: number;
}

export interface FoodSearchResult extends FoodData {
  key: string;
}

/**
 * A short, DB-backed "quick add" list shown immediately after a photo is
 * captured, so the user has something to tap instead of typing right away.
 * Deliberately small and generic — these are common plate components across
 * the existing food database's cuisine, not a claim about what's in *this*
 * photo.
 */
const QUICK_ADD_KEYS = [
  'rice',
  'toor_dal_tadka',
  'paneer_curry',
  'salad',
  'chicken_curry',
  'egg_bhurji_2',
  'roti',
  'khichdi',
] as const;

/**
 * Simulates analyzing a captured/uploaded photo and returns candidate foods.
 *
 * No paid or external vision API is used here — this keeps the feature fully
 * working out of the box. The `image` argument is accepted (and awaited on)
 * so that swapping in a real vision call later is a drop-in change: the
 * function signature already matches what an async API call would need.
 */
export async function recognizeFood(
  image: { dataUrl: string }
): Promise<DetectedFoodCandidate[]> {
  // `image` isn't inspected yet — no vision model is connected. It's part of
  // the signature now so a real provider can be dropped in without changing
  // any caller.
  void image;

  // Small artificial delay so the "Analyzing photo..." state reads naturally.
  await new Promise((resolve) => setTimeout(resolve, 700));

  return QUICK_ADD_KEYS.filter((key) => key in foodNutritionData).map((key) => ({ key }));
}

/** The quick-add suggestions, resolved to full food records for rendering. */
export function getQuickAddFoods(): FoodSearchResult[] {
  return QUICK_ADD_KEYS.filter((key) => key in foodNutritionData).map((key) => ({
    key,
    ...foodNutritionData[key],
  }));
}

/** Search the existing nutrition database by name or tag, for manual add. */
export function searchFoodDatabase(query: string): FoodSearchResult[] {
  const q = query.trim().toLowerCase();
  const entries = Object.entries(foodNutritionData);
  const matches = q
    ? entries.filter(
        ([key, food]) =>
          food.name.toLowerCase().includes(q) ||
          key.toLowerCase().includes(q) ||
          (food.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
      )
    : entries;
  return matches.slice(0, 25).map(([key, food]) => ({ key, ...food }));
}

export function getFoodByKey(key: string): FoodSearchResult | null {
  const food = foodNutritionData[key];
  return food ? { key, ...food } : null;
}
