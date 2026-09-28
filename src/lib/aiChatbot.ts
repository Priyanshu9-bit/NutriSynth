import { foodNutritionData } from '@/data/foods';
import { nutrientInfo } from '@/data/nutrients';
import type { UserProfile, NutritionResult } from '@/lib/calculations';

export interface ChatAction {
  label: string;
  type: 'navigate' | 'editProfile' | 'startOnboarding' | 'regenerate' | 'external';
  target?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  actions?: ChatAction[];
  suggestedQuestions?: string[];
}

export interface ChatContext {
  phase: string;
  profile: UserProfile | null;
  result: NutritionResult | null;
}

/**
 * Intelligent solution and response generator for NutriSynth website questions
 */
export function generateChatResponse(
  userInput: string,
  context: ChatContext
): { text: string; actions?: ChatAction[]; suggestedQuestions?: string[] } {
  const query = userInput.toLowerCase().trim();
  const { profile, result, phase } = context;

  // 1. GREETINGS & INTRODUCTIONS
  if (/^(hi|hello|hey|greetings|hola|namaste|sup|yo|good (morning|afternoon|evening))/i.test(query)) {
    if (result && profile) {
      return {
        text: `Hello! 👋 I'm your **NutriSynth AI Assistant**.\n\nI see you have an active plan targeting **${result.tdee.toLocaleString()} kcal/day** (${result.proteinG}g protein, ${result.carbG}g carbs, ${result.fatG}g fats) for your **${profile.goal}** goal.\n\nHow can I help you today? You can ask me about your meals, how calculations work, how to scan foods, or check for vitamin deficiencies!`,
        actions: [
          { label: '📊 View My Dashboard', type: 'navigate', target: 'dashboard' },
          { label: '🧬 Check Deficiencies', type: 'navigate', target: 'deficiency' },
        ],
        suggestedQuestions: [
          'What are my current macro targets?',
          'How do I scan or log food?',
          'How are my calories calculated?',
          'How do I export my plan as PDF?'
        ]
      };
    }
    return {
      text: `Hello! 👋 Welcome to **NutriSynth**!\n\nI'm your AI guide for everything on this website. I can help you with:\n- 🥗 **Creating your personalized meal plan**\n- 🔬 **Understanding BMR, TDEE & macro calculations**\n- 🧬 **Checking vitamin & mineral deficiency risks**\n- 📷 **Using the Food Scanner & Search**\n- 📄 **Exporting your plan to PDF or PowerPoint**\n\nWhat would you like to know or do?`,
      actions: [
        { label: '🚀 Start Free Analysis', type: 'startOnboarding' },
        { label: '📖 How It Works', type: 'navigate', target: 'how-it-works' },
      ],
      suggestedQuestions: [
        'How do I get my personalized plan?',
        'How does NutriSynth calculate BMR and TDEE?',
        'How do I check vitamin deficiencies?',
        'What diets and cuisines are supported?'
      ]
    };
  }

  // 2. USER ASKS ABOUT THEIR CURRENT PLAN / MACROS
  if (
    /my (plan|macros|targets|calories|intake|diet|profile|goals?|stats)/i.test(query) ||
    /how many calories (should i|do i|am i)/i.test(query) ||
    /what are my (macros|targets|calories)/i.test(query)
  ) {
    if (result && profile) {
      return {
        text: `Here are your current **NutriSynth Targets**:\n\n` +
          `• **Daily Calorie Target (TDEE):** **${result.tdee.toLocaleString()} kcal**\n` +
          `• **Basal Metabolic Rate (BMR):** **${Math.round(result.bmr).toLocaleString()} kcal** (calories burned at complete rest)\n` +
          `• **Protein:** **${result.proteinG}g** (${result.proteinCal} kcal)\n` +
          `• **Carbohydrates:** **${result.carbG}g** (${result.carbCal} kcal)\n` +
          `• **Healthy Fats:** **${result.fatG}g** (${result.fatCal} kcal)\n` +
          `• **Dietary Fiber:** **${result.fiberG}g**\n` +
          `• **Goal:** ${profile.goal.toUpperCase()} | Diet: ${profile.diet} | Weight: ${profile.weight} kg\n\n` +
          `You currently have **${result.meals.length} meals** planned for today.`,
        actions: [
          { label: '📊 Go to Dashboard', type: 'navigate', target: 'dashboard' },
          { label: '✏️ Edit Profile & Goals', type: 'editProfile' },
          { label: '🔄 Regenerate Meals', type: 'regenerate' }
        ],
        suggestedQuestions: [
          'What meals are in my plan today?',
          'How is my protein calculated?',
          'How do I log food I ate?',
          'Can I change my weight or goal?'
        ]
      };
    } else {
      return {
        text: `You haven't generated a nutrition plan yet!\n\nTo see your personalized calories, macros, and micronutrient targets, simply take the quick 1-minute analysis. We'll calculate your exact BMR and macro split using the Mifflin-St Jeor formula and ICMR/USDA standards.`,
        actions: [
          { label: '🚀 Build My Plan Now', type: 'startOnboarding' }
        ],
        suggestedQuestions: [
          'How do you calculate BMR?',
          'What questions are asked in onboarding?',
          'Is NutriSynth free to use?'
        ]
      };
    }
  }

  // 3. USER ASKS ABOUT TODAY'S MEALS
  if (/(what are|show|tell me) (my|today's) meals/i.test(query) || /what should i eat/i.test(query) || /my meal plan/i.test(query)) {
    if (result && result.meals.length > 0) {
      const mealList = result.meals
        .map((m, idx) => `**${idx + 1}. ${m.name}:** ${m.food} — *${m.details.calories} kcal (P: ${m.details.protein}g, C: ${m.details.carbs}g, F: ${m.details.fat}g)*`)
        .join('\n');
      return {
        text: `Here is your current meal breakdown for today:\n\n${mealList}\n\n` +
          `💡 *Tip: You can swap or re-shuffle recommendations with "Regenerate Meals", or scan extra foods using the Food Scanner on your Dashboard.*`,
        actions: [
          { label: '🍽️ View Meals Dashboard', type: 'navigate', target: 'dashboard' },
          { label: '🔄 Regenerate Meals', type: 'regenerate' }
        ],
        suggestedQuestions: [
          'How do I add or scan a meal?',
          'Can I swap a food item?',
          'How are micronutrients calculated in meals?'
        ]
      };
    } else {
      return {
        text: `You don't have any active meals yet! Complete our quick onboarding to get a full day's tailored Breakfast, Lunch, Dinner, and Snack plan designed specifically for your dietary preferences.`,
        actions: [
          { label: '🚀 Build My Plan', type: 'startOnboarding' }
        ]
      };
    }
  }

  // 4. HOW BMR & TDEE ARE CALCULATED
  if (
    /bmr/i.test(query) ||
    /tdee/i.test(query) ||
    /how (are|do you calculate) (calories|bmr|tdee)/i.test(query) ||
    /calorie formula/i.test(query) ||
    /calculation/i.test(query)
  ) {
    let personalNote = '';
    if (profile && result) {
      personalNote = `\n\n📌 **For your specific profile:**\n- Weight: ${profile.weight}kg, Height: ${profile.height}cm, Age: ${profile.age}, Gender: ${profile.gender}\n- Calculated BMR: **${Math.round(result.bmr)} kcal**\n- TDEE with activity multiplier: **${result.tdee} kcal**`;
    }

    return {
      text: `### 🔬 How NutriSynth Calculates Your Energy Needs\n\n` +
        `**1. Basal Metabolic Rate (BMR):**\n` +
        `We use the gold-standard **Mifflin-St Jeor Equation**:\n` +
        `• **Men:** \`10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5\`\n` +
        `• **Women:** \`10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161\`\n\n` +
        `**2. Total Daily Energy Expenditure (TDEE):**\n` +
        `Your BMR is multiplied by your Physical Activity Level (PAL):\n` +
        `• Sedentary: × 1.2\n` +
        `• Lightly Active: × 1.375\n` +
        `• Moderately Active: × 1.55\n` +
        `• Very Active: × 1.725\n` +
        `• Super Active: × 1.9\n\n` +
        `**3. Goal Adjustments:**\n` +
        `• **Weight Loss:** A healthy deficit of ~15-20% is subtracted.\n` +
        `• **Muscle Gain:** A modest surplus is added to fuel hypertrophy.\n` +
        `• **Maintenance:** Kept at full TDEE.${personalNote}`,
      actions: [
        { label: '📖 Read "How It Works"', type: 'navigate', target: 'how-it-works' },
        ...(profile ? [{ label: '✏️ Edit Profile', type: 'editProfile' }] : [{ label: '🚀 Calculate Mine', type: 'startOnboarding' }])
      ],
      suggestedQuestions: [
        'How is my protein target calculated?',
        'How are carbs and fats determined?',
        'How do I check vitamin deficiencies?'
      ]
    };
  }

  // 5. PROTEIN & MACRONUTRIENT CALCULATIONS
  if (/protein/i.test(query) && /(calculate|formula|how much|recommend|target|per kg)/i.test(query)) {
    return {
      text: `### 🥩 How Protein Recommendations Are Formulated\n\n` +
        `NutriSynth uses evidence-based protein brackets scaled to your body mass and physical activity:\n\n` +
        `• **Sedentary / Light:** \`1.0g\` protein per kg of bodyweight\n` +
        `• **Moderate Exercise (3-5 days/wk):** \`1.2g - 1.4g\` per kg\n` +
        `• **Heavy Training / High Intensity:** \`1.6g\` per kg\n` +
        `• **Lactation:** Adds \`+19g\` daily to support breast milk synthesis\n` +
        `• **Pregnancy:** Increased baseline protein to support fetal tissue growth\n\n` +
        `**Fats & Carbohydrates:**\n` +
        `• Dietary Fat is locked at **25%** of daily calories for essential hormone production.\n` +
        `• Carbohydrates make up the remaining balance to sustain training stamina and brain glucose.`,
      actions: [
        { label: '📊 View Macro Split in Dashboard', type: 'navigate', target: 'dashboard' },
        { label: '🍗 High-Protein Foods List', type: 'navigate', target: 'dashboard' }
      ],
      suggestedQuestions: [
        'What are the best high-protein foods here?',
        'How do I scan or log food?',
        'How do I export my plan?'
      ]
    };
  }

  // 6. DEFICIENCY CHECKER & VITAMIN / MINERAL QUESTIONS
  if (
    /deficiency/i.test(query) ||
    /vitamin/i.test(query) ||
    /mineral/i.test(query) ||
    /iron|b12|vitamin d|calcium|zinc|magnesium|folate/i.test(query) ||
    /symptom/i.test(query)
  ) {
    return {
      text: `### 🧬 NutriSynth Deficiency Check Feature\n\n` +
        `Our **Deficiency Risk Checker** screens for subclinical nutrient shortfalls across **12 vital micronutrients** (Iron, Vitamin D, B12, Calcium, Zinc, Magnesium, Folate, Vitamin C, etc.).\n\n` +
        `**What you can do:**\n` +
        `1. **Analyze Dietary Intake:** Compare your planned and logged foods against age/gender-specific **RDA/RDI standards**.\n` +
        `2. **Check Symptoms:** Match symptoms like fatigue, hair thinning, muscle twitches, or brittle nails with potential deficiencies.\n` +
        `3. **Input Lab Tests (Optional):** Enter your latest blood panel numbers (Serum Ferritin, 25-OH Vitamin D, Serum B12) to detect anomalies with standard reference ranges.\n` +
        `4. **Dietary Recommendations:** Get targeted food recommendations to safely bridge any identified gaps.`,
      actions: [
        { label: '🧬 Open Deficiency Check', type: 'navigate', target: 'deficiency' },
        { label: '📊 Check Intake on Dashboard', type: 'navigate', target: 'dashboard' }
      ],
      suggestedQuestions: [
        'What foods are rich in Iron?',
        'What foods are rich in Vitamin B12?',
        'What foods are rich in Vitamin D?',
        'How do you determine RDI standards?'
      ]
    };
  }

  // 7. FOOD SCANNER & SEARCHING FOODS
  if (
    /scan/i.test(query) ||
    /barcode/i.test(query) ||
    /camera/i.test(query) ||
    /log (food|meal|snack)/i.test(query) ||
    /search (food|database)/i.test(query) ||
    /add (a )?(meal|food)/i.test(query)
  ) {
    return {
      text: `### 📷 How to Scan and Log Food on NutriSynth\n\n` +
        `You can log meals on your **Dashboard** using the **"Scan Food"** or **"Nutrition Hub"** tool. It offers three ways to track:\n\n` +
        `1. **📷 AI Camera & Photo Scanner:**\n` +
        `   • Snap a picture or upload an image of your meal or nutrition facts label.\n` +
        `   • The AI visual scanner detects ingredients, estimates portion size, and calculates macros.\n\n` +
        `2. **🔍 Verified Food Search:**\n` +
        `   • Search our verified database of Indian and international staples (dals, rotis, rice, curries, fruits, shakes).\n\n` +
        `3. **✏️ Custom Manual Entry:**\n` +
        `   • Enter custom calories, protein, carbs, and fats for any unique item or restaurant meal.\n\n` +
        `*Logged meals are automatically reflected in your daily totals and nutrient graphs!*`,
      actions: [
        { label: '📊 Go to Dashboard to Log Food', type: 'navigate', target: 'dashboard' },
        { label: '🚀 Build Plan First', type: 'startOnboarding' }
      ],
      suggestedQuestions: [
        'Can I scan barcodes?',
        'How do I export my plan?',
        'What if a food is not in the database?'
      ]
    };
  }

  // 8. EXPORTING / DOWNLOADING (PDF, PPTX, IMAGE)
  if (
    /export/i.test(query) ||
    /download/i.test(query) ||
    /pdf/i.test(query) ||
    /powerpoint|pptx/i.test(query) ||
    /save (my )?plan/i.test(query) ||
    /print/i.test(query)
  ) {
    return {
      text: `### 📄 How to Export & Download Your Meal Plan\n\n` +
        `NutriSynth allows you to download and print your complete nutrition breakdown in **three formats**:\n\n` +
        `1. **📑 PDF Report:** Comprehensive, multi-page document featuring your BMR, TDEE, macro split, meal schedule, and micronutrient analysis.\n` +
        `2. **📊 PowerPoint Presentation (PPTX):** Beautiful presentation slides ready to share with clients, trainers, or nutritionists.\n` +
        `3. **🖼️ High-Res Image (PNG):** A crisp visual summary card ideal for saving to your phone camera roll or fridge.\n\n` +
        `**Where to find it:**\n` +
        `• Navigate to the **Dashboard** or **Deficiency Check** page.\n` +
        `• Click the **"Export Plan"** button located at the top-right corner.\n` +
        `• Select your desired format to trigger instant generation!`,
      actions: [
        { label: '📊 Open Dashboard (Export)', type: 'navigate', target: 'dashboard' },
        { label: '🧬 Open Deficiency Check', type: 'navigate', target: 'deficiency' }
      ],
      suggestedQuestions: [
        'How do I edit my profile?',
        'Can I regenerate my meals?',
        'How are micronutrients calculated?'
      ]
    };
  }

  // 9. HOW TO EDIT PROFILE / REGENERATE / RECALCULATE
  if (
    /edit/i.test(query) ||
    /change (my )?(weight|height|age|goal|diet)/i.test(query) ||
    /update (my )?profile/i.test(query) ||
    /recalculate/i.test(query) ||
    /regenerate/i.test(query) ||
    /shuffle/i.test(query)
  ) {
    return {
      text: `### 🔄 How to Update Details & Regenerate Your Plan\n\n` +
        `• **To Update Weight, Goals, or Diet:**\n` +
        `  1. Go to your **Dashboard**.\n` +
        `  2. Click **"Edit Profile"** in the top action bar.\n` +
        `  3. Update any metrics (weight, activity level, dietary preference, allergies).\n` +
        `  4. Click **"Save & Recalculate"** to immediately update your BMR, TDEE, and meals.\n\n` +
        `• **To Reshuffle Meals:**\n` +
        `  1. Click **"Regenerate Meals"** on the Dashboard.\n` +
        `  2. The system picks alternative dishes that match your exact macronutrient budget!`,
      actions: [
        { label: '✏️ Edit Profile Now', type: 'editProfile' },
        { label: '🔄 Regenerate Meals', type: 'regenerate' },
        { label: '📊 View Dashboard', type: 'navigate', target: 'dashboard' }
      ],
      suggestedQuestions: [
        'What goals can I choose from?',
        'How are allergies handled?',
        'Can I log custom food items?'
      ]
    };
  }

  // 10. HIGH PROTEIN FOOD RECOMMENDATIONS
  if (/high protein|best protein|protein sources/i.test(query)) {
    const proteinFoods = Object.values(foodNutritionData)
      .filter((f) => f.protein >= 10)
      .slice(0, 8);

    const foodList = proteinFoods
      .map((f) => `• **${f.name}** (${f.serving}): **${f.protein}g protein**, ${f.calories} kcal [Tags: ${f.tags?.join(', ') || 'staple'}]`)
      .join('\n');

    return {
      text: `### 🍗 Top High-Protein Foods in NutriSynth\n\nHere are some of the highest-protein items available in our database:\n\n${foodList}\n\n` +
        `*Vegetarian favorites:* Soya chunks, Paneer, Lentils (Toor/Moong/Masoor dal), Sprouts, Oats.\n` +
        `*Non-vegetarian favorites:* Chicken breast, Fish curry, Eggs, Mutton.`,
      actions: [
        { label: '📊 View in Dashboard', type: 'navigate', target: 'dashboard' },
        { label: '🔄 Regenerate Meals', type: 'regenerate' }
      ],
      suggestedQuestions: [
        'What high-iron foods do you recommend?',
        'How much protein do I need per kg?',
        'How do I log these foods?'
      ]
    };
  }

  // 11. SPECIFIC NUTRIENT FOOD SOURCES (IRON, B12, VIT D, CALCIUM)
  if (/iron/i.test(query)) {
    return {
      text: `### 🩸 Best Iron-Rich Foods in NutriSynth\n\n` +
        `• **Soya chunks** (~4mg per serving)\n` +
        `• **Sprouts Salad** (~3mg)\n` +
        `• **Ragi Malt** (~3.5mg, also great for calcium)\n` +
        `• **Chana Masala & Rajma** (~3.5mg)\n` +
        `• **Methi Thepla / Green Leafy Vegetables** (~2.8mg)\n` +
        `• **Chicken & Mutton** (~2.5-3.5mg heme iron)\n\n` +
        `💡 *Absorption Tip:* Pair iron-rich meals with Vitamin C (lemon juice, bell peppers, amla, oranges) and avoid drinking tea/coffee within 1 hour of meals to maximize absorption!`,
      actions: [
        { label: '🧬 Check Iron Status in Deficiency Check', type: 'navigate', target: 'deficiency' }
      ],
      suggestedQuestions: [
        'How do I check my anemia risk?',
        'What are good Vitamin B12 sources?',
        'How do I export my plan?'
      ]
    };
  }

  if (/b12|vitamin b12/i.test(query)) {
    return {
      text: `### 🧠 Best Vitamin B12 Sources\n\n` +
        `Vitamin B12 is essential for nerve function and red blood cell production. It is naturally synthesized by microorganisms and found predominantly in animal/dairy foods:\n\n` +
        `• **Eggs (Egg Curry / Bhurji):** ~1.6 mcg per 2 eggs\n` +
        `• **Fish Curry:** ~2.0 mcg\n` +
        `• **Mutton / Poultry:** ~0.8 - 2.5 mcg\n` +
        `• **Dairy (Paneer, Milk, Curd/Yogurt):** ~0.5 mcg per serving\n` +
        `• **Plant-based:** Fortified plant milks, nutritional yeast, or supplements are recommended for strict vegans.\n\n` +
        `*Standard Adult RDI: 2.4 mcg/day.*`,
      actions: [
        { label: '🧬 Check Vitamin B12 Deficiency', type: 'navigate', target: 'deficiency' }
      ],
      suggestedQuestions: [
        'How do I check for deficiencies?',
        'What are good Vitamin D sources?',
        'How is my daily diet analyzed?'
      ]
    };
  }

  // 12. DIETS & ALLERGIES SUPPORTED
  if (/diet|vegan|vegetarian|keto|pescatarian|paleo|allergy|allergies|gluten|dairy/i.test(query)) {
    return {
      text: `### 🥑 Diets & Allergy Customization in NutriSynth\n\n` +
        `NutriSynth supports tailored meal planning for diverse dietary preferences:\n\n` +
        `• **Diets:** Omnivore (Non-Veg), Lacto-Vegetarian, Ovo-Vegetarian, Vegan, Keto (Low-Carb High-Fat), Pescatarian, and Paleo.\n` +
        `• **Allergies & Intolerances Filtered:** Dairy/Lactose, Gluten/Wheat, Peanuts, Tree Nuts, Soy, Shellfish, Fish, Eggs.\n` +
        `• **Special Stages:** Pregnancy (adds trimester energy & micronutrient adjustments) and Lactation (+19g protein, extra hydration & calories).\n\n` +
        `When you set your profile, foods containing restricted ingredients are strictly filtered out of your meal recommendations!`,
      actions: [
        { label: '✏️ Customize My Diet in Profile', type: 'editProfile' },
        { label: '🚀 Start Free Analysis', type: 'startOnboarding' }
      ],
      suggestedQuestions: [
        'How do I edit my diet preference?',
        'How does NutriSynth calculate BMR?',
        'Where do you get your nutrition data?'
      ]
    };
  }

  // 13. WEBSITE NAVIGATION & BUTTONS (Where is X?)
  if (/where is|how to find|navigate|can't find|how do i get to/i.test(query)) {
    return {
      text: `### 🧭 Quick Navigation Guide for NutriSynth\n\n` +
        `Here is where everything is located in the app:\n\n` +
        `• **Home / Landing:** Overview of NutriSynth features, scientific foundations, and quick start button.\n` +
        `• **How It Works:** In-depth breakdown of metabolic science, macro allocation, and micronutrient synthesis.\n` +
        `• **My Nutrition / Dashboard:** Your calorie ring, macro bars, meal schedules, food scanner, and export buttons.\n` +
        `• **Deficiency Check:** Nutrient radar chart, symptom checker, and lab test input.\n` +
        `• **About:** Mission, values, and evidence references (ICMR-NIN, USDA FoodData Central).\n\n` +
        `*Note: The Dashboard requires completing the quick onboarding profile first.*`,
      actions: [
        { label: '🏠 Go to Home', type: 'navigate', target: 'landing' },
        { label: '📊 Go to Dashboard', type: 'navigate', target: 'dashboard' },
        { label: '🧬 Go to Deficiency Check', type: 'navigate', target: 'deficiency' },
        { label: '📖 Go to How It Works', type: 'navigate', target: 'how-it-works' }
      ]
    };
  }

  // 14. SCIENTIFIC EVIDENCE & DATA SOURCES
  if (/source|evidence|accurate|science|who made|credible|usda|icmr/i.test(query)) {
    return {
      text: `### 📚 Scientific Evidence & Sources\n\n` +
        `NutriSynth is built on peer-reviewed clinical nutrition standards:\n\n` +
        `• **Metabolic Equations:** Mifflin-St Jeor (validated by the American Dietetic Association as the most accurate predictive formula for BMR).\n` +
        `• **Micronutrient RDI:** Harmonized tables from **ICMR-NIN (Indian Council of Medical Research)**, **US National Academies Dietary Reference Intakes (DRI)**, and **WHO guidelines**.\n` +
        `• **Food Database:** Curated nutritional data aligned with USDA FoodData Central and regional dietary tables.\n\n` +
        `*Disclaimer: NutriSynth provides evidence-based dietary guidance for wellness and is not a substitute for clinical medical diagnosis.*`,
      actions: [
        { label: '📖 Read About & Sources', type: 'navigate', target: 'about' }
      ],
      suggestedQuestions: [
        'How does NutriSynth calculate BMR?',
        'How does the Deficiency Check work?',
        'How do I export my plan?'
      ]
    };
  }

  // 15. DEFAULT / NATURAL INTELLIGENCE FALLBACK
  return {
    text: `### 💡 NutriSynth AI Assistant\n\n` +
      `I can help you with anything on this website! Here are some common things you can ask or do:\n\n` +
      `• **"How are my calories and macros calculated?"** — Learn about our Mifflin-St Jeor formula and activity multipliers.\n` +
      `• **"How do I scan or log meals?"** — Discover how to use camera scanning and food search.\n` +
      `• **"How do I check vitamin deficiencies?"** — Screen for Iron, Vitamin D, B12, or Calcium risks.\n` +
      `• **"How do I export my plan to PDF or PowerPoint?"** — Download your complete plan with one click.\n` +
      `• **"What high-protein foods can I eat?"** — Get customized food suggestions from our verified database.\n\n` +
      (result ? `*You currently have an active plan for ${result.tdee} kcal with ${result.proteinG}g protein.*` : `*You can start anytime by clicking "Build My Plan" below!*`),
    actions: [
      ...(result
        ? [
            { label: '📊 View Dashboard', type: 'navigate', target: 'dashboard' },
            { label: '🧬 Deficiency Check', type: 'navigate', target: 'deficiency' },
            { label: '✏️ Edit Profile', type: 'editProfile' }
          ]
        : [
            { label: '🚀 Build My Plan', type: 'startOnboarding' },
            { label: '📖 How It Works', type: 'navigate', target: 'how-it-works' }
          ])
    ],
    suggestedQuestions: [
      'How are my calories calculated?',
      'How do I log or scan food?',
      'How do I check vitamin deficiencies?',
      'How do I download my plan as PDF?'
    ]
  };
}
