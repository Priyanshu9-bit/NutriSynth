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

  const handleNav = (view: View) => {
    onNavigate(view);
    setMobileOpen(false);
    setMoreDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#15171b]/95 backdrop-blur-xl border-b border-stone-200/80 dark:border-[#272a33] transition-all duration-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand Badge */}
          <button
            onClick={() => handleNav('landing')}
            className="flex items-center gap-3.5 group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-2xl p-1 -ml-1 transition-all"
            title="Go to Home - Learn what NutriSynth does"
          >
            <div className="relative">
              <img
                src="/logo.jpg"
                alt="NutriSynth Logo"
                className="w-12 h-12 rounded-2xl object-cover shadow-lg shadow-brand-500/25 ring-2 ring-brand-500/30 group-hover:scale-105 group-hover:shadow-brand-500/40 transition-all duration-300"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#15171b] rounded-full shadow-sm" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-xl sm:text-2xl text-stone-900 dark:text-white tracking-tight leading-none group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  NutriSynth
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Simple, Smart Nutrition Tracking</span>
              </div>
            </div>
          </button>

          {/* Desktop Navigation Dock */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3">
            <nav className="flex items-center gap-1 bg-stone-100/80 dark:bg-[#1a1c22]/90 p-1.5 rounded-2xl border border-stone-200/80 dark:border-[#2b2e38] shadow-inner">
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
                          ? 'bg-white dark:bg-[#252831] text-emerald-700 dark:text-emerald-300 shadow-md shadow-stone-900/5 dark:shadow-black/30 border border-stone-200/90 dark:border-stone-700 font-bold scale-[1.02]'
                          : disabled
                          ? 'text-stone-300 dark:text-stone-700 cursor-not-allowed opacity-60'
                          : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-800/70'
                      }`}
                  >
                    <Icon className={`w-4 h-4 transition-transform ${isActive ? 'text-brand-600 dark:text-brand-400 scale-110' : 'text-stone-400 dark:text-stone-500'}`} />
                    <span>{item.label}</span>
                    {item.badge && !isActive && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-brand-500/15 text-brand-600'}`}>
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <span className="w-5 h-1 rounded-full bg-gradient-to-r from-brand-500 to-emerald-500 absolute -bottom-0.5 left-1/2 -translate-x-1/2 shadow-sm" />
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
                      ? 'bg-white dark:bg-[#252831] text-brand-700 dark:text-brand-300 shadow-md border border-stone-200/90 dark:border-stone-700 font-bold'
                      : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-800/70'
                  }`}
                  aria-expanded={moreDropdownOpen}
                >
                  <span>More</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      moreDropdownOpen ? 'rotate-180 text-brand-500' : 'text-stone-400'
                    }`}
                  />
                </button>

                {moreDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMoreDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-52 py-2 bg-white dark:bg-[#1c1f26] rounded-2xl shadow-2xl border border-stone-200/80 dark:border-stone-800 z-50 animate-fade-in">
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
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                                : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/70'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-emerald-500' : 'text-stone-400'}`} />
                              <div className="min-w-0">
                                <div>{item.label}</div>
                                <div className="text-[10px] text-stone-400 font-normal truncate">{item.sublabel}</div>
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
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all active:scale-95"
                title="What do calories, protein, carbs, and fats mean? Learn in simple words"
              >
                <span>❓</span>
                <span className="hidden xl:inline">Plain English Guide</span>
                <span className="xl:hidden">Guide</span>
              </button>
            )}

            {/* Quick Action: + Log Food */}
            <button
              type="button"
              onClick={() => handleNav('food-search')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              title="What happens: Opens search to easily record a meal or snack"
            >
              <Plus className="w-4 h-4" />
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
                    : 'bg-stone-100 dark:bg-[#1e2026] text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-[#2f323a] hover:border-amber-500/40'
                }`}
              >
                <Flame className={`w-4.5 h-4.5 ${streakCount > 0 ? 'text-amber-500 fill-amber-500 animate-pulse' : 'text-stone-400'}`} />
                <span>{streakCount} {streakCount === 1 ? 'Day' : 'Days'}</span>
              </button>
            )}

            <div className="h-6 w-px bg-stone-200 dark:bg-stone-800 mx-0.5" />
            <ThemeToggle />

            {/* Desktop Auth & Profile Controls */}
            {authUser ? (
              <div className="flex items-center gap-2 pl-1 border-l border-stone-200 dark:border-stone-800">
                <div
                  className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80 shadow-sm"
                  title={authUser.email || authUser.displayName || 'Logged in user'}
                >
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                    {(authUser.displayName || authUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden xl:block text-left">
                    <div className="text-xs font-bold text-stone-900 dark:text-white max-w-[110px] truncate leading-tight">
                      {authUser.displayName || authUser.email?.split('@')[0]}
                    </div>
                    {profile?.diet && (
                      <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                        {profile.diet}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onSignOut}
                  title="Sign out of your account"
                  className="p-2.5 rounded-xl text-stone-400 hover:text-red-600 dark:text-stone-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuth?.('signin')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                title="What happens: Lets you log in or save your progress"
              >
                <LogIn className="w-4 h-4" />
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
              className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileOpen && (
          <nav className="lg:hidden pb-5 pt-3 space-y-2 animate-fade-in border-t border-stone-200/80 dark:border-stone-800 max-h-[80vh] overflow-y-auto overflow-x-hidden">
            {/* Quick Log Food CTA on Mobile */}
            <button
              type="button"
              onClick={() => handleNav('food-search')}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 shadow-md shadow-emerald-500/20 active:scale-95 transition-all mb-2"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>+ Log What You Ate Or Drank</span>
            </button>

            {onOpenGlossary && (
              <button
                type="button"
                onClick={() => {
                  onOpenGlossary();
                  setMobileOpen(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25 mb-2 font-bold text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">💡</span>
                  <div>
                    <div>New to Nutrition? Open Plain English Guide</div>
                    <div className="text-[10px] text-stone-500 font-normal">Learn what calories, protein, and carbs mean in 60 seconds</div>
                  </div>
                </div>
                <span>→</span>
              </button>
            )}

            {/* Core Pages */}
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 px-2 pt-1">
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
                        ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-sm'
                        : disabled
                        ? 'text-stone-300 dark:text-stone-700 cursor-not-allowed'
                        : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/80'
                    }`}
                >
                  <div className="flex items-center gap-3 text-left">
                    <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'}`} />
                    <div>
                      <div className="font-bold">{item.label}</div>
                      <div className="text-[10px] text-stone-400 font-normal">{item.sublabel}</div>
                    </div>
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-emerald-500/15 text-emerald-600'}`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && !item.badge && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Current</span>
                  )}
                </button>
              );
            })}

            {/* More Tools & Trackers */}
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 px-2 pt-3">
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
                        ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-sm'
                        : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/80'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'}`} />
                    <div>
                      <div className="font-bold">{item.label}</div>
                      <div className="text-[10px] text-stone-400 font-normal">{item.sublabel}</div>
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
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            >
              <Info className="w-4 h-4" />
              <span>About NutriSynth & Scientific References</span>
            </button>

            {/* Mobile Auth Button */}
            <div className="pt-3 border-t border-stone-200/80 dark:border-stone-800">
              {authUser ? (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-100 dark:bg-stone-800/70 border border-stone-200/80 dark:border-stone-700">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-600 text-white font-bold text-sm flex items-center justify-center">
                      {(authUser.displayName || authUser.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-900 dark:text-white">
                        {authUser.displayName || 'User'}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">
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
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-emerald-600 shadow-md shadow-brand-500/20"
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
    <footer className="border-t border-stone-200/60 dark:border-[#32353e] bg-white dark:bg-[#18191c] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="NutriSynth Logo"
              className="w-9 h-9 rounded-xl object-cover shadow-sm ring-1 ring-brand-500/30"
            />
            <div>
              <span className="font-bold text-stone-800 dark:text-stone-200 block leading-tight">NutriSynth</span>
              <span className="text-xs text-stone-400 dark:text-stone-500">
                Personalized Nutrition. Powered by Data.
              </span>
            </div>
          </div>
          <div className="text-xs">Built using recognized nutrition reference data</div>
        </div>
        <div className="mt-4 p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40">
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
