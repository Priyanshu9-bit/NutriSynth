// USDA / Edamam provider, via Supabase Edge Functions.
//
// The frontend never talks to USDA or Edamam directly and never sees their
// API keys — it calls the project's own Edge Functions (search-food,
// get-food-nutrition), which hold those keys as server-side secrets and do
// the real lookups. See supabase/functions/.

import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import type { FoodSearchHit, NormalizedFood, NutritionProvider } from './types';

async function invoke<T>(fn: string, body: unknown): Promise<T> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.functions.invoke<T>(fn, { body });
  if (error) throw error;
  if (data == null) throw new Error(`Edge Function "${fn}" returned no data.`);
  return data;
}

export const edgeFunctionProvider: NutritionProvider = {
  // Representative id only — the actual source of each result (usda/edamam)
  // comes back per-item from the Edge Function.
  id: 'usda',

  async searchFood(query: string): Promise<FoodSearchHit[]> {
    if (!isSupabaseConfigured) return [];
    const data = await invoke<{ results?: FoodSearchHit[]; error?: string }>('search-food', { query });
    if (data.error) throw new Error(data.error);
    return data.results ?? [];
  },

  async getFoodDetails(hitOrId: FoodSearchHit | string, unit?: string): Promise<NormalizedFood | null> {
    if (!isSupabaseConfigured) return null;
    const id = typeof hitOrId === 'string' ? hitOrId : hitOrId.id;
    const data = await invoke<{ food?: NormalizedFood | null; error?: string }>('get-food-nutrition', { id, unit });
    if (data.error) throw new Error(data.error);
    return data.food ?? null;
  },
};
