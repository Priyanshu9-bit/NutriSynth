// Shared UI components for NutriSynth
import { type ReactNode, useState, useEffect } from 'react';
import { ChevronDown, RotateCw, Radio } from 'lucide-react';

// Triggers a state flip one frame after mount, so elements that read it can
// transition from a "zero" starting value to their real value (grow-in effect)
// instead of popping in already-drawn.
function useGrowIn() {
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => setGrown(true));
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, []);
  return grown;
}

export function ProgressBar({
  value,
  max,
  label,
  unit,
  color = "brand",
  showGoalStatus = true,
}: {
  value: number;
  max: number;
  label: string;
  unit: string;
  color?: string;
  showGoalStatus?: boolean;
}) {
  const grown = useGrowIn();
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  const isGoalAchieved = max > 0 && value >= max * 0.9 && value <= max * 1.1;
  const isOver = max > 0 && value > max * 1.1;
  const remaining = Math.max(0, Math.round(max - value));

  const colorMap: Record<string, string> = {
    brand: "bg-brand-500",
    blue: "bg-sky-500",
    amber: "bg-amber-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
    purple: "bg-violet-500",
  };

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1.5 flex-wrap gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{label}</span>
          {showGoalStatus && isGoalAchieved && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700 animate-bounce">
              🎯 Goal Met!
            </span>
          )}
          {showGoalStatus && !isGoalAchieved && !isOver && value > 0 && (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              ({remaining} {unit} left)
            </span>
          )}
          {showGoalStatus && isOver && (
            <span className="text-[11px] text-orange-600 dark:text-orange-400 font-medium">
              (+{Math.round(value - max)} {unit} over)
            </span>
          )}
        </div>
        <span className="text-sm font-semibold text-stone-900 dark:text-stone-100 tabular-nums">
          {Math.round(value)}<span className="text-stone-400 font-normal"> / {Math.round(max)} {unit}</span>
        </span>
      </div>
      <div className={`h-2.5 rounded-full bg-stone-200/80 dark:bg-stone-800 overflow-hidden relative ${
        isGoalAchieved ? 'ring-2 ring-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.35)]' : ''
      }`}>
        <div
          className={`h-full rounded-full ${colorMap[color] || colorMap.brand} transition-all ease-out relative ${
            isGoalAchieved ? 'animate-pulse' : ''
          }`}
          style={{ width: grown ? `${pct}%` : '0%', transitionDuration: '850ms' }}
        />
      </div>
    </div>
  );
}

export function Card({ children, className = "", onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`card p-5 transition-all duration-300 ${onClick ? 'hover:-translate-y-0.5 hover:shadow-card-lg cursor-pointer' : 'hover:shadow-card-lg'} ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({ label, value, unit, icon, accent = "brand" }: { label: string; value: number | string; unit?: string; icon?: ReactNode; accent?: string }) {
  const accentMap: Record<string, string> = {
    brand: "from-brand-500 to-emerald-600",
    blue: "from-sky-500 to-blue-600",
    amber: "from-amber-500 to-orange-600",
    orange: "from-orange-500 to-red-500",
    neutral: "from-stone-400 to-stone-500",
  };
  return (
    <div className="card p-4 flex items-center gap-4 group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-lg">
      {icon && (
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accentMap[accent]} flex items-center justify-center text-white flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <div className="text-xs text-stone-500 font-medium">{label}</div>
        <div className="metric-value text-xl text-stone-900">
          {value}{unit && <span className="text-sm font-medium text-stone-400 ml-1">{unit}</span>}
        </div>
      </div>
    </div>
  );
}

export function ExpandableSection({ title, icon, children, defaultOpen = false }: { title: string; icon?: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-stone-200/60 dark:border-[#32353e]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-left hover:bg-stone-50/50 dark:hover:bg-[#282a32] transition-colors rounded-lg px-2 -mx-2"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-stone-700 dark:text-[#f4f5f7]">
          {icon}
          {title}
        </span>
        <ChevronDown className={`w-4 h-4 text-stone-400 dark:text-[#9ca3af] transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="pb-3 pt-1 animate-fade-in text-stone-700 dark:text-[#d1d5db]">
          {children}
        </div>
      )}
    </div>
  );
}

