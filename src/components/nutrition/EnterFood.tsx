import { useEffect, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, Flame, Loader2, Moon, PenLine, Soup, Sunrise, UtensilsCrossed, X,
} from 'lucide-react';
import type { MealItem } from '@/lib/calculations';
import type { FoodSearchHit, ResolvedFoodItem } from '@/lib/nutrition/types';
import { parseMealText } from '@/lib/nutrition/nlParser';
import { getFoodDetails, resolveFoodItem, toMealItem, totalsFor } from '@/lib/nutrition/provider';
import { addRecentFood } from '@/lib/recentFoods';
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

interface EnterFoodProps {
  onClose: () => void;
  onAddMeal: (meal: MealItem) => void;
}

const EXAMPLES = ['2 eggs and 1 toast', '1 cup rice, 1 bowl dal, 100g paneer', '250g chicken breast', '1 banana'];

export function EnterFood({ onClose, onAddMeal }: EnterFoodProps) {
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [items, setItems] = useState<ResolvedFoodItem[]>([]);
  const [unresolved, setUnresolved] = useState<string[]>([]);
  const [mealType, setMealType] = useState<MealType>('Snack');
  const [mealName, setMealName] = useState('');
  const [mealNameTouched, setMealNameTouched] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (mealNameTouched) return;
    setMealName(items.map((i) => i.food.name).join(' + '));
  }, [items, mealNameTouched]);

  async function handleParse() {
    if (!text.trim() || parsing) return;
    setParsing(true);
    const entries = parseMealText(text);
    const resolved: ResolvedFoodItem[] = [];
    const failed: string[] = [];

    for (const entry of entries) {
      const item = await resolveFoodItem(entry.food, entry.quantity, entry.unit);
      if (item) {
        resolved.push(item);
        addRecentFood({ id: item.food.id, name: item.food.name });
      } else {
        failed.push(entry.food);
      }
    }

    setItems((prev) => [...prev, ...resolved]);
    setUnresolved(failed);
    setParsing(false);
    setText('');
  }

  function adjust(uid: string, delta: number) {
    setItems((prev) =>
      prev.map((c) => (c.uid === uid ? { ...c, multiplier: Math.max(0.25, +(c.multiplier + delta).toFixed(2)) } : c))
    );
  }
  function remove(uid: string) {
    setItems((prev) => prev.filter((c) => c.uid !== uid));
  }

  async function resolveUnresolved(rawName: string, hit: FoodSearchHit) {
    const food = await getFoodDetails(hit);
    if (!food) return;
    setItems((prev) => [...prev, { uid: `${food.id}-${Date.now()}`, food, multiplier: 1 }]);
    addRecentFood({ id: food.id, name: food.name });
    setUnresolved((prev) => prev.filter((u) => u !== rawName));
  }

  const totals = totalsFor(items);

  function handleAdd() {
    if (items.length === 0) return;
    onAddMeal(toMealItem(items, mealName, mealType));
    setSuccess(true);
  }

  return (
    <div className="fixed inset-0 z-[70] bg-stone-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#18191d] border border-stone-200 dark:border-[#2e323b] w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200/60 dark:border-[#2e323b] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-base">
              ✍️
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg text-stone-900 dark:text-white">Type What You Ate</h2>
              <p className="text-xs text-stone-500 dark:text-[#828795]">Describe your meal in simple plain English</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-[#282a32] text-stone-500 dark:text-[#a0a5b2] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 space-y-4">
          {!success && (
            <>
              {/* Beginner 3-Questions Helper */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-stone-700 dark:text-[#d1d5db] space-y-1">
                <div>
                  <strong className="text-emerald-700 dark:text-emerald-400">1. What to do: </strong>
                  Type what you ate (or tap an example below) and press "Calculate Nutrition".
                </div>
                <div>
                  <strong className="text-emerald-700 dark:text-emerald-400">2. What happens next: </strong>
                  We parse each food, look up calories and fuel, and let you review before saving!
                </div>
              </div>

              <div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder='e.g. "2 eggs, 2 toast and 1 banana"'
                  rows={3}
                  className="input-field text-sm resize-none w-full rounded-xl bg-stone-50 dark:bg-[#202227] border border-stone-200 dark:border-[#2e323b] text-stone-900 dark:text-white p-3"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setText(ex)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-stone-100 dark:bg-[#202227] text-stone-600 dark:text-[#a0a5b2] hover:bg-stone-200 dark:hover:bg-[#2a2d36] border border-stone-200 dark:border-[#2e323b] transition-colors"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleParse}
                  disabled={!text.trim() || parsing}
                  className="w-full mt-3 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
                  {parsing ? 'Calculating Nutrients…' : 'Calculate Nutrition'}
                </button>
              </div>

              {unresolved.length > 0 && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 space-y-2">
                  <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Couldn't find an exact match for: <strong>{unresolved.join(', ')}</strong>. Pick a quick match below:
                    </span>
                  </div>
                  <InlineFoodSearch
                    placeholder="Search for the matching food…"
                    onSelect={(hit) => resolveUnresolved(unresolved[0], hit)}
                  />
                </div>
              )}

              {items.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-stone-200/60 dark:border-[#2e323b]">
                  <div className="space-y-3 pt-2">
                    {items.map((item) => (
                      <FoodItemCard
                        key={item.uid}
                        item={item}
                        onAdjust={(delta) => adjust(item.uid, delta)}
                        onRemove={() => remove(item.uid)}
                      />
                    ))}
                  </div>

                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-display font-semibold text-stone-900 dark:text-white flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-orange-500" /> Total Added Energy
                      </span>
                      <span className="metric-value text-xl text-stone-900 dark:text-white font-bold">
                        {Math.round(totals.calories)} <span className="text-sm font-medium text-stone-400">kcal</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: 'Protein (Fuel)', val: totals.protein },
                        { label: 'Carbs (Energy)', val: totals.carbs },
                        { label: 'Healthy Fat', val: totals.fat },
                        { label: 'Fiber', val: totals.fiber },
                      ].map((m) => (
                        <div key={m.label} className="p-1 rounded-lg bg-white/50 dark:bg-[#1a1c22]">
                          <div className="text-sm font-bold text-stone-800 dark:text-white tabular-nums">{Math.round(m.val)}g</div>
                          <div className="text-[10px] text-stone-500 dark:text-[#828795]">{m.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-stone-700 dark:text-[#d1d5db] mb-2">Which Meal Is This?</div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {mealTypes.map(({ value, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setMealType(value)}
                          className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-[11px] font-semibold transition-all ${
                            mealType === value
                              ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                              : 'border-stone-200 dark:border-[#2e323b] text-stone-500 dark:text-[#828795] hover:bg-stone-50 dark:hover:bg-[#202227]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-stone-700 dark:text-[#d1d5db] mb-2">Meal Label (Optional)</div>
                    <input
                      type="text"
                      value={mealName}
                      onChange={(e) => {
                        setMealName(e.target.value);
                        setMealNameTouched(true);
                      }}
                      placeholder="e.g. Post Workout Snack"
                      className="input-field py-2 text-sm w-full rounded-xl bg-stone-50 dark:bg-[#202227] border border-stone-200 dark:border-[#2e323b] text-stone-900 dark:text-white px-3"
                    />
                  </div>

                  <p className="text-[11px] text-stone-400 dark:text-stone-500">
                    💡 Tip: Nutrition values are standard estimates and perfect for tracking daily progress.
                  </p>

                  <button
                    type="button"
                    onClick={handleAdd}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Save & Add to Today's Intake (+{Math.round(totals.calories)} kcal)
                  </button>
                </div>
              )}
            </>
          )}

          {success && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-display font-semibold text-lg text-stone-900 dark:text-white">Meal Logged Successfully!</h3>
              <p className="text-sm text-stone-500 dark:text-[#a0a5b2]">
                {mealName || 'Your meal'} — {Math.round(totals.calories)} kcal added to Today's Food.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
