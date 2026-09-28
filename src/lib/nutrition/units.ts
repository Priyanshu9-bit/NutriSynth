// Unit conversion and portion math.
//
// Not every food converts "1 cup" the same way, so we deliberately do NOT
// hard-code a cup/tbsp/piece -> grams table for arbitrary foods. Instead:
//  - When the caller gives a weight/volume unit (g/kg/ml/l) and the matched
//    food's serving has a known gram weight, we scale by weight.
//  - Otherwise we treat the caller's quantity as a direct multiple of
//    whatever serving the provider returned (e.g. "2 rotis" against a food
//    whose serving is "1 piece" -> multiplier 2). This matches how the
//    existing local database already works (adjustable "servings").

import type { FoodServing } from './types';

const UNIT_ALIASES: Record<string, string> = {
  gram: 'g', grams: 'g', gm: 'g', gms: 'g',
  kilogram: 'kg', kilograms: 'kg',
  millilitre: 'ml', milliliter: 'ml', millilitres: 'ml', milliliters: 'ml',
  litre: 'l', liter: 'l', litres: 'l', liters: 'l',
  cup: 'cup', cups: 'cup',
  tablespoon: 'tbsp', tablespoons: 'tbsp', tbsp: 'tbsp', tbs: 'tbsp',
  teaspoon: 'tsp', teaspoons: 'tsp', tsp: 'tsp',
  piece: 'piece', pieces: 'piece', pc: 'piece', pcs: 'piece',
  slice: 'slice', slices: 'slice',
  bowl: 'bowl', bowls: 'bowl',
  plate: 'plate', plates: 'plate',
  serving: 'serving', servings: 'serving',
  medium: 'piece', large: 'piece', small: 'piece',
};

/** Normalizes unit spelling/plurals to a canonical short form. */
export function normalizeUnit(raw: string): string {
  const u = raw.trim().toLowerCase();
  return UNIT_ALIASES[u] ?? u;
}

/**
 * Converts a quantity+unit (e.g. "200g", "2 cups") into a multiplier against
 * the food's own serving. Falls back to treating the quantity itself as the
 * multiplier when we can't do weight-based math.
 */
export function computeMultiplier(quantity: number, unit: string, serving: FoodServing): number {
  const u = normalizeUnit(unit);
  if ((u === 'g' || u === 'kg') && serving.grams) {
    const grams = u === 'kg' ? quantity * 1000 : quantity;
    return grams / serving.grams;
  }
  return quantity > 0 ? quantity : 1;
}

/** A sensible +/- step for the portion stepper, scaled to the serving size. */
export function portionStep(serving: FoodServing): number {
  if (serving.grams && serving.grams >= 50) return 25 / serving.grams;
  return 0.5;
}

export function formatQuantity(n: number): string {
  return Number.isInteger(n) ? `${n}` : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}
