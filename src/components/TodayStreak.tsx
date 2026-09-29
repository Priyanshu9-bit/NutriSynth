import { useState, useRef, useEffect } from 'react';
import {
  Flame,
  Trophy,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  Zap,
  Check,
  Target,
  ListTodo,
  BookOpen,
  PartyPopper,
  X,
  Droplet,
  Utensils,
  Plus,
  Clock,
  RotateCcw,
} from 'lucide-react';
import {
  thirtyDayTasks,
  type ChallengeTask,
} from '@/data/challengeData';
import {
  type StreakData,
  type ChallengeData,
  type StreakSettings,
  type DailyFoodWaterLog,
  recordDailyCheckIn,
  toggleChallengeDayCompletion,
  toggleChallengeTodo,
  computeActiveChallengeDay,
  getLocalDateKey,
  updateDailyFoodWaterLog,
  playGrandCelebrationSound,
} from '@/lib/streakService';
import { playWaterDropSound, playChecklistSound, playCongratsSound } from '@/lib/soundEffects';
import { Confetti } from '@/components/Confetti';
import type { View } from '@/components/Layout';
import type { AuthUser } from '@/lib/firebase';
import type { NutritionResult, UserProfile } from '@/lib/calculations';
import { BeginnerGuideBanner } from '@/components/beginner/BeginnerGuideBanner';

interface TodayStreakProps {
  streak: StreakData;
  challenge: ChallengeData;
  onUpdateStreak: (newStreak: StreakData) => void;
  onUpdateChallenge: (newChallenge: ChallengeData) => void;
  onNavigate: (view: View) => void;
  authUser?: AuthUser | null;
  profile?: UserProfile | null;
  result?: NutritionResult | null;
}

