import React, { useState } from 'react';
import {
  X,
  Search,
  BookOpen,
  Sparkles,
  Flame,
  Beef,
  Wheat,
  Droplet,
  Leaf,
  Scale,
  Activity,
  Heart,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react';

export interface NutritionGlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
}

interface TermItem {
  id: string;
  name: string;
  plainTitle: string;
  icon: string;
  quickSummary: string;
  everydayAnalogy: string;
  whereToFindIt: string;
  whyItMatters: string;
}

const GLOSSARY_TERMS: TermItem[] = [
  {
    id: 'calorie',
    name: 'Calories (kcal)',
    plainTitle: 'Daily Body Energy / Fuel',
    icon: '⚡',
    quickSummary: 'A calorie is simply a measurement unit of energy, just like a kilometer measures distance.',
    everydayAnalogy: 'Think of calories like fuel in your car tank. Your body burns fuel just by breathing, keeping your heart beating, and walking around.',
    whereToFindIt: 'All foods and drinks have calories, except plain water, black coffee, and unsweetened tea.',
    whyItMatters: 'If you eat roughly what your body burns, your weight stays steady. If you eat slightly less, your body gently burns stored fat.',
  },
  {
    id: 'protein',
    name: 'Protein',
    plainTitle: 'Muscle Fuel & Fullness Builder',
    icon: '🥩',
    quickSummary: 'The essential building material that repairs your muscles, hair, nails, and immune cells.',
    everydayAnalogy: 'Like the bricks and cement that repair and reinforce a building after daily wear and tear.',
    whereToFindIt: 'Eggs, chicken, fish, paneer, lentils (dal), tofu, Greek yogurt, beans, and edamame.',
    whyItMatters: 'Protein takes longer to digest, which naturally stops sudden hunger cravings and protects your muscles.',
  },
  {
    id: 'carbs',
    name: 'Carbohydrates (Carbs)',
    plainTitle: 'Quick Clean Energy Fuel',
    icon: '🌾',
    quickSummary: 'Your body and brain’s favorite primary fuel source for fast, clean daily energy.',
    everydayAnalogy: 'Like electricity charging your smartphone battery so apps run fast and smooth all day.',
    whereToFindIt: 'Oats, brown or white rice, whole wheat roti/bread, potatoes, sweet potatoes, bananas, and fresh fruits.',
    whyItMatters: 'Carbs give you stamina to think clearly at work, walk, exercise, and avoid afternoon energy crashes.',
  },
  {
    id: 'fat',
    name: 'Healthy Fats',
    plainTitle: 'Hormone Health & Brain Shield',
    icon: '🥑',
    quickSummary: 'Essential nutrients needed to absorb vitamins A, D, E, and K, and protect your vital organs.',
    everydayAnalogy: 'Like lubricant oil in an engine that keeps all moving parts running silky smooth without grinding.',
    whereToFindIt: 'Olive oil, almonds, walnuts, chia seeds, avocados, eggs, and moderate cheese/ghee.',
    whyItMatters: 'Eating healthy fats does NOT make you fat. It supports your hormones, skin glow, and keeps you feeling satisfied.',
  },
  {
    id: 'fiber',
    name: 'Dietary Fiber',
    plainTitle: 'Natural Digestion Cleaner',
    icon: '🥦',
    quickSummary: 'The parts of plant foods that your stomach cannot digest, which gently sweeps your digestive tract clean.',
    everydayAnalogy: 'Like a gentle, natural broom cleaning out your pipes and feeding the good bacteria in your gut.',
    whereToFindIt: 'Apples, berries, chia seeds, broccoli, carrots, beans, lentils, and whole grain oats.',
    whyItMatters: 'Prevents constipation, stabilizes your blood sugar, and keeps you comfortably full for hours.',
  },
  {
    id: 'water',
    name: 'Hydration (Water)',
    plainTitle: 'Body Fluid & Energy Restorer',
    icon: '💧',
    quickSummary: 'Water makes up 60% of your body weight and transports all nutrients to your cells.',
    everydayAnalogy: 'Like keeping coolant fluid topped up in a car so it stays running cool and prevents overheating.',
    whereToFindIt: 'Clean drinking water, coconut water, herbal teas, and water-rich fruits like cucumbers and melons.',
    whyItMatters: 'Mild dehydration often feels like fake hunger or fatigue. Drinking a glass of water often boosts your energy instantly.',
  },
  {
    id: 'deficit',
    name: 'Calorie Deficit',
    plainTitle: 'Eating For Gentle Fat Loss',
    icon: '📉',
    quickSummary: 'Consuming slightly fewer calories than your body naturally burns in a day.',
    everydayAnalogy: 'Like spending 100 dollars less than your daily paycheck; your body makes up the difference by dipping into your savings account (stored fat).',
    whereToFindIt: 'Achieved by choosing nutrient-dense whole foods and keeping reasonable portion sizes.',
    whyItMatters: 'A gentle deficit of 300–500 calories is the safest, most sustainable way to lose weight without starvation.',
  },
  {
    id: 'bmi',
    name: 'BMI (Body Mass Index)',
    plainTitle: 'General Height-to-Weight Guide',
    icon: '⚖️',
    quickSummary: 'A simple mathematical comparison between your height and weight.',
    everydayAnalogy: 'Like a rough ballpark estimate on a map. Useful as a general guide, but does not measure your health or muscle directly.',
    whereToFindIt: 'Calculated automatically on your Profile & Settings page.',
    whyItMatters: 'Gives a quick baseline. Remember: feeling energetic, eating nutritious meals, and daily movement matter far more than an arbitrary number.',
  },
  {
    id: 'portions',
    name: 'Portions Without A Scale',
    plainTitle: 'The Hand-Size Measuring Trick',
    icon: '✋',
    quickSummary: 'How to easily measure your food without needing a kitchen scale or counting every gram.',
    everydayAnalogy: 'Your hand is always with you and is naturally proportional to your body size!',
    whereToFindIt: 'Use at home, restaurants, or when visiting family.',
    whyItMatters: '✋ Palm = 1 portion of protein (chicken, paneer, fish)\n✊ Fist = 1 portion of veggies & greens\n🤲 Cupped Hand = 1 portion of carbs (rice, pasta, oats)\n👍 Thumb = 1 portion of healthy fats (oil, butter, nuts)',
  },
];

