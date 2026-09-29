import React, { useState } from 'react';
import {
  Settings,
  User,
  Target,
  Scale,
  ShieldCheck,
  Cloud,
  Download,
  RotateCcw,
  Check,
  AlertTriangle,
  Sparkles,
  Droplet,
  Save,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import type { UserProfile, NutritionResult } from '@/lib/calculations';
import {
  loadUserPreferencesLocal,
  saveUserPreferences,
  saveUserData,
  type UserPreferences,
} from '@/lib/cloudStore';
import type { AuthUser } from '@/lib/firebase';
import { isFirebaseConfigured } from '@/lib/firebase';
import { playChecklistSound, playAddProgressSound } from '@/lib/soundEffects';
import { SectionErrorBoundary } from '@/components/ErrorBoundary';
import { BeginnerGuideBanner } from '@/components/beginner/BeginnerGuideBanner';
import { UserAccountCard } from '@/components/auth/UserAccountCard';

interface ProfileGoalSettingsProps {
  profile: UserProfile;
  result: NutritionResult;
  authUser: AuthUser | null;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  onOpenAuth?: (mode?: 'signin' | 'signup') => void;
  onSignOut?: () => void;
  streakCount?: number;
}

export function ProfileGoalSettings({
  profile,
  result,
  authUser,
  onUpdateProfile,
  onOpenAuth,
  onSignOut,
  streakCount = 0,
}: ProfileGoalSettingsProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadUserPreferencesLocal());
  const [weight, setWeight] = useState(profile.weight?.toString() || '75');
  const [height, setHeight] = useState(profile.height?.toString() || '175');
  const [age, setAge] = useState(profile.age?.toString() || '28');
  const [goal, setGoal] = useState<UserProfile['goal']>(profile.goal || 'fat_loss');
  const [activity, setActivity] = useState<number>(profile.activity || 1.55);
  const [diet, setDiet] = useState<UserProfile['diet']>(profile.diet || 'veg');
  const [waterTarget, setWaterTarget] = useState(preferences.waterTargetMl?.toString() || '2500');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    playAddProgressSound();

    const updatedProfile: UserProfile = {
      ...profile,
      weight: Number(weight) || 75,
      height: Number(height) || 175,
      age: Number(age) || 28,
      goal,
      activity,
      diet,
    };

    const updatedPrefs: UserPreferences = {
      ...preferences,
      diet: diet || 'veg',
      waterTargetMl: Number(waterTarget) || 2500,
    };

    // Save preferences
    await saveUserPreferences(updatedPrefs);
    setPreferences(updatedPrefs);

    // Update profile in app state
    onUpdateProfile(updatedProfile);

    // Save user data to cloud/local
    if (authUser) {
      await saveUserData(authUser.uid, {
        email: authUser.email,
        displayName: authUser.displayName,
        profile: updatedProfile,
        result,
      });
    }

    setSavedSuccess(true);
    setIsSubmitting(false);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  // Export User Data as JSON
  const handleExportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      user: authUser,
      profile,
      result,
      preferences,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NutriSynth-Profile-Export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <SectionErrorBoundary fallbackTitle="Profile & Goal Settings">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-12">
        {/* Beginner Guide Banner answering the 3 core questions */}
        <BeginnerGuideBanner
          screenTitle="Your Profile & Health Goals"
          whatAmILookingAt="The personal measurements and lifestyle choices (height, weight, daily activity level, diet, and water target) used to calculate your daily food and protein targets."
          whatShouldIDo="Update any numbers if your weight has changed or you want to switch your goal, then tap '💾 Save Settings & Recalculate' at the bottom."
          whatHappensWhenIPress="NutriSynth immediately recalculates your daily calories, meal portions, and protein fuel. None of your past food logs are lost."
          primaryAction={{
            label: '💾 Save Settings & Recalculate',
            onClick: () => {
              const form = document.querySelector('form');
              if (form) form.requestSubmit();
            },
            caption: 'Instantly recalculates your daily energy and protein targets',
          }}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] shadow-sm">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#22C55E]/15 text-emerald-600 dark:text-[#34D399] text-xs font-bold mb-1 border border-[#22C55E]/30">
              <Settings className="w-3.5 h-3.5" />
              <span>Personal Profile & Preferences</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl text-stone-900 dark:text-[#F8FAFC]">
              Profile & Goal Settings
            </h1>
            <p className="text-xs text-stone-500 dark:text-[#8492A6] mt-0.5">
              Keep your measurements up-to-date so your daily food and water recommendations stay accurate.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
                authUser
                  ? 'bg-[#22C55E]/15 text-emerald-600 dark:text-[#34D399] border-[#22C55E]/30'
                  : 'bg-stone-100 dark:bg-[#101D2D] text-stone-600 dark:text-[#CBD5E1] border-stone-200 dark:border-[#1E293B]'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>{authUser ? 'Cloud Sync Active' : 'Offline Storage Safe'}</span>
            </span>
          </div>
        </div>

        {/* Success Banner */}
        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/30 text-emerald-800 dark:text-[#34D399] text-xs sm:text-sm font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
            <span>Profile settings & daily nutrition recommendations updated successfully!</span>
          </div>
        )}

        {/* User Account & Login/Logout Hub Container */}
        <UserAccountCard
          authUser={authUser}
          profile={profile}
          result={result}
          streakCount={streakCount}
          onOpenAuth={onOpenAuth}
          onSignOut={onSignOut}
        />

        {/* Settings Form */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Physical Parameters */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] shadow-sm space-y-4">
            <h3 className="font-display font-bold text-base text-stone-900 dark:text-[#F8FAFC] flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-[#1E293B]">
              <User className="w-4 h-4 text-[#22C55E]" />
              <span>Your Body Measurements</span>
            </h3>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-stone-500 dark:text-[#8492A6] block mb-1">
                  Current Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#101D2D] border border-stone-200 dark:border-[#1E293B] text-xs font-bold text-stone-900 dark:text-[#F8FAFC] focus:ring-2 focus:ring-[#22C55E]"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-stone-500 dark:text-[#8492A6] block mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  required
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#101D2D] border border-stone-200 dark:border-[#1E293B] text-xs font-bold text-stone-900 dark:text-[#F8FAFC] focus:ring-2 focus:ring-[#22C55E]"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-stone-500 dark:text-[#8492A6] block mb-1">
                  Age (years)
                </label>
                <input
                  type="number"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#101D2D] border border-stone-200 dark:border-[#1E293B] text-xs font-bold text-stone-900 dark:text-[#F8FAFC] focus:ring-2 focus:ring-[#22C55E]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Goals & Diet Philosophy */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] shadow-sm space-y-4">
            <h3 className="font-display font-bold text-base text-stone-900 dark:text-[#F8FAFC] flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-[#1E293B]">
              <Target className="w-4 h-4 text-[#22C55E]" />
              <span>Your Goal & Daily Routine</span>
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-stone-500 dark:text-[#8492A6] block mb-1">
                  Primary Fitness Objective
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#101D2D] border border-stone-200 dark:border-[#1E293B] text-xs font-bold text-stone-900 dark:text-[#F8FAFC] focus:ring-2 focus:ring-[#22C55E]"
                >
                  <option value="fat_loss">Lose Weight & Tone Up (Gentle, sustainable pace)</option>
                  <option value="maintenance">Stay at Current Weight (Healthy balance)</option>
                  <option value="muscle_gain">Build Muscle & Strength (More fuel & protein)</option>
                  <option value="endurance">Boost Daily Energy & Athletic Stamina</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-stone-500 dark:text-[#8492A6] block mb-1">
                  Daily Activity Level
                </label>
                <select
                  value={activity}
                  onChange={(e) => setActivity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#101D2D] border border-stone-200 dark:border-[#1E293B] text-xs font-bold text-stone-900 dark:text-[#F8FAFC] focus:ring-2 focus:ring-[#22C55E]"
                >
                  <option value={1.2}>Desk job / mostly sitting during the day</option>
                  <option value={1.375}>Light activity (daily walking or 1–2 workouts/wk)</option>
                  <option value={1.55}>Moderately active (workout 3–5 days/wk)</option>
                  <option value={1.725}>Very active (daily hard workouts or physical job)</option>
                  <option value={1.9}>Elite athlete / heavy manual labor</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-stone-500 dark:text-[#8492A6] block mb-1">
                  Dietary Pattern
                </label>
                <select
                  value={diet}
                  onChange={(e) => setDiet(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#101D2D] border border-stone-200 dark:border-[#1E293B] text-xs font-bold text-stone-900 dark:text-[#F8FAFC] focus:ring-2 focus:ring-[#22C55E]"
                >
                  <option value="veg">Vegetarian (Veggies, grains & dairy, no meat)</option>
                  <option value="vegan">100% Plant-Based (Vegan)</option>
                  <option value="eggetarian">Eggetarian (Veggies, dairy & eggs)</option>
                  <option value="nonveg">Omnivore (Eat everything including meat & fish)</option>
                  <option value="keto">Keto (Low carb, healthy fats)</option>
                  <option value="mediterranean">Mediterranean (Olive oil, fish & whole grains)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-stone-500 dark:text-[#8492A6] block mb-1">
                  Daily Water Target (ml)
                </label>
                <input
                  type="number"
                  step="100"
                  value={waterTarget}
                  onChange={(e) => setWaterTarget(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#101D2D] border border-stone-200 dark:border-[#1E293B] text-xs font-bold text-stone-900 dark:text-[#F8FAFC] focus:ring-2 focus:ring-[#22C55E]"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={handleExportJSON}
              className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-[#101D2D] dark:hover:bg-[#101D2D]/80 text-stone-700 dark:text-[#CBD5E1] border border-transparent dark:border-[#1E293B] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Download a backup file of your profile and history"
            >
              <Download className="w-3.5 h-3.5 text-[#60A5FA]" />
              <span>Export Data Backup (JSON)</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] hover:opacity-95 text-[#07111F] text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-[#22C55E]/20 cursor-pointer disabled:opacity-50"
              title="Saves your changes and recalculates your daily nutrition targets"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : '💾 Save Settings & Recalculate'}</span>
            </button>
          </div>
        </form>
      </div>
    </SectionErrorBoundary>
  );
}
