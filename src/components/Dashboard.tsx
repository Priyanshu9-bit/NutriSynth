import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Flame, Beef, Wheat, Droplet, Leaf, Sun, Moon, Soup, Sunrise,
  Lightbulb, Beaker, ArrowRight, ArrowLeft, RotateCw, Pencil, Scale,
  BookOpen, ChevronRight, AlertTriangle, CheckCircle2, Info, TrendingUp, TrendingDown, Dna, Camera,
  Sparkles, Check, Trophy, PartyPopper, ArrowDownWideNarrow, Layers, Activity
} from 'lucide-react';
import type { NutritionResult, UserProfile, MealItem } from '@/lib/calculations';
import { analyzeFood, analyzeDailyDiet, getMealReasoning, type FoodAnalysis } from '@/lib/calculations';
import { ProgressBar, DonutChart, ExpandableSection, Badge, StatCard, MacroComparisonChart, RadarChart, NutrientRDIChart, MacroMiniBar } from '@/components/ui';
import { DownloadMenu } from '@/components/DownloadMenu';
import { NutritionHub } from '@/components/nutrition/NutritionHub';
import { loadTodaysMeals, loadTodaysTickedFoods, saveTodaysTickedFoods } from '@/lib/cloudStore';
import { evidenceSources } from '@/data/foods';
import { substitutions } from '@/data/foods';
import { nutrientInfo, getDeficiencyStatus } from '@/data/nutrients';
import { getDetailedFoodInfo, type FoodDetail } from '@/data/foodDetails';
import { SuggestedFoodItem } from '@/components/nutrition/SuggestedFoodItem';
import { Confetti } from '@/components/Confetti';
import { PerformanceAnalytics } from '@/components/analytics/PerformanceAnalytics';
import { PersonalizedMealHelper } from '@/components/analytics/PersonalizedMealHelper';
import { CalorieSpeedometerCluster } from '@/components/analytics/CalorieSpeedometerCluster';
import { ProgressFulfillmentFoodSuggester } from '@/components/nutrition/ProgressFulfillmentFoodSuggester';
import { WellnessHub } from '@/components/wellness/WellnessHub';
import { type StreakData, type ChallengeData, getLocalDateKey, updateDailyFoodWaterLog } from '@/lib/streakService';
import { BeginnerGuideBanner } from '@/components/beginner/BeginnerGuideBanner';
import { NutritionGlossaryModal } from '@/components/beginner/NutritionGlossaryModal';
import { playChecklistSound, playAddProgressSound, playCongratsSound, playWaterDropSound } from '@/lib/soundEffects';

interface DashboardProps {
  result: NutritionResult;
  profile: UserProfile;
  onRegenerate: () => void;
  onEditProfile: () => void;
  onGoToDeficiency: () => void;
  onAddScannedMeal: (meal: MealItem) => void;
  onGoToChallenge?: () => void;
  onGoToTodayStreak?: () => void;
  streakCount?: number;
  completedDaysCount?: number;
  activeChallengeDay?: number;
  streak?: StreakData;
  challenge?: ChallengeData;
  onUpdateStreak?: (newStreak: StreakData) => void;
}

const mealIcons: Record<string, typeof Sun> = {
  Breakfast: Sunrise, Lunch: Soup, Dinner: Moon,
};

