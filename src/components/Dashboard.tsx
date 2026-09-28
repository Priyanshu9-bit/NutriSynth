import { useState, useRef, useEffect } from 'react';
import {
  Flame, Beef, Wheat, Droplet, Leaf, Sun, Moon, Soup, Sunrise,
  Lightbulb, Beaker, ArrowRight, ArrowLeft, RotateCw, Pencil, Scale,
  BookOpen, ChevronRight, AlertTriangle, CheckCircle2, Info, TrendingUp, TrendingDown, Dna, Camera,
  Sparkles, Check, Trophy, PartyPopper
} from 'lucide-react';
import type { NutritionResult, UserProfile, MealItem } from '@/lib/calculations';
import { analyzeFood, analyzeDailyDiet, getMealReasoning, type FoodAnalysis } from '@/lib/calculations';
import { ProgressBar, DonutChart, ExpandableSection, Badge, StatCard, MacroComparisonChart, RadarChart, NutrientRDIChart, MacroMiniBar } from '@/components/ui';
import { DownloadMenu } from '@/components/DownloadMenu';
import { NutritionHub } from '@/components/nutrition/NutritionHub';
import { loadTodaysMeals } from '@/lib/cloudStore';
import { evidenceSources } from '@/data/foods';
import { substitutions } from '@/data/foods';
import { nutrientInfo, getDeficiencyStatus } from '@/data/nutrients';
import { getDetailedFoodInfo, type FoodDetail } from '@/data/foodDetails';
import { SuggestedFoodItem } from '@/components/nutrition/SuggestedFoodItem';
import { Confetti } from '@/components/Confetti';

interface DashboardProps {
  result: NutritionResult;
  profile: UserProfile;
  onRegenerate: () => void;
  onEditProfile: () => void;
  onGoToDeficiency: () => void;
  onAddScannedMeal: (meal: MealItem) => void;
}

const mealIcons: Record<string, typeof Sun> = {
  Breakfast: Sunrise, Lunch: Soup, Dinner: Moon,
};

