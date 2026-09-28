import { useEffect, useState } from 'react';
import {
  CheckCircle2, Flame, Moon, Soup, Sunrise, UtensilsCrossed, X,
} from 'lucide-react';
import type { MealItem } from '@/lib/calculations';
import type { FoodSearchHit, ResolvedFoodItem } from '@/lib/nutrition/types';
import { getFoodDetails, toMealItem, totalsFor } from '@/lib/nutrition/provider';
import { addRecentFood, getRecentFoods } from '@/lib/recentFoods';
import { FoodItemCard } from '@/components/nutrition/FoodItemCard';
import { InlineFoodSearch } from '@/components/nutrition/InlineFoodSearch';

type MealType = 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner' | 'Custom';

const mealTypes: { value: MealType; icon: typeof Sunrise }[] = [
  { value: 'Breakfast', icon: Sunrise },
  { value: 'Lunch', icon: Soup },
  { value: 'Snack', icon: UtensilsCrossed },
  { value: 'Dinner', icon: Moon },
  { value: 'Custom', icon: UtensilsCrossed },
];

interface SearchFoodProps {
  onClose: () => void;
  onAddMeal: (meal: MealItem) => void;
  initialQuery?: string;
}

export function SearchFood({ onClose, onAddMeal, initialQuery }: SearchFoodProps) {
  const [cart, setCart] = useState<ResolvedFoodItem[]>([]);
  const [mealType, setMealType] = useState<MealType>('Snack');
  const [mealName, setMealName] = useState('');
  const [mealNameTouched, setMealNameTouched] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recent] = useState(() => getRecentFoods());

  useEffect(() => {
    if (mealNameTouched) return;
    setMealName(cart.map((c) => c.food.name).join(' + '));
  }, [cart, mealNameTouched]);

  async function handleSelect(hit: FoodSearchHit) {
    const food = await getFoodDetails(hit);
    if (!food) return;
    setCart((prev) => [...prev, { uid: `${food.id}-${Date.now()}`, food, multiplier: 1 }]);
    addRecentFood({ id: food.id, name: food.name });
  }

  function adjust(uid: string, delta: number) {
    setCart((prev) =>
      prev.map((c) => (c.uid === uid ? { ...c, multiplier: Math.max(0.25, +(c.multiplier + delta).toFixed(2)) } : c))
    );
  }
  function remove(uid: string) {
    setCart((prev) => prev.filter((c) => c.uid !== uid));
  }

  const totals = totalsFor(cart);

  function handleAdd() {
    if (cart.length === 0) return;
    onAddMeal(toMealItem(cart, mealName, mealType));
    setSuccess(true);
  }

  return (
    <div className="fixed inset-0 z-[70] bg-stone-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200/60 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-emerald-600 flex items-center justify-center text-white">
              🔎
            </div>
            <h2 className="font-display font-semibold text-lg text-stone-900">Search Food</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-stone-100 text-stone-500" aria-label="Close search">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 space-y-4">
          {!success && (
            <>
              <p className="text-sm text-stone-500">Search any food or meal — no photo needed.</p>

              <InlineFoodSearch
                autoFocus
                initialQuery={initialQuery}
                placeholder="Search food or meal…"
                onSelect={handleSelect}
              />

              {cart.length === 0 && recent.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-stone-500 mb-2">Recent</div>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((r) => (
                      <span key={r.id} className="badge badge-neutral">
                        {r.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {cart.length > 0 && (
                <div className="space-y-3 pt-1 border-t border-stone-200/60">
                  <div className="space-y-3 pt-3">
                    {cart.map((item) => (
                      <FoodItemCard
                        key={item.uid}
                        item={item}
                        onAdjust={(delta) => adjust(item.uid, delta)}
                        onRemove={() => remove(item.uid)}
                      />
                    ))}
                  </div>

                  <div className="rounded-xl bg-brand-50/60 border border-brand-200/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-display font-semibold text-stone-900 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-orange-500" /> Total
                      </span>
                      <span className="metric-value text-xl text-stone-900">
                        {Math.round(totals.calories)} <span className="text-sm font-medium text-stone-400">kcal</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: 'Protein', val: totals.protein },
                        { label: 'Carbs', val: totals.carbs },
                        { label: 'Fat', val: totals.fat },
                        { label: 'Fiber', val: totals.fiber },
                      ].map((m) => (
                        <div key={m.label}>
                          <div className="text-sm font-semibold text-stone-800 tabular-nums">{Math.round(m.val)}g</div>
                          <div className="text-[10px] text-stone-500">{m.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-stone-700 mb-2">Meal Type</div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {mealTypes.map(({ value, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() => setMealType(value)}
                          className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-[11px] font-medium transition-colors ${
                            mealType === value
                              ? 'border-brand-500 bg-brand-50 text-brand-700'
                              : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-stone-700 mb-2">Meal Name</div>
                    <input
                      type="text"
                      value={mealName}
                      onChange={(e) => {
                        setMealName(e.target.value);
                        setMealNameTouched(true);
                      }}
                      placeholder="e.g. Paneer Rice Lunch"
                      className="input-field py-2 text-sm"
                    />
                  </div>

                  <p className="text-[11px] text-stone-400">
                    Nutrition values are estimates and may vary based on ingredients, preparation method, and portion size.
                  </p>

                  <button onClick={handleAdd} className="btn-primary w-full">
                    <CheckCircle2 className="w-4 h-4" /> Add to Today's Intake
                  </button>
                </div>
              )}
            </>
          )}

          {success && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-brand-600" />
              </div>
              <h3 className="font-display font-semibold text-lg text-stone-900">Meal added!</h3>
              <p className="text-sm text-stone-500">
                {mealName || 'Your meal'} — {Math.round(totals.calories)} kcal added to Today's Intake.
              </p>
              <button onClick={onClose} className="btn-primary mt-2">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
