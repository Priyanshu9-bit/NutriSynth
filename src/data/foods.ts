// Food nutrition database — preserved from original NutriSynth with micronutrient additions
export interface FoodData {
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  calcium?: number;
  iron?: number;
  vitaminC?: number;
  vitaminD?: number;
  folate?: number;
  vitaminB12?: number;
  vitaminA?: number;
  zinc?: number;
  magnesium?: number;
  potassium?: number;
  tags?: string[];
}

export const foodNutritionData: Record<string, FoodData> = {
  // Breakfasts
  poha: { name: "Poha", serving: "1 medium bowl", calories: 270, protein: 5, carbs: 45, fat: 8, fiber: 4, iron: 2.8, folate: 30, tags: ["breakfast","veg","indian"] },
  upma: { name: "Upma", serving: "1 medium bowl", calories: 250, protein: 6, carbs: 40, fat: 7, fiber: 3, iron: 1.5, folate: 25, tags: ["breakfast","veg","indian"] },
  idli_sambar: { name: "Idli with Sambar", serving: "2 pieces", calories: 200, protein: 8, carbs: 35, fat: 3, fiber: 5, iron: 1.8, folate: 40, calcium: 60, tags: ["breakfast","veg","indian"] },
  masala_dosa: { name: "Masala Dosa", serving: "1 medium", calories: 350, protein: 8, carbs: 55, fat: 12, fiber: 4, iron: 2.2, calcium: 50, tags: ["breakfast","veg","indian"] },
  egg_bhurji_2: { name: "Egg Bhurji", serving: "2 eggs", calories: 220, protein: 14, carbs: 5, fat: 16, fiber: 1, vitaminB12: 1.6, iron: 2.4, vitaminD: 2, folate: 50, zinc: 2, tags: ["breakfast","nonveg","egg","indian"] },
  oats_porridge: { name: "Oats Porridge", serving: "1 bowl", calories: 210, protein: 8, carbs: 35, fat: 5, fiber: 6, iron: 2.5, magnesium: 60, zinc: 2, folate: 15, tags: ["breakfast","veg"] },
  paneer_paratha: { name: "Paneer Paratha", serving: "1 medium", calories: 300, protein: 12, carbs: 35, fat: 12, fiber: 3, calcium: 200, vitaminA: 100, tags: ["breakfast","veg","dairy","indian"] },
  sprouts_salad: { name: "Sprouts Salad", serving: "1 bowl", calories: 150, protein: 10, carbs: 20, fat: 3, fiber: 8, iron: 3, vitaminC: 20, folate: 80, potassium: 400, tags: ["breakfast","vegan","veg"] },
  ragi_malt: { name: "Ragi Malt", serving: "1 glass", calories: 180, protein: 5, carbs: 30, fat: 4, fiber: 4, calcium: 350, iron: 3.5, tags: ["breakfast","vegan","veg","indian"] },
  methi_thepla: { name: "Methi Thepla", serving: "2 pieces", calories: 220, protein: 6, carbs: 30, fat: 8, fiber: 4, iron: 2.8, calcium: 80, folate: 40, tags: ["breakfast","veg","indian"] },
  fruit_yogurt: { name: "Fruit Bowl with Yogurt", serving: "1 bowl", calories: 180, protein: 8, carbs: 25, fat: 5, fiber: 3, calcium: 150, vitaminC: 10, tags: ["breakfast","veg","dairy"] },

  // Carbs
  roti: { name: "Roti/Chapati", serving: "1 piece", calories: 85, protein: 3, carbs: 18, fat: 0.5, fiber: 3, iron: 1.1, tags: ["carb","veg","vegan","indian"] },
  rice: { name: "Cooked Rice", serving: "1 bowl (150g)", calories: 200, protein: 4, carbs: 45, fat: 0.5, fiber: 1, tags: ["carb","veg","vegan","indian"] },
  khichdi: { name: "Khichdi", serving: "1 bowl", calories: 300, protein: 12, carbs: 55, fat: 4, fiber: 5, iron: 2.5, folate: 35, tags: ["carb","veg","vegan","indian"] },
  bajra_roti: { name: "Bajra Roti", serving: "1 piece", calories: 110, protein: 3.5, carbs: 22, fat: 1.5, fiber: 3, iron: 2, magnesium: 40, tags: ["carb","veg","vegan","indian"] },
  jowar_roti: { name: "Jowar Roti", serving: "1 piece", calories: 100, protein: 3, carbs: 21, fat: 1, fiber: 2.5, iron: 1.8, tags: ["carb","veg","vegan","indian"] },
  naan: { name: "Naan", serving: "1 piece", calories: 260, protein: 8, carbs: 48, fat: 4, fiber: 2, calcium: 80, tags: ["carb","veg","indian"] },

  // Proteins (Dals, Curries)
  toor_dal_tadka: { name: "Toor Dal Tadka", serving: "1 bowl", calories: 180, protein: 9, carbs: 25, fat: 5, fiber: 7, iron: 2.5, folate: 60, potassium: 400, tags: ["protein","veg","vegan","indian","dal"] },
  moong_dal: { name: "Moong Dal", serving: "1 bowl", calories: 160, protein: 10, carbs: 22, fat: 4, fiber: 6, iron: 2, folate: 50, magnesium: 50, tags: ["protein","veg","vegan","indian","dal"] },
  masoor_dal: { name: "Masoor Dal", serving: "1 bowl", calories: 170, protein: 11, carbs: 24, fat: 4, fiber: 6, iron: 3, folate: 55, potassium: 350, tags: ["protein","veg","vegan","indian","dal"] },
  urad_dal: { name: "Urad Dal", serving: "1 bowl", calories: 190, protein: 12, carbs: 26, fat: 5, fiber: 7, iron: 2.8, magnesium: 60, potassium: 400, tags: ["protein","veg","vegan","indian","dal"] },
  paneer_curry: { name: "Paneer Curry", serving: "1 bowl (100g paneer)", calories: 280, protein: 15, carbs: 8, fat: 20, fiber: 2, calcium: 280, vitaminA: 120, vitaminB12: 0.5, tags: ["protein","veg","dairy","indian"] },
  chicken_curry: { name: "Chicken Curry", serving: "2 pieces", calories: 300, protein: 25, carbs: 6, fat: 18, fiber: 1, vitaminB12: 0.8, iron: 2, zinc: 3, tags: ["protein","nonveg","chicken","indian"] },
  fish_curry: { name: "Fish Curry", serving: "1 piece", calories: 250, protein: 22, carbs: 5, fat: 15, fiber: 1, vitaminD: 5, vitaminB12: 2, iron: 1.5, zinc: 1.5, tags: ["protein","nonveg","fish","indian"] },
  mutton_curry: { name: "Mutton Curry", serving: "2 pieces", calories: 350, protein: 28, carbs: 7, fat: 22, fiber: 1, iron: 3.5, zinc: 5, vitaminB12: 2.5, tags: ["protein","nonveg","mutton","indian"] },
  rajma_masala: { name: "Rajma Masala", serving: "1 bowl", calories: 220, protein: 10, carbs: 30, fat: 7, fiber: 10, iron: 3, folate: 70, potassium: 500, tags: ["protein","veg","vegan","indian","dal"] },
  chana_masala: { name: "Chana Masala", serving: "1 bowl", calories: 240, protein: 9, carbs: 35, fat: 7, fiber: 9, iron: 3.5, folate: 80, magnesium: 50, tags: ["protein","veg","vegan","indian","dal"] },
  egg_curry_2: { name: "Egg Curry", serving: "2 eggs", calories: 250, protein: 14, carbs: 8, fat: 18, fiber: 1, vitaminB12: 1.6, iron: 2.2, vitaminD: 2, tags: ["protein","nonveg","egg","indian"] },
  soya_curry: { name: "Soya Chunk Curry", serving: "1 bowl", calories: 200, protein: 18, carbs: 15, fat: 8, fiber: 5, iron: 4, folate: 30, tags: ["protein","veg","vegan","indian"] },

  // Vegetables (Sabzi)
  mixed_veg: { name: "Mixed Veg Sabzi", serving: "1 bowl", calories: 120, protein: 3, carbs: 15, fat: 6, fiber: 5, vitaminA: 200, vitaminC: 30, potassium: 300, tags: ["veg","vegan","indian"] },
  palak_sabzi: { name: "Palak Sabzi", serving: "1 bowl", calories: 150, protein: 6, carbs: 10, fat: 10, fiber: 4, iron: 3.5, vitaminA: 300, folate: 80, calcium: 120, tags: ["veg","vegan","indian"] },
  aloo_gobi: { name: "Aloo Gobi", serving: "1 bowl", calories: 160, protein: 4, carbs: 20, fat: 7, fiber: 4, vitaminC: 50, tags: ["veg","vegan","indian"] },
  baingan_bharta: { name: "Baingan Bharta", serving: "1 bowl", calories: 130, protein: 3, carbs: 15, fat: 7, fiber: 5, potassium: 250, tags: ["veg","vegan","indian"] },
  bhindi_fry: { name: "Bhindi Fry", serving: "1 bowl", calories: 140, protein: 3, carbs: 12, fat: 9, fiber: 4, vitaminC: 20, folate: 40, tags: ["veg","vegan","indian"] },
  lauki_sabzi: { name: "Lauki ki Sabzi", serving: "1 bowl", calories: 90, protein: 2, carbs: 10, fat: 5, fiber: 3, potassium: 200, tags: ["veg","vegan","indian"] },
  karela_sabzi: { name: "Karela Sabzi", serving: "1 bowl", calories: 110, protein: 2, carbs: 12, fat: 6, fiber: 4, vitaminC: 40, folate: 50, tags: ["veg","vegan","indian"] },
  sarson_ka_saag: { name: "Sarson ka Saag", serving: "1 bowl", calories: 180, protein: 7, carbs: 15, fat: 12, fiber: 5, iron: 3, vitaminA: 400, folate: 60, calcium: 150, tags: ["veg","vegan","indian"] },

  // Sides & Extras
  salad: { name: "Green Salad", serving: "1 bowl", calories: 30, protein: 1, carbs: 5, fat: 0.5, fiber: 2, vitaminC: 15, potassium: 150, tags: ["side","vegan"] },
  curd: { name: "Curd/Raita", serving: "1 small bowl", calories: 60, protein: 4, carbs: 5, fat: 2.5, fiber: 0.5, calcium: 120, vitaminB12: 0.3, tags: ["side","veg","dairy"] },
  ghee: { name: "Ghee Topping", serving: "1 tsp", calories: 45, protein: 0, carbs: 0, fat: 5, fiber: 0, vitaminA: 50, tags: ["side","veg"] },
};

