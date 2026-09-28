// search-food
//
// Searches USDA FoodData Central first; falls back to Edamam when USDA is
// unavailable or returns too few suitable matches. Results are NOT blended
// into one record — each hit keeps its own source and id ("usda:123",
// "edamam:food_x"), and get-food-nutrition returns one provider's record.
//
// Secrets: USDA_API_KEY, EDAMAM_APP_ID, EDAMAM_APP_KEY

import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

interface Hit {
  id: string;
  name: string;
  source: 'usda' | 'edamam';
  description?: string;
}

const MIN_USDA_RESULTS_BEFORE_FALLBACK = 3;

async function searchUsda(query: string, apiKey: string): Promise<Hit[]> {
  const url = new URL('https://api.nal.usda.gov/fdc/v1/foods/search');
  url.searchParams.set('query', query);
  url.searchParams.set('pageSize', '10');
  url.searchParams.set('dataType', 'Foundation,SR Legacy,Survey (FNDDS)');
  const res = await fetch(url, { headers: { 'X-Api-Key': apiKey }, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`USDA search failed (${res.status})`);
  const data = await res.json();
  return (Array.isArray(data.foods) ? data.foods : []).map(
    (f: { fdcId: number; description: string; dataType?: string }): Hit => ({
      id: `usda:${f.fdcId}`,
      name: f.description,
      source: 'usda',
      description: f.dataType,
    })
  );
}

async function searchEdamam(query: string, appId: string, appKey: string): Promise<Hit[]> {
  const url = new URL('https://api.edamam.com/api/food-database/v2/parser');
  url.searchParams.set('app_id', appId);
  url.searchParams.set('app_key', appKey);
  url.searchParams.set('ingr', query);
  url.searchParams.set('nutrition-type', 'cooking');
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Edamam search failed (${res.status})`);
  const data = await res.json();
  const seen = new Set<string>();
  const hits: Hit[] = [];
  for (const h of Array.isArray(data.hints) ? data.hints : []) {
    const food = h?.food;
    if (!food?.foodId || !food?.label) continue;
    const key = String(food.label).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push({ id: `edamam:${food.foodId}`, name: food.label, source: 'edamam', description: food.category });
    if (hits.length >= 10) break;
  }
  return hits;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);

  try {
    const body = await req.json().catch(() => null);
    const query = typeof body?.query === 'string' ? body.query.trim().slice(0, 100) : '';
    if (!query) return jsonResponse({ results: [] });

    const usdaKey = Deno.env.get('USDA_API_KEY');
    const edamamId = Deno.env.get('EDAMAM_APP_ID');
    const edamamKey = Deno.env.get('EDAMAM_APP_KEY');
    if (!usdaKey && !(edamamId && edamamKey)) {
      return jsonResponse({ error: 'No nutrition provider is configured.' }, 500);
    }

    let results: Hit[] = [];
    let usdaFailed = false;

    if (usdaKey) {
      try {
        results = await searchUsda(query, usdaKey);
      } catch (err) {
        usdaFailed = true;
        console.error(err instanceof Error ? err.message : 'USDA error');
      }
    }

    if ((usdaFailed || results.length < MIN_USDA_RESULTS_BEFORE_FALLBACK) && edamamId && edamamKey) {
      try {
        const extra = await searchEdamam(query, edamamId, edamamKey);
        const seen = new Set(results.map((r) => r.name.toLowerCase()));
        results = [...results, ...extra.filter((e) => !seen.has(e.name.toLowerCase()))];
      } catch (err) {
        console.error(err instanceof Error ? err.message : 'Edamam error');
        if (results.length === 0 && usdaFailed) {
          return jsonResponse({ error: 'Nutrition providers are unavailable.' }, 502);
        }
      }
    } else if (usdaFailed && results.length === 0) {
      return jsonResponse({ error: 'Nutrition provider is unavailable.' }, 502);
    }

    return jsonResponse({ results: results.slice(0, 20) });
  } catch (err) {
    console.error('search-food error:', err instanceof Error ? err.message : 'unknown');
    return jsonResponse({ error: 'Unexpected server error.' }, 500);
  }
});
