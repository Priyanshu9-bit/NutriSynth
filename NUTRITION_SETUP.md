# NutriSynth Nutrition System — Setup Guide

Three entry points — **Scan Food**, **Search Food**, **Enter Food** — all use one
calculation path and add to the existing daily intake (`onAddScannedMeal`).

## Architecture
```
React (NutritionHub)
 ├─ Scan   → analyze-food-image (Edge Fn) → Gemini Vision (identify only)
 ├─ Search → search-food (Edge Fn)        → USDA, Edamam fallback
 └─ Enter  → nlParser → search-food
              ↓
   normalizeFoodName → get-food-nutrition (Edge Fn) → USDA | Edamam
              ↓
   src/lib/nutrition/provider.ts (scaledNutrients / totalsFor / toMealItem)
              ↓
   Dashboard daily intake (existing state)
```
Gemini never supplies calories. If Supabase isn't configured or a call fails, the
app falls back to the bundled local food database (labelled "NutriSynth database").

## 1. API keys
| Service | Get it at | Secret name |
|---|---|---|
| Gemini | https://aistudio.google.com/apikey | `GEMINI_API_KEY` |
| USDA FoodData Central | https://fdc.nal.usda.gov/api-key-signup | `USDA_API_KEY` |
| Edamam Food Database | https://developer.edamam.com | `EDAMAM_APP_ID`, `EDAMAM_APP_KEY` |

Edamam is optional (fallback only). Never put these in `.env` or any `VITE_*` var.

## 2. Supabase setup
```bash
npm install -g supabase            # or: npx supabase ...
supabase login
supabase link --project-ref YOUR-PROJECT-REF
supabase secrets set GEMINI_API_KEY=... USDA_API_KEY=... EDAMAM_APP_ID=... EDAMAM_APP_KEY=...
supabase functions deploy analyze-food-image
supabase functions deploy search-food
supabase functions deploy get-food-nutrition
```

## 3. Local development
```bash
cp .env.example .env               # fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
# Optional: serve functions locally
supabase secrets set --env-file ./supabase/.env.local   # or: supabase functions serve --env-file ./supabase/.env.local
```
Camera needs HTTPS or `localhost`.

## 4. Production
Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your host's build env, then `npm run build`.

## Limitations
- Not yet built/tested end-to-end: the authoring sandbox had no network or `node_modules`. Run `npm install && npm run build` and fix any leftovers.
- Edge Functions have `verify_jwt = false` (app has no auth). Add JWT verification and rate limiting before public launch, since they spend your API quota.
- Edamam returns 100 g servings only; USDA uses real household measures when one matches the unit.
- Natural-language parsing is heuristic ("2 eggs" = 2 × the matched serving).
- Recent foods use localStorage (per device); Favorites logic exists in `src/lib/recentFoods.ts` but has no UI yet.
- No dashboard count-up animation or `prefers-reduced-motion` audit yet.

## Free-tier setup (all $0)
| Need | Get it | Notes |
|---|---|---|
| USDA FoodData Central | https://fdc.nal.usda.gov/api-key-signup | Free, ~1,000 requests/hour. Don't use `DEMO_KEY` (about 30/hour). |
| Gemini (photo scan) | https://aistudio.google.com/apikey | Free tier: Flash / Flash-Lite models only, roughly 1,000 requests/day and 5-15/minute (check AI Studio for your project's real limits). Free-tier data may be used by Google to improve products; enable billing before real users upload photos. |
| Supabase | https://supabase.com | Free plan: 500,000 Edge Function invocations/month. Projects pause after 7 days idle. |
| Edamam | optional | Skip it; the app works with USDA alone. |

Minimum secrets: `supabase secrets set GEMINI_API_KEY=... USDA_API_KEY=...`

The Edge Function defaults to the `gemini-3.1-flash-lite` model. Override with
`supabase secrets set GEMINI_MODEL=<model-id>` if Google retires it.
Identical searches/food lookups are cached in memory per session to save USDA requests.

Pricing and limits change; verify on each provider's pricing page.

## Firebase (Firestore + anonymous Auth) — free Spark plan
Stores per-user data: recent foods, favorite foods, and logged meals (restored
into today's intake when you reopen the dashboard). Falls back to localStorage /
in-memory state when Firebase isn't configured.

1. https://console.firebase.google.com -> Add project (Spark plan, no card needed).
2. Build -> Authentication -> Get started -> Sign-in method -> enable **Anonymous**.
3. Build -> Firestore Database -> Create database (production mode, any region).
4. Project settings -> Your apps -> Web (`</>`) -> copy `firebaseConfig` values into `.env`
   (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`).
5. Deploy the security rules:
```bash
npm install -g firebase-tools
firebase login
firebase use YOUR-PROJECT-ID
firebase deploy --only firestore:rules
```
Spark free quota (Firestore): 1 GiB storage, 50,000 reads/day, 20,000 writes/day.
Data is keyed to an anonymous per-browser account, so clearing site data loses access to it
(add Google sign-in later to carry it across devices).
Secrets for Gemini/USDA stay in Supabase Edge Functions — Firebase Cloud Functions
would need the paid Blaze plan to call outside APIs.