export function Dashboard({ result, profile, onRegenerate, onEditProfile, onGoToDeficiency, onAddScannedMeal }: DashboardProps) {
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  // State for ticked suggested foods: key is `${mealIndex}-${foodName}`
  const [tickedFoods, setTickedFoods] = useState<Record<string, FoodDetail>>({});
  const [confettiActive, setConfettiActive] = useState(false);
  const prevAchievedRef = useRef(false);
  const restoredRef = useRef(false);
  const donutRef = useRef<HTMLDivElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const radarRef = useRef<HTMLDivElement>(null);
  const rdiRef = useRef<HTMLDivElement>(null);

  // Restore meals logged earlier today from Firestore (no-op without Firebase).
  // Skips any meal already present so remounts can't create duplicates.
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const sig = (m: MealItem) => `${m.name}|${m.food}|${m.details.calories}`;
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
      const copy = { ...prev };
      if (copy[uniqueId]) {
        delete copy[uniqueId];
      } else {
        copy[uniqueId] = food;
      }
      return copy;
    });
  };

  const handleBatchToggleFoodTicks = (items: { uniqueId: string; food: FoodDetail }[], shouldTick: boolean) => {
    setTickedFoods((prev) => {
      const copy = { ...prev };
      for (const item of items) {
        if (shouldTick) {
          copy[item.uniqueId] = item.food;
        } else {
          delete item.uniqueId ? delete copy[item.uniqueId] : null;
        }
      }
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
        pct,
        status,
        valueLabel: intake === 0 ? `— / ${rdi} ${n.unit}` : `${Math.round(intake)} / ${rdi} ${n.unit}`,
      };
    })
    .sort((a, b) => a.pct - b.pct);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-stone-50/50 dark:bg-stone-900/50 py-8 px-4 sm:px-6 relative">
      {/* Celebration Confetti Animation when Goal is Achieved */}
      <Confetti active={confettiActive} onComplete={() => setConfettiActive(false)} />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Greeting & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-stone-900">{greeting}!</h1>
            <p className="text-stone-500 mt-1">Here's your personalized nutrition plan for today.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onEditProfile} className="btn-ghost text-sm">
              <Pencil className="w-4 h-4" /> Edit Profile
            </button>
            <button onClick={onRegenerate} className="btn-secondary text-sm">
              <RotateCw className="w-4 h-4" /> Regenerate
            </button>
          </div>
        </div>

        {/* Scan Food CTA */}
        <button
          onClick={() => setScannerOpen(true)}
          className="w-full card-lg p-5 flex items-center gap-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-lg animate-fade-in"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-600 flex items-center justify-center text-white flex-shrink-0">
            <Camera className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-stone-900">🍽️ Log Food</h3>
            <p className="text-sm text-stone-500">Scan a photo, search any food, or type what you ate.</p>
          </div>
          <ArrowRight className="w-5 h-5 text-stone-400 flex-shrink-0" />
        </button>

        {/* Daily Targets */}
        <div className="animate-fade-in" style={{ animationDelay: '60ms' }}>
          <h2 className="font-display font-semibold text-lg text-stone-900 mb-4">Your Daily Targets</h2>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="Calories" value={result.tdee.toLocaleString()} unit="kcal" icon={<Flame className="w-5 h-5" />} accent="orange" />
            <StatCard label="Protein" value={result.proteinG} unit="g" icon={<Beef className="w-5 h-5" />} accent="brand" />
            <StatCard label="Carbs" value={result.carbG} unit="g" icon={<Wheat className="w-5 h-5" />} accent="blue" />
            <StatCard label="Fat" value={result.fatG} unit="g" icon={<Droplet className="w-5 h-5" />} accent="amber" />
            <StatCard label="Fiber" value={result.fiberG} unit="g" icon={<Leaf className="w-5 h-5" />} accent="brand" />
          </div>
        </div>

        {/* Macro Chart + Progress */}
        <div className="grid lg:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: '120ms' }}>
          <div className="card p-6" ref={donutRef}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-lg text-stone-900">Calorie Distribution</h3>
              <DownloadMenu targetRef={donutRef} filename="calorie-distribution" title="Calorie Distribution" />
            </div>
            <DonutChart
              segments={[
                { label: "Protein", value: result.proteinCal, color: "#22c55e" },
                { label: "Carbs", value: result.carbCal, color: "#0ea5e9" },
                { label: "Fat", value: result.fatCal, color: "#f59e0b" },
              ]}
            />
          </div>
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-display font-semibold text-lg text-stone-900 dark:text-white">Today's Progress</h3>
              {isGoalAchieved ? (
                <span className="badge badge-success text-xs font-bold flex items-center gap-1 animate-pulse">
                  <Trophy className="w-3.5 h-3.5" /> Goal Achieved!
                </span>
              ) : hasIntake ? (
                <span className="badge badge-warning text-xs font-semibold">
                  {Math.round((eaten.calories / result.tdee) * 100)}% of target
                </span>
              ) : null}
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400 -mt-2">
              {loggedMeals.length === 0 && Object.keys(tickedFoods).length === 0
                ? 'Nothing logged yet — tick off suggested foods below or use Log Food.'
                : `Based on ${loggedMeals.length} logged meal${loggedMeals.length === 1 ? '' : 's'} and ${Object.keys(tickedFoods).length} ticked suggested food${Object.keys(tickedFoods).length === 1 ? '' : 's'}.`}
            </p>

            {/* Goal Achieved Celebration Card */}
            {isGoalAchieved && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/20 to-teal-500/15 border-2 border-emerald-500/60 dark:border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.25)] animate-fade-in flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-950 dark:text-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-emerald-500 flex items-center justify-center text-white shadow-md flex-shrink-0 animate-bounce">
                    <Trophy className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-sm sm:text-base text-emerald-900 dark:text-emerald-100">
                        🎉 Daily Nutrition Goal Achieved!
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                      Brilliant work! Your intake matches your {profile.goal} plan ({Math.round(eaten.calories)} / {result.tdee} kcal).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfettiActive(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md hover:shadow-lg flex items-center gap-1.5 transition-all flex-shrink-0 cursor-pointer"
                >
                  <PartyPopper className="w-4 h-4" /> Celebrate Again!
                </button>
              </div>
            )}

            {/* Goal Mismatch / Incomplete Guidance */}
            {hasIntake && !isGoalAchieved && (
              <div className={`p-3.5 rounded-2xl border text-xs animate-fade-in ${
                isOverGoal
                  ? 'bg-orange-50/80 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800 text-orange-900 dark:text-orange-200'
                  : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              }`}>
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="font-bold text-xs uppercase tracking-wide">
                        {isOverGoal ? '⚠️ Intake Exceeds Daily Target' : '🎯 Not Matching Daily Goal Yet'}
                      </span>
                      <span className="font-semibold tabular-nums text-[11px] opacity-80">
                        {isOverGoal ? `+${Math.round(eaten.calories - result.tdee)} kcal over target` : `${Math.round(result.tdee - eaten.calories)} kcal remaining`}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed opacity-90">
                      {isOverGoal
                        ? `Your current intake has surpassed your ${result.tdee} kcal target. Favor lighter, high-fiber greens for the rest of the day.`
                        : `Your current intake (${Math.round(eaten.calories)} kcal) is below your target ${result.tdee} kcal. Tick suggested food items below to match your daily energy, fiber and protein goals.`}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-0.5 text-[11px] font-semibold">
                      {eaten.fiber < result.fiberG && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100/90 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/60">
                          🌾 Fiber: {Math.max(0, result.fiberG - eaten.fiber)}g needed
                        </span>
                      )}
                      {eaten.protein < result.proteinG && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100/90 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/60">
                          🥩 Protein: {Math.max(0, result.proteinG - eaten.protein)}g needed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <ProgressBar label="Calories" value={eaten.calories} max={result.tdee} unit="kcal" color="orange" />
            <ProgressBar label="Protein" value={eaten.protein} max={result.proteinG} unit="g" color="brand" />
            <ProgressBar label="Carbs" value={eaten.carbs} max={result.carbG} unit="g" color="blue" />
            <ProgressBar label="Fat" value={eaten.fat} max={result.fatG} unit="g" color="amber" />
            <ProgressBar label="Fiber" value={eaten.fiber} max={result.fiberG} unit="g" color="brand" />
          </div>
        </div>

        {/* Macro Comparison + Balance Radar */}
        <div className="grid lg:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: '150ms' }}>
          <div className="card p-6" ref={comparisonRef}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display font-semibold text-lg text-stone-900">Target vs Today</h3>
              <DownloadMenu targetRef={comparisonRef} filename="target-vs-today" title="Target vs Today" />
            </div>
            <p className="text-xs text-stone-500 mb-4">Grams per macro, side by side.</p>
            <MacroComparisonChart
              groups={[
                { label: "Protein", unit: "g", series: [
                  { name: "Target", value: result.proteinG, color: "#d6d3d1" },
                  { name: "Today", value: totalProtein, color: "#22c55e" },
                ] },
                { label: "Carbs", unit: "g", series: [
                  { name: "Target", value: result.carbG, color: "#d6d3d1" },
                  { name: "Today", value: totalCarbs, color: "#0ea5e9" },
                ] },
                { label: "Fat", unit: "g", series: [
                  { name: "Target", value: result.fatG, color: "#d6d3d1" },
                  { name: "Today", value: totalFat, color: "#f59e0b" },
                ] },
                { label: "Fiber", unit: "g", series: [
                  { name: "Target", value: result.fiberG, color: "#d6d3d1" },
                  { name: "Today", value: totalFiber, color: "#14b8a6" },
                ] },
              ]}
            />
            <div className="flex items-center gap-4 mt-3 text-xs text-stone-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-stone-300" /> Target</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-500" /> Today's plan</span>
            </div>
          </div>
          <div className="card p-6 flex flex-col items-center" ref={radarRef}>
            <div className="w-full">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-display font-semibold text-lg text-stone-900">Macro Balance</h3>
                <DownloadMenu targetRef={radarRef} filename="macro-balance" title="Macro Balance" />
              </div>
              <p className="text-xs text-stone-500 mb-2">% of each daily target covered by today's plan.</p>
            </div>
            <RadarChart axes={macroRadarAxes} size={240} />
          </div>
        </div>

        {/* Micronutrient RDI Overview */}
        <div className="card-lg p-6 animate-fade-in" style={{ animationDelay: '200ms' }} ref={rdiRef}>
          <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
            <h2 className="font-display font-semibold text-lg text-stone-900 flex items-center gap-2">
              <Dna className="w-5 h-5 text-rose-500" />
              Micronutrient Overview
            </h2>
            <div className="flex items-center gap-1">
              <button onClick={onGoToDeficiency} className="text-sm font-medium text-brand-600 hover:underline flex items-center gap-1">
                Full Deficiency Check <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <DownloadMenu targetRef={rdiRef} filename="micronutrient-overview" title="Micronutrient Overview" />
            </div>
          </div>
          <p className="text-sm text-stone-500 mb-5">Estimated intake from today's meals against reference daily intakes. Sorted lowest coverage first.</p>
          <NutrientRDIChart items={nutrientChartItems} />
          <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-stone-200/60 text-xs text-stone-500">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#22c55e' }} /> Target appears met</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f59e0b' }} /> Potential low intake</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ef4444' }} /> Attention needed</span>
            <span className="flex items-center gap-1.5"><span className="w-1 h-3 rounded-full bg-stone-400" /> 100% of RDI marker</span>
          </div>
        </div>

        {/* Meal Recommendations */}
        <div className="animate-fade-in" style={{ animationDelay: '180ms' }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h2 className="font-display font-semibold text-lg text-stone-900 dark:text-white">Your Suggested Meals</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">Tick any suggested food to reveal its kcal, macros, and track it in Today's Progress.</p>
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
          <div className="space-y-4">
            {result.meals.map((meal, idx) => (
              <MealCard
                key={idx}
                meal={meal}
                mealIndex={idx}
                result={result}
                profile={profile}
                isExpanded={expandedMeal === idx}
                onToggle={() => setExpandedMeal(expandedMeal === idx ? null : idx)}
                tickedFoods={tickedFoods}
                onToggleFoodTick={handleToggleFoodTick}
                onBatchToggleFoodTicks={handleBatchToggleFoodTicks}
              />
            ))}
          </div>
        </div>

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
            icon={<BookOpen className="w-4 h-4 text-stone-500" />}
          >
            <div className="space-y-3 pt-2">
              {evidenceSources.bmr.concat(evidenceSources.protein, evidenceSources.rdi, evidenceSources.food).map((src, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-stone-800">{src.source}</div>
                    <div className="text-stone-500 text-xs mt-0.5">{src.purpose}</div>
                  </div>
                </div>
              ))}
            </div>
          </ExpandableSection>
        </div>

        {/* Deficiency Check CTA */}
        <div className="card-lg p-6 bg-gradient-to-br from-brand-50 to-emerald-50/40 border-brand-200/40 animate-fade-in" style={{ animationDelay: '360ms' }}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-600 flex items-center justify-center text-white flex-shrink-0">
                <Dna className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg text-stone-900">Nutrient Status Check</h3>
                <p className="text-sm text-stone-600">Screen your dietary pattern for potential nutrient inadequacies.</p>
              </div>
            </div>
            <button onClick={onGoToDeficiency} className="btn-primary">
              Check Nutrient Status
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {scannerOpen && (
        <NutritionHub
          onClose={() => setScannerOpen(false)}
          onAddMeal={(meal) => onAddScannedMeal(meal)}
        />
      )}
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
  const mealFoods = extractMealFoods(meal);

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
    <div className="card-lg overflow-hidden transition-all duration-200 hover:shadow-card-lg">
      {/* Meal Header */}
      <button onClick={onToggle} className="w-full p-5 text-left">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-600 flex items-center justify-center text-white flex-shrink-0">
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-display font-semibold text-lg text-stone-900">{meal.name}</h3>
              <SuitabilityBadge suitability={analysis.suitability} />
              {tickedInMealCount > 0 && (
                <span className="badge badge-success text-[11px] font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> {tickedInMealCount}/{mealFoods.length} Eaten (+{Math.round(tickedInMealKcal)} kcal)
                </span>
              )}
            </div>
            <p className="text-sm text-stone-600 truncate">{meal.food}</p>
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
              {meal.components.map(compKey => {
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
              {meal.components.every(compKey => !substitutions.find(s => compKey.includes(s.original))) && (
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
    good: { icon: CheckCircle2, color: "text-brand-600", bg: "bg-brand-50" },
    attention: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
    caution: { icon: Info, color: "text-orange-600", bg: "bg-orange-50" },
  };
  const config = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.attention;
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl ${config.bg}`}>
      <Icon className={`w-5 h-5 ${config.color} mt-0.5 flex-shrink-0`} />
      <div>
        <div className="font-semibold text-sm text-stone-800">{item.label}: {item.message}</div>
        <div className="text-xs text-stone-500 mt-0.5">{item.detail}</div>
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
