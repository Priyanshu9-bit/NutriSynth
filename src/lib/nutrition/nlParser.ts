// Natural-language meal parser.
//
// Turns free text like "2 eggs, 1 cup rice and 100g paneer" into individual
// food entries with a quantity and unit. This is intentionally a light
// heuristic parser (no external NLP service) — good enough to split a
// meal description into candidates, which are then resolved against real
// nutrition data by the provider layer. It never guesses nutrition values.

import { normalizeUnit } from './units';

export interface ParsedFoodEntry {
  rawText: string;
  food: string;
  quantity: number;
  unit: string;
}

const NUMBER_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10, half: 0.5,
};

const UNIT_WORDS = [
  'kilograms', 'kilogram', 'kg',
  'grams', 'gram', 'gm', 'gms', 'g',
  'litres', 'liters', 'litre', 'liter', 'l',
  'millilitres', 'milliliters', 'millilitre', 'milliliter', 'ml',
  'cups', 'cup',
  'tablespoons', 'tablespoon', 'tbsp',
  'teaspoons', 'teaspoon', 'tsp',
  'pieces', 'piece', 'pcs', 'pc',
  'slices', 'slice',
  'bowls', 'bowl',
  'plates', 'plate',
  'servings', 'serving',
];

// Longest-unit-first so "kg" doesn't get matched by a shorter "g" alternative, etc.
const UNIT_PATTERN = UNIT_WORDS.sort((a, b) => b.length - a.length).join('|');
const NUMBER_PATTERN = Object.keys(NUMBER_WORDS).sort((a, b) => b.length - a.length).join('|');

const ENTRY_RE = new RegExp(
  `^\\s*(\\d+(?:[./]\\d+)?|${NUMBER_PATTERN})?\\s*(${UNIT_PATTERN})?\\s*(?:of\\s+)?(.+?)\\s*$`,
  'i'
);

function parseNumber(raw: string | undefined): number {
  if (!raw) return 1;
  if (raw.includes('/')) {
    const [n, d] = raw.split('/').map(Number);
    return d ? n / d : 1;
  }
  if (/^\d+(\.\d+)?$/.test(raw)) return parseFloat(raw);
  return NUMBER_WORDS[raw.toLowerCase()] ?? 1;
}

/** Splits a free-text meal description into individual, best-effort food entries. */
export function parseMealText(text: string): ParsedFoodEntry[] {
  const segments = text
    .split(/,|\band\b|\n|\+|&/gi)
    .map((s) => s.trim())
    .filter(Boolean);

  return segments
    .map((segment): ParsedFoodEntry => {
      const match = segment.match(ENTRY_RE);
      if (!match || !match[3]) {
        return { rawText: segment, food: segment, quantity: 1, unit: 'serving' };
      }
      const [, qtyRaw, unitRaw, foodRaw] = match;
      return {
        rawText: segment,
        food: foodRaw.trim(),
        quantity: parseNumber(qtyRaw),
        unit: unitRaw ? normalizeUnit(unitRaw) : 'serving',
      };
    })
    .filter((e) => e.food.length > 0);
}
