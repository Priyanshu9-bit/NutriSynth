import { useState, useEffect } from 'react';
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
import { AuthModal } from '@/components/Auth';
import { subscribeToAuth, logout, type AuthUser } from '@/lib/firebase';
import { loadUserData, saveUserData, saveMeal } from '@/lib/cloudStore';

type Phase = View | 'onboarding' | 'loading' | 'result-intro';

const CHROME_HIDDEN: Phase[] = ['onboarding', 'loading', 'result-intro'];

function App() {
  const [phase, setPhase] = useState<Phase>('landing');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [result, setResult] = useState<NutritionResult | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [calcError, setCalcError] = useState(false);

  // Auth State
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const goTo = (next: Phase) => {
    setPhase(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Subscribe to authentication changes and restore user data from Firebase/storage
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      setAuthUser(user);
      if (user) {
        try {
          const savedData = await loadUserData(user.uid);
          if (savedData?.profile && savedData?.result) {
            setProfile(savedData.profile);
            setResult(savedData.result);
            setSyncNotice(`Welcome back, ${user.displayName || 'friend'}! Your saved plan has been restored.`);
            setTimeout(() => setSyncNotice(null), 4500);

            // Automatically navigate to dashboard if on landing
            setPhase((curr) => (curr === 'landing' ? 'dashboard' : curr));
          }
        } catch (err) {
          console.warn('[NutriSynth] Error loading user document:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = async (user: AuthUser) => {
    setAuthUser(user);
    setIsAuthModalOpen(false);

    try {
      const savedData = await loadUserData(user.uid);
      if (savedData?.profile && savedData?.result) {
        setProfile(savedData.profile);
        setResult(savedData.result);
        goTo('dashboard');
        setSyncNotice(`Logged in as ${user.displayName || user.email}! Plan loaded from cloud.`);
        setTimeout(() => setSyncNotice(null), 4000);
      } else if (profile && result) {
        // User logged in after calculating a plan: save current plan to their account!
        await saveUserData(user.uid, {
          email: user.email,
          displayName: user.displayName,
          profile,
          result,
        });
        setSyncNotice('Your current plan was saved to your account!');
        setTimeout(() => setSyncNotice(null), 4000);
      } else {
        // Brand new account without plan yet
        goTo('onboarding');
      }
    } catch (err) {
      console.warn('[NutriSynth] Error during post-auth data fetch:', err);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setAuthUser(null);
    setProfile(null);
    setResult(null);
    goTo('landing');
    setSyncNotice('You have signed out.');
    setTimeout(() => setSyncNotice(null), 3000);
  };

  const handleNavigate = (view: View) => {
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

      // Auto-save to Firebase / store if user is logged in
      if (authUser) {
        saveUserData(authUser.uid, {
          email: authUser.email,
          displayName: authUser.displayName,
          profile,
          result: computed,
        });
      }

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
      setResult((prev) => {
        const logged = prev ? prev.meals.filter((m) => m.icon === 'Camera') : [];
        const next = { ...computed, meals: [...computed.meals, ...logged] };

        if (authUser) {
          saveUserData(authUser.uid, {
            email: authUser.email,
            displayName: authUser.displayName,
            profile,
            result: next,
          });
        }
        return next;
      });
    } catch (err) {
      console.error('NutriSynth regeneration failed:', err);
    }
  };

  const handleAddScannedMeal = (meal: MealItem) => {
    saveMeal(meal);

    setResult((prev) => {
      if (!prev) return prev;
      const next = { ...prev, meals: [...prev.meals, meal] };

      if (authUser && profile) {
        saveUserData(authUser.uid, {
          email: authUser.email,
          displayName: authUser.displayName,
          profile,
          result: next,
        });
      }
      return next;
    });
  };

  const showChrome = !CHROME_HIDDEN.includes(phase);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-[#090d14] text-stone-900 dark:text-stone-100 transition-colors duration-200">
      {/* Sync / Notification Toast */}
      {syncNotice && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-subtle">
          <div className="px-4 py-2.5 rounded-xl bg-stone-900/90 dark:bg-stone-100/95 text-white dark:text-stone-900 text-xs sm:text-sm font-medium shadow-xl border border-stone-800 dark:border-stone-200 flex items-center gap-2">
            <span>✨</span>
            <span>{syncNotice}</span>
          </div>
        </div>
      )}

      {showChrome && (
        <Header
          currentView={phase as View}
          onNavigate={handleNavigate}
          hasProfile={!!result}
          authUser={authUser}
          onOpenAuth={handleOpenAuth}
          onSignOut={handleSignOut}
        />
      )}

      <main className="flex-1">
        {phase === 'landing' && (
          <Landing
            onStart={handleStart}
            onNavigate={handleNavigate}
            onOpenAuth={handleOpenAuth}
            authUser={authUser}
            hasProfile={!!result}
          />
        )}

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

      {/* Login & Sign Up Modal */}
      {isAuthModalOpen && (
        <AuthModal
          onSuccess={handleAuthSuccess}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authModalMode}
        />
      )}
    </div>
  );
}

export default App;
