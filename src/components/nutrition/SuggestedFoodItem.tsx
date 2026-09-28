import React from 'react';
import { Check, Flame, Sparkles, Plus, AlertTriangle, CheckCircle2, Target } from 'lucide-react';
import type { FoodDetail } from '@/data/foodDetails';

export interface GoalContext {
  goal?: string; // "maintain" | "lose" | "gain"
  tdee?: number; // target calories
  proteinG?: number; // target protein
  carbG?: number; // target carbs
  fatG?: number; // target fat
  fiberG?: number; // target fiber
}

interface SuggestedFoodItemProps {
  food: FoodDetail;
  isTicked: boolean;
  onToggle: () => void;
  onLogFood?: (food: FoodDetail) => void;
  goalContext?: GoalContext;
  compact?: boolean;
}

export function SuggestedFoodItem({
  food,
  isTicked,
  onToggle,
  onLogFood,
  goalContext,
  compact = false,
}: SuggestedFoodItemProps) {
  // Goal matching analysis
  const targetKcal = goalContext?.tdee || 2000;
  const targetProtein = goalContext?.proteinG || 80;
  const targetFiber = goalContext?.fiberG || 30;
  const targetCarbs = goalContext?.carbG || 250;
  const targetFat = goalContext?.fatG || 60;
  const userGoal = goalContext?.goal || 'maintain';

  const kcalPct = Math.round((food.calories / targetKcal) * 100);
  const proteinPct = Math.round((food.protein / targetProtein) * 100);
  const fiberPct = Math.round((food.fiber / targetFiber) * 100);

  // Determine if this food matches or deviates from the specific goal
  let goalFeedback: { status: 'match' | 'mismatch' | 'neutral'; message: string } | null = null;

  if (goalContext) {
    if (userGoal === 'lose') {
      if (food.calories > 320 && food.fiber < 2) {
        goalFeedback = {
          status: 'mismatch',
          message: `Not matching Weight Loss goal well: High calorie density (${food.calories} kcal) with low fiber (${food.fiber}g). Consider a smaller portion or pair with fresh salad.`,
        };
      } else if (food.fiber >= 4 || food.protein >= 12) {
        goalFeedback = {
          status: 'match',
          message: `Matches Weight Loss goal: Rich in fiber (${food.fiber}g) and protein (${food.protein}g) to keep you satiated in your calorie deficit.`,
        };
      }
    } else if (userGoal === 'gain') {
      if (food.protein < 5) {
        goalFeedback = {
          status: 'mismatch',
          message: `Not matching Muscle Gain goal: Only ${food.protein}g protein. Pair with eggs, dal, or paneer to reach your ${targetProtein}g daily target.`,
        };
      } else if (food.protein >= 14) {
        goalFeedback = {
          status: 'match',
          message: `Matches Muscle Gain goal: Strong protein contribution (${food.protein}g, ${proteinPct}% of daily target) for muscle repair.`,
        };
      }
    }

    // Check fiber specific goal if not already flagged
    if (!goalFeedback) {
      if (food.fiber < 1.5 && food.calories > 150) {
        goalFeedback = {
          status: 'mismatch',
          message: `Low fiber (${food.fiber}g): Does not contribute significantly toward your ${targetFiber}g daily fiber goal. Add leafy greens or sprouts.`,
        };
      } else if (food.fiber >= 5) {
        goalFeedback = {
          status: 'match',
          message: `High fiber match: Provides ${food.fiber}g (${fiberPct}%) toward your daily ${targetFiber}g fiber goal.`,
        };
      }
    }
  }

  return (
    <div
      onClick={onToggle}
      className={`rounded-xl border transition-all duration-200 cursor-pointer select-none ${
        compact ? 'p-3' : 'p-3.5'
      } ${
        isTicked
          ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/60 shadow-sm ring-1 ring-emerald-500/20'
          : 'bg-stone-50/70 dark:bg-stone-800/40 border-stone-200/80 dark:border-stone-700/60 hover:bg-stone-100/80 dark:hover:bg-stone-800/70 hover:border-stone-300 dark:hover:border-stone-600'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Tick Box Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
              isTicked
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-500/20 scale-105'
                : 'border-2 border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 hover:border-emerald-500 dark:hover:border-emerald-400'
            }`}
            aria-label={isTicked ? `Untick ${food.name}` : `Tick ${food.name}`}
          >
            {isTicked && <Check className="w-4 h-4 stroke-[2.5]" />}
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-sm ${
                  isTicked
                    ? 'font-bold text-emerald-950 dark:text-emerald-200'
                    : 'font-semibold text-stone-800 dark:text-stone-200'
                }`}
              >
                {food.name}
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                • {food.serving}
              </span>
            </div>
            {!isTicked && (
              <span className="text-[11px] text-stone-400 dark:text-stone-500 block mt-0.5">
                Tick to view kcal, fibers & goal match
              </span>
            )}
          </div>
        </div>

        {/* Calories (Kcal) Badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className={`px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums flex items-center gap-1.5 transition-colors ${
              isTicked
                ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700/60'
                : 'bg-stone-200/60 dark:bg-stone-700/60 text-stone-600 dark:text-stone-300'
            }`}
          >
            <Flame
              className={`w-3.5 h-3.5 ${
                isTicked ? 'text-orange-500 fill-orange-500' : 'text-stone-400'
              }`}
            />
            <span>{Math.round(food.calories)} kcal</span>
          </div>
        </div>
      </div>

      {/* Expanded Nutrition Details & Goal Analysis when Ticked */}
      {isTicked && (
        <div className="mt-3 pt-2.5 border-t border-emerald-200/60 dark:border-emerald-800/40 animate-fade-in space-y-2.5">
          {/* Macronutrients Grid with % of daily target */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-1.5 rounded-lg bg-white/90 dark:bg-stone-900/60 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-medium">Protein</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300 text-sm tabular-nums">
                {food.protein}g
              </span>
              <span className="text-[9px] text-stone-400 block mt-0.5 tabular-nums">
                {proteinPct}% goal
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-white/90 dark:bg-stone-900/60 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-medium">Carbs</span>
              <span className="font-bold text-sky-700 dark:text-sky-300 text-sm tabular-nums">
                {food.carbs}g
              </span>
              <span className="text-[9px] text-stone-400 block mt-0.5 tabular-nums">
                {Math.round((food.carbs / targetCarbs) * 100)}% goal
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-white/90 dark:bg-stone-900/60 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-medium">Fat</span>
              <span className="font-bold text-amber-700 dark:text-amber-300 text-sm tabular-nums">
                {food.fat}g
              </span>
              <span className="text-[9px] text-stone-400 block mt-0.5 tabular-nums">
                {Math.round((food.fat / targetFat) * 100)}% goal
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-white/90 dark:bg-stone-900/60 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-medium">Fiber</span>
              <span className="font-bold text-teal-700 dark:text-teal-300 text-sm tabular-nums">
                {food.fiber}g
              </span>
              <span className="text-[9px] text-stone-400 block mt-0.5 tabular-nums">
                {fiberPct}% goal
              </span>
            </div>
          </div>

          {/* Goal Alignment Feedback Banner */}
          {goalFeedback && (
            <div
              className={`p-2.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2 ${
                goalFeedback.status === 'match'
                  ? 'bg-emerald-100/70 dark:bg-emerald-950/50 border-emerald-300/80 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200'
              }`}
            >
              {goalFeedback.status === 'match' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <span className="font-bold uppercase tracking-wide text-[10px] block mb-0.5">
                  {goalFeedback.status === 'match' ? 'Goal Alignment: Matched' : 'Goal Alignment: Needs Attention'}
                </span>
                <span>{goalFeedback.message}</span>
              </div>
            </div>
          )}

          {/* Key Micronutrient info if available */}
          {food.keyNutrient && (
            <div className="text-[11px] text-emerald-800 dark:text-emerald-200 font-medium flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-100/70 dark:bg-emerald-900/30 border border-emerald-200/50 dark:border-emerald-800/30">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>{food.keyNutrient}</span>
            </div>
          )}

          {/* Food description or action */}
          <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
            {food.description && (
              <p className="text-[11px] text-stone-500 dark:text-stone-400 italic flex-1">
                {food.description}
              </p>
            )}
            {onLogFood && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLogFood(food);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all ml-auto"
              >
                <Plus className="w-3 h-3" /> Log to Today's Meals
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
