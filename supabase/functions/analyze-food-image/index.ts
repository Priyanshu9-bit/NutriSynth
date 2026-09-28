// analyze-food-image
//
// Receives a base64 food photo, asks Gemini Vision to IDENTIFY foods, portions
// and confidence. Gemini is never asked for calories/nutrients — those come
// from USDA/Edamam via search-food + get-food-nutrition.
//
// Secret required: GEMINI_API_KEY (supabase secrets set GEMINI_API_KEY=...)
// The image is processed in memory only; it is not stored or logged.

import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

interface GeminiFood {
  name?: unknown;
  estimatedPortion?: unknown;
  unit?: unknown;
  confidence?: unknown;
}

const MAX_BASE64_CHARS = 14_000_000; // ~10MB of image bytes

const PROMPT = `You are a food identification assistant. Identify every distinct food item visible in this meal photo.
Respond with ONLY valid JSON in exactly this shape:
{"foods":[{"name":"string","estimatedPortion":number,"unit":"g|ml|cup|piece|slice|bowl|plate|serving","confidence":number}]}
Rules:
- "name" is a short generic food name (e.g. "rice", "dal", "paneer", "grilled chicken breast"), not a brand.
- "confidence" is between 0 and 1.
- Do NOT estimate calories or any nutrient values.
- If no food is visible, return {"foods":[]}.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);

  try {
    const body = await req.json().catch(() => null);
    const image = body?.image;
    if (typeof image !== 'string' || image.length === 0) {
      return jsonResponse({ error: 'Missing "image" (base64) in request body.' }, 400);
    }
    if (image.length > MAX_BASE64_CHARS) {
      return jsonResponse({ error: 'Image is too large.' }, 413);
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) return jsonResponse({ error: 'Vision provider is not configured.' }, 500);

    const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.1-flash-lite';
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: PROMPT }, { inline_data: { mime_type: 'image/jpeg', data: image } }] },
          ],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
        }),
        signal: AbortSignal.timeout(25_000),
      }
    );

    if (res.status === 429) return jsonResponse({ error: 'Vision provider rate limit reached. Try again shortly.' }, 429);
    if (!res.ok) {
      console.error('Gemini request failed with status', res.status); // never log image data or keys
      return jsonResponse({ error: 'Vision provider request failed.' }, 502);
    }

    const data = await res.json();
    const text: unknown = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') return jsonResponse({ foods: [] });

    let parsed: { foods?: GeminiFood[] };
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      return jsonResponse({ error: 'Vision provider returned malformed data.' }, 502);
    }

    const foods = (Array.isArray(parsed.foods) ? parsed.foods : [])
      .filter((f) => typeof f?.name === 'string' && (f.name as string).trim().length > 0)
      .slice(0, 12)
      .map((f) => {
        const qty = Number(f.estimatedPortion);
        const conf = Number(f.confidence);
        return {
          name: (f.name as string).trim(),
          quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
          unit: typeof f.unit === 'string' && f.unit ? f.unit : 'serving',
          confidence: Number.isFinite(conf) ? Math.max(0, Math.min(1, conf)) : 0.5,
        };
      });

    return jsonResponse({ foods });
  } catch (err) {
    console.error('analyze-food-image error:', err instanceof Error ? err.message : 'unknown');
    return jsonResponse({ error: 'Unexpected server error.' }, 500);
  }
});
