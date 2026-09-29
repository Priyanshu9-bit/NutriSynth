import React from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Plus,
  ShoppingCart,
  Activity,
  Flame,
  Settings,
} from 'lucide-react';
import type { View } from '@/components/Layout';
import { playChecklistSound } from '@/lib/soundEffects';

interface MobileBottomNavProps {
  currentView: View;
  onNavigate: (view: View) => void;
  hasProfile: boolean;
}

export function MobileBottomNav({ currentView, onNavigate, hasProfile }: MobileBottomNavProps) {
  if (!hasProfile) return null;

  const handleNav = (v: View) => {
    playChecklistSound(true);
    onNavigate(v);
  };

  const navItems = [
    { view: 'dashboard' as View, label: 'Today', sublabel: "Today's Energy", icon: LayoutDashboard },
    { view: 'planner' as View, label: 'Meal Ideas', sublabel: 'Easy Recipes', icon: UtensilsCrossed },
    { view: 'food-search' as View, label: '+ Log Food', sublabel: 'Record Meal', icon: Plus, isAction: true },
    { view: 'grocery' as View, label: 'Shopping', sublabel: 'Grocery List', icon: ShoppingCart },
    { view: 'analytics' as View, label: 'Progress', sublabel: 'Trends & Stats', icon: Activity },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#07111F]/95 backdrop-blur-xl border-t border-stone-200/80 dark:border-[#1E293B] px-3 py-2 shadow-2xl safe-area-bottom">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => handleNav(item.view)}
                className="flex flex-col items-center -mt-6 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#22C55E] to-[#2DD4BF] text-[#07111F] font-bold flex items-center justify-center shadow-lg shadow-emerald-500/20 border-2 border-white dark:border-[#07111F] transition-transform active:scale-95 group-hover:scale-105">
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-[#34D399] mt-1">
                  Log Food
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.view}
              type="button"
              onClick={() => handleNav(item.view)}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-[#22C55E] dark:text-[#34D399] font-extrabold'
                  : 'text-stone-400 dark:text-[#8492A6] hover:text-stone-700 dark:hover:text-[#F8FAFC] font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
