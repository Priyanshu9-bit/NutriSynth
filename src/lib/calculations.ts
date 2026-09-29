// Nutrition calculations — preserved from original NutriSynth with enhancements
import { foodNutritionData, canonical, recipes, type FoodData } from '@/data/foods';
import { rdiTable, type Gender } from '@/data/nutrients';

export interface UserProfile {
  age: number;
  gender: Gender;
  height: number;
  weight: number;
  activity: number;
  goal: string;
  diet: string;
  allergies: string[];
  intolerances: string[];
  femaleState?: string;
  pregnancyMonth?: number;
  ingredients?: string;
}

export interface MealItem {
  id?: string;
  name: string;
  food: string;
  details: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
  components?: string[];
  icon: string;
  time?: string;
}

export interface NutritionResult {
  bmr: number;
  tdee: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  fiberG: number;
  proteinCal: number;
  carbCal: number;
  fatCal: number;
  conditionNote: string;
  meals: MealItem[];
  lifeStage: string;
  micros: Record<string, number>;
  estimatedMicroIntake: Record<string, number>;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

// Preserved original BMR (Mifflin-St Jeor)
export function calcBMR({ age, gender, height, weight }: { age: number; gender: string; height: number; weight: number }): number {
  if (gender === "male") return 10 * weight + 6.25 * height - 5 * age + 5;
  if (gender === "female") return 10 * weight + 6.25 * height - 5 * age - 161;
  return 10 * weight + 6.25 * height - 5 * age - 78;
}

// Preserved original protein recommendation
export function recommendProteinPerKg(activity: number): number {
  if (activity >= 1.725) return 1.6;
  if (activity >= 1.55) return 1.4;
  if (activity >= 1.375) return 1.2;
  return 1.0;
}

// Preserved original macro allocation
export function allocateMacros(tdee: number, proteinPerKg: number, weight: number, femaleState: string = "none") {
  const proteinG = Math.round(proteinPerKg * weight + (femaleState === "lactation" ? 19 : 0));
  const proteinCal = proteinG * 4;
  let fatCal = Math.round(tdee * 0.25);
  let carbCal = tdee - proteinCal - fatCal;
  if (carbCal < 0) {
    const deficit = -carbCal;
    fatCal = Math.max(0, fatCal - deficit);
    carbCal = tdee - proteinCal - fatCal;
  }
  let fatG = +(fatCal / 9).toFixed(1);
  let carbG = +(carbCal / 4).toFixed(1);
  const recalProteinCal = proteinG * 4;
  const recalFatCal = Math.round(fatG * 9);
  const recalCarbCal = Math.round(carbG * 4);
  const sum = recalProteinCal + recalFatCal + recalCarbCal;
  const diff = tdee - sum;
  if (diff !== 0) {
    const adjCarbG = +(carbG + diff / 4).toFixed(1);
    carbG = Math.max(0, adjCarbG);
  }
  return {
    proteinG,
    proteinCal: proteinG * 4,
    fatG: +fatG.toFixed(1),
    carbG: +carbG.toFixed(1),
  };
}

// Preserved ingredient normalization
export function normalizeIngredients(input: string): Set<string> {
  const raw = (input || "").toLowerCase().trim();
  if (!raw) return new Set();
  let parts = raw.split(/[,;]/).map(s => s.trim()).filter(Boolean);
  if (parts.length === 1 && parts[0].includes(" ")) {
    parts = parts[0].split(/\s+/).map(s => s.trim()).filter(Boolean);
  }
  const set = new Set<string>();
  const addCanonical = (term: string) => {
    if (canonical[term]) { set.add(canonical[term]); return true; }
    return false;
  };
  for (let p of parts) {
    p = p.replace(/[^a-z0-9\s]/g, "").trim();
    if (!p) continue;
    if (addCanonical(p)) continue;
    const words = p.split(/\s+/);
    let found = false;
    for (let i = words.length; i > 0; i--) {
      for (let j = 0; j <= words.length - i; j++) {
        const phrase = words.slice(j, j + i).join("");
        if (addCanonical(phrase)) { found = true; break; }
      }
      if (found) break;
    }
    if (!found) set.add(words[words.length - 1]);
  }
  return set;
}

// Meal plan option structure
interface MealOption {
  name: string;
  ingredients: string[];
  components: string[];
  icon?: string;
}

const breakfastOptions: MealOption[] = [
  { name: "Poha", ingredients: ["poha", "peanut"], components: ['poha'], icon: "Sunrise" },
  { name: "Upma", ingredients: ["suji", "upma"], components: ['upma'], icon: "Sunrise" },
  { name: "Idli with Sambar", ingredients: ["idli", "dal"], components: ['idli_sambar'], icon: "Sunrise" },
  { name: "Masala Dosa", ingredients: ["dosa", "potato"], components: ['masala_dosa'], icon: "Sunrise" },
  { name: "Egg Bhurji with Roti", ingredients: ["egg", "chapati"], components: ['egg_bhurji_2', 'roti'], icon: "Sunrise" },
  { name: "Oats Porridge", ingredients: ["oats", "milk"], components: ['oats_porridge'], icon: "Sunrise" },
  { name: "Paneer Paratha with Curd", ingredients: ["paneer", "chapati", "curd"], components: ['paneer_paratha', 'curd'], icon: "Sunrise" },
  { name: "Sprouts Salad", ingredients: ["sprouts"], components: ['sprouts_salad'], icon: "Sunrise" },
  { name: "Methi Thepla with Curd", ingredients: ["methi", "chapati", "curd"], components: ['methi_thepla', 'curd'], icon: "Sunrise" },
  { name: "Fruit Bowl with Yogurt", ingredients: ["banana", "apple", "mango", "curd"], components: ['fruit_yogurt'], icon: "Sunrise" },
];

const carbSources: MealOption[] = [
  { name: "Roti/Chapati", ingredients: ["chapati", "wheat"], components: ['roti', 'roti'], icon: "Wheat" },
  { name: "Rice", ingredients: ["rice"], components: ['rice'], icon: "Rice" },
  { name: "Khichdi", ingredients: ["rice", "dal"], components: ['khichdi'], icon: "Bowl" },
  { name: "Bajra Roti", ingredients: ["bajra"], components: ['bajra_roti', 'bajra_roti'], icon: "Wheat" },
  { name: "Jowar Roti", ingredients: ["jowar"], components: ['jowar_roti', 'jowar_roti'], icon: "Wheat" },
];

const proteinSources: MealOption[] = [
  { name: "Toor Dal Tadka", ingredients: ["toor", "dal"], components: ['toor_dal_tadka'], icon: "Soup" },
  { name: "Moong Dal", ingredients: ["moong", "dal"], components: ['moong_dal'], icon: "Soup" },
  { name: "Masoor Dal", ingredients: ["masoor", "dal"], components: ['masoor_dal'], icon: "Soup" },
  { name: "Urad Dal", ingredients: ["urad", "dal"], components: ['urad_dal'], icon: "Soup" },
  { name: "Paneer Curry", ingredients: ["paneer"], components: ['paneer_curry'], icon: "Soup" },
  { name: "Chicken Curry", ingredients: ["chicken"], components: ['chicken_curry'], icon: "Soup" },
  { name: "Fish Curry", ingredients: ["fish"], components: ['fish_curry'], icon: "Soup" },
  { name: "Mutton Curry", ingredients: ["mutton"], components: ['mutton_curry'], icon: "Soup" },
  { name: "Rajma Masala", ingredients: ["rajma"], components: ['rajma_masala'], icon: "Soup" },
  { name: "Chana Masala", ingredients: ["chole", "chana"], components: ['chana_masala'], icon: "Soup" },
  { name: "Egg Curry", ingredients: ["egg"], components: ['egg_curry_2'], icon: "Soup" },
  { name: "Soya Chunk Curry", ingredients: ["soya"], components: ['soya_curry'], icon: "Soup" },
];

const vegetableSides: MealOption[] = [
  { name: "Mixed Veg Sabzi", ingredients: ["carrot", "peas", "beans"], components: ['mixed_veg'], icon: "Leaf" },
  { name: "Palak Sabzi", ingredients: ["spinach"], components: ['palak_sabzi'], icon: "Leaf" },
  { name: "Aloo Gobi", ingredients: ["potato", "cauliflower"], components: ['aloo_gobi'], icon: "Leaf" },
  { name: "Baingan Bharta", ingredients: ["baingan"], components: ['baingan_bharta'], icon: "Leaf" },
  { name: "Bhindi Fry", ingredients: ["bhindi"], components: ['bhindi_fry'], icon: "Leaf" },
  { name: "Lauki Sabzi", ingredients: ["lauki"], components: ['lauki_sabzi'], icon: "Leaf" },
  { name: "Karela Sabzi", ingredients: ["karela"], components: ['karela_sabzi'], icon: "Leaf" },
  { name: "Sarson ka Saag", ingredients: ["sarson"], components: ['sarson_ka_saag'], icon: "Leaf" },
];

const accompaniments: MealOption[] = [
  { name: "Green Salad", ingredients: ["cucumber", "tomato", "onion"], components: ['salad'], icon: "Salad" },
  { name: "Curd/Raita", ingredients: ["curd", "yogurt"], components: ['curd'], icon: "Salad" },
];

// Filter by diet type
function filterByDiet(options: MealOption[], diet: string, profile: UserProfile): MealOption[] {
  return options.filter(opt => {
    const tags = opt.components.flatMap(c => foodNutritionData[c]?.tags ?? []);
    if (diet === "vegan") {
      if (tags.includes("dairy") || tags.includes("nonveg") || tags.includes("egg")) return false;
    } else if (diet === "veg") {
      if (tags.includes("nonveg")) return false;
    } else if (diet === "eggetarian") {
      if (tags.includes("nonveg") && !tags.includes("egg") && !tags.includes("dairy")) return false;
    }
    // Allergy filtering
    if (profile.allergies.includes("Dairy (Lactose)") && (tags.includes("dairy"))) return false;
    if (profile.allergies.includes("Eggs") && tags.includes("egg")) return false;
    if (profile.allergies.includes("Fish") && tags.includes("fish")) return false;
    if (profile.allergies.includes("Soy") && tags.includes("soya")) return false;
    if (profile.intolerances.includes("Lactose Intolerance") && tags.includes("dairy")) return false;
    return true;
  });
}

// Preserved dynamic meal generation — enhanced with diet filtering and fiber tracking
export function generateAdultMealPlan(tdee: number, availableIngredients: Set<string>, goal: string, profile: UserProfile): MealItem[] {
  const pickOne = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const filterByIngredients = (options: MealOption[]) => {
    const available = options.filter(opt =>
      (opt.ingredients || []).some(ing => availableIngredients.has(ing))
    );
    return available.length > 0 ? available : options;
  };

  // First filter by diet, then by ingredients
  const dietFilteredBreakfasts = filterByDiet(breakfastOptions, profile.diet, profile);
  const dietFilteredCarbs = filterByDiet(carbSources, profile.diet, profile);
  const dietFilteredProteins = filterByDiet(proteinSources, profile.diet, profile);
  const dietFilteredVeggies = filterByDiet(vegetableSides, profile.diet, profile);
  const dietFilteredAccompaniments = filterByDiet(accompaniments, profile.diet, profile);

  const validBreakfasts = filterByIngredients(dietFilteredBreakfasts);
  const validCarbs = filterByIngredients(dietFilteredCarbs);
  const validProteins = filterByIngredients(dietFilteredProteins);
  const validVeggies = filterByIngredients(dietFilteredVeggies);
  const validAccompaniments = dietFilteredAccompaniments.length > 0 ? dietFilteredAccompaniments : accompaniments;

  if (validProteins.length === 0 || validCarbs.length === 0) {
    // Fallback: return simple meals
    return [
      { name: "Breakfast", food: "Simple meal with available ingredients", details: { calories: 300, protein: 10, carbs: 45, fat: 8, fiber: 4 }, components: ['poha'], icon: "Sunrise" },
      { name: "Lunch", food: "Rice with dal", details: { calories: 450, protein: 15, carbs: 70, fat: 10, fiber: 6 }, components: ['rice','toor_dal_tadka'], icon: "Bowl" },
      { name: "Dinner", food: "Roti with sabzi", details: { calories: 380, protein: 12, carbs: 55, fat: 12, fiber: 5 }, components: ['roti','roti','mixed_veg'], icon: "Moon" },
    ];
  }

  let breakfastChoice = { ...pickOne(validBreakfasts), components: [...(pickOne(validBreakfasts).components || [])] };
  let lunchCarb = { ...pickOne(validCarbs), components: [...(pickOne(validCarbs).components || [])] };
  let lunchProtein = { ...pickOne(validProteins), components: [...(pickOne(validProteins).components || [])] };
  let lunchVeg = validVeggies.length > 0 ? { ...pickOne(validVeggies), components: [...(pickOne(validVeggies).components || [])] } : { name: "", ingredients: [], components: [] };
  let lunchAcc = { ...pickOne(validAccompaniments), components: [...(pickOne(validAccompaniments).components || [])] };
  let dinnerCarb = { ...pickOne(validCarbs), components: [...(pickOne(validCarbs).components || [])] };
  let dinnerProtein = { ...pickOne(validProteins), components: [...(pickOne(validProteins).components || [])] };
  let dinnerAcc = { ...pickOne(validAccompaniments), components: [...(pickOne(validAccompaniments).components || [])] };

  // Goal modifications — preserved from original
  if (goal === 'lose') {
    if (lunchCarb.name.includes("Roti")) lunchCarb.components = ['roti'];
    if (dinnerCarb.name.includes("Roti")) dinnerCarb.components = ['roti'];
    if (dinnerCarb.name.includes("Rice")) dinnerCarb = { name: "Roti/Chapati", ingredients: ["chapati", "wheat"], components: ['roti'], icon: "Wheat" };
  } else if (goal === 'gain') {
    if (!lunchCarb.components.includes('ghee')) lunchCarb.components.push('ghee');
    if (!dinnerCarb.components.includes('ghee')) dinnerCarb.components.push('ghee');
    if (breakfastChoice.name === 'Sprouts Salad') {
      const alt = validBreakfasts.filter(b => b.name !== 'Sprouts Salad');
      if (alt.length > 0) breakfastChoice = pickOne(alt);
    }
  }

  // Avoid duplicate proteins
  if (lunchProtein.name === dinnerProtein.name) {
    const alt = validProteins.filter(p => p.name !== lunchProtein.name);
    if (alt.length > 0) dinnerProtein = pickOne(alt);
  }
  // Khichdi is a full meal
  if (lunchCarb.name === 'Khichdi') { lunchProtein = { name: "", ingredients: [], components: [] }; lunchVeg = { name: "", ingredients: [], components: [] }; }
  if (dinnerCarb.name === 'Khichdi') { dinnerProtein = { name: "", ingredients: [], components: [] }; }

  const assembleMeal = (componentList: string[]): { food: string; details: { calories: number; protein: number; carbs: number; fat: number; fiber: number } } => {
    const foodText: string[] = [];
    const details = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    componentList.forEach(key => {
      const item = foodNutritionData[key];
      if (item) {
        foodText.push(`${item.name} (${item.serving})`);
        details.calories += item.calories;
        details.protein += item.protein;
        details.carbs += item.carbs;
        details.fat += item.fat;
        details.fiber += item.fiber ?? 0;
      }
    });
    return { food: foodText.join(' + '), details };
  };

  const breakfastMeal = assembleMeal(breakfastChoice.components);
  const lunchMeal = assembleMeal([...lunchCarb.components, ...lunchProtein.components, ...lunchVeg.components, ...lunchAcc.components]);
  const dinnerMeal = assembleMeal([...dinnerCarb.components, ...dinnerProtein.components, ...dinnerAcc.components]);

  return [
    { name: "Breakfast", food: breakfastMeal.food, details: breakfastMeal.details, components: breakfastChoice.components, icon: breakfastChoice.icon || "Sunrise" },
    { name: "Lunch", food: lunchMeal.food, details: lunchMeal.details, components: [...lunchCarb.components, ...lunchProtein.components, ...lunchVeg.components, ...lunchAcc.components], icon: "Bowl" },
    { name: "Dinner", food: dinnerMeal.food, details: dinnerMeal.details, components: [...dinnerCarb.components, ...dinnerProtein.components, ...dinnerAcc.components], icon: "Moon" },
  ];
}

// Preserved life stage logic
export function lifeStageBlock(ageYears: number, gender: string, weight: number, activity: number, goal: string, availableIngredients: Set<string>, profile: UserProfile) {
  const months = Math.round(ageYears * 12);
  const rec = { stage: "Adult", calories: 0, protein: 0, note: "", meals: [] as MealItem[] };

  function adultTDEE() {
    const age = Math.max(18, Math.round(ageYears));
    const w = Math.max(35, weight || 55);
    const h = 165;
    const BMR = gender === "male" ? 10 * w + 6.25 * h - 5 * age + 5 : 10 * w + 6.25 * h - 5 * age - 161;
    let TDEE = Math.round(BMR * activity);
    if (goal === "lose") TDEE = Math.round(TDEE - 300);
    if (goal === "gain") TDEE = Math.round(TDEE + 300);
    return { TDEE, BMR };
  }

  if (months <= 6) {
    rec.stage = "Infant (0–6 months)";
    rec.meals = [{ name: "Feeds", food: "Exclusive breastmilk (on demand)", details: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }, components: [], icon: "Baby" }];
  } else if (months <= 12) {
    rec.stage = "Infant (6–12 months)";
    rec.meals = [
      { name: "Breakfast", food: "Mashed banana / suji kheer", details: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }, components: [], icon: "Sunrise" },
      { name: "Lunch", food: "Soft khichdi + dal water", details: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }, components: [], icon: "Bowl" },
    ];
  } else if (ageYears <= 18) {
    rec.stage = "Adolescent (13–18 yrs)";
    rec.meals = [
      { name: "Breakfast", food: "2 eggs/upma/poha + milk + fruit", details: { calories: 350, protein: 15, carbs: 50, fat: 10, fiber: 5 }, components: [], icon: "Sunrise" },
      { name: "Lunch", food: "2 chapati + rice + dal + chicken/paneer + veg", details: { calories: 600, protein: 30, carbs: 90, fat: 15, fiber: 8 }, components: [], icon: "Bowl" },
      { name: "Dinner", food: "Chapati + sabzi + dal + salad", details: { calories: 500, protein: 20, carbs: 75, fat: 12, fiber: 7 }, components: [], icon: "Moon" },
    ];
  } else if (ageYears <= 60) {
    const t = adultTDEE();
    rec.calories = t.TDEE;
    rec.note = "Meal suggestions are examples with estimated nutrition. Actual values vary with preparation.";
    rec.meals = generateAdultMealPlan(rec.calories, availableIngredients, goal, profile);
  } else {
    rec.stage = "Elderly (60+ yrs)";
    rec.meals = [
      { name: "Breakfast", food: "Soft idli/upma + milk", details: { calories: 250, protein: 10, carbs: 40, fat: 6, fiber: 4 }, components: [], icon: "Sunrise" },
      { name: "Lunch", food: "Multigrain chapati + dal + veg", details: { calories: 450, protein: 18, carbs: 65, fat: 12, fiber: 7 }, components: [], icon: "Bowl" },
      { name: "Dinner", food: "Soft khichdi + sabzi", details: { calories: 350, protein: 14, carbs: 55, fat: 8, fiber: 6 }, components: [], icon: "Moon" },
    ];
  }
  return rec;
}

