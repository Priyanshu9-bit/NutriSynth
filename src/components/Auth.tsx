import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Database,
  Cloud,
  X,
  Zap,
} from 'lucide-react';
import {
  registerWithEmail,
  loginWithEmail,
  loginAsGuest,
  isFirebaseConfigured,
  formatAuthError,
  type AuthUser,
} from '@/lib/firebase';

interface AuthProps {
  onSuccess: (user: AuthUser) => void;
  onClose?: () => void;
  initialMode?: 'signin' | 'signup';
}

export function AuthModal({ onSuccess, onClose, initialMode = 'signin' }: AuthProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      let user: AuthUser;
      if (mode === 'signup') {
        user = await registerWithEmail(email, password, displayName);
        setSuccessMsg(`Account created! Welcome, ${user.displayName || 'friend'}!`);
      } else {
        user = await loginWithEmail(email, password);
        setSuccessMsg(`Welcome back, ${user.displayName || 'friend'}!`);
      }

      setTimeout(() => {
        onSuccess(user);
        if (onClose) onClose();
      }, 700);
    } catch (err: any) {
      setError(formatAuthError(err));
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      // Auto sign-in or register demo account
      let user: AuthUser;
      try {
        user = await loginWithEmail('demo@nutrisynth.com', 'demo123456');
      } catch {
        user = await registerWithEmail('demo@nutrisynth.com', 'demo123456', 'Demo Athlete');
      }
      setSuccessMsg('Signed in as Demo Athlete!');
      setTimeout(() => {
        onSuccess(user);
        if (onClose) onClose();
      }, 600);
    } catch (err: any) {
      setError(formatAuthError(err));
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const user = await loginAsGuest();
      setSuccessMsg('Continuing as Guest...');
      setTimeout(() => {
        onSuccess(user);
        if (onClose) onClose();
      }, 500);
    } catch (err: any) {
      setError(formatAuthError(err));
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#07111F] rounded-2xl border border-stone-200 dark:border-[#1E293B] shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow decoration */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#22C55E] via-[#2DD4BF] to-[#60A5FA]" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#22C55E]/10 dark:bg-[#22C55E]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 dark:hover:text-[#F8FAFC] rounded-full hover:bg-stone-100 dark:hover:bg-[#101D2D] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#22C55E] to-[#2DD4BF] text-[#07111F] font-bold shadow-md shadow-[#22C55E]/25 mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="font-display font-bold text-2xl text-stone-900 dark:text-[#F8FAFC]">
              {mode === 'signin' ? 'Welcome Back' : 'Create Your Account'}
            </h2>
            <p className="text-sm text-stone-500 dark:text-[#8492A6] mt-1">
              {mode === 'signin'
                ? 'Sign in to access your saved nutrition plans and meals'
                : 'Sign up to automatically sync your nutrition data'}
            </p>
          </div>

          {/* Database status pill */}
          <div className="mb-6 flex items-center justify-center">
            {isFirebaseConfigured ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#22C55E]/15 text-emerald-700 dark:text-[#34D399] border border-[#22C55E]/30">
                <Cloud className="w-3.5 h-3.5" />
                <span>Firebase Cloud Sync Active</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                <Database className="w-3.5 h-3.5" />
                <span>Local Storage Mode (Saved in Browser)</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 mb-6 bg-stone-100 dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white dark:bg-[#101D2D] text-stone-900 dark:text-[#F8FAFC] shadow-sm'
                  : 'text-stone-500 dark:text-[#8492A6] hover:text-stone-800 dark:hover:text-[#F8FAFC]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white dark:bg-[#101D2D] text-stone-900 dark:text-[#F8FAFC] shadow-sm'
                  : 'text-stone-500 dark:text-[#8492A6] hover:text-stone-800 dark:hover:text-[#F8FAFC]'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error & Success Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 flex items-start gap-2.5 text-red-700 dark:text-red-300 text-xs sm:text-sm animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-[#22C55E]/30 flex items-center gap-2.5 text-emerald-700 dark:text-[#34D399] text-xs sm:text-sm animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#22C55E]" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-[#CBD5E1] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-[#8492A6]" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-[#1E293B] bg-stone-50 dark:bg-[#101D2D] text-stone-900 dark:text-[#F8FAFC] text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] transition-all placeholder:text-stone-400 dark:placeholder:text-[#8492A6]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-[#CBD5E1] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-[#8492A6]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-[#1E293B] bg-stone-50 dark:bg-[#101D2D] text-stone-900 dark:text-[#F8FAFC] text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] transition-all placeholder:text-stone-400 dark:placeholder:text-[#8492A6]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-[#CBD5E1] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-[#8492A6]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 dark:border-[#1E293B] bg-stone-50 dark:bg-[#101D2D] text-stone-900 dark:text-[#F8FAFC] text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] transition-all placeholder:text-stone-400 dark:placeholder:text-[#8492A6]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-[#F8FAFC] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-[#CBD5E1] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-[#8492A6]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-[#1E293B] bg-stone-50 dark:bg-[#101D2D] text-stone-900 dark:text-[#F8FAFC] text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] transition-all placeholder:text-stone-400 dark:placeholder:text-[#8492A6]"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-[#07111F] bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] hover:opacity-95 active:scale-[0.99] transition-all shadow-md shadow-[#22C55E]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#07111F]/30 border-t-[#07111F] rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In to My Plan' : 'Create My Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200 dark:border-[#1E293B]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-[#07111F] px-2 text-stone-400 dark:text-[#8492A6]">or quick options</span>
            </div>
          </div>

          {/* Quick Demo & Guest Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="py-2.5 px-3 rounded-xl border border-stone-200 dark:border-[#1E293B] hover:border-[#22C55E] bg-stone-50/80 dark:bg-[#101D2D] hover:bg-emerald-500/10 dark:hover:bg-[#22C55E]/10 text-xs font-semibold text-stone-700 dark:text-[#CBD5E1] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Demo Account</span>
            </button>

            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={loading}
              className="py-2.5 px-3 rounded-xl border border-stone-200 dark:border-[#1E293B] hover:border-stone-300 dark:hover:border-[#1E293B]/80 bg-stone-50/80 dark:bg-[#101D2D] hover:bg-stone-100 dark:hover:bg-[#101D2D]/80 text-xs font-semibold text-stone-600 dark:text-[#CBD5E1] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5 text-stone-400 dark:text-[#8492A6]" />
              <span>Guest Mode</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
