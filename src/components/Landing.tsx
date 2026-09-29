import { ArrowRight, Sparkles, Heart, Activity, Dna, ChefHat, Beaker, BookOpen, Scale, LogIn, LayoutDashboard, Trophy, Flame, HelpCircle, CheckCircle2, Lightbulb } from 'lucide-react';
import type { View } from '@/components/Layout';
import type { AuthUser } from '@/lib/firebase';

interface LandingProps {
  onStart: () => void;
  onNavigate: (view: View) => void;
  onOpenAuth?: (mode?: 'signin' | 'signup') => void;
  authUser?: AuthUser | null;
  hasProfile?: boolean;
}

const howItWorksSteps = [
  { num: "01", title: "Answer 4 Simple Questions", desc: "Share your height, weight, activity, and food preferences. No complicated tests needed.", icon: Heart },
  { num: "02", title: "We Calculate Your Energy Needs", desc: "We figure out your exact daily food calories and protein targets so you never do math.", icon: Activity },
  { num: "03", title: "Pick Easy, Real Meals", desc: "Choose from delicious, everyday recipes that match your daily target, with auto shopping lists.", icon: ChefHat },
  { num: "04", title: "Log Food in 1 Tap", desc: "Snap a photo or tap popular everyday foods (like eggs, rice, apples) to log meals in seconds.", icon: Scale },
  { num: "05", title: "Build Lifelong Daily Habits", desc: "Drink enough water, tick off 1 small mission a day, and keep your daily streak alive.", icon: Flame },
  { num: "06", title: "Check Essential Vitamins", desc: "Easily see if your meals provide enough Iron, Vitamin D, and Calcium to keep you energized.", icon: Dna },
];

const features = [
  { icon: ChefHat, title: "Simple, Real Meals", desc: "Home-cooked recipes tailored to your body and dietary preferences.", color: "from-brand-500 to-emerald-600" },
  { icon: Activity, title: "Zero-Math Nutrition", desc: "Clear daily energy targets explained in plain everyday words without confusing charts.", color: "from-sky-500 to-blue-600" },
  { icon: Scale, title: "Hand-Size Portions", desc: "No food scale required. Use your palm, fist, and cupped hand to measure food anywhere.", color: "from-amber-500 to-orange-600" },
  { icon: Dna, title: "Vitamin & Mineral Check", desc: "Check common signs like fatigue or brittle nails to see what vitamins you might need.", color: "from-rose-500 to-pink-600" },
  { icon: Flame, title: "Daily Habit Streaks", desc: "Small daily steps and water reminders that make healthy eating fun and consistent.", color: "from-teal-500 to-cyan-600" },
  { icon: BookOpen, title: "Plain-English Glossary", desc: "An instant dictionary translating calories, protein, and nutrients into simple concepts.", color: "from-violet-500 to-indigo-600" },
];

