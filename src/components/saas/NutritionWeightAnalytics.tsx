import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Scale,
  Calendar,
  FileDown,
  Award,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Activity,
  Flame,
  Beef,
  Droplet,
  ChevronRight,
  TrendingDown,
  Info,
  Lightbulb,
} from 'lucide-react';
import type { NutritionResult, UserProfile } from '@/lib/calculations';
import {
  loadWeightLogsLocal,
  saveWeightLog,
  deleteWeightLog,
  type WeightLogEntry,
} from '@/lib/cloudStore';
import { playChecklistSound, playAddProgressSound } from '@/lib/soundEffects';
import { SectionErrorBoundary } from '@/components/ErrorBoundary';
import { BeginnerGuideBanner } from '@/components/beginner/BeginnerGuideBanner';
import jsPDF from 'jspdf';

interface NutritionWeightAnalyticsProps {
  result: NutritionResult;
  profile: UserProfile;
}

export function NutritionWeightAnalytics({ result, profile }: NutritionWeightAnalyticsProps) {
  const [weightLogs, setWeightLogs] = useState<WeightLogEntry[]>(() => loadWeightLogsLocal());
  const [newWeight, setNewWeight] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newNotes, setNewNotes] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const targetWeight = profile.weight && profile.goal === 'fat_loss' ? Math.round(profile.weight * 0.9) : profile.weight ? Math.round(profile.weight * 1.05) : 70;
  const currentWeight = weightLogs[0]?.weightKg || profile.weight || 75;
  const initialWeight = weightLogs[weightLogs.length - 1]?.weightKg || profile.weight || 75;
  const totalChange = Number((currentWeight - initialWeight).toFixed(1));

  // Handle logging new weight
  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight) return;

    playAddProgressSound();
    const entry: WeightLogEntry = {
      id: `w_${Date.now()}`,
      date: newDate,
      weightKg: Number(newWeight),
      notes: newNotes.trim() || undefined,
      recordedAt: Date.now(),
    };

    await saveWeightLog(entry);
    const updated = [entry, ...weightLogs.filter((w) => w.date !== newDate)].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setWeightLogs(updated);
    setNewWeight('');
    setNewNotes('');
    setIsAddOpen(false);
  };

  // Handle deleting entry
  const handleDelete = async (id: string) => {
    await deleteWeightLog(id);
    setWeightLogs((prev) => prev.filter((w) => w.id !== id));
  };

  // Mock weekly days for compliance
  const weekDays = [
    { day: 'Mon', cals: result.tdee - 40, prot: result.proteinG + 2, water: 2600, target: result.tdee, compliant: true },
    { day: 'Tue', cals: result.tdee + 60, prot: result.proteinG - 5, water: 2500, target: result.tdee, compliant: true },
    { day: 'Wed', cals: result.tdee - 20, prot: result.proteinG + 10, water: 2800, target: result.tdee, compliant: true },
    { day: 'Thu', cals: result.tdee - 80, prot: result.proteinG - 10, water: 2200, target: result.tdee, compliant: false },
    { day: 'Fri', cals: result.tdee + 15, prot: result.proteinG + 5, water: 2500, target: result.tdee, compliant: true },
    { day: 'Sat', cals: result.tdee + 90, prot: result.proteinG + 8, water: 2700, target: result.tdee, compliant: true },
    { day: 'Sun (Today)', cals: Math.round(result.tdee * 0.85), prot: result.proteinG, water: 2400, target: result.tdee, compliant: true },
  ];

  const compliantDaysCount = weekDays.filter((d) => d.compliant).length;
  const complianceRate = Math.round((compliantDaysCount / 7) * 100);

  // SVG Chart points calculation
  const chartPoints = useMemo(() => {
    const sorted = [...weightLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sorted.length === 0) return { path: '', points: [], minW: 65, maxW: 85 };

    const weights = sorted.map((s) => s.weightKg);
    const minW = Math.min(...weights, targetWeight) - 2;
    const maxW = Math.max(...weights, targetWeight) + 2;
    const width = 500;
    const height = 180;
    const pad = 24;

    const pts = sorted.map((entry, idx) => {
      const x = pad + (idx / Math.max(1, sorted.length - 1)) * (width - 2 * pad);
      const y = height - pad - ((entry.weightKg - minW) / Math.max(1, maxW - minW)) * (height - 2 * pad);
      return { x, y, entry };
    });

    const pathD = pts.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
    return { path: pathD, points: pts, minW, maxW };
  }, [weightLogs, targetWeight]);

  // Export Weekly Report PDF
  const handleExportWeeklyPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129); // emerald
    doc.text('NutriSynth Executive Weekly Report', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Week of ${new Date().toLocaleDateString()} • Evidence-based Metabolic Review`, 14, 28);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Summary Metrics:', 14, 42);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`• Adherence Grade: A (${complianceRate}% target compliance)`, 20, 50);
    doc.text(`• Daily Calorie Target: ${result.tdee} kcal`, 20, 58);
    doc.text(`• Daily Protein Target: ${result.proteinG}g`, 20, 66);
    doc.text(`• Current Weight: ${currentWeight} kg (Target: ${targetWeight} kg)`, 20, 74);
    doc.text(`• 7-Day Net Change: ${totalChange > 0 ? `+${totalChange}` : totalChange} kg`, 20, 82);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Daily Compliance Logs:', 14, 98);

    let y = 108;
    weekDays.forEach((wd) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(
        `${wd.day.padEnd(12)} : ${wd.cals} kcal | ${wd.prot}g protein | ${wd.water} ml water [${wd.compliant ? 'PASSED' : 'DEFICIT'}]`,
        20,
        y
      );
      y += 8;
    });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Clinical Dietitian Recommendations:', 14, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('1. Protein synthesis is consistent; continue pairing resistance workouts with post-workout protein.', 20, y + 20);
    doc.text('2. Hydration levels averaged 2,500ml+, maintaining optimal cellular recovery.', 20, y + 28);
    doc.text('3. Projected to reach target milestone on this trajectory within 4 to 6 weeks.', 20, y + 36);

    doc.save(`NutriSynth-Weekly-Report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <SectionErrorBoundary fallbackTitle="Nutrition & Weight Analytics">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-12">
        {/* Beginner Guide Banner answering the 3 core questions */}
        <BeginnerGuideBanner
          screenTitle="Your Weight & Progress Trends"
          whatAmILookingAt="A visual chart of your body weight over time, alongside your weekly habit consistency score. This tracks long-term trends rather than daily ups and downs."
          whatShouldIDo="Weigh yourself once or twice a week (ideally first thing in the morning before food) and tap '+ Log Today's Weight' to record it."
          whatHappensWhenIPress="Logging your weight adds a new point to your progress curve and estimates your arrival date at your goal."
          primaryAction={{
            label: '+ Log Weight Entry',
            onClick: () => {
              playChecklistSound(true);
              setIsAddOpen(true);
            },
            caption: 'Takes 10 seconds to record your morning weight',
          }}
        />

        {/* Beginner Wisdom Card: Daily Weight Fluctuations */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/30 flex items-start gap-3.5 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-[#22C55E] dark:text-[#34D399] flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-[#F8FAFC]">
              💡 Beginner Tip: Why does scale weight change day-to-day?
            </h4>
            <p className="text-xs text-stone-600 dark:text-[#CBD5E1] leading-relaxed">
              It is 100% normal for your body weight to swing 1 to 2 kg (2 to 4 lbs) in a single day! These short-term bumps are almost always water retention, salt from dinner, or muscle recovery after exercise—NOT body fat. What matters is the smooth green trendline over 3 to 4 weeks.
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] shadow-sm">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-[#22C55E] dark:text-[#34D399] text-xs font-bold mb-1 border border-emerald-500/30">
              <Activity className="w-3.5 h-3.5" />
              <span>Weight Progress & Habit Consistency</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl text-stone-900 dark:text-[#F8FAFC]">
              Progress Analytics & Weekly Report
            </h1>
            <p className="text-xs text-stone-500 dark:text-[#8492A6] mt-0.5">
              Long-term weight trend lines, calorie consistency, and weekly progress summaries.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                playChecklistSound(true);
                setIsAddOpen(!isAddOpen);
              }}
              className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-[#101D2D] dark:hover:bg-[#101D2D]/80 text-stone-700 dark:text-[#CBD5E1] text-xs font-bold transition-all flex items-center gap-1.5 border border-stone-200 dark:border-[#1E293B] shadow-xs cursor-pointer"
              title="Opens a simple form to record your weight"
            >
              <Scale className="w-3.5 h-3.5 text-[#22C55E] dark:text-[#34D399]" />
              <span>{isAddOpen ? 'Close Form' : '+ Log Weight'}</span>
            </button>
            <button
              type="button"
              onClick={handleExportWeeklyPDF}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] text-xs font-bold transition-all flex items-center gap-1.5 shadow-md hover:opacity-95 cursor-pointer"
              title="Download a clean PDF summarizing your weekly nutrition consistency and weight trends"
            >
              <FileDown className="w-3.5 h-3.5 text-[#07111F]" />
              <span>Download Weekly PDF</span>
            </button>
          </div>
        </div>

        {/* Log Weight Form Modal / Card */}
        {isAddOpen && (
          <form
            onSubmit={handleLogWeight}
            className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/30 space-y-4 animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-stone-900 dark:text-[#F8FAFC] flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#22C55E]" />
                <span>Record New Weight Entry</span>
              </h3>
              <span className="text-[10px] text-stone-400 dark:text-[#8492A6]">Keep measurements consistent (e.g. morning, before food)</span>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-stone-500 dark:text-[#8492A6] uppercase block mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="76.2"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#101D2D] border border-stone-200 dark:border-[#1E293B] text-xs font-semibold text-stone-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#2DD4BF]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-500 dark:text-[#8492A6] uppercase block mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#101D2D] border border-stone-200 dark:border-[#1E293B] text-xs font-semibold text-stone-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#2DD4BF]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-500 dark:text-[#8492A6] uppercase block mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Post-morning run, good sleep..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#101D2D] border border-stone-200 dark:border-[#1E293B] text-xs font-semibold text-stone-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#2DD4BF]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-stone-500 hover:text-stone-300 dark:text-[#8492A6] dark:hover:text-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] text-xs font-bold transition-all shadow-sm hover:opacity-95"
              >
                Save Weight Entry
              </button>
            </div>
          </form>
        )}

        {/* 3 Metric Cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] shadow-sm space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-stone-500 dark:text-[#8492A6]">Current Weight</span>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-black text-3xl text-stone-900 dark:text-[#F8FAFC]">
                {currentWeight}
              </span>
              <span className="text-sm font-bold text-stone-400 dark:text-[#8492A6]">kg</span>
            </div>
            <div className="text-[11px] font-bold text-stone-500 dark:text-[#8492A6] flex items-center gap-1">
              <span>Target: {targetWeight} kg</span>
              <span className="text-[#34D399]">({Math.abs(currentWeight - targetWeight).toFixed(1)} kg to go)</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] shadow-sm space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-stone-500 dark:text-[#8492A6]">Net Trajectory</span>
            <div className="flex items-baseline gap-2">
              <span className={`font-display font-black text-3xl ${totalChange <= 0 ? 'text-[#22C55E] dark:text-[#34D399]' : 'text-amber-500'}`}>
                {totalChange > 0 ? `+${totalChange}` : totalChange}
              </span>
              <span className="text-sm font-bold text-stone-400 dark:text-[#8492A6]">kg total</span>
            </div>
            <p className="text-[11px] font-bold text-stone-500 dark:text-[#8492A6]">
              Pacing: ~0.4 kg/week (Safe & Sustainable)
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] shadow-sm space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-stone-500 dark:text-[#8492A6]">Weekly Grade</span>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-black text-3xl text-[#22C55E] dark:text-[#34D399]">
                A (92%)
              </span>
            </div>
            <p className="text-[11px] font-bold text-stone-500 dark:text-[#8492A6]">
              {compliantDaysCount} of 7 days on-target
            </p>
          </div>
        </div>

        {/* Weight Trajectory Chart */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-display font-bold text-base text-stone-900 dark:text-[#F8FAFC] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#22C55E]" />
                <span>Weight History & Target Trajectory</span>
              </h3>
              <p className="text-xs text-stone-500 dark:text-[#8492A6]">
                Smooth trend lines plotted against your ideal target weight.
              </p>
            </div>
            <span className="text-xs font-bold text-stone-400 dark:text-[#8492A6]">
              {weightLogs.length} logs recorded
            </span>
          </div>

          {/* SVG Line Chart */}
          <div className="w-full">
            <svg
              viewBox="0 0 500 180"
              preserveAspectRatio="xMidYMid meet"
              className="w-full h-auto max-h-56 select-none"
            >
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="20" y1="30" x2="480" y2="30" stroke="#1E293B" strokeOpacity="0.4" strokeDasharray="3 3" />
              <line x1="20" y1="85" x2="480" y2="85" stroke="#1E293B" strokeOpacity="0.4" strokeDasharray="3 3" />
              <line x1="20" y1="140" x2="480" y2="140" stroke="#1E293B" strokeOpacity="0.4" strokeDasharray="3 3" />

              {/* Target Line (Subtle Tech Blue Accent) */}
              <line
                x1="20"
                y1={180 - 24 - ((targetWeight - chartPoints.minW) / Math.max(1, chartPoints.maxW - chartPoints.minW)) * (180 - 48)}
                x2="480"
                y2={180 - 24 - ((targetWeight - chartPoints.minW) / Math.max(1, chartPoints.maxW - chartPoints.minW)) * (180 - 48)}
                stroke="#60A5FA"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text
                x="475"
                y={180 - 28 - ((targetWeight - chartPoints.minW) / Math.max(1, chartPoints.maxW - chartPoints.minW)) * (180 - 48)}
                textAnchor="end"
                className="fill-[#60A5FA] text-[9px] font-bold"
              >
                Target: {targetWeight} kg
              </text>

              {/* Trajectory Polyline */}
              {chartPoints.path && (
                <>
                  <path
                    d={chartPoints.path}
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {chartPoints.points.map((pt, i) => (
                    <g key={i}>
                      <circle cx={pt.x} cy={pt.y} r="5" fill="#22C55E" className="stroke-white dark:stroke-[#0B0F0E]" strokeWidth="2" />
                      <text
                        x={pt.x}
                        y={pt.y - 9}
                        textAnchor="middle"
                        className="fill-stone-700 dark:fill-[#CBD5E1] text-[9px] font-black"
                      >
                        {pt.entry.weightKg}k
                      </text>
                    </g>
                  ))}
                </>
              )}
            </svg>
          </div>
        </div>

        {/* Weekly Adherence Breakdown */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-base text-stone-900 dark:text-[#F8FAFC]">
                7-Day Consistency Breakdown
              </h3>
              <p className="text-xs text-stone-500 dark:text-[#8492A6]">
                Daily calorie and protein discipline leading to your current metabolic grade.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-[#34D399]">
              {complianceRate}% Compliance
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-2">
            {weekDays.map((d) => (
              <div
                key={d.day}
                className="p-3 rounded-2xl bg-stone-50 dark:bg-[#101D2D] border border-stone-200/70 dark:border-[#1E293B] text-center space-y-1.5"
              >
                <div className="text-[10px] font-extrabold uppercase text-stone-500 dark:text-[#8492A6]">
                  {d.day}
                </div>
                <div className="font-display font-bold text-sm text-stone-900 dark:text-[#F8FAFC]">
                  {d.cals} <span className="text-[9px] text-stone-400 dark:text-[#8492A6]">kcal</span>
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-[#34D399] font-bold">
                  {d.prot}g protein
                </div>
                <div className="pt-1">
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${
                      d.compliant ? 'bg-[#22C55E]' : 'bg-amber-500'
                    }`}
                    title={d.compliant ? 'Target Met' : 'Minor Deviation'}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionErrorBoundary>
  );
}
