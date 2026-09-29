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
      className="mb-6 rounded-2xl sm:rounded-3xl border border-[#1E293B] bg-gradient-to-r from-[#22C55E]/10 via-[#0B0F0E] to-[#2DD4BF]/10 dark:from-[#0B0F0E] dark:via-[#07111F] dark:to-[#101D2D] shadow-sm transition-all duration-300"
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#22C55E] to-[#2DD4BF] text-[#07111F] font-bold flex items-center justify-center shadow-sm flex-shrink-0">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-[#34D399]">
                  Quick Guide
                </span>
                <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-[#22C55E]/50" />
                <span className="text-xs text-stone-500 dark:text-[#8492A6] font-medium">
                  {title}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-stone-900 dark:text-[#F8FAFC]">
                How this screen works
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenGlossary && (
              <button
                type="button"
                onClick={onOpenGlossary}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 dark:text-[#34D399] bg-[#22C55E]/15 hover:bg-[#22C55E]/25 border border-[#22C55E]/30 transition-all active:scale-95 cursor-pointer"
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
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-stone-600 dark:text-[#CBD5E1] bg-white/70 dark:bg-[#101D2D] hover:bg-white dark:hover:bg-[#101D2D]/80 border border-stone-200/80 dark:border-[#1E293B] transition-all cursor-pointer"
              aria-expanded={expanded}
              aria-label={expanded ? 'Minimize beginner guide' : 'Expand beginner guide'}
            >
              <span>{expanded ? 'Hide Guide' : 'Show Guide'}</span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-[#1E293B] grid gap-3 sm:grid-cols-3">
            {/* Question 1: What am I looking at? */}
            <div className="p-3.5 rounded-xl bg-white/80 dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-[#34D399] mb-1">
                  <span>👁️</span>
                  <span>1. What am I looking at?</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-700 dark:text-[#CBD5E1] leading-relaxed font-medium">
                  {whatAmILookingAt}
                </p>
              </div>
            </div>

            {/* Question 2: What should I do? */}
            <div className="p-3.5 rounded-xl bg-white/80 dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-[#34D399] mb-1">
                  <span>👉</span>
                  <span>2. What should I do?</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-700 dark:text-[#CBD5E1] leading-relaxed font-medium">
                  {whatShouldIDo}
                </p>
              </div>

              {actionLabel && actionHandler && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={actionHandler}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#07111F] bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] hover:opacity-95 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    {actionIcon}
                    <span>{actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  {primaryAction?.caption && (
                    <span className="block text-[10px] text-stone-500 dark:text-[#8492A6] mt-1 text-center font-medium">
                      {primaryAction.caption}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Question 3: What happens when I press this? */}
            <div className="p-3.5 rounded-xl bg-white/80 dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-[#34D399] mb-1">
                  <span>⚡</span>
                  <span>3. What happens next?</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-700 dark:text-[#CBD5E1] leading-relaxed font-medium">
                  {happensNextText}
                </p>
              </div>
              <div className="mt-2 text-[11px] text-[#34D399] flex items-center gap-1 font-semibold">
                <Sparkles className="w-3 h-3 text-[#22C55E]" />
                <span>Zero guesswork. Completely safe to try!</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