// Ingredient normalization — preserved from original
export const canonical: Record<string, string> = {
  rice: "rice", basmati: "rice", sonamasuri: "rice", boiledrice: "rice",
  wheat: "wheat", atta: "wheat",
  roti: "chapati", chapati: "chapati", phulka: "chapati", naan: "wheat", paratha: "wheat",
  millets: "millet", jowar: "jowar", bajra: "bajra", ragi: "ragi",
  semolina: "suji", suji: "suji", rava: "suji",
  puffedrice: "murmura", murmura: "murmura",
  flattenedrice: "poha", poha: "poha",
  oats: "oats",
  dal: "dal", lentil: "dal",
  redlentil: "masoor", masoor: "masoor",
  yellowpigeonpeas: "toor", toor: "toor", arhar: "toor",
  splitbengalgram: "chana", chana: "chana",
  greengram: "moong", moong: "moong",
  kidneybeans: "rajma", rajma: "rajma",
  chickpeas: "chole", chole: "chole", kabulichana: "chole",
  blackgram: "urad", urad: "urad",
  onion: "onion", tomato: "tomato", potato: "potato", aloo: "potato", garlic: "garlic", ginger: "ginger", chili: "chili",
  spinach: "spinach", palak: "spinach",
  fenugreek: "methi", methi: "methi",
  mustardgreens: "sarson", sarson: "sarson",
  cauliflower: "cauliflower", gobi: "cauliflower",
  cabbage: "cabbage",
  bottlegourd: "lauki", lauki: "lauki", doodhi: "lauki",
  ridgegourd: "turai", turai: "turai",
  bittergourd: "karela", karela: "karela",
  eggplant: "baingan", baingan: "baingan", brinjal: "baingan",
  okra: "bhindi", bhindi: "bhindi",
  peas: "matar", matar: "matar",
  bellpepper: "capsicum", capsicum: "capsicum", shimlamirch: "capsicum",
  cucumber: "cucumber", carrot: "carrot", radish: "radish", pumpkin: "pumpkin", kaddu: "pumpkin",
  mango: "mango", banana: "banana", guava: "guava", pomegranate: "pomegranate",
  grapes: "grapes", jackfruit: "jackfruit", papaya: "papaya", watermelon: "watermelon",
  lychee: "lychee", orange: "orange", lemon: "lemon", lime: "lime", apple: "apple", coconut: "coconut",
  ghee: "ghee", yogurt: "curd", curd: "curd", dahi: "curd",
  paneer: "paneer", cottagecheese: "paneer",
  milk: "milk",
  chicken: "chicken", mutton: "mutton", goat: "mutton", fish: "fish", egg: "egg", eggs: "egg",
  soya: "soya", tofu: "soya",
  sprouts: "sprouts", peanut: "peanut", peanuts: "peanut", nuts: "nuts",
  turmeric: "turmeric", haldi: "turmeric", cumin: "cumin", jeera: "cumin", coriander: "coriander", dhania: "coriander",
};

