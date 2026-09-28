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
    <div className="fixed inset-0 z-[70] bg-stone-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200/60 flex-shrink-0">
          <h2 className="font-display font-semibold text-lg text-stone-900">🍽️ Nutrition Hub</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-stone-100 text-stone-500" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 space-y-3">
          <HubButton icon={Camera} title="Scan Food" subtitle="Take a photo of your meal" onClick={() => setScreen('scan')} />
          <HubButton icon={Search} title="Search Food" subtitle="Search any food or meal" onClick={() => setScreen('search')} />
          <HubButton icon={PenLine} title="Enter Food" subtitle='e.g. "2 eggs and 1 toast"' onClick={() => setScreen('enter')} />

          {recent.length > 0 && (
            <div className="pt-2">
              <div className="text-xs font-semibold text-stone-500 mb-2 flex items-center gap-1.5">
                <Clock3 className="w-3.5 h-3.5" /> Recent — tap to search again
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSearchSeed(r.name);
                      setScreen('search');
                    }}
                    className="badge badge-neutral hover:bg-stone-200 transition-colors"
                  >
                    {r.name}
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
  onClick,
}: {
  icon: typeof Camera;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full card p-4 flex items-center gap-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-lg"
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-600 flex items-center justify-center text-white flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-display font-semibold text-stone-900">{title}</div>
        <div className="text-sm text-stone-500">{subtitle}</div>
      </div>
    </button>
  );
}
