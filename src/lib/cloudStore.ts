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

import type { StreakData, ChallengeData } from '@/lib/streakService';

export type FoodListKind = 'recentFoods' | 'favoriteFoods';

export interface UserSavedData {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  profile: UserProfile | null;
  result: NutritionResult | null;
  tickedFoods?: Record<string, any>;
  streak?: StreakData;
  challenge?: ChallengeData;
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
const LOCAL_PROFILE_KEY = 'nutrisynth_active_profile';
const LOCAL_RESULT_KEY = 'nutrisynth_active_result';
const LOCAL_MEALS_KEY = 'nutrisynth_local_meals';
const LOCAL_TICKED_PREFIX = 'nutrisynth_ticked_foods_';

/** Saves the currently active user profile and computed nutrition result to local browser storage */
export function saveLocalProfileAndResult(
  profile: UserProfile | null,
  result: NutritionResult | null
): void {
  try {
    if (profile) {
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(LOCAL_PROFILE_KEY);
    }
    if (result) {
      localStorage.setItem(LOCAL_RESULT_KEY, JSON.stringify(result));
    } else {
      localStorage.removeItem(LOCAL_RESULT_KEY);
    }
  } catch (err) {
    console.warn('[NutriSynth] Error writing profile/result to local storage:', err);
  }
}

/** Loads the saved user profile and computed nutrition result from local browser storage */
export function loadLocalProfileAndResult(): {
  profile: UserProfile | null;
  result: NutritionResult | null;
} | null {
  try {
    const rawProfile = localStorage.getItem(LOCAL_PROFILE_KEY);
    const rawResult = localStorage.getItem(LOCAL_RESULT_KEY);

    if (rawProfile && rawResult) {
      return {
        profile: JSON.parse(rawProfile),
        result: JSON.parse(rawResult),
      };
    }

    // Secondary fallback: search any cached user docs in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(USER_DATA_STORAGE_PREFIX)) {
        const rawDoc = localStorage.getItem(key);
        if (rawDoc) {
          const parsed = JSON.parse(rawDoc) as UserSavedData;
          if (parsed?.profile && parsed?.result) {
            return { profile: parsed.profile, result: parsed.result };
          }
        }
      }
    }
  } catch (err) {
    console.warn('[NutriSynth] Error loading local profile/result:', err);
  }
  return null;
}