// Estimate micronutrient intake from meal components
export function estimateMicroIntake(meals: MealItem[]): Record<string, number> {
  const totals: Record<string, number> = {
    calcium: 0, iron: 0, vitaminC: 0, vitaminD: 0, folate: 0, vitaminB12: 0,
    vitaminA: 0, zinc: 0, magnesium: 0, potassium: 0, fiber: 0,
  };
  meals.forEach(meal => {
    (meal.components || []).forEach(key => {
      const food = foodNutritionData[key];
      if (!food) return;
      (Object.keys(totals) as (keyof FoodData)[]).forEach(nutrient => {
        const val = food[nutrient as keyof FoodData];
        if (typeof val === "number") totals[nutrient] += val;
      });
    });
  });
  return totals;
}

// Main compute function — preserves original flow with enhancements
export function computeNutrition(profile: UserProfile): NutritionResult {
  const age = clamp(profile.age, 0, 120);
  const height = clamp(profile.height, 80, 250);
  const weight = clamp(profile.weight, 10, 300);
  const activity = clamp(profile.activity, 1.2, 1.9);
  const goal = profile.goal;

  const bmr = calcBMR({ age, gender: profile.gender, height, weight });
  let tdee = Math.round(bmr * activity);
  let conditionNote = "";

  if (profile.gender === "female") {
    if (profile.femaleState === "pregnancy") {
      const m = clamp(profile.pregnancyMonth || 1, 1, 9);
      const extra = m <= 3 ? 150 : m <= 6 ? 300 : 450;
      tdee += extra;
      conditionNote = `Pregnancy month ${m} — +${extra} kcal guidance.`;
    }
    if (profile.femaleState === "lactation") {
      tdee += 600;
      conditionNote = "Lactation — ~+600 kcal & +19 g protein guidance.";
    }
  }

  if (goal === "lose") tdee = Math.max(1200, tdee - 300);
  if (goal === "gain") tdee = tdee + 300;

  const proteinPerKg = recommendProteinPerKg(activity);
  const macros = allocateMacros(tdee, proteinPerKg, weight, profile.femaleState);
  const ingSet = normalizeIngredients(profile.ingredients || "rice, dal, spinach, paneer, egg, chicken, potato, tomato, onion");
  const life = lifeStageBlock(age, profile.gender, weight, activity, goal, ingSet, profile);
  const micros = rdiTable(age, profile.gender, profile.femaleState);
  const estimatedMicroIntake = estimateMicroIntake(life.meals);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    proteinG: macros.proteinG,
    carbG: macros.carbG,
    fatG: macros.fatG,
    fiberG: 30,
    proteinCal: macros.proteinCal,
    carbCal: Math.round(macros.carbG * 4),
    fatCal: Math.round(macros.fatG * 9),
    conditionNote,
    meals: life.meals,
    lifeStage: life.stage,
    micros,
    estimatedMicroIntake,
  };
}

