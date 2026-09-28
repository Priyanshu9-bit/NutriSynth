// Micronutrient RDI table — preserved & expanded from original NutriSynth
// Sources: ICMR-NIN RDA, NIH ODS, National Academies DRI, WHO

export type LifeStage = "child" | "teen" | "adult" | "older";
export type Gender = "male" | "female" | "other";

export interface NutrientRDI {
  calcium: number;
  iron: number;
  vitaminC: number;
  vitaminD: number;
  folate: number;
  vitaminB12: number;
  vitaminA: number;
  vitaminE: number;
  vitaminK: number;
  zinc: number;
  magnesium: number;
  iodine: number;
  selenium: number;
  potassium: number;
  protein: number;
  fiber: number;
}

interface NutrientTable {
  [nutrient: string]: {
    male: Partial<Record<LifeStage | "all", number>>;
    female: Partial<Record<LifeStage | "all", number>> & { pregnancy?: number; lactation?: number };
  };
}

const table: NutrientTable = {
  calcium:    { male: { child: 700, teen: 1000, adult: 1000, older: 1200 }, female: { child: 700, teen: 1000, adult: 1000, older: 1200, pregnancy: 1000, lactation: 1000 } },
  iron:       { male: { child: 7, teen: 11, adult: 8, older: 8 }, female: { child: 7, teen: 15, adult: 18, older: 8, pregnancy: 27, lactation: 9 } },
  vitaminC:   { male: { child: 40, teen: 65, adult: 90, older: 90 }, female: { child: 40, teen: 65, adult: 75, older: 75, pregnancy: 85, lactation: 120 } },
  vitaminD:   { male: { all: 600 }, female: { all: 600, pregnancy: 600, lactation: 600 } },
  folate:     { male: { all: 400 }, female: { all: 400, pregnancy: 600, lactation: 500 } },
  vitaminB12: { male: { all: 2.4 }, female: { all: 2.4, pregnancy: 2.6, lactation: 2.8 } },
  vitaminA:   { male: { child: 400, teen: 600, adult: 900, older: 900 }, female: { child: 400, teen: 600, adult: 700, older: 700, pregnancy: 770, lactation: 1300 } },
  vitaminE:   { male: { all: 15 }, female: { all: 15, pregnancy: 15, lactation: 19 } },
  vitaminK:   { male: { child: 55, teen: 75, adult: 120, older: 120 }, female: { child: 55, teen: 75, adult: 90, older: 90, pregnancy: 90, lactation: 90 } },
  zinc:       { male: { child: 5, teen: 11, adult: 11, older: 11 }, female: { child: 5, teen: 9, adult: 8, older: 8, pregnancy: 11, lactation: 12 } },
  magnesium:  { male: { child: 130, teen: 240, adult: 400, older: 420 }, female: { child: 130, teen: 240, adult: 310, older: 320, pregnancy: 350, lactation: 310 } },
  iodine:     { male: { all: 150 }, female: { all: 150, pregnancy: 220, lactation: 290 } },
  selenium:   { male: { all: 55 }, female: { all: 55, pregnancy: 60, lactation: 70 } },
  potassium:  { male: { all: 3400 }, female: { all: 2600, pregnancy: 2900, lactation: 2500 } },
  protein:    { male: { child: 19, teen: 52, adult: 56, older: 56 }, female: { child: 19, teen: 46, adult: 46, older: 46, pregnancy: 71, lactation: 71 } },
  fiber:      { male: { all: 38 }, female: { all: 25, pregnancy: 28, lactation: 29 } },
};

export function getLifeStage(age: number): LifeStage {
  if (age < 13) return "child";
  if (age < 18) return "teen";
  if (age < 51) return "adult";
  return "older";
}

export function rdiTable(age: number, gender: Gender, femaleState: string = "none"): NutrientRDI {
  const bucket = getLifeStage(age);
  const out = {} as NutrientRDI;
  for (const nutrient in table) {
    const set = table[nutrient][gender] ?? table[nutrient]["male"];
    let value = set[bucket] ?? set["all"] ?? set["adult"] ?? 0;
    if (gender === "female" && femaleState === "pregnancy" && set.pregnancy !== undefined) value = set.pregnancy;
    if (gender === "female" && femaleState === "lactation" && set.lactation !== undefined) value = set.lactation;
    (out as Record<string, number>)[nutrient] = value;
  }
  return out;
}

export interface NutrientInfo {
  key: string;
  label: string;
  unit: string;
  category: "vitamin" | "mineral" | "macro";
  desc: string;
}

