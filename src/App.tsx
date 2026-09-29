import { useState, useEffect } from 'react';
import { Header, Footer, type View } from '@/components/Layout';
import { Landing } from '@/components/Landing';
import { HowItWorks, About } from '@/components/Pages';
import { Onboarding } from '@/components/Onboarding';
import { LoadingScreen } from '@/components/Loading';
import { ResultIntro } from '@/components/ResultIntro';
import { Dashboard } from '@/components/Dashboard';
import { DeficiencyCheck } from '@/components/DeficiencyCheck';
import { Challenge } from '@/components/Challenge';
import { TodayStreak } from '@/components/TodayStreak';
import { computeNutrition, type NutritionResult, type UserProfile, type MealItem } from '@/lib/calculations';
import { Chatbot } from '@/components/Chatbot';
import { AuthModal } from '@/components/Auth';
import { subscribeToAuth, logout, type AuthUser } from '@/lib/firebase';
import { loadUserData, saveUserData, saveMeal } from '@/lib/cloudStore';
import {
  type StreakData,
  type ChallengeData,
  loadLocalStreak,
  saveLocalStreak,
  loadLocalChallenge,
  saveLocalChallenge,
  computeActiveChallengeDay,
} from '@/lib/streakService';
import { ErrorBoundary, SectionErrorBoundary } from '@/components/ErrorBoundary';
import { ModeContextBar } from '@/components/ModeContextBar';
import { playAddProgressSound } from '@/lib/soundEffects';
import { SmartMealPlanner } from '@/components/saas/SmartMealPlanner';
import { FoodSearchLogger } from '@/components/saas/FoodSearchLogger';
import { SmartGroceryList } from '@/components/saas/SmartGroceryList';
import { NutritionWeightAnalytics } from '@/components/saas/NutritionWeightAnalytics';
import { ProfileGoalSettings } from '@/components/saas/ProfileGoalSettings';
import { MobileBottomNav } from '@/components/saas/MobileBottomNav';

type Phase = View | 'onboarding' | 'loading' | 'result-intro';

const CHROME_HIDDEN: Phase[] = ['onboarding', 'loading', 'result-intro'];

