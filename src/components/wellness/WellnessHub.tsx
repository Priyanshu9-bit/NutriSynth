import React, { useState, useMemo } from 'react';
import {
  Droplet,
  Trophy,
  Flame,
  Award,
  Sparkles,
  CheckCircle2,
  Plus,
  Minus,
  Check,
  ChevronRight,
  Zap,
  Info,
  Heart,
  TrendingUp,
  X,
} from 'lucide-react';
import type { NutritionResult, UserProfile } from '@/lib/calculations';
import {
  type StreakData,
  getLocalDateKey,
  updateDailyFoodWaterLog,
  calculateHydrationStreak,
  getTodayWellnessChallenge,
  type DailyWellnessChallenge,
  playGrandCelebrationSound,
} from '@/lib/streakService';
import {
  playWaterDropSound,
  playCongratsSound,
  playChecklistSound,
} from '@/lib/soundEffects';
import { Confetti } from '@/components/Confetti';

interface WellnessHubProps {
  streak?: StreakData;
  result: NutritionResult;
  profile: UserProfile;
  eatenCalories: number;
  eatenProtein: number;
  eatenFiber: number;
  onUpdateStreak?: (newStreak: StreakData) => void;
}

interface AchievementBadge {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  isUnlocked: boolean;
  progressText: string;
  progressPct: number;
}