export const nutrientInfo: NutrientInfo[] = [
  { key: "vitaminB12", label: "Vitamin B12", unit: "µg", category: "vitamin", desc: "Essential for nerve function and red blood cell formation. Found primarily in animal products." },
  { key: "iron", label: "Iron", unit: "mg", category: "mineral", desc: "Critical for oxygen transport. Requirements are higher for menstruating women." },
  { key: "vitaminD", label: "Vitamin D", unit: "IU", category: "vitamin", desc: "Supports bone health and immune function. Mainly obtained through sun exposure; few foods naturally contain it." },
  { key: "calcium", label: "Calcium", unit: "mg", category: "mineral", desc: "Essential for bone health, muscle function, and nerve signaling." },
  { key: "folate", label: "Folate", unit: "µg", category: "vitamin", desc: "Important for DNA synthesis. Requirements increase significantly during pregnancy." },
  { key: "vitaminA", label: "Vitamin A", unit: "µg RAE", category: "vitamin", desc: "Supports vision, immune function, and skin health." },
  { key: "vitaminC", label: "Vitamin C", unit: "mg", category: "vitamin", desc: "Antioxidant that supports immune function and enhances iron absorption." },
  { key: "vitaminE", label: "Vitamin E", unit: "mg", category: "vitamin", desc: "Antioxidant that protects cells from oxidative damage." },
  { key: "vitaminK", label: "Vitamin K", unit: "µg", category: "vitamin", desc: "Essential for blood clotting and bone metabolism." },
  { key: "zinc", label: "Zinc", unit: "mg", category: "mineral", desc: "Supports immune function, wound healing, and protein synthesis." },
  { key: "magnesium", label: "Magnesium", unit: "mg", category: "mineral", desc: "Involved in 300+ enzymatic reactions including energy production and muscle function." },
  { key: "iodine", label: "Iodine", unit: "µg", category: "mineral", desc: "Essential for thyroid hormone production. Critical during pregnancy." },
  { key: "selenium", label: "Selenium", unit: "µg", category: "mineral", desc: "Antioxidant mineral important for thyroid function." },
  { key: "potassium", label: "Potassium", unit: "mg", category: "mineral", desc: "Important for blood pressure regulation and nerve function." },
  { key: "protein", label: "Protein", unit: "g", category: "macro", desc: "Essential for muscle maintenance, enzymes, and immune function." },
  { key: "fiber", label: "Fiber", unit: "g", category: "macro", desc: "Supports digestive health, blood sugar control, and heart health." },
];

// Deficiency status levels
export type DeficiencyStatus = "met" | "low" | "attention" | "insufficient-data" | "professional";

export interface DeficiencyResult {
  nutrient: string;
  label: string;
  unit: string;
  rdi: number;
  estimatedIntake: number;
  status: DeficiencyStatus;
  statusLabel: string;
  statusColor: string;
  reason: string;
  foodSources: string[];
  note: string;
}

export function getDeficiencyStatus(intake: number, rdi: number): DeficiencyStatus {
  if (intake === 0) return "insufficient-data";
  const ratio = intake / rdi;
  if (ratio >= 0.9) return "met";
  if (ratio >= 0.6) return "low";
  return "attention";
}

export function getStatusLabel(status: DeficiencyStatus): string {
  switch (status) {
    case "met": return "Target appears met";
    case "low": return "Potential low intake";
    case "attention": return "Attention needed";
    case "insufficient-data": return "Insufficient data";
    case "professional": return "Professional review recommended";
  }
}

export function getStatusColor(status: DeficiencyStatus): string {
  switch (status) {
    case "met": return "success";
    case "low": return "warning";
    case "attention": return "error";
    case "insufficient-data": return "info";
    case "professional": return "error";
  }
}

export const deficiencyFoodSources: Record<string, string[]> = {
  vitaminB12: ["Fish", "Eggs", "Dairy", "Fortified cereals", "Fortified nutritional yeast"],
  iron: ["Red meat", "Spinach", "Lentils", "Rajma", "Jaggery", "Sesame seeds"],
  vitaminD: ["Sunlight exposure", "Fortified milk", "Fish", "Egg yolks"],
  calcium: ["Dairy", "Ragi", "Sesame seeds", "Leafy greens", "Tofu", "Fortified plant beverages"],
  folate: ["Leafy greens", "Lentils", "Rajma", "Citrus fruits", "Sprouts"],
  vitaminA: ["Carrots", "Sweet potato", "Spinach", "Mango", "Pumpkin"],
  vitaminC: ["Citrus fruits", "Amla", "Bell peppers", "Guava", "Tomato"],
  vitaminE: ["Almonds", "Sunflower seeds", "Spinach", "Wheat germ oil"],
  vitaminK: ["Leafy greens", "Broccoli", "Brussels sprouts"],
  zinc: ["Meat", "Pumpkin seeds", "Lentils", "Chickpeas", "Cashews"],
  magnesium: ["Pumpkin seeds", "Spinach", "Almonds", "Black beans", "Ragi"],
  iodine: ["Iodized salt", "Seaweed", "Fish", "Dairy"],
  selenium: ["Brazil nuts", "Fish", "Eggs", "Brown rice"],
  potassium: ["Banana", "Potato", "Spinach", "Rajma", "Coconut water"],
  protein: ["Dal", "Eggs", "Chicken", "Paneer", "Tofu", "Soya", "Fish"],
  fiber: ["Whole grains", "Rajma", "Vegetables", "Fruits", "Oats", "Sprouts"],
};
