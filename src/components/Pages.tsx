import { ArrowRight, Heart, Activity, ChefHat, Beaker, Dna, Scale, BookOpen, Info, Shield } from 'lucide-react';
import type { View } from '@/components/Layout';

interface HowItWorksProps {
  onStart: () => void;
  onNavigate: (view: View) => void;
}

const steps = [
  { icon: Heart, title: "Tell us about yourself", desc: "Share your age, body metrics, lifestyle, and dietary preferences through a guided multi-step flow." },
  { icon: Activity, title: "NutriSynth estimates your needs", desc: "We calculate your BMR using the Mifflin-St Jeor equation, determine TDEE based on activity level, and allocate macros — all using established nutrition science." },
  { icon: ChefHat, title: "Get personalized meal recommendations", desc: "Receive 3 daily meals filtered by your diet type, allergies, intolerances, and available ingredients. Each meal includes estimated nutrition data." },
  { icon: Beaker, title: "Understand strengths and limitations", desc: "Every meal includes a Food Analysis section identifying potential nutritional limitations in context — not labeling foods as 'bad.'" },
  { icon: Scale, title: "Improve your meals with solutions", desc: "Get evidence-based suggestions with before/after nutrition comparisons. See exactly how a modification impacts your nutrient intake." },
  { icon: Dna, title: "Check potential nutrient inadequacies", desc: "A dedicated screening page evaluates 16 nutrients against RDI values, with optional lab result comparison." },
];

