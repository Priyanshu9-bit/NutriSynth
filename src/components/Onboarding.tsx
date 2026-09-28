import { useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check, User, Ruler, Activity, Salad, Target, Settings2, AlertCircle } from 'lucide-react';
import { activityLevels, goals, dietOptions, allergyOptions, intoleranceOptions } from '@/data/foods';
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
  { id: 0, label: "Personal", icon: User },
  { id: 1, label: "Body", icon: Ruler },
  { id: 2, label: "Lifestyle", icon: Activity },
  { id: 3, label: "Diet", icon: Salad },
  { id: 4, label: "Goals", icon: Target },
  { id: 5, label: "Preferences", icon: Settings2 },
];

export function Onboarding({ onComplete, onBack, initialProfile, backLabel = "Back to Home", submitLabel = "Build My Plan" }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>(initialProfile ?? {
    age: 30,
    gender: "male",
    height: 170,
    weight: 70,
    activity: 1.55,
    goal: "maintain",
    diet: "nonveg",
    allergies: [],
    intolerances: [],
    ingredients: "rice, dal, spinach, paneer, egg, chicken, potato, tomato, onion",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: keyof UserProfile, value: any) => {
    setProfile(p => ({ ...p, [key]: value }));
    setErrors(e => ({ ...e, [key]: "" }));
  };

  const validateStep = (): boolean => {
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (!profile.age || profile.age < 1 || profile.age > 120) errs.age = "Please enter an age between 1 and 120";
    }
    if (step === 1) {
      if (!profile.height || profile.height < 80 || profile.height > 250) errs.height = "Please enter a height between 80 and 250 cm";
      if (!profile.weight || profile.weight < 10 || profile.weight > 300) errs.weight = "Please enter a weight between 10 and 300 kg";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(profile);
    }
  };

  const prev = () => {
    if (step === 0) onBack();
    else setStep(step - 1);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-brand-50/30 via-white to-white py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-2">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isComplete = i < step;
              const isCurrent = i === step;
              return (
                <div key={s.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                        ${isComplete ? 'bg-brand-500 text-white' : isCurrent ? 'bg-brand-600 text-white ring-4 ring-brand-100' : 'bg-stone-200 text-stone-400'}`}
                    >
                      {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${isCurrent ? 'text-brand-700' : isComplete ? 'text-stone-700' : 'text-stone-400'}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex-1 h-0.5 mx-2 rounded-full bg-stone-200 relative overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 bg-brand-500 transition-all duration-500 ${isComplete ? 'w-full' : 'w-0'}`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div key={step} className="card-lg p-6 sm:p-8 animate-slide-in-right">
          {step === 0 && (
            <StepContainer icon={<User className="w-7 h-7" />} title="About You" desc="Let's start with some basic information.">
              <Field label="Age" error={errors.age}>
                <input
                  type="number"
                  value={profile.age || ""}
                  onChange={e => update("age", Number(e.target.value))}
                  className="input-field"
                  placeholder="e.g. 30"
                  min={1} max={120}
                />
              </Field>
              <Field label="Sex / Gender" desc="Used for calculating your basal metabolic rate. Reference values vary by sex where biologically relevant.">
                <div className="grid grid-cols-3 gap-3">
                  {(["male", "female", "other"] as Gender[]).map(g => (
                    <OptionCard key={g} selected={profile.gender === g} onClick={() => update("gender", g)}>
                      <span className="font-medium capitalize">{g}</span>
                    </OptionCard>
                  ))}
                </div>
              </Field>
              {profile.gender === "female" && (
                <Field label="Life Stage (optional)" desc="Affects calorie and nutrient recommendations.">
                  <select value={profile.femaleState || "none"} onChange={e => update("femaleState", e.target.value)} className="input-field">
                    <option value="none">None</option>
                    <option value="menstruation">Menstruating</option>
                    <option value="pregnancy">Pregnancy</option>
                    <option value="lactation">Lactation</option>
                  </select>
                </Field>
              )}
              {profile.gender === "female" && profile.femaleState === "pregnancy" && (
                <Field label="Pregnancy Month (1-9)">
                  <input
                    type="number"
                    value={profile.pregnancyMonth || 1}
                    onChange={e => update("pregnancyMonth", Number(e.target.value))}
                    className="input-field"
                    min={1} max={9}
                  />
                </Field>
              )}
            </StepContainer>
          )}

          {step === 1 && (
            <StepContainer icon={<Ruler className="w-7 h-7" />} title="Body Information" desc="We use height and weight to calculate your metabolic rate.">
              <Field label="Height (cm)" error={errors.height}>
                <input
                  type="number"
                  value={profile.height || ""}
                  onChange={e => update("height", Number(e.target.value))}
                  className="input-field"
                  placeholder="e.g. 170"
                  min={80} max={250}
                />
              </Field>
              <Field label="Weight (kg)" error={errors.weight}>
                <input
                  type="number"
                  value={profile.weight || ""}
                  onChange={e => update("weight", Number(e.target.value))}
                  className="input-field"
                  placeholder="e.g. 70"
                  min={10} max={300}
                />
              </Field>
            </StepContainer>
          )}

          {step === 2 && (
            <StepContainer icon={<Activity className="w-7 h-7" />} title="Lifestyle" desc="Your activity level determines how many calories you need daily.">
              <div className="space-y-3">
                {activityLevels.map(level => (
                  <OptionCard key={level.value} selected={profile.activity === level.value} onClick={() => update("activity", level.value)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-stone-900">{level.label}</div>
                        <div className="text-xs text-stone-500 mt-0.5">{level.desc}</div>
                      </div>
                      {profile.activity === level.value && <Check className="w-5 h-5 text-brand-600" />}
                    </div>
                  </OptionCard>
                ))}
              </div>
            </StepContainer>
          )}

          {step === 3 && (
            <StepContainer icon={<Salad className="w-7 h-7" />} title="Diet Preference" desc="We filter all meal recommendations based on your diet.">
              <div className="space-y-3">
                {dietOptions.map(diet => (
                  <OptionCard key={diet.value} selected={profile.diet === diet.value} onClick={() => update("diet", diet.value)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-stone-900">{diet.label}</div>
                        <div className="text-xs text-stone-500 mt-0.5">{diet.desc}</div>
                      </div>
                      {profile.diet === diet.value && <Check className="w-5 h-5 text-brand-600" />}
                    </div>
                  </OptionCard>
                ))}
              </div>
            </StepContainer>
          )}

          {step === 4 && (
            <StepContainer icon={<Target className="w-7 h-7" />} title="Your Goal" desc="We adjust your calorie target based on your goal.">
              <div className="space-y-3">
                {goals.map(g => (
                  <OptionCard key={g.value} selected={profile.goal === g.value} onClick={() => update("goal", g.value)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-stone-900">{g.label}</div>
                        <div className="text-xs text-stone-500 mt-0.5">{g.desc}</div>
                      </div>
                      {profile.goal === g.value && <Check className="w-5 h-5 text-brand-600" />}
                    </div>
                  </OptionCard>
                ))}
              </div>
            </StepContainer>
          )}

          {step === 5 && (
            <StepContainer icon={<Settings2 className="w-7 h-7" />} title="Preferences & Restrictions" desc="We exclude foods that don't match your restrictions.">
              <Field label="Allergies (select all that apply)">
                <div className="flex flex-wrap gap-2">
                  {allergyOptions.map(a => {
                    const selected = profile.allergies.includes(a);
                    return (
                      <button
                        key={a}
                        onClick={() => update("allergies", selected ? profile.allergies.filter(x => x !== a) : [...profile.allergies, a])}
                        className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all
                          ${selected ? 'border-red-400 bg-red-50 text-red-700' : 'border-stone-200 hover:border-stone-300 text-stone-700'}`}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Intolerances (optional)">
                <div className="flex flex-wrap gap-2">
                  {intoleranceOptions.map(t => {
                    const selected = profile.intolerances.includes(t);
                    return (
                      <button
                        key={t}
                        onClick={() => update("intolerances", selected ? profile.intolerances.filter(x => x !== t) : [...profile.intolerances, t])}
                        className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all
                          ${selected ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-stone-200 hover:border-stone-300 text-stone-700'}`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Available ingredients (optional)" desc="Comma-separated list of ingredients you have. We'll match meals to these.">
                <input
                  type="text"
                  value={profile.ingredients || ""}
                  onChange={e => update("ingredients", e.target.value)}
                  className="input-field"
                  placeholder="rice, dal, spinach, paneer, egg, chicken..."
                />
              </Field>
            </StepContainer>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <button onClick={prev} className="btn-ghost">
            <ArrowLeft className="w-4 h-4" />
            {step === 0 ? backLabel : "Back"}
          </button>
          <button onClick={next} className="btn-primary">
            {step === steps.length - 1 ? submitLabel : "Continue"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StepContainer({ icon, title, desc, children }: { icon: ReactNode; title: string; desc: string; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-600 flex items-center justify-center text-white">
          {icon}
        </div>
        <div>
          <h2 className="font-display font-bold text-2xl text-stone-900">{title}</h2>
          <p className="text-sm text-stone-500 mt-0.5">{desc}</p>
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, desc, error, children }: { label: string; desc?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-stone-700 mb-1.5">{label}</label>
      {desc && <p className="text-xs text-stone-500 mb-2">{desc}</p>}
      {children}
      {error && (
        <div className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600 animate-fade-in">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}

function OptionCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`option-card ${selected ? 'option-card-selected' : ''}`}
    >
      {children}
    </button>
  );
}