// Daily diet analysis
export interface DietAnalysisItem {
  nutrient: string;
  label: string;
  status: "good" | "attention" | "caution";
  message: string;
  detail: string;
}

export function analyzeDailyDiet(result: NutritionResult, profile: UserProfile): DietAnalysisItem[] {
  const totalCalories = result.meals.reduce((s, m) => s + m.details.calories, 0);
  const totalProtein = result.meals.reduce((s, m) => s + m.details.protein, 0);
  const totalCarbs = result.meals.reduce((s, m) => s + m.details.carbs, 0);
  const totalFat = result.meals.reduce((s, m) => s + m.details.fat, 0);
  const totalFiber = result.meals.reduce((s, m) => s + m.details.fiber, 0);

  const items: DietAnalysisItem[] = [];

  // Protein
  const proteinRatio = totalProtein / result.proteinG;
  if (proteinRatio < 0.7) {
    items.push({ nutrient: "protein", label: "Protein", status: "attention", message: "Daily protein is below your target.", detail: `${Math.round(totalProtein)}g consumed vs ${result.proteinG}g target. Consider increasing dal portions or adding a protein source.` });
  } else {
    items.push({ nutrient: "protein", label: "Protein", status: "good", message: "Daily protein meets your target.", detail: `${Math.round(totalProtein)}g consumed vs ${result.proteinG}g target.` });
  }

  // Fiber
  if (totalFiber < 20) {
    items.push({ nutrient: "fiber", label: "Fiber", status: "attention", message: "Dietary fiber is below recommended levels.", detail: `${Math.round(totalFiber)}g consumed. Aim for 25-38g daily. Add more vegetables, whole grains, and sprouts.` });
  } else {
    items.push({ nutrient: "fiber", label: "Fiber", status: "good", message: "Fiber intake is adequate.", detail: `${Math.round(totalFiber)}g consumed. Good for digestive health.` });
  }

  // Calories vs TDEE
  const calRatio = totalCalories / result.tdee;
  if (calRatio > 1.15) {
    items.push({ nutrient: "calories", label: "Calories", status: "caution", message: "Estimated calories exceed your daily target.", detail: `${Math.round(totalCalories)} kcal vs ${result.tdee} kcal target. Consider reducing portions.` });
  } else if (calRatio < 0.7) {
    items.push({ nutrient: "calories", label: "Calories", status: "caution", message: "Estimated calories are well below your target.", detail: `${Math.round(totalCalories)} kcal vs ${result.tdee} kcal target. Add nutrient-dense foods.` });
  } else {
    items.push({ nutrient: "calories", label: "Calories", status: "good", message: "Calories are within your target range.", detail: `${Math.round(totalCalories)} kcal vs ${result.tdee} kcal target.` });
  }

  // Fat ratio
  const fatCalPct = (totalFat * 9 / totalCalories) * 100;
  if (fatCalPct > 35) {
    items.push({ nutrient: "fat", label: "Fat", status: "caution", message: "Fat contribution is relatively high.", detail: `${Math.round(fatCalPct)}% of calories from fat. Consider reducing fried items or ghee.` });
  } else {
    items.push({ nutrient: "fat", label: "Fat", status: "good", message: "Fat distribution is balanced.", detail: `${Math.round(fatCalPct)}% of calories from fat.` });
  }

  // Dietary diversity
  const uniqueComponents = new Set(result.meals.flatMap(m => m.components || []));
  if (uniqueComponents.size < 5) {
    items.push({ nutrient: "diversity", label: "Dietary Diversity", status: "attention", message: "Limited food variety in your plan.", detail: "Aim for diverse food groups across meals for broader nutrient coverage." });
  } else {
    items.push({ nutrient: "diversity", label: "Dietary Diversity", status: "good", message: "Good variety of food groups.", detail: `${uniqueComponents.size} different food components across the day.` });
  }

  return items;
}

