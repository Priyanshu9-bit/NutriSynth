import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Check,
  Flame,
  Beef,
  Wheat,
  Droplet,
  Leaf,
  Sparkles,
  Sliders,
  Filter,
  Dna,
  History,
  X,
  CheckCircle2,
  BookOpen,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import type { MealItem } from '@/lib/calculations';
import { foodNutritionData, type FoodData } from '@/data/foods';
import { playAddProgressSound, playChecklistSound } from '@/lib/soundEffects';
import { SectionErrorBoundary } from '@/components/ErrorBoundary';
import { BeginnerGuideBanner } from '@/components/beginner/BeginnerGuideBanner';
import { NutritionGlossaryModal } from '@/components/beginner/NutritionGlossaryModal';

interface FoodSearchLoggerProps {
  onLogMeal: (meal: MealItem) => void;
  onClose?: () => void;
}

export function FoodSearchLogger({ onLogMeal, onClose }: FoodSearchLoggerProps) {
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [portionMultiplier, setPortionMultiplier] = useState<number>(1);
  const [selectedFoodKey, setSelectedFoodKey] = useState<string | null>(null);
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  // Custom food quick log form
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');

  // Logged state for UI feedback
  const [loggedKeys, setLoggedKeys] = useState<Record<string, boolean>>({});

  // Food entries array
  const allFoods = useMemo(() => {
    return Object.entries(foodNutritionData || {}).map(([key, data]) => ({
      key,
      ...data,
    }));
  }, []);

  // Filtered food list
  const filteredFoods = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allFoods.filter((f) => {
      // Search term
      if (q && !f.name.toLowerCase().includes(q) && !(f.tags || []).some((t) => t.toLowerCase().includes(q))) {
        return false;
      }
      // Tag filter
      if (selectedTag !== 'all') {
        if (selectedTag === 'high_protein' && f.protein < 12) return false;
        if (selectedTag === 'veg' && !(f.tags || []).includes('veg') && !(f.tags || []).includes('vegan')) return false;
        if (selectedTag === 'vegan' && !(f.tags || []).includes('vegan')) return false;
        if (selectedTag === 'breakfast' && !(f.tags || []).includes('breakfast')) return false;
        if (selectedTag === 'snack' && !(f.tags || []).includes('snack')) return false;
      }
      return true;
    });
  }, [allFoods, query, selectedTag]);

  // Log existing food from catalog
  const handleLogFood = (food: (typeof allFoods)[0]) => {
    if (loggedKeys[food.key]) return;
    setLoggedKeys((prev) => ({ ...prev, [food.key]: true }));
    playAddProgressSound();

    const scaledCals = Math.round(food.calories * portionMultiplier);
    const scaledProt = Math.round(food.protein * portionMultiplier);
    const scaledCarb = Math.round(food.carbs * portionMultiplier);
    const scaledFat = Math.round(food.fat * portionMultiplier);
    const scaledFiber = Math.round((food.fiber || 1) * portionMultiplier);

    const meal: MealItem = {
      name: `${food.name} (${portionMultiplier}x serving)`,
      food: food.name,
      time: 'LOGGED FOOD',
      details: {
        calories: scaledCals,
        protein: scaledProt,
        carbs: scaledCarb,
        fat: scaledFat,
        fiber: scaledFiber,
      },
      components: [food.name],
      icon: 'Camera',
    };

    onLogMeal(meal);

    setTimeout(() => {
      setLoggedKeys((prev) => {
        const next = { ...prev };
        delete next[food.key];
        return next;
      });
    }, 3500);
  };

  // Submit custom meal log
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customCalories) return;

    playAddProgressSound();
    const cals = Number(customCalories) || 0;
    const prot = Number(customProtein) || 0;
    const carb = Number(customCarbs) || 0;
    const fat = Number(customFat) || 0;

    const meal: MealItem = {
      name: customName.trim(),
      food: customName.trim(),
      time: 'CUSTOM ENTRY',
      details: {
        calories: cals,
        protein: prot,
        carbs: carb,
        fat: fat,
        fiber: 2,
      },
      components: [customName.trim()],
      icon: 'Camera',
    };

    onLogMeal(meal);
    setCustomName('');
    setCustomCalories('');
    setCustomProtein('');
    setCustomCarbs('');
    setCustomFat('');
    setIsCustomMode(false);
  };

  return (
    <SectionErrorBoundary fallbackTitle="Food Search & Meal Logger">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-12">
        {/* Beginner Guide Banner */}
        <BeginnerGuideBanner
          pageTitle="Food Search & Meal Logger"
          whatAmILookingAt="A simple search tool to record whatever you ate or drank today. No need for a kitchen scale!"
          whatShouldIDo="Type a food name in the search box, or tap any of the 1-tap everyday foods below. Then tap '+ Log Food'."
          whatHappensNext="The food's energy (calories) and protein are added to your daily progress bar on your dashboard."
          primaryActionLabel="Need Help with Terms?"
          primaryActionIcon={<Lightbulb className="w-4 h-4" />}
          onPrimaryAction={() => setGlossaryOpen(true)}
          onOpenGlossary={() => setGlossaryOpen(true)}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 rounded-3xl bg-white dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] shadow-sm">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#22C55E]/15 text-emerald-600 dark:text-[#34D399] text-xs font-bold mb-1 border border-[#22C55E]/30">
              <Sparkles className="w-3 h-3" />
              <span>Easy Food Logger</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl text-stone-900 dark:text-[#F8FAFC]">
              Record What You Ate Today
            </h1>
            <p className="text-xs text-stone-500 dark:text-[#8492A6] mt-0.5">
              Search common everyday foods, adjust portion sizes, or quickly add custom homemade meals.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playChecklistSound(true);
                setIsCustomMode(!isCustomMode);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                isCustomMode
                  ? 'bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F]'
                  : 'bg-stone-100 dark:bg-[#101D2D] text-stone-700 dark:text-[#CBD5E1] border border-transparent dark:border-[#1E293B] hover:bg-stone-200'
              }`}
              title="What happens: Lets you type any homemade dish with your own calorie estimate"
            >
              <span>✏️ Type Custom Food</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-stone-100 dark:bg-[#101D2D] hover:bg-stone-200 text-stone-500 dark:text-[#8492A6]"
                title="Close food logger"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Custom Food Form */}
        {isCustomMode && (
          <form
            onSubmit={handleCustomSubmit}
            className="p-5 rounded-3xl bg-gradient-to-br from-[#22C55E]/10 via-[#2DD4BF]/5 to-transparent border border-[#22C55E]/30 space-y-4 animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-sm text-stone-900 dark:text-[#F8FAFC]">
                  Log a Custom Homemade Meal
                </h3>
                <p className="text-xs text-stone-500 dark:text-[#8492A6]">
                  Don't worry about perfection—a rough estimate of calories is plenty!
                </p>
              </div>
              <span className="text-[10px] font-bold text-stone-400 dark:text-[#8492A6]">Values per serving</span>
            </div>

            <div className="grid sm:grid-cols-5 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-stone-500 dark:text-[#8492A6] uppercase block mb-1">
                  Food Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Homemade Dal & Roti"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#101D2D] border border-stone-200 dark:border-[#1E293B] text-xs font-semibold focus:ring-2 focus:ring-[#22C55E] text-stone-900 dark:text-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-500 dark:text-[#8492A6] uppercase block mb-1">
                  Energy / Calories (kcal)
                </label>
                <input
                  type="number"
                  required
                  placeholder="300"
                  value={customCalories}
                  onChange={(e) => setCustomCalories(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#101D2D] border border-stone-200 dark:border-[#1E293B] text-xs font-semibold focus:ring-2 focus:ring-[#22C55E] text-stone-900 dark:text-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-500 dark:text-[#8492A6] uppercase block mb-1">
                  Protein (grams, optional)
                </label>
                <input
                  type="number"
                  placeholder="15"
                  value={customProtein}
                  onChange={(e) => setCustomProtein(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#101D2D] border border-stone-200 dark:border-[#1E293B] text-xs font-semibold focus:ring-2 focus:ring-[#22C55E] text-stone-900 dark:text-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-500 dark:text-[#8492A6] uppercase block mb-1">
                  Carbs / Fat (optional)
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="number"
                    placeholder="Carb"
                    value={customCarbs}
                    onChange={(e) => setCustomCarbs(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-white dark:bg-[#101D2D] border border-stone-200 dark:border-[#1E293B] text-xs font-semibold text-stone-900 dark:text-[#F8FAFC]"
                  />
                  <input
                    type="number"
                    placeholder="Fat"
                    value={customFat}
                    onChange={(e) => setCustomFat(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-white dark:bg-[#101D2D] border border-stone-200 dark:border-[#1E293B] text-xs font-semibold text-stone-900 dark:text-[#F8FAFC]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCustomMode(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-stone-500 dark:text-[#8492A6] hover:text-stone-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] font-bold text-xs transition-all shadow-sm hover:opacity-95 cursor-pointer"
              >
                + Save & Log to Today
              </button>
            </div>
          </form>
        )}

        {/* 1-Tap Everyday Foods Shortcuts */}
        <div className="p-4 rounded-3xl bg-white dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 dark:text-[#F8FAFC] flex items-center gap-1.5">
              <span>⚡</span> <span>1-Tap Popular Foods (Click to quickly search):</span>
            </span>
            <span className="text-[11px] text-stone-400 dark:text-[#8492A6]">No typing needed!</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {[
              { label: '🥚 2 Boiled Eggs', q: 'egg' },
              { label: '🍎 1 Fresh Apple', q: 'apple' },
              { label: '🍚 Steamed Rice', q: 'rice' },
              { label: '🥣 Lentil Soup / Dal', q: 'dal' },
              { label: '🍞 Whole Wheat Bread', q: 'bread' },
              { label: '🥛 Glass of Milk', q: 'milk' },
              { label: '🥗 Green Salad', q: 'salad' },
              { label: '🍗 Grilled Chicken', q: 'chicken' },
              { label: '🧀 Paneer / Cottage Cheese', q: 'paneer' },
              { label: '🍌 1 Banana', q: 'banana' },
            ].map((shortcut) => (
              <button
                key={shortcut.q}
                type="button"
                onClick={() => {
                  playChecklistSound(true);
                  setQuery(shortcut.q);
                }}
                className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-[#22C55E]/15 hover:text-emerald-700 dark:bg-[#101D2D] dark:hover:bg-[#22C55E]/15 dark:hover:text-[#34D399] text-stone-700 dark:text-[#CBD5E1] font-semibold border border-stone-200 dark:border-[#1E293B] transition-all cursor-pointer active:scale-95"
              >
                {shortcut.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar & Portion Multiplier */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 dark:text-[#8492A6] absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search food by name (e.g. egg, paneer, oats, spinach, apple, rice)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-[#101D2D] border border-stone-200 dark:border-[#1E293B] text-stone-900 dark:text-[#F8FAFC] font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-200 dark:text-[#8492A6] text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Serving Size Scale Pill */}
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-[#101D2D] p-1 rounded-2xl border border-stone-200 dark:border-[#1E293B] self-start sm:self-auto text-xs">
              <span className="text-[10px] font-extrabold uppercase px-2 text-stone-500 dark:text-[#8492A6]">
                Portion:
              </span>
              {[
                { m: 0.5, label: '0.5x (Snack)' },
                { m: 1, label: '1x (Normal)' },
                { m: 1.5, label: '1.5x (Big)' },
                { m: 2, label: '2x (Double)' },
              ].map(({ m, label }) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    playChecklistSound(true);
                    setPortionMultiplier(m);
                  }}
                  className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                    portionMultiplier === m
                      ? 'bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] shadow-xs'
                      : 'text-stone-600 dark:text-[#CBD5E1] hover:text-stone-900 dark:hover:text-white'
                  }`}
                  title={`Multiply serving by ${m}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs pt-1">
            {[
              { id: 'all', label: 'All Foods' },
              { id: 'high_protein', label: '🥩 High Protein (12g+)' },
              { id: 'breakfast', label: '🍳 Breakfast' },
              { id: 'veg', label: '🥦 Vegetarian' },
              { id: 'vegan', label: '🌱 100% Plant-Based' },
              { id: 'snack', label: '🥜 Snack / Post-Workout' },
            ].map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => {
                  playChecklistSound(true);
                  setSelectedTag(tag.id);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  selectedTag === tag.id
                    ? 'bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] shadow-xs'
                    : 'bg-stone-100 dark:bg-[#101D2D] text-stone-600 dark:text-[#CBD5E1] hover:bg-stone-200 dark:hover:bg-[#101D2D]/80 border border-stone-200 dark:border-[#1E293B]'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Grid */}
        {filteredFoods.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] text-center space-y-3">
            <div className="text-3xl">🔍</div>
            <h3 className="font-bold text-stone-900 dark:text-[#F8FAFC] text-base">
              No matching food found for "{query}"
            </h3>
            <p className="text-xs text-stone-500 dark:text-[#8492A6] max-w-md mx-auto">
              Don't worry! You can easily record this as a custom food with an estimated calorie number.
            </p>
            <button
              type="button"
              onClick={() => {
                setCustomName(query);
                setIsCustomMode(true);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] font-bold text-xs shadow-sm hover:opacity-95 cursor-pointer"
            >
              + Add "{query}" as Custom Food
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFoods.map((food) => {
              const isLogged = loggedKeys[food.key];
              const scaledCals = Math.round(food.calories * portionMultiplier);
              const scaledProt = Math.round(food.protein * portionMultiplier);
              const scaledCarb = Math.round(food.carbs * portionMultiplier);
              const scaledFat = Math.round(food.fat * portionMultiplier);

              return (
                <div
                  key={food.key}
                  className="p-4 rounded-2xl bg-white dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] shadow-sm flex flex-col justify-between hover:border-[#22C55E]/50 transition-all space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-display font-bold text-sm text-stone-900 dark:text-[#F8FAFC] line-clamp-1">
                        {food.name}
                      </h4>
                      <span className="text-xs font-black text-[#2DD4BF] tabular-nums">
                        {scaledCals} kcal
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-500 dark:text-[#8492A6]">
                      Standard serving: {food.serving} {portionMultiplier !== 1 && `(${portionMultiplier}x)`}
                    </p>

                    {/* Micro Chips */}
                    <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-bold">
                      <div className="p-1 rounded-lg bg-[#22C55E]/10 text-emerald-600 dark:text-[#34D399]">
                        {scaledProt}g <span className="opacity-70 text-[8px]">PROT</span>
                      </div>
                      <div className="p-1 rounded-lg bg-[#60A5FA]/10 text-blue-600 dark:text-[#60A5FA]">
                        {scaledCarb}g <span className="opacity-70 text-[8px]">CARB</span>
                      </div>
                      <div className="p-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        {scaledFat}g <span className="opacity-70 text-[8px]">FAT</span>
                      </div>
                    </div>

                    {/* Micronutrient Badges */}
                    <div className="flex items-center gap-1 flex-wrap text-[9px] font-semibold text-stone-500">
                      {food.iron && (
                        <span className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-[#101D2D] text-stone-600 dark:text-[#CBD5E1]">
                          Iron {food.iron}mg
                        </span>
                      )}
                      {food.vitaminB12 && (
                        <span className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-[#101D2D] text-stone-600 dark:text-[#CBD5E1]">
                          B12 {food.vitaminB12}µg
                        </span>
                      )}
                      {food.calcium && (
                        <span className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-[#101D2D] text-stone-600 dark:text-[#CBD5E1]">
                          Calcium {food.calcium}mg
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLogFood(food)}
                    disabled={isLogged}
                    className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                      isLogged
                        ? 'bg-[#101D2D] text-[#34D399] border border-[#22C55E]/30'
                        : 'bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] hover:opacity-95 active:scale-95'
                    }`}
                    title={`What happens: Adds ${scaledCals} calories and ${scaledProt}g protein to today's intake`}
                  >
                    {isLogged ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{isLogged ? '✓ Added to Today!' : `+ Log to Today (+${scaledCals} kcal)`}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <NutritionGlossaryModal
          isOpen={glossaryOpen}
          onClose={() => setGlossaryOpen(false)}
        />
      </div>
    </SectionErrorBoundary>
  );
}
