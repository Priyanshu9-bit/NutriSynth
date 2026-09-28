// Shared types for the nutrition provider abstraction.
//
// NutriSynth can source a food's nutrients from three places — the bundled
// local database, USDA FoodData Central, or Edamam — but every part of the
// UI downstream (search results, the scan-food cart, the natural-language
// meal builder) works against these normalized shapes only. Adding a new
// provider means implementing `NutritionProvider`; nothing else changes.

export type NutrientKey =
  | 'calories'
  | 'protein'
  | 'carbs'
  | 'fat'
  | 'fiber'
  | 'sugar'
  | 'sodium'
  | 'potassium'
  | 'calcium'
  | 'iron'
  | 'vitaminA'
  | 'vitaminC'
  | 'vitaminD'
  | 'vitaminB12'
  | 'folate'
  | 'zinc'
  | 'magnesium';

export type NutrientMap = Partial<Record<NutrientKey, number>>;

export type NutritionSource = 'local' | 'usda' | 'edamam';

export interface FoodServing {
  /** Human-readable label, e.g. "1 cup", "100 g", "1 medium". */
  label: string;
  /** Grams represented by this serving, when known — enables weight-based scaling (100g -> 200g). */
  grams?: number;
}

/** A food record with nutrients normalized to a single, well-defined serving. */
export interface NormalizedFood {
  /** Stable id: "local:rice", "usda:169756", "edamam:food_a1b2c3". */
  id: string;
  name: string;
  source: NutritionSource;
  /** The serving that every value in `nutrients` is measured against. */
  serving: FoodServing;
  nutrients: NutrientMap;
  tags?: string[];
}

/** A lightweight search result, before the full nutrition record is fetched. */
export interface FoodSearchHit {
  id: string;
  name: string;
  source: NutritionSource;
  /** Optional disambiguating detail (brand, category, USDA data type). */
  description?: string;
}

/** A food detected from a photo or parsed from natural language, pre-resolution. */
export interface DetectedFood {
  name: string;
  quantity: number;
  unit: string;
  /** 0–1 confidence, when it comes from AI vision. Omitted for manual entry. */
  confidence?: number;
}

/** A food that has been matched to a NormalizedFood and is ready to render / total / add. */
export interface ResolvedFoodItem {
  /** Unique within whatever list is holding it (cart, detected-items, etc). */
  uid: string;
  food: NormalizedFood;
  /** Multiplier against `food.serving` — 2 means "2x the serving". */
  multiplier: number;
  /** Carried over from AI detection, when applicable. */
  confidence?: number;
}

export interface NutritionProvider {
  id: NutritionSource;
  searchFood(query: string): Promise<FoodSearchHit[]>;
  /** `unit` (cup, slice, piece…) lets a provider pick a matching household measure. */
  getFoodDetails(hitOrId: FoodSearchHit | string, unit?: string): Promise<NormalizedFood | null>;
}