// Food analysis for individual meals
export interface FoodAnalysis {
  limitations: { title: string; reason: string; solution: string; beforeAfter?: { before: Record<string, number>; after: Record<string, number>; modification: string } }[];
  suitability: "suitable" | "suitable-with-modification" | "limit" | "exclude";
  suitabilityReason: string;
}

export function analyzeFood(meal: MealItem, result: NutritionResult, profile: UserProfile): FoodAnalysis {
  const limitations: FoodAnalysis["limitations"] = [];
  let suitability: FoodAnalysis["suitability"] = "suitable";
  let suitabilityReason = "This meal matches your dietary preference and nutritional profile.";

  const mealProtein = meal.details?.protein ?? 0;
  const proteinTarget = result.proteinG || 1;
  const mealProteinPct = (mealProtein / proteinTarget) * 100;

  // Check dietary preference match
  const tags = (meal.components || []).flatMap(c => foodNutritionData[c]?.tags ?? []);
  if (profile.diet === "vegan" && (tags.includes("dairy") || tags.includes("nonveg"))) {
    suitability = "exclude";
    suitabilityReason = "Contains animal products incompatible with a vegan diet.";
  } else if (profile.diet === "veg" && tags.includes("nonveg")) {
    suitability = "exclude";
    suitabilityReason = "Contains non-vegetarian items incompatible with your vegetarian diet.";
  } else if (profile.allergies.includes("Dairy (Lactose)") && tags.includes("dairy")) {
    suitability = "exclude";
    suitabilityReason = "Contains dairy which conflicts with your lactose allergy.";
  } else if (profile.allergies.includes("Eggs") && tags.includes("egg")) {
    suitability = "exclude";
    suitabilityReason = "Contains eggs which conflict with your egg allergy.";
  }

  // Protein analysis
  if (mealProteinPct < 20 && meal.name !== "Breakfast") {
    const before = { protein: mealProtein, fiber: meal.details.fiber, calories: meal.details.calories };
    const after = { protein: Math.round(mealProtein * 1.5), fiber: meal.details.fiber + 2, calories: meal.details.calories + 80 };
    limitations.push({
      title: "Protein contribution could be improved relative to your daily target",
      reason: `This meal provides ${Math.round(mealProtein)}g protein, which is ${Math.round(mealProteinPct)}% of your ${proteinTarget}g daily target.`,
      solution: "Increase the dal portion or add another compatible protein source like soya chunks, paneer, or an extra egg.",
      beforeAfter: { before, after, modification: "Increase dal portion by 50% or add 30g soya chunks" },
    });
    if (suitability === "suitable") {
      suitability = "suitable-with-modification";
      suitabilityReason = "This meal is compatible with your diet but could be improved nutritionally.";
    }
  }

  // Fiber analysis
  if (meal.details.fiber < 4) {
    limitations.push({
      title: "Fiber content is relatively low",
      reason: `This meal provides ${Math.round(meal.details.fiber)}g fiber. Adequate fiber supports digestion and satiety.`,
      solution: "Add a side of salad, increase vegetable portions, or include whole grains instead of refined ones.",
    });
    if (suitability === "suitable") suitability = "suitable-with-modification";
  }

  // Fat analysis (if very high)
  const fatCalPct = (meal.details.fat * 9 / Math.max(1, meal.details.calories)) * 100;
  if (fatCalPct > 45) {
    limitations.push({
      title: "Fat contribution is relatively high for this meal",
      reason: `${Math.round(fatCalPct)}% of meal calories come from fat. While fats are essential, balance is important.`,
      solution: "Reduce ghee or oil in preparation, or substitute a lower-fat cooking method.",
    });
  }

  return { limitations, suitability, suitabilityReason };
}

