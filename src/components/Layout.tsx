import { Home, Info, LayoutDashboard, UtensilsCrossed, Dna, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';

export type View = 'landing' | 'how-it-works' | 'dashboard' | 'meals' | 'deficiency' | 'about';

interface NavProps {
  currentView: View;
  onNavigate: (view: View) => void;
  hasProfile: boolean;
}

const navItems: { view: View; label: string; icon: typeof Home }[] = [
  { view: 'landing', label: 'Home', icon: Home },
  { view: 'how-it-works', label: 'How It Works', icon: Info },
  { view: 'dashboard', label: 'My Nutrition', icon: LayoutDashboard },
  { view: 'meals', label: 'Meals', icon: UtensilsCrossed },
  { view: 'deficiency', label: 'Deficiency Check', icon: Dna },
  { view: 'about', label: 'About', icon: Info },
];

export function Header({ currentView, onNavigate, hasProfile }: NavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (view: View) => {
    onNavigate(view);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/85 dark:bg-[#0c1017]/90 backdrop-blur-lg border-b border-stone-200/60 dark:border-stone-800/80 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button onClick={() => handleNav('landing')} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-700 flex items-center justify-center text-white font-display font-bold text-sm group-hover:shadow-glow transition-shadow">
              NS
            </div>
            <span className="font-display font-bold text-lg text-stone-900 dark:text-white hidden sm:block">NutriSynth</span>
          </button>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-4">
            <nav className="flex items-center gap-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const disabled = (item.view === 'dashboard' || item.view === 'meals') && !hasProfile;
                return (
                  <button
                    key={item.view}
                    onClick={() => !disabled && handleNav(item.view)}
                    disabled={disabled}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${currentView === item.view
                        ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold'
                        : disabled
                          ? 'text-stone-300 dark:text-stone-700 cursor-not-allowed'
                          : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/80 hover:text-stone-900 dark:hover:text-white'}`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="h-5 w-px bg-stone-200 dark:bg-stone-800 mx-1" />
            <ThemeToggle />
          </div>

          {/* Right Mobile Actions */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="lg:hidden pb-4 pt-2 space-y-1 animate-fade-in border-t border-stone-200/60 dark:border-stone-800/60">
            {navItems.map(item => {
              const Icon = item.icon;
              const disabled = (item.view === 'dashboard' || item.view === 'meals') && !hasProfile;
              return (
                <button
                  key={item.view}
                  onClick={() => !disabled && handleNav(item.view)}
                  disabled={disabled}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${currentView === item.view
                      ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold'
                      : disabled
                        ? 'text-stone-300 dark:text-stone-700 cursor-not-allowed'
                        : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'}`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-stone-200/60 dark:border-stone-800 bg-white dark:bg-[#0c1017] transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-emerald-700 flex items-center justify-center text-white font-bold text-xs">NS</div>
            <span className="font-medium text-stone-700 dark:text-stone-200">NutriSynth</span>
            <span className="text-stone-400 dark:text-stone-500">— Evidence-based personalized nutrition</span>
          </div>
          <div className="text-xs">Built using recognized nutrition reference data</div>
        </div>
        <div className="mt-4 p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40">
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed text-balance">
            <strong>Disclaimer:</strong> NutriSynth provides evidence-based general nutrition information and personalized dietary guidance based on the information provided. It does not diagnose medical conditions or confirm nutrient deficiencies. Nutritional needs can vary with health conditions, medications, allergies, laboratory findings, and other factors. Consult a qualified healthcare professional when appropriate.
          </p>
        </div>
      </div>
    </footer>
  );
}