export function Landing({ onStart, onNavigate, onOpenAuth, authUser, hasProfile }: LandingProps) {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#07111F] via-[#07111F] to-[#0B0F0E] grid-bg">
        <div className="absolute inset-0 bg-gradient-to-t from-[#07111F] via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-20 sm:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#22C55E]/15 text-[#34D399] text-xs sm:text-sm font-semibold mb-6 animate-fade-in shadow-sm border border-[#22C55E]/30">
                <img src="/logo.jpg" alt="NutriSynth" className="w-5 h-5 rounded-md object-cover shadow-sm" />
                <span>Precision Nutrition & Meal Tracking Made Simple</span>
              </div>
              <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-[#F8FAFC] leading-[1.1] text-balance">
                Healthy Eating.
                <br />
                <span className="bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] bg-clip-text text-transparent">
                  Made Ridiculously Simple.
                </span>
              </h1>
              <p className="mt-6 text-base sm:text-lg text-[#CBD5E1] leading-relaxed max-w-xl text-balance">
                Never used a fitness or nutrition app before? You're in the right place. No complicated math, no confusing charts, and no starvation diets. Just clear answers, easy meal ideas, and gentle daily habits.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                {hasProfile ? (
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className="btn-primary text-base px-8 py-4 flex items-center justify-center gap-2 bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] hover:opacity-95 shadow-xl shadow-emerald-500/25 font-bold"
                    title="What happens: Opens your personalized daily dashboard with your food and water logs"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span>Open My Nutrition Dashboard</span>
                  </button>
                ) : (
                  <button
                    onClick={onStart}
                    className="btn-primary text-base px-8 py-4 flex items-center justify-center gap-2 bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] hover:opacity-95 shadow-xl shadow-emerald-500/25 font-bold"
                    title="What happens: Takes 60 seconds to answer 4 quick questions and get your personalized daily meal plan"
                  >
                    <span>✨ Build My Simple Plan (60s)</span>
                    <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                  </button>
                )}

                <button
                  onClick={() => onNavigate('challenge')}
                  className="btn-secondary text-base px-6 py-4 flex items-center justify-center gap-2 border-emerald-500/50 text-emerald-700 dark:text-[#34D399] bg-emerald-50/60 dark:bg-[#101D2D] font-bold hover:border-emerald-600"
                  title="What happens: Opens the 30-day healthy habit roadmap where you can build consistency"
                >
                  <Trophy className="w-5 h-5 text-emerald-600 dark:text-[#34D399]" />
                  <span>30-Day Road-map</span>
                </button>

                {!authUser && onOpenAuth && (
                  <button
                    onClick={() => onOpenAuth('signin')}
                    className="btn-secondary text-base px-6 py-4 flex items-center justify-center gap-2"
                    title="What happens: Lets you log into an existing account or register"
                  >
                    <LogIn className="w-5 h-5 text-[#60A5FA]" />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
              <div className="mt-8 flex items-center gap-6 justify-center lg:justify-start text-xs sm:text-sm text-stone-500 dark:text-[#8492A6]">
                <span className="flex items-center gap-1.5"><CheckIcon /> 100% Free & Easy to Use</span>
                <span className="flex items-center gap-1.5"><CheckIcon /> No food scale required</span>
              </div>
            </div>

            {/* Hero Visual — Friendly Dashboard Preview */}
            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-3xl blur-2xl pointer-events-none" />
              <div className="relative card-lg p-6 space-y-4 bg-[#0B0F0E]/95 border border-[#1E293B] shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[#8492A6] font-medium">Daily Energy Target (Calories)</div>
                    <div className="metric-value text-2xl text-[#F8FAFC] font-black">2,100 kcal</div>
                    <span className="text-[11px] text-[#34D399] font-semibold">Healthy, sustainable daily food fuel</span>
                  </div>
                  <img
                    src="/logo.jpg"
                    alt="NutriSynth"
                    className="w-12 h-12 rounded-2xl object-cover shadow-md ring-2 ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Muscle Fuel (Protein)", val: 90, max: 90, color: "bg-emerald-500", note: "Builds & repairs body tissue" },
                    { label: "Quick Energy (Carbs)", val: 240, max: 260, color: "bg-[#60A5FA]", note: "Powers your daily activity" },
                    { label: "Healthy Fats", val: 60, max: 60, color: "bg-amber-500", note: "Supports hormones & joints" },
                    { label: "Digestion Fuel (Fiber)", val: 28, max: 35, color: "bg-[#2DD4BF]", note: "Keeps gut smooth & full" },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-[#CBD5E1] font-bold">{m.label}</span>
                        <span className="text-[#F8FAFC] font-extrabold tabular-nums">{m.val}g</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#101D2D] overflow-hidden">
                        <div className={`h-full rounded-full ${m.color} transition-all duration-1000 ease-out`} style={{ width: `${(m.val/m.max)*100}%` }} />
                      </div>
                      <span className="text-[10px] text-[#8492A6]">{m.note}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2.5 pt-2">
                  <div className="rounded-xl bg-emerald-950/40 p-2.5 text-center border border-emerald-500/20">
                    <ChefHat className="w-4 h-4 text-[#34D399] mx-auto mb-1" />
                    <div className="text-[11px] text-[#CBD5E1] font-bold">3 Meals + Snack</div>
                  </div>
                  <div className="rounded-xl bg-[#60A5FA]/10 p-2.5 text-center border border-[#60A5FA]/20">
                    <Dna className="w-4 h-4 text-[#60A5FA] mx-auto mb-1" />
                    <div className="text-[11px] text-[#CBD5E1] font-bold">16 Vitamins</div>
                  </div>
                  <div className="rounded-xl bg-amber-950/40 p-2.5 text-center border border-amber-500/20">
                    <Flame className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    <div className="text-[11px] text-[#CBD5E1] font-bold">Daily Streak</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Golden Questions Callout for Absolute Beginners */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 sm:-mt-12 relative z-20 mb-12">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#07111F] via-[#0B0F0E] to-[#101D2D] border border-emerald-500/25 text-white shadow-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              💡
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              How NutriSynth Works For You:
            </span>
          </div>
          <div className="grid md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
              <span className="text-xs font-bold text-emerald-400 block">1. What is NutriSynth?</span>
              <p className="text-xs text-stone-300 leading-relaxed">
                A simple nutrition guide that tells you what healthy foods to eat and how much to eat—without confusing jargon or counting calories on paper.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
              <span className="text-xs font-bold text-emerald-400 block">2. What should I do first?</span>
              <p className="text-xs text-stone-300 leading-relaxed">
                Tap the green button <strong>"Build My Simple Plan"</strong>. Answer 4 quick questions about your routine and goals in 60 seconds.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
              <span className="text-xs font-bold text-emerald-400 block">3. What happens next?</span>
              <p className="text-xs text-stone-300 leading-relaxed">
                You immediately get personalized daily meal ideas, hand-size portion guides, a grocery checklist, and 1-tap food logging.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Friendly Two-Mode Section: Know What You Are Doing */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 mb-16">
        <div className="text-center mb-6">
          <span className="px-3.5 py-1.5 rounded-full bg-[#101D2D] text-[#CBD5E1] text-xs font-bold border border-[#1E293B]">
            🧭 Choose Where to Start
          </span>
          <h2 className="text-xl sm:text-2xl font-display font-extrabold text-[#F8FAFC] mt-2">
            Two Easy Ways to Use NutriSynth
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Track 1: My Nutrition Plan */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0B0F0E] border-2 border-emerald-500/30 shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-[#34D399] text-xs font-bold">
                <ChefHat className="w-3.5 h-3.5" />
                Track 1: Personalized Food & Meal Plan
              </div>
              <h3 className="font-display font-extrabold text-2xl text-[#F8FAFC]">
                My Food Plan & Daily Targets
              </h3>
              <p className="text-sm text-[#CBD5E1] leading-relaxed">
                Find out exactly how much daily food energy you need, get delicious home-cooked meal ideas, and log your meals with one tap.
              </p>
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#8492A6] pt-1">
                <span className="px-2.5 py-1 rounded-lg bg-[#101D2D] text-[#CBD5E1]">🥗 Simple Meal Ideas</span>
                <span className="px-2.5 py-1 rounded-lg bg-[#101D2D] text-[#CBD5E1]">📸 1-Tap Food Logger</span>
                <span className="px-2.5 py-1 rounded-lg bg-[#101D2D] text-[#CBD5E1]">🛒 Grocery Shopping List</span>
              </div>
            </div>
            <div className="pt-6">
              {hasProfile ? (
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 hover:opacity-95 active:scale-98 transition-all"
                  title="Opens your daily food tracking dashboard"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Open My Nutrition Dashboard</span>
                </button>
              ) : (
                <button
                  onClick={onStart}
                  className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 hover:opacity-95 active:scale-98 transition-all"
                  title="Start the 60-second setup to get your meal plan"
                >
                  <span>Build My Simple Food Plan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Track 2: 30-Day Nutrition Challenge */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0B0F0E] to-[#101D2D] border-2 border-amber-500/30 shadow-xl shadow-amber-500/5 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
                <Trophy className="w-3.5 h-3.5" />
                Track 2: 30-Day Habit Journey
              </div>
              <h3 className="font-display font-extrabold text-2xl text-[#F8FAFC]">
                30-Day Road-map & Daily Streak
              </h3>
              <p className="text-sm text-[#CBD5E1] leading-relaxed">
                Take on 30 bite-sized daily missions! Log your water glasses, complete daily habit to-dos, unlock milestone trophies, and build consistency.
              </p>
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#8492A6] pt-1">
                <span className="px-2.5 py-1 rounded-lg bg-[#101D2D] text-[#CBD5E1]">💧 Water Logging</span>
                <span className="px-2.5 py-1 rounded-lg bg-[#101D2D] text-[#CBD5E1]">🔥 Daily Streaks</span>
                <span className="px-2.5 py-1 rounded-lg bg-[#101D2D] text-[#CBD5E1]">🏆 30 Habit Missions</span>
              </div>
            </div>
            <div className="pt-6 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => onNavigate('challenge')}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 hover:opacity-95 active:scale-98 transition-all"
                title="View the complete 30-day journey and milestones"
              >
                <Trophy className="w-4 h-4" />
                <span>30-Day Road-map</span>
              </button>
              <button
                onClick={() => onNavigate('today-streak')}
                className="py-3.5 px-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-bold text-sm flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                title="Focus on today's single mission and checklist"
              >
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Today's Habits</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-sm font-semibold text-[#2DD4BF] uppercase tracking-wider mb-2">How It Works</div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#F8FAFC]">Your path to better nutrition</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {howItWorksSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="card p-6 hover:shadow-card-lg transition-shadow group"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#22C55E] to-[#2DD4BF] flex items-center justify-center text-[#07111F] font-black flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#2DD4BF] mb-1">{step.num}</div>
                      <h3 className="font-display font-semibold text-lg text-[#F8FAFC] mb-1">{step.title}</h3>
                      <p className="text-sm text-[#CBD5E1] leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why NutriSynth */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-b from-[#07111F] to-[#0B0F0E]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-sm font-semibold text-[#2DD4BF] uppercase tracking-wider mb-2">Why NutriSynth?</div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#F8FAFC]">Everything you need to eat smarter</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="card p-6 hover:shadow-card-lg transition-all hover:-translate-y-0.5">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-[#F8FAFC] mb-2">{f.title}</h3>
                  <p className="text-sm text-[#CBD5E1] leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#F8FAFC] mb-4 text-balance">
            Ready to understand your nutrition?
          </h2>
          <p className="text-lg text-[#CBD5E1] mb-8 text-balance">
            Build your personalized nutrition plan in minutes. No login, no payment — just evidence-based guidance.
          </p>
          <button onClick={onStart} className="btn-primary text-base px-8 py-4 mx-auto">
            Start Your Nutrition Journey
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
