import { useState } from 'react';
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
  RotateCcw,
  Target,
  Share2,
} from 'lucide-react';
import {
  thirtyDayTasks,
  challengeMilestones,
  type ChallengeTask,
} from '@/data/challengeData';
import {
  type StreakData,
  type ChallengeData,
  recordDailyCheckIn,
  toggleChallengeDayCompletion,
  computeActiveChallengeDay,
  getLocalDateKey,
} from '@/lib/streakService';
import type { View } from '@/components/Layout';

interface ChallengeProps {
  streak: StreakData;
  challenge: ChallengeData;
  onUpdateStreak: (newStreak: StreakData) => void;
  onUpdateChallenge: (newChallenge: ChallengeData) => void;
  onNavigate: (view: View) => void;
}

export function Challenge({
  streak,
  challenge,
  onUpdateStreak,
  onUpdateChallenge,
  onNavigate,
}: ChallengeProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [notification, setNotification] = useState<string | null>(null);

  const todayKey = getLocalDateKey();
  const isCheckedInToday = streak.lastCheckInDate === todayKey;
  const activeDay = computeActiveChallengeDay(challenge);
  const completedCount = challenge.completedDays.length;
  const progressPercent = Math.min(Math.round((completedCount / 30) * 100), 100);

  const activeTask = thirtyDayTasks.find((t) => t.day === activeDay) || thirtyDayTasks[0];

  const handleDailyCheckIn = () => {
    const res = recordDailyCheckIn(streak);
    onUpdateStreak(res.streak);
    setNotification(res.statusMessage);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleToggleDay = (dayNumber: number) => {
    const updated = toggleChallengeDayCompletion(challenge, dayNumber);
    onUpdateChallenge(updated);

    // Also mark daily check-in if completing today's task
    if (!isCheckedInToday && !challenge.completedDays.includes(dayNumber)) {
      const res = recordDailyCheckIn(streak);
      onUpdateStreak(res.streak);
    }

    const wasCompleted = challenge.completedDays.includes(dayNumber);
    setNotification(
      wasCompleted
        ? `Day ${dayNumber} marked as pending.`
        : `🎉 Day ${dayNumber} completed! Great job on your consistency!`
    );
    setTimeout(() => setNotification(null), 3500);
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
    : thirtyDayTasks.filter((t) => t.category === selectedCategory || (selectedCategory === 'plants' && (t.category as any) === 'micronutrients'));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-subtle">
          <div className="px-4 py-3 rounded-2xl bg-stone-900/95 dark:bg-stone-100 text-white dark:text-stone-900 text-xs sm:text-sm font-semibold shadow-2xl border border-stone-700 dark:border-stone-300 flex items-center gap-2">
            <span>✨</span>
            <span>{notification}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-brand-500/10 to-emerald-500/10 dark:from-amber-950/20 dark:via-[#202227] dark:to-[#1a2320] border border-amber-200/60 dark:border-[#32353e] p-6 sm:p-10 mb-8 shadow-sm">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-br from-amber-400/20 to-brand-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-3 border border-amber-300/40 dark:border-amber-700/40">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>Habit Gamification</span>
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-stone-900 dark:text-[#f4f5f7] tracking-tight">
              30-Day Nutrition Challenge
            </h1>
            <p className="mt-2 text-stone-600 dark:text-[#a0a5b2] text-sm sm:text-base max-w-2xl leading-relaxed">
              Transform your eating habits one evidence-based action at a time. Keep your daily streak burning and unlock lifetime milestone badges!
            </p>
          </div>

          {/* Quick Check-In CTA Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={handleDailyCheckIn}
              className={`px-6 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2.5 shadow-md active:scale-95 ${
                isCheckedInToday
                  ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 cursor-default'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/20 hover:shadow-lg'
              }`}
            >
              {isCheckedInToday ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Checked In for Today! 🔥</span>
                </>
              ) : (
                <>
                  <Flame className="w-5 h-5 fill-white text-white animate-pulse" />
                  <span>Check In Today (+1 Streak)</span>
                </>
              )}
            </button>

            <button
              onClick={() => onNavigate('dashboard')}
              className="btn-secondary text-sm px-5 py-3.5 flex items-center justify-center gap-2"
            >
              <span>My Nutrition</span>
              <ArrowRight className="w-4 h-4" />
            </button>
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
          <div className="w-full bg-stone-200 dark:bg-[#32353e] h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-brand-500 to-emerald-500 h-full rounded-full transition-all duration-500"
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

      {/* Today's Active Spotlight Mission Card */}
      <div className="card-lg p-6 sm:p-8 mb-8 border-2 border-brand-500/40 dark:border-brand-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-100 dark:bg-brand-950/60 text-brand-800 dark:text-brand-300">
                Today's Mission — Day {activeTask.day}
              </span>
              <span className="text-xs font-medium text-stone-500 dark:text-[#828795]">
                Category: {activeTask.categoryLabel}
              </span>
            </div>

            <h2 className="font-display font-bold text-2xl sm:text-3xl text-stone-900 dark:text-[#f4f5f7]">
              {activeTask.title}
            </h2>

            <p className="text-base text-stone-700 dark:text-[#d1d5db] leading-relaxed">
              {activeTask.action}
            </p>

            <div className="p-3.5 rounded-xl bg-brand-50/60 dark:bg-[#1a2320] border border-brand-200/50 dark:border-brand-800/40 text-xs text-brand-950 dark:text-emerald-200 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-brand-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Science Note:</strong> {activeTask.scienceTip}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 shrink-0">
            <button
              onClick={() => handleToggleDay(activeTask.day)}
              className={`px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                challenge.completedDays.includes(activeTask.day)
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white'
              }`}
            >
              {challenge.completedDays.includes(activeTask.day) ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Day {activeTask.day} Completed!</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 text-amber-300" />
                  <span>Mark Day {activeTask.day} Done</span>
                </>
              )}
            </button>

            <div className="text-center text-xs text-stone-500 dark:text-[#828795]">
              Target: <strong className="text-stone-800 dark:text-[#f4f5f7]">{activeTask.targetKpi}</strong>
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
                    ? 'border-amber-300/80 dark:border-amber-600/50 bg-gradient-to-br from-white to-amber-50/30 dark:from-[#202227] dark:to-[#262218]'
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200/60 dark:border-[#32353e]">
          <div>
            <h3 className="font-display font-bold text-xl text-stone-900 dark:text-[#f4f5f7]">
              Complete 30-Day Road-map
            </h3>
            <p className="text-xs text-stone-500 dark:text-[#828795] mt-0.5">
              Click any day's checkbox to toggle completion. Every check saves automatically to your Firebase account!
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-stone-100 dark:bg-[#282a32] text-stone-600 dark:text-[#d1d5db] hover:bg-stone-200 dark:hover:bg-[#32353e]'
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
            const isCompleted = challenge.completedDays.includes(t.day);
            const isToday = t.day === activeDay;

            return (
              <div
                key={t.day}
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                  isCompleted
                    ? 'bg-emerald-50/50 dark:bg-[#1a2320] border-emerald-300/80 dark:border-emerald-800/50 shadow-sm'
                    : isToday
                    ? 'bg-amber-50/40 dark:bg-[#25221b] border-amber-300 dark:border-amber-700/60 ring-2 ring-amber-500/20'
                    : 'bg-stone-50/60 dark:bg-[#18191d] border-stone-200 dark:border-[#32353e] hover:border-stone-300 dark:hover:border-stone-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          : isToday
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          : 'bg-stone-200 dark:bg-[#282a32] text-stone-700 dark:text-[#d1d5db]'
                      }`}
                    >
                      Day {t.day}
                    </span>

                    <span className="text-[11px] font-medium text-stone-400 dark:text-[#828795]">
                      {t.categoryLabel}
                    </span>
                  </div>

                  <h4 className="font-semibold text-sm text-stone-900 dark:text-[#f4f5f7] mb-1">
                    {t.title}
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-[#a0a5b2] leading-relaxed line-clamp-3">
                    {t.action}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-200/50 dark:border-[#282a32] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-stone-500 dark:text-[#828795]">
                    {t.targetKpi}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleToggleDay(t.day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-white dark:bg-[#282a32] border border-stone-300 dark:border-[#373a44] text-stone-700 dark:text-[#d1d5db] hover:border-brand-500'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Completed</span>
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
