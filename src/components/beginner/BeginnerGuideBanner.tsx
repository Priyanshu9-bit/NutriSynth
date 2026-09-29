import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles, ArrowRight, BookOpen, Lightbulb } from 'lucide-react';

export interface BeginnerGuideBannerProps {
  pageTitle?: string;
  screenTitle?: string;
  whatAmILookingAt: string;
  whatShouldIDo: string;
  whatHappensNext?: string;
  whatHappensWhenIPress?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  primaryActionIcon?: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick?: () => void;
    caption?: string;
    icon?: React.ReactNode;
  };
  onOpenGlossary?: () => void;
  defaultExpanded?: boolean;
}

export function BeginnerGuideBanner({
  pageTitle,
  screenTitle,
  whatAmILookingAt,
  whatShouldIDo,
  whatHappensNext,
  whatHappensWhenIPress,
  primaryActionLabel,
  onPrimaryAction,
  primaryActionIcon,
  primaryAction,
  onOpenGlossary,
  defaultExpanded = true,
}: BeginnerGuideBannerProps) {
  const [expanded, setExpanded] = useState<boolean>(defaultExpanded);
  const title = screenTitle || pageTitle || 'Guide';
  const happensNextText = whatHappensWhenIPress || whatHappensNext || '';
  const actionLabel = primaryAction?.label || primaryActionLabel;
  const actionHandler = primaryAction?.onClick || onPrimaryAction;
  const actionIcon = primaryAction?.icon || primaryActionIcon;

  return (
    <section
      aria-label={`Guide for ${title}`}
      className="mb-6 rounded-2xl sm:rounded-3xl border border-emerald-500/30 dark:border-emerald-500/25 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 dark:from-emerald-950/40 dark:via-[#1a2322] dark:to-emerald-950/30 shadow-sm transition-all duration-300"
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm flex-shrink-0">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Quick Guide
                </span>
                <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-emerald-500/50" />
                <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                  {title}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white">
                How this screen works
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenGlossary && (
              <button
                type="button"
                onClick={onOpenGlossary}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all active:scale-95"
                title="Open plain-English nutrition glossary"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Nutrition in Plain Words</span>
                <span className="xs:hidden">Glossary</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 bg-white/70 dark:bg-stone-800/80 hover:bg-white dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-700 transition-all"
              aria-expanded={expanded}
              aria-label={expanded ? 'Minimize beginner guide' : 'Expand beginner guide'}
            >
              <span>{expanded ? 'Hide Guide' : 'Show Guide'}</span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-emerald-500/20 dark:border-emerald-500/20 grid gap-3 sm:grid-cols-3">
            {/* Question 1: What am I looking at? */}
            <div className="p-3.5 rounded-xl bg-white/80 dark:bg-[#1a1c22]/90 border border-emerald-500/20 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                  <span>👁️</span>
                  <span>1. What am I looking at?</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-200 leading-relaxed font-medium">
                  {whatAmILookingAt}
                </p>
              </div>
            </div>

            {/* Question 2: What should I do? */}
            <div className="p-3.5 rounded-xl bg-white/80 dark:bg-[#1a1c22]/90 border border-emerald-500/20 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                  <span>👉</span>
                  <span>2. What should I do?</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-200 leading-relaxed font-medium">
                  {whatShouldIDo}
                </p>
              </div>

              {actionLabel && actionHandler && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={actionHandler}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-sm active:scale-95 transition-all"
                  >
                    {actionIcon}
                    <span>{actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  {primaryAction?.caption && (
                    <span className="block text-[10px] text-stone-500 dark:text-stone-400 mt-1 text-center font-medium">
                      {primaryAction.caption}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Question 3: What happens when I press this? */}
            <div className="p-3.5 rounded-xl bg-white/80 dark:bg-[#1a1c22]/90 border border-emerald-500/20 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                  <span>⚡</span>
                  <span>3. What happens next?</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-200 leading-relaxed font-medium">
                  {happensNextText}
                </p>
              </div>
              <div className="mt-2 text-[11px] text-emerald-700/80 dark:text-emerald-400/80 flex items-center gap-1 font-semibold">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span>Zero guesswork. Completely safe to try!</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
