import { useState, useRef, useEffect } from 'react';
import {
  Flame,
  Trophy,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  Award,
  Zap,
  Check,
  Target,
  ListTodo,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  X,
  Share2,
  Droplet,
  Utensils,
  Settings,
  Plus,
  Printer,
  Copy,
  Sliders,
  CheckCheck,
  ShieldCheck,
} from 'lucide-react';
import {
  thirtyDayTasks,
  challengeMilestones,
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
  updateStreakSettings,
  playGrandCelebrationSound,
} from '@/lib/streakService';
import { playWaterDropSound, playChecklistSound, playCongratsSound } from '@/lib/soundEffects';
import { Confetti } from '@/components/Confetti';
import type { View } from '@/components/Layout';
import type { AuthUser } from '@/lib/firebase';
import { BeginnerGuideBanner } from '@/components/beginner/BeginnerGuideBanner';

interface ChallengeProps {
  streak: StreakData;
  challenge: ChallengeData;
  onUpdateStreak: (newStreak: StreakData) => void;
  onUpdateChallenge: (newChallenge: ChallengeData) => void;
  onNavigate: (view: View) => void;
  authUser?: AuthUser | null;
}

export function Challenge({
  streak,
  challenge,
  onUpdateStreak,
  onUpdateChallenge,
  onNavigate,
  authUser,
}: ChallengeProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [notification, setNotification] = useState<string | null>(null);

  const todayKey = getLocalDateKey();
  const isCheckedInToday = streak.lastCheckInDate === todayKey;
  const activeDay = computeActiveChallengeDay(challenge);
  const [selectedDay, setSelectedDay] = useState<number>(activeDay);

  // Settings & Customization Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Celebrations & Animation States
  const [dayCelebration, setDayCelebration] = useState<{
    day: number;
    title: string;
    streak: number;
  } | null>(null);
  const [grandCelebration, setGrandCelebration] = useState<boolean>(false);
  const [confettiActive, setConfettiActive] = useState<boolean>(false);

  const explainerRef = useRef<HTMLDivElement>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

  const completedCount = Array.isArray(challenge?.completedDays) ? challenge.completedDays.length : 0;
  const progressPercent = Math.min(Math.round((completedCount / 30) * 100), 100);

  const currentTask = thirtyDayTasks.find((t) => t.day === selectedDay) || thirtyDayTasks[0];
  const isSelectedDayCompleted = Array.isArray(challenge?.completedDays) && challenge.completedDays.includes(selectedDay);
  const tickedIndices = challenge?.tickedTodos?.[selectedDay] || [];
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

  // Temp settings state for modal
  const [tempWaterTarget, setTempWaterTarget] = useState<number>(userSettings.waterTargetMl);
  const [tempFoodFocus, setTempFoodFocus] = useState<StreakSettings['foodFocus']>(userSettings.foodFocus);
  const [tempMealFrequency, setTempMealFrequency] = useState<number>(userSettings.mealFrequencyGoal);

  // Sync state if streak props change
  useEffect(() => {
    if (streak.dailyLogs?.[todayKey]) {
      setWaterAmount(streak.dailyLogs[todayKey].waterMl);
      setFoodNote(streak.dailyLogs[todayKey].foodNotes);
      setActiveTags(streak.dailyLogs[todayKey].foodAdherenceTags);
    }
  }, [streak, todayKey]);

  // Sync selected day when active challenge day changes (e.g. after completing a day)
  useEffect(() => {
    setSelectedDay(activeDay);
  }, [activeDay]);

  // Trigger grand celebration if user reached 30 completed days
  const checkGrandCompletion = (completedDays: number[]) => {
    if (completedDays.length === 30) {
      setGrandCelebration(true);
      setConfettiActive(true);
      playGrandCelebrationSound();
      return true;
    }
    return false;
  };

  const handleOpenGrandCelebration = () => {
    setGrandCelebration(true);
    setConfettiActive(true);
    playGrandCelebrationSound();
  };

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
    const result = toggleChallengeTodo(challenge, selectedDay, todoIdx, totalTodos);
    onUpdateChallenge(result.challenge);

    // If this click completed the day:
    if (result.dayJustCompleted) {
      let currentStreakVal = streak.currentStreak;
      if (!isCheckedInToday) {
        const streakRes = recordDailyCheckIn(streak);
        onUpdateStreak(streakRes.streak);
        currentStreakVal = streakRes.streak.currentStreak;
      }

      // Check if 30-day champion unlocked!
      const isGrand = checkGrandCompletion(result.challenge.completedDays);
      if (!isGrand) {
        setDayCelebration({
          day: selectedDay,
          title: currentTask.title,
          streak: currentStreakVal,
        });
        setConfettiActive(true);
        playCongratsSound();
      }
    }
  };

  // Toggle entire day completion
  const handleToggleDay = (dayNumber: number) => {
    const targetTask = thirtyDayTasks.find((t) => t.day === dayNumber);
    const totalDayTodos = targetTask?.todos.length || 3;

    const res = toggleChallengeDayCompletion(challenge, dayNumber, totalDayTodos);
    onUpdateChallenge(res.challenge);

    // If day was just completed
    if (res.isNowComplete) {
      let currentStreakVal = streak.currentStreak;
      if (!isCheckedInToday) {
        const streakRes = recordDailyCheckIn(streak);
        onUpdateStreak(streakRes.streak);
        currentStreakVal = streakRes.streak.currentStreak;
      }

      const isGrand = checkGrandCompletion(res.challenge.completedDays);
      if (!isGrand) {
        setDayCelebration({
          day: dayNumber,
          title: targetTask?.title || `Day ${dayNumber}`,
          streak: currentStreakVal,
        });
        setConfettiActive(true);
        playCongratsSound();
      }
      setNotification(`🎉 Day ${dayNumber} marked as completed!`);
    } else {
      setNotification(`Day ${dayNumber} marked as pending.`);
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
      setNotification('💧 Awesome! Daily Water Hydration Goal Met!');
      setTimeout(() => setNotification(null), 3500);
    }
  };

  // Food tag toggle handler
  const handleToggleFoodTag = (tag: string) => {
    const updatedTags = activeTags.includes(tag)
      ? activeTags.filter((t) => t !== tag)
      : [...activeTags, tag];

    setActiveTags(updatedTags);
    const updatedStreak = updateDailyFoodWaterLog(streak, todayKey, {
      foodAdherenceTags: updatedTags,
    });
    onUpdateStreak(updatedStreak);
  };

  // Food notes save handler
  const handleSaveFoodNotes = () => {
    const updatedStreak = updateDailyFoodWaterLog(streak, todayKey, {
      foodNotes: foodNote,
    });
    onUpdateStreak(updatedStreak);
    setNotification('✓ Food notes saved to today’s streak!');
    setTimeout(() => setNotification(null), 3000);
  };

  // Save streak customization settings
  const handleSaveSettings = () => {
    const newSettings: StreakSettings = {
      waterTargetMl: tempWaterTarget,
      foodFocus: tempFoodFocus,
      mealFrequencyGoal: tempMealFrequency,
    };
    const updatedStreak = updateStreakSettings(streak, newSettings);
    onUpdateStreak(updatedStreak);
    setIsSettingsOpen(false);
    setNotification('⚙️ 30-Day Streak Options & Targets Updated!');
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSelectDayCard = (day: number) => {
    setSelectedDay(day);
    if (explainerRef.current) {
      explainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrevDay = () => {
    setSelectedDay((prev) => (prev > 1 ? prev - 1 : 30));
  };

  const handleNextDay = () => {
    setSelectedDay((prev) => (prev < 30 ? prev + 1 : 1));
  };

  const handleShareCertificate = () => {
    const shareText = `🏆 I conquered the NutriSynth 30-Day Nutrition Challenge! Maintained a ${streak.currentStreak}-day streak and mastered 30 evidence-based habits. #NutriSynth #HealthStreak`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setNotification('📋 Achievement copied to clipboard! Ready to share.');
      setTimeout(() => setNotification(null), 3500);
    }
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  const categories = [
    { id: 'all', label: 'All 30 Days' },
    { id: 'hydration', label: 'Hydration' },
    { id: 'protein', label: 'Protein' },
    { id: 'plants', label: 'Plants & Gut' },
    { id: 'energy', label: 'Energy & Sugar' },
    { id: 'mindset', label: 'Mindset & Habits' },
  ];

  const filteredTasks = selectedCategory === 'all'
    ? thirtyDayTasks
    : thirtyDayTasks.filter(
        (t) =>
          t.category === selectedCategory ||
          (selectedCategory === 'plants' && (t.category as any) === 'micronutrients')
      );

  const waterPercent = Math.min(Math.round((waterAmount / userSettings.waterTargetMl) * 100), 100);
  const isWaterGoalMet = waterAmount >= userSettings.waterTargetMl;

  const recipientName =
    authUser?.displayName || authUser?.email?.split('@')[0] || 'NutriSynth Athlete';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in relative">
      {/* Confetti Animation Layer */}
      <Confetti active={confettiActive} duration={6000} onComplete={() => setConfettiActive(false)} />

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-subtle">
          <div className="px-4 py-3 rounded-2xl bg-stone-900/95 dark:bg-stone-100 text-white dark:text-stone-900 text-xs sm:text-sm font-semibold shadow-2xl border border-stone-700 dark:border-stone-300 flex items-center gap-2">
            <span>✨</span>
            <span>{notification}</span>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STREAK OPTIONS & TARGETS MODAL                                */}
      {/* ------------------------------------------------------------- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="card-lg max-w-lg w-full p-6 sm:p-8 relative overflow-hidden animate-pop-bounce border-2 border-[#22C55E]/50 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60 dark:border-[#1E293B]">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#22C55E] dark:text-[#34D399]" />
                <h3 className="font-display font-bold text-lg text-stone-900 dark:text-[#F8FAFC]">
                  Customize 30-Day Streak Options
                </h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-[#F8FAFC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Water Target Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 dark:text-[#CBD5E1] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-[#60A5FA]" /> Daily Hydration Target:
                </span>
                <span className="text-[#60A5FA] font-extrabold">{tempWaterTarget} ml ({(tempWaterTarget / 1000).toFixed(1)}L)</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[2000, 2500, 3000, 3500].map((ml) => (
                  <button
                    key={ml}
                    type="button"
                    onClick={() => setTempWaterTarget(ml)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                      tempWaterTarget === ml
                        ? 'bg-[#60A5FA] text-[#07111F] font-bold shadow-md'
                        : 'bg-stone-100 dark:bg-[#101D2D] text-stone-600 dark:text-[#CBD5E1] hover:bg-stone-200 dark:hover:bg-[#1E293B]'
                    }`}
                  >
                    {ml / 1000}L
                  </button>
                ))}
              </div>
            </div>

            {/* Food Focus Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 dark:text-[#CBD5E1] flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-[#22C55E]" /> Primary Nutrition / Food Focus:
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'high_protein', label: '💪 High Protein Focus (>1.6g/kg)' },
                  { id: 'clean_eating', label: '🥗 Clean Whole Foods & Rainbow Veggies' },
                  { id: 'zero_sugar', label: '🚫 Zero Added Sugar & No Liquid Calories' },
                  { id: 'gut_health', label: '🦠 Gut Health, Fiber & Probiotics' },
                  { id: 'weight_loss', label: '⚖️ Calorie Deficit for Fat Loss' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTempFoodFocus(item.id as any)}
                    className={`w-full text-left p-3 rounded-xl text-xs font-semibold transition-all border ${
                      tempFoodFocus === item.id
                        ? 'bg-[#22C55E]/15 border-[#22C55E] text-[#34D399] ring-2 ring-[#22C55E]/20'
                        : 'bg-stone-50 dark:bg-[#101D2D] border-stone-200 dark:border-[#1E293B] text-stone-700 dark:text-[#CBD5E1]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Meal Frequency Goal */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 dark:text-[#CBD5E1]">
                Daily Meals Structure Target:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { num: 2, label: '2 Meals + Snack' },
                  { num: 3, label: '3 Standard Meals' },
                  { num: 4, label: '4 Paced Meals' },
                ].map((m) => (
                  <button
                    key={m.num}
                    type="button"
                    onClick={() => setTempMealFrequency(m.num)}
                    className={`p-2.5 rounded-xl text-xs font-bold text-center transition-all ${
                      tempMealFrequency === m.num
                        ? 'bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] font-bold shadow-md'
                        : 'bg-stone-100 dark:bg-[#101D2D] text-stone-600 dark:text-[#CBD5E1]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="flex-1 btn-secondary py-3 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="flex-1 btn-primary py-3 text-xs font-bold"
              >
                Save Streak Options
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ANIMATION 1: One-Day Complete Celebration Modal               */}
      {/* ------------------------------------------------------------- */}
      {dayCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="card-lg max-w-md w-full p-6 sm:p-8 text-center relative overflow-hidden animate-pop-bounce border-2 border-emerald-500/50 shadow-2xl">
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

            <button
              onClick={() => setDayCelebration(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-[#F8FAFC] hover:bg-stone-100 dark:hover:bg-[#1E293B] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 animate-pulse-halo">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-300 dark:border-emerald-700/60">
              <PartyPopper className="w-3.5 h-3.5" />
              <span>Day {dayCelebration.day} Complete!</span>
            </div>

            <h3 className="font-display font-black text-2xl text-stone-900 dark:text-[#f4f5f7] mb-2">
              Mission Accomplished!
            </h3>

            <p className="text-sm font-medium text-stone-600 dark:text-[#a0a5b2] mb-6">
              You crushed today’s habit:{' '}
              <strong className="text-stone-900 dark:text-white">"{dayCelebration.title}"</strong>.
            </p>

            <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-[#101D2D] border border-amber-500/30 dark:border-[#1E293B] flex items-center justify-around mb-6">
              <div className="text-center">
                <span className="text-[11px] font-semibold text-stone-500 dark:text-[#828795] uppercase">
                  Daily Streak
                </span>
                <div className="text-2xl font-black text-amber-500 flex items-center justify-center gap-1">
                  <Flame className="w-5 h-5 fill-amber-500" />
                  <span>{dayCelebration.streak} Days</span>
                </div>
              </div>
              <div className="h-8 w-px bg-amber-500/20" />
              <div className="text-center">
                <span className="text-[11px] font-semibold text-stone-500 dark:text-[#828795] uppercase">
                  Roadmap Progress
                </span>
                <div className="text-2xl font-black text-stone-900 dark:text-[#f4f5f7]">
                  {completedCount} / 30
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setDayCelebration(null);
                if (selectedDay < 30) {
                  setSelectedDay(selectedDay + 1);
                }
              }}
              className="w-full btn-primary py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              <span>Awesome! Keep It Going</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* GRAND 30-DAY MASTER CHAMPION CELEBRATION MODAL & CERTIFICATE   */}
      {/* ------------------------------------------------------------- */}
      {grandCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl animate-fade-in overflow-y-auto">
          <div className="card-lg max-w-2xl w-full p-6 sm:p-10 text-center relative overflow-hidden animate-pop-bounce border-2 border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.35)] my-8">
            {/* Golden Starburst & Emerald Aura */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/25 rounded-full blur-3xl pointer-events-none" />

            <button
              onClick={() => setGrandCelebration(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-[#F8FAFC] hover:bg-stone-100 dark:hover:bg-[#1E293B] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing Golden Trophy */}
            <div className="relative inline-block mb-3">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-600 flex items-center justify-center text-white shadow-2xl shadow-amber-500/40 animate-float-gentle">
                <Trophy className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
              </div>
              <div className="absolute -top-3 -right-3 text-3xl animate-bounce">
                👑
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-500 dark:text-amber-300 text-xs font-black uppercase tracking-wider mb-2 border border-amber-400/50">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>NutriSynth 30-Day Nutrition Champion</span>
            </div>

            <h2 className="font-display font-black text-3xl sm:text-4xl text-stone-900 dark:text-[#f4f5f7] tracking-tight mb-2">
              GRAND CELEBRATION! 🏆
            </h2>

            <p className="text-sm sm:text-base font-semibold text-emerald-600 dark:text-emerald-400 mb-6">
              You completed all 30 days of the challenge! Your lifelong habit transformation is official.
            </p>

            {/* -------------------------------------------------------- */}
            {/* OFFICIAL CERTIFICATE CARD                                */}
            {/* -------------------------------------------------------- */}
            <div
              ref={certificateRef}
              className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1c1d22] border-4 border-amber-400/80 shadow-2xl relative overflow-hidden mb-6 text-left"
            >
              {/* Certificate Watermark Laurel */}
              <div className="absolute right-4 bottom-4 text-7xl opacity-10 pointer-events-none select-none">
                🏅
              </div>

              <div className="flex items-center justify-between border-b-2 border-amber-400/40 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <img
                    src="/logo.jpg"
                    alt="NutriSynth"
                    className="w-9 h-9 rounded-xl object-cover ring-1 ring-amber-400 shadow-sm"
                  />
                  <div>
                    <span className="font-display font-extrabold text-xs uppercase tracking-widest text-stone-900 dark:text-white">
                      NutriSynth Health Lab
                    </span>
                    <div className="text-[10px] text-stone-500">Official Habit Verification</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold block">
                    ID: NS-30D-{todayKey.replace(/-/g, '')}
                  </span>
                  <span className="text-[10px] text-stone-400">Date: {todayKey}</span>
                </div>
              </div>

              <div className="text-center my-4">
                <div className="text-xs uppercase font-extrabold text-stone-400 tracking-wider mb-1">
                  Certificate of Dietary Mastery
                </div>
                <h3 className="font-display font-black text-2xl sm:text-3xl text-stone-900 dark:text-white tracking-tight mb-2">
                  {recipientName}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-[#a0a5b2] max-w-md mx-auto leading-relaxed">
                  Has successfully conquered the complete 30-Day Nutrition & Healthy Habits Challenge,
                  demonstrating daily discipline across hydration, protein pacing, micronutrient density, and mindful living.
                </p>
              </div>

              {/* 4 Milestone Badges Showcase */}
              <div className="grid grid-cols-4 gap-2 pt-4 border-t border-stone-200/80 dark:border-[#1E293B] text-center">
                {challengeMilestones.map((m) => (
                  <div key={m.id} className="p-2 rounded-xl bg-stone-50 dark:bg-[#101D2D] border border-amber-400/30">
                    <div className="text-xl sm:text-2xl mb-0.5">{m.icon}</div>
                    <div className="text-[10px] font-bold text-stone-800 dark:text-white truncate">
                      {m.title}
                    </div>
                    <div className="text-[9px] text-[#22C55E] dark:text-[#34D399] font-extrabold">
                      UNLOCKED
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-amber-400/30 text-[11px] text-stone-500">
                <span className="flex items-center gap-1 font-semibold text-stone-700 dark:text-stone-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 100% Verified Discipline
                </span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  🔥 {streak.currentStreak || 30}-Day Continuous Streak
                </span>
              </div>
            </div>

            {/* Certificate Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handlePrintCertificate}
                className="btn-secondary py-3 px-5 text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4 text-stone-600 dark:text-stone-300" />
                <span>Print / Save PDF Certificate</span>
              </button>

              <button
                type="button"
                onClick={handleShareCertificate}
                className="btn-secondary py-3 px-5 text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Share2 className="w-4 h-4 text-stone-600 dark:text-stone-300" />
                <span>Share Achievement</span>
              </button>

              <button
                type="button"
                onClick={() => setGrandCelebration(false)}
                className="btn-primary py-3 px-6 text-xs font-bold flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25"
              >
                <Flame className="w-4 h-4 fill-white" />
                <span>Keep Streak Burning 🔥</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SWITCHER BANNER: JUMP TO TODAY'S SINGLE-DAY MISSION          */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-500/15 via-[#0B0F0E] to-amber-500/15 border border-orange-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 shadow-md">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 flex-shrink-0">
            <Flame className="w-5 h-5 fill-orange-400" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm sm:text-base text-white">
              Want to focus on Today's Single-Day Mission?
            </h3>
            <p className="text-xs text-stone-400">
              Complete Day {activeDay} of 30: checklist with tick marks, hydration & food adherence log, and streak check-in.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('today-streak')}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer flex-shrink-0"
        >
          <span>Focus on Today's Streak (Day {activeDay})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Beginner Guide Banner answering the 3 core questions */}
      <BeginnerGuideBanner
        screenTitle="30-Day Healthy Habit Road-map"
        whatAmILookingAt="A full 30-day journey broken into small, easy daily steps. One habit at a time so you never feel overwhelmed."
        whatShouldIDo="Follow along day-by-day. Check off today's missions, preview future days, and unlock milestones at Day 7, 14, 21, and 30!"
        whatHappensWhenIPress="Ticking off each day fills your 30-day progress bar. When you finish all 30 days, you unlock the Master Champion Certificate of Dietary Mastery."
        primaryAction={{
          label: `Focus on Today (Day ${activeDay})`,
          onClick: () => onNavigate('today-streak'),
          caption: `Jump directly to Day ${activeDay}'s actionable checklist`,
        }}
      />

      {/* ------------------------------------------------------------- */}
      {/* HEADER BANNER                                                 */}
      {/* ------------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#07111F] via-[#0B0F0E] to-[#101D2D] border border-[#1E293B] p-6 sm:p-10 mb-8 shadow-sm">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-br from-amber-400/20 to-brand-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-300/40 dark:border-amber-700/40">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>30-Day Streak & Habit System</span>
              </div>

              {/* Grand Celebration Preview Button */}
              <button
                type="button"
                onClick={handleOpenGrandCelebration}
                title="Preview the 30-Day Champion Grand Celebration and Certificate"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-600 dark:text-amber-300 text-xs font-bold border border-amber-400/40 hover:bg-amber-500/30 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>🏆 Grand 30-Day Celebration</span>
              </button>
            </div>

            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-stone-900 dark:text-[#f4f5f7] tracking-tight">
              30-Day Nutrition Challenge
            </h1>
            <p className="mt-2 text-stone-600 dark:text-[#a0a5b2] text-sm sm:text-base max-w-2xl leading-relaxed">
              Track daily hydration and meals, tick off evidence-based daily missions, and build permanent dietary habits.
            </p>
          </div>

          {/* Quick Actions (Check in + Streak Options) */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="btn-secondary text-sm px-4 py-3.5 flex items-center justify-center gap-2 shadow-sm"
              title="Customize your daily water target and nutrition focus"
            >
              <Settings className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Streak Options</span>
            </button>

            <button
              onClick={handleDailyCheckIn}
              className={`px-5 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2.5 shadow-md active:scale-95 ${
                isCheckedInToday
                  ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 cursor-default'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/20 hover:shadow-lg'
              }`}
            >
              {isCheckedInToday ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Checked In Today! 🔥</span>
                </>
              ) : (
                <>
                  <Flame className="w-5 h-5 fill-white text-white animate-pulse" />
                  <span>Check In (+1 Streak)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DAILY FOOD & WATER STREAK DETAILS CONTAINER                   */}
      {/* ------------------------------------------------------------- */}
      <div className="card-lg p-6 sm:p-8 mb-8 border border-stone-200/80 dark:border-[#1E293B] bg-gradient-to-br from-white to-stone-50/50 dark:from-[#0B0F0E] dark:to-[#101D2D]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200/60 dark:border-[#1E293B]">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-[#60A5FA]">
                <Droplet className="w-4 h-4" />
              </span>
              <h3 className="font-display font-bold text-lg sm:text-xl text-stone-900 dark:text-[#F8FAFC]">
                Today’s Food & Water Streak Details
              </h3>
            </div>
            <p className="text-xs text-stone-500 dark:text-[#8492A6] mt-0.5">
              Set and log your daily water intake and food adherence as part of your 30-day streak.
            </p>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="text-xs font-semibold text-[#22C55E] dark:text-[#34D399] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Customize Targets (Current: {(userSettings.waterTargetMl / 1000).toFixed(1)}L)</span>
          </button>
        </div>

        <div className="grid md:grid-cols-12 gap-6 pt-5">
          {/* Left Column: Water Tracker (6 cols) */}
          <div className="md:col-span-6 p-5 rounded-2xl bg-sky-50/40 dark:bg-[#101D2D] border border-sky-200/60 dark:border-[#1E293B] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplet className="w-5 h-5 text-[#60A5FA] fill-[#60A5FA]" />
                <span className="font-display font-bold text-sm text-stone-900 dark:text-[#F8FAFC]">
                  Hydration Tracker
                </span>
              </div>
              {isWaterGoalMet ? (
                <span className="badge badge-success text-[11px] font-bold py-0.5 px-2.5 animate-pulse">
                  💧 Goal Met!
                </span>
              ) : (
                <span className="text-xs font-semibold text-[#60A5FA]">
                  {Math.max(0, userSettings.waterTargetMl - waterAmount)} ml left
                </span>
              )}
            </div>

            {/* Current Water Intake Gauge */}
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-display font-black text-[#60A5FA] tabular-nums">
                {waterAmount.toLocaleString()}{' '}
                <span className="text-sm font-semibold text-stone-500 dark:text-[#8492A6]">
                  / {userSettings.waterTargetMl.toLocaleString()} ml
                </span>
              </div>
              <span className="text-sm font-bold text-stone-600 dark:text-[#CBD5E1]">
                {waterPercent}%
              </span>
            </div>

            {/* Water Progress Bar */}
            <div className="w-full bg-stone-200 dark:bg-[#1E293B] h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#60A5FA] to-[#2DD4BF] h-full rounded-full transition-all duration-300"
                style={{ width: `${waterPercent}%` }}
              />
            </div>

            {/* Quick Add Water Buttons */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleAddWater(250)}
                className="py-2 px-1 rounded-xl text-xs font-bold bg-white dark:bg-[#101D2D] border border-sky-300 dark:border-[#1E293B] text-sky-700 dark:text-[#60A5FA] hover:bg-sky-50 dark:hover:bg-[#1E293B] shadow-sm active:scale-95 transition-all"
              >
                +250ml
              </button>
              <button
                type="button"
                onClick={() => handleAddWater(500)}
                className="py-2 px-1 rounded-xl text-xs font-bold bg-white dark:bg-[#101D2D] border border-sky-300 dark:border-[#1E293B] text-sky-700 dark:text-[#60A5FA] hover:bg-sky-50 dark:hover:bg-[#1E293B] shadow-sm active:scale-95 transition-all"
              >
                +500ml
              </button>
              <button
                type="button"
                onClick={() => handleAddWater(1000)}
                className="py-2 px-1 rounded-xl text-xs font-bold bg-white dark:bg-[#101D2D] border border-sky-300 dark:border-[#1E293B] text-sky-700 dark:text-[#60A5FA] hover:bg-sky-50 dark:hover:bg-[#1E293B] shadow-sm active:scale-95 transition-all"
              >
                +1.0L
              </button>
              <button
                type="button"
                onClick={() => handleAddWater(-waterAmount)}
                className="py-2 px-1 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-[#101D2D] text-stone-500 hover:text-stone-800 dark:hover:text-[#F8FAFC] transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Right Column: Food Quality & Notes Log (6 cols) */}
          <div className="md:col-span-6 p-5 rounded-2xl bg-emerald-50/30 dark:bg-[#0B0F0E] border border-emerald-200/60 dark:border-[#1E293B] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-[#22C55E] dark:text-[#34D399]" />
                <span className="font-display font-bold text-sm text-stone-900 dark:text-[#F8FAFC]">
                  Today's Food Adherence
                </span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-[#22C55E]/20 text-emerald-800 dark:text-[#34D399] uppercase">
                {userSettings.foodFocus.replace('_', ' ')}
              </span>
            </div>

            {/* Quick Food Adherence Check Pills */}
            <div className="flex flex-wrap gap-1.5">
              {[
                'Hit Protein Target',
                'Clean Whole Foods',
                '3+ Color Veggies',
                'Zero Added Sugar',
                'Whole Grains Only',
              ].map((tag) => {
                const isSelected = activeTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleFoodTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] font-bold shadow-sm'
                        : 'bg-white dark:bg-[#101D2D] border border-stone-200 dark:border-[#1E293B] text-stone-600 dark:text-[#CBD5E1] hover:border-[#22C55E]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>

            {/* Food Note Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-stone-500 dark:text-[#8492A6]">
                What healthy meals/foods did you make or eat today?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={foodNote}
                  onChange={(e) => setFoodNote(e.target.value)}
                  placeholder="e.g. Oatmeal with chia seeds & grilled paneer salad"
                  className="flex-1 text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#101D2D] border border-stone-200 dark:border-[#1E293B] text-stone-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#22C55E]"
                />
                <button
                  type="button"
                  onClick={handleSaveFoodNotes}
                  className="btn-secondary px-3 py-2 text-xs font-bold shrink-0"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Streak Stat */}
        <div className="card p-5 relative overflow-hidden group hover:border-amber-300 dark:hover:border-amber-700/60 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-500 dark:text-[#a0a5b2] uppercase tracking-wider">
              Current Streak
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div className="text-3xl font-display font-extrabold text-stone-900 dark:text-[#f4f5f7] tabular-nums">
            {streak.currentStreak}{' '}
            <span className="text-sm font-semibold text-stone-500 dark:text-[#828795]">
              day{streak.currentStreak === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-[#828795] mt-1">
            {isCheckedInToday ? '✓ Streak maintained today' : '⚠️ Check in today to maintain!'}
          </p>
        </div>

        {/* Longest Streak Stat */}
        <div className="card p-5 relative overflow-hidden group hover:border-brand-300 dark:hover:border-brand-700/60 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-500 dark:text-[#a0a5b2] uppercase tracking-wider">
              Best Streak
            </span>
            <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-display font-extrabold text-stone-900 dark:text-[#f4f5f7] tabular-nums">
            {streak.longestStreak || streak.currentStreak}{' '}
            <span className="text-sm font-semibold text-stone-500 dark:text-[#828795]">days</span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-[#828795] mt-1">All-time record</p>
        </div>

        {/* 30-Day Completion Stat */}
        <div className="card p-5 relative overflow-hidden group hover:border-emerald-300 dark:hover:border-emerald-700/60 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-500 dark:text-[#a0a5b2] uppercase tracking-wider">
              30-Day Progress
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-display font-extrabold text-stone-900 dark:text-[#f4f5f7] tabular-nums">
            {completedCount}{' '}
            <span className="text-sm font-semibold text-stone-500 dark:text-[#828795]">/ 30</span>
          </div>
          {/* Progress Mini Bar */}
          <div className="w-full bg-stone-200 dark:bg-[#1E293B] h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Total Check-Ins */}
        <div className="card p-5 relative overflow-hidden group hover:border-sky-300 dark:hover:border-sky-700/60 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-500 dark:text-[#a0a5b2] uppercase tracking-wider">
              Total Check-Ins
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-display font-extrabold text-stone-900 dark:text-[#f4f5f7] tabular-nums">
            {streak.totalCheckIns || 1}
          </div>
          <p className="text-[11px] text-stone-500 dark:text-[#828795] mt-1">Days committed</p>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* DEDICATED CONTAINER: Day Explainer & Interactive To-Do Checklist */}
      {/* ----------------------------------------------------------------- */}
      <div
        ref={explainerRef}
        className="card-lg p-6 sm:p-8 mb-8 border-2 border-brand-500/40 dark:border-brand-500/30 relative overflow-hidden shadow-xl"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Container Day Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-stone-200/60 dark:border-[#1E293B]">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevDay}
              title="Previous Day"
              className="p-2 rounded-xl bg-stone-100 dark:bg-[#101D2D] hover:bg-stone-200 dark:hover:bg-[#1E293B] text-stone-700 dark:text-[#CBD5E1] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold bg-[#22C55E]/15 text-[#34D399] border border-[#22C55E]/30 shadow-sm">
                Day {currentTask.day} of 30
              </span>
              {currentTask.day === activeDay && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  Today's Mission 🔥
                </span>
              )}
            </div>

            <button
              onClick={handleNextDay}
              title="Next Day"
              className="p-2 rounded-xl bg-stone-100 dark:bg-[#101D2D] hover:bg-stone-200 dark:hover:bg-[#1E293B] text-stone-700 dark:text-[#CBD5E1] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {selectedDay !== activeDay && (
              <button
                onClick={() => setSelectedDay(activeDay)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-[#101D2D] text-stone-700 dark:text-[#CBD5E1] hover:border-[#22C55E] border border-transparent transition-all"
              >
                Jump to Day {activeDay}
              </button>
            )}

            {isSelectedDayCompleted ? (
              <span className="badge badge-success text-xs font-bold py-1 px-3 flex items-center gap-1 shadow-sm">
                <Check className="w-3.5 h-3.5 stroke-[3]" /> Day Completed
              </span>
            ) : (
              <span className="badge badge-warning text-xs font-semibold py-1 px-3">
                {tickedIndices.length} / {totalTodos} To-Dos Checked
              </span>
            )}
          </div>
        </div>

        {/* Main Content: Explainer & Checklist Columns */}
        <div className="grid lg:grid-cols-12 gap-8 pt-6">
          {/* Left Column (7 cols): What to do & Why it works */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 dark:text-[#a0a5b2] mb-1">
                <span>Category: {currentTask.categoryLabel}</span>
                <span>•</span>
                <span>Target: <strong className="text-stone-900 dark:text-[#f4f5f7]">{currentTask.targetKpi}</strong></span>
              </div>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-stone-900 dark:text-[#f4f5f7]">
                {currentTask.title}
              </h2>
            </div>

            {/* Core Action */}
            <div className="p-4 rounded-2xl bg-stone-100/70 dark:bg-[#0B0F0E] border border-stone-200/60 dark:border-[#1E293B]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#22C55E] dark:text-[#34D399] uppercase tracking-wider mb-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>What to Do</span>
              </div>
              <p className="text-sm sm:text-base text-stone-800 dark:text-[#F8FAFC] font-medium leading-relaxed">
                {currentTask.action}
              </p>
            </div>

            {/* Detailed Explanation */}
            <div>
              <h4 className="text-xs font-bold text-stone-500 dark:text-[#8492A6] uppercase tracking-wider mb-1.5">
                Why This Habit Works
              </h4>
              <p className="text-sm text-stone-700 dark:text-[#CBD5E1] leading-relaxed">
                {currentTask.explanation}
              </p>
            </div>

            {/* Science Note */}
            <div className="p-3.5 rounded-xl bg-brand-50/60 dark:bg-[#101D2D] border border-brand-200/50 dark:border-[#1E293B] text-xs text-brand-950 dark:text-emerald-200 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#22C55E] dark:text-[#34D399] shrink-0 mt-0.5" />
              <span>
                <strong>Science Note:</strong> {currentTask.scienceTip}
              </span>
            </div>
          </div>

          {/* Right Column (5 cols): Action Checklist with Tick Marks */}
          <div className="lg:col-span-5 flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-stone-50/80 dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B]">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-[#22C55E] dark:text-[#34D399]" />
                  <h3 className="font-display font-bold text-base text-stone-900 dark:text-[#F8FAFC]">
                    Day {currentTask.day} Checklist
                  </h3>
                </div>
                <span className="text-xs font-bold text-stone-500 dark:text-[#8492A6]">
                  {tickedIndices.length} / {totalTodos}
                </span>
              </div>

              {/* Progress Bar for Current Day's To-Dos */}
              <div className="w-full bg-stone-200 dark:bg-[#1E293B] h-1.5 rounded-full overflow-hidden mb-5">
                <div
                  className="bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] h-full rounded-full transition-all duration-300"
                  style={{ width: `${(tickedIndices.length / totalTodos) * 100}%` }}
                />
              </div>

              {/* Interactive To-Do List with Tick Marks */}
              <div className="space-y-3">
                {currentTask.todos.map((todoText, idx) => {
                  const isChecked = tickedIndices.includes(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => handleToggleTodo(idx)}
                      className={`p-3.5 rounded-xl border transition-all duration-200 flex items-start gap-3 cursor-pointer group select-none ${
                        isChecked
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400/60 dark:border-emerald-700/60 text-emerald-950 dark:text-emerald-200'
                          : 'bg-white dark:bg-[#101D2D] border-stone-200 dark:border-[#1E293B] hover:border-[#22C55E] text-stone-800 dark:text-[#CBD5E1]'
                      }`}
                    >
                      <button
                        type="button"
                        aria-label={`Tick to-do item: ${todoText}`}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 mt-0.5 ${
                          isChecked
                            ? 'bg-[#22C55E] text-[#07111F] shadow-sm scale-105 font-bold'
                            : 'border-2 border-stone-300 dark:border-stone-600 group-hover:border-[#22C55E] bg-stone-50 dark:bg-[#101D2D]'
                        }`}
                      >
                        {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <span
                          className={`text-xs sm:text-sm font-medium leading-snug transition-all ${
                            isChecked
                              ? 'line-through opacity-85 text-emerald-900 dark:text-[#34D399]'
                              : 'text-stone-800 dark:text-[#F8FAFC]'
                          }`}
                        >
                          {todoText}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {isAllTodosDone && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-700 dark:text-[#34D399] text-center animate-fade-in flex items-center justify-center gap-1.5">
                  <PartyPopper className="w-4 h-4" />
                  <span>All tasks completed for Day {currentTask.day}!</span>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-stone-200/60 dark:border-[#1E293B] space-y-2">
              <button
                onClick={() => handleToggleDay(currentTask.day)}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                  isSelectedDayCompleted
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] font-bold shadow-[#22C55E]/20'
                }`}
              >
                {isSelectedDayCompleted ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Day {currentTask.day} Completed (Click to Undo)</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Mark Entire Day {currentTask.day} Done</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-[#828795] px-1">
                <span>Day {currentTask.day} of 30</span>
                <span>Click any box to tick off</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Milestone Badges Bar */}
      <div className="mb-8">
        <h3 className="font-display font-bold text-lg text-stone-900 dark:text-[#f4f5f7] mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <span>Milestone Achievements</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {challengeMilestones.map((m) => {
            const isUnlocked = completedCount >= m.daysRequired;
            return (
              <div
                key={m.id}
                className={`card p-4 flex items-start gap-3.5 transition-all ${
                  isUnlocked
                    ? 'border-amber-300/80 dark:border-amber-600/50 bg-gradient-to-br from-white to-amber-50/30 dark:from-[#0B0F0E] dark:to-[#101D2D] shadow-sm'
                    : 'opacity-70 grayscale hover:grayscale-0'
                }`}
              >
                <div className="text-3xl shrink-0 p-1">{m.icon}</div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-stone-900 dark:text-[#f4f5f7]">
                      {m.title}
                    </span>
                    {isUnlocked && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold">
                        UNLOCKED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 dark:text-[#a0a5b2] mt-0.5 leading-snug">
                    {m.description}
                  </p>
                  <div className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 mt-2">
                    {completedCount} / {m.daysRequired} Days
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 30-Day Road-map & Filter Controls */}
      <div className="card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200/60 dark:border-[#1E293B]">
          <div>
            <h3 className="font-display font-bold text-xl text-stone-900 dark:text-[#f4f5f7]">
              Complete 30-Day Road-map
            </h3>
            <p className="text-xs text-stone-500 dark:text-[#828795] mt-0.5">
              Click any card to open its detailed checklist & to-dos above. All progress syncs to your account!
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] font-bold shadow-sm'
                    : 'bg-stone-100 dark:bg-[#101D2D] text-stone-600 dark:text-[#CBD5E1] hover:bg-stone-200 dark:hover:bg-[#1E293B]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 30-Day Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
          {filteredTasks.map((t) => {
            const isCompleted = Array.isArray(challenge?.completedDays) && challenge.completedDays.includes(t.day);
            const isToday = t.day === activeDay;
            const isSelected = t.day === selectedDay;
            const dayTicks = challenge.tickedTodos?.[t.day] || [];

            return (
              <div
                key={t.day}
                onClick={() => handleSelectDayCard(t.day)}
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 cursor-pointer group hover:-translate-y-0.5 hover:shadow-card-lg ${
                  isSelected
                    ? 'ring-2 ring-[#22C55E] border-[#22C55E]'
                    : isCompleted
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-800/50 shadow-sm'
                    : isToday
                    ? 'bg-amber-50/40 dark:bg-[#101D2D] border-amber-300 dark:border-amber-700/60 ring-2 ring-amber-500/20'
                    : 'bg-stone-50/60 dark:bg-[#0B0F0E] border-stone-200 dark:border-[#1E293B] hover:border-stone-300 dark:hover:border-stone-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-100 dark:bg-[#22C55E]/20 text-emerald-800 dark:text-[#34D399]'
                          : isToday
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          : 'bg-stone-200 dark:bg-[#101D2D] text-stone-700 dark:text-[#CBD5E1]'
                      }`}
                    >
                      Day {t.day}
                    </span>

                    <span className="text-[11px] font-medium text-stone-400 dark:text-[#8492A6]">
                      {t.categoryLabel}
                    </span>
                  </div>

                  <h4 className="font-semibold text-sm text-stone-900 dark:text-[#F8FAFC] mb-1 group-hover:text-[#22C55E] dark:group-hover:text-[#34D399] transition-colors">
                    {t.title}
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-[#8492A6] leading-relaxed line-clamp-2">
                    {t.action}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-200/50 dark:border-[#1E293B] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-stone-500 dark:text-[#8492A6]">
                    {dayTicks.length}/{t.todos.length} to-dos
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleDay(t.day);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-white dark:bg-[#101D2D] border border-stone-300 dark:border-[#1E293B] text-stone-700 dark:text-[#CBD5E1] hover:border-[#22C55E]'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Done</span>
                      </>
                    ) : (
                      <>
                        <span className="w-3 h-3 rounded-full border border-stone-400 dark:border-stone-500" />
                        <span>Mark Done</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
