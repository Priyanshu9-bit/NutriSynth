import { useState, useMemo } from 'react';
import {
  UtensilsCrossed,
  Sparkles,
  Clock,
  ChevronDown,
  ChevronUp,
  Plus,
  Check,
  Search,
  Filter,
  Flame,
  Beef,
  Wheat,
  Droplet,
  Leaf,
  ChefHat,
  Zap,
  ArrowDownWideNarrow,
  Target,
  Award,
} from 'lucide-react';
import type { NutritionResult, UserProfile, MealItem } from '@/lib/calculations';
import { personalizedRecipes, type RecipeItem } from '@/data/personalizedRecipes';
import { playChecklistSound, playAddProgressSound } from '@/lib/soundEffects';

interface PersonalizedMealHelperProps {
  profile: UserProfile;
  result: NutritionResult;
  eatenCalories: number;
  eatenProtein: number;
  onAddMeal: (meal: MealItem) => void;
}

export type RecipeSortType = 'need' | 'protein' | 'cal_asc' | 'cal_desc' | 'quick' | 'fiber';

export function PersonalizedMealHelper({
  profile,
  result,
  eatenCalories,
  eatenProtein,
  onAddMeal,
}: PersonalizedMealHelperProps) {
  const [selectedMealType, setSelectedMealType] = useState<string>('all');
  const [selectedGoalFilter, setSelectedGoalFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<RecipeSortType>('need');
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  const [loggedRecipeIds, setLoggedRecipeIds] = useState<Record<string, boolean>>({});

  const remainingCalories = Math.max(0, Math.round(result.tdee - eatenCalories));
  const remainingProtein = Math.max(0, Math.round(result.proteinG - eatenProtein));

  // Determine user's diet compatibility
  const userDiet = profile.diet?.toLowerCase() || 'veg';
  const isStrictVegan = userDiet === 'vegan';
  const isVegetarian = userDiet === 'veg' || userDiet === 'vegetarian';

  // Calculate dynamic need score and need justification based on user's current progress gaps
  const getRecipeNeedData = (recipe: RecipeItem) => {
    let score = 50;
    let needPill = '';
    let needHighlight = '';

    // 1. Protein Gap: If user has a protein deficit, recipes rich in protein get priority
    if (remainingProtein > 0) {
      const proteinContribution = Math.min(100, Math.round((recipe.protein / remainingProtein) * 100));
      if (recipe.protein >= 24) {
        score += 30;
        needPill = `Fulfills ${proteinContribution}% of needed protein`;
        needHighlight = `Delivers +${recipe.protein}g protein to help close your remaining ${remainingProtein}g gap.`;
      } else if (recipe.protein >= 16) {
        score += 20;
        needPill = `+${recipe.protein}g Protein (+${proteinContribution}% gap)`;
        needHighlight = `Supplies +${recipe.protein}g quality protein towards your daily goal.`;
      } else {
        score += 8;
      }
    } else {
      // Already met protein, focus on balanced energy
      score += 10;
    }

    // 2. Calorie Gap: Does it fit remaining budget without exceeding?
    if (remainingCalories > 0) {
      if (recipe.calories <= remainingCalories) {
        const calPct = Math.round((recipe.calories / remainingCalories) * 100);
        if (calPct >= 30 && calPct <= 85) {
          score += 25; // ideal single-meal size for remaining calories
          if (!needPill) needPill = `Ideal Calorie Fit (${recipe.calories} kcal)`;
        } else {
          score += 15;
        }
      } else {
        // Exceeds remaining calorie budget
        score -= 20;
      }
    } else {
      // Already at or over calorie target, favor lean lower calories
      if (recipe.calories <= 320) {
        score += 28;
        needPill = `Light & Low Calorie (${recipe.calories} kcal)`;
        needHighlight = `Helps you stay disciplined without exceeding your daily energy budget.`;
      } else {
        score -= 25;
      }
    }

    // 3. User Fitness Goal Alignment
    if (profile.goal === 'muscle_gain' && recipe.protein >= 22) {
      score += 18;
      if (!needPill) needPill = 'High Muscle Synthesis';
    } else if (profile.goal === 'fat_loss') {
      if (recipe.calories <= 350 && recipe.protein >= 18) {
        score += 18;
        if (!needPill) needPill = 'High Satiety & Lean';
      }
    }

    // 4. Fiber bonus for digestive wellness
    if (recipe.fiber >= 6) {
      score += 10;
    }

    return {
      score: Math.min(99, Math.max(10, score)),
      needPill: needPill || `Balanced Daily Fit`,
      needHighlight: needHighlight || recipe.goalBenefit,
    };
  };

  // Filter recipes based on User Profile details, meal type, and search query
  const filteredRecipes = useMemo(() => {
    return personalizedRecipes.filter((recipe) => {
      // 1. Dietary Preference Check from User Details
      if (isStrictVegan && recipe.dietType !== 'vegan') {
        return false;
      }
      if (isVegetarian && recipe.dietType === 'nonveg') {
        return false;
      }

      // 2. Meal Type filter
      if (selectedMealType !== 'all' && recipe.mealType !== selectedMealType) {
        return false;
      }

      // 3. Goal Focus filter
      if (selectedGoalFilter === 'high_protein' && recipe.protein < 22) {
        return false;
      }
      if (selectedGoalFilter === 'quick' && recipe.cookTimeMin > 12) {
        return false;
      }
      if (selectedGoalFilter === 'low_calorie' && recipe.calories > 350) {
        return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = recipe.name.toLowerCase().includes(q);
        const matchesDesc = recipe.description.toLowerCase().includes(q);
        const matchesIng = recipe.ingredients.some((ing) => ing.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesIng) return false;
      }

      return true;
    });
  }, [isStrictVegan, isVegetarian, selectedMealType, selectedGoalFilter, searchQuery]);

  // Sort recipes based on what user needs max or selected sort mode
  const processedRecipes = useMemo(() => {
    const scored = filteredRecipes.map((recipe) => ({
      ...recipe,
      ...getRecipeNeedData(recipe),
    }));

    return scored.sort((a, b) => {
      if (sortBy === 'need') {
        return b.score - a.score;
      }
      if (sortBy === 'protein') {
        return b.protein - a.protein;
      }
      if (sortBy === 'cal_asc') {
        return a.calories - b.calories;
      }
      if (sortBy === 'cal_desc') {
        return b.calories - a.calories;
      }
      if (sortBy === 'quick') {
        return a.cookTimeMin - b.cookTimeMin;
      }
      if (sortBy === 'fiber') {
        return b.fiber - a.fiber;
      }
      return 0;
    });
  }, [filteredRecipes, sortBy, eatenCalories, eatenProtein, result.tdee, result.proteinG, profile.goal]);

  const handleLogRecipe = (recipe: RecipeItem) => {
    playAddProgressSound();
    const mealItem: MealItem = {
      name: recipe.name,
      food: recipe.name,
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
    setLoggedRecipeIds((prev) => ({ ...prev, [recipe.id]: true }));
    setTimeout(() => {
      setLoggedRecipeIds((prev) => ({ ...prev, [recipe.id]: false }));
    }, 3500);
  };

  return (
    <div className="card-lg p-6 sm:p-8 animate-fade-in space-y-6">
      {/* Header & User Details Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-200/60 dark:border-[#32353e]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <ChefHat className="w-4 h-4" />
            </span>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-stone-900 dark:text-[#f4f5f7]">
              Smart Meal Maker & Recipe Helper
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-[#828795]">
            Easy, delicious meal ideas custom-picked for what your body needs right now to hit today's targets.
          </p>
        </div>

        {/* User Details Pill Box */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-[#18191d] border border-stone-200 dark:border-[#32353e] font-semibold text-stone-700 dark:text-[#d1d5db]">
            Diet: <strong className="capitalize text-brand-600 dark:text-brand-400">{profile.diet || 'Standard'}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-[#18191d] border border-stone-200 dark:border-[#32353e] font-semibold text-stone-700 dark:text-[#d1d5db]">
            Goal: <strong className="capitalize text-brand-600 dark:text-brand-400">{profile.goal || 'Health'}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 font-bold text-amber-600 dark:text-amber-400">
            {remainingCalories} kcal left today
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 font-bold text-emerald-600 dark:text-emerald-400">
            {remainingProtein}g protein needed
          </span>
        </div>
      </div>

      {/* 3 Golden Questions Quick Helper for Absolute Beginners */}
      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-stone-700 dark:text-[#d1d5db] grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5">👁️ 1. What am I looking at?</span>
          <span>Personalized recipes that fit your remaining calorie and fuel budget for today.</span>
        </div>
        <div>
          <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5">👉 2. What should I do?</span>
          <span>Pick any meal you want to eat and tap <strong>"+ Log to Today"</strong>.</span>
        </div>
        <div>
          <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5">✨ 3. What happens next?</span>
          <span>It adds the exact calories and nutrients directly into your daily tracker circles above!</span>
        </div>
      </div>

      {/* Filter Toolbar: Meal Type & Goals */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Meal Type Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: 'All Meals' },
              { id: 'breakfast', label: '🌅 Breakfast' },
              { id: 'lunch', label: '🍲 Lunch' },
              { id: 'dinner', label: '🌙 Dinner' },
              { id: 'snack', label: '⚡ Snacks' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  playChecklistSound(true);
                  setSelectedMealType(tab.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedMealType === tab.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-stone-100 dark:bg-[#18191d] text-stone-600 dark:text-[#d1d5db] hover:bg-stone-200 dark:hover:bg-[#282a32]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-auto sm:min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ingredient or dish..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-stone-100 dark:bg-[#18191d] border border-stone-200 dark:border-[#32353e] text-stone-900 dark:text-white focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Goal Quick Filters */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-stone-400 dark:text-[#717684] text-[11px] font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Quick Filter:
          </span>
          {[
            { id: 'all', label: 'All Matches' },
            { id: 'high_protein', label: '💪 High Protein (>22g)' },
            { id: 'quick', label: '⏱️ Quick (<12m)' },
            { id: 'low_calorie', label: '🥗 Low Calorie (<350 kcal)' },
          ].map((gf) => (
            <button
              key={gf.id}
              onClick={() => {
                playChecklistSound(true);
                setSelectedGoalFilter(gf.id);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                selectedGoalFilter === gf.id
                  ? 'bg-brand-100 dark:bg-brand-950/70 text-brand-800 dark:text-brand-300 font-bold border border-brand-300 dark:border-brand-700/60'
                  : 'bg-stone-100 dark:bg-[#18191d] text-stone-500 dark:text-[#828795] hover:text-stone-800 dark:hover:text-[#f4f5f7]'
              }`}
            >
              {gf.label}
            </button>
          ))}
        </div>

        {/* Dynamic Sort Toolbar: Sort by what you need max */}
        <div className="flex items-center gap-2 flex-wrap text-xs pt-1 p-3 rounded-2xl bg-brand-50/50 dark:bg-[#15191c] border border-brand-200/60 dark:border-brand-900/40">
          <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
            <ArrowDownWideNarrow className="w-4 h-4 text-brand-600 dark:text-brand-400" /> Sort by Need:
          </span>
          {[
            { id: 'need', label: '🎯 Most Needed First (Max Gap Match)' },
            { id: 'protein', label: '🥩 Max Protein First' },
            { id: 'cal_asc', label: '⚡ Lowest Calories' },
            { id: 'cal_desc', label: '🍲 Highest Calories' },
            { id: 'quick', label: '⏱️ Quickest (<12m)' },
            { id: 'fiber', label: '🌾 Highest Fiber' },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                playChecklistSound(true);
                setSortBy(opt.id as RecipeSortType);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                sortBy === opt.id
                  ? 'bg-brand-600 text-white shadow-md scale-[1.02]'
                  : 'bg-white dark:bg-[#202227] text-stone-600 dark:text-[#a0a5b2] hover:bg-stone-100 dark:hover:bg-[#282a32] border border-stone-200 dark:border-stone-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recipe Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {processedRecipes.map((recipe, index) => {
          const isExpanded = expandedRecipeId === recipe.id;
          const isLogged = loggedRecipeIds[recipe.id];

          return (
            <div
              key={recipe.id}
              className="p-5 rounded-2xl border border-stone-200 dark:border-[#32353e] bg-stone-50/50 dark:bg-[#18191d] hover:border-brand-400 dark:hover:border-brand-500/60 transition-all flex flex-col justify-between gap-4 shadow-sm"
            >
              <div>
                {/* Need Match & Rank Badges */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-500/15 text-brand-700 dark:text-brand-300 border border-brand-500/30 flex items-center gap-1">
                    <Award className="w-3 h-3 text-brand-500" />
                    #{index + 1} {sortBy === 'need' ? 'Top Need Match' : 'Rank'} ({recipe.score}% Fit)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Target className="w-3 h-3 text-emerald-500" />
                    {recipe.needPill}
                  </span>
                </div>

                {/* Top Card Info */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-2 rounded-xl bg-white dark:bg-[#202227] shadow-sm">
                      {recipe.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-stone-500 dark:text-[#828795]">
                        <span className="capitalize font-semibold text-brand-600 dark:text-brand-400">
                          {recipe.mealType}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {recipe.cookTimeMin}m
                        </span>
                        <span>•</span>
                        <span>{recipe.difficulty}</span>
                      </div>
                      <h3 className="font-display font-bold text-base text-stone-900 dark:text-[#f4f5f7] leading-snug">
                        {recipe.name}
                      </h3>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-stone-600 dark:text-[#a0a5b2] leading-relaxed mb-3">
                  {recipe.description}
                </p>

                {/* Macro Badges */}
                <div className="grid grid-cols-5 gap-1.5 text-center mb-3">
                  <div className="p-1.5 rounded-lg bg-white dark:bg-[#202227] border border-stone-200/60 dark:border-[#282a32]">
                    <div className="text-[10px] text-stone-400 dark:text-[#717684]">Energy</div>
                    <div className="text-xs font-bold text-stone-900 dark:text-white tabular-nums">
                      {recipe.calories} kcal
                    </div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Protein</div>
                    <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                      {recipe.protein}g
                    </div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20">
                    <div className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">Carbs</div>
                    <div className="text-xs font-bold text-sky-700 dark:text-sky-300 tabular-nums">
                      {recipe.carbs}g
                    </div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Fats</div>
                    <div className="text-xs font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                      {recipe.fat}g
                    </div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20">
                    <div className="text-[10px] text-brand-600 dark:text-brand-400 font-medium">Fiber</div>
                    <div className="text-xs font-bold text-brand-700 dark:text-brand-300 tabular-nums">
                      {recipe.fiber}g
                    </div>
                  </div>
                </div>

                {/* Personalized Goal Benefit & Need Alignment Box */}
                <div className="p-3 rounded-xl bg-brand-50/70 dark:bg-[#1a2320] border border-brand-200/50 dark:border-brand-800/40 text-[11px] text-brand-950 dark:text-emerald-200 flex items-start gap-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-brand-700 dark:text-emerald-300">Why it matches your need: </strong>
                    <span>{recipe.needHighlight}</span>
                  </div>
                </div>

                {/* Expandable Recipe Details (Ingredients & Steps) */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-stone-200/60 dark:border-[#282a32] space-y-3 text-xs animate-fade-in">
                    <div>
                      <div className="font-bold text-stone-800 dark:text-[#f4f5f7] mb-1.5">
                        Ingredients ({recipe.servings}):
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-stone-600 dark:text-[#a0a5b2]">
                        {recipe.ingredients.map((ing, i) => (
                          <li key={i}>{ing}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="font-bold text-stone-800 dark:text-[#f4f5f7] mb-1.5">
                        Easy Steps to Make:
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-stone-600 dark:text-[#a0a5b2]">
                        {recipe.steps.map((st, i) => (
                          <li key={i} className="leading-relaxed">
                            {st}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200/50 dark:border-[#282a32]">
                <button
                  type="button"
                  onClick={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}
                  className="text-xs font-semibold text-stone-600 dark:text-[#a0a5b2] hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1 transition-colors"
                >
                  <span>{isExpanded ? 'Hide Steps' : 'View How to Make'}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {/* One-Click Log Meal Button */}
                <button
                  type="button"
                  onClick={() => handleLogRecipe(recipe)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                    isLogged
                      ? 'bg-emerald-600 text-white animate-pulse'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-600'
                  }`}
                  title="Adds this recipe to your daily intake tracker"
                >
                  {isLogged ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Logged to Today!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Log Meal (+{recipe.calories} kcal)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {processedRecipes.length === 0 && (
        <div className="p-8 text-center rounded-2xl bg-stone-50 dark:bg-[#18191d] border border-stone-200 dark:border-[#32353e]">
          <UtensilsCrossed className="w-8 h-8 mx-auto text-stone-400 mb-2" />
          <h4 className="font-semibold text-sm text-stone-700 dark:text-stone-300">
            No recipes matched your search filter
          </h4>
          <p className="text-xs text-stone-400 mt-1">
            Try switching to 'All Meals' or clear your keyword search.
          </p>
        </div>
      )}
    </div>
  );
}
