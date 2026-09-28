// Vision service for Scan Food.
//
// Gemini's job here is ONLY food identification (name, estimated portion,
// unit, confidence) — never nutrition values. The Edge Function
// (analyze-food-image) is the only thing that talks to Gemini; this module
// just calls it and shapes the response. If Supabase isn't configured or
// the call fails, we fall back to the existing local quick-add suggestions
// so Scan Food still works end-to-end without a vision provider connected.

import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { getQuickAddFoods, recognizeFood as recognizeFoodLocally } from '@/lib/foodRecognitionService';
import type { DetectedFood } from './types';

export interface AnalyzeImageResult {
  detected: DetectedFood[];
  /** True when no real vision provider was used and these are generic offline suggestions. */
  usedFallback: boolean;
}

export async function analyzeFoodImage(dataUrl: string): Promise<AnalyzeImageResult> {
  if (isSupabaseConfigured && supabase) {
    try {
      const base64 = dataUrl.includes(',') ? dataUrl.slice(dataUrl.indexOf(',') + 1) : dataUrl;
      const { data, error } = await supabase.functions.invoke<{
        foods?: DetectedFood[];
        error?: string;
      }>('analyze-food-image', { body: { image: base64 } });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.foods && data.foods.length > 0) {
        return { detected: data.foods, usedFallback: false };
      }
      if (data?.foods) {
        // Vision provider ran and confidently found nothing — respect that,
        // don't paper over it with offline guesses.
        return { detected: [], usedFallback: false };
      }
    } catch (err) {
      console.warn('[NutriSynth] Vision backend unavailable, using offline quick-add suggestions.', err);
    }
  }

  // Offline fallback — no vision model connected. `recognizeFoodLocally`
  // is awaited so the "Analyzing…" state reads naturally either way.
  await recognizeFoodLocally({ dataUrl });
  const quick = getQuickAddFoods();
  return {
    detected: quick.map((f) => ({ name: f.name, quantity: 1, unit: 'serving', confidence: 0 })),
    usedFallback: true,
  };
}
