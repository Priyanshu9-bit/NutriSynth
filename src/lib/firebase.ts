// Firebase (Spark / free plan): Authentication (anonymous) + Firestore.
//
// The Firebase web config below is public by design — it identifies your
// project, it does not grant access. Access is enforced by Firestore
// Security Rules (see firestore.rules): each person can only read/write
// documents under users/{their own uid}.
//
// Third-party API secrets (Gemini / USDA / Edamam) are NOT here — they stay
// in Supabase Edge Function secrets. (Calling external APIs from Firebase
// Cloud Functions needs the paid Blaze plan, so we don't use them.)

import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

let auth: Auth | null = null;
export let firestore: Firestore | null = null;

if (isFirebaseConfigured) {
  const app = initializeApp(config);
  auth = getAuth(app);
  firestore = getFirestore(app);
}

let uidPromise: Promise<string | null> | null = null;

/** Resolves to the signed-in (anonymous) user's uid, or null if Firebase is unavailable. */
export function getUserId(): Promise<string | null> {
  const a = auth;
  if (!a) return Promise.resolve(null);
  if (!uidPromise) {
    uidPromise = new Promise<string | null>((resolve) => {
      const unsubscribe = onAuthStateChanged(a, (user) => {
        if (user) {
          unsubscribe();
          resolve(user.uid);
        } else {
          signInAnonymously(a).catch((err) => {
            console.warn('[NutriSynth] Firebase anonymous sign-in failed (is Anonymous auth enabled?).', err);
            unsubscribe();
            uidPromise = null;
            resolve(null);
          });
        }
      });
    });
  }
  return uidPromise;
}