// Recipe suggestions — preserved from original
export const recipes = [
  { name: "Dal Tadka + Rice", required: ["dal","rice"], desc: "Balanced carbs + plant protein" },
  { name: "Palak Paneer + Chapati", required: ["spinach","paneer","chapati"], desc: "Iron & calcium rich" },
  { name: "Egg Bhurji + Chapati", required: ["egg","chapati"], desc: "High-protein breakfast" },
  { name: "Chicken Curry + Rice", required: ["chicken", "rice"], desc: "Classic protein meal" },
  { name: "Mutton Rogan Josh", required: ["mutton", "yogurt"], desc: "Rich & flavorful curry" },
  { name: "Sarson ka Saag + Roti", required: ["sarson", "chapati"], desc: "A Punjabi winter specialty" },
  { name: "Rajma Chawal", required: ["rajma", "rice"], desc: "Comforting kidney bean curry with rice" },
  { name: "Chole Bhature/Puri", required: ["chole", "wheat"], desc: "Popular chickpea curry meal" },
  { name: "Aloo Gobi", required: ["potato", "cauliflower"], desc: "Simple potato & cauliflower stir-fry" },
  { name: "Baingan Bharta", required: ["baingan", "tomato"], desc: "Smoky mashed eggplant curry" },
  { name: "Bhindi Fry", required: ["bhindi"], desc: "Crispy fried okra" },
  { name: "Khichdi (Rice + Dal)", required: ["rice","dal"], desc: "Comforting one-pot meal" },
  { name: "Fish Curry + Rice", required: ["fish", "rice"], desc: "Coastal staple meal" },
  { name: "Banana + Milk Smoothie", required: ["banana","milk"], desc: "Quick energy + calcium" },
];

