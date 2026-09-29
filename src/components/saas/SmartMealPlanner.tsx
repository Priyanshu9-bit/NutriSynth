import React, { useState, useMemo } from 'react';
import {
  UtensilsCrossed,
  Clock,
  DollarSign,
  Filter,
  Sparkles,
  RefreshCw,
  Plus,
  Check,
  ShoppingCart,
  ChefHat,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileDown,
  Copy,
  Zap,
  Leaf,
  Beef,
  Flame,
  Wheat,
  SlidersHorizontal,
  HelpCircle,
} from 'lucide-react';
import type { NutritionResult, UserProfile, MealItem } from '@/lib/calculations';
import { personalizedRecipes, type RecipeItem } from '@/data/personalizedRecipes';
import { playChecklistSound, playAddProgressSound } from '@/lib/soundEffects';
import { saveGroceryItems, loadGroceryItemsLocal, type GroceryItem } from '@/lib/cloudStore';
import { SectionErrorBoundary } from '@/components/ErrorBoundary';
import { BeginnerGuideBanner } from '@/components/beginner/BeginnerGuideBanner';
import { NutritionGlossaryModal } from '@/components/beginner/NutritionGlossaryModal';

interface SmartMealPlannerProps {
  result: NutritionResult;
  profile: UserProfile;
  onAddMeal: (meal: MealItem) => void;
  onNavigateToGrocery?: () => void;
}

