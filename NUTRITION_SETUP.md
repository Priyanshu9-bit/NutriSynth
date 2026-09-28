# NutriSynth

Track nutrition by **scanning**, **searching**, or **typing** your food. All three feed the same daily intake.

- **Scan:** Gemini identifies the food from a photo (it never supplies calories)
- **Search / Enter:** USDA FoodData Central provides the nutrition data
- **Fallback:** a bundled local food database when the network or Supabase is unavailable
- **Optional:** Firebase saves recents, favorites, and logged meals

## Setup
Get free [USDA](https://fdc.nal.usda.gov/api-key-signup) and [Gemini](https://aistudio.google.com/apikey) keys, store them as Supabase secrets, and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`. The camera needs HTTPS or `localhost`.

## Notes
Not yet tested end-to-end. Add auth and rate limiting before a public launch.