export function NutritionGlossaryModal({ isOpen, onClose, initialTopic }: NutritionGlossaryModalProps) {
  const [search, setSearch] = useState('');
  const [selectedTermId, setSelectedTermId] = useState<string>(initialTopic || 'calorie');

  if (!isOpen) return null;

  const filteredTerms = GLOSSARY_TERMS.filter((t) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.plainTitle.toLowerCase().includes(q) ||
      t.quickSummary.toLowerCase().includes(q) ||
      t.whereToFindIt.toLowerCase().includes(q)
    );
  });

  const activeTerm = GLOSSARY_TERMS.find((t) => t.id === selectedTermId) || filteredTerms[0] || GLOSSARY_TERMS[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="glossary-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#181a20] rounded-3xl border border-stone-200 dark:border-[#2f333f] shadow-2xl overflow-hidden flex flex-col z-10 animate-fade-in-scale">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200/80 dark:border-stone-800 bg-gradient-to-r from-emerald-500/10 via-transparent to-teal-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Beginner's Cheat-Sheet
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  Zero Jargon
                </span>
              </div>
              <h2 id="glossary-dialog-title" className="text-xl font-black text-stone-900 dark:text-white">
                Nutrition in Plain Everyday Words
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-300 transition-colors"
            aria-label="Close glossary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-[#15171c]/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search any term (e.g. calories, protein, water, carbs, portions)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1e2129] text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto grid md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-stone-200/80 dark:divide-stone-800">
          {/* Left Column: Topic List */}
          <div className="md:col-span-5 p-4 space-y-1.5 max-h-[50vh] md:max-h-none overflow-y-auto">
            {filteredTerms.map((term) => {
              const isSelected = activeTerm?.id === term.id;
              return (
                <button
                  key={term.id}
                  type="button"
                  onClick={() => setSelectedTermId(term.id)}
                  className={`w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25 scale-[1.01]'
                      : 'hover:bg-stone-100 dark:hover:bg-stone-800/60 text-stone-800 dark:text-stone-200'
                  }`}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{term.icon}</span>
                  <div className="min-w-0">
                    <div className="font-bold text-sm leading-tight">{term.name}</div>
                    <div
                      className={`text-xs mt-0.5 truncate ${
                        isSelected ? 'text-emerald-100 font-medium' : 'text-stone-500 dark:text-stone-400'
                      }`}
                    >
                      {term.plainTitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Detailed Explanation */}
          <div className="md:col-span-7 p-6 overflow-y-auto space-y-5 bg-stone-50/30 dark:bg-[#15171c]/30">
            {activeTerm && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20">
                    {activeTerm.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-stone-900 dark:text-white">
                      {activeTerm.name}
                    </h3>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {activeTerm.plainTitle}
                    </p>
                  </div>
                </div>

                {/* 1-Sentence Quick Summary */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1e2129] border border-stone-200 dark:border-stone-700 shadow-xs">
                  <div className="text-xs font-black uppercase tracking-wider text-stone-400 dark:text-stone-400 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    <span>In Plain English:</span>
                  </div>
                  <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 leading-relaxed">
                    {activeTerm.quickSummary}
                  </p>
                </div>

                {/* Everyday Real-World Analogy */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/30">
                  <div className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Real-World Analogy:</span>
                  </div>
                  <p className="text-sm text-stone-700 dark:text-stone-200 leading-relaxed">
                    {activeTerm.everydayAnalogy}
                  </p>
                </div>

                {/* Where to find it / Hand portions */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1e2129] border border-stone-200 dark:border-stone-700 shadow-xs">
                  <div className="text-xs font-black uppercase tracking-wider text-stone-400 dark:text-stone-400 mb-1">
                    {activeTerm.id === 'portions' ? 'Quick Reference Guide:' : 'Everyday Food Examples:'}
                  </div>
                  <div className="text-sm text-stone-800 dark:text-stone-200 font-medium whitespace-pre-line leading-relaxed">
                    {activeTerm.whereToFindIt}
                  </div>
                </div>

                {/* Why it matters for your health */}
                <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-500/30">
                  <div className="text-xs font-black uppercase tracking-wider text-teal-800 dark:text-teal-300 mb-1 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Why You Don't Need To Stress About It:</span>
                  </div>
                  <p className="text-sm text-stone-700 dark:text-stone-200 leading-relaxed">
                    {activeTerm.whyItMatters}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-stone-200/80 dark:border-stone-800 bg-stone-50 dark:bg-[#15171c] flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>NutriSynth calculates all the math automatically in the background.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-sm bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-900 transition-all shadow-sm"
          >
            Got it, take me back
          </button>
        </div>
      </div>
    </div>
  );
}
