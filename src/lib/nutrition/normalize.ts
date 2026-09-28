// Food name normalization.
//
// Names coming from Gemini Vision or typed by the user ("cooked white rice",
// "Indian lentil curry") rarely match a nutrition database's canonical name
// exactly. This layer cleans up formatting and maps a small set of common
// aliases so the search layer gets a better query — it does not invent or
// guess nutrition data, only improves the text sent to search.

const ALIASES: Record<string, string> = {
  'cooked white rice': 'rice',
  'white rice': 'rice',
  'steamed rice': 'rice',
  'indian lentil curry': 'dal',
  'lentil curry': 'dal',
  'lentils': 'dal',
  'indian flatbread': 'roti',
  'chapati': 'roti',
  'chapatti': 'roti',
  'flatbread': 'roti',
  'chicken breast grilled': 'grilled chicken breast',
  'grilled chicken': 'grilled chicken breast',
  'curd': 'yogurt',
  'dahi': 'yogurt',
  'egg': 'egg, whole, cooked',
  'eggs': 'egg, whole, cooked',
  'toast': 'bread, toasted',
};

/** Lowercases, trims punctuation/whitespace, strips cooking-method noise, and applies known aliases. */
export function normalizeFoodName(raw: string): string {
  let s = raw
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:()]/g, '')
    .replace(/\s+/g, ' ');

  s = s
    .replace(/\b(cooked|boiled|steamed|fresh|homemade|plain|raw)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return ALIASES[s] ?? s;
}
