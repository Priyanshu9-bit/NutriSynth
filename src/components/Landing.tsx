import { ArrowRight, Sparkles, Heart, Activity, Dna, ChefHat, Beaker, BookOpen, Scale, TrendingDown, TrendingUp } from 'lucide-react';
import type { View } from '@/components/Layout';

interface LandingProps {
  onStart: () => void;
  onNavigate: (view: View) => void;
}

const howItWorksSteps = [
  { num: "01", title: "Tell us about yourself", desc: "Share your age, body metrics, lifestyle, and dietary preferences.", icon: Heart },
  { num: "02", title: "NutriSynth estimates your needs", desc: "We calculate your BMR, TDEE, protein, and macro targets using established equations.", icon: Activity },
  { num: "03", title: "Get personalized meal recommendations", desc: "Receive meal plans filtered by your diet, allergies, and available ingredients.", icon: ChefHat },
  { num: "04", title: "Understand strengths and limitations", desc: "Each meal includes analysis of nutritional contributions and potential gaps.", icon: Beaker },
  { num: "05", title: "Improve your meals with solutions", desc: "Get evidence-based suggestions and see before/after nutrition comparisons.", icon: Scale },
  { num: "06", title: "Check potential nutrient inadequacies", desc: "Screen your dietary pattern for possible nutrient gaps on a dedicated page.", icon: Dna },
];

const features = [
  { icon: ChefHat, title: "Personalized Meals", desc: "Meals based on your information and nutritional targets.", color: "from-brand-500 to-emerald-600" },
  { icon: Activity, title: "Nutrition Analysis", desc: "Understand calories, protein, carbs, fats, fiber, and relevant micronutrients.", color: "from-sky-500 to-blue-600" },
  { icon: Beaker, title: "Food Analysis", desc: "Understand potential nutritional limitations and how to improve them.", color: "from-amber-500 to-orange-600" },
  { icon: Dna, title: "Nutrient Status", desc: "Separate screening for potential nutrient inadequacy.", color: "from-rose-500 to-pink-600" },
  { icon: Scale, title: "Smart Substitution", desc: "Find compatible alternatives that respect your dietary restrictions.", color: "from-teal-500 to-cyan-600" },
  { icon: BookOpen, title: "Evidence-Based", desc: "See the reference basis behind major nutritional guidance.", color: "from-violet-500 to-indigo-600" },
];

export function Landing({ onStart, onNavigate }: LandingProps) {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-emerald-50/40 grid-bg">
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-24 sm:pt-24 sm:pb-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium mb-6 animate-fade-in">
                <Sparkles className="w-4 h-4" />
                Evidence-Based Nutrition Planning
              </div>
              <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-stone-900 leading-[1.1] text-balance">
                Personalized Nutrition.
                <br />
                <span className="bg-gradient-to-r from-brand-600 to-emerald-600 bg-clip-text text-transparent">
                  Powered by Data.
                </span>
              </h1>
              <p className="mt-6 text-lg text-stone-600 leading-relaxed max-w-xl text-balance">
                Understand your nutritional needs, discover personalized meals, identify potential dietary gaps, and improve your meals with evidence-based guidance.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <button onClick={onStart} className="btn-primary text-base px-8 py-4">
                  Start Your Nutrition Journey
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button onClick={() => onNavigate('how-it-works')} className="btn-secondary text-base px-8 py-4">
                  Explore NutriSynth
                </button>
              </div>
              <div className="mt-8 flex items-center gap-6 justify-center lg:justify-start text-sm text-stone-500">
                <span className="flex items-center gap-1.5"><CheckIcon /> No login required</span>
                <span className="flex items-center gap-1.5"><CheckIcon /> Works offline</span>
              </div>
            </div>

            {/* Hero Visual — Dashboard Preview */}
            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 bg-gradient-to-br from-brand-200/30 to-emerald-200/20 rounded-3xl blur-2xl" />
              <div className="relative card-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-stone-500 font-medium">Daily Target</div>
                    <div className="metric-value text-2xl text-stone-900">2,400 kcal</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-600 flex items-center justify-center text-white">
                    <Activity className="w-6 h-6" />
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Protein", val: 95, max: 95, color: "bg-brand-500" },
                    { label: "Carbohydrates", val: 270, max: 300, color: "bg-sky-500" },
                    { label: "Fat", val: 67, max: 67, color: "bg-amber-500" },
                    { label: "Fiber", val: 25, max: 38, color: "bg-teal-500" },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-stone-600 font-medium">{m.label}</span>
                        <span className="text-stone-900 font-semibold tabular-nums">{m.val}g</span>
                      </div>
                      <div className="h-2 rounded-full bg-stone-200 overflow-hidden">
                        <div className={`h-full rounded-full ${m.color} transition-all duration-1000 ease-out`} style={{ width: `${(m.val/m.max)*100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="rounded-xl bg-brand-50 p-3 text-center">
                    <ChefHat className="w-5 h-5 text-brand-600 mx-auto mb-1" />
                    <div className="text-xs text-stone-600 font-medium">3 Meals</div>
                  </div>
                  <div className="rounded-xl bg-sky-50 p-3 text-center">
                    <Dna className="w-5 h-5 text-sky-600 mx-auto mb-1" />
                    <div className="text-xs text-stone-600 font-medium">16 Nutrients</div>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-3 text-center">
                    <Beaker className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                    <div className="text-xs text-stone-600 font-medium">Food Analysis</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-sm font-semibold text-brand-600 uppercase tracking-wider mb-2">How It Works</div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-stone-900">Your path to better nutrition</h2>
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
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-600 flex items-center justify-center text-white flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-brand-500 mb-1">{step.num}</div>
                      <h3 className="font-display font-semibold text-lg text-stone-900 mb-1">{step.title}</h3>
                      <p className="text-sm text-stone-600 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why NutriSynth */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-b from-white to-brand-50/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-sm font-semibold text-brand-600 uppercase tracking-wider mb-2">Why NutriSynth?</div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-stone-900">Everything you need to eat smarter</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="card p-6 hover:shadow-card-lg transition-all hover:-translate-y-0.5">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-stone-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-stone-600 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-stone-900 mb-4 text-balance">
            Ready to understand your nutrition?
          </h2>
          <p className="text-lg text-stone-600 mb-8 text-balance">
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
