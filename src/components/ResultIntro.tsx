import { useState } from 'react';
import { CheckCircle2, ArrowRight, Sparkles, Info } from 'lucide-react';
import type { NutritionResult, UserProfile } from '@/lib/calculations';
import { NutritionGlossaryModal } from '@/components/beginner/NutritionGlossaryModal';

interface ResultIntroProps {
  result: NutritionResult;
  profile: UserProfile;
  onExplore: () => void;
}

export function ResultIntro({ result, profile, onExplore }: ResultIntroProps) {
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [glossaryTopic, setGlossaryTopic] = useState<string | undefined>(undefined);

  const openGlossary = (topic?: string) => {
    setGlossaryTopic(topic);
    setGlossaryOpen(true);
  };

  const goalName =
    profile.goal === 'fat_loss'
      ? 'Gentle Fat Loss'
      : profile.goal === 'muscle_gain'
      ? 'Muscle Building & Strength'
      : 'Healthy Weight & Vitality';

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-stone-50 dark:bg-[#07111F] px-4 py-8 sm:py-12 transition-colors">
      <div className="max-w-2xl w-full text-center animate-fade-in-scale">
        {/* Celebration Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-[#22C55E] to-[#2DD4BF] flex items-center justify-center text-[#07111F] shadow-xl shadow-emerald-500/25">
          <CheckCircle2 className="w-9 h-9 sm:w-11 sm:h-11 stroke-[2.5]" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-100 dark:bg-[#101D2D] text-emerald-700 dark:text-[#34D399] border border-stone-200 dark:border-[#1E293B] text-xs sm:text-sm font-bold mb-3">
          <Sparkles className="w-4 h-4 text-[#2DD4BF]" />
          <span>Your Plan Is Ready • Zero Nutrition Experience Needed</span>
        </div>

        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-stone-900 dark:text-[#F8FAFC] mb-2 text-balance">
          Your Personalized Blueprint Is Ready!
        </h1>
        <p className="text-stone-600 dark:text-[#CBD5E1] text-sm sm:text-base mb-6 text-balance max-w-lg mx-auto">
          We calculated your daily energy target tailored to your body and goal (
          <span className="font-bold text-emerald-600 dark:text-[#34D399]">{goalName}</span>). Here is what each number means in plain English:
        </p>

        {/* 3 Core Questions Clarifier for this screen */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B0F0E] border border-stone-200 dark:border-[#1E293B] shadow-xs mb-6 text-left grid sm:grid-cols-3 gap-3 text-xs">
          <div>
            <div className="font-bold text-emerald-600 dark:text-[#34D399] mb-0.5">👁️ 1. What am I looking at?</div>
            <div className="text-stone-600 dark:text-[#CBD5E1]">Your personalized daily targets. No complicated charts or math!</div>
          </div>
          <div>
            <div className="font-bold text-emerald-600 dark:text-[#34D399] mb-0.5">👉 2. What should I do?</div>
            <div className="text-stone-600 dark:text-[#CBD5E1]">Read your 4 daily numbers below, then tap 'Open My Daily Plan'.</div>
          </div>
          <div>
            <div className="font-bold text-emerald-600 dark:text-[#34D399] mb-0.5">⚡ 3. What happens next?</div>
            <div className="text-stone-600 dark:text-[#CBD5E1]">Opens your daily dashboard where you can check off meals and see progress.</div>
          </div>
        </div>

        {/* Four Key Metrics Explained In Plain Language */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-left">
          {/* Daily Energy */}
          <div className="card p-5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg">
                  ⚡
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-500 dark:text-[#8492A6]">Daily Fuel Target</div>
                  <div className="text-base font-extrabold text-stone-900 dark:text-[#F8FAFC]">Calories / Energy</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openGlossary('calorie')}
                className="text-[11px] font-bold text-emerald-600 dark:text-[#2DD4BF] hover:underline"
                title="What is a calorie?"
              >
                What's this?
              </button>
            </div>
            <div className="metric-value text-2xl sm:text-3xl text-emerald-600 dark:text-[#34D399] my-1">
              {result.tdee.toLocaleString()}
              <span className="text-sm font-medium text-stone-500 dark:text-[#8492A6] ml-1">calories/day</span>
            </div>
            <p className="text-xs text-stone-600 dark:text-[#CBD5E1] mt-2 leading-relaxed">
              The amount of food energy your body needs daily to achieve your goal without fatigue or hunger.
            </p>
          </div>

          {/* Daily Protein */}
          <div className="card p-5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-lg">
                  🥩
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-500 dark:text-[#8492A6]">Muscle & Fullness</div>
                  <div className="text-base font-extrabold text-stone-900 dark:text-[#F8FAFC]">Daily Protein</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openGlossary('protein')}
                className="text-[11px] font-bold text-teal-600 dark:text-[#2DD4BF] hover:underline"
                title="What is protein?"
              >
                What's this?
              </button>
            </div>
            <div className="metric-value text-2xl sm:text-3xl text-teal-600 dark:text-[#2DD4BF] my-1">
              {result.proteinG}
              <span className="text-sm font-medium text-stone-500 dark:text-[#8492A6] ml-1">grams/day</span>
            </div>
            <p className="text-xs text-stone-600 dark:text-[#CBD5E1] mt-2 leading-relaxed">
              Protects muscle tone and keeps you satisfied for hours so you don't get sudden sugar cravings.
            </p>
          </div>

          {/* Planned Meals */}
          <div className="card p-5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg">
                  🍽️
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-500 dark:text-[#8492A6]">Ready Meals</div>
                  <div className="text-base font-extrabold text-stone-900 dark:text-[#F8FAFC]">Planned For Today</div>
                </div>
              </div>
            </div>
            <div className="metric-value text-2xl sm:text-3xl text-amber-600 dark:text-amber-400 my-1">
              {result.meals.length}
              <span className="text-sm font-medium text-stone-500 dark:text-[#8492A6] ml-1">wholesome meals</span>
            </div>
            <p className="text-xs text-stone-600 dark:text-[#CBD5E1] mt-2 leading-relaxed">
              Curated to match your diet and ingredients. You can eat these or easily search and log whatever you ate!
            </p>
          </div>

          {/* Hydration */}
          <div className="card p-5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-lg">
                  💧
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-500 dark:text-[#8492A6]">Daily Water</div>
                  <div className="text-base font-extrabold text-stone-900 dark:text-[#F8FAFC]">Hydration Target</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openGlossary('water')}
                className="text-[11px] font-bold text-sky-600 dark:text-[#2DD4BF] hover:underline"
                title="Why does water matter?"
              >
                What's this?
              </button>
            </div>
            <div className="metric-value text-2xl sm:text-3xl text-blue-600 dark:text-[#60A5FA] my-1">
              2,500
              <span className="text-sm font-medium text-stone-500 dark:text-[#8492A6] ml-1">ml (approx 10 glasses)</span>
            </div>
            <p className="text-xs text-stone-600 dark:text-[#CBD5E1] mt-2 leading-relaxed">
              Keeps your digestion moving, stops fake hunger signals, and keeps your mental focus sharp.
            </p>
          </div>
        </div>

        {result.conditionNote && (
          <div className="mb-6 p-4 rounded-2xl bg-blue-50 dark:bg-[#60A5FA]/10 border border-blue-200 dark:border-[#60A5FA]/30 text-left">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-[#60A5FA] mb-1">
              <Info className="w-4 h-4" />
              <span>Special Condition Note:</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-700 dark:text-[#CBD5E1] leading-relaxed">{result.conditionNote}</p>
          </div>
        )}

        {/* Primary Action Button */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={onExplore}
            className="btn-primary text-base sm:text-lg px-8 py-4 mx-auto w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] hover:opacity-95 shadow-xl shadow-emerald-500/25 active:scale-95 transition-all font-black"
            title="What happens: Opens your daily overview where you can check off meals and see progress"
          >
            <span>Open My Daily Plan</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>

          <p className="text-xs text-stone-500 dark:text-[#8492A6]">
            👉 Pressing 'Open My Daily Plan' takes you to your easy daily view. You can check off meals or add any food with one tap.
          </p>
        </div>
      </div>

      <NutritionGlossaryModal
        isOpen={glossaryOpen}
        onClose={() => setGlossaryOpen(false)}
        initialTopic={glossaryTopic}
      />
    </div>
  );
}
