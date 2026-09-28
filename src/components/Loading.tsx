import { useEffect, useState } from 'react';
import { Activity, ChefHat, Beaker, Dna, CheckCircle2, Sparkles } from 'lucide-react';

interface LoadingProps {
  onComplete: () => void;
}

const loadingMessages = [
  { icon: Activity, text: "Analyzing your nutritional profile..." },
  { icon: ChefHat, text: "Building compatible meals..." },
  { icon: Beaker, text: "Checking nutritional balance..." },
  { icon: Dna, text: "Preparing your personalized plan..." },
];

export function LoadingScreen({ onComplete }: LoadingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep >= loadingMessages.length) {
      const timer = setTimeout(onComplete, 600);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setCurrentStep(s => s + 1), 800);
    return () => clearTimeout(timer);
  }, [currentStep, onComplete]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-brand-50/30 to-white px-4">
      <div className="max-w-md w-full text-center">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full bg-brand-100 animate-pulse-soft" />
          <div className="absolute inset-0 rounded-full border-4 border-brand-200" />
          <div className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-brand-600" />
          </div>
        </div>

        <h2 className="font-display font-bold text-2xl text-stone-900 mb-2">Your NutriSynth profile is ready</h2>
        <p className="text-stone-500 mb-8">Let's build your personalized nutrition plan.</p>

        <div className="space-y-3 text-left">
          {loadingMessages.map((msg, i) => {
            const Icon = msg.icon;
            const isDone = i < currentStep;
            const isCurrent = i === currentStep;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300
                  ${isDone ? 'bg-brand-50 opacity-100' : isCurrent ? 'bg-white shadow-card opacity-100' : 'opacity-40'}`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                  ${isDone ? 'bg-brand-500 text-white' : isCurrent ? 'bg-brand-100 text-brand-600' : 'bg-stone-100 text-stone-400'}`}>
                  {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-sm font-medium ${isDone ? 'text-brand-700' : isCurrent ? 'text-stone-900' : 'text-stone-400'}`}>
                  {msg.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
