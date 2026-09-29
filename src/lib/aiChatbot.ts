import { foodNutritionData, type FoodData } from '@/data/foods';
import { nutrientInfo } from '@/data/nutrients';
import { personalizedRecipes, type RecipeItem } from '@/data/personalizedRecipes';
import type { UserProfile, NutritionResult, MealItem } from '@/lib/calculations';

export interface ChatAction {
  label: string;
  type: 'navigate' | 'editProfile' | 'startOnboarding' | 'regenerate' | 'external' | 'logMeal';
  target?: string;
  meal?: MealItem;
}

export interface ChatFoodCard {
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  iron?: number;
  calcium?: number;
  vitaminC?: number;
  vitaminD?: number;
  tags?: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  actions?: ChatAction[];
  suggestedQuestions?: string[];
  recipeCard?: RecipeItem;
  foodCard?: ChatFoodCard;
}

export interface ChatContext {
  phase: string;
  profile: UserProfile | null;
  result: NutritionResult | null;
}

export interface ChatResponseOutput {
  text: string;
  actions?: ChatAction[];
  suggestedQuestions?: string[];
  recipeCard?: RecipeItem;
  foodCard?: ChatFoodCard;
}

/**
 * Advanced Intelligent Assistant for NutriSynth.
 * Handles natural language food search, recipe recommendations,
 * metabolic calculations, symptom matching, and site navigation.
 */