export function TodayStreak({
  streak,
  challenge,
  onUpdateStreak,
  onUpdateChallenge,
  onNavigate,
  authUser,
  profile,
  result,
}: TodayStreakProps) {
  const [notification, setNotification] = useState<string | null>(null);

  const todayKey = getLocalDateKey();
  const isCheckedInToday = streak.lastCheckInDate === todayKey;
  const activeDay = computeActiveChallengeDay(challenge);

  // Single-day celebration state
  const [dayCelebration, setDayCelebration] = useState<{
    day: number;
    title: string;
    streak: number;
  } | null>(null);
  const [confettiActive, setConfettiActive] = useState<boolean>(false);

  const currentTask: ChallengeTask =
    thirtyDayTasks.find((t) => t.day === activeDay) || thirtyDayTasks[0];
  const isTodayCompleted = Array.isArray(challenge?.completedDays) && challenge.completedDays.includes(activeDay);
  const tickedIndices = challenge?.tickedTodos?.[activeDay] || [];
  const totalTodos = currentTask?.todos?.length || 3;
  const isAllTodosDone = tickedIndices.length >= totalTodos;

  // Streak Settings & Food/Water Log for today
  const userSettings: StreakSettings = streak.settings || {
    waterTargetMl: 2500,
    foodFocus: 'high_protein',
    mealFrequencyGoal: 3,
  };

  const todayLog: DailyFoodWaterLog = streak.dailyLogs?.[todayKey] || {
    date: todayKey,
    waterMl: 0,
    waterTargetMl: userSettings.waterTargetMl,
    foodAdherenceTags: ['Hit Protein Target', 'Clean Whole Foods'],
    foodNotes: '',
    updatedAt: Date.now(),
  };

  const [waterAmount, setWaterAmount] = useState<number>(todayLog.waterMl);
  const [foodNote, setFoodNote] = useState<string>(todayLog.foodNotes);
  const [activeTags, setActiveTags] = useState<string[]>(todayLog.foodAdherenceTags);

  // Sync state if streak props change
  useEffect(() => {
    if (streak.dailyLogs?.[todayKey]) {
      setWaterAmount(streak.dailyLogs[todayKey].waterMl);
      setFoodNote(streak.dailyLogs[todayKey].foodNotes);
      setActiveTags(streak.dailyLogs[todayKey].foodAdherenceTags);
    }
  }, [streak, todayKey]);

  const handleDailyCheckIn = () => {
    const res = recordDailyCheckIn(streak);
    onUpdateStreak(res.streak);
    playCongratsSound();
    setNotification(res.statusMessage);
    setTimeout(() => setNotification(null), 4000);
  };

  // Toggle single to-do item in the checklist
  const handleToggleTodo = (todoIdx: number) => {
    const isNowTicking = !tickedIndices.includes(todoIdx);
    playChecklistSound(isNowTicking);
    const res = toggleChallengeTodo(challenge, activeDay, todoIdx, totalTodos);
    onUpdateChallenge(res.challenge);

    // If this click completed the day:
    if (res.dayJustCompleted) {
      let currentStreakVal = streak.currentStreak;
      if (!isCheckedInToday) {
        const streakRes = recordDailyCheckIn(streak);
        onUpdateStreak(streakRes.streak);
        currentStreakVal = streakRes.streak.currentStreak;
      }

      setDayCelebration({
        day: activeDay,
        title: currentTask.title,
        streak: currentStreakVal,
      });
      setConfettiActive(true);
      playCongratsSound();
    }
  };

  // Toggle day completion directly
  const handleToggleTodayCompletion = () => {
    const res = toggleChallengeDayCompletion(challenge, activeDay, totalTodos);
    onUpdateChallenge(res.challenge);

    if (res.isNowComplete) {
      let currentStreakVal = streak.currentStreak;
      if (!isCheckedInToday) {
        const streakRes = recordDailyCheckIn(streak);
        onUpdateStreak(streakRes.streak);
        currentStreakVal = streakRes.streak.currentStreak;
      }

      setDayCelebration({
        day: activeDay,
        title: currentTask.title,
        streak: currentStreakVal,
      });
      setConfettiActive(true);
      playCongratsSound();
      setNotification(`🎉 Day ${activeDay} marked as completed!`);
    } else {
      setNotification(`Day ${activeDay} marked as in progress.`);
    }

    setTimeout(() => setNotification(null), 3500);
  };

  // Water quick-add handler
  const handleAddWater = (deltaMl: number) => {
    playWaterDropSound();
    const newAmount = Math.max(0, waterAmount + deltaMl);
    setWaterAmount(newAmount);

    const updatedStreak = updateDailyFoodWaterLog(streak, todayKey, {
      waterMl: newAmount,
      waterTargetMl: userSettings.waterTargetMl,
    });
    onUpdateStreak(updatedStreak);

    if (newAmount >= userSettings.waterTargetMl && waterAmount < userSettings.waterTargetMl) {
      setNotification('💧 Awesome! Daily Water Hydration Target Met!');
      setTimeout(() => setNotification(null), 3500);
    }
  };

  // Reset water handler
  const handleResetWater = () => {
    setWaterAmount(0);
    const updatedStreak = updateDailyFoodWaterLog(streak, todayKey, {
      waterMl: 0,
      waterTargetMl: userSettings.waterTargetMl,
    });
    onUpdateStreak(updatedStreak);
    setNotification('Water intake counter reset for today.');
    setTimeout(() => setNotification(null), 3000);
  };

  // Food tag toggle handler
  const handleToggleFoodTag = (tag: string) => {
    const isAdding = !activeTags.includes(tag);
    playChecklistSound(isAdding);
    const updatedTags = activeTags.includes(tag)
      ? activeTags.filter((t) => t !== tag)
      : [...activeTags, tag];

    setActiveTags(updatedTags);
    const updatedStreak = updateDailyFoodWaterLog(streak, todayKey, {
      foodAdherenceTags: updatedTags,
    });
    onUpdateStreak(updatedStreak);
  };

  // Food note save handler
  const handleSaveFoodNote = () => {
    const updatedStreak = updateDailyFoodWaterLog(streak, todayKey, {
      foodNotes: foodNote,
    });
    onUpdateStreak(updatedStreak);
    setNotification('Daily nutrition note saved!');
    setTimeout(() => setNotification(null), 3000);
  };

  const waterPercent = Math.min(
    100,
    Math.round((waterAmount / userSettings.waterTargetMl) * 100)
  );

  const availableAdherenceTags = [
    'Hit Protein Target',
    'Clean Whole Foods',
    'No Late-night Snacking',
    'Zero Sugar Beverages',
    'Hydrated Well',
    'Ate Colorful Veggies',
    'Mindful Chewing',
    'Post-Meal Walk',
  ];

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-in text-stone-100">
      <Confetti active={confettiActive} onComplete={() => setConfettiActive(false)} />

      {/* Beginner Guide Banner answering the 3 core questions */}
      <BeginnerGuideBanner
        screenTitle="Daily Healthy Habits & Streak"
        whatAmILookingAt="Your bite-sized daily nutrition mission, water tracker, and habit streak. Small daily consistency beats extreme dieting every time."
        whatShouldIDo="Follow the 3 easy steps in today's checklist, log your water glasses, and tap 'Check In Today' to keep your streak alive."
        whatHappensWhenIPress="Ticking checklist items marks them accomplished. Checking in adds +1 day to your streak fire 🔥 and protects your momentum."
        primaryAction={{
          label: isCheckedInToday ? '✓ Checked In for Today' : '🔥 Check In Today (+1 Day)',
          onClick: handleDailyCheckIn,
          caption: 'Adds +1 day to your streak fire',
        }}
      />

      {/* Floating Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-subtle">
          <div className="px-5 py-3 rounded-2xl bg-[#101D2D] text-[#F8FAFC] text-xs sm:text-sm font-semibold shadow-2xl border border-[#22C55E]/50 flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[#34D399]" />
            <span>{notification}</span>
          </div>
        </div>
      )}

      {/* Top Cross-Link Navigation Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-stone-100 dark:bg-gradient-to-r dark:from-[#07111F] dark:via-[#0B0F0E] dark:to-[#101D2D] border border-stone-200 dark:border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm dark:shadow-lg">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400 flex-shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm sm:text-base text-stone-900 dark:text-[#F8FAFC]">
              Looking for the full 30-Day Journey?
            </h3>
            <p className="text-xs text-stone-600 dark:text-[#8492A6]">
              Track your 30-day roadmap, unlock milestones at Day 7, 14, 21, and earn the Master Champion Certificate.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('challenge')}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white dark:bg-[#101D2D] hover:bg-stone-50 dark:hover:bg-[#1E293B] text-stone-800 dark:text-[#F8FAFC] font-semibold text-xs transition-all flex items-center justify-center gap-2 border border-stone-200 dark:border-[#1E293B] cursor-pointer shadow-xs"
        >
          <span>View 30-Day Road-map</span>
          <ArrowRight className="w-4 h-4 text-[#22C55E] dark:text-[#34D399]" />
        </button>
      </div>

      {/* Hero Header: Today's Mission Only */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#07111F] via-[#0B0F0E] to-[#101D2D] border border-[#1E293B] p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-orange-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" /> Day {activeDay} of 30
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-brand-500/15 text-brand-400 border border-brand-500/30">
                {currentTask.category}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Target className="w-3 h-3" /> {currentTask.targetKpi}
              </span>
              {isTodayCompleted && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1 animate-pulse">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Completed Today!
                </span>
              )}
            </div>

            <h1 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight">
              {currentTask.title}
            </h1>
            <p className="text-sm sm:text-base text-stone-300 max-w-2xl leading-relaxed">
              {currentTask.action || currentTask.explanation}
            </p>
          </div>

          {/* Quick Streak & Check-in Pill */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-3 w-full lg:w-auto flex-shrink-0">
            <div className="flex items-center justify-between sm:justify-start gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 dark:bg-[#101D2D] dark:border-[#1E293B]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shadow-inner">
                  <Flame className="w-7 h-7 stroke-[2.5] animate-bounce-subtle" />
                </div>
                <div>
                  <div className="text-2xl font-display font-extrabold text-white">
                    {streak.currentStreak}{' '}
                    <span className="text-xs font-semibold text-orange-400">DAYS</span>
                  </div>
                  <div className="text-[11px] text-stone-300 dark:text-[#8492A6] font-medium">
                    Current Streak Active
                  </div>
                </div>
              </div>
              <div className="text-right border-l border-white/10 dark:border-[#1E293B] pl-4">
                <div className="text-base font-display font-bold text-amber-400">
                  {streak.longestStreak}d
                </div>
                <div className="text-[10px] text-stone-400 uppercase tracking-wider">
                  Best Record
                </div>
              </div>
            </div>

            <button
              onClick={handleDailyCheckIn}
              disabled={isCheckedInToday}
              className={`w-full py-3 px-5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                isCheckedInToday
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 cursor-default'
                  : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-orange-500/25 hover:shadow-orange-500/40 transform hover:-translate-y-0.5'
              }`}
            >
              {isCheckedInToday ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Checked In for Today! 🔥</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-200" />
                  <span>Check In Today (+1 🔥)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Single-Day Mission Breakdown: Actionable Checklist & Scientific Mechanism */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Actionable Checklist (To-Do List with Tick marks) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0B0F0E] border border-stone-200 dark:border-[#1E293B] shadow-sm dark:shadow-lg space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-[#1E293B]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#22C55E]/15 text-[#22C55E] dark:text-[#34D399] flex items-center justify-center border border-[#22C55E]/30">
                  <ListTodo className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-stone-900 dark:text-[#F8FAFC]">
                    Today's Actionable Checklist
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-[#8492A6]">
                    Tick all items as you accomplish them throughout the day
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-[#101D2D] text-xs font-bold text-stone-700 dark:text-[#CBD5E1] border border-stone-200 dark:border-[#1E293B]">
                {tickedIndices.length} / {totalTodos} done
              </span>
            </div>

            <div className="space-y-3">
              {currentTask.todos.map((todoText, idx) => {
                const isTicked = tickedIndices.includes(idx);
                return (
                  <div
                    key={idx}
                    onClick={() => handleToggleTodo(idx)}
                    className={`group p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                      isTicked
                        ? 'bg-emerald-50 dark:bg-emerald-950/25 border-[#22C55E]/50 text-emerald-800 dark:text-emerald-200'
                        : 'bg-stone-50 hover:bg-stone-100/80 dark:bg-[#101D2D] border-stone-200 dark:border-[#1E293B] hover:border-[#22C55E]/50 text-stone-700 dark:text-[#CBD5E1] hover:text-stone-900 dark:hover:text-[#F8FAFC]'
                    }`}
                  >
                    <button
                      type="button"
                      className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                        isTicked
                          ? 'bg-[#22C55E] text-white dark:text-[#07111F] shadow-md shadow-[#22C55E]/40 font-bold'
                          : 'border-2 border-stone-400 dark:border-stone-600 group-hover:border-[#2DD4BF] bg-transparent'
                      }`}
                    >
                      {isTicked && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>
                    <div className="flex-1 text-sm font-medium leading-relaxed">
                      <span className={isTicked ? 'line-through opacity-80' : ''}>
                        {todoText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Complete Day Action Bar */}
            <div className="pt-2">
              <button
                onClick={handleToggleTodayCompletion}
                className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 shadow-lg cursor-pointer ${
                  isTodayCompleted
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                    : 'bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-white dark:text-[#07111F] font-bold shadow-[#22C55E]/25'
                }`}
              >
                {isTodayCompleted ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span>Day {activeDay} Completed! (Click to re-open)</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 stroke-[2.5]" />
                    <span>
                      {isAllTodosDone
                        ? 'Finish & Claim Day ' + activeDay + ' Complete!'
                        : 'Mark Day ' + activeDay + ' as Done (+Claim Streak)'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Deep Metabolic Science Explainer Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0B0F0E] border border-stone-200 dark:border-[#1E293B] shadow-sm dark:shadow-lg space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-stone-200 dark:border-[#1E293B]">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/30">
                <BookOpen className="w-4 h-4" />
              </div>
              <h4 className="font-display font-bold text-sm sm:text-base text-stone-900 dark:text-[#F8FAFC]">
                Metabolic Science: Why Today's Mission Matters
              </h4>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 dark:text-[#CBD5E1] leading-relaxed">
              {currentTask.explanation}
            </p>

            {currentTask.scienceTip && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-700 dark:text-amber-300">Pro-Tip for Today: </span>
                  {currentTask.scienceTip}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Today's Hydration & Food Tracker */}
        <div className="lg:col-span-5 space-y-6">
          {/* Hydration Tracker */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0B0F0E] border border-stone-200 dark:border-[#1E293B] shadow-sm dark:shadow-lg space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#60A5FA]/20 text-blue-600 dark:text-[#60A5FA] flex items-center justify-center border border-[#60A5FA]/30">
                  <Droplet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-stone-900 dark:text-[#F8FAFC]">
                    Today's Hydration Tracker
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-[#8492A6]">
                    Target: {userSettings.waterTargetMl.toLocaleString()} ml
                  </p>
                </div>
              </div>
              <button
                onClick={handleResetWater}
                title="Reset counter"
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:text-[#8492A6] dark:hover:text-[#F8FAFC] hover:bg-stone-100 dark:hover:bg-[#1E293B] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Progress Display */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-display font-extrabold text-blue-600 dark:text-[#60A5FA]">
                  {waterAmount}{' '}
                  <span className="text-xs font-normal text-stone-500 dark:text-[#8492A6]">ml</span>
                </span>
                <span className="text-xs font-semibold text-stone-500 dark:text-[#8492A6]">
                  {waterPercent}% of target
                </span>
              </div>
              <div className="w-full h-3 bg-stone-100 dark:bg-[#101D2D] rounded-full overflow-hidden border border-stone-200 dark:border-[#1E293B]">
                <div
                  className="h-full bg-gradient-to-r from-[#60A5FA] to-[#2DD4BF] rounded-full transition-all duration-500"
                  style={{ width: `${waterPercent}%` }}
                />
              </div>
            </div>

            {/* Quick Add Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleAddWater(250)}
                className="py-2.5 px-3 rounded-xl bg-stone-50 hover:bg-stone-100 dark:bg-[#101D2D] dark:hover:bg-[#1E293B] border border-stone-200 dark:border-[#1E293B] hover:border-[#60A5FA]/50 text-stone-700 dark:text-[#CBD5E1] text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <span className="text-blue-600 dark:text-[#60A5FA] font-extrabold">+250 ml</span>
                <span className="text-[10px] text-stone-500 dark:text-[#8492A6] font-normal">1 Glass</span>
              </button>
              <button
                onClick={() => handleAddWater(500)}
                className="py-2.5 px-3 rounded-xl bg-stone-50 hover:bg-stone-100 dark:bg-[#101D2D] dark:hover:bg-[#1E293B] border border-stone-200 dark:border-[#1E293B] hover:border-[#60A5FA]/50 text-stone-700 dark:text-[#CBD5E1] text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <span className="text-teal-600 dark:text-[#2DD4BF] font-extrabold">+500 ml</span>
                <span className="text-[10px] text-stone-500 dark:text-[#8492A6] font-normal">1 Bottle</span>
              </button>
              <button
                onClick={() => handleAddWater(1000)}
                className="py-2.5 px-3 rounded-xl bg-stone-50 hover:bg-stone-100 dark:bg-[#101D2D] dark:hover:bg-[#1E293B] border border-stone-200 dark:border-[#1E293B] hover:border-[#60A5FA]/50 text-stone-700 dark:text-[#CBD5E1] text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <span className="text-emerald-600 dark:text-[#34D399] font-extrabold">+1000 ml</span>
                <span className="text-[10px] text-stone-500 dark:text-[#8492A6] font-normal">1 Liter Jug</span>
              </button>
            </div>
          </div>

          {/* Today's Food Adherence Tracker */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0B0F0E] border border-stone-200 dark:border-[#1E293B] shadow-sm dark:shadow-lg space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#22C55E]/15 text-[#22C55E] dark:text-[#34D399] flex items-center justify-center border border-[#22C55E]/30">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-stone-900 dark:text-[#F8FAFC]">
                  Today's Food Adherence
                </h3>
                <p className="text-xs text-stone-500 dark:text-[#8492A6]">
                  Tap to record what healthy habits you adhered to today
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {availableAdherenceTags.map((tag) => {
                const isSelected = activeTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => handleToggleFoodTag(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-[#22C55E]/20 text-emerald-700 dark:text-[#34D399] border-[#22C55E]/50 shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200 dark:bg-[#101D2D] text-stone-700 dark:text-[#8492A6] border-stone-200 dark:border-[#1E293B] hover:text-stone-900 dark:hover:text-[#F8FAFC]'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {tag}
                  </button>
                );
              })}
            </div>

            {/* Food Reflection / Notes */}
            <div className="pt-2 space-y-2">
              <label className="text-xs font-semibold text-stone-700 dark:text-[#CBD5E1] block">
                Daily Food & Energy Reflection:
              </label>
              <textarea
                value={foodNote}
                onChange={(e) => setFoodNote(e.target.value)}
                placeholder="Log how your body felt today, digestion, energy levels..."
                rows={3}
                className="w-full p-3 rounded-xl bg-stone-50 dark:bg-[#101D2D] border border-stone-200 dark:border-[#1E293B] text-xs sm:text-sm text-stone-900 dark:text-[#F8FAFC] placeholder-stone-400 dark:placeholder-[#8492A6] focus:outline-none focus:border-[#22C55E] transition-colors resize-none"
              />
              <button
                onClick={handleSaveFoodNote}
                className="w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-[#101D2D] dark:hover:bg-[#1E293B] border border-stone-200 dark:border-[#1E293B] text-stone-700 dark:text-[#CBD5E1] font-semibold text-xs transition-all cursor-pointer"
              >
                Save Nutrition Reflection
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Single-Day Completion Celebration Modal */}
      {dayCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#0B0F0E] to-[#07111F] border-2 border-[#22C55E]/70 p-6 sm:p-8 shadow-[0_0_50px_rgba(34,197,94,0.25)] text-center space-y-6">
            <button
              onClick={() => setDayCelebration(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-[#8492A6] hover:text-[#F8FAFC] bg-[#101D2D] hover:bg-[#1E293B] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-[#22C55E] via-[#2DD4BF] to-amber-400 flex items-center justify-center text-[#07111F] shadow-xl shadow-[#22C55E]/30 animate-bounce">
              <PartyPopper className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#22C55E]/20 text-[#34D399] border border-[#22C55E]/40">
                Day {dayCelebration.day} Complete!
              </span>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-[#F8FAFC]">
                Outstanding Commitment!
              </h3>
              <p className="text-sm text-[#CBD5E1] leading-relaxed">
                You successfully mastered today's habit:{' '}
                <span className="font-bold text-[#34D399]">
                  "{dayCelebration.title}"
                </span>
                . Your streak is now roaring at{' '}
                <span className="text-orange-400 font-extrabold">
                  {dayCelebration.streak} Days 🔥
                </span>
                !
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#101D2D] border border-[#1E293B] flex items-center justify-around">
              <div>
                <div className="text-xs text-[#8492A6]">Current Streak</div>
                <div className="text-2xl font-display font-extrabold text-orange-400">
                  {dayCelebration.streak} 🔥
                </div>
              </div>
              <div className="w-px h-8 bg-[#1E293B]" />
              <div>
                <div className="text-xs text-[#8492A6]">Day Completed</div>
                <div className="text-2xl font-display font-extrabold text-[#34D399]">
                  #{dayCelebration.day}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setDayCelebration(null)}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] font-bold text-sm shadow-lg shadow-[#22C55E]/30 transition-all cursor-pointer"
              >
                Keep the Momentum!
              </button>
              <button
                onClick={() => {
                  setDayCelebration(null);
                  onNavigate('challenge');
                }}
                className="py-3 px-4 rounded-xl bg-[#101D2D] hover:bg-[#1E293B] text-[#CBD5E1] font-semibold text-xs transition-all border border-[#1E293B] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>30-Day Road-map</span>
                <ArrowRight className="w-4 h-4 text-[#34D399]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
