import { useState, useRef } from 'react';
import {
  Dna, ArrowLeft, Beaker, BookOpen, AlertTriangle, CheckCircle2, Info, AlertCircle,
  FlaskConical, ChevronRight, User, Activity, Salad, Sparkles, Check
} from 'lucide-react';
import {
  rdiTable, nutrientInfo, getDeficiencyStatus, getStatusLabel, getStatusColor,
  deficiencyFoodSources, type DeficiencyStatus, type DeficiencyResult
} from '@/data/nutrients';
import { evidenceSources } from '@/data/foods';
import { estimateMicroIntake, type NutritionResult, type UserProfile, type MealItem } from '@/lib/calculations';
import { ExpandableSection, Badge, DonutChart, NutrientBarRow } from '@/components/ui';
import { DownloadMenu } from '@/components/DownloadMenu';
import { getDetailedFoodInfo, type FoodDetail } from '@/data/foodDetails';
import { SuggestedFoodItem, type GoalContext } from '@/components/nutrition/SuggestedFoodItem';

interface DeficiencyProps {
  result: NutritionResult | null;
  profile: UserProfile | null;
  onBack: () => void;
  onStartOnboarding: () => void;
  onAddMeal?: (meal: MealItem) => void;
}

interface LabEntry {
  test: string;
  value: string;
  unit: string;
  refLow: string;
  refHigh: string;
}

