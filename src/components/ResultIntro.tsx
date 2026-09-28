import { CheckCircle2, ArrowRight, Sparkles, Activity, ChefHat, Beaker, Dna } from 'lucide-react';
import type { NutritionResult } from '@/lib/calculations';
import type { UserProfile } from '@/lib/calculations';

interface ResultIntroProps {
  result: NutritionResult;
  profile: UserProfile;
  onExplore: () => void;
}

export function ResultIntro({ result, profile, onExplore }: ResultIntroProps) {
  const greeting = profile.gender === "female" ? "Your" : "Your";

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-brand-50/30 to-white px-4 py-12">
      <div className="max-w-lg w-full text-center animate-fade-in-scale">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-600 flex items-center justify-center text-white shadow-glow">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          Plan Ready
        </div>

        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-stone-900 mb-3 text-balance">
          {greeting} NutriSynth Plan Is Ready
        </h1>
        <p className="text-stone-600 mb-8 text-balance">
          Based on your profile, here's what we've prepared for you.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="card p-5 text-left">
            <Activity className="w-6 h-6 text-brand-600 mb-2" />
            <div className="text-xs text-stone-500 font-medium">Daily Calories</div>
            <div className="metric-value text-2xl text-stone-900">{result.tdee.toLocaleString()}<span className="text-sm font-medium text-stone-400 ml-1">kcal</span></div>
          </div>
          <div className="card p-5 text-left">
            <ChefHat className="w-6 h-6 text-sky-600 mb-2" />
            <div className="text-xs text-stone-500 font-medium">Daily Protein</div>
            <div className="metric-value text-2xl text-stone-900">{result.proteinG}<span className="text-sm font-medium text-stone-400 ml-1">g</span></div>
          </div>
          <div className="card p-5 text-left">
            <Beaker className="w-6 h-6 text-amber-600 mb-2" />
            <div className="text-xs text-stone-500 font-medium">Meals Planned</div>
            <div className="metric-value text-2xl text-stone-900">{result.meals.length}</div>
          </div>
          <div className="card p-5 text-left">
            <Dna className="w-6 h-6 text-rose-600 mb-2" />
            <div className="text-xs text-stone-500 font-medium">Nutrients Tracked</div>
            <div className="metric-value text-2xl text-stone-900">{Object.keys(result.micros).length}</div>
          </div>
        </div>

        {result.conditionNote && (
          <div className="mb-6 p-4 rounded-xl bg-sky-50 border border-sky-200/50 text-left">
            <p className="text-sm text-sky-800">{result.conditionNote}</p>
          </div>
        )}

        <button onClick={onExplore} className="btn-primary text-base px-8 py-4 mx-auto">
          Explore My Plan
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
