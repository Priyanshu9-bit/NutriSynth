import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'button' | 'switch';
}

export function ThemeToggle({
  className = '',
  showLabel = false,
  variant = 'button',
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'switch') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        role="switch"
        aria-checked={isDark}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500/50 p-1 ${
          isDark ? 'bg-stone-800 border border-stone-700' : 'bg-stone-200 border border-stone-300'
        } ${className}`}
      >
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full bg-white text-stone-800 shadow-md transition-transform duration-300 ${
            isDark ? 'translate-x-8 bg-stone-900 text-amber-400' : 'translate-x-0 text-amber-500'
          }`}
        >
          {isDark ? (
            <Moon className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-fade-in" />
          ) : (
            <Sun className="w-3.5 h-3.5 fill-amber-400 text-amber-500 animate-fade-in" />
          )}
        </span>
        <span className="sr-only">Toggle theme</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`group relative flex items-center justify-center gap-2 p-2 rounded-xl text-sm font-medium transition-all duration-300 border active:scale-95 ${
        isDark
          ? 'bg-stone-800/80 hover:bg-stone-700/80 text-amber-400 border-stone-700 shadow-inner'
          : 'bg-stone-100 hover:bg-stone-200/80 text-stone-700 border-stone-200 shadow-sm'
      } ${className}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
        {/* Sun Icon */}
        <Sun
          className={`w-4 h-4 transition-all duration-500 ${
            isDark
              ? 'opacity-0 rotate-90 scale-50 absolute'
              : 'opacity-100 rotate-0 scale-100 text-amber-500 fill-amber-400/20'
          }`}
        />
        {/* Moon Icon */}
        <Moon
          className={`w-4 h-4 transition-all duration-500 ${
            isDark
              ? 'opacity-100 rotate-0 scale-100 text-amber-400 fill-amber-400/30'
              : 'opacity-0 -rotate-90 scale-50 absolute'
          }`}
        />
      </div>

      {showLabel && (
        <span className="text-xs font-semibold tracking-wide">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
    </button>
  );
}
