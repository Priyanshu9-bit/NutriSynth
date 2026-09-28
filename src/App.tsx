import { useState } from 'react';
import { Header, Footer, type View } from '@/components/Layout';
import { Landing } from '@/components/Landing';
import { HowItWorks, About } from '@/components/Pages';
import { Onboarding } from '@/components/Onboarding';
import { LoadingScreen } from '@/components/Loading';
import { ResultIntro } from '@/components/ResultIntro';
import { Dashboard } from '@/components/Dashboard';
import { DeficiencyCheck } from '@/components/DeficiencyCheck';
import { computeNutrition, type NutritionResult, type UserProfile, type MealItem } from '@/lib/calculations';
import { Chatbot } from '@/components/Chatbot';

// The onboarding/loading/result-intro screens are full-bleed transitional
// states that sit outside the normal site chrome (no header/footer), so the
// app's phase is a superset of the persistent nav's `View` type.
type Phase = View | 'onboarding' | 'loading' | 'result-intro';

const CHROME_HIDDEN: Phase[] = ['onboarding', 'loading', 'result-intro'];

function App() {
  const [phase, setPhase] = useState<Phase>('landing');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [result, setResult] = useState<NutritionResult | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [calcError, setCalcError] = useState(false);

  const goTo = (next: Phase) => {
    setPhase(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (view: View) => {
    // Safety net: the header already disables these links without a profile,
    // but guard here too in case navigation is triggered programmatically.
    if ((view === 'dashboard' || view === 'meals') && !result) {
      goTo('onboarding');
      return;
    }
    goTo(view);
  };

  const handleStart = () => {
    setEditingProfile(false);
    goTo('onboarding');
  };

  const handleEditProfile = () => {
    setEditingProfile(true);
    goTo('onboarding');
  };

  const handleOnboardingComplete = (p: UserProfile) => {
    setProfile(p);
    setCalcError(false);
    goTo('loading');
  };

  const handleLoadingComplete = () => {
    if (!profile) {
      goTo('landing');
      return;
    }
    try {
      const computed = computeNutrition(profile);
      setResult(computed);
      setCalcError(false);
      goTo(editingProfile ? 'dashboard' : 'result-intro');
    } catch (err) {
      console.error('NutriSynth calculation failed:', err);
      setCalcError(true);
      goTo('onboarding');
    }
  };

  const handleRegenerate = () => {
    if (!profile) return;
    try {
      const computed = computeNutrition(profile);
      // Keep meals the user logged (scan/search/enter all tag them icon "Camera")
      // so Regenerate only reshuffles the suggested plan, not today's intake.
      setResult((prev) => {
        const logged = prev ? prev.meals.filter((m) => m.icon === 'Camera') : [];
        return { ...computed, meals: [...computed.meals, ...logged] };
      });
    } catch (err) {
      console.error('NutriSynth regeneration failed:', err);
    }
  };

  // Scan Food adds a new meal into the existing plan — every dashboard total,
  // chart, and diet-analysis section is already derived from `result.meals`,
  // so appending here is enough to keep them all in sync.
  const handleAddScannedMeal = (meal: MealItem) => {
    setResult((prev) => (prev ? { ...prev, meals: [...prev.meals, meal] } : prev));
  };

  const showChrome = !CHROME_HIDDEN.includes(phase);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-[#090d14] text-stone-900 dark:text-stone-100 transition-colors duration-200">
      {showChrome && (
        <Header currentView={phase as View} onNavigate={handleNavigate} hasProfile={!!result} />
      )}

      <main className="flex-1">
        {phase === 'landing' && <Landing onStart={handleStart} onNavigate={handleNavigate} />}

        {phase === 'how-it-works' && <HowItWorks onStart={handleStart} onNavigate={handleNavigate} />}

        {phase === 'about' && <About onStart={handleStart} />}

        {phase === 'onboarding' && (
          <>
            {calcError && (
              <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-8">
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
                  Something went wrong while calculating your plan. Please check your details and try again.
                </div>
              </div>
            )}
            <Onboarding
              onComplete={handleOnboardingComplete}
              onBack={() => goTo(result ? 'dashboard' : 'landing')}
              initialProfile={editingProfile && profile ? profile : undefined}
              backLabel={editingProfile && result ? 'Back to Dashboard' : 'Back to Home'}
              submitLabel={editingProfile ? 'Save & Recalculate' : 'Build My Plan'}
            />
          </>
        )}

        {phase === 'loading' && <LoadingScreen onComplete={handleLoadingComplete} />}

        {phase === 'result-intro' && result && profile && (
          <ResultIntro result={result} profile={profile} onExplore={() => goTo('dashboard')} />
        )}

        {(phase === 'dashboard' || phase === 'meals') && result && profile && (
          <Dashboard
            result={result}
            profile={profile}
            onRegenerate={handleRegenerate}
            onEditProfile={handleEditProfile}
            onGoToDeficiency={() => goTo('deficiency')}
            onAddScannedMeal={handleAddScannedMeal}
          />
        )}

        {phase === 'deficiency' && (
          <DeficiencyCheck
            result={result}
            profile={profile}
            onBack={() => goTo(result ? 'dashboard' : 'landing')}
            onStartOnboarding={handleStart}
            onAddMeal={handleAddScannedMeal}
          />
        )}
      </main>

      {showChrome && <Footer />}

      <Chatbot
        currentPhase={phase}
        profile={profile}
        result={result}
        onNavigate={handleNavigate}
        onStartPlan={handleStart}
        onEditProfile={handleEditProfile}
        onRegenerate={handleRegenerate}
      />
    </div>
  );
}

export default App;
