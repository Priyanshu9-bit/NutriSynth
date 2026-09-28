// get-food-nutrition
//
// Input:  { id: "usda:<fdcId>" | "edamam:<foodId>", unit?: "cup" | "slice" | "piece" | ... }
// Output: { food: NormalizedFood | null }
//
// Returns ONE provider's record (chosen by the id's prefix) — never a blend.
// USDA nutrient amounts are per 100 g; we scale them to the chosen serving.
// The serving is a real household measure from USDA's foodPortions when one
// matches the requested unit, otherwise "100 g". Nothing is invented.
//
// Secrets: USDA_API_KEY, EDAMAM_APP_ID, EDAMAM_APP_KEY

import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

type NutrientKey =
  | 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber' | 'sugar' | 'sodium' | 'potassium'
  | 'calcium' | 'iron' | 'vitaminA' | 'vitaminC' | 'vitaminD' | 'vitaminB12' | 'folate'
  | 'zinc' | 'magnesium';

// FoodData Central nutrient ids -> NutriSynth nutrient keys.
// Energy: 1008 (kcal). Foundation foods may report 2047/2048 (Atwater) instead.
const USDA_NUTRIENTS: Record<number, NutrientKey> = {
  1008: 'calories', 2047: 'calories', 2048: 'calories',
  1003: 'protein', 1005: 'carbs', 1004: 'fat', 1079: 'fiber', 2000: 'sugar',
  1093: 'sodium', 1092: 'potassium', 1087: 'calcium', 1089: 'iron',
  1106: 'vitaminA', 1162: 'vitaminC', 1114: 'vitaminD', 1178: 'vitaminB12',
  1177: 'folate', 1095: 'zinc', 1090: 'magnesium',
};

const EDAMAM_NUTRIENTS: Record<string, NutrientKey> = {
  ENERC_KCAL: 'calories', PROCNT: 'protein', CHOCDF: 'carbs', FAT: 'fat', FIBTG: 'fiber',
  SUGAR: 'sugar', NA: 'sodium', K: 'potassium', CA: 'calcium', FE: 'iron',
  VITC: 'vitaminC', VITD: 'vitaminD', VITB12: 'vitaminB12', FOLDFE: 'folate',
  ZN: 'zinc', MG: 'magnesium',
};

interface UsdaPortion {
  amount?: number;
  gramWeight?: number;
  modifier?: string;
  measureUnit?: { name?: string; abbreviation?: string };
  portionDescription?: string;
}

const UNIT_KEYWORDS: Record<string, string[]> = {
  cup: ['cup'],
  tbsp: ['tbsp', 'tablespoon'],
  tsp: ['tsp', 'teaspoon'],
  slice: ['slice'],
  piece: ['medium', 'large', 'small', 'piece', 'each', 'egg', 'unit'],
  bowl: ['bowl', 'cup'],
  plate: ['serving', 'cup'],
  serving: ['serving'],
};

function portionLabel(p: UsdaPortion): string {
  const amount = p.amount && p.amount !== 1 ? `${p.amount} ` : '1 ';
  const unit = p.measureUnit?.name && p.measureUnit.name !== 'undetermined' ? p.measureUnit.name : '';
  const desc = p.modifier || p.portionDescription || '';
  return `${amount}${[unit, desc].filter(Boolean).join(' ')}`.trim();
}

function pickPortion(portions: UsdaPortion[], unit?: string): UsdaPortion | null {
  if (!unit) return null;
  const words = UNIT_KEYWORDS[unit];
  if (!words) return null;
  const usable = portions.filter((p) => typeof p.gramWeight === 'number' && p.gramWeight > 0);
  for (const word of words) {
    const match = usable.find((p) =>
      `${p.measureUnit?.name ?? ''} ${p.modifier ?? ''} ${p.portionDescription ?? ''}`.toLowerCase().includes(word)
    );
    if (match) return match;
  }
  return null;
}