// Smart substitutions — respects diet, allergies, intolerances
export interface Substitution {
  original: string;
  alternatives: { name: string; reason: string; protein?: number; calcium?: number; iron?: number; vegan?: boolean }[];
}

export const substitutions: Substitution[] = [
  { original: "milk", alternatives: [
    { name: "Fortified soy beverage", reason: "Comparable protein, calcium-fortified", calcium: 120, vegan: true },
    { name: "Fortified almond beverage", reason: "Lower calorie, calcium-fortified", calcium: 100, vegan: true },
    { name: "Fortified oat beverage", reason: "Fiber-rich, calcium-fortified", calcium: 120, vegan: true },
  ]},
  { original: "paneer", alternatives: [
    { name: "Tofu (firm)", reason: "Similar texture, plant protein", protein: 17, calcium: 350, vegan: true },
    { name: "Soya chunks", reason: "Higher protein plant alternative", protein: 52, vegan: true },
  ]},
  { original: "curd", alternatives: [
    { name: "Coconut yogurt", reason: "Dairy-free alternative", vegan: true },
    { name: "Soy yogurt", reason: "Protein-rich dairy-free", protein: 4, vegan: true },
  ]},
  { original: "chicken", alternatives: [
    { name: "Soya chunks", reason: "High protein, plant-based", protein: 52, vegan: true },
    { name: "Tofu", reason: "Complete plant protein", protein: 17, vegan: true },
    { name: "Rajma (kidney beans)", reason: "Protein + fiber rich", protein: 9, iron: 3, vegan: true },
  ]},
  { original: "egg", alternatives: [
    { name: "Tofu scramble", reason: "Similar texture, plant-based", protein: 17, vegan: true },
    { name: "Besan (chickpea flour) chilla", reason: "Protein-rich batter", protein: 10, iron: 3, vegan: true },
  ]},
  { original: "fish", alternatives: [
    { name: "Flaxseeds", reason: "Plant-based omega-3 (ALA)", vegan: true },
    { name: "Walnuts", reason: "Omega-3 (ALA) source", vegan: true },
    { name: "Chia seeds", reason: "Omega-3 + fiber + calcium", calcium: 631, vegan: true },
  ]},
  { original: "rice", alternatives: [
    { name: "Quinoa", reason: "Higher protein & fiber", protein: 8, iron: 2.8 },
    { name: "Brown rice", reason: "More fiber and minerals", iron: 1.2 },
  ]},
];

