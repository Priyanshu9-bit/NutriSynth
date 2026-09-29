import { useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Ruler,
  Activity,
  Salad,
  Target,
  Settings2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Info,
  Heart,
  Lightbulb,
} from 'lucide-react';
import { dietOptions, allergyOptions, intoleranceOptions } from '@/data/foods';
import type { UserProfile } from '@/lib/calculations';
import type { Gender } from '@/data/nutrients';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  onBack: () => void;
  initialProfile?: UserProfile;
  backLabel?: string;
  submitLabel?: string;
}

const steps = [
  { id: 0, label: 'About You', short: 'Basics', icon: User, question: 'What is your age and biological sex?' },
  { id: 1, label: 'Body Stats', short: 'Body', icon: Ruler, question: 'What is your current height and weight?' },
  { id: 2, label: 'Daily Lifestyle', short: 'Lifestyle', icon: Activity, question: 'How much do you move on a normal day?' },
  { id: 3, label: 'Diet Type', short: 'Diet', icon: Salad, question: 'What kind of foods do you prefer to eat?' },
  { id: 4, label: 'Your Goal', short: 'Goal', icon: Target, question: 'What would you like your nutrition plan to help you with?' },
  { id: 5, label: 'Preferences', short: 'Kitchen', icon: Settings2, question: 'Any food allergies or favorite staples in your kitchen?' },
];

