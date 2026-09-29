import { LayoutDashboard, Trophy, Flame, Dna, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import type { View } from '@/components/Layout';
import { playChecklistSound } from '@/lib/soundEffects';

interface ModeContextBarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  hasProfile: boolean;
  streakCount: number;
  activeChallengeDay: number;
  completedChallengeDaysCount: number;
}

export function ModeContextBar({
  currentView,
  onNavigate,
  hasProfile,
  streakCount,
  activeChallengeDay,
  completedChallengeDaysCount,
}: ModeContextBarProps) {
  // Show on main app pages
  const isAppPage = ['dashboard', 'meals', 'today-streak', 'challenge', 'deficiency', 'planner', 'grocery', 'analytics'].includes(currentView);
  if (!isAppPage) return null;

  const handleSwitch = (view: View) => {
    playChecklistSound(true);
    onNavigate(view);
  };

  // Configure friendly mode descriptors with ZERO technical jargon
  const getModeInfo = () => {
    switch (currentView) {
      case 'challenge':
        return {
          mode: 'challenge',
          badge: '🏆 30-Day Habit Road-map',
          badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          title: `Day ${activeChallengeDay} of 30: Small Steps, Big Health`,
          description: `You have completed ${completedChallengeDaysCount} of 30 days. No drastic dieting—just one small healthy win every day!`,
          action: { label: "🔥 Check Today's Habits", view: 'today-streak' as View },
        };
      case 'today-streak':
        return {
          mode: 'today-streak',
          badge: "🔥 Today's Simple Habits",
          badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
          title: `Daily Check-In (Streak: ${streakCount} ${streakCount === 1 ? 'Day' : 'Days'})`,
          description: `Check off today's easy mission and log your water glasses. Keep your daily streak going!`,
          action: { label: '🥗 View Energy Target', view: 'dashboard' as View },
        };
      case 'deficiency':
        return {
          mode: 'deficiency',
          badge: '🧬 Essential Vitamins Check',
          badgeColor: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
          title: 'Vitamins & Minerals Screening',
          description: 'A friendly check to see if your meals provide enough Iron, Vitamin D, Calcium, and other essentials.',
          action: { label: "🥗 Back to Today's Food", view: 'dashboard' as View },
        };
      case 'planner':
        return {
          mode: 'planner',
          badge: '🥗 Meal Ideas & Recipes',
          badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          title: 'Wholesome Recipes for Your Body',
          description: 'Browse simple, tasty meals that match your taste preferences and calorie goals.',
          action: { label: '🛒 View Shopping List', view: 'grocery' as View },
        };
      case 'grocery':
        return {
          mode: 'grocery',
          badge: '🛒 Smart Shopping List',
          badgeColor: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
          title: 'Ingredients to Buy at the Store',
          description: 'Check off fresh produce, protein, and pantry essentials as you shop in the aisles.',
          action: { label: '🥗 Plan Your Next Meal', view: 'planner' as View },
        };
      case 'analytics':
        return {
          mode: 'analytics',
          badge: '📈 My Progress Trends',
          badgeColor: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
          title: 'Weight Trends & Consistency',
          description: 'Track how your weight changes gently over time and celebrate your consistency.',
          action: { label: "🥗 Back to Today's Food", view: 'dashboard' as View },
        };
      case 'dashboard':
      case 'meals':
      default:
        return {
          mode: 'dashboard',
          badge: "🥗 Today's Energy & Meals",
          badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          title: "Today's Food & Energy Overview",
          description: "See what you have eaten today, how much energy your body has left, and recommended meals.",
          action: { label: '+ Log What You Ate', view: 'food-search' as View },
        };
    }
  };

  const info = getModeInfo();

  return (
    <div className="bg-gradient-to-r from-stone-100 via-stone-50 to-stone-100 dark:from-[#1d1f24] dark:via-[#191a1e] dark:to-[#1d1f24] border-b border-stone-200 dark:border-[#32353e] px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Left: What am I looking at right now? */}
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border tracking-wide flex-shrink-0 ${info.badgeColor}`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{info.badge}</span>
            </span>
            <div className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-medium truncate">
              <span className="font-bold text-stone-900 dark:text-white">{info.title}</span>
              <span className="hidden xl:inline text-stone-500 dark:text-stone-400 ml-2">— {info.description}</span>
            </div>
          </div>
        </div>

        {/* Right: Quick friendly mode switch pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mr-1 hidden lg:inline">
            Quick Jump:
          </span>

          <button
            type="button"
            onClick={() => handleSwitch('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currentView === 'dashboard' || currentView === 'meals'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'bg-white dark:bg-[#252830] text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-[#383c46] hover:bg-stone-50 dark:hover:bg-[#2c303a]'
            }`}
            title="What happens: View today's calories, protein, and meals"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Today's Food</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitch('today-streak')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currentView === 'today-streak'
                ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
                : 'bg-white dark:bg-[#252830] text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-[#383c46] hover:bg-stone-50 dark:hover:bg-[#2c303a]'
            }`}
            title="What happens: Open daily habit checklist and log water"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Daily Habits</span>
            {streakCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 text-[10px]">
                {streakCount}d
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSwitch('challenge')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currentView === 'challenge'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'bg-white dark:bg-[#252830] text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-[#383c46] hover:bg-stone-50 dark:hover:bg-[#2c303a]'
            }`}
            title="What happens: View your 30-day guided habit journey"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>30-Day Road-map</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitch('deficiency')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currentView === 'deficiency'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                : 'bg-white dark:bg-[#252830] text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-[#383c46] hover:bg-stone-50 dark:hover:bg-[#2c303a]'
            }`}
            title="What happens: Screen if you're getting enough essential vitamins"
          >
            <Dna className="w-3.5 h-3.5" />
            <span>Vitamin Check</span>
          </button>
        </div>
      </div>
    </div>
  );
}
