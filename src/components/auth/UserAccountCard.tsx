import { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  LogOut,
  LogIn,
  UserPlus,
  Cloud,
  Database,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Flame,
  ChefHat,
  Target,
  RefreshCw,
} from 'lucide-react';
import type { AuthUser } from '@/lib/firebase';
import type { UserProfile, NutritionResult } from '@/lib/calculations';

interface UserAccountCardProps {
  authUser: AuthUser | null;
  profile?: UserProfile | null;
  result?: NutritionResult | null;
  streakCount?: number;
  onOpenAuth?: (mode?: 'signin' | 'signup') => void;
  onSignOut?: () => void;
  compact?: boolean;
}

export function UserAccountCard({
  authUser,
  profile,
  result,
  streakCount = 0,
  onOpenAuth,
  onSignOut,
  compact = false,
}: UserAccountCardProps) {
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOutClick = async () => {
    if (!confirmSignOut) {
      setConfirmSignOut(true);
      return;
    }
    setSigningOut(true);
    try {
      if (onSignOut) {
        await onSignOut();
      }
    } finally {
      setSigningOut(false);
      setConfirmSignOut(false);
    }
  };

  if (!authUser) {
    // GUEST / NOT LOGGED IN STATE
    return (
      <div className={`rounded-3xl bg-[#0B0F0E] border border-[#1E293B] shadow-xl overflow-hidden ${compact ? 'p-4' : 'p-6 sm:p-7'}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#1E293B]">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-[#101D2D] border border-[#1E293B] flex items-center justify-center text-[#8492A6]">
                <UserIcon className="w-6 h-6" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-[#0B0F0E]" title="Guest Mode" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-extrabold text-base sm:text-lg text-[#F8FAFC]">
                  Guest Account
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Local Mode
                </span>
              </div>
              <p className="text-xs text-[#8492A6] mt-0.5">
                Data saved in this browser • Sign in to sync across devices
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-[#101D2D] text-[#CBD5E1] border border-[#1E293B]">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>Offline Safe</span>
            </span>
          </div>
        </div>

        {/* Action Prompt */}
        <div className="pt-5 space-y-4">
          <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed">
            Link a free account to back up your personalized nutrition targets, daily meal logs, and habit streaks to the cloud.
          </p>

          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenAuth && (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAuth('signin')}
                  className="flex-1 sm:flex-none py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  title="Sign in to your NutriSynth account"
                >
                  <LogIn className="w-4 h-4 stroke-[2.5]" />
                  <span>Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-[#101D2D] hover:bg-[#1E293B] text-[#F8FAFC] border border-[#1E293B] font-bold text-xs sm:text-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  title="Create a new free account"
                >
                  <UserPlus className="w-4 h-4 text-[#2DD4BF]" />
                  <span>Create Account</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN STATE
  const initials = (authUser.displayName || authUser.email || 'U').charAt(0).toUpperCase();

  return (
    <div className={`rounded-3xl bg-[#0B0F0E] border border-[#1E293B] shadow-xl overflow-hidden ${compact ? 'p-4' : 'p-6 sm:p-7'}`}>
      {/* Header Profile Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#1E293B]">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#22C55E] to-[#2DD4BF] text-[#07111F] font-black text-lg flex items-center justify-center shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-500/30">
              {initials}
            </div>
            <span
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#22C55E] border-2 border-[#0B0F0E] flex items-center justify-center shadow-sm"
              title="Signed In"
            >
              <CheckCircle2 className="w-3 h-3 text-[#07111F]" />
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-black text-base sm:text-lg text-[#F8FAFC] truncate">
                {authUser.displayName || 'Active NutriSynth Member'}
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#22C55E]/15 text-[#34D399] border border-[#22C55E]/30">
                <Cloud className="w-3 h-3 text-[#2DD4BF]" />
                <span>Cloud Synced</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[#CBD5E1]">
              <Mail className="w-3.5 h-3.5 text-[#8492A6]" />
              <span className="truncate">{authUser.email || 'No email provided'}</span>
            </div>
          </div>
        </div>

        {/* UID & Security Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-[#101D2D] text-[#8492A6] border border-[#1E293B]" title={`User ID: ${authUser.uid}`}>
            <ShieldCheck className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span className="font-mono text-[11px]">{authUser.uid.slice(0, 8)}…</span>
          </span>
        </div>
      </div>

      {/* Account Stats & Overview */}
      <div className="py-4 grid grid-cols-3 gap-2.5 sm:gap-3 text-center border-b border-[#1E293B]">
        <div className="p-3 rounded-2xl bg-[#101D2D] border border-[#1E293B]">
          <div className="text-[10px] font-bold text-[#8492A6] uppercase tracking-wider mb-0.5">Diet Plan</div>
          <div className="text-xs sm:text-sm font-extrabold text-[#F8FAFC] capitalize flex items-center justify-center gap-1">
            <ChefHat className="w-3.5 h-3.5 text-[#2DD4BF]" />
            <span>{profile?.diet || 'Custom'}</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-[#101D2D] border border-[#1E293B]">
          <div className="text-[10px] font-bold text-[#8492A6] uppercase tracking-wider mb-0.5">Target Fuel</div>
          <div className="text-xs sm:text-sm font-extrabold text-[#34D399] flex items-center justify-center gap-1">
            <Target className="w-3.5 h-3.5 text-[#34D399]" />
            <span>{result?.tdee ? `${result.tdee.toLocaleString()} kcal` : 'Set in goals'}</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-[#101D2D] border border-[#1E293B]">
          <div className="text-[10px] font-bold text-[#8492A6] uppercase tracking-wider mb-0.5">Daily Streak</div>
          <div className="text-xs sm:text-sm font-extrabold text-amber-400 flex items-center justify-center gap-1">
            <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{streakCount} {streakCount === 1 ? 'day' : 'days'}</span>
          </div>
        </div>
      </div>

      {/* Account Control Actions: Logout & Switch */}
      <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="text-xs text-[#8492A6]">
          Logged in on this device • Synced with NutriSynth cloud
        </div>

        <div className="flex items-center gap-2">
          {onOpenAuth && (
            <button
              type="button"
              onClick={() => onOpenAuth('signin')}
              className="px-3.5 py-2 rounded-xl bg-[#101D2D] hover:bg-[#1E293B] text-[#CBD5E1] hover:text-[#F8FAFC] border border-[#1E293B] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              title="Switch to a different account"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Switch</span>
            </button>
          )}

          {onSignOut && (
            <button
              type="button"
              onClick={handleSignOutClick}
              disabled={signingOut}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                confirmSignOut
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/25 ring-2 ring-red-400/50 scale-102 animate-pulse'
                  : 'bg-red-950/30 hover:bg-red-950/60 text-red-300 border border-red-500/30 hover:border-red-500/50'
              }`}
              title={confirmSignOut ? 'Click again to confirm log out' : 'Log out of NutriSynth'}
            >
              <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{signingOut ? 'Signing Out…' : confirmSignOut ? 'Click to Confirm Sign Out' : 'Sign Out'}</span>
            </button>
          )}
        </div>
      </div>

      {confirmSignOut && (
        <div className="mt-2 text-[11px] text-amber-300 text-right animate-fade-in">
          ⚠️ Are you sure? Tap 'Confirm Sign Out' again to log out.
        </div>
      )}
    </div>
  );
}
