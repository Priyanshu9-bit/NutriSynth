// Firestore persistence: user profiles, calculated plans, recent foods, and meal logs.
// Supports both cloud sync via Firebase Firestore and local browser storage fallback.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import type { MealItem, NutritionResult, UserProfile } from '@/lib/calculations';
import { firestore, getUserId, isFirebaseConfigured } from '@/lib/firebase';
import type { FoodEntry } from '@/lib/recentFoods';

export type FoodListKind = 'recentFoods' | 'favoriteFoods';

export interface UserSavedData {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  profile: UserProfile | null;
  result: NutritionResult | null;
  tickedFoods?: Record<string, any>;
  updatedAt: number;
}

/** Local calendar date, e.g. "2026-09-28" — used to group meals by day. */
export function todayKey(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

async function ready() {
  if (!isFirebaseConfigured || !firestore) return null;
  const uid = await getUserId();
  return uid ? { db: firestore, uid } : null;
}

// -------------------------------------------------------------
// User Profile & Nutrition Plan Persistence
// -------------------------------------------------------------

const USER_DATA_STORAGE_PREFIX = 'nutrisynth_user_doc_';

/** Saves the user's complete profile and generated nutrition plan */
export async function saveUserData(
  uid: string,
  data: {
    email?: string | null;
    displayName?: string | null;
    profile: UserProfile | null;
    result: NutritionResult | null;
    tickedFoods?: Record<string, any>;
  }
): Promise<void> {
  const cleanPayload: UserSavedData = {
    uid,
    email: data.email ?? null,
    displayName: data.displayName ?? null,
    profile: data.profile ? JSON.parse(JSON.stringify(data.profile)) : null,
    result: data.result ? JSON.parse(JSON.stringify(data.result)) : null,
    tickedFoods: data.tickedFoods ? JSON.parse(JSON.stringify(data.tickedFoods)) : {},
    updatedAt: Date.now(),
  };

  // Always save locally in case of offline or rapid retrieval
  try {
    localStorage.setItem(`${USER_DATA_STORAGE_PREFIX}${uid}`, JSON.stringify(cleanPayload));
  } catch (err) {
    console.warn('[NutriSynth] Local storage write error:', err);
  }

  // Save to Firebase Firestore if configured
  if (isFirebaseConfigured && firestore) {
    try {
      const userRef = doc(firestore, 'users', uid);
      await setDoc(userRef, cleanPayload, { merge: true });
      console.log(`[NutriSynth] Saved profile & plan to Firestore for user: ${uid}`);
    } catch (err) {
      console.warn('[NutriSynth] Could not save user data to Firestore:', err);
    }
  }
}

/** Loads the user's complete profile, generated plan, and ticked foods */
export async function loadUserData(uid: string): Promise<UserSavedData | null> {
  // Try Firestore first if configured
  if (isFirebaseConfigured && firestore) {
    try {
      const userRef = doc(firestore, 'users', uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const cloudData = snap.data() as UserSavedData;
        // Keep local cache synced
        localStorage.setItem(`${USER_DATA_STORAGE_PREFIX}${uid}`, JSON.stringify(cloudData));
        return cloudData;
      }
    } catch (err) {
      console.warn('[NutriSynth] Could not fetch user data from Firestore, checking local cache:', err);
    }
  }

  // Fallback to local storage
  try {
    const raw = localStorage.getItem(`${USER_DATA_STORAGE_PREFIX}${uid}`);
    if (raw) {
      return JSON.parse(raw) as UserSavedData;
    }
  } catch (err) {
    console.warn('[NutriSynth] Local storage read error:', err);
  }

  return null;
}

// -------------------------------------------------------------
// Food & Meal Lists Persistence
// -------------------------------------------------------------

export async function saveFoodEntry(kind: FoodListKind, entry: FoodEntry): Promise<void> {
  try {
    const ctx = await ready();
    if (!ctx) return;
    await setDoc(doc(ctx.db, 'users', ctx.uid, kind, encodeURIComponent(entry.id)), entry);
  } catch (err) {
    console.warn('[NutriSynth] Could not save to Firestore.', err);
  }
}

export async function deleteFoodEntry(kind: FoodListKind, id: string): Promise<void> {
  try {
    const ctx = await ready();
    if (!ctx) return;
    await deleteDoc(doc(ctx.db, 'users', ctx.uid, kind, encodeURIComponent(id)));
  } catch (err) {
    console.warn('[NutriSynth] Could not delete from Firestore.', err);
  }
}

export async function loadFoodEntries(kind: FoodListKind, max = 12): Promise<FoodEntry[]> {
  try {
    const ctx = await ready();
    if (!ctx) return [];
    const snap = await getDocs(
      query(collection(ctx.db, 'users', ctx.uid, kind), orderBy('addedAt', 'desc'), limit(max))
    );
    return snap.docs.map((d) => d.data() as FoodEntry);
  } catch (err) {
    console.warn('[NutriSynth] Could not load from Firestore.', err);
    return [];
  }
}

/** Saves a logged meal so it can be restored into that day's intake later. */
export async function saveMeal(meal: MealItem): Promise<void> {
  try {
    const ctx = await ready();
    if (!ctx) return;
    await addDoc(collection(ctx.db, 'users', ctx.uid, 'meals'), {
      dateKey: todayKey(),
      createdAt: Date.now(),
      // JSON round-trip strips any undefined fields, which Firestore rejects.
      meal: JSON.parse(JSON.stringify(meal)),
    });
  } catch (err) {
    console.warn('[NutriSynth] Could not save meal to Firestore.', err);
  }
}

export async function loadTodaysMeals(): Promise<MealItem[]> {
  try {
    const ctx = await ready();
    if (!ctx) return [];
    const snap = await getDocs(
      query(collection(ctx.db, 'users', ctx.uid, 'meals'), where('dateKey', '==', todayKey()))
    );
    return snap.docs
      .map((d) => d.data() as { createdAt: number; meal: MealItem })
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((d) => d.meal);
  } catch (err) {
    console.warn('[NutriSynth] Could not load meals from Firestore.', err);
    return [];
  }
}
