import { useEffect, useState } from 'react';
import { Camera, Clock3, PenLine, Search, X } from 'lucide-react';
import type { MealItem } from '@/lib/calculations';
import { ScanFood } from '@/components/ScanFood';
import { SearchFood } from '@/components/nutrition/SearchFood';
import { EnterFood } from '@/components/nutrition/EnterFood';
import { getRecentFoods, syncFoodListsFromCloud } from '@/lib/recentFoods';
import { saveMeal } from '@/lib/cloudStore';

interface NutritionHubProps {
  onClose: () => void;
  onAddMeal: (meal: MealItem) => void;
}

type ActiveScreen = 'scan' | 'search' | 'enter' | null;

/**
 * The three ways of getting food nutrition — Scan / Search / Enter — all
 * live behind this one hub and all end up producing the same MealItem via
 * the shared provider layer (src/lib/nutrition/provider.ts), so whichever
 * path the person picks, it lands in the same daily-intake system.
 */
export function NutritionHub({ onClose, onAddMeal: addToIntake }: NutritionHubProps) {
  const [screen, setScreen] = useState<ActiveScreen>(null);
  const [searchSeed, setSearchSeed] = useState('');
  const [, setSyncTick] = useState(0);

  // Pull recent/favorite foods from Firestore (no-op when Firebase isn't configured).
  useEffect(() => {
    syncFoodListsFromCloud().then(() => setSyncTick((t) => t + 1));
  }, []);

  // Every meal goes to the existing daily intake AND is saved to Firestore.
  const onAddMeal = (meal: MealItem) => {
    addToIntake(meal);
    void saveMeal(meal);
  };

  if (screen === 'scan') return <ScanFood onClose={onClose} onAddMeal={onAddMeal} />;
  if (screen === 'search') return <SearchFood onClose={onClose} onAddMeal={onAddMeal} initialQuery={searchSeed} />;
  if (screen === 'enter') return <EnterFood onClose={onClose} onAddMeal={onAddMeal} />;

  const recent = getRecentFoods().slice(0, 6);

  return (
    <div className="fixed inset-0 z-[70] bg-stone-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#07111F] border border-stone-200 dark:border-[#1E293B] w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200/60 dark:border-[#1E293B] flex-shrink-0">
          <div>
            <h2 className="font-display font-semibold text-lg text-stone-900 dark:text-[#F8FAFC] flex items-center gap-2">
              <span>🍽️ Log Today's Food</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-[#8492A6] mt-0.5">
              Zero stress logging: pick whatever method feels easiest to you.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-[#101D2D] text-stone-500 dark:text-[#8492A6] transition-colors cursor-pointer"
            aria-label="Close food logger"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Golden Questions Quick Guidance */}
        <div className="px-5 pt-4">
          <div className="p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 text-xs text-stone-700 dark:text-[#CBD5E1] space-y-1.5">
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-emerald-700 dark:text-[#34D399] shrink-0">1. What is this?</span>
              <span>Your personal meal logger to record what you eat today.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-emerald-700 dark:text-[#34D399] shrink-0">2. What should I do?</span>
              <span>Tap any of the 3 buttons below that fits your current meal.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-emerald-700 dark:text-[#34D399] shrink-0">3. What happens next?</span>
              <span>It automatically calculates calories and updates your daily progress dials!</span>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-3">
          <HubButton
            icon={Camera}
            title="📸 Snap a Meal Photo"
            subtitle="Point your camera at your plate. Our AI detects foods and estimates portions automatically."
            badge="Fastest"
            onClick={() => setScreen('scan')}
          />
          <HubButton
            icon={Search}
            title="🔍 Search Food Database"
            subtitle="Type any food or dish (e.g. apple, boiled egg, rice) from our verified nutrition database."
            badge="Precise"
            onClick={() => setScreen('search')}
          />
          <HubButton
            icon={PenLine}
            title="✍️ Type Everyday Words"
            subtitle='Type naturally like "2 scrambled eggs and 1 slice toast" — we parse it instantly.'
            badge="Super Easy"
            onClick={() => setScreen('enter')}
          />

          {recent.length > 0 && (
            <div className="pt-2 border-t border-stone-200/60 dark:border-[#1E293B]">
              <div className="text-xs font-semibold text-stone-500 dark:text-[#8492A6] mb-2 flex items-center gap-1.5">
                <Clock3 className="w-3.5 h-3.5" /> Recent Foods — tap to search again
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSearchSeed(r.name);
                      setScreen('search');
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 dark:bg-[#101D2D] text-stone-700 dark:text-[#CBD5E1] border border-stone-200 dark:border-[#1E293B] hover:border-[#22C55E] hover:text-[#22C55E] dark:hover:text-[#34D399] transition-colors cursor-pointer"
                  >
                    + {r.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HubButton({
  icon: Icon,
  title,
  subtitle,
  badge,
  onClick,
}: {
  icon: typeof Camera;
  title: string;
  subtitle: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 rounded-2xl bg-stone-50 dark:bg-[#0B0F0E] border border-stone-200 dark:border-[#1E293B] hover:border-[#22C55E] dark:hover:border-[#22C55E] flex items-start gap-4 text-left transition-all duration-200 hover:-translate-y-0.5 shadow-sm group cursor-pointer"
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#22C55E] to-[#2DD4BF] flex items-center justify-center text-[#07111F] font-bold flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-display font-bold text-stone-900 dark:text-[#F8FAFC] text-sm group-hover:text-[#22C55E] dark:group-hover:text-[#34D399] transition-colors">
            {title}
          </span>
          {badge && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#22C55E]/15 text-[#22C55E] dark:text-[#34D399] border border-[#22C55E]/30">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-stone-600 dark:text-[#CBD5E1] leading-relaxed">
          {subtitle}
        </p>
      </div>
    </button>
  );
}