export function DeficiencyCheck({ result, profile, onBack, onStartOnboarding, onAddMeal }: DeficiencyProps) {
  const [showLabForm, setShowLabForm] = useState(false);
  const [labEntries, setLabEntries] = useState<LabEntry[]>([]);
  const [localProfile, setLocalProfile] = useState({
    age: profile?.age || 30,
    gender: profile?.gender || "male",
    diet: profile?.diet || "nonveg",
    femaleState: profile?.femaleState || "none",
  });
  const [hasChecked, setHasChecked] = useState(false);
  const donutRef = useRef<HTMLDivElement>(null);

  const handleCheck = () => {
    setHasChecked(true);
  };

  const micros = rdiTable(localProfile.age, localProfile.gender as any, localProfile.femaleState);
  const estimatedIntake = result ? result.estimatedMicroIntake : estimateMicroIntake([]);

  const results: DeficiencyResult[] = nutrientInfo.map(nutrient => {
    const rdi = micros[nutrient.key as keyof typeof micros] || 0;
    const intake = estimatedIntake[nutrient.key] || 0;
    const status = getDeficiencyStatus(intake, rdi);

    // Check lab values
    let labStatus: DeficiencyStatus | null = null;
    const labEntry = labEntries.find(l => l.test.toLowerCase().includes(nutrient.label.toLowerCase()) || l.test.toLowerCase().includes(nutrient.key.toLowerCase()));
    if (labEntry && labEntry.value && labEntry.refLow && labEntry.refHigh) {
      const val = parseFloat(labEntry.value);
      const low = parseFloat(labEntry.refLow);
      const high = parseFloat(labEntry.refHigh);
      if (!isNaN(val) && !isNaN(low) && !isNaN(high)) {
        if (val < low || val > high) labStatus = "professional";
      }
    }

    const finalStatus = labStatus || status;
    const foodSources = deficiencyFoodSources[nutrient.key] || [];

    let reason = "";
    if (intake === 0) {
      reason = `No dietary data available for ${nutrient.label}. Estimate requires completed meal analysis.`;
    } else {
      const pct = Math.round((intake / rdi) * 100);
      reason = `Estimated dietary intake: ${Math.round(intake)} ${nutrient.unit} (${pct}% of RDI: ${rdi} ${nutrient.unit}).`;
    }
    if (labStatus === "professional") {
      reason += " A laboratory value you entered is outside the reference interval you provided.";
    }

    return {
      nutrient: nutrient.key,
      label: nutrient.label,
      unit: nutrient.unit,
      rdi,
      estimatedIntake: intake,
      status: finalStatus,
      statusLabel: getStatusLabel(finalStatus),
      statusColor: getStatusColor(finalStatus),
      reason,
      foodSources,
      note: nutrient.desc,
    };
  });

  if (!result && !hasChecked) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-brand-50/20 to-white py-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <button onClick={onBack} className="btn-ghost mb-6">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="text-center mb-8 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-600 flex items-center justify-center text-white">
              <Dna className="w-8 h-8" />
            </div>
            <h1 className="font-display font-bold text-3xl text-stone-900 mb-2">NutriSynth Deficiency Check</h1>
            <p className="text-stone-600 text-balance">Screen your dietary pattern for potential nutrient inadequacies.</p>
          </div>

          <div className="card-lg p-6 sm:p-8 space-y-6 animate-fade-in" style={{ animationDelay: '60ms' }}>
            {/* Input fields */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Age</label>
                <input
                  type="number"
                  value={localProfile.age}
                  onChange={e => setLocalProfile(p => ({ ...p, age: Number(e.target.value) }))}
                  className="input-field"
                  min={1} max={120}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Sex / Gender</label>
                <select
                  value={localProfile.gender}
                  onChange={e => setLocalProfile(p => ({ ...p, gender: e.target.value }))}
                  className="input-field"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Dietary Pattern</label>
                <select
                  value={localProfile.diet}
                  onChange={e => setLocalProfile(p => ({ ...p, diet: e.target.value }))}
                  className="input-field"
                >
                  <option value="nonveg">Non-Vegetarian</option>
                  <option value="veg">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="eggetarian">Eggetarian</option>
                </select>
              </div>
              {localProfile.gender === "female" && (
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Life Stage</label>
                  <select
                    value={localProfile.femaleState}
                    onChange={e => setLocalProfile(p => ({ ...p, femaleState: e.target.value }))}
                    className="input-field"
                  >
                    <option value="none">None</option>
                    <option value="pregnancy">Pregnancy</option>
                    <option value="lactation">Lactation</option>
                  </select>
                </div>
              )}
            </div>

            {/* Optional Lab Results */}
            <div>
              <button
                onClick={() => setShowLabForm(!showLabForm)}
                className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-dashed border-stone-300 hover:border-brand-400 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <FlaskConical className="w-5 h-5 text-brand-600" />
                  <div>
                    <div className="font-semibold text-sm text-stone-800">Optional Lab Results</div>
                    <div className="text-xs text-stone-500">Add laboratory values to compare against reference intervals</div>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-stone-400 transition-transform ${showLabForm ? 'rotate-90' : ''}`} />
              </button>
              {showLabForm && (
                <div className="mt-3 space-y-3 animate-fade-in">
                  {labEntries.map((entry, i) => (
                    <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-stone-50">
                      <input placeholder="Test name" value={entry.test} onChange={e => updateLabEntry(labEntries, setLabEntries, i, "test", e.target.value)} className="input-field text-sm py-2" />
                      <input placeholder="Value" value={entry.value} onChange={e => updateLabEntry(labEntries, setLabEntries, i, "value", e.target.value)} className="input-field text-sm py-2" />
                      <input placeholder="Unit" value={entry.unit} onChange={e => updateLabEntry(labEntries, setLabEntries, i, "unit", e.target.value)} className="input-field text-sm py-2" />
                      <div className="flex gap-1">
                        <input placeholder="Ref low" value={entry.refLow} onChange={e => updateLabEntry(labEntries, setLabEntries, i, "refLow", e.target.value)} className="input-field text-sm py-2" />
                        <input placeholder="Ref high" value={entry.refHigh} onChange={e => updateLabEntry(labEntries, setLabEntries, i, "refHigh", e.target.value)} className="input-field text-sm py-2" />
                      </div>
                      <button onClick={() => setLabEntries(labEntries.filter((_, idx) => idx !== i))} className="col-span-2 sm:col-span-4 text-xs text-red-500 hover:text-red-700">Remove</button>
                    </div>
                  ))}
                  <button onClick={() => setLabEntries([...labEntries, { test: "", value: "", unit: "", refLow: "", refHigh: "" }])} className="btn-ghost text-sm">
                    + Add Lab Result
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/50">
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Important:</strong> This screening uses estimated dietary intake and does not diagnose deficiencies. Nutrient needs vary with health conditions, medications, and other factors. Consult a qualified healthcare professional for medical assessment.
              </p>
            </div>

            <button onClick={handleCheck} className="btn-primary w-full text-base py-4">
              <Dna className="w-5 h-5" />
              Check Nutrient Status
            </button>

            {!profile && (
              <div className="text-center text-sm text-stone-500">
                <button onClick={onStartOnboarding} className="text-brand-600 font-medium hover:underline">
                  Complete your nutrition profile first
                </button>
                {" "}for more accurate estimates.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Results view
  const sortedResults = [...results].sort((a, b) => {
    const order = { attention: 0, professional: 1, low: 2, "insufficient-data": 3, met: 4 };
    return (order[a.status as keyof typeof order] ?? 5) - (order[b.status as keyof typeof order] ?? 5);
  });

  const statusCounts = results.reduce((acc, r) => {
    const key = r.status === "professional" ? "attention" : r.status;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusSegments = [
    { label: "Met", value: statusCounts.met || 0, color: "#22c55e" },
    { label: "Low", value: statusCounts.low || 0, color: "#f59e0b" },
    { label: "Attention", value: statusCounts.attention || 0, color: "#ef4444" },
    { label: "Insufficient Data", value: statusCounts["insufficient-data"] || 0, color: "#0ea5e9" },
  ].filter(s => s.value > 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-stone-50/50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => { setHasChecked(false); onBack(); }} className="btn-ghost mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-600 flex items-center justify-center text-white">
              <Dna className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-stone-900">Nutrient Status Results</h1>
              <p className="text-sm text-stone-500">Screening based on {localProfile.gender}, age {localProfile.age}, {localProfile.diet} diet</p>
            </div>
          </div>
        </div>

        {/* Status Overview Chart */}
        <div className="card-lg p-6 mb-6 animate-fade-in" style={{ animationDelay: '30ms' }} ref={donutRef}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg text-stone-900">Status Overview</h2>
            <DownloadMenu targetRef={donutRef} filename="nutrient-status-overview" title="Nutrient Status Overview" />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <DonutChart segments={statusSegments} size={140} centerValue={String(results.length)} centerUnit="nutrients" />
            <div className="flex-1 w-full grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-brand-50 p-3 text-center">
                <div className="metric-value text-xl text-brand-700">{statusCounts.met || 0}</div>
                <div className="text-xs text-stone-600 font-medium">Target Met</div>
              </div>
              <div className="rounded-xl bg-amber-50 p-3 text-center">
                <div className="metric-value text-xl text-amber-700">{statusCounts.low || 0}</div>
                <div className="text-xs text-stone-600 font-medium">Potential Low</div>
              </div>
              <div className="rounded-xl bg-red-50 p-3 text-center">
                <div className="metric-value text-xl text-red-700">{statusCounts.attention || 0}</div>
                <div className="text-xs text-stone-600 font-medium">Attention</div>
              </div>
              <div className="rounded-xl bg-sky-50 p-3 text-center">
                <div className="metric-value text-xl text-sky-700">{statusCounts["insufficient-data"] || 0}</div>
                <div className="text-xs text-stone-600 font-medium">Insufficient Data</div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Legend */}
        <div className="card p-4 mb-6 animate-fade-in" style={{ animationDelay: '60ms' }}>
          <div className="flex flex-wrap gap-3 text-xs">
            <LegendItem color="success" label="Target appears met" />
            <LegendItem color="warning" label="Potential low intake" />
            <LegendItem color="error" label="Attention needed" />
            <LegendItem color="info" label="Insufficient data" />
            <LegendItem color="error" label="Professional review" />
          </div>
        </div>

        {/* Results */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: '120ms' }}>
          {sortedResults.map((res, i) => (
            <NutrientResultCard
              key={i}
              result={res}
              onAddMeal={onAddMeal}
              goalContext={result && profile ? {
                goal: profile.goal,
                tdee: result.tdee,
                proteinG: result.proteinG,
                carbG: result.carbG,
                fatG: result.fatG,
                fiberG: result.fiberG,
              } : undefined}
            />
          ))}
        </div>

        {/* Evidence Basis */}
        <div className="card p-6 mt-6 animate-fade-in" style={{ animationDelay: '180ms' }}>
          <ExpandableSection title="Evidence Basis" icon={<BookOpen className="w-4 h-4 text-stone-500" />}>
            <div className="space-y-3 pt-2">
              {evidenceSources.deficiency.map((src, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-stone-800">{src.source}</div>
                    <div className="text-stone-500 text-xs mt-0.5">{src.purpose}</div>
                  </div>
                </div>
              ))}
            </div>
          </ExpandableSection>
        </div>

        {/* Medical Disclaimer */}
        <div className="mt-6 p-4 rounded-xl bg-amber-50/60 border border-amber-200/50 animate-fade-in" style={{ animationDelay: '240ms' }}>
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Disclaimer:</strong> NutriSynth does not diagnose medical conditions or confirm nutrient deficiencies. These results are based on estimated dietary intake and general reference values. Nutritional needs can vary with health conditions, medications, laboratory findings, and other factors. Consult a qualified healthcare professional when appropriate.
            </p>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-6 text-center">
          <button onClick={() => { setHasChecked(false); onBack(); }} className="btn-secondary">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

function updateLabEntry(entries: LabEntry[], setter: (e: LabEntry[]) => void, index: number, field: keyof LabEntry, value: string) {
  const updated = [...entries];
  updated[index] = { ...updated[index], [field]: value };
  setter(updated);
}

function LegendItem({ color, label }: { color: string; label: string }) {
  const colorMap: Record<string, string> = {
    success: "bg-brand-500", warning: "bg-amber-500", error: "bg-red-500", info: "bg-sky-500",
  };
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-full ${colorMap[color]}`} />
      <span className="text-stone-600 font-medium">{label}</span>
    </div>
  );
}