export function SmartMealPlanner({
  result,
  profile,
  onAddMeal,
  onNavigateToGrocery,
}: SmartMealPlannerProps) {
  // Glossary modal state
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

  // Filter States
  const [dietFilter, setDietFilter] = useState<string>(profile.diet || 'all');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [budgetFilter, setBudgetFilter] = useState<'all' | 'economy' | 'moderate' | 'premium'>('all');
  const [cookingTimeFilter, setCookingTimeFilter] = useState<number>(45); // max minutes
  const [activeSlot, setActiveSlot] = useState<string>('all');
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  // Interaction feedback states
  const [addedGroceryIds, setAddedGroceryIds] = useState<Record<string, boolean>>({});
  const [loggedRecipeIds, setLoggedRecipeIds] = useState<Record<string, boolean>>({});
  const [copiedPlanToast, setCopiedPlanToast] = useState(false);
  const [daySeed, setDaySeed] = useState(0);

  const allergiesList = ['Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Soy-Free', 'Egg-Free', 'Shellfish-Free'];

  // Toggle allergy filter
  const toggleAllergy = (allergy: string) => {
    playChecklistSound(true);
    setSelectedAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy]
    );
  };

  // Filtered recipes
  const filteredRecipes = useMemo(() => {
    return (personalizedRecipes || []).filter((r) => {
      // Slot filter
      if (activeSlot !== 'all' && r.mealType.toLowerCase() !== activeSlot.toLowerCase()) {
        return false;
      }
      // Diet filter
      if (dietFilter !== 'all') {
        const d = dietFilter.toLowerCase();
        if (d === 'vegan' && r.dietType !== 'vegan') return false;
        if ((d === 'veg' || d === 'vegetarian') && r.dietType !== 'veg' && r.dietType !== 'vegan') return false;
        if (d === 'high_protein' && r.protein < 22) return false;
        if (d === 'low_carb' && r.carbs > 25) return false;
      }
      // Cooking Time filter
      if (r.cookTimeMin > cookingTimeFilter) return false;

      // Budget filter
      if (budgetFilter !== 'all') {
        const isEconomy = r.calories < 320 || r.ingredients.some((i) => i.toLowerCase().includes('oat') || i.toLowerCase().includes('rice') || i.toLowerCase().includes('lentil') || i.toLowerCase().includes('bean'));
        const isPremium = r.ingredients.some((i) => i.toLowerCase().includes('salmon') || i.toLowerCase().includes('whey') || i.toLowerCase().includes('avocado') || i.toLowerCase().includes('paneer'));
        if (budgetFilter === 'economy' && !isEconomy) return false;
        if (budgetFilter === 'premium' && !isPremium) return false;
      }

      // Allergy filter
      if (selectedAllergies.length > 0) {
        const ingStr = r.ingredients.join(' ').toLowerCase();
        if (selectedAllergies.includes('Gluten-Free') && (ingStr.includes('wheat') || ingStr.includes('roti') || ingStr.includes('bread') || ingStr.includes('flour'))) return false;
        if (selectedAllergies.includes('Dairy-Free') && (ingStr.includes('paneer') || ingStr.includes('milk') || ingStr.includes('yogurt') || ingStr.includes('curd') || ingStr.includes('ghee') || ingStr.includes('whey') || ingStr.includes('cheese'))) return false;
        if (selectedAllergies.includes('Nut-Free') && (ingStr.includes('almond') || ingStr.includes('peanut') || ingStr.includes('walnut') || ingStr.includes('cashew') || ingStr.includes('nut'))) return false;
        if (selectedAllergies.includes('Soy-Free') && (ingStr.includes('soy') || ingStr.includes('tofu') || ingStr.includes('edamame'))) return false;
        if (selectedAllergies.includes('Egg-Free') && ingStr.includes('egg')) return false;
      }

      return true;
    });
  }, [dietFilter, activeSlot, cookingTimeFilter, budgetFilter, selectedAllergies]);

  // Generate Daily 4-Meal Plan
  const dailyPlan = useMemo(() => {
    const breakfasts = personalizedRecipes.filter((r) => r.mealType === 'breakfast');
    const lunches = personalizedRecipes.filter((r) => r.mealType === 'lunch');
    const dinners = personalizedRecipes.filter((r) => r.mealType === 'dinner');
    const snacks = personalizedRecipes.filter((r) => r.mealType === 'snack');

    const b = breakfasts[(daySeed + 0) % (breakfasts.length || 1)] || breakfasts[0];
    const l = lunches[(daySeed + 1) % (lunches.length || 1)] || lunches[0];
    const d = dinners[(daySeed + 2) % (dinners.length || 1)] || dinners[0];
    const s = snacks[(daySeed + 3) % (snacks.length || 1)] || snacks[0];

    const totalCals = (b?.calories || 0) + (l?.calories || 0) + (d?.calories || 0) + (s?.calories || 0);
    const totalProt = (b?.protein || 0) + (l?.protein || 0) + (d?.protein || 0) + (s?.protein || 0);
    const totalCarb = (b?.carbs || 0) + (l?.carbs || 0) + (d?.carbs || 0) + (s?.carbs || 0);
    const totalFat = (b?.fat || 0) + (l?.fat || 0) + (d?.fat || 0) + (s?.fat || 0);

    return {
      meals: [
        { slot: 'Breakfast', recipe: b, time: '8:00 AM' },
        { slot: 'Lunch', recipe: l, time: '1:00 PM' },
        { slot: 'Dinner', recipe: d, time: '7:30 PM' },
        { slot: 'Snack', recipe: s, time: '4:30 PM' },
      ],
      totals: { calories: totalCals, protein: totalProt, carbs: totalCarb, fat: totalFat },
    };
  }, [daySeed]);

  // Log single recipe
  const handleLogRecipe = (recipe: RecipeItem) => {
    if (loggedRecipeIds[recipe.id]) return;
    setLoggedRecipeIds((prev) => ({ ...prev, [recipe.id]: true }));
    playAddProgressSound();

    const mealItem: MealItem = {
      name: recipe.name,
      food: recipe.name,
      time: recipe.mealType.toUpperCase(),
      details: {
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
        fiber: recipe.fiber,
      },
      components: recipe.ingredients,
      icon: 'Camera',
    };

    onAddMeal(mealItem);
    setTimeout(() => {
      setLoggedRecipeIds((prev) => {
        const next = { ...prev };
        delete next[recipe.id];
        return next;
      });
    }, 4000);
  };

  // Add Recipe ingredients to grocery list
  const handleAddRecipeToGrocery = async (recipe: RecipeItem) => {
    playChecklistSound(true);
    setAddedGroceryIds((prev) => ({ ...prev, [recipe.id]: true }));

    const currentItems = loadGroceryItemsLocal();
    const newItems: GroceryItem[] = recipe.ingredients.map((ing, idx) => ({
      id: `gro_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 5)}`,
      name: ing,
      category: ing.toLowerCase().includes('spinach') || ing.toLowerCase().includes('berry') || ing.toLowerCase().includes('lemon') ? 'produce'
        : ing.toLowerCase().includes('chicken') || ing.toLowerCase().includes('egg') || ing.toLowerCase().includes('tofu') || ing.toLowerCase().includes('whey') ? 'protein'
        : ing.toLowerCase().includes('yogurt') || ing.toLowerCase().includes('milk') || ing.toLowerCase().includes('cheese') ? 'dairy'
        : ing.toLowerCase().includes('oat') || ing.toLowerCase().includes('rice') || ing.toLowerCase().includes('bread') ? 'grains'
        : 'pantry',
      amount: '1 portion',
      checked: false,
      addedAt: Date.now() + idx,
    }));

    await saveGroceryItems([...newItems, ...currentItems]);
  };

  // Add entire day to grocery list
  const handleAddAllToGrocery = async () => {
    playChecklistSound(true);
    const currentItems = loadGroceryItemsLocal();
    const allIngredients = dailyPlan.meals.flatMap((m) => m.recipe?.ingredients || []);
    const unique = Array.from(new Set(allIngredients));

    const newItems: GroceryItem[] = unique.map((name, idx) => ({
      id: `plan_gro_${Date.now()}_${idx}`,
      name,
      category: 'produce',
      amount: '1 day supply',
      checked: false,
      addedAt: Date.now() + idx,
    }));

    await saveGroceryItems([...newItems, ...currentItems]);
    alert(`🛒 Added ${unique.length} ingredients from today's plan to your Grocery List!`);
  };

  // Copy plan text to clipboard
  const handleCopyPlan = () => {
    const text = `📋 NutriSynth Daily Nutrition Plan (${dailyPlan.totals.calories} kcal | ${dailyPlan.totals.protein}g Protein):\n` +
      dailyPlan.meals.map((m) => `• ${m.slot} (${m.time}): ${m.recipe?.name} - ${m.recipe?.calories} kcal, ${m.recipe?.protein}g P`).join('\n') +
      `\n\nDaily Target: ${result.tdee} kcal, ${result.proteinG}g Protein`;
    navigator.clipboard.writeText(text);
    setCopiedPlanToast(true);
    setTimeout(() => setCopiedPlanToast(false), 3000);
  };

  return (
    <SectionErrorBoundary fallbackTitle="Smart Meal Planner">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-12">
        {/* Beginner Guide Banner answering the 3 core questions */}
        <BeginnerGuideBanner
          screenTitle="Healthy Meal Ideas & Daily Menu"
          whatAmILookingAt="Real, tasty meals matched specifically to your daily energy target. No complicated chef skills or rare ingredients needed."
          whatShouldIDo="Browse recipes below. When you find one you like, tap '+ Log to Today' to record it, or '🛒 Add Ingredients' to put what you need onto your shopping list."
          whatHappensWhenIPress="Tapping 'Log to Today' instantly counts this meal toward your daily calorie and protein target. Tapping 'Add Ingredients' copies everything you need directly to your Shopping List."
          primaryAction={{
            label: '🎲 Shuffle Meal Ideas',
            onClick: () => {
              playChecklistSound(true);
              setDaySeed((s) => s + 1);
            },
            caption: 'Shows fresh recipe alternatives for breakfast, lunch, and dinner',
          }}
          onOpenGlossary={() => setIsGlossaryOpen(true)}
        />

        {/* Toast */}
        {copiedPlanToast && (
          <div className="fixed top-24 right-6 z-50 animate-bounce-subtle">
            <div className="px-4 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs sm:text-sm font-bold shadow-xl border border-emerald-400 flex items-center gap-2">
              <span>📋</span>
              <span>Meal plan copied to clipboard!</span>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#18191c] via-[#15171b] to-[#202227] border border-stone-800 text-white shadow-xl">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simple, Healthy Recipes</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white">
              Personalized Meal Ideas
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 max-w-xl">
              Easy, home-cooked dishes calibrated to your <span className="text-emerald-400 font-bold">{result.tdee} calorie</span> daily target and dietary preferences.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                playChecklistSound(true);
                setDaySeed((s) => s + 1);
              }}
              className="px-4 py-2.5 rounded-2xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              title="Click to generate 4 new recipe options for today"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <span>🎲 Shuffle Meals</span>
            </button>
            <button
              type="button"
              onClick={handleAddAllToGrocery}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
              title="Adds all 4 meals' ingredients to your Shopping List"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>🛒 Add All to Shopping List</span>
            </button>
          </div>
        </div>

        {/* Generated Daily Full-Course Formula */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#16171c] border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-lg sm:text-xl text-stone-900 dark:text-white">
                  Today's Easy Full-Day Meal Plan
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Target Calibrated
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                4 balanced meals that together hit around {result.tdee} calories with {result.proteinG}g muscle fuel (protein).
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="px-2.5 py-1 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 font-extrabold border border-orange-500/20">
                ⚡ {dailyPlan.totals.calories} / {result.tdee} kcal
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold border border-emerald-500/20">
                🥩 {dailyPlan.totals.protein} / {result.proteinG}g Protein
              </span>
              <button
                type="button"
                onClick={handleCopyPlan}
                className="px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="Copy plan text to paste into messages or notes"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Text</span>
              </button>
            </div>
          </div>

          {/* Daily 4-Meal Slot Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dailyPlan.meals.map(({ slot, recipe, time }) => {
              if (!recipe) return null;
              return (
                <div
                  key={slot}
                  className="p-4 rounded-2xl bg-stone-50 dark:bg-[#1a1c22] border border-stone-200/80 dark:border-stone-800/80 flex flex-col justify-between hover:border-emerald-500/40 transition-all group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                        {slot} • {time}
                      </span>
                      <span className="text-xs font-black text-orange-600 dark:text-orange-400">
                        {recipe.calories} kcal
                      </span>
                    </div>

                    <h4 className="font-display font-bold text-sm text-stone-900 dark:text-white line-clamp-1 group-hover:text-emerald-500 transition-colors">
                      {recipe.name}
                    </h4>

                    <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>{recipe.cookTimeMin}m</span>
                      </span>
                      <span>•</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {recipe.protein}g protein
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-3 mt-3 border-t border-stone-200/70 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={() => handleLogRecipe(recipe)}
                      disabled={loggedRecipeIds[recipe.id]}
                      className="w-full py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                      title="Adds this meal to today's food total"
                    >
                      {loggedRecipeIds[recipe.id] ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>{loggedRecipeIds[recipe.id] ? '✓ Logged to Today' : `+ Log Meal (+${recipe.calories} kcal)`}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddRecipeToGrocery(recipe)}
                      className={`w-full py-1.5 px-2.5 rounded-xl text-[11px] font-semibold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                        addedGroceryIds[recipe.id]
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-stone-200/80 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border-stone-300/60 dark:border-stone-700'
                      }`}
                      title="Copies all ingredients to your Shopping List"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      <span>{addedGroceryIds[recipe.id] ? '✓ Ingredients Added' : '🛒 Add Ingredients to Shopping'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter Controls Suite */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#16171c] border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-stone-200/80 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
              <h3 className="font-display font-bold text-base text-stone-900 dark:text-white">
                Recipe Catalog Filters
              </h3>
            </div>
            <span className="text-xs font-bold text-stone-500">
              Showing {filteredRecipes.length} matching recipes
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Diet Filter */}
            <div className="space-y-1.5">
              <label className="font-extrabold uppercase text-[10px] text-stone-500 dark:text-stone-400">
                Dietary Philosophy
              </label>
              <select
                value={dietFilter}
                onChange={(e) => setDietFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#1a1c22] border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              >
                <option value="all">All Diets (Flexible)</option>
                <option value="veg">Vegetarian</option>
                <option value="vegan">100% Plant-Based (Vegan)</option>
                <option value="high_protein">High Protein (22g+)</option>
                <option value="low_carb">Low Carbohydrate</option>
              </select>
            </div>

            {/* Meal Slot */}
            <div className="space-y-1.5">
              <label className="font-extrabold uppercase text-[10px] text-stone-500 dark:text-stone-400">
                Meal Course Slot
              </label>
              <select
                value={activeSlot}
                onChange={(e) => setActiveSlot(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#1a1c22] border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              >
                <option value="all">All Meal Times</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Post-Workout & Snacks</option>
              </select>
            </div>

            {/* Budget */}
            <div className="space-y-1.5">
              <label className="font-extrabold uppercase text-[10px] text-stone-500 dark:text-stone-400">
                Ingredient Budget
              </label>
              <select
                value={budgetFilter}
                onChange={(e) => setBudgetFilter(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#1a1c22] border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              >
                <option value="all">Any Budget Tier</option>
                <option value="economy">Economy ($ Budget-Friendly)</option>
                <option value="moderate">Moderate ($$ Balanced)</option>
                <option value="premium">Gourmet ($$$ Premium Wholefoods)</option>
              </select>
            </div>

            {/* Cooking Time Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-extrabold uppercase text-[10px] text-stone-500 dark:text-stone-400">
                <span>Max Prep Time</span>
                <span className="text-emerald-500 font-bold">{cookingTimeFilter} mins</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={cookingTimeFilter}
                onChange={(e) => setCookingTimeFilter(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Allergy Chips */}
          <div className="space-y-2 pt-2">
            <span className="font-extrabold uppercase text-[10px] text-stone-500 dark:text-stone-400">
              Allergy Exclusions:
            </span>
            <div className="flex flex-wrap gap-2">
              {allergiesList.map((allergy) => {
                const active = selectedAllergies.includes(allergy);
                return (
                  <button
                    key={allergy}
                    type="button"
                    onClick={() => toggleAllergy(allergy)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      active
                        ? 'bg-rose-500/20 text-rose-500 border-rose-500/40 shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-stone-400'
                    }`}
                  >
                    {active ? '✓ ' : '+ '} {allergy}
                  </button>
                );
              })}
              {selectedAllergies.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedAllergies([])}
                  className="text-xs text-stone-400 hover:text-stone-200 underline ml-1"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filtered Recipe Results Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-stone-900 dark:text-white">
              Curated Recipe Cards
            </h3>
            {onNavigateToGrocery && (
              <button
                type="button"
                onClick={onNavigateToGrocery}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View My Grocery List</span>
                <ShoppingCart className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {filteredRecipes.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#16171c] border border-stone-200 dark:border-stone-800 space-y-3">
              <ChefHat className="w-12 h-12 mx-auto text-stone-400" />
              <h4 className="font-display font-bold text-base text-stone-900 dark:text-white">
                No recipes match your exact filter combination
              </h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Try easing the prep time slider or clearing allergy filters to discover more dishes.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDietFilter('all');
                  setSelectedAllergies([]);
                  setCookingTimeFilter(45);
                  setBudgetFilter('all');
                  setActiveSlot('all');
                }}
                className="px-4 py-2 rounded-xl bg-stone-800 text-white text-xs font-bold transition-all"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRecipes.map((recipe) => {
                const isExpanded = expandedRecipeId === recipe.id;
                const isLogged = loggedRecipeIds[recipe.id];
                const isAddedGrocery = addedGroceryIds[recipe.id];

                return (
                  <div
                    key={recipe.id}
                    className="p-5 rounded-2xl bg-white dark:bg-[#16171c] border border-stone-200/80 dark:border-stone-800/80 shadow-sm flex flex-col justify-between hover:border-emerald-500/40 transition-all space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                          {recipe.mealType}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-extrabold text-orange-600 dark:text-orange-400">
                          <Flame className="w-3.5 h-3.5 fill-orange-500" />
                          <span>{recipe.calories} kcal</span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h4 className="font-display font-bold text-base text-stone-900 dark:text-white">
                          {recipe.name}
                        </h4>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                          {recipe.description}
                        </p>
                      </div>

                      {/* Macro Chips with Plain Words */}
                      <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-bold">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <span className="font-extrabold">{recipe.protein}g</span>
                          <span className="block text-[8px] opacity-75">Protein</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          <span className="font-extrabold">{recipe.carbs}g</span>
                          <span className="block text-[8px] opacity-75">Carbs</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <span className="font-extrabold">{recipe.fat}g</span>
                          <span className="block text-[8px] opacity-75">Fats</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                          <span className="font-extrabold">{recipe.fiber || 3}g</span>
                          <span className="block text-[8px] opacity-75">Fiber</span>
                        </div>
                      </div>

                      {/* Prep time & Budget info */}
                      <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 pt-1 border-t border-stone-100 dark:border-stone-800">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          <span>{recipe.cookTimeMin} mins</span>
                        </span>
                        <span className="capitalize font-bold text-stone-600 dark:text-stone-300">
                          Focus: {recipe.goalFocus || 'balanced'}
                        </span>
                      </div>

                      {/* Expanded Ingredients & Steps */}
                      {isExpanded && (
                        <div className="space-y-3 pt-3 border-t border-stone-200 dark:border-stone-800 text-xs animate-fade-in">
                          <div>
                            <span className="font-bold text-stone-900 dark:text-white block mb-1">
                              Ingredients:
                            </span>
                            <ul className="list-disc list-inside space-y-0.5 text-stone-600 dark:text-stone-300 text-[11px]">
                              {recipe.ingredients.map((ing, i) => (
                                <li key={i}>{ing}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <span className="font-bold text-stone-900 dark:text-white block mb-1">
                              Directions:
                            </span>
                            <ol className="list-decimal list-inside space-y-1 text-stone-600 dark:text-stone-300 text-[11px]">
                              {recipe.steps.map((step: string, i: number) => (
                                <li key={i}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Bar with clear outcome labels */}
                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleLogRecipe(recipe)}
                        disabled={isLogged}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                        title="Records this meal into your food journal for today"
                      >
                        {isLogged ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>{isLogged ? '✓ Logged to Today' : `+ Log (${recipe.calories} kcal)`}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddRecipeToGrocery(recipe)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                          isAddedGrocery
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-200'
                        }`}
                        title="Add recipe ingredients to your Grocery Shopping List"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span className="text-[11px]">{isAddedGrocery ? 'Added' : 'Shop'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}
                        className="py-2 px-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold transition-all border border-stone-200 dark:border-stone-700 hover:bg-stone-200 cursor-pointer flex items-center gap-1"
                        title={isExpanded ? 'Hide directions' : 'Show directions and ingredients'}
                      >
                        <span className="text-[11px]">{isExpanded ? 'Hide' : 'Recipe'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Beginner Plain-English Nutrition Glossary Modal */}
      <NutritionGlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />
    </SectionErrorBoundary>
  );
}