function App() {
  const [phase, setPhase] = useState<Phase>('landing');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [result, setResult] = useState<NutritionResult | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [calcError, setCalcError] = useState(false);

  // Day Streak & 30-Day Challenge State
  const [streak, setStreak] = useState<StreakData>(() => loadLocalStreak());
  const [challenge, setChallenge] = useState<ChallengeData>(() => loadLocalChallenge());

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
            if (savedData.streak) {
              setStreak((prev) => ({ ...prev, ...savedData.streak }));
              saveLocalStreak(savedData.streak);
            }
            if (savedData.challenge) {
              const chal = savedData.challenge;
              setChallenge((prev) => ({
                ...prev,
                ...chal,
                completedDays: Array.isArray(chal.completedDays) ? chal.completedDays : [1],
              }));
              saveLocalChallenge(chal);
            }
            setSyncNotice(`Welcome back, ${user.displayName || 'friend'}! Your saved plan & streak have been restored.`);
            setTimeout(() => setSyncNotice(null), 4500);

            // Automatically navigate to dashboard if on landing
            setPhase((curr) => (curr === 'landing' ? 'dashboard' : curr));
          } else {
            // If user only had streak & challenge data
            if (savedData?.streak) {
              setStreak((prev) => ({ ...prev, ...savedData.streak }));
              saveLocalStreak(savedData.streak);
            }
            if (savedData?.challenge) {
              const chal = savedData.challenge;
              setChallenge((prev) => ({
                ...prev,
                ...chal,
                completedDays: Array.isArray(chal.completedDays) ? chal.completedDays : [1],
              }));
              saveLocalChallenge(chal);
            }
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
        if (savedData.streak) {
          setStreak(savedData.streak);
          saveLocalStreak(savedData.streak);
        }
        if (savedData.challenge) {
          setChallenge(savedData.challenge);
          saveLocalChallenge(savedData.challenge);
        }
        goTo('dashboard');
        setSyncNotice(`Logged in as ${user.displayName || user.email}! Plan & streak loaded.`);
        setTimeout(() => setSyncNotice(null), 4000);
      } else if (profile && result) {
        // User logged in after calculating a plan: save current plan and streak to their account!
        await saveUserData(user.uid, {
          email: user.email,
          displayName: user.displayName,
          profile,
          result,
          streak,
          challenge,
        });
        setSyncNotice('Your plan & streak were saved to your account!');
        setTimeout(() => setSyncNotice(null), 4000);
      } else {
        // Brand new account without plan yet - save local streak
        await saveUserData(user.uid, {
          email: user.email,
          displayName: user.displayName,
          profile: null,
          result: null,
          streak,
          challenge,
        });
        goTo('onboarding');
      }
    } catch (err) {
      console.warn('[NutriSynth] Error during post-auth data fetch:', err);
    }
  };

  const handleUpdateStreak = (newStreak: StreakData) => {
    setStreak(newStreak);
    saveLocalStreak(newStreak);
    if (authUser) {
      saveUserData(authUser.uid, {
        email: authUser.email,
        displayName: authUser.displayName,
        profile,
        result,
        streak: newStreak,
        challenge,
      });
    }
  };

  const handleUpdateChallenge = (newChallenge: ChallengeData) => {
    setChallenge(newChallenge);
    saveLocalChallenge(newChallenge);
    if (authUser) {
      saveUserData(authUser.uid, {
        email: authUser.email,
        displayName: authUser.displayName,
        profile,
        result,
        streak,
        challenge: newChallenge,
      });
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

  const ensureProfile = (): { p: UserProfile; r: NutritionResult } => {
    if (profile && result) return { p: profile, r: result };
    const defaultProfile: UserProfile = {
      age: 26,
      gender: 'male',
      weight: 75,
      height: 178,
      activity: 1.55,
      goal: 'fat_loss',
      diet: 'veg',
      allergies: [],
      intolerances: [],
    };
    const defaultResult = computeNutrition(defaultProfile);
    setProfile(defaultProfile);
    setResult(defaultResult);
    return { p: defaultProfile, r: defaultResult };
  };

  const handleNavigate = (view: View) => {
    if (['dashboard', 'meals', 'planner', 'analytics', 'settings'].includes(view) && !result) {
      ensureProfile();
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
          streak,
          challenge,
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
            streak,
            challenge,
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
    playAddProgressSound();

    setResult((prev) => {
      if (!prev) return prev;
      const next = { ...prev, meals: [...prev.meals, meal] };

      if (authUser && profile) {
        saveUserData(authUser.uid, {
          email: authUser.email,
          displayName: authUser.displayName,
          profile,
          result: next,
          streak,
          challenge,
        });
      }
      return next;
    });
  };

  const showChrome = !CHROME_HIDDEN.includes(phase);
  const activeChallengeDay = computeActiveChallengeDay(challenge);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-[#18191c] text-stone-900 dark:text-stone-100 transition-colors duration-200">
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
        <>
          <Header
            currentView={phase as View}
            onNavigate={handleNavigate}
            hasProfile={!!result}
            authUser={authUser}
            onOpenAuth={handleOpenAuth}
            onSignOut={handleSignOut}
            streakCount={streak.currentStreak}
            profile={profile}
          />
          <ModeContextBar
            currentView={phase as View}
            onNavigate={handleNavigate}
            hasProfile={!!result}
            streakCount={streak.currentStreak}
            activeChallengeDay={activeChallengeDay}
            completedChallengeDaysCount={challenge?.completedDays?.length ?? 1}
          />
        </>
      )}

      <main className="flex-1">
        <ErrorBoundary>
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
            onGoToChallenge={() => goTo('challenge')}
            onGoToTodayStreak={() => goTo('today-streak')}
            streakCount={streak?.currentStreak ?? 1}
            completedDaysCount={challenge?.completedDays?.length ?? 1}
            streak={streak}
            challenge={challenge}
            onUpdateStreak={handleUpdateStreak}
          />
        )}

        {phase === 'today-streak' && (
          <TodayStreak
            streak={streak}
            challenge={challenge}
            onUpdateStreak={handleUpdateStreak}
            onUpdateChallenge={handleUpdateChallenge}
            onNavigate={handleNavigate}
            authUser={authUser}
            profile={profile}
            result={result}
          />
        )}

        {phase === 'challenge' && (
          <Challenge
            streak={streak}
            challenge={challenge}
            onUpdateStreak={handleUpdateStreak}
            onUpdateChallenge={handleUpdateChallenge}
            onNavigate={handleNavigate}
            authUser={authUser}
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

        {phase === 'planner' && result && profile && (
          <SectionErrorBoundary fallbackTitle="Meal Planner">
            <div className="py-8 px-4 sm:px-6 lg:px-8">
              <SmartMealPlanner
                result={result}
                profile={profile}
                onAddMeal={handleAddScannedMeal}
                onNavigateToGrocery={() => goTo('grocery')}
              />
            </div>
          </SectionErrorBoundary>
        )}

        {phase === 'food-search' && (
          <SectionErrorBoundary fallbackTitle="Food Search & Logger">
            <div className="py-8 px-4 sm:px-6 lg:px-8">
              <FoodSearchLogger
                onLogMeal={handleAddScannedMeal}
                onClose={() => goTo(result ? 'dashboard' : 'landing')}
              />
            </div>
          </SectionErrorBoundary>
        )}

        {phase === 'grocery' && (
          <SectionErrorBoundary fallbackTitle="Smart Grocery List">
            <div className="py-8 px-4 sm:px-6 lg:px-8">
              <SmartGroceryList
                onBackToDashboard={() => goTo(result ? 'dashboard' : 'landing')}
              />
            </div>
          </SectionErrorBoundary>
        )}

        {phase === 'analytics' && result && profile && (
          <SectionErrorBoundary fallbackTitle="Nutrition & Weight Analytics">
            <div className="py-8 px-4 sm:px-6 lg:px-8">
              <NutritionWeightAnalytics
                result={result}
                profile={profile}
              />
            </div>
          </SectionErrorBoundary>
        )}

        {phase === 'settings' && result && profile && (
          <SectionErrorBoundary fallbackTitle="Profile & Goal Settings">
            <div className="py-8 px-4 sm:px-6 lg:px-8">
              <ProfileGoalSettings
                profile={profile}
                result={result}
                authUser={authUser}
                onUpdateProfile={(p) => {
                  setProfile(p);
                  try {
                    const next = computeNutrition(p);
                    setResult(next);
                  } catch (e) {
                    console.warn(e);
                  }
                }}
                onOpenAuth={handleOpenAuth}
              />
            </div>
          </SectionErrorBoundary>
        )}
        </ErrorBoundary>
      </main>

      {showChrome && <Footer />}

      {/* Mobile Bottom Navigation Bar */}
      {showChrome && (
        <MobileBottomNav
          currentView={phase as View}
          onNavigate={handleNavigate}
          hasProfile={Boolean(result || profile)}
        />
      )}

      <Chatbot
        currentPhase={phase}
        profile={profile}
        result={result}
        onNavigate={handleNavigate}
        onStartPlan={handleStart}
        onEditProfile={handleEditProfile}
        onRegenerate={handleRegenerate}
        onAddMeal={handleAddScannedMeal}
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