function NutrientResultCard({
  result,
  onAddMeal,
  goalContext,
}: {
  result: DeficiencyResult;
  onAddMeal?: (meal: MealItem) => void;
  goalContext?: GoalContext;
}) {
  const [tickedFoods, setTickedFoods] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const statusIcon = {
    met: CheckCircle2,
    low: AlertTriangle,
    attention: AlertCircle,
    "insufficient-data": Info,
    professional: AlertCircle,
  };
  const statusColorClass = {
    met: "text-brand-600 bg-brand-50",
    low: "text-amber-600 bg-amber-50",
    attention: "text-red-600 bg-red-50",
    "insufficient-data": "text-sky-600 bg-sky-50",
    professional: "text-red-600 bg-red-50",
  };
  const Icon = statusIcon[result.status];
  const colorClass = statusColorClass[result.status];

  const tickedCount = Object.values(tickedFoods).filter(Boolean).length;
  const totalTickedKcal = result.foodSources
    .filter(f => !!tickedFoods[f])
    .map(f => getDetailedFoodInfo(f)?.calories ?? 0)
    .reduce((s, c) => s + c, 0);

  return (
    <div className="card-lg overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-semibold text-stone-900">{result.label}</h3>
                <span className="text-xs text-stone-400">RDI: {result.rdi} {result.unit}/day</span>
              </div>
              <div className={`text-sm font-medium mt-1 ${
                result.status === "met" ? "text-brand-700" :
                result.status === "low" ? "text-amber-700" :
                result.status === "insufficient-data" ? "text-sky-700" :
                "text-red-700"
              }`}>
                {result.statusLabel}
              </div>
              <p className="text-xs text-stone-500 mt-1.5">{result.reason}</p>
              {result.estimatedIntake > 0 && (
                <div className="mt-3 max-w-sm">
                  <NutrientBarRow
                    label=""
                    pct={Math.round((result.estimatedIntake / result.rdi) * 100)}
                    status={result.status}
                    valueLabel={`${Math.round((result.estimatedIntake / result.rdi) * 100)}% of RDI`}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-stone-200/60 dark:border-stone-800 px-5">
        <ExpandableSection title="Suggested Foods & Dietary Sources" icon={<Beaker className="w-4 h-4 text-stone-500" />}>
          <div className="space-y-4 pb-4 pt-1">
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">{result.note}</p>

            {toastMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-xs text-emerald-800 dark:text-emerald-200 font-medium flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{toastMessage}</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
                <div className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                  Suggested Food Sources
                  {tickedCount > 0 && (
                    <span className="badge badge-success text-[11px] font-semibold">
                      {tickedCount} ticked (+{Math.round(totalTickedKcal)} kcal)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-400 dark:text-stone-500">
                    Tick food to view kcal & nutrition details
                  </span>
                  {tickedCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setTickedFoods({})}
                      className="text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-2.5">
                {result.foodSources.map((foodName) => {
                  const foodDetail = getDetailedFoodInfo(foodName);
                  if (!foodDetail) return null;
                  const isTicked = !!tickedFoods[foodName];

                  return (
                    <SuggestedFoodItem
                      key={foodName}
                      food={foodDetail}
                      isTicked={isTicked}
                      onToggle={() => {
                        setTickedFoods((prev) => ({
                          ...prev,
                          [foodName]: !prev[foodName],
                        }));
                      }}
                      onLogFood={
                        onAddMeal
                          ? (f) => {
                              onAddMeal({
                                name: `Food: ${f.name}`,
                                food: `${f.name} (${f.serving})`,
                                details: {
                                  calories: Math.round(f.calories),
                                  protein: +f.protein.toFixed(1),
                                  carbs: +f.carbs.toFixed(1),
                                  fat: +f.fat.toFixed(1),
                                  fiber: +f.fiber.toFixed(1),
                                },
                                components: [f.name.toLowerCase()],
                                icon: 'Camera',
                              });
                              setToastMessage(`Added ${f.name} (${Math.round(f.calories)} kcal) to today's meals!`);
                              setTimeout(() => setToastMessage(null), 3000);
                            }
                          : undefined
                      }
                      goalContext={goalContext}
                      compact
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </ExpandableSection>
      </div>
    </div>
  );
}