export function Dashboard({
  result,
  profile,
  onRegenerate,
  onEditProfile,
  onGoToDeficiency,
  onAddScannedMeal,
  onGoToChallenge,
  onGoToTodayStreak,
  streakCount,
  completedDaysCount,
  activeChallengeDay,
  streak,
  challenge,
  onUpdateStreak,
}: DashboardProps) {
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [waterToast, setWaterToast] = useState<string | null>(null);
  // State for ticked suggested foods: key is `${mealIndex}-${foodName}`
  const [tickedFoods, setTickedFoods] = useState<Record<string, FoodDetail>>(() => loadTodaysTickedFoods<FoodDetail>());
  const [confettiActive, setConfettiActive] = useState(false);
  const prevAchievedRef = useRef(false);
  const restoredRef = useRef(false);
  const donutRef = useRef<HTMLDivElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const radarRef = useRef<HTMLDivElement>(null);
  const rdiRef = useRef<HTMLDivElement>(null);
  const [macroViewMode, setMacroViewMode] = useState<'radar' | 'bars'>('radar');
  const [microViewMode, setMicroViewMode] = useState<'donut' | 'requirements'>('donut');
  const [activeTab, setActiveTab] = useState<'fuel' | 'meals' | 'analytics'>('fuel');
  const [mealsSortOrder, setMealsSortOrder] = useState<'need' | 'protein' | 'calories_asc' | 'schedule'>('need');
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [glossaryTopic, setGlossaryTopic] = useState<string | undefined>(undefined);

  const openGlossary = (topic?: string) => {
    setGlossaryTopic(topic);
    setGlossaryOpen(true);
  };

  // Restore meals logged earlier today from Firestore (no-op without Firebase).
  // Skips any meal already present so remounts can't create duplicates.
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const sig = (m: MealItem) => `${m?.name || ''}|${m?.food || ''}|${m?.details?.calories ?? 0}`;
    const existing = new Set(result.meals.map(sig));
    loadTodaysMeals().then((meals) => {
      meals.forEach((m) => {
        if (!existing.has(sig(m))) {
          existing.add(sig(m));
          onAddScannedMeal(m);
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleFoodTick = (uniqueId: string, food: FoodDetail) => {
    setTickedFoods((prev) => {
      const isCurrentlyTicked = !!prev[uniqueId];
      playChecklistSound(!isCurrentlyTicked);
      const copy = { ...prev };
      if (copy[uniqueId]) {
        delete copy[uniqueId];
      } else {
        copy[uniqueId] = food;
      }
      saveTodaysTickedFoods(copy);
      return copy;
    });
  };

  const handleBatchToggleFoodTicks = (items: { uniqueId: string; food: FoodDetail }[], shouldTick: boolean) => {
    playChecklistSound(shouldTick);
    setTickedFoods((prev) => {
      const copy = { ...prev };
      for (const item of items) {
        if (shouldTick) {
          copy[item.uniqueId] = item.food;
        } else {
          delete copy[item.uniqueId];
        }
      }
      saveTodaysTickedFoods(copy);
      return copy;
    });
  };

  // "Today's Progress" counts meals the person logged via Log Food (icon "Camera")
  // PLUS any suggested foods they have ticked as consumed.
  const loggedMeals = result.meals.filter((m) => m.icon === 'Camera');
  const tickedTotals = Object.values(tickedFoods).reduce(
    (acc, f) => ({
      calories: acc.calories + f.calories,
      protein: acc.protein + f.protein,
      carbs: acc.carbs + f.carbs,
      fat: acc.fat + f.fat,
      fiber: acc.fiber + f.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  const eaten = {
    calories: loggedMeals.reduce((s, m) => s + m.details.calories, 0) + Math.round(tickedTotals.calories),
    protein: loggedMeals.reduce((s, m) => s + m.details.protein, 0) + Math.round(tickedTotals.protein),
    carbs: loggedMeals.reduce((s, m) => s + m.details.carbs, 0) + Math.round(tickedTotals.carbs),
    fat: loggedMeals.reduce((s, m) => s + m.details.fat, 0) + Math.round(tickedTotals.fat),
    fiber: loggedMeals.reduce((s, m) => s + m.details.fiber, 0) + Math.round(tickedTotals.fiber),
  };

  const remainingCalories = Math.max(0, result.tdee - eaten.calories);
  const remainingProtein = Math.max(0, result.proteinG - eaten.protein);

  // Dynamically sort suggested meals based on what the user needs most
  const sortedMeals = useMemo(() => {
    const scored = result.meals.map((meal, originalIdx) => {
      let needScore = 50;
      if (remainingProtein > 0) {
        needScore += Math.min(45, (meal.details.protein / remainingProtein) * 45);
      } else {
        needScore += meal.details.protein * 0.4;
      }
      if (remainingCalories > 0 && meal.details.calories <= remainingCalories) {
        needScore += 25;
      }
      return {
        meal,
        originalIdx,
        needScore,
      };
    });

    if (mealsSortOrder === 'need') {
      return [...scored].sort((a, b) => b.needScore - a.needScore);
    }
    if (mealsSortOrder === 'protein') {
      return [...scored].sort((a, b) => b.meal.details.protein - a.meal.details.protein);
    }
    if (mealsSortOrder === 'calories_asc') {
      return [...scored].sort((a, b) => a.meal.details.calories - b.meal.details.calories);
    }
    return scored;
  }, [result.meals, mealsSortOrder, remainingCalories, remainingProtein]);

  const isGoalAchieved = eaten.calories >= result.tdee * 0.9 && eaten.calories <= result.tdee * 1.15;
  const isOverGoal = eaten.calories > result.tdee * 1.15;
  const isUnderGoal = eaten.calories < result.tdee * 0.9;
  const hasIntake = eaten.calories > 0;

  // Trigger celebration animation when goal is newly reached
  useEffect(() => {
    if (isGoalAchieved && !prevAchievedRef.current && (loggedMeals.length > 0 || Object.keys(tickedFoods).length > 0)) {
      setConfettiActive(true);
    }
    prevAchievedRef.current = isGoalAchieved;
  }, [isGoalAchieved, loggedMeals.length, tickedFoods]);

  const totalCalories = result.meals.reduce((s, m) => s + m.details.calories, 0);
  const totalProtein = result.meals.reduce((s, m) => s + m.details.protein, 0);
  const totalCarbs = result.meals.reduce((s, m) => s + m.details.carbs, 0);
  const totalFat = result.meals.reduce((s, m) => s + m.details.fat, 0);
  const totalFiber = result.meals.reduce((s, m) => s + m.details.fiber, 0);
  const dietAnalysis = analyzeDailyDiet(result, profile);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Macro balance radar — how close today's plan is to each target, as % (capped for display)
  const macroRadarAxes = [
    { label: "Calories", value: (totalCalories / result.tdee) * 100 },
    { label: "Protein", value: (totalProtein / result.proteinG) * 100 },
    { label: "Carbs", value: (totalCarbs / result.carbG) * 100 },
    { label: "Fat", value: (totalFat / result.fatG) * 100 },
    { label: "Fiber", value: (totalFiber / result.fiberG) * 100 },
  ];

  // Micronutrient RDI overview — estimated intake vs RDI for every tracked nutrient
  const nutrientChartItems = nutrientInfo
    .filter(n => n.key !== "protein" && n.key !== "fiber") // already charted as macros above
    .map(n => {
      const rdi = result.micros[n.key] || 0;
      const intake = result.estimatedMicroIntake[n.key] || 0;
      const status = getDeficiencyStatus(intake, rdi);
      const pct = rdi > 0 ? Math.round((intake / rdi) * 100) : 0;
      return {
        label: n.label,
        key: n.key,
        unit: n.unit,
        intake,
        rdi,
        pct,
        status,
        valueLabel: intake === 0 ? `— / ${rdi} ${n.unit}` : `${Math.round(intake)} / ${rdi} ${n.unit}`,
      };
    })
    .sort((a, b) => a.pct - b.pct);

  const metNutrients = nutrientChartItems.filter((n) => n.status === 'met');
  const lowNutrients = nutrientChartItems.filter((n) => n.status === 'low');
  const attentionNutrients = nutrientChartItems.filter((n) => n.status === 'attention');
  const microDonutSegments = [
    { label: 'Target Met', value: metNutrients.length, color: '#10b981' },
    { label: 'Potential Low', value: lowNutrients.length, color: '#f59e0b' },
    { label: 'Attention Needed', value: attentionNutrients.length, color: '#f43f5e' },
  ].filter((s) => s.value > 0);

  const overallSufficiencyPct = Math.round(
    (metNutrients.length / (nutrientChartItems.length || 1)) * 100
  );

  const keyRequirements = [
    {
      name: 'Vitamin D3',
      icon: '☀️',
      target: result.micros.vitaminD || 600,
      unit: 'IU',
      current: Math.round(result.estimatedMicroIntake.vitaminD || 0),
    },
    {
      name: 'Vitamin B12',
      icon: '🧬',
      target: result.micros.vitaminB12 || 2.4,
      unit: 'µg',
      current: +(result.estimatedMicroIntake.vitaminB12 || 0).toFixed(1),
    },
    {
      name: 'Iron (Fe)',
      icon: '🩸',
      target: result.micros.iron || 18,
      unit: 'mg',
      current: Math.round(result.estimatedMicroIntake.iron || 0),
    },
    {
      name: 'Calcium (Ca)',
      icon: '🦴',
      target: result.micros.calcium || 1000,
      unit: 'mg',
      current: Math.round(result.estimatedMicroIntake.calcium || 0),
    },
    {
      name: 'Zinc (Zn)',
      icon: '🛡️',
      target: result.micros.zinc || 11,
      unit: 'mg',
      current: Math.round(result.estimatedMicroIntake.zinc || 0),
    },
    {
      name: 'Magnesium',
      icon: '⚡',
      target: result.micros.magnesium || 400,
      unit: 'mg',
      current: Math.round(result.estimatedMicroIntake.magnesium || 0),
    },
    {
      name: 'Vitamin C',
      icon: '🍋',
      target: result.micros.vitaminC || 90,
      unit: 'mg',
      current: Math.round(result.estimatedMicroIntake.vitaminC || 0),
    },
    {
      name: 'Folate (B9)',
      icon: '🌱',
      target: result.micros.folate || 400,
      unit: 'µg',
      current: Math.round(result.estimatedMicroIntake.folate || 0),
    },
  ];

  const handleQuickWater = () => {
    playWaterDropSound();
    if (streak && onUpdateStreak) {
      const todayKey = getLocalDateKey();
      const currentMl = streak.dailyLogs?.[todayKey]?.waterMl || 0;
      const targetMl = streak.settings?.waterTargetMl || 2500;
      const newMl = currentMl + 250;
      const updated = updateDailyFoodWaterLog(streak, todayKey, {
        waterMl: newMl,
        waterTargetMl: targetMl,
      });
      onUpdateStreak(updated);
      setWaterToast(`💧 Added 250ml water! Total today: ${newMl.toLocaleString()} ml`);
      setTimeout(() => setWaterToast(null), 3000);
    } else {
      setWaterToast('💧 250ml logged with sound effect!');
      setTimeout(() => setWaterToast(null), 3000);
    }
  };

  const smartMealMakerSection = (
    <PersonalizedMealHelper
      profile={profile}
      result={result}
      eatenCalories={eaten.calories}
      eatenProtein={eaten.protein}
      onAddMeal={onAddScannedMeal}
    />
  );

  const suggestedMealsSection = (
    <div className="animate-fade-in space-y-4" style={{ animationDelay: '180ms' }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-display font-bold text-xl sm:text-2xl text-stone-900 dark:text-white">Your Suggested Meals</h2>
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-brand-500/15 text-brand-700 dark:text-brand-300 border border-brand-500/30">
              {mealsSortOrder === 'need' ? '🎯 Ranked by Max Need' : 'Custom Sorted'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Full-course meal formulas prioritized by your remaining daily deficit. Tick foods to track them in Today's Progress.
          </p>
        </div>
        {Object.keys(tickedFoods).length > 0 && (
          <div className="flex items-center gap-2">
            <span className="badge badge-success text-xs font-semibold">
              ✓ {Object.keys(tickedFoods).length} food{Object.keys(tickedFoods).length === 1 ? '' : 's'} ticked (+{Math.round(tickedTotals.calories)} kcal)
            </span>
            <button
              type="button"
              onClick={() => setTickedFoods({})}
              className="text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 underline"
            >
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* Meals Need Sort Bar */}
      <div className="flex items-center gap-2 flex-wrap text-xs p-3 rounded-2xl bg-white dark:bg-[#1c1d22] border border-stone-200/80 dark:border-[#2f323c] shadow-sm">
        <span className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
          <ArrowDownWideNarrow className="w-3.5 h-3.5 text-brand-500" /> Sort Meals by:
        </span>
        {[
          { id: 'need', label: '🎯 Most Needed First (Max Gap Match)' },
          { id: 'protein', label: '🥩 Highest Protein' },
          { id: 'calories_asc', label: '⚡ Lowest Calories' },
          { id: 'schedule', label: '🕒 Meal Schedule' },
        ].map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              playChecklistSound(true);
              setMealsSortOrder(opt.id as any);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              mealsSortOrder === opt.id
                ? 'bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] shadow-sm scale-[1.02]'
                : 'bg-stone-100 dark:bg-[#101D2D] text-stone-600 dark:text-[#CBD5E1] hover:bg-stone-200 dark:hover:bg-[#1E293B] border border-stone-200 dark:border-[#1E293B]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {sortedMeals.map(({ meal, originalIdx, needScore }, idx) => (
          <MealCard
            key={originalIdx}
            meal={meal}
            mealIndex={originalIdx}
            rankIndex={idx}
            needScore={needScore}
            result={result}
            profile={profile}
            isExpanded={expandedMeal === originalIdx}
            onToggle={() => setExpandedMeal(expandedMeal === originalIdx ? null : originalIdx)}
            tickedFoods={tickedFoods}
            onToggleFoodTick={handleToggleFoodTick}
            onBatchToggleFoodTicks={handleBatchToggleFoodTicks}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-stone-50/60 dark:bg-[#141518] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Celebration Confetti Animation when Goal is Achieved */}
      <Confetti active={confettiActive} onComplete={() => setConfettiActive(false)} />

      {/* Water logging toast */}
      {waterToast && (
        <div className="fixed top-24 right-6 z-50 animate-bounce-subtle">
          <div className="px-4 py-2.5 rounded-2xl bg-blue-600 text-white text-xs sm:text-sm font-bold shadow-xl border border-blue-400 flex items-center gap-2">
            <span>💧</span>
            <span>{waterToast}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Beginner's 3-Question Clarifier Banner */}
        <BeginnerGuideBanner
          pageTitle="Today's Nutrition & Energy Dashboard"
          whatAmILookingAt="Your live daily food tracker. It shows the energy (calories) you eat and your remaining energy balance for today."
          whatShouldIDo="Tap '+ Log Food' to search anything you ate or drank today, or check off foods from your recipes below."
          whatHappensNext="Your energy meter fills up, your protein/carbs/fat bars update, and you will see how much food you have left to enjoy."
          primaryActionLabel="+ Log What You Ate"
          primaryActionIcon={<Camera className="w-4 h-4" />}
          onPrimaryAction={() => setScannerOpen(true)}
          onOpenGlossary={() => openGlossary('calorie')}
        />

        {/* Top Header: Greeting, Goal Badge, Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-stone-900 dark:text-white tracking-tight">
                {greeting}!
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="capitalize">{profile.goal === 'fat_loss' ? 'Gentle Fat Loss' : profile.goal === 'muscle_gain' ? 'Muscle Building' : 'Maintain Weight'}</span>
                <span className="text-stone-400 dark:text-stone-500">•</span>
                <span>{result.tdee.toLocaleString()} calories/day</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
              Your personalized daily targets. Tap any nutrient or button if you want a plain-English explanation!
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => openGlossary('calorie')}
              className="btn-ghost text-xs sm:text-sm flex items-center gap-1.5 px-3 py-2 rounded-xl text-emerald-700 dark:text-emerald-300"
              title="What do calories and nutrients mean?"
            >
              <Lightbulb className="w-3.5 h-3.5 text-emerald-500" /> <span>Nutrition Guide</span>
            </button>
            <button
              type="button"
              onClick={onEditProfile}
              className="btn-ghost text-xs sm:text-sm flex items-center gap-1.5 px-3 py-2 rounded-xl"
              title="Change your age, weight, height, or goal"
            >
              <Pencil className="w-3.5 h-3.5" /> <span>Edit Profile</span>
            </button>
            <button
              type="button"
              onClick={onRegenerate}
              className="btn-secondary text-xs sm:text-sm flex items-center gap-1.5 px-3 py-2 rounded-xl"
              title="Refresh your meal recommendations"
            >
              <RotateCw className="w-3.5 h-3.5" /> <span>Refresh Meals</span>
            </button>
          </div>
        </div>

        {/* 3-Tab Perspective Switcher */}
        <div className="p-1.5 rounded-2xl bg-white dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] shadow-sm animate-fade-in">
          <div className="grid grid-cols-3 gap-1.5 w-full">
            <button
              type="button"
              onClick={() => {
                playChecklistSound(true);
                setActiveTab('fuel');
              }}
              className={`flex items-center justify-center gap-2 py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                activeTab === 'fuel'
                  ? 'bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] shadow-md shadow-[#22C55E]/20 scale-[1.01]'
                  : 'text-stone-600 dark:text-[#CBD5E1] hover:text-stone-900 dark:hover:text-[#F8FAFC] hover:bg-stone-100 dark:hover:bg-[#101D2D]'
              }`}
            >
              <Flame className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Today's Food & Energy</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playChecklistSound(true);
                setActiveTab('meals');
              }}
              className={`flex items-center justify-center gap-2 py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                activeTab === 'meals'
                  ? 'bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] shadow-md shadow-[#22C55E]/20 scale-[1.01]'
                  : 'text-stone-600 dark:text-[#CBD5E1] hover:text-stone-900 dark:hover:text-[#F8FAFC] hover:bg-stone-100 dark:hover:bg-[#101D2D]'
              }`}
            >
              <Soup className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Suggested Meals</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playChecklistSound(true);
                setActiveTab('analytics');
              }}
              className={`flex items-center justify-center gap-2 py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] shadow-md shadow-[#22C55E]/20 scale-[1.01]'
                  : 'text-stone-600 dark:text-[#CBD5E1] hover:text-stone-900 dark:hover:text-[#F8FAFC] hover:bg-stone-100 dark:hover:bg-[#101D2D]'
              }`}
            >
              <Beaker className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Deeper Nutrition Charts</span>
            </button>
          </div>
        </div>

        {/* TAB 1: Today's Fuel Hub */}
        {activeTab === 'fuel' && (
          <div className="space-y-8 sm:space-y-10 animate-fade-in">

        {/* Quick Action Grid: Log Food, Quick Water, Today's Streak & 30-Day Road-map */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Scan Food CTA */}
          <button
            onClick={() => setScannerOpen(true)}
            className="card-lg p-4 flex items-center gap-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-lg animate-fade-in border-emerald-500/30 bg-[#0B0F0E] dark:from-emerald-950/40 dark:via-[#101D2D] dark:to-teal-950/30 hover:border-emerald-500/60"
            title="What happens: Opens food search to log breakfast, lunch, dinner, or snacks"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#22C55E] to-[#2DD4BF] flex items-center justify-center text-[#07111F] flex-shrink-0 shadow-md shadow-emerald-500/25">
              <Camera className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-extrabold text-xs sm:text-sm text-[#F8FAFC] truncate">
                🍽️ + Log Food
              </h3>
              <p className="text-[11px] text-[#8492A6] truncate">
                Search meal or snack
              </p>
            </div>
          </button>

          {/* Quick Water Button with droplet sound */}
          <button
            onClick={handleQuickWater}
            className="card-lg p-4 flex items-center gap-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-lg animate-fade-in border-[#60A5FA]/30 bg-[#0B0F0E] dark:from-blue-950/40 dark:via-[#101D2D] dark:to-cyan-950/30 hover:border-[#60A5FA]/60"
            title="What happens: Logs a 250ml glass of water to your daily hydration"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#60A5FA] to-cyan-500 flex items-center justify-center text-[#07111F] flex-shrink-0 shadow-md shadow-blue-500/25">
              <Droplet className="w-5 h-5 fill-cyan-100" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-extrabold text-xs sm:text-sm text-[#F8FAFC] truncate">
                💧 +1 Glass Water
              </h3>
              <p className="text-[11px] text-[#60A5FA] font-bold truncate">
                Adds 250ml to total
              </p>
            </div>
          </button>

          {/* Today's Streak CTA */}
          <button
            onClick={onGoToTodayStreak}
            className="card-lg p-4 flex items-center gap-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-lg animate-fade-in border-amber-500/30 bg-[#0B0F0E] dark:from-amber-950/40 dark:via-[#101D2D] dark:to-orange-950/30 hover:border-amber-500/60"
            title="What happens: Opens your daily habit checklist and water log"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-[#07111F] flex-shrink-0 shadow-md shadow-amber-500/25">
              <Flame className="w-5 h-5 fill-amber-200" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <h3 className="font-display font-extrabold text-xs sm:text-sm text-[#F8FAFC] truncate">
                  Daily Habits
                </h3>
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400">
                  {streakCount || 1}d
                </span>
              </div>
              <p className="text-[11px] text-[#8492A6] truncate">
                Daily check-in & water
              </p>
            </div>
          </button>

          {/* 30-Day Road-map CTA */}
          <button
            onClick={onGoToChallenge}
            className="card-lg p-4 flex items-center gap-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-lg animate-fade-in border-emerald-500/25 bg-[#0B0F0E] dark:from-emerald-950/40 dark:via-[#101D2D] dark:to-teal-950/30 hover:border-emerald-500/50"
            title="What happens: Shows your 30-day step-by-step habit road-map"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#22C55E] to-[#2DD4BF] flex items-center justify-center text-[#07111F] flex-shrink-0 shadow-md shadow-emerald-500/20">
              <Trophy className="w-5 h-5 text-[#07111F]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-extrabold text-xs sm:text-sm text-[#F8FAFC] truncate">
                30-Day Road-map
              </h3>
              <p className="text-[11px] text-[#8492A6] truncate">
                Day {activeChallengeDay || 1} • {completedDaysCount ?? 0}/30 completed
              </p>
            </div>
          </button>
        </div>

        {/* Daily Targets in Plain English */}
        <div className="animate-fade-in" style={{ animationDelay: '60ms' }}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <h2 className="font-display font-extrabold text-lg sm:text-xl text-stone-900 dark:text-white flex items-center gap-2">
                <span>Your Daily Targets in Plain Words</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Calculated for your body. Tap any box if you want to understand what it does!
              </p>
            </div>
            <button
              type="button"
              onClick={() => openGlossary('calorie')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              title="Learn about calories, protein, carbs, and fats"
            >
              <Lightbulb className="w-3.5 h-3.5 text-emerald-500" />
              <span>What do these mean?</span>
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            <button type="button" onClick={() => openGlossary('calorie')} className="text-left w-full group">
              <StatCard
                label="Daily Energy (Calories)"
                value={result.tdee.toLocaleString()}
                unit="kcal"
                icon={<Flame className="w-5 h-5" />}
                accent="orange"
              />
            </button>
            <button type="button" onClick={() => openGlossary('protein')} className="text-left w-full group">
              <StatCard
                label="Muscles & Fullness (Protein)"
                value={result.proteinG}
                unit="g"
                icon={<Beef className="w-5 h-5" />}
                accent="brand"
              />
            </button>
            <button type="button" onClick={() => openGlossary('carbs')} className="text-left w-full group">
              <StatCard
                label="Clean Fuel (Carbs)"
                value={result.carbG}
                unit="g"
                icon={<Wheat className="w-5 h-5" />}
                accent="blue"
              />
            </button>
            <button type="button" onClick={() => openGlossary('fat')} className="text-left w-full group">
              <StatCard
                label="Good Fats & Brain (Fats)"
                value={result.fatG}
                unit="g"
                icon={<Droplet className="w-5 h-5" />}
                accent="amber"
              />
            </button>
            <button type="button" onClick={() => openGlossary('fiber')} className="text-left w-full group">
              <StatCard
                label="Digestion (Fiber)"
                value={result.fiberG}
                unit="g"
                icon={<Leaf className="w-5 h-5" />}
                accent="brand"
              />
            </button>
          </div>
        </div>

        {/* Macro Chart + Progress */}
        <div className="grid lg:grid-cols-2 gap-6 items-stretch animate-fade-in" style={{ animationDelay: '120ms' }}>
          <div className="card-lg p-6 sm:p-7 flex flex-col justify-between" ref={donutRef}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="font-display font-semibold text-lg text-stone-900 dark:text-[#F8FAFC] flex items-center gap-2">
                  <span>🏎️ Calorie Speedometer & Horsepower Dyno Lab</span>
                </h3>
                <p className="text-xs text-stone-500 dark:text-[#8492A6]">
                  Advanced automotive cockpit: Real-time speedometer dial, chassis horsepower dyno pulls, and ECU fuel telemetry.
                </p>
              </div>
              <DownloadMenu targetRef={donutRef} filename="calorie-speedometer-dyno" title="Speedometer & Horsepower Dyno" />
            </div>

            <CalorieSpeedometerCluster
              result={result}
              profile={profile}
              eatenCalories={eaten.calories}
              eatenProtein={eaten.protein}
              eatenCarbs={eaten.carbs}
              eatenFat={eaten.fat}
              isGoalAchieved={isGoalAchieved}
            />
          </div>
          <div className="card-lg p-6 sm:p-7 flex flex-col justify-between space-y-4 bg-gradient-to-br from-[#0B0F0E] via-[#101D2D] to-[#07111F] border border-[#1E293B] shadow-[0_12px_36px_rgba(7,17,31,0.65)] relative overflow-hidden">
            {/* Ambient tech glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#2DD4BF]/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#1E293B] relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#22C55E] to-[#2DD4BF] text-[#07111F] flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
                  <Activity className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-[#F8FAFC] flex items-center gap-2">
                    <span>Today's Progress & Fuel Status</span>
                  </h3>
                  <p className="text-xs text-[#8492A6]">
                    Live metabolic intake, target fulfillment & macro fuel balance.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isGoalAchieved ? (
                  <span className="badge badge-success text-xs font-bold flex items-center gap-1 animate-pulse">
                    <Trophy className="w-3.5 h-3.5" /> Goal Achieved!
                  </span>
                ) : hasIntake ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#101D2D] text-[#34D399] border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-ping" />
                    <span>{Math.round((eaten.calories / result.tdee) * 100)}% of target</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#101D2D] text-[#8492A6] border border-[#1E293B]">
                    0% • Standby
                  </span>
                )}
              </div>
            </div>

            {/* Caloric Energy Fulfillment Hero Bar */}
            <div className="p-4 rounded-2xl bg-[#07111F]/90 border border-[#1E293B] space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-[#8492A6] uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Total Energy Intake</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="font-display font-black text-2xl sm:text-3xl text-[#F8FAFC] tabular-nums">
                      {Math.round(eaten.calories).toLocaleString()}
                    </span>
                    <span className="text-xs text-[#8492A6] font-semibold">
                      / {result.tdee.toLocaleString()} kcal
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] font-bold text-[#8492A6] uppercase tracking-wider">
                    {eaten.calories > result.tdee ? 'Intake Exceeded' : 'Remaining Budget'}
                  </div>
                  <div className={`text-base font-extrabold tabular-nums mt-0.5 ${
                    eaten.calories > result.tdee ? 'text-amber-400' : 'text-[#34D399]'
                  }`}>
                    {eaten.calories > result.tdee
                      ? `+${Math.round(eaten.calories - result.tdee)} kcal`
                      : `${Math.round(Math.max(0, result.tdee - eaten.calories))} kcal left`}
                  </div>
                </div>
              </div>

              {/* Glowing Calorie Fulfillment Progress Bar */}
              <div className="w-full h-3 rounded-full bg-[#101D2D] overflow-hidden p-0.5 border border-[#1E293B]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#22C55E] via-[#2DD4BF] to-[#60A5FA] transition-all duration-700 relative shadow-[0_0_12px_rgba(45,212,191,0.4)]"
                  style={{ width: `${Math.min(100, Math.round((eaten.calories / result.tdee) * 100))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#8492A6] pt-0.5">
                <span>{loggedMeals.length} logged meal{loggedMeals.length === 1 ? '' : 's'}</span>
                <span>{Object.keys(tickedFoods).length} ticked food{Object.keys(tickedFoods).length === 1 ? '' : 's'}</span>
                <span className="font-semibold text-[#CBD5E1]">
                  Pace: {Math.round((eaten.calories / result.tdee) * 100)}%
                </span>
              </div>
            </div>

            {/* Empty State for Zero Logged Meals */}
            {loggedMeals.length === 0 && Object.keys(tickedFoods).length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#101D2D]/70 border border-emerald-500/30 text-[#CBD5E1] animate-fade-in relative z-10">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[#34D399] mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-sm text-[#F8FAFC]">Nothing logged yet today! That is completely normal.</div>
                    <p className="text-xs text-[#CBD5E1] mt-1 leading-relaxed">
                      Logging food takes only 5 seconds. Tap <strong>'+ Log Food'</strong> to record what you had for breakfast, lunch, or a snack (like 2 eggs, an apple, or a cup of tea). Or check off items from your suggested meals below.
                    </p>
                    <button
                      type="button"
                      onClick={() => setScannerOpen(true)}
                      className="mt-3 px-4 py-2 rounded-xl text-xs font-bold text-[#07111F] bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] shadow-sm flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>+ Log Your First Food</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Goal Achieved Celebration Card */}
            {isGoalAchieved && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-[#101D2D] to-teal-500/20 border-2 border-emerald-500/60 shadow-[0_0_20px_rgba(45,212,191,0.25)] animate-fade-in flex flex-col sm:flex-row items-center justify-between gap-3 text-[#F8FAFC] relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#22C55E] to-[#2DD4BF] flex items-center justify-center text-[#07111F] shadow-md flex-shrink-0 animate-bounce">
                    <Trophy className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-sm sm:text-base text-[#F8FAFC]">
                        🎉 Daily Nutrition Goal Achieved!
                      </span>
                    </div>
                    <p className="text-xs text-[#34D399] mt-0.5">
                      Brilliant work! Your intake matches your {profile.goal} plan ({Math.round(eaten.calories)} / {result.tdee} kcal).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfettiActive(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] font-bold text-xs shadow-md hover:shadow-lg flex items-center gap-1.5 transition-all flex-shrink-0 cursor-pointer"
                >
                  <PartyPopper className="w-4 h-4" /> Celebrate Again!
                </button>
              </div>
            )}

            {/* Goal Guidance */}
            {hasIntake && !isGoalAchieved && (
              <div className={`p-3.5 rounded-2xl border text-xs animate-fade-in relative z-10 ${
                isOverGoal
                  ? 'bg-orange-950/30 border-orange-500/40 text-orange-200'
                  : 'bg-[#101D2D] border-[#1E293B] text-[#CBD5E1]'
              }`}>
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="font-bold text-xs uppercase tracking-wide text-[#F8FAFC]">
                        {isOverGoal ? '⚠️ Intake Exceeds Daily Target' : '🎯 Working Towards Daily Goal'}
                      </span>
                      <span className="font-semibold tabular-nums text-[11px] text-[#8492A6]">
                        {isOverGoal ? `+${Math.round(eaten.calories - result.tdee)} kcal over target` : `${Math.round(result.tdee - eaten.calories)} kcal remaining`}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-[#CBD5E1]">
                      {isOverGoal
                        ? `You have eaten slightly more than your daily target. For your next meal, enjoy light fresh vegetables or a cup of green tea.`
                        : `You have ${Math.round(result.tdee - eaten.calories)} calories remaining today! Check out your recommended dinner or snacks below.`}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-0.5 text-[11px] font-semibold">
                      {eaten.fiber < result.fiberG && (
                        <span className="px-2 py-0.5 rounded-md bg-[#07111F] text-[#34D399] border border-emerald-500/30">
                          🌾 Fiber: {Math.max(0, result.fiberG - eaten.fiber)}g left
                        </span>
                      )}
                      {eaten.protein < result.proteinG && (
                        <span className="px-2 py-0.5 rounded-md bg-[#07111F] text-[#60A5FA] border border-[#60A5FA]/30">
                          🥩 Protein: {Math.max(0, result.proteinG - eaten.protein)}g left
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Individual Macro Fuel Progress Bars */}
            <div className="space-y-3 pt-1 relative z-10">
              <ProgressBar label="Muscles & Fullness (Protein)" value={eaten.protein} max={result.proteinG} unit="g" color="brand" />
              <ProgressBar label="Clean Fuel (Carbs)" value={eaten.carbs} max={result.carbG} unit="g" color="blue" />
              <ProgressBar label="Good Fats & Brain (Fats)" value={eaten.fat} max={result.fatG} unit="g" color="amber" />
              <ProgressBar label="Digestion (Fiber)" value={eaten.fiber} max={result.fiberG} unit="g" color="brand" />
            </div>
          </div>
        </div>

            {/* Suggested Foods to Fulfill Today's Progress */}
            <div className="animate-fade-in" style={{ animationDelay: '135ms' }}>
              <ProgressFulfillmentFoodSuggester
                result={result}
                profile={profile}
                eaten={eaten}
                isGoalAchieved={isGoalAchieved}
                onAddScannedMeal={onAddScannedMeal}
              />
            </div>

            {/* Wellness Cockpit: Hydration Streaks, Daily Challenge & Composite Nutrition Score */}
            <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
              <WellnessHub
                streak={streak}
                result={result}
                profile={profile}
                eatenCalories={eaten.calories}
                eatenProtein={eaten.protein}
                eatenFiber={eaten.fiber}
                onUpdateStreak={onUpdateStreak}
              />
            </div>
          </div>
        )}

        {/* TAB 2: Meals & Recipes */}
        {activeTab === 'meals' && (
          <div className="space-y-8 sm:space-y-10 animate-fade-in">
            {smartMealMakerSection}
            {suggestedMealsSection}
          </div>
        )}

        {/* TAB 3: Health Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 sm:space-y-10 animate-fade-in">
            {/* Metabolic & Micronutrient Intelligence Hub */}
            <div className="grid lg:grid-cols-2 gap-8 items-stretch animate-fade-in" style={{ animationDelay: '150ms' }}>
          {/* Card 1: Macronutrient Targets & Distribution */}
          <div className="card-lg p-6 sm:p-7 flex flex-col justify-between" ref={radarRef}>
            <div>
              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
                    ⚡
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base sm:text-lg text-stone-900 dark:text-white">
                      Macronutrient Distribution
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Balance of protein, carbs, fats, and fiber against daily targets.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-[#101D2D] p-1 rounded-2xl border border-stone-200 dark:border-[#1E293B]">
                  <button
                    onClick={() => {
                      playChecklistSound(true);
                      setMacroViewMode('radar');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      macroViewMode === 'radar'
                        ? 'bg-white dark:bg-[#0B0F0E] text-[#22C55E] dark:text-[#34D399] shadow-sm'
                        : 'text-stone-500 dark:text-[#8492A6] hover:text-stone-900 dark:hover:text-[#F8FAFC]'
                    }`}
                  >
                    Radar Chart
                  </button>
                  <button
                    onClick={() => {
                      playChecklistSound(true);
                      setMacroViewMode('bars');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      macroViewMode === 'bars'
                        ? 'bg-white dark:bg-[#0B0F0E] text-[#22C55E] dark:text-[#34D399] shadow-sm'
                        : 'text-stone-500 dark:text-[#8492A6] hover:text-stone-900 dark:hover:text-[#F8FAFC]'
                    }`}
                  >
                    Side-by-Side
                  </button>
                </div>
              </div>

              {macroViewMode === 'radar' ? (
                <div className="py-2 flex flex-col items-center">
                  <RadarChart axes={macroRadarAxes} size={230} />
                  <p className="text-[11px] text-stone-400 text-center mt-1">
                    Normalized % coverage per macro. Symmetrical polygon reflects balanced intake.
                  </p>
                </div>
              ) : (
                <div className="py-3" ref={comparisonRef}>
                  <MacroComparisonChart
                    groups={[
                      {
                        label: 'Protein',
                        unit: 'g',
                        series: [
                          { name: 'Target', value: result.proteinG, color: '#d6d3d1' },
                          { name: 'Today', value: totalProtein, color: '#22c55e' },
                        ],
                      },
                      {
                        label: 'Carbs',
                        unit: 'g',
                        series: [
                          { name: 'Target', value: result.carbG, color: '#d6d3d1' },
                          { name: 'Today', value: totalCarbs, color: '#0ea5e9' },
                        ],
                      },
                      {
                        label: 'Fat',
                        unit: 'g',
                        series: [
                          { name: 'Target', value: result.fatG, color: '#d6d3d1' },
                          { name: 'Today', value: totalFat, color: '#f59e0b' },
                        ],
                      },
                      {
                        label: 'Fiber',
                        unit: 'g',
                        series: [
                          { name: 'Target', value: result.fiberG, color: '#d6d3d1' },
                          { name: 'Today', value: totalFiber, color: '#14b8a6' },
                        ],
                      },
                    ]}
                  />
                  <div className="flex items-center justify-center gap-5 mt-3 text-xs text-stone-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-stone-300" /> Target
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-500" /> Today's Plan
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 mt-2">
              <span>Calories: {Math.round(totalCalories)} / {result.tdee} kcal</span>
              <DownloadMenu targetRef={radarRef} filename="macro-distribution" title="Macro Distribution" />
            </div>
          </div>

          {/* Card 2: Micronutrient Sufficiency & User Requirements */}
          <div className="card-lg p-6 sm:p-7 flex flex-col justify-between" ref={rdiRef}>
            <div>
              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                    <Dna className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base sm:text-lg text-stone-900 dark:text-white">
                      Micronutrient Sufficiency
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Coverage of essential vitamins & minerals tailored to your profile.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-[#101D2D] p-1 rounded-2xl border border-stone-200 dark:border-[#1E293B]">
                  <button
                    onClick={() => {
                      playChecklistSound(true);
                      setMicroViewMode('donut');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      microViewMode === 'donut'
                        ? 'bg-white dark:bg-[#0B0F0E] text-[#22C55E] dark:text-[#34D399] shadow-sm'
                        : 'text-stone-500 dark:text-[#8492A6] hover:text-stone-900 dark:hover:text-[#F8FAFC]'
                    }`}
                  >
                    Pie Chart
                  </button>
                  <button
                    onClick={() => {
                      playChecklistSound(true);
                      setMicroViewMode('requirements');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      microViewMode === 'requirements'
                        ? 'bg-white dark:bg-[#0B0F0E] text-[#22C55E] dark:text-[#34D399] shadow-sm'
                        : 'text-stone-500 dark:text-[#8492A6] hover:text-stone-900 dark:hover:text-[#F8FAFC]'
                    }`}
                  >
                    User Targets
                  </button>
                </div>
              </div>

              {microViewMode === 'donut' ? (
                <div className="py-2 flex flex-col items-center">
                  <div className="my-1">
                    <DonutChart
                      segments={microDonutSegments}
                      size={160}
                      centerValue={`${overallSufficiencyPct}%`}
                      centerUnit="Sufficiency"
                    />
                  </div>
                  <div className="w-full grid grid-cols-3 gap-2 mt-2 pt-2 text-center text-xs">
                    <div className="p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/40">
                      <div className="font-extrabold text-base text-emerald-700 dark:text-emerald-300">
                        {metNutrients.length}
                      </div>
                      <div className="text-[10px] text-stone-500 font-semibold">Targets Met</div>
                    </div>
                    <div className="p-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-800/40">
                      <div className="font-extrabold text-base text-amber-700 dark:text-amber-300">
                        {lowNutrients.length}
                      </div>
                      <div className="text-[10px] text-stone-500 font-semibold">Potential Low</div>
                    </div>
                    <div className="p-2 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-800/40">
                      <div className="font-extrabold text-base text-rose-700 dark:text-rose-300">
                        {attentionNutrients.length}
                      </div>
                      <div className="text-[10px] text-stone-500 font-semibold">Attention</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-2 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {keyRequirements.map((req) => {
                      const pct = Math.min(150, Math.round((req.current / req.target) * 100));
                      const isMet = pct >= 90;
                      return (
                        <div
                          key={req.name}
                          className="p-2.5 rounded-2xl bg-stone-50 dark:bg-[#0B0F0E] border border-stone-200/60 dark:border-[#1E293B] flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1">
                              <span>{req.icon}</span>
                              <span className="truncate">{req.name}</span>
                            </span>
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                                isMet
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {pct}%
                            </span>
                          </div>
                          <div className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                            Target: <strong className="text-stone-700 dark:text-stone-300">{req.target} {req.unit}</strong>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-stone-200 dark:bg-stone-800 mt-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isMet ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs mt-2">
              <button
                onClick={() => {
                  playChecklistSound(true);
                  onGoToDeficiency();
                }}
                className="text-brand-600 dark:text-brand-400 font-bold hover:underline flex items-center gap-1.5 transition-colors group"
              >
                <span>🧬 Full Deficiency Screener</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
              <DownloadMenu targetRef={rdiRef} filename="micronutrient-sufficiency" title="Micronutrient Sufficiency" />
            </div>
          </div>
        </div>

        {/* How You're Going & Daily Performance Rating */}
        <PerformanceAnalytics
          result={result}
          profile={profile}
          streak={streak}
          challenge={challenge}
          eatenCalories={eaten.calories}
          eatenProtein={eaten.protein}
          onGoToChallenge={onGoToChallenge}
        />

        {/* Daily Diet Analysis */}
        <div className="card-lg p-6 animate-fade-in" style={{ animationDelay: '240ms' }}>
          <h2 className="font-display font-semibold text-lg text-stone-900 mb-1 flex items-center gap-2">
            <Beaker className="w-5 h-5 text-amber-600" />
            Daily Diet Analysis
          </h2>
          <p className="text-sm text-stone-500 mb-5">Analysis of your full day's diet — overall balance matters more than individual foods.</p>
          <div className="space-y-3">
            {dietAnalysis.map((item, i) => (
              <DietAnalysisRow key={i} item={item} />
            ))}
          </div>
        </div>

        {/* Evidence Basis */}
        <div className="card p-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <ExpandableSection
            title="Evidence Basis"
            icon={<BookOpen className="w-4 h-4 text-stone-500 dark:text-stone-400" />}
          >
            <div className="space-y-3 pt-2">
              {evidenceSources.bmr.concat(evidenceSources.protein, evidenceSources.rdi, evidenceSources.food).map((src, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-stone-800 dark:text-stone-200">{src.source}</div>
                    <div className="text-stone-500 dark:text-stone-400 text-xs mt-0.5">{src.purpose}</div>
                  </div>
                </div>
              ))}
            </div>
          </ExpandableSection>
        </div>

        {/* Deficiency Check CTA */}
        <div className="card-lg p-6 bg-gradient-to-br from-brand-50/80 to-emerald-50/40 dark:from-[#0B0F0E] dark:to-[#101D2D] border border-brand-200/40 dark:border-[#1E293B] animate-fade-in" style={{ animationDelay: '360ms' }}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-brand-500/20">
                <Dna className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg text-stone-900 dark:text-white">Nutrient Status Check</h3>
                <p className="text-sm text-stone-600 dark:text-[#a0a5b2]">Screen your dietary pattern for potential nutrient inadequacies.</p>
              </div>
            </div>
            <button onClick={onGoToDeficiency} className="btn-primary">
              Check Nutrient Status
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )}
  </div>

      {scannerOpen && (
        <NutritionHub
          onClose={() => setScannerOpen(false)}
          onAddMeal={(meal) => onAddScannedMeal(meal)}
        />
      )}

      <NutritionGlossaryModal
        isOpen={glossaryOpen}
        onClose={() => setGlossaryOpen(false)}
        initialTopic={glossaryTopic}
      />
    </div>
  );
}

function extractMealFoods(meal: MealItem): FoodDetail[] {
  const foods: FoodDetail[] = [];
  const seen = new Set<string>();

  // 1. From meal.components if present
  if (meal.components && meal.components.length > 0) {
    for (const comp of meal.components) {
      const cleanKey = comp.replace(/_\d+$/, '');
      const info = getDetailedFoodInfo(cleanKey) || getDetailedFoodInfo(comp);
      if (info && !seen.has(info.name.toLowerCase())) {
        seen.add(info.name.toLowerCase());
        foods.push(info);
      }
    }
  }

  // 2. From meal.food text (split by ' + ')
  if (meal.food) {
    const parts = meal.food.split(' + ');
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const match = trimmed.match(/^(.+?)\s*\((.*?)\)$/);
      const name = match ? match[1].trim() : trimmed;
      const serving = match ? match[2].trim() : '';

      if (!seen.has(name.toLowerCase())) {
        const info = getDetailedFoodInfo(name);
        if (info) {
          seen.add(name.toLowerCase());
          foods.push(serving ? { ...info, serving } : info);
        } else {
          seen.add(name.toLowerCase());
          foods.push({
            name,
            serving: serving || '1 serving',
            calories: Math.round(meal.details.calories / Math.max(1, parts.length)),
            protein: +(meal.details.protein / Math.max(1, parts.length)).toFixed(1),
            carbs: +(meal.details.carbs / Math.max(1, parts.length)).toFixed(1),
            fat: +(meal.details.fat / Math.max(1, parts.length)).toFixed(1),
            fiber: +(meal.details.fiber / Math.max(1, parts.length)).toFixed(1),
          });
        }
      }
    }
  }

  // Fallback
  if (foods.length === 0) {
    foods.push({
      name: meal.food || meal.name,
      serving: '1 serving',
      calories: meal.details.calories,
      protein: meal.details.protein,
      carbs: meal.details.carbs,
      fat: meal.details.fat,
      fiber: meal.details.fiber,
    });
  }

  return foods;
}

interface MealCardProps {
  meal: MealItem;
  mealIndex: number;
  rankIndex?: number;
  needScore?: number;
  result: NutritionResult;
  profile: UserProfile;
  isExpanded: boolean;
  onToggle: () => void;
  tickedFoods: Record<string, FoodDetail>;
  onToggleFoodTick: (uniqueId: string, food: FoodDetail) => void;
  onBatchToggleFoodTicks: (items: { uniqueId: string; food: FoodDetail }[], shouldTick: boolean) => void;
}

function MealCard({
  meal,
  mealIndex,
  rankIndex,
  needScore,
  result,
  profile,
  isExpanded,
  onToggle,
  tickedFoods,
  onToggleFoodTick,
  onBatchToggleFoodTicks,
}: MealCardProps) {
  const analysis = analyzeFood(meal, result, profile);
  const reasoning = getMealReasoning(meal, result, profile);
  const Icon = mealIcons[meal.name] || Soup;
  // Sort individual food components so the highest protein/nutrient items appear first
  const mealFoods = extractMealFoods(meal).sort((a, b) => b.protein - a.protein);

  const mealFoodItemsWithIds = mealFoods.map((f, i) => ({
    uniqueId: `${mealIndex}-${f.name}-${i}`,
    food: f,
  }));

  const tickedInMealCount = mealFoodItemsWithIds.filter(item => !!tickedFoods[item.uniqueId]).length;
  const allTicked = mealFoodItemsWithIds.length > 0 && tickedInMealCount === mealFoodItemsWithIds.length;
  const tickedInMealKcal = mealFoodItemsWithIds
    .filter(item => !!tickedFoods[item.uniqueId])
    .reduce((s, item) => s + item.food.calories, 0);

  const handleToggleAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBatchToggleFoodTicks(mealFoodItemsWithIds, !allTicked);
  };

  return (
    <div className="card-lg overflow-hidden transition-all duration-200 hover:shadow-card-lg border border-stone-200/80 dark:border-[#2e313b]">
      {/* Meal Header */}
      <button onClick={onToggle} className="w-full p-5 text-left">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {typeof rankIndex === 'number' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-500/15 text-brand-700 dark:text-brand-300 border border-brand-500/30">
                  #{rankIndex + 1} Need Priority
                </span>
              )}
              <h3 className="font-display font-semibold text-lg text-stone-900 dark:text-white">{meal.name}</h3>
              <SuitabilityBadge suitability={analysis.suitability} />
              {meal.details.protein > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                  🎯 Fulfills {Math.min(100, Math.round((meal.details.protein / result.proteinG) * 100))}% of Protein Goal ({meal.details.protein}g)
                </span>
              )}
              {tickedInMealCount > 0 && (
                <span className="badge badge-success text-[11px] font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> {tickedInMealCount}/{mealFoods.length} Eaten (+{Math.round(tickedInMealKcal)} kcal)
                </span>
              )}
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-300 truncate">{meal.food}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="metric-value text-xl text-stone-900">{meal.details.calories > 0 ? Math.round(meal.details.calories) : '—'}</div>
            <div className="text-xs text-stone-400 font-medium">kcal</div>
          </div>
          <ChevronRight className={`w-5 h-5 text-stone-400 mt-2 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {/* Suggested Foods Interactive Checklist */}
      <div className="px-5 pb-4 space-y-2.5">
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              Suggested Foods
            </span>
            <span className="text-[11px] text-stone-400 dark:text-stone-500">
              ({mealFoods.length} item{mealFoods.length === 1 ? '' : 's'})
            </span>
          </div>
          <button
            type="button"
            onClick={handleToggleAll}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 hover:underline flex items-center gap-1"
          >
            {allTicked ? 'Untick All' : 'Tick All as Eaten'}
          </button>
        </div>

        {/* Foods Grid / List */}
        <div className="space-y-2">
          {mealFoodItemsWithIds.map(({ uniqueId, food }) => {
            const isTicked = !!tickedFoods[uniqueId];
            return (
              <SuggestedFoodItem
                key={uniqueId}
                food={food}
                isTicked={isTicked}
                onToggle={() => onToggleFoodTick(uniqueId, food)}
                goalContext={{
                  goal: profile.goal,
                  tdee: result.tdee,
                  proteinG: result.proteinG,
                  carbG: result.carbG,
                  fatG: result.fatG,
                  fiberG: result.fiberG,
                }}
              />
            );
          })}
        </div>

        {/* Ticked Summary Banner */}
        {tickedInMealCount > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-200 font-medium animate-fade-in">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>{tickedInMealCount} of {mealFoods.length} foods ticked</span>
            </span>
            <span className="font-bold tabular-nums">
              +{Math.round(tickedInMealKcal)} kcal counted in Today's Progress
            </span>
          </div>
        )}
      </div>

      {/* Nutrition Summary */}
      {meal.details.calories > 0 && (
        <div className="px-5 pb-4">
          <div className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">
            Planned Meal Macro Target
          </div>
          <div className="grid grid-cols-4 gap-3 mb-3">
            {[
              { label: "Protein", val: meal.details.protein, unit: "g", color: "text-brand-600" },
              { label: "Carbs", val: meal.details.carbs, unit: "g", color: "text-sky-600" },
              { label: "Fat", val: meal.details.fat, unit: "g", color: "text-amber-600" },
              { label: "Fiber", val: meal.details.fiber, unit: "g", color: "text-teal-600" },
            ].map(m => (
              <div key={m.label} className="text-center p-2 rounded-lg bg-stone-50 dark:bg-stone-800/50">
                <div className={`metric-value text-base ${m.color}`}>{Math.round(m.val)}<span className="text-xs font-normal text-stone-400">{m.unit}</span></div>
                <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>
          <MacroMiniBar protein={meal.details.protein} carbs={meal.details.carbs} fat={meal.details.fat} />
        </div>
      )}

      {/* Expandable Details */}
      {isExpanded && (
        <div className="border-t border-stone-200/60 px-5 py-4 space-y-3 animate-fade-in">
          {/* Why This Meal */}
          <ExpandableSection title="Why NutriSynth recommended this" icon={<Lightbulb className="w-4 h-4 text-amber-500" />} defaultOpen>
            <p className="text-sm text-stone-600 leading-relaxed">{reasoning}</p>
          </ExpandableSection>

          {/* Food Analysis */}
          {analysis.limitations.length > 0 && (
            <ExpandableSection title="Food Analysis" icon={<Beaker className="w-4 h-4 text-amber-500" />}>
              <div className="space-y-4">
                {analysis.limitations.map((lim, i) => (
                  <div key={i} className="rounded-xl bg-amber-50/60 border border-amber-200/40 p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="font-semibold text-sm text-stone-800">{lim.title}</div>
                    </div>
                    <div className="ml-6 space-y-2">
                      <div>
                        <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Why?</div>
                        <p className="text-sm text-stone-600">{lim.reason}</p>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" /> NutriSynth Solution
                        </div>
                        <p className="text-sm text-stone-700">{lim.solution}</p>
                      </div>
                      {lim.beforeAfter && (
                        <BeforeAfter before={lim.beforeAfter.before} after={lim.beforeAfter.after} modification={lim.beforeAfter.modification} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ExpandableSection>
          )}

          {/* Smart Substitutions */}
          <ExpandableSection title="Smart Substitutions" icon={<Scale className="w-4 h-4 text-teal-500" />}>
            <div className="space-y-3">
              {(meal.components || []).map(compKey => {
                const food = substitutions.find(s => {
                  const f = compKey.replace(/_\d+$/, '');
                  return s.original === f || compKey.includes(s.original);
                });
                if (!food) return null;
                return (
                  <div key={compKey} className="rounded-xl bg-teal-50/40 border border-teal-200/40 p-4">
                    <div className="text-sm font-semibold text-stone-800 mb-2">Alternatives for {food.original}:</div>
                    <div className="space-y-2">
                      {food.alternatives.map(alt => {
                        const altInfo = getDetailedFoodInfo(alt.name);
                        return (
                          <div key={alt.name} className="flex items-start gap-2.5 text-sm p-2 rounded-lg hover:bg-teal-100/40 dark:hover:bg-teal-950/20 transition-colors">
                            <CheckCircle2 className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-stone-800 dark:text-stone-200">{alt.name}</span>
                                {altInfo && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 font-bold tabular-nums">
                                    {Math.round(altInfo.calories)} kcal
                                  </span>
                                )}
                                {alt.vegan && profile.diet === "vegan" && <Badge variant="success">Vegan</Badge>}
                              </div>
                              <span className="text-stone-500 text-xs mt-0.5 block"> — {alt.reason}</span>
                              {altInfo && (
                                <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 flex gap-2">
                                  <span>P: {altInfo.protein}g</span>
                                  <span>C: {altInfo.carbs}g</span>
                                  <span>F: {altInfo.fat}g</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {(meal.components || []).every(compKey => !substitutions.find(s => compKey.includes(s.original))) && (
                <p className="text-sm text-stone-500">No specific substitutions needed for this meal.</p>
              )}
            </div>
          </ExpandableSection>

          {/* Evidence Basis */}
          <ExpandableSection title="Evidence Basis" icon={<BookOpen className="w-4 h-4 text-stone-500" />}>
            <div className="space-y-2">
              {evidenceSources.food.map((src, i) => (
                <div key={i} className="flex gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-stone-800">{src.source}</span>
                    <span className="text-stone-500 text-xs ml-1">— {src.purpose}</span>
                  </div>
                </div>
              ))}
            </div>
          </ExpandableSection>
        </div>
      )}
    </div>
  );
}

function BeforeAfter({ before, after, modification }: { before: Record<string, number>; after: Record<string, number>; modification: string }) {
  return (
    <div className="mt-3 rounded-xl border border-stone-200 overflow-hidden">
      <div className="grid grid-cols-2 divide-x divide-stone-200">
        <div className="p-3 bg-stone-50">
          <div className="text-xs font-semibold text-stone-500 uppercase mb-2">Before</div>
          {Object.entries(before).map(([k, v]) => (
            <div key={k} className="text-sm flex justify-between">
              <span className="text-stone-600 capitalize">{k}</span>
              <span className="font-semibold text-stone-800 tabular-nums">{Math.round(v)}{k === "calories" ? "" : "g"}</span>
            </div>
          ))}
        </div>
        <div className="p-3 bg-brand-50/40">
          <div className="text-xs font-semibold text-brand-600 uppercase mb-2">After</div>
          {Object.entries(after).map(([k, v]) => {
            const diff = v - before[k];
            return (
              <div key={k} className="text-sm flex justify-between">
                <span className="text-stone-600 capitalize">{k}</span>
                <span className="font-semibold text-stone-800 tabular-nums">
                  {Math.round(v)}{k === "calories" ? "" : "g"}
                  {diff !== 0 && <span className={`text-xs ml-1 ${diff > 0 ? 'text-brand-600' : 'text-red-500'}`}>
                    {diff > 0 ? '+' : ''}{Math.round(diff)}
                  </span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="p-2.5 bg-amber-50/60 border-t border-stone-200 text-xs text-stone-600 flex items-center gap-1.5">
        <ArrowRight className="w-3 h-3 text-amber-600" />
        <span className="font-medium">Modification:</span> {modification}
      </div>
    </div>
  );
}

function DietAnalysisRow({ item }: { item: { label: string; status: string; message: string; detail: string } }) {
  const statusConfig = {
    good: {
      icon: CheckCircle2,
      color: "text-emerald-500 dark:text-[#34D399]",
      bg: "bg-emerald-50/80 dark:bg-[#0B0F0E] border border-emerald-200/80 dark:border-[#22C55E]/30",
      labelColor: "text-emerald-700 dark:text-[#34D399]",
      titleColor: "text-stone-900 dark:text-[#F8FAFC]",
      detailColor: "text-stone-600 dark:text-[#CBD5E1]",
    },
    attention: {
      icon: AlertTriangle,
      color: "text-amber-500 dark:text-amber-400",
      bg: "bg-amber-50/80 dark:bg-[#0B0F0E] border border-amber-200/80 dark:border-amber-500/30",
      labelColor: "text-amber-700 dark:text-amber-400",
      titleColor: "text-stone-900 dark:text-[#F8FAFC]",
      detailColor: "text-stone-600 dark:text-[#CBD5E1]",
    },
    caution: {
      icon: Info,
      color: "text-orange-500 dark:text-orange-400",
      bg: "bg-orange-50/80 dark:bg-[#0B0F0E] border border-orange-200/80 dark:border-orange-500/30",
      labelColor: "text-orange-700 dark:text-orange-400",
      titleColor: "text-stone-900 dark:text-[#F8FAFC]",
      detailColor: "text-stone-600 dark:text-[#CBD5E1]",
    },
  };
  const config = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.attention;
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-3.5 p-4 rounded-xl transition-colors ${config.bg}`}>
      <Icon className={`w-5 h-5 ${config.color} mt-0.5 flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className={`font-semibold text-sm ${config.titleColor}`}>
          <span className={`font-bold ${config.labelColor}`}>{item.label}:</span>{' '}
          {item.message}
        </div>
        <div className={`text-xs ${config.detailColor} mt-1 leading-relaxed`}>{item.detail}</div>
      </div>
    </div>
  );
}

function SuitabilityBadge({ suitability }: { suitability: FoodAnalysis["suitability"] }) {
  const map = {
    "suitable": { variant: "success" as const, label: "Suitable" },
    "suitable-with-modification": { variant: "warning" as const, label: "Can improve" },
    "limit": { variant: "warning" as const, label: "Limit" },
    "exclude": { variant: "error" as const, label: "Excluded" },
  };
  const config = map[suitability];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
