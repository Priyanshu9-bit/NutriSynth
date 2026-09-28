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
    <div className="fixed inset-0 z-[70] bg-stone-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200/60 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-emerald-600 flex items-center justify-center text-white">
              <PenLine className="w-4 h-4" />
            </div>
            <h2 className="font-display font-semibold text-lg text-stone-900">Enter Food</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-stone-100 text-stone-500" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 space-y-4">
          {!success && (
            <>
              <div>
                <p className="text-sm text-stone-500 mb-2">Describe what you ate, in your own words.</p>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder='e.g. "2 eggs, 2 toast and 1 banana"'
                  rows={3}
                  className="input-field text-sm resize-none"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setText(ex)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
                <button onClick={handleParse} disabled={!text.trim() || parsing} className="btn-primary w-full mt-3">
                  {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
                  {parsing ? 'Parsing…' : 'Parse Food'}
                </button>
              </div>

              {unresolved.length > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-2">
                  <div className="flex items-start gap-2 text-sm text-amber-800">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Couldn't find a nutrition match for: <strong>{unresolved.join(', ')}</strong>. Search manually below.
                    </span>
                  </div>
                  <InlineFoodSearch
                    placeholder="Search for the correct food…"
                    onSelect={(hit) => resolveUnresolved(unresolved[0], hit)}
                  />
                </div>
              )}

              {items.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-stone-200/60">
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
                      placeholder="e.g. Post Workout Meal"
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