export function HowItWorks({ onStart, onNavigate }: HowItWorksProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#101D2D] text-[#34D399] border border-[#1E293B] text-sm font-semibold mb-4">
            <Info className="w-4 h-4 text-[#2DD4BF]" /> How It Works
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#F8FAFC] mb-4 text-balance">
            Your path to evidence-based nutrition
          </h1>
          <p className="text-lg text-[#CBD5E1] text-balance max-w-2xl mx-auto">
            NutriSynth uses established nutrition equations and reference data to estimate your needs and build personalized meal plans.
          </p>
        </div>

        <div className="space-y-4 mb-12">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="card p-6 flex items-start gap-5 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#22C55E] to-[#2DD4BF] flex items-center justify-center text-[#07111F] font-bold">
                    <Icon className="w-6 h-6" />
                  </div>
                  {i < steps.length - 1 && <div className="w-0.5 h-full bg-[#1E293B] mt-2 min-h-[20px]" />}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-[#2DD4BF] mb-1">Step {i + 1}</div>
                  <h3 className="font-display font-semibold text-lg text-[#F8FAFC] mb-1">{step.title}</h3>
                  <p className="text-sm text-[#CBD5E1] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Evidence & Transparency */}
        <div className="card-lg p-8 mb-8 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#60A5FA]/10 flex items-center justify-center border border-[#60A5FA]/20">
              <BookOpen className="w-5 h-5 text-[#60A5FA]" />
            </div>
            <h2 className="font-display font-bold text-xl text-[#F8FAFC]">Scientific Transparency</h2>
          </div>
          <p className="text-[#CBD5E1] mb-4">
            NutriSynth is built using recognized nutrition reference data. We do not claim "100% scientific accuracy" — instead, we show you the evidence basis for every major calculation and recommendation.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              "Mifflin-St Jeor Equation — BMR estimation",
              "ICMR-NIN — Recommended Dietary Allowances",
              "NIH Office of Dietary Supplements — Nutrient references",
              "USDA FoodData Central — Food composition data",
              "National Academies — Dietary Reference Intakes",
              "WHO — Vitamin and mineral requirements",
            ].map((src, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-[#CBD5E1]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF]" />
                {src}
              </div>
            ))}
          </div>
        </div>

        {/* Limitations */}
        <div className="card p-6 mb-8 border-amber-500/30 bg-amber-950/20 animate-fade-in" style={{ animationDelay: '460ms' }}>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-amber-400" />
            <h2 className="font-display font-semibold text-lg text-[#F8FAFC]">Limitations</h2>
          </div>
          <ul className="space-y-2 text-sm text-[#CBD5E1]">
            <li className="flex items-start gap-2"><span className="text-amber-400 mt-1">•</span> Meal nutrition values are estimates and vary with preparation methods and portion sizes.</li>
            <li className="flex items-start gap-2"><span className="text-amber-400 mt-1">•</span> Deficiency screening uses estimated intake, not clinical diagnosis.</li>
            <li className="flex items-start gap-2"><span className="text-amber-400 mt-1">•</span> Individual needs vary with health conditions, medications, and other factors.</li>
            <li className="flex items-start gap-2"><span className="text-amber-400 mt-1">•</span> Always consult a qualified healthcare professional for medical guidance.</li>
          </ul>
        </div>

        <div className="text-center animate-fade-in" style={{ animationDelay: '520ms' }}>
          <button onClick={onStart} className="btn-primary text-base px-8 py-4">
            Start Your Nutrition Journey
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function About({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#22C55E] to-[#2DD4BF] flex items-center justify-center text-[#07111F] font-black shadow-lg shadow-emerald-500/20">
            <Info className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="font-display font-bold text-3xl text-[#F8FAFC] mb-3">About NutriSynth</h1>
          <p className="text-lg text-[#CBD5E1] text-balance">
            Evidence-based personalized nutrition planning — built to help you understand your nutritional needs, not to replace professional advice.
          </p>
        </div>

        <div className="space-y-6">
          <div className="card p-6 animate-fade-in" style={{ animationDelay: '60ms' }}>
            <h2 className="font-display font-semibold text-xl text-[#F8FAFC] mb-3">Our Mission</h2>
            <p className="text-[#CBD5E1] leading-relaxed">
              NutriSynth transforms complex nutrition science into an accessible, personalized experience. We estimate your daily nutritional requirements, suggest meals that match your preferences, and help you understand both the strengths and limitations of your dietary pattern.
            </p>
          </div>

          <div className="card p-6 animate-fade-in" style={{ animationDelay: '120ms' }}>
            <h2 className="font-display font-semibold text-xl text-[#F8FAFC] mb-3">What We Do</h2>
            <ul className="space-y-3 text-[#CBD5E1]">
              <li className="flex items-start gap-3"><Activity className="w-5 h-5 text-[#2DD4BF] mt-0.5 flex-shrink-0" /> Calculate BMR, TDEE, and macro targets using established equations</li>
              <li className="flex items-start gap-3"><ChefHat className="w-5 h-5 text-[#2DD4BF] mt-0.5 flex-shrink-0" /> Generate meal plans filtered by diet, allergies, and available ingredients</li>
              <li className="flex items-start gap-3"><Beaker className="w-5 h-5 text-[#2DD4BF] mt-0.5 flex-shrink-0" /> Analyze meals and daily diet for nutritional balance and potential gaps</li>
              <li className="flex items-start gap-3"><Dna className="w-5 h-5 text-[#2DD4BF] mt-0.5 flex-shrink-0" /> Screen 16 nutrients against reference values, with optional lab comparison</li>
              <li className="flex items-start gap-3"><Scale className="w-5 h-5 text-[#2DD4BF] mt-0.5 flex-shrink-0" /> Suggest smart substitutions that respect your dietary restrictions</li>
            </ul>
          </div>

          <div className="card p-6 animate-fade-in" style={{ animationDelay: '180ms' }}>
            <h2 className="font-display font-semibold text-xl text-[#F8FAFC] mb-3">What We Don't Do</h2>
            <ul className="space-y-2 text-[#CBD5E1]">
              <li className="flex items-start gap-2"><span className="text-red-400 mt-1">✗</span> Diagnose medical conditions or nutrient deficiencies</li>
              <li className="flex items-start gap-2"><span className="text-red-400 mt-1">✗</span> Replace professional medical or dietary advice</li>
              <li className="flex items-start gap-2"><span className="text-red-400 mt-1">✗</span> Claim "100% scientific accuracy"</li>
              <li className="flex items-start gap-2"><span className="text-red-400 mt-1">✗</span> Require login, payment, or personal accounts</li>
            </ul>
          </div>

          <div className="card p-6 bg-amber-950/20 border-amber-500/30 animate-fade-in" style={{ animationDelay: '240ms' }}>
            <h2 className="font-display font-semibold text-lg text-[#F8FAFC] mb-2">Medical Safety</h2>
            <p className="text-sm text-[#CBD5E1] leading-relaxed">
              NutriSynth provides evidence-based general nutrition information and personalized dietary guidance based on the information provided. It does not diagnose medical conditions or confirm nutrient deficiencies. Nutritional needs can vary with health conditions, medications, allergies, laboratory findings, and other factors. Consult a qualified healthcare professional when appropriate.
            </p>
          </div>

          <div className="text-center pt-4">
            <button onClick={onStart} className="btn-primary">
              Start Your Nutrition Journey
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