export function WellnessHub({
  streak,
  result,
  profile,
  eatenCalories,
  eatenProtein,
  eatenFiber,
  onUpdateStreak,
}: WellnessHubProps) {
  const [confettiActive, setConfettiActive] = useState<boolean>(false);
  const [selectedBadge, setSelectedBadge] = useState<AchievementBadge | null>(null);
  const [scoreModalOpen, setScoreModalOpen] = useState<boolean>(false);

  const todayKey = getLocalDateKey();
  const todayLog = streak?.dailyLogs?.[todayKey];
  const waterTargetMl = streak?.settings?.waterTargetMl || 2500;
  const currentWaterMl = todayLog?.waterMl || 0;
  const waterPct = Math.min(150, Math.round((currentWaterMl / waterTargetMl) * 100));

  const hydrationStreak = useMemo(() => calculateHydrationStreak(streak), [streak]);
  const dailyChallenge = useMemo(() => getTodayWellnessChallenge(), []);

  // Check if today's challenge is completed
  const isChallengeDone = useMemo(() => {
    return Array.isArray(streak?.completedChallenges) && streak!.completedChallenges.includes(todayKey);
  }, [streak, todayKey]);

  // Log water adjustments (+250ml, +500ml, -250ml)
  const handleAdjustWater = (amountMl: number) => {
    playWaterDropSound();
    if (!streak || !onUpdateStreak) return;

    const newTotal = Math.max(0, currentWaterMl + amountMl);
    const wasUnder = currentWaterMl < waterTargetMl;
    const isNowTarget = newTotal >= waterTargetMl;

    if (wasUnder && isNowTarget) {
      playCongratsSound();
      setConfettiActive(true);
    }

    const updated = updateDailyFoodWaterLog(streak, todayKey, {
      waterMl: newTotal,
      waterTargetMl,
    });
    onUpdateStreak(updated);
  };

  // Mark Daily Challenge Completed
  const handleToggleChallenge = () => {
    if (!streak || !onUpdateStreak) return;
    if (isChallengeDone) return; // already done

    playCongratsSound();
    setConfettiActive(true);

    const existingChallenges = Array.isArray(streak.completedChallenges)
      ? [...streak.completedChallenges]
      : [];

    if (!existingChallenges.includes(todayKey)) {
      existingChallenges.push(todayKey);
    }

    const updatedStreak: StreakData = {
      ...streak,
      completedChallenges: existingChallenges,
    };
    onUpdateStreak(updatedStreak);
  };

  // COMPOSITE NUTRITION SCORE CALCULATION (0 - 100)
  const scoreBreakdown = useMemo(() => {
    const targetCalories = result.tdee || 2000;
    const targetProtein = result.proteinG || 120;
    const targetFiber = result.fiberG || 30;

    // 1. Calorie Accuracy (up to 30 pts)
    const calDiffRatio = Math.abs(eatenCalories - targetCalories) / targetCalories;
    let calScore = 0;
    if (eatenCalories > 0) {
      if (calDiffRatio <= 0.05) calScore = 30;
      else if (calDiffRatio <= 0.15) calScore = 26;
      else if (calDiffRatio <= 0.25) calScore = 20;
      else if (calDiffRatio <= 0.40) calScore = 14;
      else calScore = Math.max(5, Math.round((eatenCalories / targetCalories) * 20));
    }

    // 2. Protein Adherence (up to 25 pts)
    const proteinRatio = Math.min(1.2, eatenProtein / (targetProtein || 1));
    const proteinScore = Math.round(Math.min(25, proteinRatio * 25));

    // 3. Hydration Target (up to 25 pts)
    const hydraRatio = Math.min(1.2, currentWaterMl / (waterTargetMl || 1));
    const hydraScore = Math.round(Math.min(25, hydraRatio * 25));

    // 4. Fiber & Daily Challenge Adherence (up to 20 pts)
    const fiberRatio = Math.min(1.0, eatenFiber / (targetFiber || 1));
    let fiberBonus = Math.round(fiberRatio * 10);
    let challengeBonus = isChallengeDone ? 10 : 0;
    const habitScore = fiberBonus + challengeBonus;

    const totalScore = Math.min(100, calScore + proteinScore + hydraScore + habitScore);

    let grade = 'C';
    let label = 'Warming Up';
    let color = 'text-stone-400';
    let badgeClass = 'bg-stone-500/15 text-stone-400 border-stone-500/30';

    if (totalScore >= 90) {
      grade = 'A+';
      label = 'Optimal Fueling';
      color = 'text-emerald-500 dark:text-emerald-400';
      badgeClass = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30';
    } else if (totalScore >= 78) {
      grade = 'A';
      label = 'High Performance';
      color = 'text-teal-500 dark:text-teal-400';
      badgeClass = 'bg-teal-500/15 text-teal-600 dark:text-teal-300 border-teal-500/30';
    } else if (totalScore >= 60) {
      grade = 'B';
      label = 'Building Momentum';
      color = 'text-amber-500 dark:text-amber-400';
      badgeClass = 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30';
    }

    return {
      totalScore,
      grade,
      label,
      color,
      badgeClass,
      calScore,
      proteinScore,
      hydraScore,
      habitScore,
    };
  }, [eatenCalories, eatenProtein, eatenFiber, currentWaterMl, waterTargetMl, result, isChallengeDone]);

  // ACHIEVEMENT BADGES SYSTEM
  const badges: AchievementBadge[] = useMemo(() => {
    const activeStreak = streak?.currentStreak || 1;
    const proteinTarget = result.proteinG || 120;
    const fiberTarget = result.fiberG || 30;
    const calorieTarget = result.tdee || 2000;
    const calDiff = Math.abs(eatenCalories - calorieTarget) / calorieTarget;

    return [
      {
        id: 'hydra_hero',
        name: 'Hydration Hero',
        icon: '💧',
        category: 'Hydration',
        description: 'Drink 2,500ml of clean water in a single day.',
        isUnlocked: currentWaterMl >= waterTargetMl,
        progressText: `${currentWaterMl.toLocaleString()} / ${waterTargetMl.toLocaleString()} ml`,
        progressPct: Math.min(100, Math.round((currentWaterMl / waterTargetMl) * 100)),
      },
      {
        id: 'protein_dynamo',
        name: 'Protein Dynamo',
        icon: '🥩',
        category: 'Macros',
        description: 'Reach 90% or more of your personalized daily protein goal.',
        isUnlocked: eatenProtein >= proteinTarget * 0.9,
        progressText: `${Math.round(eatenProtein)} / ${proteinTarget}g`,
        progressPct: Math.min(100, Math.round((eatenProtein / proteinTarget) * 100)),
      },
      {
        id: 'target_locked',
        name: 'Target Locked',
        icon: '🎯',
        category: 'Precision',
        description: 'Calorie intake landed within ±8% of your exact target TDEE.',
        isUnlocked: eatenCalories > 0 && calDiff <= 0.08,
        progressText: eatenCalories > 0 ? `${Math.round((1 - calDiff) * 100)}% Match` : 'Awaiting logs',
        progressPct: eatenCalories > 0 ? Math.min(100, Math.round((1 - calDiff) * 100)) : 0,
      },
      {
        id: 'streak_3d',
        name: 'Consistency Flame',
        icon: '🔥',
        category: 'Consistency',
        description: 'Maintain an active daily wellness check-in streak of 3+ days.',
        isUnlocked: activeStreak >= 3,
        progressText: `${activeStreak} / 3 Days`,
        progressPct: Math.min(100, Math.round((activeStreak / 3) * 100)),
      },
      {
        id: 'fiber_fuel',
        name: 'Fiber Champion',
        icon: '🌾',
        category: 'Gut Health',
        description: 'Fulfill 100% of your daily gut-nourishing fiber requirement.',
        isUnlocked: eatenFiber >= fiberTarget,
        progressText: `${Math.round(eatenFiber)} / ${fiberTarget}g`,
        progressPct: Math.min(100, Math.round((eatenFiber / fiberTarget) * 100)),
      },
      {
        id: 'daily_micro',
        name: 'Challenge Crusher',
        icon: '⚡',
        category: 'Habits',
        description: 'Complete today\'s interactive daily micro-challenge.',
        isUnlocked: isChallengeDone,
        progressText: isChallengeDone ? 'Done today!' : 'Pending',
        progressPct: isChallengeDone ? 100 : 0,
      },
      {
        id: 'hydra_streak_2d',
        name: 'Water Velocity',
        icon: '🌊',
        category: 'Hydration',
        description: 'Achieve a 2-day consecutive hydration streak.',
        isUnlocked: hydrationStreak >= 2,
        progressText: `${hydrationStreak} / 2 Days`,
        progressPct: Math.min(100, Math.round((hydrationStreak / 2) * 100)),
      },
      {
        id: 'dyno_master',
        name: 'Speedometer Pro',
        icon: '🏎️',
        category: 'Telemetry',
        description: 'Score an A or A+ on your Composite Daily Nutrition Score.',
        isUnlocked: scoreBreakdown.totalScore >= 78,
        progressText: `${scoreBreakdown.totalScore} / 100 Pts`,
        progressPct: scoreBreakdown.totalScore,
      },
    ];
  }, [
    streak,
    result,
    eatenCalories,
    eatenProtein,
    eatenFiber,
    currentWaterMl,
    waterTargetMl,
    isChallengeDone,
    hydrationStreak,
    scoreBreakdown.totalScore,
  ]);

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  return (
    <div className="space-y-6">
      {/* Celebration Confetti */}
      <Confetti active={confettiActive} onComplete={() => setConfettiActive(false)} />

      {/* Wellness Cockpit Grid: 3 Interactive Modules */}
      <div className="grid md:grid-cols-3 gap-4 items-stretch">
        {/* Module 1: Interactive Hydration Tracker & Streak */}
        <div className="card-lg p-5 flex flex-col justify-between space-y-4 border-[#1E293B] bg-gradient-to-br from-[#0B0F0E] via-[#07111F] to-[#101D2D] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#60A5FA]/20 text-[#60A5FA] flex items-center justify-center font-bold text-lg shadow-sm">
                💧
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-stone-900 dark:text-[#F8FAFC] flex items-center gap-1.5">
                  <span>Hydration Streak</span>
                </h3>
                <p className="text-[11px] text-stone-500 dark:text-[#8492A6]">
                  Daily water requirement & flow
                </p>
              </div>
            </div>

            {/* Hydration Streak Pill */}
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black border transition-all ${
                hydrationStreak > 0
                  ? 'bg-[#60A5FA]/20 text-[#60A5FA] border-[#60A5FA]/40 animate-pulse'
                  : 'bg-stone-100 dark:bg-[#101D2D] text-stone-500 dark:text-[#CBD5E1] border-stone-200 dark:border-[#1E293B]'
              }`}
            >
              <span>🌊</span>
              <span>{hydrationStreak}d streak</span>
            </div>
          </div>

          {/* Water Progress Ring & Numeric Volume */}
          <div className="flex items-center justify-between gap-4 py-1">
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="font-display font-black text-2xl text-stone-900 dark:text-[#F8FAFC] tabular-nums">
                  {currentWaterMl.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-stone-500 dark:text-[#8492A6]">
                  / {waterTargetMl.toLocaleString()} ml
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-[#60A5FA]">{waterPct}%</span>
                <span className="text-[11px] text-stone-400 dark:text-[#8492A6]">
                  {currentWaterMl >= waterTargetMl
                    ? '🎉 Target reached!'
                    : `${Math.max(0, waterTargetMl - currentWaterMl).toLocaleString()} ml left`}
                </span>
              </div>
            </div>

            {/* Micro Gauge Droplet Ring */}
            <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
                <circle cx="24" cy="24" r="20" fill="none" className="stroke-stone-200 dark:stroke-[#1E293B]" strokeWidth="4" />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="#60A5FA"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="125.6"
                  strokeDashoffset={Math.max(0, 125.6 - (Math.min(100, waterPct) / 100) * 125.6)}
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#60A5FA]">
                💧
              </span>
            </div>
          </div>

          {/* Water Quick Action Buttons */}
          <div className="flex items-center gap-2 pt-1 border-t border-stone-200/60 dark:border-[#1E293B]">
            <button
              type="button"
              onClick={() => handleAdjustWater(250)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold bg-[#101D2D] hover:bg-[#101D2D]/80 text-[#60A5FA] border border-[#60A5FA]/30 active:scale-95 transition-all cursor-pointer"
              title="Add 250ml glass of water"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+250ml Glass</span>
            </button>

            <button
              type="button"
              onClick={() => handleAdjustWater(500)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold bg-[#60A5FA]/15 hover:bg-[#60A5FA]/25 text-[#60A5FA] border border-[#60A5FA]/30 active:scale-95 transition-all cursor-pointer"
              title="Add 500ml water bottle"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+500ml</span>
            </button>

            {currentWaterMl > 0 && (
              <button
                type="button"
                onClick={() => handleAdjustWater(-250)}
                className="p-2 rounded-xl text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-[#101D2D] transition-colors cursor-pointer"
                title="Undo 250ml"
                aria-label="Undo 250ml"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Module 2: Interactive Daily Wellness Micro-Challenge */}
        <div className="card-lg p-5 flex flex-col justify-between space-y-4 border-[#1E293B] bg-gradient-to-br from-[#0B0F0E] via-[#07111F] to-[#101D2D] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#22C55E]/15 text-[#34D399] flex items-center justify-center font-bold text-lg shadow-sm">
                {dailyChallenge.icon}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-[#22C55E]/20 text-[#34D399]">
                    Daily Challenge
                  </span>
                  <span className="text-[10px] font-bold text-stone-400 dark:text-[#8492A6]">+{dailyChallenge.xp} XP</span>
                </div>
                <h3 className="font-display font-bold text-sm text-stone-900 dark:text-[#F8FAFC] mt-0.5">
                  {dailyChallenge.title}
                </h3>
              </div>
            </div>

            {isChallengeDone ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-[#22C55E]/20 text-[#34D399] border border-[#22C55E]/40 flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[3]" /> Done!
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#2DD4BF]/15 text-[#2DD4BF] border border-[#2DD4BF]/30">
                Active
              </span>
            )}
          </div>

          <p className="text-xs text-stone-600 dark:text-[#CBD5E1] leading-relaxed py-1">
            {dailyChallenge.description}
          </p>

          {/* 1-Click Complete Button */}
          <button
            type="button"
            onClick={handleToggleChallenge}
            disabled={isChallengeDone}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              isChallengeDone
                ? 'bg-[#22C55E]/15 text-[#34D399] border border-[#22C55E]/30 cursor-default'
                : 'bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] hover:opacity-95 text-[#07111F] font-bold shadow-md shadow-[#22C55E]/20 active:scale-95 cursor-pointer'
            }`}
          >
            {isChallengeDone ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                <span>Challenge Completed (+{dailyChallenge.xp} XP)</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#07111F]" />
                <span>Tap to Complete Challenge</span>
              </>
            )}
          </button>
        </div>

        {/* Module 3: Composite Nutrition Score Speedometer Gauge */}
        <div className="card-lg p-5 flex flex-col justify-between space-y-4 border-[#1E293B] bg-gradient-to-br from-[#0B0F0E] via-[#07111F] to-[#101D2D] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#22C55E]/20 text-[#34D399] flex items-center justify-center font-bold text-lg shadow-sm">
                ⚡
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-stone-900 dark:text-[#F8FAFC]">
                  Nutrition Score
                </h3>
                <p className="text-[11px] text-stone-500 dark:text-[#8492A6]">
                  Comprehensive health rating
                </p>
              </div>
            </div>

            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${scoreBreakdown.badgeClass}`}>
              Grade {scoreBreakdown.grade}
            </span>
          </div>

          {/* Score Speedometer Meter & Diagnosis */}
          <div className="flex items-center justify-between gap-4 py-1">
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="font-display font-black text-3xl text-stone-900 dark:text-[#F8FAFC] tabular-nums">
                  {scoreBreakdown.totalScore}
                </span>
                <span className="text-xs font-semibold text-stone-400 dark:text-[#8492A6]">/ 100</span>
              </div>
              <div className="text-xs font-bold text-emerald-600 dark:text-[#34D399]">
                {scoreBreakdown.label}
              </div>
              <p className="text-[10px] text-stone-500 dark:text-[#8492A6]">
                Based on calories, macros, hydration & habits
              </p>
            </div>

            {/* Mini Dial Gauge */}
            <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 60 60" className="w-full h-full -rotate-90">
                <circle cx="30" cy="30" r="24" fill="none" className="stroke-stone-200 dark:stroke-[#1E293B]" strokeWidth="5" />
                <circle
                  cx="30"
                  cy="30"
                  r="24"
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray="150.8"
                  strokeDashoffset={Math.max(0, 150.8 - (scoreBreakdown.totalScore / 100) * 150.8)}
                  className="transition-all duration-700"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-stone-900 dark:text-[#F8FAFC]">
                {scoreBreakdown.grade}
              </span>
            </div>
          </div>

          {/* Breakdown Trigger Button */}
          <button
            type="button"
            onClick={() => setScoreModalOpen(true)}
            className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-white dark:bg-[#101D2D] hover:bg-stone-100 dark:hover:bg-[#101D2D]/80 text-stone-700 dark:text-[#CBD5E1] border border-stone-200 dark:border-[#1E293B] transition-all flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-stone-400 dark:text-[#8492A6]" />
              <span>Score Breakdown & Points</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 dark:text-[#8492A6]" />
          </button>
        </div>
      </div>

      {/* Achievement Badges Showcase */}
      <div className="card-lg p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-stone-900 dark:text-[#F8FAFC] flex items-center gap-2">
                <span>Achievement Badges & Trophies</span>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  {unlockedCount} / {badges.length} Unlocked
                </span>
              </h3>
              <p className="text-xs text-stone-500 dark:text-[#8492A6]">
                Unlock wellness milestones by staying consistent with your daily targets.
              </p>
            </div>
          </div>

          {unlockedCount > 0 && (
            <button
              type="button"
              onClick={() => {
                playGrandCelebrationSound();
                setConfettiActive(true);
              }}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>🎉 Celebrate Trophies</span>
            </button>
          )}
        </div>

        {/* 8-Badge Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {badges.map((b) => (
            <div
              key={b.id}
              onClick={() => {
                playChecklistSound(true);
                setSelectedBadge(b);
              }}
              className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer text-left flex flex-col justify-between gap-2.5 hover:-translate-y-0.5 hover:shadow-card-md ${
                b.isUnlocked
                  ? 'bg-gradient-to-b from-amber-500/10 to-transparent border-amber-500/40 shadow-sm shadow-amber-500/10'
                  : 'bg-stone-50/80 dark:bg-[#0B0F0E] border-stone-200/80 dark:border-[#1E293B] opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{b.icon}</span>
                {b.isUnlocked ? (
                  <span className="w-5 h-5 rounded-full bg-[#22C55E]/20 text-[#22C55E] flex items-center justify-center text-[10px] font-black">
                    ✓
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-stone-400 dark:text-[#8492A6]">
                    Locked
                  </span>
                )}
              </div>

              <div>
                <div className="text-xs font-bold text-stone-900 dark:text-[#F8FAFC] truncate">
                  {b.name}
                </div>
                <div className="text-[10px] text-stone-500 dark:text-[#8492A6] truncate mt-0.5">
                  {b.progressText}
                </div>
              </div>

              {/* Mini Progress Bar */}
              <div className="w-full h-1 rounded-full bg-stone-200 dark:bg-[#1E293B] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    b.isUnlocked ? 'bg-amber-500' : 'bg-stone-400 dark:bg-stone-600'
                  }`}
                  style={{ width: `${b.progressPct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Badge Detail Modal / Celebration */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#07111F] border border-stone-200 dark:border-[#1E293B] p-6 space-y-4 shadow-2xl relative animate-scale-up">
            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-[#F8FAFC] hover:bg-stone-100 dark:hover:bg-[#101D2D] cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-2 pt-2">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/15 border-2 border-amber-500/30 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/20">
                {selectedBadge.icon}
              </div>
              <h4 className="font-display font-extrabold text-lg text-stone-900 dark:text-[#F8FAFC]">
                {selectedBadge.name}
              </h4>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                selectedBadge.isUnlocked
                  ? 'bg-[#22C55E]/15 text-emerald-600 dark:text-[#34D399] border-[#22C55E]/30'
                  : 'bg-stone-100 dark:bg-[#101D2D] text-stone-500 dark:text-[#CBD5E1] border-stone-200 dark:border-[#1E293B]'
              }`}>
                {selectedBadge.isUnlocked ? '🏆 Achievement Unlocked' : '🔒 In Progress'}
              </span>
            </div>

            <p className="text-xs text-stone-600 dark:text-[#CBD5E1] text-center leading-relaxed">
              {selectedBadge.description}
            </p>

            <div className="p-3 rounded-2xl bg-stone-100 dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] text-xs flex justify-between items-center">
              <span className="font-semibold text-stone-600 dark:text-[#CBD5E1]">Progress:</span>
              <span className="font-extrabold text-stone-900 dark:text-[#F8FAFC]">{selectedBadge.progressText}</span>
            </div>

            {selectedBadge.isUnlocked ? (
              <button
                type="button"
                onClick={() => {
                  playGrandCelebrationSound();
                  setConfettiActive(true);
                  setSelectedBadge(null);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer"
              >
                🎉 Celebrate Badge!
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="w-full py-2.5 rounded-xl bg-stone-200 dark:bg-[#101D2D] text-stone-700 dark:text-[#CBD5E1] border border-transparent dark:border-[#1E293B] font-bold text-xs cursor-pointer"
              >
                Got It
              </button>
            )}
          </div>
        </div>
      )}

      {/* Score Breakdown Modal */}
      {scoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#07111F] border border-stone-200 dark:border-[#1E293B] p-6 space-y-4 shadow-2xl relative animate-scale-up">
            <button
              type="button"
              onClick={() => setScoreModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-[#F8FAFC] hover:bg-stone-100 dark:hover:bg-[#101D2D] cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h4 className="font-display font-extrabold text-lg text-stone-900 dark:text-[#F8FAFC]">
                Nutrition Score Breakdown
              </h4>
              <p className="text-xs text-stone-500 dark:text-[#8492A6]">
                How your {scoreBreakdown.totalScore}/100 composite score is calculated:
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] flex justify-between items-center">
                <div>
                  <div className="font-bold text-stone-900 dark:text-[#F8FAFC]">Calorie Precision</div>
                  <div className="text-[11px] text-stone-500 dark:text-[#8492A6]">Target balance ±10%</div>
                </div>
                <span className="font-extrabold text-orange-500 text-sm">
                  {scoreBreakdown.calScore} / 30 pts
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] flex justify-between items-center">
                <div>
                  <div className="font-bold text-stone-900 dark:text-[#F8FAFC]">Protein Target Adherence</div>
                  <div className="text-[11px] text-stone-500 dark:text-[#8492A6]">{result.proteinG}g daily target</div>
                </div>
                <span className="font-extrabold text-[#22C55E] text-sm">
                  {scoreBreakdown.proteinScore} / 25 pts
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] flex justify-between items-center">
                <div>
                  <div className="font-bold text-stone-900 dark:text-[#F8FAFC]">Hydration Fulfillment</div>
                  <div className="text-[11px] text-stone-500 dark:text-[#8492A6]">{waterTargetMl}ml water target</div>
                </div>
                <span className="font-extrabold text-[#60A5FA] text-sm">
                  {scoreBreakdown.hydraScore} / 25 pts
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] flex justify-between items-center">
                <div>
                  <div className="font-bold text-stone-900 dark:text-[#F8FAFC]">Fiber & Daily Challenge</div>
                  <div className="text-[11px] text-stone-500 dark:text-[#8492A6]">Gut health & micro-challenge</div>
                </div>
                <span className="font-extrabold text-[#2DD4BF] text-sm">
                  {scoreBreakdown.habitScore} / 20 pts
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setScoreModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] hover:opacity-95 text-[#07111F] font-bold text-xs cursor-pointer shadow-sm"
            >
              Close Breakdown
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
