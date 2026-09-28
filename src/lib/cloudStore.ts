// Firestore persistence: recent foods, favorite foods, and the logged-meal history.
// Every function is best-effort — if Firebase isn't configured or a request
// fails, it logs a warning and the app keeps working from local state.

import {
  addDoc, collection, deleteDoc, doc, getDocs, limit, orderBy, query, setDoc, where,
} from 'firebase/firestore';
import type { MealItem } from '@/lib/calculations';
import { firestore, getUserId, isFirebaseConfigured } from '@/lib/firebase';
import type { FoodEntry } from '@/lib/recentFoods';

export type FoodListKind = 'recentFoods' | 'favoriteFoods';

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
