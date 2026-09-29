import React, { useState, useMemo } from 'react';
import {
  Gauge,
  Flame,
  Zap,
  Beef,
  Wheat,
  Droplet,
  Volume2,
  Sparkles,
  Activity,
  CheckCircle2,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import type { NutritionResult, UserProfile } from '@/lib/calculations';
import { playEngineRevSound, playChecklistSound } from '@/lib/soundEffects';

interface CalorieSpeedometerClusterProps {
  result: NutritionResult;
  profile: UserProfile;
  eatenCalories: number;
  eatenProtein: number;
  eatenCarbs: number;
  eatenFat: number;
  isGoalAchieved?: boolean;
}

type ClusterMode = 'speedometer' | 'dyno' | 'donut';

export function CalorieSpeedometerCluster({
  result,
  profile,
  eatenCalories,
  eatenProtein,
  eatenCarbs,
  eatenFat,
  isGoalAchieved = false,
}: CalorieSpeedometerClusterProps) {
  const [mode, setMode] = useState<ClusterMode>('speedometer');
  const [isRevving, setIsRevving] = useState<boolean>(false);
  const [revBonus, setRevBonus] = useState<number>(0);
  const [testPreset, setTestPreset] = useState<number | null>(null);

  const targetCalories = result.tdee || 2000;
  const liveCalories = Math.max(0, eatenCalories);

  // Active percentage: either simulated test preset (0%, 25%, 50%, 75%, 100%) or live eaten
  const activePercentage = testPreset !== null
    ? testPreset
    : Math.round((liveCalories / targetCalories) * 100);

  const currentDisplayedCalories = testPreset !== null
    ? Math.round((targetCalories * testPreset) / 100)
    : liveCalories;

  const displayPercentage = Math.min(125, activePercentage + revBonus);

  // High-octane fuel breakdown (Macro calories & percentages)
  const totalMacroCal = (result.proteinCal || 0) + (result.carbCal || 0) + (result.fatCal || 0) || 1;
  const proteinPct = Math.round(((result.proteinCal || 0) / totalMacroCal) * 100);
  const carbPct = Math.round(((result.carbCal || 0) / totalMacroCal) * 100);
  const fatPct = Math.max(0, 100 - proteinPct - carbPct);

  // Eaten macro percentages against individual targets
  const eatenProteinPct = Math.min(100, Math.round((eatenProtein / (result.proteinG || 1)) * 100));
  const eatenCarbPct = Math.min(100, Math.round((eatenCarbs / (result.carbG || 1)) * 100));
  const eatenFatPct = Math.min(100, Math.round((eatenFat / (result.fatG || 1)) * 100));

  // Motivational engine & wellness messaging based on current percentage
  const engineTelemetry = useMemo(() => {
    if (isGoalAchieved || activePercentage === 100) {
      return {
        gear: 'TARGET LOCKED',
        headline: '🏆 Peak Horsepower Achieved!',
        quote: 'Dyno perfection! Your intake matches your metabolic blueprint with laser precision.',
        badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        textColor: 'text-emerald-500 dark:text-emerald-400',
      };
    }
    if (activePercentage === 0) {
      return {
        gear: 'IDLE / NEUTRAL',
        headline: '🏎️ Key in Ignition • Cold Start',
        quote: 'Your metabolic engine is primed and waiting for clean, high-octane fuel today!',
        badgeColor: 'bg-stone-500/20 text-stone-400 border-stone-500/40',
        textColor: 'text-stone-500 dark:text-stone-400',
      };
    }
    if (activePercentage <= 29) {
      return {
        gear: 'GEAR 1 • WARM-UP',
        headline: '⚡ First Gear Engaged',
        quote: 'Smooth warmup roll! Gentle metabolic ignition building steady velocity for the day.',
        badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
        textColor: 'text-blue-500 dark:text-blue-400',
      };
    }
    if (activePercentage <= 65) {
      return {
        gear: 'GEAR 3 • CRUISING',
        headline: '🛣️ Sweet Spot RPM Flow',
        quote: 'Cruising cleanly in the efficiency band. Clean fuel combustion and steady energy delivery!',
        badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
        textColor: 'text-cyan-500 dark:text-cyan-400',
      };
    }
    if (activePercentage <= 95) {
      return {
        gear: 'GEAR 5 • POWER BAND',
        headline: '🏁 Checkered Flag in Sight',
        quote: 'High velocity performance! Your macro ratio is firing on all cylinders.',
        badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        textColor: 'text-amber-500 dark:text-amber-400',
      };
    }
    return {
      gear: 'OVERDRIVE / REDLINE',
      headline: '⚠️ Rev Limiter Active',
      quote: 'Energy target met! Favor light hydration, electrolytes, and crisp leafy greens.',
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
      textColor: 'text-rose-500 dark:text-rose-400',
    };
  }, [activePercentage, isGoalAchieved]);

  // Handle sports engine rev button
  const handleRevEngine = () => {
    if (isRevving) return;
    setIsRevving(true);
    playEngineRevSound();

    setRevBonus(18);
    setTimeout(() => {
      setRevBonus(32);
    }, 280);
    setTimeout(() => {
      setRevBonus(10);
    }, 550);
    setTimeout(() => {
      setRevBonus(0);
      setIsRevving(false);
    }, 900);
  };

  /**
   * SPEEDOMETER GEOMETRY DERIVATION:
   * Center: (130, 125), Radius: 95
   * Total sweep: 240 degrees (from 150° bottom-left to 390° / 30° bottom-right)
   *
   * 0%   => 150° (bottom-left)
   * 25%  => 210° (top-left)
   * 50%  => 270° (top-center, straight UP)
   * 75%  => 330° (top-right)
   * 100% => 390° (bottom-right)
   *
   * The SVG needle base is drawn pointing straight UP from (130, 125) to (130, 42).
   * Straight UP corresponds to 270° in standard polar math.
   * Therefore, rotation relative to UP is: rotationAngle = targetAngle - 270°.
   *
   * At 0%:   150° - 270° = -120° (points bottom-left)
   * At 25%:  210° - 270° = -60°  (points top-left)
   * At 50%:  270° - 270° = 0°    (points straight UP)
   * At 75%:  330° - 270° = +60°  (points top-right)
   * At 100%: 390° - 270° = +120° (points bottom-right)
   *
   * Increasing values ALWAYS rotate the needle CLOCKWISE without any backward jump!
   */
  const needleRotation = useMemo(() => {
    const clampedPct = Math.min(115, Math.max(0, displayPercentage));
    const targetAngle = 150 + (clampedPct / 100) * 240;
    return targetAngle - 270;
  }, [displayPercentage]);

  // Speedometer tick marks & numeric scale
  const tickMarks = useMemo(() => {
    const ticks = [];
    for (let i = 0; i <= 10; i++) {
      const pct = (i / 10) * 100;
      const angle = 150 + (pct / 100) * 240;
      const rad = (angle * Math.PI) / 180;
      const isMajor = i % 2 === 0;
      const isRedline = i >= 9;

      const rOuter = 95;
      const rInner = isMajor ? 82 : 87;
      const rText = 68;

      const x1 = 130 + rOuter * Math.cos(rad);
      const y1 = 125 + rOuter * Math.sin(rad);
      const x2 = 130 + rInner * Math.cos(rad);
      const y2 = 125 + rInner * Math.sin(rad);

      const tx = 130 + rText * Math.cos(rad);
      const ty = 125 + rText * Math.sin(rad);

      const val = Math.round((targetCalories * pct) / 100);

      ticks.push({
        id: i,
        x1,
        y1,
        x2,
        y2,
        tx,
        ty,
        val: val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${val}`,
        isMajor,
        isRedline,
        color: isRedline ? '#ef4444' : i >= 7 ? '#f59e0b' : '#10b981',
      });
    }
    return ticks;
  }, [targetCalories]);

  const handleSelectPreset = (preset: number | null) => {
    playChecklistSound(true);
    setTestPreset(preset);
  };

  return (
    <div className="flex flex-col justify-between h-full space-y-5">
      {/* Cockpit Mode Switcher Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-stone-200/80 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
              <span>Metabolic Tachometer</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                {targetCalories.toLocaleString()} KCAL REDLINE
              </span>
            </span>
          </div>
        </div>

        {/* View Mode Pill Toggle */}
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-[#1a1c22] p-1 rounded-xl border border-stone-200 dark:border-stone-800 text-xs">
          <button
            type="button"
            onClick={() => {
              playChecklistSound(true);
              setMode('speedometer');
            }}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
              mode === 'speedometer'
                ? 'bg-white dark:bg-[#282a32] text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            🏎️ Gauge
          </button>
          <button
            type="button"
            onClick={() => {
              playChecklistSound(true);
              setMode('dyno');
            }}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
              mode === 'dyno'
                ? 'bg-white dark:bg-[#282a32] text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            ⚡ Dyno
          </button>
          <button
            type="button"
            onClick={() => {
              playChecklistSound(true);
              setMode('donut');
            }}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
              mode === 'donut'
                ? 'bg-white dark:bg-[#282a32] text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            🍩 Ring
          </button>
        </div>
      </div>

      {/* Main Automotive Display Cluster */}
      {mode === 'speedometer' && (
        <div className="space-y-4">
          {/* Gauge & Macro Telemetry Grid */}
          <div className="grid sm:grid-cols-12 gap-6 items-center">
            {/* Left: Speedometer Gauge Dial */}
            <div className="sm:col-span-7 flex flex-col items-center justify-center relative">
              <div className="relative w-full max-w-[260px] h-[210px] flex items-center justify-center mx-auto">
                <svg viewBox="0 0 260 210" className="w-full h-full max-w-[260px] overflow-visible select-none">
                  <defs>
                    <filter id="needleGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#f97316" floodOpacity="0.8" />
                    </filter>
                    <filter id="redlineGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ef4444" floodOpacity="0.75" />
                    </filter>
                    <linearGradient id="speedArcGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="35%" stopColor="#06b6d4" />
                      <stop offset="70%" stopColor="#f59e0b" />
                      <stop offset="90%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>

                  {/* Outer Bezel Rings */}
                  <circle cx="130" cy="125" r="102" fill="none" className="stroke-stone-200/80 dark:stroke-stone-800" strokeWidth="1.5" />
                  <circle cx="130" cy="125" r="95" fill="none" className="stroke-stone-100 dark:stroke-[#1f2128]" strokeWidth="12" />

                  {/* Background Track Arc (240 deg sweep from 150° to 390°) */}
                  <path
                    d="M 47.73 172.5 A 95 95 0 1 1 212.27 172.5"
                    fill="none"
                    className="stroke-stone-200 dark:stroke-stone-800/90"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />

                  {/* Redline Sector Warning Arc (>90% to 110%) */}
                  <path
                    d="M 224.48 134.93 A 95 95 0 0 1 185.83 201.86"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="10"
                    strokeLinecap="round"
                    filter="url(#redlineGlow)"
                    opacity="0.85"
                  />

                  {/* Dynamic Active Intake Arc (Clockwise fill from bottom-left to bottom-right) */}
                  {displayPercentage > 0 && (
                    <path
                      d="M 47.73 172.5 A 95 95 0 1 1 212.27 172.5"
                      fill="none"
                      stroke="url(#speedArcGrad)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="398"
                      strokeDashoffset={Math.max(0, 398 - (Math.min(100, displayPercentage) / 100) * 398)}
                      className="transition-all duration-700 ease-out"
                    />
                  )}

                  {/* Radial Tick Marks and Scale Numerals */}
                  {tickMarks.map((tick) => (
                    <g key={tick.id}>
                      <line
                        x1={tick.x1}
                        y1={tick.y1}
                        x2={tick.x2}
                        y2={tick.y2}
                        stroke={tick.color}
                        strokeWidth={tick.isMajor ? 2.5 : 1.5}
                        strokeLinecap="round"
                        opacity={tick.isMajor ? 0.95 : 0.6}
                      />
                      {tick.isMajor && (
                        <text
                          x={tick.tx}
                          y={tick.ty}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className={`text-[9px] font-black tracking-tighter ${
                            tick.isRedline ? 'fill-red-500 font-extrabold' : 'fill-stone-500 dark:fill-stone-400'
                          }`}
                        >
                          {tick.val}
                        </text>
                      )}
                    </g>
                  ))}

                  {/* Center Digital HUD Readout */}
                  <g className="text-center">
                    <text
                      x="130"
                      y="105"
                      textAnchor="middle"
                      className="fill-stone-900 dark:fill-white font-display font-black text-2xl tracking-tight"
                    >
                      {Math.round(currentDisplayedCalories).toLocaleString()}
                    </text>
                    <text
                      x="130"
                      y="120"
                      textAnchor="middle"
                      className="fill-orange-500 dark:fill-orange-400 text-[9px] font-extrabold uppercase tracking-widest"
                    >
                      KCAL / DAY
                    </text>
                    <text
                      x="130"
                      y="134"
                      textAnchor="middle"
                      className="fill-stone-400 dark:fill-stone-500 text-[8px] font-bold"
                    >
                      {activePercentage}% FUEL BURN
                    </text>
                  </g>

                  {/* Sweeping Needles with High-Tech Hub:
                      Base points UP to (130, 42). Center is (130, 125).
                      Rotation transforms smoothly clockwise from -120° (0%) to +120° (100%). */}
                  <g
                    style={{
                      transformOrigin: '130px 125px',
                      transform: `rotate(${needleRotation}deg)`,
                      transition: isRevving
                        ? 'transform 200ms cubic-bezier(0.18, 0.89, 0.32, 1.28)'
                        : 'transform 700ms cubic-bezier(0.34, 1.3, 0.64, 1)',
                    }}
                  >
                    {/* Glowing Needle Body */}
                    <line
                      x1="130"
                      y1="125"
                      x2="130"
                      y2="42"
                      stroke="#f97316"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      filter="url(#needleGlow)"
                    />
                    {/* Core White Neon Pin */}
                    <line
                      x1="130"
                      y1="125"
                      x2="130"
                      y2="46"
                      stroke="#ffffff"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                    {/* Counterweight */}
                    <line
                      x1="130"
                      y1="125"
                      x2="130"
                      y2="142"
                      stroke="#78716c"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </g>

                  {/* Metallic Center Hub Pivot */}
                  <circle cx="130" cy="125" r="11" fill="#1c1917" className="stroke-stone-700" strokeWidth="2" />
                  <circle cx="130" cy="125" r="5" fill="#f97316" />
                  <circle cx="130" cy="125" r="2" fill="#ffffff" />
                </svg>
              </div>

              {/* Gear Status & Throttle Action */}
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${engineTelemetry.badgeColor}`}>
                  {engineTelemetry.gear}
                </span>
                <button
                  type="button"
                  onClick={handleRevEngine}
                  className="px-2.5 py-0.5 rounded-full bg-stone-100 hover:bg-orange-500 hover:text-white dark:bg-stone-800 dark:hover:bg-orange-600 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 text-[10px] font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer shadow-xs"
                  title="Rev metabolic engine with realistic sound effect!"
                >
                  <Volume2 className="w-3 h-3 text-orange-500" />
                  <span>Rev Engine</span>
                </button>
              </div>
            </div>

            {/* Right: High-Octane Macro Fuel Telemetry */}
            <div className="sm:col-span-5 space-y-3">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center justify-between">
                <span>⛽ Fuel Composition</span>
                <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">Target Mix</span>
              </div>

              {/* Macro Fuel 1: Protein */}
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-[#18191d] border border-stone-200/70 dark:border-stone-800/80 transition-all hover:border-emerald-500/40">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Nitrous Fuel (Protein)</span>
                  </span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {proteinPct}% <span className="text-[10px] font-semibold text-stone-400">({result.proteinCal} kcal)</span>
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                    style={{ width: `${eatenProteinPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400 mt-1">
                  <span>Intake: {Math.round(eatenProtein)}g</span>
                  <span>Target: {result.proteinG}g</span>
                </div>
              </div>

              {/* Macro Fuel 2: Carbs */}
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-[#18191d] border border-stone-200/70 dark:border-stone-800/80 transition-all hover:border-cyan-500/40">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    <span>Turbo Boost (Carbs)</span>
                  </span>
                  <span className="font-extrabold text-cyan-600 dark:text-cyan-400 tabular-nums">
                    {carbPct}% <span className="text-[10px] font-semibold text-stone-400">({result.carbCal} kcal)</span>
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700"
                    style={{ width: `${eatenCarbPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400 mt-1">
                  <span>Intake: {Math.round(eatenCarbs)}g</span>
                  <span>Target: {result.carbG}g</span>
                </div>
              </div>

              {/* Macro Fuel 3: Fat */}
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-[#18191d] border border-stone-200/70 dark:border-stone-800/80 transition-all hover:border-amber-500/40">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Synthetic Oil (Fats)</span>
                  </span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                    {fatPct}% <span className="text-[10px] font-semibold text-stone-400">({result.fatCal} kcal)</span>
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-700"
                    style={{ width: `${eatenFatPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400 mt-1">
                  <span>Intake: {Math.round(eatenFat)}g</span>
                  <span>Target: {result.fatG}g</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Test & Calibration Toolbar (0%, 25%, 50%, 75%, 100%) */}
          <div className="p-3 rounded-2xl bg-stone-100/80 dark:bg-[#17191e] border border-stone-200/80 dark:border-[#2a2d36] flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-orange-500" />
              <span className="font-bold text-stone-800 dark:text-stone-200 text-[11px]">
                Interactive Speedometer Calibration:
              </span>
              {testPreset !== null && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-600 dark:text-orange-400">
                  Testing {testPreset}%
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleSelectPreset(null)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  testPreset === null
                    ? 'bg-orange-600 text-white shadow-sm scale-105'
                    : 'bg-white dark:bg-[#23262f] text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white border border-stone-200 dark:border-stone-700'
                }`}
                title="Return to real-time eaten calories"
              >
                <span>Live ({Math.round(liveCalories)} kcal)</span>
              </button>

              {[0, 25, 50, 75, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleSelectPreset(val)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                    testPreset === val
                      ? 'bg-orange-600 text-white shadow-sm scale-105'
                      : 'bg-white dark:bg-[#23262f] text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white border border-stone-200 dark:border-stone-700'
                  }`}
                  title={`Test needle sweep at ${val}%`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>

          {/* Motivational Engine Commentary Banner */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-emerald-500/10 border border-orange-500/25 flex items-start gap-2.5 animate-fade-in text-xs">
            <span className="text-base flex-shrink-0 mt-0.5">🏎️</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-stone-900 dark:text-white">
                  {engineTelemetry.headline}
                </span>
                <span className="text-[10px] text-stone-400 dark:text-stone-500 font-semibold">
                  • {Math.round(currentDisplayedCalories)} / {targetCalories} kcal
                </span>
              </div>
              <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-0.5 leading-relaxed">
                {engineTelemetry.quote}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Dyno Power & Turbo Boost Meter */}
      {mode === 'dyno' && (
        <div className="space-y-4 py-1">
          <div className="p-4 rounded-2xl bg-stone-900 text-white border border-stone-800 shadow-inner relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(#f97316 1px, transparent 1px), linear-gradient(90deg, #f97316 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />

            <div className="flex items-center justify-between relative z-10 mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-400 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-orange-300">
                  Chassis Dyno • Live Horsepower & Torque
                </span>
              </div>
              <span className="text-xs font-extrabold text-stone-400">
                Max Output: {targetCalories} kcal
              </span>
            </div>

            <div className="space-y-3 relative z-10">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-300 font-bold flex items-center gap-1.5">
                    <span>⚡ Boost Pressure (Energy Intake)</span>
                  </span>
                  <span className="font-extrabold text-orange-400 tabular-nums">
                    {Math.round(currentDisplayedCalories)} / {targetCalories} kcal ({activePercentage}%)
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-stone-800 p-0.5 border border-stone-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 transition-all duration-700"
                    style={{ width: `${Math.min(100, activePercentage)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-300 font-bold flex items-center gap-1.5">
                    <span>🥩 Nitrous Injection (Protein Synthesis)</span>
                  </span>
                  <span className="font-extrabold text-emerald-400 tabular-nums">
                    {Math.round(eatenProtein)} / {result.proteinG}g ({eatenProteinPct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-stone-800 p-0.5 border border-stone-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                    style={{ width: `${eatenProteinPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 3: Fuel Ring */}
      {mode === 'donut' && (
        <div className="py-2 flex flex-col items-center justify-center space-y-3">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
              <circle cx="80" cy="80" r="65" fill="none" className="stroke-stone-200 dark:stroke-stone-800" strokeWidth="14" />
              <circle
                cx="80"
                cy="80"
                r="65"
                fill="none"
                stroke="#f97316"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray="408"
                strokeDashoffset={Math.max(0, 408 - (Math.min(100, activePercentage) / 100) * 408)}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-display font-black text-2xl text-stone-900 dark:text-white">
                {Math.round(currentDisplayedCalories)}
              </span>
              <span className="text-[10px] font-bold text-stone-400 uppercase">
                / {targetCalories} kcal
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