/** Loads ticked suggested food items for today */
export function loadTodaysTickedFoods<T = any>(): Record<string, T> {
  try {
    const raw = localStorage.getItem(`${LOCAL_TICKED_PREFIX}${todayKey()}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Saves ticked suggested food items for today */
export function saveTodaysTickedFoods<T = any>(ticked: Record<string, T>): void {
  try {
    localStorage.setItem(`${LOCAL_TICKED_PREFIX}${todayKey()}`, JSON.stringify(ticked));
  } catch (err) {
    console.warn('[NutriSynth] Error saving ticked foods to local storage:', err);
  }
}

interface StoredMealRecord {
  dateKey: string;
  createdAt: number;
  meal: MealItem;
}

function loadLocalMealsRaw(): StoredMealRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_MEALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalMealsRaw(records: StoredMealRecord[]): void {
  try {
    localStorage.setItem(LOCAL_MEALS_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('[NutriSynth] Failed to save meals to localStorage:', err);
  }
}

/** Saves the user's complete profile, generated nutrition plan, streak, and challenge progress */
export async function saveUserData(
  uid: string,
  data: {
    email?: string | null;
    displayName?: string | null;
    profile: UserProfile | null;
    result: NutritionResult | null;
    tickedFoods?: Record<string, any>;
    streak?: StreakData;
    challenge?: ChallengeData;
  }
): Promise<void> {
  const cleanPayload: UserSavedData = {
    uid,
    email: data.email ?? null,
    displayName: data.displayName ?? null,
    profile: data.profile ? JSON.parse(JSON.stringify(data.profile)) : null,
    result: data.result ? JSON.parse(JSON.stringify(data.result)) : null,
    tickedFoods: data.tickedFoods ? JSON.parse(JSON.stringify(data.tickedFoods)) : {},
    streak: data.streak ? JSON.parse(JSON.stringify(data.streak)) : undefined,
    challenge: data.challenge ? JSON.parse(JSON.stringify(data.challenge)) : undefined,
    updatedAt: Date.now(),
  };

  // Always save locally in case of offline or rapid retrieval
  try {
    localStorage.setItem(`${USER_DATA_STORAGE_PREFIX}${uid}`, JSON.stringify(cleanPayload));
    if (cleanPayload.profile && cleanPayload.result) {
      saveLocalProfileAndResult(cleanPayload.profile, cleanPayload.result);
    }
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
      console.warn('[NutriSynth] Could not save user data to Firestore (saved locally):', err);
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
        if (cloudData.profile && cloudData.result) {
          saveLocalProfileAndResult(cloudData.profile, cloudData.result);
        }
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

/** Saves a logged meal so it can be restored into that day's intake later. Always persists locally first. */
export async function saveMeal(meal: MealItem): Promise<void> {
  const cleanMeal: MealItem = JSON.parse(JSON.stringify(meal));
  const record: StoredMealRecord = {
    dateKey: todayKey(),
    createdAt: Date.now(),
    meal: cleanMeal,
  };

  // 1. Always save locally first so user never loses their logged intake
  const existing = loadLocalMealsRaw();
  existing.push(record);
  saveLocalMealsRaw(existing);

  // 2. Sync to Firestore if configured and ready
  try {
    const ctx = await ready();
    if (ctx) {
      await addDoc(collection(ctx.db, 'users', ctx.uid, 'meals'), record);
    }
  } catch (err) {
    console.warn('[NutriSynth] Could not save meal to Firestore (stored locally):', err);
  }
}

export async function loadTodaysMeals(): Promise<MealItem[]> {
  const currentToday = todayKey();
  // 1. Load from localStorage
  const localRecords = loadLocalMealsRaw().filter((r) => r.dateKey === currentToday);
  const localMeals = localRecords
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((r) => r.meal);

  // 2. Try Firestore if available and merge
  try {
    const ctx = await ready();
    if (ctx) {
      const snap = await getDocs(
        query(collection(ctx.db, 'users', ctx.uid, 'meals'), where('dateKey', '==', currentToday))
      );
      if (!snap.empty) {
        const cloudRecords = snap.docs.map((d) => d.data() as StoredMealRecord);
        const sig = (m: MealItem) => `${m?.name || ''}|${m?.food || ''}|${m?.details?.calories ?? 0}`;
        const seen = new Set(localMeals.map(sig));
        const merged = [...localMeals];

        cloudRecords
          .sort((a, b) => a.createdAt - b.createdAt)
          .forEach((rec) => {
            if (rec?.meal && !seen.has(sig(rec.meal))) {
              seen.add(sig(rec.meal));
              merged.push(rec.meal);
            }
          });
        return merged;
      }
    }
  } catch (err) {
    console.warn('[NutriSynth] Could not load meals from Firestore, using local records:', err);
  }

  return localMeals;
}

// -------------------------------------------------------------
// Network Retry Helper (resilient error handling)
// -------------------------------------------------------------
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2, delayMs = 300): Promise<T> {
  let lastErr: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
      }
    }
  }
  throw lastErr;
}

// -------------------------------------------------------------
// Weight Logs (Analytics & Trajectory)
// -------------------------------------------------------------
export interface WeightLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  notes?: string;
  recordedAt: number;
}

const LOCAL_WEIGHT_PREFIX = 'nutrisynth_weights_';

export async function saveWeightLog(entry: WeightLogEntry): Promise<void> {
  // Save locally first
  const existing = loadWeightLogsLocal();
  const filtered = existing.filter((e) => e.id !== entry.id && e.date !== entry.date);
  const updated = [entry, ...filtered].sort((a, b) => b.recordedAt - a.recordedAt);
  localStorage.setItem(LOCAL_WEIGHT_PREFIX, JSON.stringify(updated));

  // Sync to Firestore if available
  try {
    const ctx = await ready();
    if (ctx) {
      await withRetry(() =>
        setDoc(doc(ctx.db, 'users', ctx.uid, 'weightLogs', entry.id), entry, { merge: true })
      );
    }
  } catch (err) {
    console.warn('[NutriSynth] Could not sync weight log to Firestore:', err);
  }
}

export function loadWeightLogsLocal(): WeightLogEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_WEIGHT_PREFIX);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Default sample history if empty so graphs look great immediately
  const now = new Date();
  const samples: WeightLogEntry[] = [
    { id: 'w1', date: new Date(now.getTime() - 21 * 86400000).toISOString().split('T')[0], weightKg: 78.4, recordedAt: now.getTime() - 21 * 86400000 },
    { id: 'w2', date: new Date(now.getTime() - 14 * 86400000).toISOString().split('T')[0], weightKg: 77.8, recordedAt: now.getTime() - 14 * 86400000 },
    { id: 'w3', date: new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0], weightKg: 77.1, recordedAt: now.getTime() - 7 * 86400000 },
    { id: 'w4', date: now.toISOString().split('T')[0], weightKg: 76.5, notes: 'Feeling energized!', recordedAt: now.getTime() },
  ];
  return samples;
}

export async function loadWeightLogs(): Promise<WeightLogEntry[]> {
  try {
    const ctx = await ready();
    if (ctx) {
      const snap = await getDocs(
        query(collection(ctx.db, 'users', ctx.uid, 'weightLogs'), orderBy('date', 'desc'), limit(30))
      );
      if (!snap.empty) {
        const cloudLogs = snap.docs.map((d) => d.data() as WeightLogEntry);
        localStorage.setItem(LOCAL_WEIGHT_PREFIX, JSON.stringify(cloudLogs));
        return cloudLogs;
      }
    }
  } catch (err) {
    console.warn('[NutriSynth] Cloud weight fetch error, using local:', err);
  }
  return loadWeightLogsLocal();
}

export async function deleteWeightLog(id: string): Promise<void> {
  const existing = loadWeightLogsLocal();
  const updated = existing.filter((e) => e.id !== id);
  localStorage.setItem(LOCAL_WEIGHT_PREFIX, JSON.stringify(updated));

  try {
    const ctx = await ready();
    if (ctx) {
      await deleteDoc(doc(ctx.db, 'users', ctx.uid, 'weightLogs', id));
    }
  } catch (err) {
    console.warn('[NutriSynth] Cloud weight delete error:', err);
  }
}

// -------------------------------------------------------------
// Smart Grocery List
// -------------------------------------------------------------
export interface GroceryItem {
  id: string;
  name: string;
  category: 'produce' | 'protein' | 'dairy' | 'grains' | 'pantry' | 'other';
  amount?: string;
  checked: boolean;
  addedAt: number;
}

const LOCAL_GROCERY_PREFIX = 'nutrisynth_grocery_';

export function loadGroceryItemsLocal(): GroceryItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_GROCERY_PREFIX);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Default initial high-protein grocery list
  return [
    { id: 'g1', name: 'Baby Spinach & Kale', category: 'produce', amount: '250g', checked: false, addedAt: Date.now() - 3000 },
    { id: 'g2', name: 'Greek Yogurt (0% fat)', category: 'dairy', amount: '500g', checked: false, addedAt: Date.now() - 2500 },
    { id: 'g3', name: 'Organic Rolled Oats', category: 'grains', amount: '1 kg', checked: true, addedAt: Date.now() - 2000 },
    { id: 'g4', name: 'Skinless Chicken Breast / Extra Firm Tofu', category: 'protein', amount: '600g', checked: false, addedAt: Date.now() - 1500 },
    { id: 'g5', name: 'Extra Virgin Olive Oil', category: 'pantry', amount: '500 ml', checked: true, addedAt: Date.now() - 1000 },
    { id: 'g6', name: 'Blueberries & Raspberries', category: 'produce', amount: '200g', checked: false, addedAt: Date.now() - 500 },
  ];
}

export async function saveGroceryItems(items: GroceryItem[]): Promise<void> {
  localStorage.setItem(LOCAL_GROCERY_PREFIX, JSON.stringify(items));
  try {
    const ctx = await ready();
    if (ctx) {
      await setDoc(doc(ctx.db, 'users', ctx.uid, 'grocery', 'current'), {
        items,
        updatedAt: Date.now(),
      });
    }
  } catch (err) {
    console.warn('[NutriSynth] Could not sync grocery list to Firestore:', err);
  }
}

// -------------------------------------------------------------
// User SaaS Preferences & Settings
// -------------------------------------------------------------
export interface UserPreferences {
  diet: string;
  allergies: string[];
  budget: 'economy' | 'moderate' | 'premium';
  cookingTimeMaxMinutes: number;
  macroSplit?: { proteinPct: number; carbPct: number; fatPct: number };
  waterTargetMl: number;
  units: 'metric' | 'imperial';
  notificationsEnabled: boolean;
}

const LOCAL_PREFS_KEY = 'nutrisynth_user_preferences';

export function loadUserPreferencesLocal(): UserPreferences {
  try {
    const raw = localStorage.getItem(LOCAL_PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    diet: 'veg',
    allergies: [],
    budget: 'moderate',
    cookingTimeMaxMinutes: 30,
    macroSplit: { proteinPct: 30, carbPct: 45, fatPct: 25 },
    waterTargetMl: 2500,
    units: 'metric',
    notificationsEnabled: true,
  };
}

export async function saveUserPreferences(prefs: UserPreferences): Promise<void> {
  localStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(prefs));
  try {
    const ctx = await ready();
    if (ctx) {
      await setDoc(doc(ctx.db, 'users', ctx.uid, 'preferences', 'settings'), prefs, { merge: true });
    }
  } catch (err) {
    console.warn('[NutriSynth] Could not sync preferences to Firestore:', err);
  }
}
