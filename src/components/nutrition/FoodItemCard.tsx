import { AlertTriangle, Minus, Plus, Trash2 } from 'lucide-react';
import type { ResolvedFoodItem } from '@/lib/nutrition/types';
import { scaledNutrients, sourceLabel } from '@/lib/nutrition/provider';
import { formatQuantity, portionStep } from '@/lib/nutrition/units';

interface FoodItemCardProps {
  item: ResolvedFoodItem;
  onAdjust: (delta: number) => void;
  onRemove: () => void;
  onChangeFood?: () => void;
}

/**
 * One food's portion editor + macro breakdown. Shared by Scan Food results,
 * Search Food's cart, and Enter Food's parsed list, so editing a portion or
 * removing an item behaves identically no matter how the food got there.
 */
export function FoodItemCard({ item, onAdjust, onRemove, onChangeFood }: FoodItemCardProps) {
  const n = scaledNutrients(item);
  const step = portionStep(item.food.serving);
  const lowConfidence = typeof item.confidence === 'number' && item.confidence > 0 && item.confidence < 0.7;

  return (
    <div className={`rounded-xl border p-3 ${lowConfidence ? 'border-amber-300 dark:border-amber-500/50 bg-amber-50/30 dark:bg-amber-500/10' : 'border-stone-200 dark:border-[#1E293B] bg-white dark:bg-[#0B0F0E]'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-sm text-stone-800 dark:text-[#F8FAFC]">{item.food.name}</div>
          <div className="text-xs text-stone-500 dark:text-[#8492A6] flex flex-wrap items-center gap-x-1.5">
            <span>
              {formatQuantity(item.multiplier)} × {item.food.serving.label}
            </span>
            <span className="text-stone-300 dark:text-[#1E293B]">·</span>
            <span className="text-stone-400 dark:text-[#8492A6]">{sourceLabel(item.food.source)}</span>
            {typeof item.confidence === 'number' && item.confidence > 0 && (
              <>
                <span className="text-stone-300 dark:text-[#1E293B]">·</span>
                <span className={lowConfidence ? 'text-amber-700 dark:text-amber-400 font-medium' : 'text-stone-400 dark:text-[#8492A6]'}>
                  {Math.round(item.confidence * 100)}% confidence
                </span>
              </>
            )}
          </div>
          {lowConfidence && (
            <div className="mt-1 flex items-start gap-1 text-[11px] text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>Possible match — please confirm or change the food.</span>
            </div>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="metric-value text-base text-stone-900 dark:text-[#F8FAFC]">{Math.round(n.calories ?? 0)}</div>
          <div className="text-[10px] text-stone-400 dark:text-[#8492A6]">kcal</div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2.5 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAdjust(-step)}
            className="w-7 h-7 rounded-lg border border-stone-300 dark:border-[#1E293B] flex items-center justify-center hover:bg-stone-50 dark:hover:bg-[#101D2D] text-stone-700 dark:text-[#CBD5E1] transition-colors cursor-pointer"
            aria-label={`Decrease ${item.food.name} portion`}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-sm font-medium text-stone-700 dark:text-[#CBD5E1] w-10 text-center tabular-nums">
            {formatQuantity(item.multiplier)}
          </span>
          <button
            onClick={() => onAdjust(step)}
            className="w-7 h-7 rounded-lg border border-stone-300 dark:border-[#1E293B] flex items-center justify-center hover:bg-stone-50 dark:hover:bg-[#101D2D] text-stone-700 dark:text-[#CBD5E1] transition-colors cursor-pointer"
            aria-label={`Increase ${item.food.name} portion`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          {onChangeFood && (
            <button onClick={onChangeFood} className="text-xs text-stone-500 dark:text-[#8492A6] hover:text-stone-800 dark:hover:text-[#F8FAFC] underline cursor-pointer">
              Change Food
            </button>
          )}
          <button onClick={onRemove} className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" /> Remove
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-2.5 text-center">
        {[
          { label: 'Protein', val: n.protein },
          { label: 'Carbs', val: n.carbs },
          { label: 'Fat', val: n.fat },
          { label: 'Fiber', val: n.fiber },
        ].map((m) => (
          <div key={m.label} className="rounded-lg bg-stone-50 dark:bg-[#101D2D] border border-transparent dark:border-[#1E293B]/40 py-1.5">
            <div className="text-xs font-semibold text-stone-700 dark:text-[#F8FAFC] tabular-nums">{Math.round(m.val ?? 0)}g</div>
            <div className="text-[10px] text-stone-400 dark:text-[#8492A6]">{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