async function fetchUsda(fdcId: string, unit: string | undefined, apiKey: string) {
  const res = await fetch(`https://api.nal.usda.gov/fdc/v1/food/${encodeURIComponent(fdcId)}`, {
    headers: { 'X-Api-Key': apiKey },
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`USDA details failed (${res.status})`);
  const data = await res.json();

  const per100g: Partial<Record<NutrientKey, number>> = {};
  for (const n of Array.isArray(data.foodNutrients) ? data.foodNutrients : []) {
    const key = USDA_NUTRIENTS[n?.nutrient?.id];
    if (key && typeof n.amount === 'number' && per100g[key] === undefined) per100g[key] = n.amount;
  }
  if (per100g.calories === undefined) return null; // insufficient data — let caller fall back / report not found

  const portion = pickPortion(Array.isArray(data.foodPortions) ? data.foodPortions : [], unit);
  const grams = portion?.gramWeight ?? 100;
  const factor = grams / 100;
  const nutrients: Partial<Record<NutrientKey, number>> = {};
  for (const [k, v] of Object.entries(per100g)) nutrients[k as NutrientKey] = (v as number) * factor;

  return {
    id: `usda:${fdcId}`,
    name: data.description as string,
    source: 'usda' as const,
    serving: portion ? { label: `${portionLabel(portion)} (${Math.round(grams)} g)`, grams } : { label: '100 g', grams: 100 },
    nutrients,
  };
}

async function fetchEdamam(foodId: string, appId: string, appKey: string) {
  const url = new URL('https://api.edamam.com/api/food-database/v2/nutrients');
  url.searchParams.set('app_id', appId);
  url.searchParams.set('app_key', appKey);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ingredients: [
        { quantity: 100, measureURI: 'http://www.edamam.com/ontologies/edamam.owl#Measure_gram', foodId },
      ],
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Edamam details failed (${res.status})`);
  const data = await res.json();

  const nutrients: Partial<Record<NutrientKey, number>> = {};
  for (const [code, key] of Object.entries(EDAMAM_NUTRIENTS)) {
    const q = data?.totalNutrients?.[code]?.quantity;
    if (typeof q === 'number') nutrients[key] = q;
  }
  if (nutrients.calories === undefined) return null;

  const label = data?.ingredients?.[0]?.parsed?.[0]?.food;
  return {
    id: `edamam:${foodId}`,
    name: typeof label === 'string' && label ? label : foodId,
    source: 'edamam' as const,
    serving: { label: '100 g', grams: 100 },
    nutrients,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);

  try {
    const body = await req.json().catch(() => null);
    const id = typeof body?.id === 'string' ? body.id : '';
    const unit = typeof body?.unit === 'string' ? body.unit.toLowerCase() : undefined;
    const sep = id.indexOf(':');
    if (sep < 1) return jsonResponse({ error: 'Invalid food id.' }, 400);
    const source = id.slice(0, sep);
    const externalId = id.slice(sep + 1);

    if (source === 'usda') {
      const key = Deno.env.get('USDA_API_KEY');
      if (!key) return jsonResponse({ error: 'USDA is not configured.' }, 500);
      return jsonResponse({ food: await fetchUsda(externalId, unit, key) });
    }
    if (source === 'edamam') {
      const appId = Deno.env.get('EDAMAM_APP_ID');
      const appKey = Deno.env.get('EDAMAM_APP_KEY');
      if (!appId || !appKey) return jsonResponse({ error: 'Edamam is not configured.' }, 500);
      return jsonResponse({ food: await fetchEdamam(externalId, appId, appKey) });
    }
    return jsonResponse({ error: 'Unknown food source.' }, 400);
  } catch (err) {
    console.error('get-food-nutrition error:', err instanceof Error ? err.message : 'unknown');
    return jsonResponse({ error: 'Nutrition provider is unavailable.' }, 502);
  }
});
