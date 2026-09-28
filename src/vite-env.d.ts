/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public Firebase web config — safe to expose (access is enforced by firestore.rules). */
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
}