export function generateChatResponse(
  userInput: string,
  context: ChatContext
): ChatResponseOutput {
  const query = userInput.toLowerCase().trim();
  const { profile, result, phase } = context;

  // --- 1. GREETINGS & INTRODUCTIONS ---
  if (/^(hi|hello|hey|greetings|hola|namaste|sup|yo|good (morning|afternoon|evening)|start)/i.test(query)) {
    if (result && profile) {
      const remainingCal = Math.max(0, result.tdee - result.meals.reduce((sum, m) => sum + (m.details?.calories || 0), 0));
      return {
        text: `👋 **Hello! I'm your NutriSynth AI Nutritionist & Health Guide.**\n\n` +
          `I have your profile active:\n` +
          `• **Goal:** ${profile.goal.replace(/_/g, ' ')} (${profile.diet})\n` +
          `• **Daily Energy Target:** **${result.tdee.toLocaleString()} kcal** (${remainingCal} kcal remaining today)\n` +
          `• **Daily Protein:** **${result.proteinG}g**\n\n` +
          `**Here is what I can do for you right now:**\n` +
          `• 🔍 **Look up calories & nutrition** for any food or dish\n` +
          `• 🍲 **Suggest personalized recipes** that fit your remaining calories\n` +
          `• 🩺 **Check vitamin & mineral deficiency symptoms**\n` +
          `• 💡 **Explain calories, macros, or TDEE** in plain everyday English\n` +
          `• 🍽️ **Log meals directly** into your daily tracker from this chat!`,
        actions: [
          { label: '📊 Today\'s Food', type: 'navigate', target: 'dashboard' },
          { label: '🍲 Meal Ideas', type: 'navigate', target: 'planner' },
          { label: '🛒 Shopping List', type: 'navigate', target: 'grocery' },
          { label: '🧬 Vitamin Check', type: 'navigate', target: 'deficiency' },
        ],
        suggestedQuestions: [
          'What should I eat for dinner?',
          'How many calories in an apple?',
          'How much water should I drink?',
          'How do I log food without a scale?',
        ],
      };
    }

    return {
      text: `👋 **Welcome to NutriSynth! I'm your AI Nutritionist.**\n\n` +
        `I can help you build healthy habits without stress, extreme diets, or confusing math.\n\n` +
        `**How I can help you today:**\n` +
        `• 🚀 **Build your personalized nutrition plan** in 60 seconds\n` +
        `• 🍎 **Look up calories and nutrients** in any everyday food\n` +
        `• 🔬 **Explain BMR, TDEE, and macros** in plain English\n` +
        `• 🧬 **Check symptoms** like fatigue or hair loss for vitamin gaps`,
      actions: [
        { label: '🚀 Start Free Plan (60s)', type: 'startOnboarding' },
        { label: '📖 Learn How It Works', type: 'navigate', target: 'how-it-works' },
      ],
      suggestedQuestions: [
        'How does NutriSynth calculate daily calories?',
        'How many calories in 2 boiled eggs?',
        'What are the best high-protein foods?',
        'How does the vitamin deficiency check work?',
      ],
    };
  }

  // --- 2. SPECIFIC FOOD & CALORIE LOOKUP ---
  // E.g. "how many calories in an apple", "nutrition in chicken breast", "egg nutrition", "oats calories"
  const foodLookupMatch = query.match(
    /(?:how many calories in|calories in|nutrition (?:in|of)|protein in|carbs in|tell me about|is) (.+?)(?:\?|$)/i
  ) || query.match(/^(apple|banana|egg|eggs|paneer|chicken|rice|oats|milk|roti|chapati|dal|chana|soya|almonds|tofu|fish|dosa|idli)$/i);

  if (foodLookupMatch) {
    const rawTarget = (foodLookupMatch[1] || foodLookupMatch[0]).toLowerCase().trim();
    
    // Find closest food match in foodNutritionData
    const foundEntry = Object.entries(foodNutritionData).find(([key, food]) => {
      const name = food.name.toLowerCase();
      return name.includes(rawTarget) || rawTarget.includes(name) || key.includes(rawTarget.replace(/\s+/g, '_'));
    });

    if (foundEntry) {
      const [, food] = foundEntry;
      const isEggQuery = /egg/i.test(rawTarget) && /\b2\b|two/i.test(query);
      const multiplier = isEggQuery ? 2 : 1;
      const calories = Math.round(food.calories * multiplier);
      const protein = Math.round(food.protein * multiplier);
      const carbs = Math.round(food.carbs * multiplier);
      const fat = Math.round(food.fat * multiplier);
      const fiber = food.fiber ? Math.round(food.fiber * multiplier) : 0;

      const mealItemToLog: MealItem = {
        name: isEggQuery ? `2x ${food.name}` : food.name,
        food: isEggQuery ? `2x ${food.name}` : food.name,
        details: { calories, protein, carbs, fat, fiber },
        icon: 'Apple',
      };

      const foodCardData: ChatFoodCard = {
        name: isEggQuery ? `2x ${food.name}` : food.name,
        serving: isEggQuery ? '2 servings' : food.serving,
        calories,
        protein,
        carbs,
        fat,
        fiber,
        iron: food.iron,
        calcium: food.calcium,
        vitaminC: food.vitaminC,
        vitaminD: food.vitaminD,
        tags: food.tags,
      };

      return {
        text: `### 🍎 Nutrition Facts: **${foodCardData.name}**\n\n` +
          `• **Serving Size:** ${foodCardData.serving}\n` +
          `• **Energy (Calories):** **${calories} kcal**\n` +
          `• **Protein (Muscle Fuel):** **${protein}g**\n` +
          `• **Carbohydrates (Quick Energy):** **${carbs}g**\n` +
          `• **Healthy Fats:** **${fat}g**\n` +
          (fiber ? `• **Fiber (Digestion):** **${fiber}g**\n` : '') +
          (food.iron ? `• **Iron:** ${food.iron} mg\n` : '') +
          (food.calcium ? `• **Calcium:** ${food.calcium} mg\n` : '') +
          `\nWould you like to log this directly to your daily food intake?`,
        foodCard: foodCardData,
        actions: [
          {
            label: `+ Log ${foodCardData.name} (+${calories} kcal)`,
            type: 'logMeal',
            meal: mealItemToLog,
          },
          { label: '🔍 Search More Foods', type: 'navigate', target: 'food-search' },
        ],
        suggestedQuestions: [
          `What are healthy recipes with ${food.name}?`,
          'How do I track portions without a scale?',
          'What are high-protein alternatives?',
        ],
      };
    }
  }

  // --- 3. RECIPE & MEAL RECOMMENDATIONS ---
  // E.g. "what should i eat for dinner", "give me a high protein breakfast", "quick lunch", "healthy snack"
  if (
    /recipe|what (should|can) i eat|suggest (a )?meal|dinner idea|lunch idea|breakfast idea|snack idea|meal recommendation/i.test(query)
  ) {
    let desiredType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | undefined;
    if (/breakfast|morning/i.test(query)) desiredType = 'breakfast';
    else if (/lunch|afternoon/i.test(query)) desiredType = 'lunch';
    else if (/dinner|night/i.test(query)) desiredType = 'dinner';
    else if (/snack/i.test(query)) desiredType = 'snack';

    // Filter recipes matching user's diet and meal type
    const userDiet = profile?.diet?.toLowerCase() || 'veg';
    const matchingRecipes = personalizedRecipes.filter((r) => {
      if (desiredType && r.mealType !== desiredType) return false;
      if (userDiet === 'vegan' && r.dietType !== 'vegan') return false;
      if (userDiet === 'veg' && r.dietType === 'nonveg') return false;
      return true;
    });

    const chosenRecipe = matchingRecipes.length > 0
      ? matchingRecipes[Math.floor(Math.random() * matchingRecipes.length)]
      : personalizedRecipes[0];

    const mealItem: MealItem = {
      name: chosenRecipe.name,
      food: chosenRecipe.name,
      details: {
        calories: chosenRecipe.calories,
        protein: chosenRecipe.protein,
        carbs: chosenRecipe.carbs,
        fat: chosenRecipe.fat,
        fiber: chosenRecipe.fiber,
      },
      components: chosenRecipe.ingredients,
      icon: chosenRecipe.icon || 'ChefHat',
    };

    return {
      text: `### 🍲 Chef Recommendation: **${chosenRecipe.name}**\n\n` +
        `**${chosenRecipe.icon} ${chosenRecipe.mealType.toUpperCase()} • ${chosenRecipe.cookTimeMin} mins • ${chosenRecipe.difficulty}**\n\n` +
        `${chosenRecipe.description}\n\n` +
        `• **Energy:** **${chosenRecipe.calories} kcal**\n` +
        `• **Protein (Fuel):** **${chosenRecipe.protein}g**\n` +
        `• **Carbs:** **${chosenRecipe.carbs}g** | **Fats:** **${chosenRecipe.fat}g** | **Fiber:** **${chosenRecipe.fiber}g**\n\n` +
        `💡 **Why this is great for you:** ${chosenRecipe.goalBenefit}\n\n` +
        `**Key Ingredients:**\n` +
        chosenRecipe.ingredients.slice(0, 4).map((ing) => `• ${ing}`).join('\n'),
      recipeCard: chosenRecipe,
      actions: [
        {
          label: `+ Log to Today (+${chosenRecipe.calories} kcal)`,
          type: 'logMeal',
          meal: mealItem,
        },
        { label: '🍲 Browse Full Meal Planner', type: 'navigate', target: 'planner' },
        { label: '🛒 View Grocery List', type: 'navigate', target: 'grocery' },
      ],
      suggestedQuestions: [
        'Give me another recipe idea',
        'How do I add ingredients to my shopping list?',
        'How many calories do I have left today?',
      ],
    };
  }

  // --- 4. WATER INTAKE & HYDRATION ---
  if (/water|hydration|how much water|glasses of water/i.test(query)) {
    const userWeight = profile?.weight || 68;
    // Standard clinical formula: ~35ml per kg of bodyweight
    const recommendedMl = Math.round(userWeight * 35);
    const glasses = Math.round(recommendedMl / 250);

    return {
      text: `### 💧 Daily Water Intake Guide\n\n` +
        `For your body mass (**${userWeight} kg**), your optimal daily hydration target is:\n\n` +
        `• **Target:** **${(recommendedMl / 1000).toFixed(1)} Liters** (approx. **${glasses} glasses** of 250ml each).\n\n` +
        `**Practical Hydration Tips:**\n` +
        `• 🌅 **Morning Ignition:** Drink 1 full glass right upon waking to reactivate digestion and metabolism.\n` +
        `• 🍽️ **Meal Spacing:** Drink 1 glass 30 minutes before meals to aid satiety, rather than drinking large amounts during chewing.\n` +
        `• 🏃 **Active Days:** If you exercise or sweat heavily, add +500ml (2 glasses) to replenish electrolytes.\n\n` +
        `*You can track your water intake with one tap on Today's Dashboard!*`,
      actions: [
        { label: '💧 Go to Dashboard & Log Water', type: 'navigate', target: 'dashboard' },
      ],
      suggestedQuestions: [
        'Does tea or coffee count as water?',
        'What are the signs of dehydration?',
        'What should I eat today?',
      ],
    };
  }

  // --- 5. SYMPTOM & DEFICIENCY MATCHING ---
  if (
    /tired|fatigue|exhausted|low energy|hair fall|hair loss|cramp|muscle spasm|cold hands|brain fog|brittle nails|joint pain|frequent colds/i.test(query)
  ) {
    let matchedNutrient = 'Iron';
    let symptomExplanation = '';
    let topFoods = ['Spinach', 'Lentils (Dal)', 'Soya chunks', 'Pumpkin seeds'];

    if (/tired|fatigue|exhausted|low energy/i.test(query)) {
      matchedNutrient = 'Iron & Vitamin B12';
      symptomExplanation = 'Persistent fatigue is often linked to low **Iron** (anemia, meaning red blood cells carry less oxygen) or low **Vitamin B12** (essential for cellular energy metabolism).';
      topFoods = ['Sprouts Salad', 'Lentils / Dal', 'Soya chunks', 'Eggs', 'Paneer'];
    } else if (/hair fall|hair loss|brittle nails/i.test(query)) {
      matchedNutrient = 'Biotin, Iron & Zinc';
      symptomExplanation = 'Hair follicles and nail beds require steady supplies of **Iron**, **Zinc**, and **Biotin** (Vitamin B7) for keratin protein synthesis.';
      topFoods = ['Almonds & Walnuts', 'Pumpkin Seeds', 'Eggs', 'Oats', 'Lentils'];
    } else if (/cramp|muscle spasm|twitch/i.test(query)) {
      matchedNutrient = 'Magnesium & Potassium';
      symptomExplanation = 'Muscle twitches, nighttime calf cramps, or tightness frequently stem from subclinical **Magnesium** or **Potassium** deficits, which regulate muscle relaxation.';
      topFoods = ['Bananas', 'Spinach', 'Pumpkin seeds', 'Dark chocolate (70%+)', 'Almonds'];
    } else if (/joint pain|bone/i.test(query)) {
      matchedNutrient = 'Vitamin D3 & Calcium';
      symptomExplanation = 'Aches in joints or dull bone pain are the hallmark of insufficient **Vitamin D3** (needed to absorb calcium) and **Calcium**.';
      topFoods = ['Sunlight exposure (15-20 mins)', 'Fortified milk', 'Paneer', 'Ragi', 'Sesame seeds'];
    } else if (/frequent colds|immune/i.test(query)) {
      matchedNutrient = 'Vitamin C & Zinc';
      symptomExplanation = 'Catching frequent seasonal infections can signal low **Vitamin C** or **Zinc**, which power white blood cell pathogen defense.';
      topFoods = ['Amla (Indian gooseberry)', 'Oranges / Lemons', 'Bell peppers', 'Guava', 'Chickpeas'];
    }

    return {
      text: `### 🩺 Symptom Analyzer: **Potential ${matchedNutrient} Shortfall**\n\n` +
        `${symptomExplanation}\n\n` +
        `**Best Everyday Foods to Replenish:**\n` +
        topFoods.map((f) => `• **${f}**`).join('\n') +
        `\n\n💡 *Action Step:* You can run our interactive Vitamin & Mineral Check to screen your complete diet and review clinical blood test ranges.`,
      actions: [
        { label: '🧬 Run Vitamin & Mineral Check', type: 'navigate', target: 'deficiency' },
        { label: '📊 View My Daily Intake', type: 'navigate', target: 'dashboard' },
      ],
      suggestedQuestions: [
        `What foods are richest in ${matchedNutrient}?`,
        'How do I test my vitamin levels?',
        'Can food alone fix a vitamin deficiency?',
      ],
    };
  }

  // --- 6. USER'S CURRENT PLAN & PROGRESS ---
  if (
    /my (plan|macros|targets|calories|budget|intake|diet|profile|goals?|stats)/i.test(query) ||
    /how many calories (should i|do i|am i)/i.test(query) ||
    /what are my (macros|targets|calories)/i.test(query) ||
    /how am i doing today/i.test(query)
  ) {
    if (result && profile) {
      const eatenCal = result.meals.reduce((sum, m) => sum + (m.details?.calories || 0), 0);
      const remainingCal = Math.max(0, result.tdee - eatenCal);

      return {
        text: `### 📊 Your Daily NutriSynth Blueprint\n\n` +
          `• **Daily Energy Budget (TDEE):** **${result.tdee.toLocaleString()} kcal**\n` +
          `• **Eaten Today:** **${eatenCal} kcal** (${remainingCal} kcal left)\n` +
          `• **Resting Energy Burn (BMR):** **${Math.round(result.bmr)} kcal** (what your body burns at rest)\n` +
          `• **Protein (Muscle & Repair):** **${result.proteinG}g** (${result.proteinCal} kcal)\n` +
          `• **Carbohydrates (Everyday Energy):** **${result.carbG}g** (${result.carbCal} kcal)\n` +
          `• **Healthy Fats (Hormones & Brain):** **${result.fatG}g** (${result.fatCal} kcal)\n` +
          `• **Fiber (Digestion):** **${result.fiberG}g**\n` +
          `• **Current Goal:** ${profile.goal.replace(/_/g, ' ').toUpperCase()} | Diet: ${profile.diet}\n\n` +
          `You currently have **${result.meals.length} meal(s)** logged for today.`,
        actions: [
          { label: '🍽️ View Today\'s Food', type: 'navigate', target: 'dashboard' },
          { label: '✏️ Edit Profile & Goals', type: 'editProfile' },
          { label: '🔄 Reshuffle Daily Meals', type: 'regenerate' },
        ],
        suggestedQuestions: [
          'What should I eat for my remaining calories?',
          'How is my protein calculated?',
          'How do I log a custom meal?',
        ],
      };
    }

    return {
      text: `You haven't set up your nutrition plan yet!\n\nTake our quick 60-second questionnaire. We'll calculate your exact personalized calorie budget and macro ratios based on your age, height, weight, and lifestyle.`,
      actions: [
        { label: '🚀 Build My Plan Now', type: 'startOnboarding' },
      ],
      suggestedQuestions: [
        'How are calories calculated?',
        'Is NutriSynth free?',
        'What diets are supported?',
      ],
    };
  }

  // --- 7. EXPLAINING CALORIES, MACROS & FORMULAS (ZERO-JARGON) ---
  if (/calorie|what is a calorie|bmr|tdee|mifflin|formula|how (is|are) calories calculated/i.test(query)) {
    return {
      text: `### 🔬 Calories & Energy Explained in Plain English\n\n` +
        `**1. What is a Calorie?**\n` +
        `Think of calories as **units of fuel** (like battery charge on your phone). Your body uses calories 24/7 to breathe, pump blood, walk, and think.\n\n` +
        `**2. What is BMR (Basal Metabolic Rate)?**\n` +
        `The calories your organs burn if you stayed in bed all day doing absolutely nothing. We calculate this using the clinically proven **Mifflin-St Jeor formula**.\n\n` +
        `**3. What is TDEE (Total Daily Energy Expenditure)?**\n` +
        `Your BMR plus the energy you burn moving, working, and exercising throughout the day.\n\n` +
        `**4. How Weight Loss & Gain Work:**\n` +
        `• **Calorie Deficit (Weight Loss):** Eating ~15-20% less than your TDEE prompts your body to burn stored fat for fuel.\n` +
        `• **Calorie Surplus (Muscle Gain):** Eating slightly above your TDEE provides raw material to build muscle tissue.\n` +
        `• **Maintenance:** Eating equal to your TDEE keeps your weight stable.`,
      actions: [
        { label: '📖 Read Scientific Guide', type: 'navigate', target: 'how-it-works' },
        ...(profile
          ? [{ label: '📊 View My Numbers', type: 'navigate' as const, target: 'dashboard' }]
          : [{ label: '🚀 Calculate Mine', type: 'startOnboarding' as const }]),
      ],
      suggestedQuestions: [
        'What are the 3 macros and what do they do?',
        'How do I track food without a kitchen scale?',
        'Can I eat carbs and still lose weight?',
      ],
    };
  }

  // --- 8. HAND-PORTION GUIDE (NO SCALE REQUIRED) ---
  if (/scale|portion|portion size|measure food|without a scale|hand guide/i.test(query)) {
    return {
      text: `### ✋ The Zero-Scale Hand Portion Guide\n\n` +
        `You never need to weigh food or carry a kitchen scale! Use your hand anywhere:\n\n` +
        `• ✋ **Your Palm = 1 Serving of Protein (~25g)**\n` +
        `  Examples: 1 chicken breast, 1 block of paneer/tofu, 2 boiled eggs, 1 cup cooked lentils.\n\n` +
        `• ✊ **Your Fist = 1 Serving of Veggies or Carbs (~1 cup)**\n` +
        `  Examples: 1 bowl of cooked rice, 1 potato, 1 big salad bowl, broccoli.\n\n` +
        `• 🤲 **Cupped Hand = 1 Serving of Grains or Snacks (~1/2 cup)**\n` +
        `  Examples: 1 serving oats, berries, grapes, popcorn.\n\n` +
        `• 👍 **Your Thumb = 1 Serving of Healthy Fats (~1 tablespoon / 15g)**\n` +
        `  Examples: Olive oil, butter, peanut butter, ghee, mixed nuts.`,
      actions: [
        { label: '🍽️ Log a Meal Now', type: 'navigate', target: 'dashboard' },
      ],
      suggestedQuestions: [
        'How many palm portions of protein do I need daily?',
        'What should I eat for dinner?',
        'How many calories in an apple?',
      ],
    };
  }

  // --- 9. CAN I EAT PIZZA / CHEAT MEALS? ---
  if (/pizza|burger|junk food|cheat meal|chocolate|ice cream|can i eat/i.test(query)) {
    return {
      text: `### 🍕 Can You Eat Pizza, Burgers, or Treats?\n\n` +
        `**Yes, absolutely!** No single food will make you gain weight or ruin your health.\n\n` +
        `**The 80 / 20 Golden Principle:**\n` +
        `• **80% of your food:** Nourishing whole foods (dal, rice, vegetables, fruits, eggs, paneer, chicken, nuts).\n` +
        `• **20% of your food:** Enjoyable treats with family and friends (a slice of pizza, ice cream, favorite desserts).\n\n` +
        `**How to fit it in easily:**\n` +
        `1. A standard slice of cheese pizza is about **250–290 kcal**.\n` +
        `2. Simply log it in your NutriSynth tracker — as long as your total calories at the end of the day align with your budget, you will continue making steady progress!\n` +
        `3. Keep your protein intake high during the other meals to stay full.`,
      actions: [
        { label: '📊 Check Remaining Calories Today', type: 'navigate', target: 'dashboard' },
      ],
      suggestedQuestions: [
        'How do I log a restaurant meal?',
        'What should I eat for high protein?',
        'How much water should I drink?',
      ],
    };
  }

  // --- 10. EXERCISE & CALORIE BURNING ---
  if (/steps|walk|running|burn calories|cardio|exercise|gym|workout/i.test(query)) {
    return {
      text: `### 👟 Walking & Exercise Calorie Burn\n\n` +
        `• **10,000 Steps:** Burns approximately **350–500 kcal** (depending on your body weight and walking speed).\n` +
        `• **30-Min Brisk Walk:** Burns ~**120–160 kcal**.\n` +
        `• **45-Min Strength Training:** Burns ~**180–260 kcal** plus boosts your metabolism for up to 24 hours (EPOC effect)!\n\n` +
        `💡 **Best Strategy for Beginners:**\n` +
        `Consistency beats intensity! Start with **6,000 to 8,000 daily steps** and 2 simple bodyweight sessions per week. Nutrition accounts for 80% of fat loss and body composition.`,
      actions: [
        { label: '🔥 Check Daily Streak', type: 'navigate', target: 'streak' },
        { label: '🏆 30-Day Road-map', type: 'navigate', target: 'challenge' },
      ],
      suggestedQuestions: [
        'Is cardio or weight lifting better for fat loss?',
        'How many calories should I eat on workout days?',
        'What are good pre-workout foods?',
      ],
    };
  }

  // --- 11. GROCERY LIST & MEAL PLANNING ---
  if (/grocery|shopping|buy|market|ingredients|meal plan/i.test(query)) {
    return {
      text: `### 🛒 Smart Grocery List & Meal Planner\n\n` +
        `NutriSynth includes a smart shopping checklist that automatically organizes everything you need:\n\n` +
        `• **Categorized Checklists:** Produce & Greens, Proteins & Dairy, Pantry Staples, and Healthy Fats.\n` +
        `• **1-Tap Staples Bar:** Add eggs, milk, bananas, rice, and oats with a single tap.\n` +
        `• **Printable PDF Export:** Download and print a clean shopping sheet for the store.\n` +
        `• **Meal Planner Sync:** Generate a full week of recipe ingredients with zero leftover food waste!`,
      actions: [
        { label: '🛒 Open Grocery List', type: 'navigate', target: 'grocery' },
        { label: '🍲 Open Meal Planner', type: 'navigate', target: 'planner' },
      ],
      suggestedQuestions: [
        'What healthy staples should I always have at home?',
        'How do I export my grocery list as PDF?',
        'How do I swap a recipe I don\'t like?',
      ],
    };
  }

  // --- 12. EXPORTING / DOWNLOADING PDF OR PRESENTATIONS ---
  if (/export|download|pdf|print|powerpoint|pptx|save/i.test(query)) {
    return {
      text: `### 📄 How to Export & Print Your Plans\n\n` +
        `You can download your entire nutrition blueprint in multiple formats:\n\n` +
        `• **📑 PDF Report:** Formatted document with your daily targets, macro split, meal timetable, and micronutrients.\n` +
        `• **📊 Presentation (PPTX):** Slide deck to share with a trainer, coach, or doctor.\n` +
        `• **🖼️ Image Summary (PNG):** Clean visual card to save to your camera roll or stick to your fridge.\n\n` +
        `**Where to find it:** Click the **"Download"** button at the top of your **Dashboard** or **Grocery List**!`,
      actions: [
        { label: '📊 Go to Dashboard (Export)', type: 'navigate', target: 'dashboard' },
        { label: '🛒 Go to Grocery List (PDF)', type: 'navigate', target: 'grocery' },
      ],
      suggestedQuestions: [
        'Can I customize the PDF title?',
        'How do I print the grocery checklist?',
        'Can I recalculate my plan?',
      ],
    };
  }

  // --- 13. APP NAVIGATION: WHERE IS X? ---
  if (/where is|navigate|how do i get to|find/i.test(query)) {
    return {
      text: `### 🧭 Quick Site Map & Navigation\n\n` +
        `Here is where all major features live:\n\n` +
        `• **Today's Food (Dashboard):** Calorie meter, macro bars, logged meals, and quick water logger.\n` +
        `• **Meal Ideas (Planner):** Easy, delicious recipe catalog custom-ranked for your body.\n` +
        `• **Shopping List (Grocery):** Categorized grocery checklist with PDF export.\n` +
        `• **My Progress (Analytics):** Weight tracker, consistency trends, and body changes.\n` +
        `• **Daily Habits (Streak):** 7-day habit checklist for hydration, steps, and sleep.\n` +
        `• **30-Day Road-map:** Progressive 30-day milestone challenge with printable certificate.\n` +
        `• **Vitamin Check:** 12-micronutrient health test, symptom checker, and blood test lab tool.`,
      actions: [
        { label: '📊 Today\'s Food', type: 'navigate', target: 'dashboard' },
        { label: '🍲 Meal Ideas', type: 'navigate', target: 'planner' },
        { label: '🛒 Shopping List', type: 'navigate', target: 'grocery' },
        { label: '🧬 Vitamin Check', type: 'navigate', target: 'deficiency' },
      ],
      suggestedQuestions: [
        'How do I log a meal?',
        'How do I change my weight goal?',
        'What should I eat for dinner?',
      ],
    };
  }

  // --- 14. DEFAULT NATURAL INTELLIGENCE FALLBACK ---
  return {
    text: `### 💡 NutriSynth AI Assistant\n\n` +
      `I can help you with anything on this website! Try asking me:\n\n` +
      `• 🍎 *"How many calories in an apple or 2 eggs?"*\n` +
      `• 🍲 *"Give me a high-protein dinner idea under 500 kcal"*\n` +
      `• 💧 *"How much water should I drink for my weight?"*\n` +
      `• 🔬 *"Explain calories and macros in plain English"*\n` +
      `• ✋ *"How do I measure portion sizes without a scale?"*\n` +
      `• 🩺 *"I feel tired and have hair fall, what vitamins do I need?"*`,
    actions: [
      ...(result
        ? [
            { label: '📊 Today\'s Food', type: 'navigate' as const, target: 'dashboard' },
            { label: '🍲 Meal Ideas', type: 'navigate' as const, target: 'planner' },
            { label: '🧬 Vitamin Check', type: 'navigate' as const, target: 'deficiency' },
          ]
        : [
            { label: '🚀 Build My Plan', type: 'startOnboarding' as const },
            { label: '📖 Learn How It Works', type: 'navigate' as const, target: 'how-it-works' },
          ]),
    ],
    suggestedQuestions: [
      'What should I eat for dinner?',
      'How many calories in an apple?',
      'How does NutriSynth calculate calories?',
      'How much water should I drink?',
    ],
  };
}
