import { useState } from 'react';
import {
  Sparkles,
  Utensils,
  Plus,
  Check,
  Beef,
  Leaf,
  Flame,
  ChevronDown,
  ChevronUp,
  Target,
  Trophy,
  ArrowRight,
} from 'lucide-react';
import type { NutritionResult, UserProfile, MealItem } from '@/lib/calculations';
import { foodNutritionData, type FoodData } from '@/data/foods';

interface ProgressFulfillmentFoodSuggesterProps {
  result: NutritionResult;
  profile: UserProfile;
  eaten: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  isGoalAchieved: boolean;
  onAddScannedMeal: (meal: MealItem) => void;
}

export function ProgressFulfillmentFoodSuggester({
  result,
  profile,
  eaten,
  isGoalAchieved,
  onAddScannedMeal,
}: ProgressFulfillmentFoodSuggesterProps) {
  const [filterTab, setFilterTab] = useState<'smart' | 'protein' | 'fiber' | 'snacks'>('smart');
  const [addedItemNames, setAddedItemNames] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Calculate remaining gaps to 100% target
  const calGap = Math.max(0, result.tdee - eaten.calories);
  const proteinGap = Math.max(0, result.proteinG - eaten.protein);
  const carbGap = Math.max(0, result.carbG - eaten.carbs);
  const fatGap = Math.max(0, result.fatG - eaten.fat);
  const fiberGap = Math.max(0, result.fiberG - eaten.fiber);

  // User dietary preference
  const isVeg = profile.diet === 'veg';
  const isVegan = profile.diet === 'vegan';

  // Helper to determine if a food matches user diet
  const matchesDiet = (item: FoodData): boolean => {
    const tags = item.tags || [];
    if (isVegan) {
      return tags.includes('vegan');
    }
    if (isVeg) {
      return !tags.includes('nonveg') && !tags.includes('egg');
    }
    return true; // nonveg user can eat all
  };

  // Convert foodNutritionData into array and filter by user diet
  const dietFilteredFoods = Object.entries(foodNutritionData)
    .map(([key, data]) => ({ key, ...data }))
    .filter(matchesDiet);

  // Filter foods by selected intent
  const getFulfillmentFoods = () => {
    if (filterTab === 'protein') {
      return [...dietFilteredFoods]
        .filter((f) => f.protein >= 8)
        .sort((a, b) => b.protein - a.protein)
        .slice(0, 6);
    }

    if (filterTab === 'fiber') {
      return [...dietFilteredFoods]
        .filter((f) => (f.fiber || 0) >= 3)
        .sort((a, b) => (b.fiber || 0) - (a.fiber || 0))
        .slice(0, 6);
    }

    if (filterTab === 'snacks') {
      return [...dietFilteredFoods]
        .filter((f) => f.calories <= 200)
        .sort((a, b) => a.calories - b.calories)
        .slice(0, 6);
    }

    // Default 'smart' matching: Score foods that best close the remaining calorie, protein, and fiber gap
    return [...dietFilteredFoods]
      .map((f) => {
        let score = 0;
        // Prioritize protein if protein gap is significant
        if (proteinGap > 5 && f.protein > 0) {
          score += (f.protein / Math.max(1, proteinGap)) * 50;
        }
        // Prioritize fiber if fiber gap is significant
        if (fiberGap > 2 && (f.fiber || 0) > 0) {
          score += ((f.fiber || 0) / Math.max(1, fiberGap)) * 30;
        }
        // Fit calories within remaining gap without excessive overshoot
        if (calGap > 50) {
          const calRatio = f.calories / calGap;
          if (calRatio <= 1.1) {
            score += (1 - Math.abs(1 - calRatio)) * 25;
          } else {
            score -= (calRatio - 1) * 20;
          }
        }
        return { ...f, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  };

  const currentSuggestions = getFulfillmentFoods();

  const handleEatFood = (food: FoodData) => {
    const meal: MealItem = {
      id: `fulfilled-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `Fulfillment: ${food.name}`,
      food: food.name,
      components: [(food as any).key || food.name],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      icon: 'Camera',
      details: {
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        fiber: food.fiber || 0,
      },
    };

    onAddScannedMeal(meal);
    setAddedItemNames((prev) => [...prev, food.name]);
    setTimeout(() => {
      setAddedItemNames((prev) => prev.filter((n) => n !== food.name));
    }, 2500);
  };

  return (
    <div className="rounded-2xl border border-[#1E293B] bg-gradient-to-br from-[#0B0F0E] via-[#07111F] to-[#101D2D] p-5 shadow-lg space-y-4 text-stone-100">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#22C55E] to-[#2DD4BF] flex items-center justify-center text-[#07111F] font-bold shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display font-bold text-sm sm:text-base text-[#F8FAFC]">
                Foods to Fulfill Today's Progress
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#22C55E]/15 text-[#34D399] border border-[#22C55E]/30">
                1-Click Log
              </span>
            </div>
            <p className="text-xs text-[#8492A6]">
              {isGoalAchieved
                ? 'Target satisfied! Explore light healthy snacks below if needed.'
                : 'Smart recommendations specifically tailored to close your remaining nutrient gaps.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg text-[#8492A6] hover:text-[#F8FAFC] hover:bg-[#101D2D] transition-colors cursor-pointer"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Real-time Gap Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className={`p-2.5 rounded-xl border ${calGap > 0 ? 'bg-[#0B0F0E] border-[#2DD4BF]/30 text-[#2DD4BF]' : 'bg-[#22C55E]/10 border-[#22C55E]/40 text-[#34D399]'}`}>
              <div className="text-[10px] text-[#8492A6] uppercase font-semibold">Calories Left</div>
              <div className="text-sm font-extrabold font-display">
                {calGap > 0 ? `${calGap} kcal` : '✓ Target Met'}
              </div>
            </div>
            <div className={`p-2.5 rounded-xl border ${proteinGap > 0 ? 'bg-[#0B0F0E] border-[#22C55E]/30 text-[#34D399]' : 'bg-[#22C55E]/10 border-[#22C55E]/40 text-[#34D399]'}`}>
              <div className="text-[10px] text-[#8492A6] uppercase font-semibold">Protein Left</div>
              <div className="text-sm font-extrabold font-display">
                {proteinGap > 0 ? `${proteinGap}g needed` : '✓ Target Met'}
              </div>
            </div>
            <div className={`p-2.5 rounded-xl border ${fiberGap > 0 ? 'bg-[#0B0F0E] border-[#2DD4BF]/30 text-[#2DD4BF]' : 'bg-[#22C55E]/10 border-[#22C55E]/40 text-[#34D399]'}`}>
              <div className="text-[10px] text-[#8492A6] uppercase font-semibold">Fiber Left</div>
              <div className="text-sm font-extrabold font-display">
                {fiberGap > 0 ? `${fiberGap}g needed` : '✓ Target Met'}
              </div>
            </div>
            <div className={`p-2.5 rounded-xl border ${carbGap > 0 ? 'bg-[#0B0F0E] border-[#60A5FA]/30 text-[#60A5FA]' : 'bg-[#22C55E]/10 border-[#22C55E]/40 text-[#34D399]'}`}>
              <div className="text-[10px] text-[#8492A6] uppercase font-semibold">Carbs Left</div>
              <div className="text-sm font-extrabold font-display">
                {carbGap > 0 ? `${carbGap}g needed` : '✓ Target Met'}
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              onClick={() => setFilterTab('smart')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterTab === 'smart'
                  ? 'bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] shadow-sm'
                  : 'bg-[#101D2D] text-[#8492A6] hover:text-[#F8FAFC] border border-[#1E293B]'
              }`}
            >
              🌟 Smart Match (Best Fit)
            </button>
            <button
              onClick={() => setFilterTab('protein')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterTab === 'protein'
                  ? 'bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] shadow-sm'
                  : 'bg-[#101D2D] text-[#8492A6] hover:text-[#F8FAFC] border border-[#1E293B]'
              }`}
            >
              🥩 High Protein Fulfillers
            </button>
            <button
              onClick={() => setFilterTab('fiber')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterTab === 'fiber'
                  ? 'bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] shadow-sm'
                  : 'bg-[#101D2D] text-[#8492A6] hover:text-[#F8FAFC] border border-[#1E293B]'
              }`}
            >
              🌾 High Fiber Closers
            </button>
            <button
              onClick={() => setFilterTab('snacks')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterTab === 'snacks'
                  ? 'bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] shadow-sm'
                  : 'bg-[#101D2D] text-[#8492A6] hover:text-[#F8FAFC] border border-[#1E293B]'
              }`}
            >
              🥗 Light Healthy Snacks
            </button>
          </div>

          {/* Food Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {currentSuggestions.map((item) => {
              const isJustAdded = addedItemNames.includes(item.name);
              // Calculate gap-closing impact
              const proteinImpact =
                proteinGap > 0
                  ? Math.min(100, Math.round((item.protein / proteinGap) * 100))
                  : 0;
              const calImpact =
                calGap > 0
                  ? Math.min(100, Math.round((item.calories / calGap) * 100))
                  : 0;

              return (
                <div
                  key={item.key}
                  className="p-3.5 rounded-2xl bg-[#0B0F0E] border border-[#1E293B] hover:border-[#22C55E]/60 transition-all flex flex-col justify-between gap-3 shadow-md group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="font-display font-bold text-sm text-[#F8FAFC] group-hover:text-[#34D399] transition-colors">
                          {item.name}
                        </h5>
                        <p className="text-[11px] text-[#8492A6]">{item.serving}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg bg-[#2DD4BF]/15 text-[#2DD4BF] border border-[#2DD4BF]/30 text-[11px] font-extrabold whitespace-nowrap">
                        {item.calories} kcal
                      </span>
                    </div>

                    {/* Macro badges */}
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-medium text-stone-300">
                      <span className="px-2 py-0.5 rounded-md bg-[#101D2D] text-[#34D399] border border-[#1E293B]">
                        P: {item.protein}g
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#101D2D] text-[#60A5FA] border border-[#1E293B]">
                        C: {item.carbs}g
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#101D2D] text-amber-300 border border-[#1E293B]">
                        F: {item.fat}g
                      </span>
                      {typeof item.fiber === 'number' && (
                        <span className="px-2 py-0.5 rounded-md bg-[#101D2D] text-[#2DD4BF] border border-[#1E293B]">
                          Fiber: {item.fiber}g
                        </span>
                      )}
                    </div>

                    {/* Fulfillment Impact Callout */}
                    {(proteinImpact > 0 || calImpact > 0) && (
                      <div className="pt-1 text-[11px] font-semibold text-[#34D399] flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 flex-shrink-0 text-[#22C55E]" />
                        <span>
                          {proteinImpact >= 30
                            ? `Closes ${proteinImpact}% of remaining protein!`
                            : `Closes ${calImpact}% of remaining calorie gap`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 1-Click Eat This Button */}
                  <button
                    onClick={() => handleEatFood(item)}
                    className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                      isJustAdded
                        ? 'bg-[#101D2D] text-[#34D399] border border-[#22C55E]/40 animate-pulse'
                        : 'bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] hover:opacity-95'
                    }`}
                  >
                    {isJustAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Added to Today's Progress!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Eat This (+Add to Progress)</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