export function Badge({ variant = "neutral", children }: { variant?: "success" | "warning" | "error" | "info" | "neutral"; children: ReactNode }) {
  const variantMap = {
    success: "badge-success",
    warning: "badge-warning",
    error: "badge-error",
    info: "badge-info",
    neutral: "badge-neutral",
  };
  return <span className={`badge ${variantMap[variant]} transition-transform duration-200 hover:scale-105`}>{children}</span>;
}

export function DonutChart({ segments, size = 140, centerValue, centerUnit = "kcal" }: { segments: { label: string; value: number; color: string }[]; size?: number; centerValue?: string; centerUnit?: string }) {
  const grown = useGrowIn();
  const [hovered, setHovered] = useState<number | null>(null);
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const radius = size / 2 - 12;
  const circumference = 2 * Math.PI * radius;

  let cursor = 0;
  const arcs = segments.map((seg, i) => {
    const finalDash = (seg.value / total) * circumference;
    const arc = { seg, i, finalDash, offset: cursor };
    cursor += finalDash;
    return arc;
  });

  const hoveredSeg = hovered !== null ? segments[hovered] : null;

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} className="flex-shrink-0 overflow-visible">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" className="stroke-[#f0f0ee] dark:stroke-stone-800" strokeWidth={14} />
        {arcs.map(({ seg, i, finalDash, offset }) => {
          const dash = grown ? finalDash : 0;
          const isHovered = hovered === i;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={isHovered ? radius + 2 : radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={isHovered ? 17 : 14}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all ease-out"
              style={{ transitionDuration: '850ms', transitionDelay: `${i * 130}ms` }}
            />
          );
        })}
        <text x="50%" y="50%" textAnchor="middle" dy="0.35em" className="fill-stone-900 dark:fill-white font-display font-bold transition-opacity duration-300" style={{ fontSize: size * 0.14 }}>
          {hoveredSeg ? Math.round(hoveredSeg.value).toLocaleString() : (centerValue ?? Math.round(total).toLocaleString())}
        </text>
        <text x="50%" y="62%" textAnchor="middle" dy="0.35em" className="fill-stone-400 dark:fill-stone-500 transition-opacity duration-300" style={{ fontSize: size * 0.07 }}>
          {hoveredSeg ? hoveredSeg.label : centerUnit}
        </text>
      </svg>
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className={`flex items-center gap-2 text-sm rounded-lg px-1.5 py-1 -mx-1.5 cursor-pointer transition-all duration-300 ${hovered === i ? 'bg-stone-100 dark:bg-stone-800' : ''} ${grown ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}
            style={{ transitionDelay: grown ? `${300 + i * 90}ms` : '0ms' }}
          >
            <span className={`w-3 h-3 rounded-full transition-transform duration-200 ${hovered === i ? 'scale-125' : ''}`} style={{ backgroundColor: seg.color }} />
            <span className="text-stone-600 dark:text-stone-300">{seg.label}</span>
            <span className="text-stone-900 dark:text-white font-semibold tabular-nums">{Math.round(seg.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Grouped vertical bar chart — e.g. Target vs Today across Protein/Carbs/Fat/Fiber
export interface BarSeries { name: string; value: number; color: string }
export interface BarGroup { label: string; unit: string; series: BarSeries[] }

export function MacroComparisonChart({ groups, height = 180 }: { groups: BarGroup[]; height?: number }) {
  const grown = useGrowIn();
  const plotHeight = height - 46;
  return (
    <div className="flex items-end gap-6 overflow-x-auto pb-1" style={{ minHeight: height }}>
      {groups.map((g, gi) => {
        const max = Math.max(...g.series.map(s => s.value), 1);
        return (
          <div key={gi} className="flex flex-col items-center gap-2 flex-shrink-0" style={{ minWidth: 60 }}>
            <div className="flex items-end gap-1.5" style={{ height: plotHeight }}>
              {g.series.map((s, si) => {
                const h = Math.max(3, (s.value / max) * plotHeight);
                const delay = gi * 110 + si * 70;
                return (
                  <div key={si} className="group/bar flex flex-col items-center justify-end h-full" title={`${s.name}: ${Math.round(s.value)}${g.unit}`}>
                    <span className="text-[10px] font-semibold text-stone-600 mb-1 tabular-nums">{Math.round(s.value)}</span>
                    <div
                      className="w-5 rounded-t-md transition-all ease-out origin-bottom group-hover/bar:brightness-110 group-hover/bar:scale-x-125"
                      style={{ height: grown ? h : 0, backgroundColor: s.color, transitionDuration: '750ms', transitionDelay: `${delay}ms` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="text-xs font-semibold text-stone-700 text-center">{g.label}</div>
            <div className="text-[10px] text-stone-400 -mt-1.5">{g.unit}</div>
          </div>
        );
      })}
    </div>
  );
}

// Radar / spider chart — e.g. how close today's macros are to target, as % per axis
export function RadarChart({ axes, size = 240, maxValue = 150 }: { axes: { label: string; value: number }[]; size?: number; maxValue?: number }) {
  const grown = useGrowIn();
  const [hoveredAxis, setHoveredAxis] = useState<number | null>(null);
  const [scanActive, setScanActive] = useState(true);
  const [animKey, setAnimKey] = useState(0);

  const center = size / 2;
  const radius = size / 2 - 38;
  const angleStep = (2 * Math.PI) / axes.length;

  const pointAt = (value: number, i: number): [number, number] => {
    const r = (Math.min(Math.max(value, 0), maxValue) / maxValue) * radius;
    const angle = -Math.PI / 2 + i * angleStep;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  };

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const dataPoints = axes.map((a, i) => pointAt(a.value, i));
  const targetPoints = axes.map((_, i) => pointAt(100, i));

  // Coordinates for radar sweep fan beam (~28 degree sector trail)
  const fanAngle = 0.5;
  const fanX = center + radius * Math.sin(fanAngle);
  const fanY = center - radius * Math.cos(fanAngle);

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnimKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col items-center w-full" key={animKey}>
      {/* Scanner Mode & Replay Controls */}
      <div className="w-full flex items-center justify-between px-1 mb-2">
        <button
          type="button"
          onClick={() => setScanActive(!scanActive)}
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all cursor-pointer ${
            scanActive
              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/60 shadow-sm'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
          title={scanActive ? "Click to pause radar scanner" : "Click to activate radar scanner"}
        >
          <Radio className={`w-3 h-3 ${scanActive ? 'animate-pulse text-emerald-600 dark:text-emerald-400' : 'text-stone-400'}`} />
          <span>{scanActive ? 'Radar Scan Live' : 'Scanner Paused'}</span>
        </button>

        <button
          type="button"
          onClick={handleReplay}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
          title="Replay radar animation"
        >
          <RotateCw className="w-3 h-3 hover:rotate-180 transition-transform duration-300" />
          <span>Replay</span>
        </button>
      </div>

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible select-none">
        <defs>
          {/* Ambient radial aura behind radar */}
          <radialGradient id={`radarAura-${animKey}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
            <stop offset="70%" stopColor="#059669" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#047857" stopOpacity="0.01" />
          </radialGradient>

          {/* Sweeping line gradient */}
          <linearGradient id={`radarSweepLineGrad-${animKey}`} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
            <stop offset="70%" stopColor="#10b981" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="1" />
          </linearGradient>

          {/* Trailing fan beam gradient */}
          <linearGradient id={`radarFanGrad-${animKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>

          {/* Bloom glow filter */}
          <filter id={`radarBloom-${animKey}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient background glow ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill={`url(#radarAura-${animKey})`}
          className="transition-opacity duration-700"
          style={{ opacity: grown ? 1 : 0 }}
        />

        {/* Concentric grid rings */}
        {gridLevels.map((lvl, li) => {
          const pts = axes.map((_, i) => {
            const angle = -Math.PI / 2 + i * angleStep;
            const r = lvl * radius;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
          }).join(' ');
          return (
            <polygon
              key={li}
              points={pts}
              fill="none"
              strokeWidth={lvl === 1 ? 1.5 : 1}
              className={`${lvl === 1 ? 'stroke-stone-300 dark:stroke-stone-600' : 'stroke-stone-200 dark:stroke-stone-800'} transition-opacity duration-500 ease-out`}
              style={{ opacity: grown ? 1 : 0, transitionDelay: `${li * 70}ms` }}
            />
          );
        })}

        {/* Radial Axis Spokes */}
        {axes.map((_, i) => {
          const angle = -Math.PI / 2 + i * angleStep;
          const isHovered = hoveredAxis === i;
          return (
            <line
              key={i}
              x1={center} y1={center}
              x2={center + radius * Math.cos(angle)} y2={center + radius * Math.sin(angle)}
              strokeWidth={isHovered ? 2 : 1}
              className={`${isHovered ? 'stroke-emerald-500 dark:stroke-emerald-400' : 'stroke-stone-200 dark:stroke-stone-800'} transition-all duration-200`}
              style={{ opacity: grown ? 1 : 0, transitionDelay: '180ms' }}
            />
          );
        })}

        {/* 100% Target Reference Ring */}
        <polygon
          points={targetPoints.map(p => p.join(',')).join(' ')}
          fill="none"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          className="stroke-stone-400/80 dark:stroke-stone-500 transition-opacity duration-500 ease-out"
          style={{ opacity: grown ? 1 : 0, transitionDelay: '320ms' }}
        />

        {/* Radar Sweep Scanner Beam Animation */}
        {scanActive && grown && (
          <g
            className="pointer-events-none origin-center animate-radar-sweep"
            style={{ transformOrigin: `${center}px ${center}px` }}
          >
            {/* Trailing fan beam */}
            <path
              d={`M ${center} ${center} L ${center} ${center - radius} A ${radius} ${radius} 0 0 1 ${fanX} ${fanY} Z`}
              fill={`url(#radarFanGrad-${animKey})`}
            />
            {/* Leading bright sweep line */}
            <line
              x1={center}
              y1={center}
              x2={center}
              y2={center - radius}
              stroke={`url(#radarSweepLineGrad-${animKey})`}
              strokeWidth={2}
            />
            {/* Leading tip glowing point */}
            <circle
              cx={center}
              cy={center - radius}
              r={3}
              fill="#34d399"
              filter={`url(#radarBloom-${animKey})`}
            />
          </g>
        )}

        {/* Data polygon with pop-in scale & breathing glow animation */}
        <g
          style={{
            transformOrigin: `${center}px ${center}px`,
            transform: grown ? 'scale(1)' : 'scale(0)',
            opacity: grown ? 1 : 0,
            transition: 'transform 750ms cubic-bezier(0.34,1.56,0.64,1), opacity 450ms ease-out',
            transitionDelay: '420ms',
          }}
        >
          {/* Main filled polygon with breathing animation */}
          <polygon
            points={dataPoints.map(p => p.join(',')).join(' ')}
            fill="rgba(16, 185, 129, 0.22)"
            stroke="#10b981"
            strokeWidth={2.2}
            className="animate-radar-breathe transition-all duration-300"
            filter={`url(#radarBloom-${animKey})`}
          />

          {/* Interactive animated nodes at each vertex with ping ripple */}
          {dataPoints.map((p, i) => {
            const isHovered = hoveredAxis === i;
            return (
              <g
                key={i}
                className="cursor-pointer transition-transform duration-200"
                onMouseEnter={() => setHoveredAxis(i)}
                onMouseLeave={() => setHoveredAxis(null)}
              >
                {/* Pulsing ripple halo beacon */}
                <circle
                  cx={p[0]}
                  cy={p[1]}
                  r={8}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  className="animate-ping origin-center opacity-40 pointer-events-none"
                  style={{ animationDuration: '3s', animationDelay: `${i * 450}ms` }}
                />
                {/* Outer halo */}
                <circle
                  cx={p[0]}
                  cy={p[1]}
                  r={isHovered ? 7.5 : 4.5}
                  fill="#10b981"
                  fillOpacity={isHovered ? 0.95 : 0.6}
                  className="transition-all duration-200"
                />
                {/* Inner white dot */}
                <circle
                  cx={p[0]}
                  cy={p[1]}
                  r={isHovered ? 4.5 : 2.5}
                  fill="#ffffff"
                  stroke="#059669"
                  strokeWidth={1}
                  className="transition-all duration-200"
                />
              </g>
            );
          })}
        </g>

        {/* Axis Labels with hover highlight */}
        {axes.map((a, i) => {
          const angle = -Math.PI / 2 + i * angleStep;
          const lx = center + (radius + 20) * Math.cos(angle);
          const ly = center + (radius + 20) * Math.sin(angle);
          const isHovered = hoveredAxis === i;
          return (
            <text
              key={i}
              x={lx}
              y={ly}
              textAnchor="middle"
              dy="0.35em"
              onMouseEnter={() => setHoveredAxis(i)}
              onMouseLeave={() => setHoveredAxis(null)}
              className={`cursor-pointer transition-all duration-200 ${
                isHovered
                  ? 'fill-emerald-600 dark:fill-emerald-400 font-bold text-xs scale-110'
                  : 'fill-stone-600 dark:fill-stone-300 font-medium'
              }`}
              style={{
                fontSize: isHovered ? 12 : 11,
                opacity: grown ? 1 : 0,
                transitionDelay: `${520 + i * 40}ms`,
              }}
            >
              {a.label}
            </text>
          );
        })}
      </svg>

      {/* Interactive Tooltip / Status Display below chart */}
      <div className="mt-3.5 flex items-center justify-center min-h-[30px] w-full">
        {hoveredAxis !== null ? (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 shadow-sm animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {axes[hoveredAxis].label}: {Math.round(axes[hoveredAxis].value)}% of target
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
              {axes[hoveredAxis].value >= 90 && axes[hoveredAxis].value <= 115
                ? '🎯 Target Met'
                : axes[hoveredAxis].value < 90
                ? '⚡ Below Target'
                : '⚠️ Exceeds Target'}
            </span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span>Hover on radar points to inspect individual macros</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Single horizontal bar row — % of RDI, capped display at 150% with a marker at 100%
const statusBarColor: Record<string, string> = {
  met: "#22c55e",
  low: "#f59e0b",
  attention: "#ef4444",
  professional: "#ef4444",
  "insufficient-data": "#0ea5e9",
};

export function NutrientBarRow({ label, pct, status, valueLabel, cap = 150, delayMs = 0 }: { label: string; pct: number; status: string; valueLabel: string; cap?: number; delayMs?: number }) {
  const grown = useGrowIn();
  const width = Math.min(100, (Math.max(0, pct) / cap) * 100);
  const markerPos = (100 / cap) * 100;
  const color = statusBarColor[status] || "#a8a29e";
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-sm font-medium text-stone-700">{label}</span>
        <span className="text-xs text-stone-500 tabular-nums">{valueLabel}</span>
      </div>
      <div className="h-2.5 rounded-full bg-stone-200/70 overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all ease-out"
          style={{ width: grown ? `${width}%` : '0%', backgroundColor: color, transitionDuration: '750ms', transitionDelay: `${delayMs}ms` }}
        />
        <div className="absolute inset-y-0 w-px bg-stone-500/40" style={{ left: `${markerPos}%` }} title="100% of RDI" />
      </div>
    </div>
  );
}

export function NutrientRDIChart({ items }: { items: { label: string; pct: number; status: string; valueLabel: string }[] }) {
  return (
    <div className="space-y-3.5">
      {items.map((item, i) => <NutrientBarRow key={i} {...item} delayMs={i * 45} />)}
    </div>
  );
}

// Compact stacked bar showing calorie contribution split by macro — used on meal cards
export function MacroMiniBar({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const grown = useGrowIn();
  const pCal = protein * 4, cCal = carbs * 4, fCal = fat * 9;
  const total = pCal + cCal + fCal || 1;
  const segs = [
    { label: "Protein", pct: (pCal / total) * 100, color: "#22c55e" },
    { label: "Carbs", pct: (cCal / total) * 100, color: "#0ea5e9" },
    { label: "Fat", pct: (fCal / total) * 100, color: "#f59e0b" },
  ];
  return (
    <div>
      <div className="h-2 rounded-full overflow-hidden flex w-full bg-stone-100">
        {segs.map((s, i) => (
          <div
            key={i}
            style={{ width: grown ? `${s.pct}%` : '0%', backgroundColor: s.color, transitionDelay: `${i * 90}ms` }}
            className="transition-all duration-700 ease-out first:rounded-l-full last:rounded-r-full hover:brightness-110"
          />
        ))}
      </div>
      <div className="flex gap-3 mt-1.5 flex-wrap">
        {segs.map((s, i) => (
          <span key={i} className="flex items-center gap-1 text-[10px] text-stone-500 font-medium">
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: s.color }} />
            {s.label} {Math.round(s.pct)}%
          </span>
        ))}
      </div>
    </div>
  );
}

export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin text-brand-500">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="40 60" strokeLinecap="round" />
    </svg>
  );
}
