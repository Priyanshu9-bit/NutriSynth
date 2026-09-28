// Supabase client.
//
// Only the project URL and public anon key live in the frontend — both are
// safe to expose by design (Supabase's anon key is meant to be public; it
// has no access beyond what Row Level Security and Edge Function logic
// allow). GEMINI_API_KEY, USDA_API_KEY, EDAMAM_APP_ID/KEY are never read
// here — they live only as Supabase Edge Function secrets on the server.
// See supabase/functions/ and NUTRITION_SETUP.md.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null;

if (!isSupabaseConfigured && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.info(
    '[NutriSynth] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set — ' +
      'Scan/Search/Enter Food will use the bundled local database instead of ' +
      'USDA/Edamam/Gemini. See NUTRITION_SETUP.md to connect real providers.'
  );
}