export function Onboarding({
  onComplete,
  onBack,
  initialProfile,
  backLabel = 'Back to Home',
  submitLabel = 'Build My Plan',
}: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>(
    initialProfile ?? {
      age: 28,
      gender: 'male',
      height: 172,
      weight: 70,
      activity: 1.55,
      goal: 'fat_loss',
      diet: 'veg',
      allergies: [],
      intolerances: [],
      ingredients: 'rice, dal, spinach, paneer, egg, oats, potato, banana, curd',
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Unit helper state for height & weight
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');

  const update = (key: keyof UserProfile, value: any) => {
    setProfile((p) => ({ ...p, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validateStep = (): boolean => {
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (!profile.age || profile.age < 12 || profile.age > 110) {
        errs.age = 'Please enter your age between 12 and 110. This ensures we accurately calculate how much energy your body naturally burns.';
      }
    }
    if (step === 1) {
      if (!profile.height || profile.height < 90 || profile.height > 240) {
        errs.height = 'Please enter a height between 90 cm and 240 cm (roughly 3 feet to 7 feet 10 inches).';
      }
      if (!profile.weight || profile.weight < 25 || profile.weight > 280) {
        errs.weight = 'Please enter a weight between 25 kg and 280 kg (roughly 55 lbs to 600 lbs).';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    if (step < steps.length - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onComplete(profile);
    }
  };

  const prev = () => {
    if (step === 0) onBack();
    else {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Convert kg to lbs display and vice versa
  const currentWeightLbs = Math.round((profile.weight || 70) * 2.20462);
  const handleWeightLbsChange = (lbs: number) => {
    const kg = Math.round(lbs / 2.20462);
    update('weight', kg);
  };

  // Convert cm to feet/inches display
  const totalInches = Math.round((profile.height || 170) / 2.54);
  const heightFeet = Math.floor(totalInches / 12);
  const heightInches = totalInches % 12;

  const handleFeetInchesChange = (feet: number, inches: number) => {
    const cm = Math.round((feet * 12 + inches) * 2.54);
    update('height', cm);
  };

  // Plain-English beginner friendly labels for activity
  const beginnerActivityLevels = [
    {
      value: 1.2,
      label: 'Mostly Sitting (Light Movement)',
      emoji: '🛋️',
      summary: 'Desk job, relaxing at home, under 5,000 steps a day.',
      clarification: 'Best if you do not do regular workouts and spend most of your day seated.',
    },
    {
      value: 1.375,
      label: 'Lightly Active',
      emoji: '🚶',
      summary: 'On your feet part of the day, casual walks, 5,000–8,000 steps, or 1–2 easy workouts/week.',
      clarification: 'Good if you commute on foot, do housework, or take evening strolls.',
    },
    {
      value: 1.55,
      label: 'Moderately Active (Recommended for Most)',
      emoji: '🏃',
      summary: '8,000–12,000 daily steps, or 3–5 moderate workout sessions per week.',
      clarification: 'Ideal if you walk a lot, jog, cycle, or go to the gym a few days a week.',
    },
    {
      value: 1.725,
      label: 'Very Active',
      emoji: '⚡',
      summary: 'Heavy physical work, sports training, or vigorous daily exercise.',
      clarification: 'Choose if you have an active construction/nursing job or train intensely every day.',
    },
  ];

  // Plain-English beginner friendly goals
  const beginnerGoals = [
    {
      value: 'fat_loss',
      label: 'Gently Lose Body Fat',
      emoji: '🌿',
      summary: 'Eat slightly less energy than your body burns so it uses stored fat.',
      clarification: 'NutriSynth sets a safe, gentle deficit. No starvation, no low energy!',
    },
    {
      value: 'maintain',
      label: 'Keep My Current Weight & Feel Great',
      emoji: '⚖️',
      summary: 'Eat just the right amount of daily energy to stay steady and vibrant.',
      clarification: 'Perfect if you like your current weight and want better stamina, digestion, and meals.',
    },
    {
      value: 'muscle_gain',
      label: 'Build Strength & Muscle Tone',
      emoji: '💪',
      summary: 'Extra protein and clean fuel to help your muscles repair and grow stronger.',
      clarification: 'Great if you are doing gym workouts, yoga, or home resistance training.',
    },
  ];

  const currentStepInfo = steps[step];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-emerald-50/40 via-stone-50 to-stone-50 dark:from-[#15171b] dark:via-[#18191c] dark:to-[#18191c] py-6 sm:py-10 px-4 sm:px-6 transition-colors">
      <div className="max-w-2xl mx-auto">
        {/* Top Reassurance Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-white/90 dark:bg-[#1f222a] border border-emerald-500/25 shadow-xs flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🌟</span>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Quick 60-Second Setup
              </div>
              <div className="text-xs text-stone-600 dark:text-stone-300 font-medium">
                Step {step + 1} of {steps.length} — Customized to your body & daily routine
              </div>
            </div>
          </div>
          <div className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            Step-by-Step • Fast & Simple
          </div>
        </div>

        {/* Visual Step Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isComplete = i < step;
              const isCurrent = i === step;
              return (
                <div key={s.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => i < step && setStep(i)}
                      disabled={i > step}
                      title={`Step ${i + 1}: ${s.label}`}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center transition-all duration-300 font-bold text-xs sm:text-sm
                        ${
                          isComplete
                            ? 'bg-emerald-600 text-white shadow-sm cursor-pointer hover:scale-105'
                            : isCurrent
                            ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20 shadow-md scale-105'
                            : 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
                        }`}
                    >
                      {isComplete ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                    <span
                      className={`text-[10px] sm:text-xs font-bold hidden sm:block ${
                        isCurrent
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isComplete
                          ? 'text-stone-700 dark:text-stone-300'
                          : 'text-stone-400'
                      }`}
                    >
                      {s.short}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex-1 h-1 mx-1.5 sm:mx-2 rounded-full bg-stone-200 dark:bg-stone-800 relative overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 bg-emerald-500 transition-all duration-500 ${
                          isComplete ? 'w-full' : 'w-0'
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3 Core Questions Clarifier Card */}
        <div className="mb-4 p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/25 grid sm:grid-cols-3 gap-3 text-xs">
          <div>
            <div className="font-bold text-emerald-800 dark:text-emerald-300 mb-0.5">👁️ 1. What is this?</div>
            <div className="text-stone-600 dark:text-stone-300 font-medium">{currentStepInfo.label}: {currentStepInfo.question}</div>
          </div>
          <div>
            <div className="font-bold text-emerald-800 dark:text-emerald-300 mb-0.5">👉 2. What should I do?</div>
            <div className="text-stone-600 dark:text-stone-300 font-medium">Pick the option that best matches your everyday reality. There are no wrong answers!</div>
          </div>
          <div>
            <div className="font-bold text-emerald-800 dark:text-emerald-300 mb-0.5">⚡ 3. What happens next?</div>
            <div className="text-stone-600 dark:text-stone-300 font-medium">NutriSynth calculates your daily energy targets automatically.</div>
          </div>
        </div>

        {/* Step Container Card */}
        <div key={step} className="card-lg p-6 sm:p-8 animate-slide-in-right bg-white dark:bg-[#1e2027] border border-stone-200 dark:border-[#2f333f]">
          {/* STEP 0: Personal Basics */}
          {step === 0 && (
            <StepContainer
              icon={<User className="w-7 h-7" />}
              title="Let's Start With The Basics"
              desc="We use this to calculate how much energy your body naturally burns each day just to keep you alive and healthy."
            >
              <Field
                label="How old are you?"
                desc="Your body's energy needs change smoothly as you age. Enter your age in years."
                error={errors.age}
              >
                <div className="relative">
                  <input
                    type="number"
                    value={profile.age || ''}
                    onChange={(e) => update('age', Number(e.target.value))}
                    className="input-field text-base sm:text-lg font-bold"
                    placeholder="e.g. 28"
                    min={12}
                    max={110}
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                    years old
                  </span>
                </div>
              </Field>

              <Field
                label="Biological Sex"
                desc="Why we ask: Men and women naturally have slightly different baseline muscle mass and metabolic burn rates. This helps us personalize your energy target accurately."
              >
                <div className="grid grid-cols-3 gap-3">
                  {(['male', 'female', 'other'] as Gender[]).map((g) => (
                    <OptionCard key={g} selected={profile.gender === g} onClick={() => update('gender', g)}>
                      <div className="text-center py-1">
                        <div className="text-xl mb-1">{g === 'male' ? '👨' : g === 'female' ? '👩' : '✨'}</div>
                        <span className="font-bold capitalize text-sm">{g === 'other' ? 'Non-Binary' : g}</span>
                      </div>
                    </OptionCard>
                  ))}
                </div>
              </Field>

              {profile.gender === 'female' && (
                <Field
                  label="Life Stage (Optional)"
                  desc="Select if you have special nutritional requirements for pregnancy or nursing. Otherwise leave as None."
                >
                  <select
                    value={profile.femaleState || 'none'}
                    onChange={(e) => update('femaleState', e.target.value)}
                    className="input-field"
                  >
                    <option value="none">Standard / None</option>
                    <option value="menstruation">Currently Menstruating (extra iron reminder)</option>
                    <option value="pregnancy">Pregnancy (extra nourishing calories & folate)</option>
                    <option value="lactation">Nursing / Lactation (higher hydration & calories)</option>
                  </select>
                </Field>
              )}
            </StepContainer>
          )}

          {/* STEP 1: Body Dimensions */}
          {step === 1 && (
            <StepContainer
              icon={<Ruler className="w-7 h-7" />}
              title="Your Body Measurements"
              desc="Your height and weight tell us how much body mass you have, which dictates your daily fuel needs. You can enter in Metric or Imperial!"
            >
              {/* Height Field */}
              <Field
                label="How tall are you?"
                desc="Taller bodies have more surface area and burn slightly more energy."
                error={errors.height}
              >
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setHeightUnit('cm')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      heightUnit === 'cm'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    Centimeters (cm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeightUnit('ft')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      heightUnit === 'ft'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    Feet & Inches (ft / in)
                  </button>
                </div>

                {heightUnit === 'cm' ? (
                  <div className="relative">
                    <input
                      type="number"
                      value={profile.height || ''}
                      onChange={(e) => update('height', Number(e.target.value))}
                      className="input-field text-base sm:text-lg font-bold"
                      placeholder="e.g. 172"
                      min={90}
                      max={240}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                      cm ({heightFeet}'{heightInches}")
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type="number"
                        value={heightFeet}
                        onChange={(e) => handleFeetInchesChange(Number(e.target.value), heightInches)}
                        className="input-field font-bold"
                        min={3}
                        max={7}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                        feet
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={heightInches}
                        onChange={(e) => handleFeetInchesChange(heightFeet, Number(e.target.value))}
                        className="input-field font-bold"
                        min={0}
                        max={11}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                        inches
                      </span>
                    </div>
                  </div>
                )}

                {/* Helpful quick presets */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap text-xs text-stone-500">
                  <span className="text-[11px] font-semibold text-stone-400">Common:</span>
                  {[
                    { label: "5'4\" (163cm)", cm: 163 },
                    { label: "5'7\" (170cm)", cm: 170 },
                    { label: "5'10\" (178cm)", cm: 178 },
                    { label: "6'0\" (183cm)", cm: 183 },
                  ].map((p) => (
                    <button
                      key={p.cm}
                      type="button"
                      onClick={() => update('height', p.cm)}
                      className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 hover:bg-emerald-500/20 text-stone-700 dark:text-stone-300 text-[11px] font-medium"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Weight Field */}
              <Field
                label="How much do you weigh?"
                desc="Used to calculate your daily calories and your daily protein target (so your muscles stay strong)."
                error={errors.weight}
              >
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setWeightUnit('kg')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      weightUnit === 'kg'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    Kilograms (kg)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeightUnit('lbs')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      weightUnit === 'lbs'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    Pounds (lbs)
                  </button>
                </div>

                {weightUnit === 'kg' ? (
                  <div className="relative">
                    <input
                      type="number"
                      value={profile.weight || ''}
                      onChange={(e) => update('weight', Number(e.target.value))}
                      className="input-field text-base sm:text-lg font-bold"
                      placeholder="e.g. 70"
                      min={25}
                      max={280}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                      kg (approx {currentWeightLbs} lbs)
                    </span>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="number"
                      value={currentWeightLbs}
                      onChange={(e) => handleWeightLbsChange(Number(e.target.value))}
                      className="input-field text-base sm:text-lg font-bold"
                      placeholder="e.g. 154"
                      min={55}
                      max={600}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                      lbs ({profile.weight} kg)
                    </span>
                  </div>
                )}
              </Field>
            </StepContainer>
          )}

          {/* STEP 2: Lifestyle & Movement */}
          {step === 2 && (
            <StepContainer
              icon={<Activity className="w-7 h-7" />}
              title="Your Normal Daily Movement"
              desc="How much you move throughout the day determines how much extra energy your body burns on top of resting."
            >
              <div className="space-y-3">
                {beginnerActivityLevels.map((level) => (
                  <OptionCard
                    key={level.value}
                    selected={profile.activity === level.value}
                    onClick={() => update('activity', level.value)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl mt-0.5">{level.emoji}</span>
                        <div>
                          <div className="font-bold text-stone-900 dark:text-white text-sm sm:text-base">
                            {level.label}
                          </div>
                          <div className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                            {level.summary}
                          </div>
                          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-1">
                            💡 {level.clarification}
                          </div>
                        </div>
                      </div>
                      {profile.activity === level.value && (
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </OptionCard>
                ))}
              </div>
            </StepContainer>
          )}

          {/* STEP 3: Diet Preference */}
          {step === 3 && (
            <StepContainer
              icon={<Salad className="w-7 h-7" />}
              title="What Foods Do You Enjoy?"
              desc="We filter every single meal recommendation to perfectly honor your dietary traditions."
            >
              <div className="space-y-3">
                {dietOptions.map((diet) => (
                  <OptionCard
                    key={diet.value}
                    selected={profile.diet === diet.value}
                    onClick={() => update('diet', diet.value)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-stone-900 dark:text-white text-sm sm:text-base">
                          {diet.label}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                          {diet.desc}
                        </div>
                      </div>
                      {profile.diet === diet.value && (
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </OptionCard>
                ))}
              </div>
            </StepContainer>
          )}

          {/* STEP 4: Goals */}
          {step === 4 && (
            <StepContainer
              icon={<Target className="w-7 h-7" />}
              title="What Is Your Main Goal?"
              desc="We adjust your daily energy target to match this goal. No extreme diets—just sustainable progress!"
            >
              <div className="space-y-3">
                {beginnerGoals.map((g) => (
                  <OptionCard
                    key={g.value}
                    selected={profile.goal === g.value}
                    onClick={() => update('goal', g.value)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl mt-0.5">{g.emoji}</span>
                        <div>
                          <div className="font-bold text-stone-900 dark:text-white text-sm sm:text-base">
                            {g.label}
                          </div>
                          <div className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                            {g.summary}
                          </div>
                          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-1">
                            💡 {g.clarification}
                          </div>
                        </div>
                      </div>
                      {profile.goal === g.value && (
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </OptionCard>
                ))}
              </div>
            </StepContainer>
          )}

          {/* STEP 5: Preferences, Allergies & Kitchen Ingredients */}
          {step === 5 && (
            <StepContainer
              icon={<Settings2 className="w-7 h-7" />}
              title="Allergies & Kitchen Staples"
              desc="We exclude any foods that could make you feel unwell, and suggest meals made from ingredients you already have at home."
            >
              <Field
                label="Do you have any food allergies?"
                desc="Tap any that apply. If you don't have allergies, you can simply skip this."
              >
                <div className="flex flex-wrap gap-2">
                  {allergyOptions.map((a) => {
                    const selected = profile.allergies.includes(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() =>
                          update(
                            'allergies',
                            selected ? profile.allergies.filter((x) => x !== a) : [...profile.allergies, a]
                          )
                        }
                        className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all flex items-center gap-1.5 ${
                          selected
                            ? 'border-red-500 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 shadow-sm'
                            : 'border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 text-stone-700 dark:text-stone-300 bg-white dark:bg-[#1a1c22]'
                        }`}
                      >
                        {selected && <Check className="w-3.5 h-3.5 text-red-600 stroke-[3]" />}
                        <span>{a}</span>
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field
                label="Food Intolerances (Optional)"
                desc="Foods that give you bloating or discomfort (like lactose or gluten)."
              >
                <div className="flex flex-wrap gap-2">
                  {intoleranceOptions.map((t) => {
                    const selected = profile.intolerances.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() =>
                          update(
                            'intolerances',
                            selected ? profile.intolerances.filter((x) => x !== t) : [...profile.intolerances, t]
                          )
                        }
                        className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all flex items-center gap-1.5 ${
                          selected
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 shadow-sm'
                            : 'border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 text-stone-700 dark:text-stone-300 bg-white dark:bg-[#1a1c22]'
                        }`}
                      >
                        {selected && <Check className="w-3.5 h-3.5 text-amber-600 stroke-[3]" />}
                        <span>{t}</span>
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field
                label="What ingredients do you have in your kitchen?"
                desc="Type a few comma-separated foods you currently have at home (e.g. rice, dal, spinach, eggs, oats, paneer, potatoes). We'll make recipes that use what you already bought!"
              >
                <input
                  type="text"
                  value={profile.ingredients || ''}
                  onChange={(e) => update('ingredients', e.target.value)}
                  className="input-field text-sm"
                  placeholder="e.g. rice, dal, spinach, paneer, egg, oats, chicken..."
                />
              </Field>
            </StepContainer>
          )}
        </div>

        {/* Navigation Action Buttons with Explicit Answers to: "What happens when I press this?" */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={prev}
              className="btn-secondary px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2"
              title="What happens: Returns to the previous question to adjust your answer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{step === 0 ? backLabel : 'Back'}</span>
            </button>

            <button
              type="button"
              onClick={next}
              className="btn-primary px-7 py-3.5 text-sm sm:text-base font-extrabold flex items-center gap-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all"
              title={
                step === steps.length - 1
                  ? 'What happens: Calculates your complete plan and takes you to your results'
                  : 'What happens: Saves your response and opens the next step'
              }
            >
              <span>{step === steps.length - 1 ? submitLabel : `Continue to ${steps[step + 1].short}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center text-[11px] text-stone-500 dark:text-stone-400">
            {step === steps.length - 1 ? (
              <span>✨ Pressing '{submitLabel}' will build your personalized daily nutrition targets.</span>
            ) : (
              <span>
                👉 Pressing 'Continue' moves to Step {step + 2} of {steps.length}. You can always come back and change anything.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepContainer({
  icon,
  title,
  desc,
  children,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-3.5 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 flex-shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="font-display font-black text-xl sm:text-2xl text-stone-900 dark:text-white leading-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
            {desc}
          </p>
        </div>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

function Field({
  label,
  desc,
  error,
  children,
}: {
  label: string;
  desc?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-stone-800 dark:text-stone-200 mb-1">{label}</label>
      {desc && <p className="text-xs text-stone-500 dark:text-stone-400 mb-2 leading-relaxed">{desc}</p>}
      {children}
      {error && (
        <div className="flex items-start gap-2 mt-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-xs sm:text-sm text-red-700 dark:text-red-300 animate-fade-in font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`option-card transition-all ${
        selected
          ? 'option-card-selected border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
          : 'border-stone-200 dark:border-stone-700 hover:border-emerald-500/40'
      }`}
    >
      {children}
    </button>
  );
}
