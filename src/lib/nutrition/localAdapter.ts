// Local database provider.
//
// Wraps the existing `foodNutritionData` (src/data/foods.ts) as a
// NutritionProvider. This is NOT a second nutrition database — it's the
// same one the rest of NutriSynth already uses, exposed through the same
// interface as USDA/Edamam so the UI never needs to know which one answered.
// It also serves as the offline fallback when Supabase Edge Functions
// aren't configured or are unreachable.

import { foodNutritionData } from '@/data/foods';
import { searchFoodDatabase } from '@/lib/foodRecognitionService';
import type { FoodSearchHit, NormalizedFood, NutritionProvider } from './types';

function toNormalized(key: string): NormalizedFood | null {
  const f = foodNutritionData[key];
  if (!f) return null;
  return {
    id: `local:${key}`,
    name: f.name,
    source: 'local',
    serving: { label: f.serving },
    nutrients: {
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      fiber: f.fiber,
      calcium: f.calcium,
      iron: f.iron,
      vitaminC: f.vitaminC,
      vitaminD: f.vitaminD,
      folate: f.folate,
      vitaminB12: f.vitaminB12,
      vitaminA: f.vitaminA,
      zinc: f.zinc,
      magnesium: f.magnesium,
      potassium: f.potassium,
    },
    tags: f.tags,
  };
}

export const localProvider: NutritionProvider = {
  id: 'local',

  async searchFood(query: string): Promise<FoodSearchHit[]> {
    return searchFoodDatabase(query).map((f) => ({
      id: `local:${f.key}`,
      name: f.name,
      source: 'local' as const,
    }));
  },

  async getFoodDetails(hitOrId: FoodSearchHit | string): Promise<NormalizedFood | null> {
    const id = typeof hitOrId === 'string' ? hitOrId : hitOrId.id;
    const key = id.startsWith('local:') ? id.slice('local:'.length) : id;
    return toNormalized(key);
  },
};
