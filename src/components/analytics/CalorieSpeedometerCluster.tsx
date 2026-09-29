import { useState, useMemo } from 'react';
import {
  Gauge,
  Zap,
  Activity,
  Sliders,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Compass,
  Timer,
  Sparkles,
  Award,
} from 'lucide-react';
import type { NutritionResult, UserProfile } from '@/lib/calculations';
import { playEngineRevSound, playDynoPullSound, playChecklistSound } from '@/lib/soundEffects';

interface CalorieSpeedometerClusterProps {
  result: NutritionResult;
  profile: UserProfile;
  eatenCalories: number;
  eatenProtein: number;
  eatenCarbs: number;
  eatenFat: number;
  isGoalAchieved?: boolean;
}

type ClusterMode = 'speedometer' | 'dyno' | 'telemetry';
type DriveMode = 'strada' | 'sport' | 'corsa';
type TuneStage = 'stock' | 'stage1' | 'stage2';

interface DynoRecord {
  id: string;
  timestamp: string;
  peakHp: number;
  torque: number;
  rpm: number;
  stageName: string;
  quarterMile: string;
}

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
  const [driveMode, setDriveMode] = useState<DriveMode>('sport');
  const [tuneStage, setTuneStage] = useState<TuneStage>('stock');
  const [isRevving, setIsRevving] = useState<boolean>(false);
  const [revBonus, setRevBonus] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [testPreset, setTestPreset] = useState<number | null>(null);

  // Dyno Pull Simulation State
  const [isDynoRunning, setIsDynoRunning] = useState<boolean>(false);
  const [dynoProgress, setDynoProgress] = useState<number>(0);
  const [dynoRpm, setDynoRpm] = useState<number>(1800);
  const [dynoPeakHp, setDynoPeakHp] = useState<number | null>(null);
  const [hoveredRpm, setHoveredRpm] = useState<number | null>(null);
  const [dynoHistory, setDynoHistory] = useState<DynoRecord[]>([]);

  const targetCalories = result.tdee || 2000;
  const liveCalories = Math.max(0, eatenCalories);

  // Active percentage: either simulated test preset (0%, 25%, 50%, 75%, 100%, 115%) or live eaten
  const activePercentage =
    testPreset !== null ? testPreset : Math.round((liveCalories / targetCalories) * 100);

  const currentDisplayedCalories =
    testPreset !== null ? Math.round((targetCalories * testPreset) / 100) : liveCalories;

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

  // Tuning Multipliers
  const tuneMultiplier = tuneStage === 'stage2' ? 1.25 : tuneStage === 'stage1' ? 1.15 : 1.0;
  const driveModeBoost = driveMode === 'corsa' ? 1.08 : driveMode === 'sport' ? 1.04 : 1.0;

  // Metabolic Horsepower & Torque Physics Calculation
  // 1 kcal = 4,184 Joules. Metabolized throughout the day: (TDEE * 4184 / 86400) = continuous Watts * 0.001341 = HP
  // Scaled to sports dyno benchmark: (TDEE / 8.5) gives realistic high-performance HP output index!
  const userWeight = profile.weight || 75;
  const baseHorsepower = Math.round((targetCalories / 8.5) * tuneMultiplier * driveModeBoost);
  const currentHorsepower = Math.round(
    ((currentDisplayedCalories / 8.5) * (1 + revBonus / 100)) * tuneMultiplier * driveModeBoost
  );
  const peakTorqueNm = Math.round(baseHorsepower * 1.28);
  const currentTorqueNm = Math.round(currentHorsepower * 1.28);
  const powerToWeight = (baseHorsepower / userWeight).toFixed(2); // HP per kg
  const thermicEfficiency = Math.round(10 + (proteinPct / 100) * 8 * (tuneStage !== 'stock' ? 1.2 : 1)); // TEF %

  // Quarter-Mile Acceleration & Trap Velocity Physics (NHRA Formula)
  const weightLbs = userWeight * 2.20462;
  const effectiveHp = Math.max(60, currentHorsepower || baseHorsepower);
  const quarterMileET = (5.825 * Math.cbrt(weightLbs / effectiveHp)).toFixed(2);
  const trapSpeedMph = Math.round(234 * Math.cbrt(effectiveHp / weightLbs));
  const zeroToHundredSec = Math.max(2.5, ((weightLbs / effectiveHp) * 0.44)).toFixed(1);

  // Speedometer Needle Rotation Calculation
  // Center: (130, 125). Total sweep: 240 degrees (from 150° bottom-left to 390° bottom-right)
  // Base needle points straight UP (270°). targetAngle - 270 gives rotation degrees.
  const needleRotation = useMemo(() => {
    const clampedPct = Math.min(118, Math.max(0, displayPercentage));
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
        color: isRedline ? '#ef4444' : i >= 7 ? '#f59e0b' : '#22C55E',
      });
    }
    return ticks;
  }, [targetCalories]);

  // Motivational engine & telemetry status
  const engineTelemetry = useMemo(() => {
    if (isGoalAchieved || activePercentage === 100) {
      return {
        gear: 'TARGET LOCKED (6TH GEAR)',
        headline: '🏆 Peak Horsepower & Velocity Achieved!',
        quote: 'Dyno perfection! Fuel intake matches your metabolic blueprint with laser precision.',
        badgeColor: 'bg-emerald-500/20 text-[#34D399] border-emerald-500/40',
        textColor: 'text-[#34D399]',
        rpmStatus: '8,200 RPM Peak Dyno',
      };
    }
    if (activePercentage === 0) {
      return {
        gear: 'PARK / COLD START',
        headline: '🏎️ Key In Ignition • Primed at Idle',
        quote: 'Metabolic engine is warm and ready for clean, high-octane morning fuel.',
        badgeColor: 'bg-[#101D2D] text-[#8492A6] border-[#1E293B]',
        textColor: 'text-[#8492A6]',
        rpmStatus: '850 RPM Idle',
      };
    }
    if (activePercentage <= 29) {
      return {
        gear: 'GEAR 1 • WARM-UP ROLL',
        headline: '⚡ First Gear Engaged • Building Velocity',
        quote: 'Smooth metabolic ignition! Nutrients are absorbing and powering your morning rhythm.',
        badgeColor: 'bg-[#60A5FA]/20 text-[#60A5FA] border-[#60A5FA]/40',
        textColor: 'text-[#60A5FA]',
        rpmStatus: '2,400 RPM Warmup',
      };
    }
    if (activePercentage <= 65) {
      return {
        gear: 'GEAR 3 • SWEET SPOT CRUISE',
        headline: '🛣️ Cruising in Peak Efficiency Band',
        quote: 'Optimal combustion! Smooth glycogen storage, steady insulin, and sustained stamina.',
        badgeColor: 'bg-teal-500/20 text-[#2DD4BF] border-teal-500/40',
        textColor: 'text-[#2DD4BF]',
        rpmStatus: '4,500 RPM Power Band',
      };
    }
    if (activePercentage <= 95) {
      return {
        gear: 'GEAR 5 • POWER RUN',
        headline: '🏁 High-Torque Acceleration',
        quote: 'High velocity performance! Your macro ratio is firing cleanly on all cylinders.',
        badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        textColor: 'text-amber-400',
        rpmStatus: '6,800 RPM High Boost',
      };
    }
    return {
      gear: 'OVERDRIVE / REV LIMITER',
      headline: '⚠️ Redline Warning • Target Achieved',
      quote: 'Energy target met! Switch throttle to light water, minerals, and restorative recovery.',
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
      textColor: 'text-rose-400',
      rpmStatus: '8,600 RPM Redline Limit',
    };
  }, [activePercentage, isGoalAchieved]);

  // Handle sports engine rev button
  const handleRevEngine = () => {
    if (isRevving) return;
    setIsRevving(true);
    if (soundEnabled) playEngineRevSound();

    setRevBonus(18);
    setTimeout(() => setRevBonus(32), 260);
    setTimeout(() => setRevBonus(10), 550);
    setTimeout(() => {
      setRevBonus(0);
      setIsRevving(false);
    }, 850);
  };

  // Launch Control: 0 to 100% full sweep demonstration
  const handleLaunchControl = () => {
    if (isRevving) return;
    setIsRevving(true);
    if (soundEnabled) playEngineRevSound();

    let step = 0;
    const launchInterval = setInterval(() => {
      step += 15;
      if (step >= 115) {
        clearInterval(launchInterval);
        setTimeout(() => {
          setIsRevving(false);
          setRevBonus(0);
        }, 400);
      } else {
        setRevBonus(step);
      }
    }, 90);
  };

  // Chassis Dyno Run Simulation with Sound and History Logging
  const handleStartDynoPull = () => {
    if (isDynoRunning) return;
    setIsDynoRunning(true);
    setDynoProgress(0);
    setDynoRpm(1800);
    setDynoPeakHp(null);
    if (soundEnabled) playDynoPullSound();

    const startTime = Date.now();
    const duration = 3500; // 3.5s pull

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      setDynoProgress(progress);

      // RPM curve from 1800 to 8200 RPM
      const currentRpm = Math.round(1800 + progress * 6400);
      setDynoRpm(currentRpm);

      if (progress >= 1) {
        clearInterval(interval);
        setIsDynoRunning(false);
        setDynoPeakHp(baseHorsepower);
        playChecklistSound(true);

        // Record dyno pull run
        const stageLabel =
          tuneStage === 'stage2'
            ? 'Stage 2 Nitro'
            : tuneStage === 'stage1'
            ? 'Stage 1 Thermic'
            : 'Standard TDEE';

        const newRecord: DynoRecord = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          peakHp: baseHorsepower,
          torque: peakTorqueNm,
          rpm: 6500,
          stageName: stageLabel,
          quarterMile: `${quarterMileET}s @ ${trapSpeedMph}mph`,
        };
        setDynoHistory((prev) => [newRecord, ...prev].slice(0, 3));
      }
    }, 50);
  };

  const handleSelectPreset = (preset: number | null) => {
    playChecklistSound(true);
    setTestPreset(preset);
  };

  return (
    <div className="flex flex-col justify-between h-full space-y-5">
      {/* Cockpit Mode Switcher Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-[#1E293B]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#22C55E] to-[#2DD4BF] text-[#07111F] flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
            <Gauge className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5">
              <span>Metabolic Tachometer & Dyno Lab</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-[#101D2D] text-[#34D399] border border-[#1E293B]">
                {targetCalories.toLocaleString()} KCAL REDLINE
              </span>
            </span>
          </div>
        </div>

        {/* View Mode Pill Toggle & Sound Switch */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Drive Mode Selector: Strada / Sport / Corsa */}
          <div className="hidden sm:flex items-center gap-1 bg-[#101D2D] p-1 rounded-xl border border-[#1E293B] text-[11px]">
            {(['strada', 'sport', 'corsa'] as DriveMode[]).map((dm) => (
              <button
                key={dm}
                type="button"
                onClick={() => {
                  playChecklistSound(true);
                  setDriveMode(dm);
                }}
                className={`px-2 py-0.5 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                  driveMode === dm
                    ? 'bg-[#07111F] text-[#34D399] border border-emerald-500/30'
                    : 'text-[#8492A6] hover:text-[#F8FAFC]'
                }`}
                title={`Switch to ${dm.toUpperCase()} mode`}
              >
                {dm}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-xl bg-[#101D2D] text-[#8492A6] hover:text-[#34D399] border border-[#1E293B] transition-colors cursor-pointer"
            title={soundEnabled ? 'Engine Audio Enabled (Click to Mute)' : 'Engine Audio Muted (Click to Enable)'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#34D399]" /> : <VolumeX className="w-3.5 h-3.5 text-[#8492A6]" />}
          </button>

          <div className="flex items-center gap-1 bg-[#101D2D] p-1 rounded-xl border border-[#1E293B] text-xs">
            <button
              type="button"
              onClick={() => {
                playChecklistSound(true);
                setMode('speedometer');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                mode === 'speedometer'
                  ? 'bg-[#07111F] text-[#34D399] shadow-sm border border-emerald-500/30'
                  : 'text-[#8492A6] hover:text-[#F8FAFC]'
              }`}
            >
              🏎️ Speedometer
            </button>
            <button
              type="button"
              onClick={() => {
                playChecklistSound(true);
                setMode('dyno');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                mode === 'dyno'
                  ? 'bg-[#07111F] text-[#34D399] shadow-sm border border-emerald-500/30'
                  : 'text-[#8492A6] hover:text-[#F8FAFC]'
              }`}
            >
              ⚡ Horsepower Dyno
            </button>
            <button
              type="button"
              onClick={() => {
                playChecklistSound(true);
                setMode('telemetry');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                mode === 'telemetry'
                  ? 'bg-[#07111F] text-[#34D399] shadow-sm border border-emerald-500/30'
                  : 'text-[#8492A6] hover:text-[#F8FAFC]'
              }`}
            >
              🚀 ECU Telemetry
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: ADVANCED SUPERCAR SPEEDOMETER CLUSTER                             */}
      {/* ========================================================================= */}
      {mode === 'speedometer' && (
        <div className="space-y-4">
          {/* Main Dial & Auxiliary Gauges Grid */}
          <div className="grid sm:grid-cols-12 gap-5 items-center">
            {/* Center Speedometer Gauge Dial */}
            <div className="sm:col-span-7 flex flex-col items-center justify-center relative">
              {/* F1 Supercar LED Shift Indicator Light Strip */}
              <div className="flex items-center justify-center gap-1.5 mb-2 px-3 py-1 rounded-full bg-[#07111F] border border-[#1E293B] shadow-inner select-none">
                <span className="text-[9px] font-black tracking-widest text-[#8492A6] mr-1">RPM</span>
                {[
                  { id: 1, threshold: 25, color: 'bg-emerald-500 shadow-emerald-500/80' },
                  { id: 2, threshold: 45, color: 'bg-emerald-500 shadow-emerald-500/80' },
                  { id: 3, threshold: 60, color: 'bg-emerald-400 shadow-emerald-400/80' },
                  { id: 4, threshold: 72, color: 'bg-amber-400 shadow-amber-400/80' },
                  { id: 5, threshold: 82, color: 'bg-amber-500 shadow-amber-500/80' },
                  { id: 6, threshold: 90, color: 'bg-orange-500 shadow-orange-500/80' },
                  { id: 7, threshold: 96, color: 'bg-rose-500 shadow-rose-500/90' },
                  { id: 8, threshold: 100, color: 'bg-red-500 shadow-red-500/90' },
                  { id: 9, threshold: 105, color: 'bg-blue-400 shadow-blue-400/90 animate-pulse' },
                ].map((led) => {
                  const isActive = displayPercentage >= led.threshold;
                  return (
                    <div
                      key={led.id}
                      className={`w-2 h-3.5 rounded-xs transition-all duration-150 ${
                        isActive ? `${led.color} shadow-sm scale-110` : 'bg-[#1E293B] opacity-40'
                      }`}
                    />
                  );
                })}
                <span className="text-[9px] font-bold text-[#CBD5E1] ml-1 tabular-nums">
                  {Math.min(9200, Math.round(850 + (displayPercentage / 100) * 7350))} RPM
                </span>
              </div>

              <div className="relative w-full max-w-[270px] h-[220px] flex items-center justify-center mx-auto">
                <svg viewBox="0 0 260 210" className="w-full h-full max-w-[260px] overflow-visible select-none">
                  <defs>
                    <filter id="needleGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#2DD4BF" floodOpacity="0.9" />
                    </filter>
                    <filter id="redlineGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#ef4444" floodOpacity="0.85" />
                    </filter>
                    <linearGradient id="speedArcGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22C55E" />
                      <stop offset="45%" stopColor="#2DD4BF" />
                      <stop offset="75%" stopColor="#60A5FA" />
                      <stop offset="90%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                    <radialGradient id="dialFaceGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#101D2D" stopOpacity="0.6" />
                      <stop offset="85%" stopColor="#0B0F0E" stopOpacity="0.95" />
                      <stop offset="100%" stopColor="#07111F" stopOpacity="1" />
                    </radialGradient>
                  </defs>

                  {/* Dial Backing Face with Subtle Carbon Shadow */}
                  <circle cx="130" cy="125" r="102" fill="url(#dialFaceGrad)" className="stroke-[#1E293B]" strokeWidth="2" />
                  <circle cx="130" cy="125" r="95" fill="none" className="stroke-[#101D2D]" strokeWidth="12" />

                  {/* Background Track Arc (240 deg sweep from 150° to 390°) */}
                  <path
                    d="M 47.73 172.5 A 95 95 0 1 1 212.27 172.5"
                    fill="none"
                    className="stroke-[#101D2D]"
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
                      strokeWidth="9"
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
                            tick.isRedline ? 'fill-red-500 font-extrabold' : 'fill-[#CBD5E1]'
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
                      className="text-[28px] font-black fill-[#F8FAFC] tracking-tight font-display"
                    >
                      {Math.round(currentDisplayedCalories)}
                    </text>
                    <text
                      x="130"
                      y="122"
                      textAnchor="middle"
                      className="text-[10px] font-extrabold fill-[#8492A6] uppercase tracking-widest"
                    >
                      KCAL / DAY
                    </text>
                    <text
                      x="130"
                      y="142"
                      textAnchor="middle"
                      className="text-[14px] font-black fill-[#34D399]"
                    >
                      {displayPercentage}%
                    </text>
                  </g>

                  {/* High-Precision Tachometer Needle with Glow */}
                  <g
                    transform={`rotate(${needleRotation} 130 125)`}
                    className="transition-transform duration-500 ease-out"
                  >
                    {/* Glowing Needle Body */}
                    <line
                      x1="130"
                      y1="125"
                      x2="130"
                      y2="42"
                      stroke="#2DD4BF"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      filter="url(#needleGlow)"
                    />
                    <line
                      x1="130"
                      y1="125"
                      x2="130"
                      y2="46"
                      stroke="#F8FAFC"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                    {/* Counterweight */}
                    <line
                      x1="130"
                      y1="125"
                      x2="130"
                      y2="142"
                      stroke="#8492A6"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </g>

                  {/* Titanium Center Pivot */}
                  <circle cx="130" cy="125" r="11" fill="#07111F" stroke="#1E293B" strokeWidth="2.5" />
                  <circle cx="130" cy="125" r="5" fill="#2DD4BF" />
                  <circle cx="130" cy="125" r="2" fill="#F8FAFC" />
                </svg>
              </div>

              {/* Gear Status & Rev Action Buttons */}
              <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
                <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border ${engineTelemetry.badgeColor}`}>
                  {engineTelemetry.gear}
                </span>

                <button
                  type="button"
                  onClick={handleRevEngine}
                  disabled={isRevving}
                  className="px-3 py-1 rounded-full bg-[#101D2D] hover:bg-[#22C55E] hover:text-[#07111F] text-[#CBD5E1] border border-[#1E293B] text-[10px] font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer shadow-xs"
                  title="Rev metabolic engine with realistic sound effect!"
                >
                  <Volume2 className="w-3 h-3 text-[#34D399]" />
                  <span>Rev Engine</span>
                </button>

                <button
                  type="button"
                  onClick={handleLaunchControl}
                  disabled={isRevving}
                  className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500 hover:to-orange-500 text-amber-300 hover:text-[#07111F] border border-amber-500/40 text-[10px] font-black transition-all flex items-center gap-1 active:scale-95 cursor-pointer shadow-xs"
                  title="0-100% Launch Control Sprint Test"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Launch Control</span>
                </button>
              </div>
            </div>

            {/* Right: Auxiliary Mini-Gauges (Turbo Boost & Fuel Composition) */}
            <div className="sm:col-span-5 space-y-3">
              {/* Auxiliary Mini-Gauge: Turbo Boost Protein Pressure */}
              <div className="p-3 rounded-2xl bg-[#101D2D] border border-[#1E293B] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#F8FAFC] flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#2DD4BF]" />
                    <span>Turbo Boost (Protein PSI)</span>
                  </span>
                  <span className="font-extrabold text-[#34D399] tabular-nums">
                    {Math.round((eatenProteinPct / 100) * 18.5)} PSI • {eatenProteinPct}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#07111F] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] transition-all duration-700"
                    style={{ width: `${eatenProteinPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#8492A6]">
                  <span>{Math.round(eatenProtein)}g intake</span>
                  <span>Target: {result.proteinG}g</span>
                </div>
              </div>

              {/* Macro Fuel 2: Carbs Boost */}
              <div className="p-3 rounded-2xl bg-[#101D2D] border border-[#1E293B] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#F8FAFC] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#60A5FA]" />
                    <span>High-Octane Energy (Carbs)</span>
                  </span>
                  <span className="font-extrabold text-[#60A5FA] tabular-nums">
                    {carbPct}% • {result.carbCal} kcal
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#07111F] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#60A5FA] to-cyan-400 transition-all duration-700"
                    style={{ width: `${eatenCarbPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#8492A6]">
                  <span>{Math.round(eatenCarbs)}g intake</span>
                  <span>Target: {result.carbG}g</span>
                </div>
              </div>

              {/* Macro Fuel 3: Synthetic Lubrication Fats */}
              <div className="p-3 rounded-2xl bg-[#101D2D] border border-[#1E293B] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#F8FAFC] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Synthetic Oil (Healthy Fats)</span>
                  </span>
                  <span className="font-extrabold text-amber-400 tabular-nums">
                    {fatPct}% • {result.fatCal} kcal
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#07111F] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-700"
                    style={{ width: `${eatenFatPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#8492A6]">
                  <span>{Math.round(eatenFat)}g intake</span>
                  <span>Target: {result.fatG}g</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Transmission Shifter Bar (P - 1 - 2 - 3 - S - R) */}
          <div className="p-3 rounded-2xl bg-[#101D2D] border border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-[#34D399]" />
              <span className="font-bold text-[#CBD5E1] text-[11px]">
                Gear Transmission Shifter (Simulate Intake):
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleSelectPreset(null)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  testPreset === null
                    ? 'bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] shadow-sm scale-105'
                    : 'bg-[#0B0F0E] text-[#CBD5E1] hover:text-[#F8FAFC] border border-[#1E293B]'
                }`}
                title="Return to real-time eaten calories"
              >
                <span>Live ({Math.round(liveCalories)} kcal)</span>
              </button>

              {[
                { gear: 'P', label: '0%', val: 0 },
                { gear: '1', label: '25%', val: 25 },
                { gear: '2', label: '50%', val: 50 },
                { gear: '3', label: '75%', val: 75 },
                { gear: 'S', label: '100%', val: 100 },
                { gear: 'R', label: '115%', val: 115 },
              ].map((item) => (
                <button
                  key={item.gear}
                  type="button"
                  onClick={() => handleSelectPreset(item.val)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    testPreset === item.val
                      ? 'bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] shadow-sm scale-105'
                      : 'bg-[#0B0F0E] text-[#CBD5E1] hover:text-[#F8FAFC] border border-[#1E293B]'
                  }`}
                  title={`Shift to Gear ${item.gear} (${item.label})`}
                >
                  {item.gear} ({item.label})
                </button>
              ))}
            </div>
          </div>

          {/* Engine Commentary Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#07111F] to-[#101D2D] border border-emerald-500/25 flex items-start gap-2.5 text-xs">
            <span className="text-base flex-shrink-0 mt-0.5">🏎️</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-[#F8FAFC]">
                  {engineTelemetry.headline}
                </span>
                <span className="text-[10px] text-[#8492A6] font-semibold">
                  • {Math.round(currentDisplayedCalories)} / {targetCalories} kcal ({activePercentage}%)
                </span>
              </div>
              <p className="text-[11px] text-[#CBD5E1] mt-0.5 leading-relaxed">
                {engineTelemetry.quote}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: CHASSIS DYNO LAB & LIVE HORSEPOWER RUN                            */}
      {/* ========================================================================= */}
      {mode === 'dyno' && (
        <div className="space-y-4">
          {/* Dyno Bench Top Header */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#0B0F0E] border border-[#1E293B] shadow-2xl relative overflow-hidden">
            {/* Tech grid texture background */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(#2DD4BF 1px, transparent 1px), linear-gradient(90deg, #2DD4BF 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 pb-4 border-b border-[#1E293B]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-[#34D399] animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest text-[#34D399]">
                    Metabolic Dyno Lab • Horsepower & Torque
                  </span>
                </div>
                <h3 className="font-display font-extrabold text-xl text-[#F8FAFC] flex items-center gap-2">
                  <span>{baseHorsepower} BHP Benchmark Capacity</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#101D2D] text-[#60A5FA] border border-[#1E293B] font-bold">
                    {peakTorqueNm} Nm Peak Torque
                  </span>
                </h3>
              </div>

              {/* Start Dyno Pull Action Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartDynoPull}
                  disabled={isDynoRunning}
                  className="py-2.5 px-5 rounded-2xl bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Play className={`w-4 h-4 fill-[#07111F] ${isDynoRunning ? 'animate-spin' : ''}`} />
                  <span>{isDynoRunning ? `Dyno Running (${dynoRpm} RPM)…` : 'Start Dyno Power Pull'}</span>
                </button>
              </div>
            </div>

            {/* Performance Tuning Stage Selector */}
            <div className="pt-3 pb-3 border-b border-[#1E293B] flex items-center justify-between flex-wrap gap-2 text-xs relative z-10">
              <span className="font-bold text-[#8492A6] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#34D399]" />
                <span>ECU Engine Map / Stage Tune:</span>
              </span>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'stock', label: 'Stock TDEE Map', boost: '1.0x' },
                  { id: 'stage1', label: 'Stage 1 Thermic', boost: '+15% HP' },
                  { id: 'stage2', label: 'Stage 2 Competition', boost: '+25% Nitro' },
                ].map((stg) => (
                  <button
                    key={stg.id}
                    type="button"
                    onClick={() => {
                      playChecklistSound(true);
                      setTuneStage(stg.id as TuneStage);
                    }}
                    className={`px-2.5 py-1 rounded-xl font-bold transition-all text-[11px] cursor-pointer ${
                      tuneStage === stg.id
                        ? 'bg-[#22C55E] text-[#07111F] shadow-sm font-black'
                        : 'bg-[#101D2D] text-[#CBD5E1] hover:text-[#F8FAFC] border border-[#1E293B]'
                    }`}
                  >
                    <span>{stg.label}</span>
                    <span className="ml-1 opacity-75 text-[10px]">({stg.boost})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dyno Output KPI Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 relative z-10">
              <div className="p-3 rounded-2xl bg-[#101D2D] border border-[#1E293B] text-center">
                <div className="text-[10px] font-bold text-[#8492A6] uppercase tracking-wider mb-0.5">Peak Horsepower</div>
                <div className="text-lg sm:text-xl font-black text-[#34D399] tabular-nums">
                  {isDynoRunning ? Math.round((dynoRpm / 8200) * baseHorsepower) : currentHorsepower} <span className="text-xs font-semibold text-[#8492A6]">BHP</span>
                </div>
                <div className="text-[10px] text-[#8492A6]">at 6,500 RPM</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#101D2D] border border-[#1E293B] text-center">
                <div className="text-[10px] font-bold text-[#8492A6] uppercase tracking-wider mb-0.5">Metabolic Torque</div>
                <div className="text-lg sm:text-xl font-black text-[#60A5FA] tabular-nums">
                  {isDynoRunning ? Math.round((dynoRpm / 8200) * peakTorqueNm) : currentTorqueNm} <span className="text-xs font-semibold text-[#8492A6]">Nm</span>
                </div>
                <div className="text-[10px] text-[#8492A6]">Crossover at 5.2k</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#101D2D] border border-[#1E293B] text-center">
                <div className="text-[10px] font-bold text-[#8492A6] uppercase tracking-wider mb-0.5">Power-to-Weight</div>
                <div className="text-lg sm:text-xl font-black text-[#F8FAFC] tabular-nums">
                  {powerToWeight} <span className="text-xs font-semibold text-[#8492A6]">HP/kg</span>
                </div>
                <div className="text-[10px] text-[#8492A6]">Athlete Ratio</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#101D2D] border border-[#1E293B] text-center">
                <div className="text-[10px] font-bold text-[#8492A6] uppercase tracking-wider mb-0.5">Thermic Efficiency (TEF)</div>
                <div className="text-lg sm:text-xl font-black text-amber-400 tabular-nums">
                  {thermicEfficiency}%
                </div>
                <div className="text-[10px] text-[#8492A6]">Metabolic Heat Loss</div>
              </div>
            </div>

            {/* Acceleration & Drag Strip Telemetry Strip */}
            <div className="grid grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-[#1E293B] text-center relative z-10">
              <div className="p-2 rounded-xl bg-[#07111F] border border-[#1E293B]">
                <div className="text-[9px] text-[#8492A6] uppercase font-bold">0-100 km/h (0-60mph)</div>
                <div className="text-sm font-extrabold text-[#34D399] tabular-nums">{zeroToHundredSec} sec</div>
              </div>
              <div className="p-2 rounded-xl bg-[#07111F] border border-[#1E293B]">
                <div className="text-[9px] text-[#8492A6] uppercase font-bold">1/4-Mile Sprint ET</div>
                <div className="text-sm font-extrabold text-[#60A5FA] tabular-nums">{quarterMileET} sec</div>
              </div>
              <div className="p-2 rounded-xl bg-[#07111F] border border-[#1E293B]">
                <div className="text-[9px] text-[#8492A6] uppercase font-bold">Trap Velocity</div>
                <div className="text-sm font-extrabold text-amber-400 tabular-nums">{trapSpeedMph} MPH</div>
              </div>
            </div>

            {/* Live Interactive Dyno Power Curve SVG */}
            <div className="mt-5 pt-4 border-t border-[#1E293B] relative z-10">
              <div className="flex items-center justify-between text-xs mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 font-bold text-[#34D399]">
                    <span className="w-2.5 h-1 rounded-full bg-[#2DD4BF]" />
                    <span>Horsepower (BHP)</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-bold text-[#60A5FA]">
                    <span className="w-2.5 h-1 rounded-full bg-[#60A5FA]" />
                    <span>Torque (Nm)</span>
                  </span>
                  <span className="text-[10px] text-[#8492A6] italic hidden sm:inline">
                    (Hover graph to inspect RPM)
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[#8492A6] tabular-nums">
                  Dyno RPM Sweep: {dynoRpm.toLocaleString()} RPM
                </span>
              </div>

              {/* Dyno Graph SVG Chart */}
              <div
                className="w-full h-44 rounded-2xl bg-[#07111F] p-3 border border-[#1E293B] relative cursor-crosshair"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const xRel = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  const rpm = Math.round(1800 + xRel * 6700);
                  setHoveredRpm(rpm);
                }}
                onMouseLeave={() => setHoveredRpm(null)}
              >
                <svg viewBox="0 0 500 140" className="w-full h-full overflow-visible select-none">
                  {/* Grid Lines */}
                  {[30, 65, 100].map((y) => (
                    <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
                  ))}
                  {[100, 200, 300, 400].map((x) => (
                    <line key={x} x1={x} y1="10" x2={x} y2="130" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
                  ))}

                  {/* Dyno RPM Labels */}
                  <text x="10" y="138" fill="#8492A6" fontSize="9" fontWeight="bold">2,000 RPM</text>
                  <text x="250" y="138" fill="#8492A6" fontSize="9" fontWeight="bold" textAnchor="middle">5,252 RPM (Crossover)</text>
                  <text x="490" y="138" fill="#8492A6" fontSize="9" fontWeight="bold" textAnchor="end">8,500 RPM</text>

                  {/* Torque Curve (Sky Blue #60A5FA): Peaks in mid range */}
                  <path
                    d="M 10 110 Q 150 25, 270 55 T 490 85"
                    fill="none"
                    stroke="#60A5FA"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Horsepower Curve (Mint #2DD4BF): Climbs progressively to peak */}
                  <path
                    d="M 10 120 Q 200 80, 360 22 T 490 35"
                    fill="none"
                    stroke="#2DD4BF"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Dyno Run Vertical Sweep Line */}
                  {isDynoRunning && (
                    <line
                      x1={10 + dynoProgress * 480}
                      y1="10"
                      x2={10 + dynoProgress * 480}
                      y2="130"
                      stroke="#F8FAFC"
                      strokeWidth="2"
                      strokeDasharray="2 2"
                    />
                  )}

                  {/* Live Intake Position Marker */}
                  <circle
                    cx={10 + (Math.min(100, activePercentage) / 100) * 480}
                    cy={120 - (Math.min(100, activePercentage) / 100) * 95}
                    r="5"
                    fill="#2DD4BF"
                    stroke="#F8FAFC"
                    strokeWidth="2"
                  />

                  {/* Hovered RPM Crosshair Inspector */}
                  {hoveredRpm && (
                    <g>
                      <line
                        x1={10 + ((hoveredRpm - 1800) / 6700) * 480}
                        y1="10"
                        x2={10 + ((hoveredRpm - 1800) / 6700) * 480}
                        y2="130"
                        stroke="#34D399"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                      />
                    </g>
                  )}
                </svg>

                {/* Hover Inspector Tooltip */}
                {hoveredRpm && (
                  <div className="absolute top-2 right-2 bg-[#101D2D]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#1E293B] text-[10px] text-[#F8FAFC] flex items-center gap-2 pointer-events-none shadow-md">
                    <span className="font-extrabold text-[#34D399]">{hoveredRpm} RPM:</span>
                    <span>{Math.round((hoveredRpm / 6500) * baseHorsepower)} BHP</span>
                    <span className="text-[#8492A6]">|</span>
                    <span className="text-[#60A5FA]">{Math.round((hoveredRpm / 5252) * peakTorqueNm * 0.85)} Nm</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dyno Run History Log */}
            {dynoHistory.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[#1E293B] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#F8FAFC]">
                  <Timer className="w-3.5 h-3.5 text-[#34D399]" />
                  <span>Recent Dyno Run Logs</span>
                </div>
                <div className="space-y-1.5">
                  {dynoHistory.map((run, idx) => (
                    <div
                      key={run.id}
                      className="p-2 rounded-xl bg-[#101D2D] border border-[#1E293B] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#22C55E]/20 text-[#34D399] flex items-center justify-center text-[10px] font-bold">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-[#CBD5E1]">{run.stageName}</span>
                        <span className="text-[10px] text-[#8492A6]">{run.timestamp}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono font-bold text-[11px]">
                        <span className="text-[#34D399]">{run.peakHp} BHP</span>
                        <span className="text-[#60A5FA]">{run.torque} Nm</span>
                        <span className="text-amber-400 text-[10px]">{run.quarterMile}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: ECU TELEMETRY MATRIX & MIXTURE REPORT                            */}
      {/* ========================================================================= */}
      {mode === 'telemetry' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-[#0B0F0E] border border-[#1E293B] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B] flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#2DD4BF]" />
                <span className="text-xs font-black uppercase tracking-wider text-[#F8FAFC]">
                  ECU Fuel Mixture & Metabolic Telemetry
                </span>
              </div>
              <span className="text-xs font-bold text-[#34D399] px-2.5 py-1 rounded-full bg-[#101D2D] border border-emerald-500/30">
                AFR Stoichiometric: {activePercentage <= 85 ? '14.7:1 (Lean Burn)' : activePercentage <= 105 ? '12.8:1 (Optimal Power)' : '11.5:1 (Rich Growth)'}
              </span>
            </div>

            {/* V8 Cylinder Bank Combustion Array */}
            <div className="p-3.5 rounded-2xl bg-[#101D2D] border border-[#1E293B] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#F8FAFC] flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#34D399]" />
                  <span>8-Cylinder Metabolic Firing Order</span>
                </span>
                <span className="text-[10px] text-[#8492A6]">Firing sequence: 1-8-4-3-6-5-7-2</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-1">
                {[
                  { cyl: 1, name: 'BMR Base', state: 'Active' },
                  { cyl: 2, name: 'TEF Heat', state: 'Active' },
                  { cyl: 3, name: 'NEAT Burn', state: activePercentage >= 25 ? 'Active' : 'Idle' },
                  { cyl: 4, name: 'Protein Syn', state: eatenProteinPct >= 50 ? 'Active' : 'Warm' },
                  { cyl: 5, name: 'Glycogen', state: eatenCarbPct >= 40 ? 'Active' : 'Reserve' },
                  { cyl: 6, name: 'Lipid Ox', state: eatenFatPct >= 30 ? 'Active' : 'Standby' },
                  { cyl: 7, name: 'Hydration', state: 'Active' },
                  { cyl: 8, name: 'ATP Boost', state: displayPercentage >= 75 ? 'Active' : 'Idle' },
                ].map((c) => (
                  <div
                    key={c.cyl}
                    className={`p-2 rounded-xl text-center border transition-all ${
                      c.state === 'Active'
                        ? 'bg-[#07111F] border-emerald-500/40 text-[#34D399]'
                        : 'bg-[#07111F]/60 border-[#1E293B] text-[#8492A6]'
                    }`}
                  >
                    <div className="text-[9px] font-black uppercase">CYL {c.cyl}</div>
                    <div className="text-[10px] font-bold truncate">{c.name}</div>
                    <div className="text-[8px] font-semibold opacity-75">{c.state}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fuel Injection Diagnostics */}
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#101D2D] border border-[#1E293B] space-y-2">
                <div className="text-xs font-bold text-[#F8FAFC] flex items-center justify-between">
                  <span>Nitrous Fuel (Protein)</span>
                  <span className="text-[#34D399] font-extrabold">{eatenProteinPct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#07111F] overflow-hidden">
                  <div className="h-full rounded-full bg-[#22C55E]" style={{ width: `${eatenProteinPct}%` }} />
                </div>
                <p className="text-[11px] text-[#8492A6]">
                  Supports muscle fiber repair and sustained high-RPM structural recovery.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#101D2D] border border-[#1E293B] space-y-2">
                <div className="text-xs font-bold text-[#F8FAFC] flex items-center justify-between">
                  <span>Super Boost (Carbs)</span>
                  <span className="text-[#60A5FA] font-extrabold">{eatenCarbPct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#07111F] overflow-hidden">
                  <div className="h-full rounded-full bg-[#60A5FA]" style={{ width: `${eatenCarbPct}%` }} />
                </div>
                <p className="text-[11px] text-[#8492A6]">
                  Immediate glycogen throttle for brain focus and high-intensity workout bursts.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#101D2D] border border-[#1E293B] space-y-2">
                <div className="text-xs font-bold text-[#F8FAFC] flex items-center justify-between">
                  <span>Synthetic Oils (Fats)</span>
                  <span className="text-amber-400 font-extrabold">{eatenFatPct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#07111F] overflow-hidden">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${eatenFatPct}%` }} />
                </div>
                <p className="text-[11px] text-[#8492A6]">
                  Maintains hormonal balance, cellular membrane fluidity, and joint lubrication.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
