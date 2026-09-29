import {
  Home,
  Info,
  LayoutDashboard,
  UtensilsCrossed,
  Dna,
  Menu,
  X,
  LogIn,
  LogOut,
  Flame,
  Trophy,
  ShoppingCart,
  Activity,
  Plus,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { AuthUser } from '@/lib/firebase';

import type { UserProfile } from '@/lib/calculations';

export type View =
  | 'landing'
  | 'how-it-works'
  | 'dashboard'
  | 'meals'
  | 'planner'
  | 'food-search'
  | 'grocery'
  | 'analytics'
  | 'today-streak'
  | 'challenge'
  | 'deficiency'
  | 'settings'
  | 'about';

interface NavProps {
  currentView: View;
  onNavigate: (view: View) => void;
  hasProfile: boolean;
  authUser?: AuthUser | null;
  onOpenAuth?: (mode?: 'signin' | 'signup') => void;
  onSignOut?: () => void;
  streakCount?: number;
  profile?: UserProfile | null;
  onOpenGlossary?: () => void;
}

const primaryNavItems: {
  view: View;
  label: string;
  sublabel: string;
  icon: typeof Home;
  badge?: string;
  badgeColor?: string;
}[] = [
  { view: 'dashboard', label: "Today's Food", sublabel: 'See daily energy & meals', icon: LayoutDashboard },
  { view: 'planner', label: 'Meal Ideas', sublabel: 'Healthy recipes for you', icon: UtensilsCrossed },
  { view: 'grocery', label: 'Shopping List', sublabel: 'Ingredients to buy', icon: ShoppingCart },
  { view: 'analytics', label: 'My Progress', sublabel: 'Weight & habit trends', icon: Activity },
];

const moreNavItems: { view: View; label: string; sublabel: string; icon: typeof Home; badge?: string }[] = [
  { view: 'challenge', label: '30-Day Road-map', sublabel: 'Step-by-step habit challenge', icon: Trophy, badge: '30d' },
  { view: 'today-streak', label: 'Daily Habits', sublabel: "Today's check-in & water", icon: Flame },
  { view: 'deficiency', label: 'Vitamin Check', sublabel: 'Essential nutrient screening', icon: Dna },
  { view: 'settings', label: 'My Goals', sublabel: 'Adjust stats & calorie target', icon: Settings },
];

export function Header({
  currentView,
  onNavigate,
  hasProfile,
  authUser,
  onOpenAuth,
  onSignOut,
  streakCount,
  profile,
  onOpenGlossary,
}: NavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

  const handleNav = (view: View) => {
    onNavigate(view);
    setMobileOpen(false);
    setMoreDropdownOpen(false);
    setAccountDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#07111F]/95 backdrop-blur-xl border-b border-stone-200 dark:border-[#1E293B] transition-all duration-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand Badge */}
          <button
            onClick={() => handleNav('landing')}
            className="flex items-center gap-3.5 group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-2xl p-1 -ml-1 transition-all"
            title="Go to Home - Learn what NutriSynth does"
          >
            <div className="relative">
              <img
                src="/logo.jpg"
                alt="NutriSynth Logo"
                className="w-12 h-12 rounded-2xl object-cover shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/30 group-hover:scale-105 group-hover:shadow-emerald-500/40 transition-all duration-300"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#07111F] rounded-full shadow-sm" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-xl sm:text-2xl text-stone-900 dark:text-[#F8FAFC] tracking-tight leading-none group-hover:text-[#34D399] transition-colors">
                  NutriSynth
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#8492A6] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF] animate-pulse" />
                <span>Simple, Smart Nutrition Tracking</span>
              </div>
            </div>
          </button>

          {/* Desktop Navigation Dock */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3">
            <nav className="flex items-center gap-1 bg-stone-100/90 dark:bg-[#0B0F0E]/90 p-1.5 rounded-2xl border border-stone-200 dark:border-[#1E293B] shadow-inner">
              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.view || (item.view === 'dashboard' && currentView === 'meals');
                const disabled = item.view === 'dashboard' && !hasProfile;
                return (
                  <button
                    key={item.view}
                    onClick={() => !disabled && handleNav(item.view)}
                    disabled={disabled}
                    title={`${item.label} — ${item.sublabel}`}
                    className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 select-none
                      ${
                        isActive
                          ? 'bg-white dark:bg-[#101D2D] text-emerald-700 dark:text-[#34D399] shadow-md dark:shadow-[0_0_16px_rgba(45,212,191,0.15)] border border-stone-200/90 dark:border-emerald-500/30 font-bold scale-[1.02]'
                          : disabled
                          ? 'text-stone-300 dark:text-stone-700 cursor-not-allowed opacity-60'
                          : 'text-stone-600 dark:text-[#CBD5E1] hover:text-stone-900 dark:hover:text-[#F8FAFC] hover:bg-stone-200/60 dark:hover:bg-[#101D2D]'
                      }`}
                  >
                    <Icon className={`w-4 h-4 transition-transform ${isActive ? 'text-emerald-600 dark:text-[#34D399] scale-110' : 'text-stone-400 dark:text-[#8492A6]'}`} />
                    <span>{item.label}</span>
                    {item.badge && !isActive && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-emerald-500/15 text-emerald-600 dark:text-[#34D399]'}`}>
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <span className="w-5 h-1 rounded-full bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] absolute -bottom-0.5 left-1/2 -translate-x-1/2 shadow-sm" />
                    )}
                  </button>
                );
              })}

              {/* More Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 select-none ${
                    moreNavItems.some((i) => i.view === currentView)
                      ? 'bg-white dark:bg-[#101D2D] text-emerald-700 dark:text-[#34D399] shadow-md border border-stone-200/90 dark:border-emerald-500/30 font-bold'
                      : 'text-stone-600 dark:text-[#CBD5E1] hover:text-stone-900 dark:hover:text-[#F8FAFC] hover:bg-stone-200/60 dark:hover:bg-[#101D2D]'
                  }`}
                  aria-expanded={moreDropdownOpen}
                >
                  <span>More</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      moreDropdownOpen ? 'rotate-180 text-emerald-500' : 'text-stone-400 dark:text-[#8492A6]'
                    }`}
                  />
                </button>

                {moreDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMoreDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-52 py-2 bg-white dark:bg-[#0B0F0E] rounded-2xl shadow-2xl border border-stone-200 dark:border-[#1E293B] z-50 animate-fade-in">
                      {moreNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentView === item.view;
                        return (
                          <button
                            key={item.view}
                            type="button"
                            onClick={() => handleNav(item.view)}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold transition-colors text-left ${
                              isActive
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-[#34D399] font-bold'
                                : 'text-stone-700 dark:text-[#CBD5E1] hover:bg-stone-100 dark:hover:bg-[#101D2D]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-emerald-500' : 'text-stone-400 dark:text-[#8492A6]'}`} />
                              <div className="min-w-0">
                                <div>{item.label}</div>
                                <div className="text-[10px] text-stone-400 dark:text-[#8492A6] font-normal truncate">{item.sublabel}</div>
                              </div>
                            </div>
                            {item.badge && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-500 ml-2">
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </nav>

            {/* Beginner's Plain-English Nutrition Guide CTA */}
            {onOpenGlossary && (
              <button
                type="button"
                onClick={onOpenGlossary}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 dark:text-[#34D399] bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all active:scale-95"
                title="What do calories, protein, carbs, and fats mean? Learn in simple words"
              >
                <span>❓</span>
                <span className="hidden xl:inline">Plain English Guide</span>
                <span className="xl:hidden">Guide</span>
              </button>
            )}

            {/* Quick Action: + Log Food - Emerald to Mint gradient CTA */}
            <button
              type="button"
              onClick={() => handleNav('food-search')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#07111F] bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] hover:opacity-95 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
              title="What happens: Opens search to easily record a meal or snack"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Log Food</span>
            </button>

            {/* Streak Counter Pill */}
            {typeof streakCount === 'number' && (
              <button
                type="button"
                onClick={() => handleNav('today-streak')}
                title="What happens: Opens your daily habit checklist and water tracker"
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-sm ${
                  streakCount > 0
                    ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/35 hover:border-amber-500/60 shadow-amber-500/10 hover:scale-105 active:scale-95'
                    : 'bg-stone-100 dark:bg-[#101D2D] text-stone-500 dark:text-[#8492A6] border border-stone-200 dark:border-[#1E293B] hover:border-amber-500/40'
                }`}
              >
                <Flame className={`w-4.5 h-4.5 ${streakCount > 0 ? 'text-amber-500 fill-amber-500 animate-pulse' : 'text-stone-400'}`} />
                <span>{streakCount} {streakCount === 1 ? 'Day' : 'Days'}</span>
              </button>
            )}

            <div className="h-6 w-px bg-stone-200 dark:bg-[#1E293B] mx-0.5" />
            <ThemeToggle />

            {/* Desktop Auth & Profile Controls */}
            {authUser ? (
              <div className="relative flex items-center gap-2 pl-1 border-l border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-[#101D2D] dark:hover:bg-[#1E293B] border border-stone-200 dark:border-[#1E293B] shadow-sm transition-all cursor-pointer text-left group"
                  title="Click to view your account details or switch accounts"
                  aria-expanded={accountDropdownOpen}
                >
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#22C55E] to-[#2DD4BF] text-[#07111F] font-black text-xs flex items-center justify-center shadow-sm">
                    {(authUser.displayName || authUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden xl:block">
                    <div className="text-xs font-bold text-stone-900 dark:text-[#F8FAFC] max-w-[110px] truncate leading-tight group-hover:text-[#34D399] transition-colors">
                      {authUser.displayName || authUser.email?.split('@')[0]}
                    </div>
                    {profile?.diet && (
                      <div className="text-[10px] font-semibold text-[#2DD4BF] capitalize">
                        {profile.diet}
                      </div>
                    )}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#8492A6] transition-transform duration-200 ${accountDropdownOpen ? 'rotate-180 text-[#34D399]' : ''}`} />
                </button>

                {/* Quick 1-click Sign Out icon button */}
                <button
                  type="button"
                  onClick={onSignOut}
                  title="Sign out of your account"
                  className="p-2.5 rounded-xl text-[#8492A6] hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>

                {/* Account Popover Menu */}
                {accountDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setAccountDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-72 p-4 bg-white dark:bg-[#0B0F0E] rounded-3xl shadow-2xl border border-stone-200 dark:border-[#1E293B] z-50 animate-scale-up space-y-3">
                      <div className="flex items-center gap-3 pb-3 border-b border-stone-200 dark:border-[#1E293B]">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#22C55E] to-[#2DD4BF] text-[#07111F] font-black text-sm flex items-center justify-center shadow-md shadow-emerald-500/20">
                          {(authUser.displayName || authUser.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-extrabold text-stone-900 dark:text-[#F8FAFC] truncate">
                            {authUser.displayName || 'NutriSynth Member'}
                          </div>
                          <div className="text-xs text-[#8492A6] truncate">
                            {authUser.email}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <button
                          type="button"
                          onClick={() => handleNav('settings')}
                          className="w-full px-3 py-2 rounded-xl text-left font-semibold text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#101D2D] transition-all flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4 text-[#2DD4BF]" />
                            <span>My Profile & Goals</span>
                          </div>
                          <span className="text-[10px] text-[#8492A6]">Edit</span>
                        </button>

                        {onOpenAuth && (
                          <button
                            type="button"
                            onClick={() => {
                              setAccountDropdownOpen(false);
                              onOpenAuth('signin');
                            }}
                            className="w-full px-3 py-2 rounded-xl text-left font-semibold text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#101D2D] transition-all flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <LogIn className="w-4 h-4 text-[#60A5FA]" />
                              <span>Switch Account</span>
                            </div>
                          </button>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#1E293B]">
                        <button
                          type="button"
                          onClick={() => {
                            setAccountDropdownOpen(false);
                            onSignOut?.();
                          }}
                          className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-red-300 bg-red-950/30 hover:bg-red-950/60 border border-red-500/30 hover:border-red-500/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-red-400 stroke-[2.5]" />
                          <span>Log Out / Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuth?.('signin')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-[#07111F] bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] hover:opacity-95 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                title="Sign in or register for a free account"
              >
                <LogIn className="w-4 h-4 stroke-[2.5]" />
                <span>Sign In</span>
              </button>
            )}
          </div>

          {/* Right Mobile Actions */}
          <div className="flex items-center gap-2 lg:hidden">
            {onOpenGlossary && (
              <button
                type="button"
                onClick={onOpenGlossary}
                className="p-2 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                title="Plain English Nutrition Guide"
                aria-label="Plain English Nutrition Guide"
              >
                ❓
              </button>
            )}
            {typeof streakCount === 'number' && (
              <button
                type="button"
                onClick={() => handleNav('today-streak')}
                title="Today's Streak"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
              >
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
                <span>{streakCount}d</span>
              </button>
            )}
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2.5 rounded-xl bg-stone-100 dark:bg-[#101D2D] text-stone-700 dark:text-[#CBD5E1] border border-stone-200 dark:border-[#1E293B] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileOpen && (
          <nav className="lg:hidden pb-5 pt-3 space-y-2 animate-fade-in border-t border-stone-200/80 dark:border-[#1E293B] max-h-[80vh] overflow-y-auto overflow-x-hidden">
            {/* Quick Log Food CTA on Mobile */}
            <button
              type="button"
              onClick={() => handleNav('food-search')}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold text-[#07111F] bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] shadow-md shadow-emerald-500/20 active:scale-95 transition-all mb-2"
            >
              <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
              <span>+ Log What You Ate Or Drank</span>
            </button>

            {onOpenGlossary && (
              <button
                type="button"
                onClick={() => {
                  onOpenGlossary();
                  setMobileOpen(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 text-emerald-800 dark:text-[#34D399] border border-emerald-500/25 mb-2 font-bold text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">💡</span>
                  <div>
                    <div>New to Nutrition? Open Plain English Guide</div>
                    <div className="text-[10px] text-stone-500 dark:text-[#8492A6] font-normal">Learn what calories, protein, and carbs mean in 60 seconds</div>
                  </div>
                </div>
                <span>→</span>
              </button>
            )}

            {/* Core Pages */}
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-[#8492A6] px-2 pt-1">
              Main Pages
            </div>
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.view || (item.view === 'dashboard' && currentView === 'meals');
              const disabled = item.view === 'dashboard' && !hasProfile;
              return (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => !disabled && handleNav(item.view)}
                  disabled={disabled}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all
                    ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-[#101D2D] text-emerald-700 dark:text-[#34D399] border border-emerald-200 dark:border-emerald-500/30 shadow-sm'
                        : disabled
                        ? 'text-stone-300 dark:text-stone-700 cursor-not-allowed'
                        : 'text-stone-700 dark:text-[#CBD5E1] hover:bg-stone-100 dark:hover:bg-[#101D2D]'
                    }`}
                >
                  <div className="flex items-center gap-3 text-left">
                    <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-emerald-600 dark:text-[#34D399]' : 'text-stone-400 dark:text-[#8492A6]'}`} />
                    <div>
                      <div className="font-bold">{item.label}</div>
                      <div className="text-[10px] text-stone-400 dark:text-[#8492A6] font-normal">{item.sublabel}</div>
                    </div>
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-emerald-500/15 text-emerald-600 dark:text-[#34D399]'}`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && !item.badge && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-[#34D399]">Current</span>
                  )}
                </button>
              );
            })}

            {/* More Tools & Trackers */}
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-[#8492A6] px-2 pt-3">
              Helpful Tools
            </div>
            {moreNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => handleNav(item.view)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left
                    ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-[#101D2D] text-emerald-700 dark:text-[#34D399] border border-emerald-200 dark:border-emerald-500/30 shadow-sm'
                        : 'text-stone-700 dark:text-[#CBD5E1] hover:bg-stone-100 dark:hover:bg-[#101D2D]'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-emerald-600 dark:text-[#34D399]' : 'text-stone-400 dark:text-[#8492A6]'}`} />
                    <div>
                      <div className="font-bold">{item.label}</div>
                      <div className="text-[10px] text-stone-400 dark:text-[#8492A6] font-normal">{item.sublabel}</div>
                    </div>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => handleNav('about')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-stone-500 dark:text-[#8492A6] hover:text-stone-800 dark:hover:text-[#F8FAFC]"
            >
              <Info className="w-4 h-4 text-[#60A5FA]" />
              <span>About NutriSynth & Scientific References</span>
            </button>

            {/* Mobile Auth Button */}
            <div className="pt-3 border-t border-stone-200/80 dark:border-[#1E293B]">
              {authUser ? (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-100 dark:bg-[#101D2D] border border-stone-200/80 dark:border-[#1E293B]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#22C55E] to-[#2DD4BF] text-[#07111F] font-bold text-sm flex items-center justify-center">
                      {(authUser.displayName || authUser.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-900 dark:text-[#F8FAFC]">
                        {authUser.displayName || 'User'}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-[#8492A6]">
                        {authUser.email || 'Logged In'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onSignOut?.();
                      setMobileOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onOpenAuth?.('signin');
                    setMobileOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold text-[#07111F] bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] shadow-md shadow-emerald-500/20"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In / Create Free Account</span>
                </button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-stone-200 dark:border-[#1E293B] bg-white dark:bg-[#07111F] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-stone-500 dark:text-[#8492A6]">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="NutriSynth Logo"
              className="w-9 h-9 rounded-xl object-cover shadow-sm ring-1 ring-emerald-500/30"
            />
            <div>
              <span className="font-bold text-stone-800 dark:text-[#F8FAFC] block leading-tight">NutriSynth</span>
              <span className="text-xs text-stone-400 dark:text-[#8492A6]">
                Personalized Nutrition. Powered by Data.
              </span>
            </div>
          </div>
          <div className="text-xs text-stone-500 dark:text-[#8492A6]">Built using recognized nutrition reference data</div>
        </div>
        <div className="mt-4 p-4 rounded-xl bg-amber-50/60 dark:bg-[#101D2D]/60 border border-amber-200/50 dark:border-amber-500/20">
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed text-balance">
            <strong>Disclaimer:</strong> NutriSynth provides evidence-based general nutrition
            information and personalized dietary guidance based on the information provided. It does
            not diagnose medical conditions or confirm nutrient deficiencies. Nutritional needs can
            vary with health conditions, medications, allergies, laboratory findings, and other
            factors. Consult a qualified healthcare professional when appropriate.
          </p>
        </div>
      </div>
    </footer>
  );
}
