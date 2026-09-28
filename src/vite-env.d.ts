/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public Supabase project URL — safe to expose client-side. */
  readonly VITE_SUPABASE_URL?: string;
  /** Public Supabase anon key — safe to expose client-side. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Public Firebase web config — safe to expose (access is enforced by firestore.rules). */
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
}

