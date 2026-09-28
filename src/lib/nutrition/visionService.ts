// Vision service for Scan Food (Local / Offline mode).
//
// In this mode, scanning falls back to local food recognition and quick-add
// suggestions so Scan Food works reliably out of the box with zero external dependencies.

import { getQuickAddFoods, recognizeFood as recognizeFoodLocally } from '@/lib/foodRecognitionService';
import type { DetectedFood } from './types';

export interface AnalyzeImageResult {
  detected: DetectedFood[];
  /** True when no external vision provider was used and these are local suggestions. */
  usedFallback: boolean;
}

export async function analyzeFoodImage(dataUrl: string): Promise<AnalyzeImageResult> {
  // Offline recognition — no external vision API needed.
  await recognizeFoodLocally({ dataUrl });
  const quick = getQuickAddFoods();
  return {
    detected: quick.map((f) => ({ name: f.name, quantity: 1, unit: 'serving', confidence: 0 })),
    usedFallback: true,
  };
}