// "Why this meal" reasoning
export function getMealReasoning(meal: MealItem, result: NutritionResult, profile: UserProfile): string {
  const reasons: string[] = [];
  const tags = (meal.components || []).flatMap(c => foodNutritionData[c]?.tags ?? []);

  if (meal.details.protein > 15) reasons.push(`contributes ${Math.round(meal.details.protein)}g protein toward your ${result.proteinG}g daily target`);
  if (meal.details.fiber > 5) reasons.push(`provides ${Math.round(meal.details.fiber)}g of fiber-rich ingredients`);
  if (meal.details.calories > 0) reasons.push(`contributes approximately ${Math.round(meal.details.calories)} kcal toward your ${result.tdee} kcal daily target`);

  if (profile.diet === "vegan") reasons.push("matches your vegan preference");
  else if (profile.diet === "veg") reasons.push("matches your vegetarian preference");
  else if (profile.diet === "eggetarian") reasons.push("matches your eggetarian preference");

  if (tags.includes("dal")) reasons.push("includes lentil-based protein");
  if (tags.includes("dairy")) reasons.push("provides calcium from dairy");

  if (reasons.length === 0) return "This meal provides balanced nutrition within your daily plan.";

  return `This meal ${reasons.slice(0, 3).join(", ")}.`;
}