// Evidence sources
export interface EvidenceSource {
  source: string;
  purpose: string;
  url?: string;
}

export const evidenceSources: Record<string, EvidenceSource[]> = {
  bmr: [
    { source: "Mifflin-St Jeor Equation", purpose: "BMR estimation validated in clinical nutrition literature" },
  ],
  protein: [
    { source: "ICMR-NIN Dietary Guidelines", purpose: "Reference protein intake per kg body weight by activity" },
    { source: "National Academies — DRI", purpose: "Recommended Dietary Allowance for macronutrients" },
  ],
  rdi: [
    { source: "ICMR-NIN Recommended Dietary Allowances", purpose: "Micronutrient reference values for Indian populations" },
    { source: "NIH Office of Dietary Supplements", purpose: "Reference information on vitamins and minerals" },
  ],
  food: [
    { source: "USDA FoodData Central", purpose: "Food nutrient composition data" },
    { source: "IFCT (Indian Food Composition Tables)", purpose: "Nutrient values for Indian foods" },
  ],
  deficiency: [
    { source: "NIH Office of Dietary Supplements", purpose: "Reference information on vitamin and mineral inadequacy screening" },
    { source: "WHO Vitamin and Mineral Requirements", purpose: "Global reference values for nutrient requirements" },
    { source: "ICMR-NIN", purpose: "Indian reference values for nutrient intake" },
  ],
  pregnancy: [
    { source: "ICMR-NIN", purpose: "Additional calorie and nutrient requirements during pregnancy and lactation" },
    { source: "National Academies — DRI", purpose: "Pregnancy and lactation reference intakes" },
  ],
};

// Activity levels
export const activityLevels = [
  { value: 1.2, label: "Sedentary", desc: "Little or no exercise, desk job" },
  { value: 1.375, label: "Light", desc: "Light exercise 1-3 days/week" },
  { value: 1.55, label: "Moderate", desc: "Moderate exercise 3-5 days/week" },
  { value: 1.725, label: "Very Active", desc: "Hard exercise 6-7 days/week" },
  { value: 1.9, label: "Extra Active", desc: "Very hard exercise, physical job" },
];

export const goals = [
  { value: "maintain", label: "Maintain Weight", desc: "Eat to sustain your current weight", icon: "Scale" },
  { value: "lose", label: "Lose Weight", desc: "Moderate calorie deficit (~300 kcal)", icon: "TrendingDown" },
  { value: "gain", label: "Gain Weight", desc: "Moderate calorie surplus (~300 kcal)", icon: "TrendingUp" },
];

export const dietOptions = [
  { value: "nonveg", label: "Non-Vegetarian", desc: "Includes all food groups", tags: ["veg","vegan","nonveg","dairy","egg","chicken","fish","mutton"] },
  { value: "veg", label: "Vegetarian", desc: "Plant foods + dairy + eggs excluded", tags: ["veg","vegan","dairy"] },
  { value: "vegan", label: "Vegan", desc: "Plant foods only", tags: ["vegan"] },
  { value: "eggetarian", label: "Eggetarian", desc: "Plant foods + dairy + eggs", tags: ["veg","vegan","dairy","egg"] },
];

export const allergyOptions = [
  "Dairy (Lactose)", "Eggs", "Peanuts", "Tree Nuts", "Soy", "Wheat (Gluten)", "Fish", "Shellfish", "Sesame",
];

export const intoleranceOptions = [
  "Lactose Intolerance", "Gluten Sensitivity", "Fructose", "Histamine", "FODMAP",
];
