import { useState, useRef, useMemo } from 'react';
import {
  Dna, ArrowLeft, Beaker, BookOpen, AlertTriangle, CheckCircle2, Info, AlertCircle,
  FlaskConical, ChevronRight, User, Activity, Salad, Sparkles, Check, Stethoscope,
  Filter, Zap, ShieldAlert, HeartPulse, Brain, Eye, Plus, Trash2, Printer,
  RefreshCw, ChevronDown, Flame, ArrowUpRight, Scale
} from 'lucide-react';
import {
  rdiTable, nutrientInfo, getDeficiencyStatus, getStatusLabel, getStatusColor,
  deficiencyFoodSources, type DeficiencyStatus, type DeficiencyResult, type Gender
} from '@/data/nutrients';
import { evidenceSources } from '@/data/foods';
import { estimateMicroIntake, type NutritionResult, type UserProfile, type MealItem } from '@/lib/calculations';
import { ExpandableSection, Badge, DonutChart, NutrientBarRow } from '@/components/ui';
import { DownloadMenu } from '@/components/DownloadMenu';
import { getDetailedFoodInfo, type FoodDetail } from '@/data/foodDetails';
import { SuggestedFoodItem, type GoalContext } from '@/components/nutrition/SuggestedFoodItem';
import { playAddProgressSound, playChecklistSound, playCongratsSound } from '@/lib/soundEffects';
import { BeginnerGuideBanner } from '@/components/beginner/BeginnerGuideBanner';

interface DeficiencyProps {
  result: NutritionResult | null;
  profile: UserProfile | null;
  onBack: () => void;
  onStartOnboarding: () => void;
  onAddMeal?: (meal: MealItem) => void;
}

export interface LabEntry {
  test: string;
  value: string;
  unit: string;
  refLow: string;
  refHigh: string;
}

type DeficiencyTab = 'matrix' | 'symptoms' | 'labs' | 'dietary' | 'report';

interface SymptomItem {
  id: string;
  title: string;
  system: 'energy' | 'hair_skin' | 'muscle' | 'neuro' | 'immunity';
  icon: string;
  description: string;
  suspectedNutrients: { key: string; label: string; priority: 'high' | 'moderate' }[];
}

const SYMPTOM_CATALOG: SymptomItem[] = [
  // Energy & Mental
  {
    id: 'fatigue',
    title: 'Persistent Fatigue & Low Stamina',
    system: 'energy',
    icon: '⚡',
    description: 'Feeling constantly drained even after a full night of sleep, heavy limbs, or low exercise capacity.',
    suspectedNutrients: [
      { key: 'iron', label: 'Iron (Ferritin)', priority: 'high' },
      { key: 'vitaminD', label: 'Vitamin D', priority: 'high' },
      { key: 'vitaminB12', label: 'Vitamin B12', priority: 'high' },
      { key: 'magnesium', label: 'Magnesium', priority: 'moderate' },
    ],
  },
  {
    id: 'brain_fog',
    title: 'Brain Fog & Poor Concentration',
    system: 'energy',
    icon: '🧠',
    description: 'Sluggish thinking, difficulty recalling words or retaining focus during workday tasks.',
    suspectedNutrients: [
      { key: 'vitaminB12', label: 'Vitamin B12', priority: 'high' },
      { key: 'iron', label: 'Iron', priority: 'high' },
      { key: 'folate', label: 'Folate', priority: 'moderate' },
      { key: 'iodine', label: 'Iodine', priority: 'moderate' },
    ],
  },
  {
    id: 'low_mood',
    title: 'Low Mood, Anxiety or S.A.D.',
    system: 'energy',
    icon: '🌧️',
    description: 'Apathy, feeling down without obvious stressor, winter blues or seasonal affective dips.',
    suspectedNutrients: [
      { key: 'vitaminD', label: 'Vitamin D', priority: 'high' },
      { key: 'magnesium', label: 'Magnesium', priority: 'high' },
      { key: 'vitaminB12', label: 'Vitamin B12', priority: 'moderate' },
      { key: 'folate', label: 'Folate', priority: 'moderate' },
    ],
  },
  {
    id: 'poor_sleep',
    title: 'Restless Sleep & Frequent Waking',
    system: 'energy',
    icon: '🌙',
    description: 'Tossing and turning, shallow sleep, difficulty unwinding tight muscles before bed.',
    suspectedNutrients: [
      { key: 'magnesium', label: 'Magnesium', priority: 'high' },
      { key: 'calcium', label: 'Calcium', priority: 'moderate' },
      { key: 'vitaminD', label: 'Vitamin D', priority: 'moderate' },
    ],
  },

  // Hair, Skin & Nails
  {
    id: 'hair_fall',
    title: 'Excessive Hair Fall & Thinning',
    system: 'hair_skin',
    icon: '💇',
    description: 'Losing clumps of hair during washing or brushing; widened parting or receding temple line.',
    suspectedNutrients: [
      { key: 'iron', label: 'Iron (Ferritin)', priority: 'high' },
      { key: 'zinc', label: 'Zinc', priority: 'high' },
      { key: 'protein', label: 'Protein', priority: 'high' },
      { key: 'vitaminD', label: 'Vitamin D', priority: 'moderate' },
      { key: 'selenium', label: 'Selenium', priority: 'moderate' },
    ],
  },
  {
    id: 'brittle_nails',
    title: 'Brittle, Peeling or Ridged Nails',
    system: 'hair_skin',
    icon: '💅',
    description: 'Nails snap, peel easily in layers, or develop vertical ridges and spoon-like concavity.',
    suspectedNutrients: [
      { key: 'iron', label: 'Iron', priority: 'high' },
      { key: 'calcium', label: 'Calcium', priority: 'high' },
      { key: 'zinc', label: 'Zinc', priority: 'moderate' },
      { key: 'protein', label: 'Protein', priority: 'moderate' },
    ],
  },
  {
    id: 'pale_skin',
    title: 'Pale Skin & Dark Under-Eye Circles',
    system: 'hair_skin',
    icon: '🪞',
    description: 'Loss of pinkish tone in lower inner eyelids, gums, nail beds; persistent dark sunken circles.',
    suspectedNutrients: [
      { key: 'iron', label: 'Iron (Anemia)', priority: 'high' },
      { key: 'vitaminB12', label: 'Vitamin B12', priority: 'high' },
      { key: 'folate', label: 'Folate', priority: 'moderate' },
    ],
  },
  {
    id: 'dry_skin',
    title: 'Rough, Dry Skin or Keratosis Pilaris',
    system: 'hair_skin',
    icon: '🧴',
    description: 'Flaking skin, sandpaper bumps on backs of arms (chicken skin), or chapped lips.',
    suspectedNutrients: [
      { key: 'vitaminA', label: 'Vitamin A', priority: 'high' },
      { key: 'zinc', label: 'Zinc', priority: 'high' },
      { key: 'vitaminE', label: 'Vitamin E', priority: 'moderate' },
    ],
  },
  {
    id: 'slow_healing',
    title: 'Slow Wound Healing & Easy Bruising',
    system: 'hair_skin',
    icon: '🩹',
    description: 'Cuts and scrapes linger for weeks, or unprovoked black/blue marks appear easily.',
    suspectedNutrients: [
      { key: 'vitaminC', label: 'Vitamin C', priority: 'high' },
      { key: 'zinc', label: 'Zinc', priority: 'high' },
      { key: 'vitaminK', label: 'Vitamin K', priority: 'high' },
    ],
  },

  // Musculoskeletal
  {
    id: 'muscle_cramps',
    title: 'Leg / Calf Cramps & Twitches',
    system: 'muscle',
    icon: '🦵',
    description: 'Sudden painful nocturnal charley horse in calves or involuntary eyelid twitches.',
    suspectedNutrients: [
      { key: 'magnesium', label: 'Magnesium', priority: 'high' },
      { key: 'potassium', label: 'Potassium', priority: 'high' },
      { key: 'calcium', label: 'Calcium', priority: 'moderate' },
      { key: 'vitaminD', label: 'Vitamin D', priority: 'moderate' },
    ],
  },
  {
    id: 'bone_pain',
    title: 'Deep Bone Aches & Lower Back Pain',
    system: 'muscle',
    icon: '🦴',
    description: 'Aching deep inside the tibia, ribs, pelvis, or dull chronic lower spinal soreness.',
    suspectedNutrients: [
      { key: 'vitaminD', label: 'Vitamin D', priority: 'high' },
      { key: 'calcium', label: 'Calcium', priority: 'high' },
      { key: 'magnesium', label: 'Magnesium', priority: 'moderate' },
    ],
  },
  {
    id: 'joint_stiffness',
    title: 'Morning Joint Stiffness & Creaking',
    system: 'muscle',
    icon: '🏃',
    description: 'Difficulty flexing knees or fingers first thing in the morning; sensation of dry joints.',
    suspectedNutrients: [
      { key: 'vitaminD', label: 'Vitamin D', priority: 'high' },
      { key: 'calcium', label: 'Calcium', priority: 'moderate' },
      { key: 'vitaminC', label: 'Vitamin C (Collagen)', priority: 'moderate' },
    ],
  },

  // Neurological & Sensory
  {
    id: 'paresthesia',
    title: 'Pins & Needles (Tingling Hands / Feet)',
    system: 'neuro',
    icon: '⚡',
    description: 'Prickling numbness in toes or fingertips, electric sensations or mild unsteadiness.',
    suspectedNutrients: [
      { key: 'vitaminB12', label: 'Vitamin B12', priority: 'high' },
      { key: 'folate', label: 'Folate', priority: 'moderate' },
      { key: 'calcium', label: 'Calcium', priority: 'moderate' },
    ],
  },
  {
    id: 'cold_intolerance',
    title: 'Cold Hands & Feet (Always Feeling Chilly)',
    system: 'neuro',
    icon: '❄️',
    description: 'Shivering when others are warm; ice-cold fingers, toes, and sluggish metabolism.',
    suspectedNutrients: [
      { key: 'iron', label: 'Iron (Anemia)', priority: 'high' },
      { key: 'iodine', label: 'Iodine (Thyroid)', priority: 'high' },
      { key: 'vitaminB12', label: 'Vitamin B12', priority: 'moderate' },
    ],
  },
  {
    id: 'night_vision',
    title: 'Night Blindness & Glare Sensitivity',
    system: 'neuro',
    icon: '👁️',
    description: 'Trouble seeing when driving at dusk or entering a dimly lit cinema hall.',
    suspectedNutrients: [
      { key: 'vitaminA', label: 'Vitamin A', priority: 'high' },
      { key: 'zinc', label: 'Zinc', priority: 'moderate' },
    ],
  },

  // Immune & Oral
  {
    id: 'frequent_infections',
    title: 'Frequent Colds, Sore Throats & Flu',
    system: 'immunity',
    icon: '🛡️',
    description: 'Catching every bug circulating the office, lingering coughs, slow recovery from viruses.',
    suspectedNutrients: [
      { key: 'vitaminD', label: 'Vitamin D', priority: 'high' },
      { key: 'vitaminC', label: 'Vitamin C', priority: 'high' },
      { key: 'zinc', label: 'Zinc', priority: 'high' },
      { key: 'selenium', label: 'Selenium', priority: 'moderate' },
    ],
  },
  {
    id: 'mouth_ulcers',
    title: 'Recurrent Mouth Ulcers & Canker Sores',
    system: 'immunity',
    icon: '👄',
    description: 'Painful sores inside cheeks, red inflamed tongue (glossitis), or cracks at corner of lips.',
    suspectedNutrients: [
      { key: 'vitaminB12', label: 'Vitamin B12', priority: 'high' },
      { key: 'folate', label: 'Folate', priority: 'high' },
      { key: 'iron', label: 'Iron', priority: 'high' },
      { key: 'zinc', label: 'Zinc', priority: 'moderate' },
    ],
  },
  {
    id: 'bleeding_gums',
    title: 'Bleeding Gums When Brushing',
    system: 'immunity',
    icon: '🪥',
    description: 'Pink spit after toothbrushing or flossing; spongy, sensitive gums.',
    suspectedNutrients: [
      { key: 'vitaminC', label: 'Vitamin C', priority: 'high' },
      { key: 'vitaminK', label: 'Vitamin K', priority: 'high' },
    ],
  },
];

interface StandardClinicalTest {
  id: string;
  nutrientKey: string;
  label: string;
  unit: string;
  defThreshold: number;
  subOptimalThreshold: number;
  optimalMin: number;
  optimalMax: number;
  excessThreshold: number;
  hint: string;
  icon: string;
}

const STANDARD_TESTS: StandardClinicalTest[] = [
  {
    id: 'test_d3',
    nutrientKey: 'vitaminD',
    label: 'Serum 25-OH Vitamin D',
    unit: 'ng/mL',
    defThreshold: 20,
    subOptimalThreshold: 30,
    optimalMin: 30,
    optimalMax: 60,
    excessThreshold: 100,
    hint: 'Deficient < 20 • Insufficient 20–29.9 • Optimal 30–60',
    icon: '☀️',
  },
  {
    id: 'test_b12',
    nutrientKey: 'vitaminB12',
    label: 'Serum Vitamin B12',
    unit: 'pg/mL',
    defThreshold: 200,
    subOptimalThreshold: 400,
    optimalMin: 400,
    optimalMax: 900,
    excessThreshold: 1100,
    hint: 'Deficient < 200 • Borderline 200–399 • Optimal 400–900',
    icon: '🧬',
  },
  {
    id: 'test_ferritin',
    nutrientKey: 'iron',
    label: 'Serum Ferritin (Iron Storage)',
    unit: 'ng/mL',
    defThreshold: 15,
    subOptimalThreshold: 30,
    optimalMin: 30,
    optimalMax: 200,
    excessThreshold: 300,
    hint: 'Severe Deficient < 15 • Low < 30 • Optimal 30–200',
    icon: '🩸',
  },
  {
    id: 'test_hemoglobin',
    nutrientKey: 'iron',
    label: 'Hemoglobin (Hb)',
    unit: 'g/dL',
    defThreshold: 12.0,
    subOptimalThreshold: 13.5,
    optimalMin: 13.5,
    optimalMax: 17.5,
    excessThreshold: 18.5,
    hint: 'Anemia < 12 (F) / 13.5 (M) • Normal 12.5–17.5',
    icon: '🧪',
  },
  {
    id: 'test_calcium',
    nutrientKey: 'calcium',
    label: 'Serum Total Calcium',
    unit: 'mg/dL',
    defThreshold: 8.5,
    subOptimalThreshold: 8.8,
    optimalMin: 8.8,
    optimalMax: 10.2,
    excessThreshold: 10.6,
    hint: 'Low < 8.5 • Optimal 8.8–10.2 • High > 10.5',
    icon: '🦴',
  },
  {
    id: 'test_zinc',
    nutrientKey: 'zinc',
    label: 'Serum Zinc',
    unit: 'µg/dL',
    defThreshold: 70,
    subOptimalThreshold: 80,
    optimalMin: 80,
    optimalMax: 120,
    excessThreshold: 140,
    hint: 'Low < 70 • Optimal 80–120',
    icon: '🛡️',
  },
  {
    id: 'test_magnesium',
    nutrientKey: 'magnesium',
    label: 'Serum Magnesium',
    unit: 'mg/dL',
    defThreshold: 1.7,
    subOptimalThreshold: 1.9,
    optimalMin: 1.9,
    optimalMax: 2.3,
    excessThreshold: 2.6,
    hint: 'Low < 1.7 • Optimal 1.9–2.3',
    icon: '⚡',
  },
];

export function DeficiencyCheck({
  result,
  profile,
  onBack,
  onStartOnboarding,
  onAddMeal,
}: DeficiencyProps) {
  const [activeTab, setActiveTab] = useState<DeficiencyTab>('matrix');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'attention' | 'low' | 'met' | 'vitamins' | 'minerals'>('all');
  const [highlightNutrientKey, setHighlightNutrientKey] = useState<string | null>(null);

  // Standard lab inputs map
  const [standardLabValues, setStandardLabValues] = useState<Record<string, string>>({});
  // Custom lab list
  const [customLabEntries, setCustomLabEntries] = useState<LabEntry[]>([]);
  const [showAddCustomLab, setShowAddCustomLab] = useState(false);

  // Profile preferences (editable in-place if user hasn't completed onboarding or wants to simulate)
  const [localProfile, setLocalProfile] = useState({
    age: profile?.age || 28,
    gender: profile?.gender || 'male',
    diet: profile?.diet || 'veg',
    femaleState: profile?.femaleState || 'none',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const donutRef = useRef<HTMLDivElement>(null);

  const notifyToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Toggle symptom selection
  const handleToggleSymptom = (symptomId: string) => {
    const isAdding = !selectedSymptoms.includes(symptomId);
    playChecklistSound(isAdding);
    setSelectedSymptoms((prev) =>
      isAdding ? [...prev, symptomId] : prev.filter((id) => id !== symptomId)
    );
  };

  // Calculate RDI & micronutrient status
  const micros = useMemo(
    () => rdiTable(localProfile.age, localProfile.gender as any, localProfile.femaleState),
    [localProfile.age, localProfile.gender, localProfile.femaleState]
  );

  const estimatedIntake = useMemo(() => {
    return result ? result.estimatedMicroIntake : estimateMicroIntake([]);
  }, [result]);

  // Evaluate lab values for nutrient status override
  const labStatusOverrides = useMemo(() => {
    const overrides: Record<string, { status: DeficiencyStatus; reason: string; labelVal: string }> = {};

    // Standard clinical tests
    STANDARD_TESTS.forEach((test) => {
      const rawVal = standardLabValues[test.id];
      if (!rawVal) return;
      const num = parseFloat(rawVal);
      if (isNaN(num)) return;

      if (num < test.defThreshold) {
        overrides[test.nutrientKey] = {
          status: 'attention',
          reason: `Clinical lab test "${test.label}" is ${num} ${test.unit} (Clinical Deficiency threshold: < ${test.defThreshold} ${test.unit}).`,
          labelVal: `${num} ${test.unit} (Deficient)`,
        };
      } else if (num < test.subOptimalThreshold) {
        overrides[test.nutrientKey] = {
          status: 'low',
          reason: `Clinical lab test "${test.label}" is ${num} ${test.unit} (Borderline/sub-optimal range).`,
          labelVal: `${num} ${test.unit} (Borderline)`,
        };
      } else if (num >= test.optimalMin && num <= test.optimalMax) {
        overrides[test.nutrientKey] = {
          status: 'met',
          reason: `Clinical lab test "${test.label}" is ${num} ${test.unit} (Within optimal physiological range).`,
          labelVal: `${num} ${test.unit} (Optimal)`,
        };
      }
    });

    // Custom lab values
    customLabEntries.forEach((entry) => {
      if (!entry.test || !entry.value || !entry.refLow || !entry.refHigh) return;
      const val = parseFloat(entry.value);
      const low = parseFloat(entry.refLow);
      const high = parseFloat(entry.refHigh);
      if (isNaN(val) || isNaN(low) || isNaN(high)) return;

      const matchedNutrient = nutrientInfo.find(
        (n) =>
          entry.test.toLowerCase().includes(n.label.toLowerCase()) ||
          entry.test.toLowerCase().includes(n.key.toLowerCase())
      );

      if (matchedNutrient) {
        if (val < low) {
          overrides[matchedNutrient.key] = {
            status: 'attention',
            reason: `Custom lab report "${entry.test}" is ${val} ${entry.unit} (Below reference low: ${low}).`,
            labelVal: `${val} ${entry.unit} (Below Ref)`,
          };
        } else if (val > high) {
          overrides[matchedNutrient.key] = {
            status: 'professional',
            reason: `Custom lab report "${entry.test}" is ${val} ${entry.unit} (Above reference high: ${high}).`,
            labelVal: `${val} ${entry.unit} (Elevated)`,
          };
        }
      }
    });

    return overrides;
  }, [standardLabValues, customLabEntries]);

  // Aggregate suspected nutrients from selected symptoms
  const symptomRiskMap = useMemo(() => {
    const scores: Record<string, { count: number; highCount: number; symptomTitles: string[] }> = {};

    selectedSymptoms.forEach((symId) => {
      const sym = SYMPTOM_CATALOG.find((s) => s.id === symId);
      if (!sym) return;

      sym.suspectedNutrients.forEach((nut) => {
        if (!scores[nut.key]) {
          scores[nut.key] = { count: 0, highCount: 0, symptomTitles: [] };
        }
        scores[nut.key].count += nut.priority === 'high' ? 2 : 1;
        if (nut.priority === 'high') scores[nut.key].highCount += 1;
        scores[nut.key].symptomTitles.push(sym.title);
      });
    });

    return scores;
  }, [selectedSymptoms]);

  // Build 16-nutrient results matrix
  const nutrientResults: (DeficiencyResult & {
    symptomRisk?: { count: number; highCount: number; symptomTitles: string[] };
    labEvidence?: string;
  })[] = useMemo(() => {
    return nutrientInfo.map((nutrient) => {
      const rdi = micros[nutrient.key as keyof typeof micros] || 1;
      const intake = estimatedIntake[nutrient.key] || 0;
      let status = getDeficiencyStatus(intake, rdi);
      let reason = '';

      if (intake === 0) {
        reason = `No direct dietary intake logged for ${nutrient.label}. Estimated based on standard nutritional density.`;
      } else {
        const pct = Math.round((intake / rdi) * 100);
        reason = `Estimated intake: ${Math.round(intake)} ${nutrient.unit} (${pct}% of target ${rdi} ${nutrient.unit}).`;
      }

      // Check lab overrides
      const labOverride = labStatusOverrides[nutrient.key];
      if (labOverride) {
        status = labOverride.status;
        reason = `${labOverride.reason} [Intake: ${Math.round(intake)}/${rdi} ${nutrient.unit}]`;
      }

      // Check symptom correlation
      const symRisk = symptomRiskMap[nutrient.key];
      if (symRisk && symRisk.highCount >= 2 && status === 'met') {
        // High physical symptom count flags potential functional deficiency even if theoretical intake meets RDI
        reason += ` Physical screening detected multiple symptoms matching ${nutrient.label} inadequacy.`;
      }

      const foodSources = deficiencyFoodSources[nutrient.key] || [];

      return {
        nutrient: nutrient.key,
        label: nutrient.label,
        unit: nutrient.unit,
        rdi,
        estimatedIntake: intake,
        status,
        statusLabel: getStatusLabel(status),
        statusColor: getStatusColor(status),
        reason,
        foodSources,
        note: nutrient.desc,
        symptomRisk: symRisk,
        labEvidence: labOverride?.labelVal,
      };
    });
  }, [micros, estimatedIntake, labStatusOverrides, symptomRiskMap]);

  // Filter nutrient matrix
  const filteredNutrients = useMemo(() => {
    let list = [...nutrientResults];

    if (activeFilter === 'attention') {
      list = list.filter((r) => r.status === 'attention' || r.status === 'professional');
    } else if (activeFilter === 'low') {
      list = list.filter((r) => r.status === 'low');
    } else if (activeFilter === 'met') {
      list = list.filter((r) => r.status === 'met');
    } else if (activeFilter === 'vitamins') {
      list = list.filter((r) => {
        const meta = nutrientInfo.find((n) => n.key === r.nutrient);
        return meta?.category === 'vitamin';
      });
    } else if (activeFilter === 'minerals') {
      list = list.filter((r) => {
        const meta = nutrientInfo.find((n) => n.key === r.nutrient);
        return meta?.category === 'mineral';
      });
    }

    // Sort order: Attention first, then Low, then Insufficient Data, then Met
    const order: Record<DeficiencyStatus, number> = {
      attention: 0,
      professional: 1,
      low: 2,
      'insufficient-data': 3,
      met: 4,
    };
    return list.sort((a, b) => (order[a.status] ?? 5) - (order[b.status] ?? 5));
  }, [nutrientResults, activeFilter]);

  // Overall status counts
  const statusCounts = useMemo(() => {
    return nutrientResults.reduce(
      (acc, r) => {
        const key = r.status === 'professional' ? 'attention' : r.status;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [nutrientResults]);

  const statusSegments = [
    { label: 'Met', value: statusCounts.met || 0, color: '#10b981' },
    { label: 'Low', value: statusCounts.low || 0, color: '#f59e0b' },
    { label: 'Attention', value: statusCounts.attention || 0, color: '#ef4444' },
    { label: 'Insufficient Data', value: statusCounts['insufficient-data'] || 0, color: '#0ea5e9' },
  ].filter((s) => s.value > 0);

  // Focus on a specific nutrient from another tab
  const handleInspectNutrient = (key: string) => {
    setHighlightNutrientKey(key);
    setActiveTab('matrix');
    setActiveFilter('all');
    setTimeout(() => {
      const el = document.getElementById(`nutrient-card-${key}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  const handleTabSwitch = (tab: DeficiencyTab) => {
    playChecklistSound(true);
    setActiveTab(tab);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-stone-50/50 dark:bg-[#16171b] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Beginner Guide Banner answering the 3 core questions */}
        <BeginnerGuideBanner
          screenTitle="Vitamins & Minerals Health Check"
          whatAmILookingAt="A friendly check to see if your meals provide enough essential vitamins and minerals (like Iron, Vitamin D, Vitamin B12, and Calcium) to keep your energy high and body healthy."
          whatShouldIDo="Browse the 'Daily Vitamins' list below to spot any gaps, or tap '🩺 How You Feel' to check common symptoms like tiredness, brittle nails, or brain fog."
          whatHappensWhenIPress="Tapping on any vitamin shows real grocery foods (like spinach, lentils, eggs, or oranges) that quickly top up your levels."
          primaryAction={{
            label: '🩺 Check Common Symptoms',
            onClick: () => handleTabSwitch('symptoms'),
            caption: 'Find which vitamins you might need based on how you feel',
          }}
        />

        {/* Top Header & Navigation Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1f2128] p-6 sm:p-8 rounded-3xl border border-stone-200/80 dark:border-[#2e313b] shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              title="Return to previous screen"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-stone-900 dark:text-white tracking-tight">
                  Vitamins & Minerals Health Check
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Zero Guesswork
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
                Check if your diet provides enough essential vitamins and minerals, and find simple whole foods to fill any gaps.
              </p>
            </div>
          </div>

          {/* Quick Profile Parameters Badge */}
          <div className="flex items-center gap-2 sm:self-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800/80 text-xs font-semibold text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
              <User className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>{localProfile.age}y</span>
              <span>•</span>
              <span className="capitalize">{localProfile.gender}</span>
              <span>•</span>
              <span className="capitalize">{localProfile.diet}</span>
            </div>
          </div>
        </div>

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 dark:bg-emerald-950/60 border border-emerald-500/40 text-sm text-emerald-800 dark:text-emerald-200 font-bold flex items-center justify-between gap-3 animate-fade-in shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-xs text-emerald-600 hover:underline font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 5-Tab Main Navigation Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-stone-200/60 dark:bg-[#1e2027] p-2 rounded-2xl border border-stone-200 dark:border-[#2f323c]">
          <button
            onClick={() => handleTabSwitch('matrix')}
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'matrix'
                ? 'bg-white dark:bg-[#282b36] text-brand-700 dark:text-brand-300 shadow-md border border-stone-200 dark:border-stone-700 scale-[1.01]'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Dna className="w-4 h-4 text-brand-500" />
            <span>🥗 Daily Vitamins</span>
            {statusCounts.attention > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-red-500 text-white">
                {statusCounts.attention}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabSwitch('symptoms')}
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'symptoms'
                ? 'bg-white dark:bg-[#282b36] text-brand-700 dark:text-brand-300 shadow-md border border-stone-200 dark:border-stone-700 scale-[1.01]'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <HeartPulse className="w-4 h-4 text-rose-500" />
            <span>🩺 How You Feel</span>
            {selectedSymptoms.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                {selectedSymptoms.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabSwitch('labs')}
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'labs'
                ? 'bg-white dark:bg-[#282b36] text-brand-700 dark:text-brand-300 shadow-md border border-stone-200 dark:border-stone-700 scale-[1.01]'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <FlaskConical className="w-4 h-4 text-sky-500" />
            <span>🧪 Blood Tests</span>
            {Object.keys(standardLabValues).filter((k) => standardLabValues[k]).length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-sky-500 text-white">
                {Object.keys(standardLabValues).filter((k) => standardLabValues[k]).length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabSwitch('dietary')}
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'dietary'
                ? 'bg-white dark:bg-[#282b36] text-brand-700 dark:text-brand-300 shadow-md border border-stone-200 dark:border-stone-700 scale-[1.01]'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Salad className="w-4 h-4 text-emerald-500" />
            <span>🥑 Foods That Help</span>
          </button>

          <button
            onClick={() => handleTabSwitch('report')}
            className={`col-span-2 md:col-span-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'report'
                ? 'bg-white dark:bg-[#282b36] text-brand-700 dark:text-brand-300 shadow-md border border-stone-200 dark:border-stone-700 scale-[1.01]'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Printer className="w-4 h-4 text-amber-500" />
            <span>📄 Health Summary</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: INTAKE VS RDI MATRIX & REMEDIES                                    */}
        {/* ========================================================================= */}
        {activeTab === 'matrix' && (
          <div className="space-y-6 animate-fade-in">
            {/* Overview Donut & Metric Cards */}
            <div
              className="card-lg p-6 bg-white dark:bg-[#1e2027] border border-stone-200 dark:border-[#2f323c] rounded-3xl"
              ref={donutRef}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display font-bold text-lg sm:text-xl text-stone-900 dark:text-white">
                    Overall Micronutrient Sufficiency
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Comparing daily dietary intake against national RDI benchmarks (ICMR-NIN & NIH ODS).
                  </p>
                </div>
                <DownloadMenu
                  targetRef={donutRef}
                  filename="nutrient-sufficiency-overview"
                  title="Nutrient Sufficiency Overview"
                />
              </div>

              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <DonutChart
                    segments={statusSegments}
                    size={150}
                    centerValue={String(nutrientResults.length)}
                    centerUnit="Nutrients"
                  />
                </div>

                <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 p-3.5 text-center border border-emerald-200/60 dark:border-emerald-800/40">
                    <div className="metric-value text-2xl text-emerald-700 dark:text-emerald-300 font-extrabold">
                      {statusCounts.met || 0}
                    </div>
                    <div className="text-xs text-stone-600 dark:text-stone-400 font-semibold mt-1">
                      Target Met
                    </div>
                  </div>

                  <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 p-3.5 text-center border border-amber-200/60 dark:border-amber-800/40">
                    <div className="metric-value text-2xl text-amber-700 dark:text-amber-300 font-extrabold">
                      {statusCounts.low || 0}
                    </div>
                    <div className="text-xs text-stone-600 dark:text-stone-400 font-semibold mt-1">
                      Potential Low
                    </div>
                  </div>

                  <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 p-3.5 text-center border border-rose-200/60 dark:border-rose-800/40">
                    <div className="metric-value text-2xl text-rose-700 dark:text-rose-300 font-extrabold">
                      {statusCounts.attention || 0}
                    </div>
                    <div className="text-xs text-stone-600 dark:text-stone-400 font-semibold mt-1">
                      Attention Needed
                    </div>
                  </div>

                  <div className="rounded-2xl bg-sky-50 dark:bg-sky-950/40 p-3.5 text-center border border-sky-200/60 dark:border-sky-800/40">
                    <div className="metric-value text-2xl text-sky-700 dark:text-sky-300 font-extrabold">
                      {statusCounts['insufficient-data'] || 0}
                    </div>
                    <div className="text-xs text-stone-600 dark:text-stone-400 font-semibold mt-1">
                      Insufficient Data
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeFilter === 'all'
                      ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-sm'
                      : 'bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700'
                  }`}
                >
                  All (16)
                </button>
                <button
                  onClick={() => setActiveFilter('attention')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeFilter === 'attention'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700'
                  }`}
                >
                  🚨 Attention Needed ({statusCounts.attention || 0})
                </button>
                <button
                  onClick={() => setActiveFilter('low')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeFilter === 'low'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700'
                  }`}
                >
                  ⚡ Potential Low ({statusCounts.low || 0})
                </button>
                <button
                  onClick={() => setActiveFilter('met')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeFilter === 'met'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700'
                  }`}
                >
                  ✅ Met ({statusCounts.met || 0})
                </button>
                <button
                  onClick={() => setActiveFilter('vitamins')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeFilter === 'vitamins'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700'
                  }`}
                >
                  Vitamins
                </button>
                <button
                  onClick={() => setActiveFilter('minerals')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeFilter === 'minerals'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700'
                  }`}
                >
                  Minerals
                </button>
              </div>

              <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                Showing {filteredNutrients.length} nutrients
              </div>
            </div>

            {/* Nutrient Results List */}
            <div className="space-y-4">
              {filteredNutrients.map((item) => (
                <NutrientResultCard
                  key={item.nutrient}
                  result={item}
                  onAddMeal={onAddMeal}
                  onNotifyToast={notifyToast}
                  isHighlighted={highlightNutrientKey === item.nutrient}
                  userDiet={localProfile.diet}
                  goalContext={
                    result && profile
                      ? {
                          goal: profile.goal,
                          tdee: result.tdee,
                          proteinG: result.proteinG,
                          carbG: result.carbG,
                          fatG: result.fatG,
                          fiberG: result.fiberG,
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PHYSICAL SYMPTOM SCREENER                                          */}
        {/* ========================================================================= */}
        {activeTab === 'symptoms' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header info card */}
            <div className="card-lg p-6 bg-white dark:bg-[#1e2027] border border-stone-200 dark:border-[#2f323c] rounded-3xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-5 h-5 text-rose-500" />
                    <h2 className="font-display font-bold text-xl text-stone-900 dark:text-white">
                      Physical Health & Symptom Audit
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
                    Select any physical symptoms you have experienced over the past 30 days. The diagnostic engine maps them to clinically documented micronutrient deficiencies.
                  </p>
                </div>

                {selectedSymptoms.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedSymptoms([]);
                      playChecklistSound(false);
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Dynamic Real-Time Suspected Nutrients Banner */}
              {selectedSymptoms.length > 0 ? (
                <div className="mt-5 p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      Suspected Inadequacies Based on Your {selectedSymptoms.length} Selected Symptom{selectedSymptoms.length === 1 ? '' : 's'}:
                    </span>
                    <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                      Click any tag to inspect in Matrix
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(symptomRiskMap)
                      .sort((a, b) => b[1].count - a[1].count)
                      .map(([nutKey, data]) => {
                        const nut = nutrientInfo.find((n) => n.key === nutKey);
                        return (
                          <button
                            key={nutKey}
                            onClick={() => handleInspectNutrient(nutKey)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1a1c24] text-stone-800 dark:text-stone-100 border border-rose-300 dark:border-rose-800/80 hover:border-brand-500 text-xs font-bold shadow-sm transition-all group"
                          >
                            <span>{nut?.label || nutKey}</span>
                            <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] font-black">
                              {data.highCount > 0 ? 'High Risk' : 'Moderate'}
                            </span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-brand-500 transition-colors" />
                          </button>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-3 rounded-2xl bg-stone-100/70 dark:bg-[#181920] text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2">
                  <Info className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  <span>Click on any symptom cards below to reveal suspected nutrient correlations.</span>
                </div>
              )}
            </div>

            {/* Symptom Grid by Biological Systems */}
            <div className="space-y-6">
              {[
                { system: 'energy', label: '⚡ Fatigue, Cognition & Mood' },
                { system: 'hair_skin', label: '💇 Hair, Skin, Nails & Tissue' },
                { system: 'muscle', label: '🦵 Muscles, Bones & Joint Function' },
                { system: 'neuro', label: '🧠 Neurological & Sensory Signals' },
                { system: 'immunity', label: '🛡️ Immunity, Gums & Oral Health' },
              ].map(({ system, label }) => {
                const groupSymptoms = SYMPTOM_CATALOG.filter((s) => s.system === system);
                return (
                  <div key={system} className="space-y-3">
                    <h3 className="font-display font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                      <span>{label}</span>
                    </h3>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {groupSymptoms.map((sym) => {
                        const isSelected = selectedSymptoms.includes(sym.id);
                        return (
                          <div
                            key={sym.id}
                            onClick={() => handleToggleSymptom(sym.id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer select-none text-left flex flex-col justify-between ${
                              isSelected
                                ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-400 dark:border-rose-700 shadow-md ring-2 ring-rose-500/20'
                                : 'bg-white dark:bg-[#1e2027] border-stone-200 dark:border-[#2f323c] hover:border-rose-300 dark:hover:border-stone-700'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-stone-100 text-sm">
                                  <span className="text-base">{sym.icon}</span>
                                  <span>{sym.title}</span>
                                </div>
                                <div
                                  className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                                    isSelected
                                      ? 'bg-rose-600 text-white'
                                      : 'border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                              </div>
                              <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
                                {sym.description}
                              </p>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800/80 flex flex-wrap gap-1">
                              {sym.suspectedNutrients.map((n) => (
                                <span
                                  key={n.key}
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                    isSelected
                                      ? 'bg-rose-200/60 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200'
                                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                                  }`}
                                >
                                  {n.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PATHOLOGY BLOOD LABS                                              */}
        {/* ========================================================================= */}
        {activeTab === 'labs' && (
          <div className="space-y-6 animate-fade-in">
            {/* Clinical Overview Intro */}
            <div className="card-lg p-6 bg-white dark:bg-[#1e2027] border border-stone-200 dark:border-[#2f323c] rounded-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl text-stone-900 dark:text-white">
                    Pathology Laboratory Analyzer
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Input your blood test report values. Real clinical lab results take precedence over dietary intake estimations.
                  </p>
                </div>
              </div>
            </div>

            {/* Standard Clinical Tests Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {STANDARD_TESTS.map((test) => {
                const currentVal = standardLabValues[test.id] || '';
                const num = parseFloat(currentVal);
                const hasValue = !isNaN(num);

                let badgeColor = 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400';
                let statusLabel = 'Enter value';
                if (hasValue) {
                  if (num < test.defThreshold) {
                    badgeColor = 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30';
                    statusLabel = 'Deficient 🚨';
                  } else if (num < test.subOptimalThreshold) {
                    badgeColor = 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30';
                    statusLabel = 'Sub-optimal ⚠️';
                  } else if (num >= test.optimalMin && num <= test.optimalMax) {
                    badgeColor = 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30';
                    statusLabel = 'Optimal ✅';
                  } else if (num > test.optimalMax) {
                    badgeColor = 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30';
                    statusLabel = 'Elevated 🟣';
                  }
                }

                return (
                  <div
                    key={test.id}
                    className="p-5 rounded-3xl bg-white dark:bg-[#1e2027] border border-stone-200 dark:border-[#2f323c] shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>{test.icon}</span>
                            <span className="font-bold text-sm text-stone-900 dark:text-white">
                              {test.label}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-400 font-medium">{test.hint}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
                          {statusLabel}
                        </span>
                      </div>

                      {/* Value Input */}
                      <div className="mt-4 flex items-center gap-2">
                        <input
                          type="number"
                          step="any"
                          placeholder="e.g. 25"
                          value={currentVal}
                          onChange={(e) =>
                            setStandardLabValues((prev) => ({
                              ...prev,
                              [test.id]: e.target.value,
                            }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#16171b] border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <span className="text-xs font-semibold text-stone-500 flex-shrink-0">
                          {test.unit}
                        </span>
                      </div>
                    </div>

                    {hasValue && (
                      <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                        <span className="text-stone-500">Linked Nutrient:</span>
                        <button
                          onClick={() => handleInspectNutrient(test.nutrientKey)}
                          className="text-brand-600 dark:text-brand-400 font-bold hover:underline flex items-center gap-1"
                        >
                          <span>Inspect Remedy</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Custom Lab Entries Section */}
            <div className="card-lg p-6 bg-white dark:bg-[#1e2027] border border-stone-200 dark:border-[#2f323c] rounded-3xl">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div>
                  <h3 className="font-display font-bold text-base text-stone-900 dark:text-white">
                    Custom Pathology Tests
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Add other biomarkers from your blood report (e.g. Total Iron Binding Capacity, Folate, Homocysteine).
                  </p>
                </div>
                <button
                  onClick={() =>
                    setCustomLabEntries((prev) => [
                      ...prev,
                      { test: '', value: '', unit: '', refLow: '', refHigh: '' },
                    ])
                  }
                  className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Test</span>
                </button>
              </div>

              {customLabEntries.length === 0 ? (
                <div className="py-6 text-center text-xs text-stone-400 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl">
                  No custom lab tests added yet. Click &ldquo;Add Custom Test&rdquo; to input additional laboratory parameters.
                </div>
              ) : (
                <div className="space-y-3">
                  {customLabEntries.map((entry, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-stone-50 dark:bg-[#16171b] border border-stone-200 dark:border-stone-800 grid grid-cols-2 sm:grid-cols-5 gap-2 items-center"
                    >
                      <input
                        placeholder="Test Name (e.g. Folate)"
                        value={entry.test}
                        onChange={(e) => {
                          const updated = [...customLabEntries];
                          updated[idx].test = e.target.value;
                          setCustomLabEntries(updated);
                        }}
                        className="input-field text-xs py-2"
                      />
                      <input
                        placeholder="Value (e.g. 4.2)"
                        value={entry.value}
                        onChange={(e) => {
                          const updated = [...customLabEntries];
                          updated[idx].value = e.target.value;
                          setCustomLabEntries(updated);
                        }}
                        className="input-field text-xs py-2"
                      />
                      <input
                        placeholder="Unit (e.g. ng/mL)"
                        value={entry.unit}
                        onChange={(e) => {
                          const updated = [...customLabEntries];
                          updated[idx].unit = e.target.value;
                          setCustomLabEntries(updated);
                        }}
                        className="input-field text-xs py-2"
                      />
                      <div className="flex gap-1">
                        <input
                          placeholder="Ref Low"
                          value={entry.refLow}
                          onChange={(e) => {
                            const updated = [...customLabEntries];
                            updated[idx].refLow = e.target.value;
                            setCustomLabEntries(updated);
                          }}
                          className="input-field text-xs py-2"
                        />
                        <input
                          placeholder="Ref High"
                          value={entry.refHigh}
                          onChange={(e) => {
                            const updated = [...customLabEntries];
                            updated[idx].refHigh = e.target.value;
                            setCustomLabEntries(updated);
                          }}
                          className="input-field text-xs py-2"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() =>
                            setCustomLabEntries(customLabEntries.filter((_, i) => i !== idx))
                          }
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                          title="Remove test"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: DIETARY VULNERABILITIES & BIOAVAILABILITY GUIDE                     */}
        {/* ========================================================================= */}
        {activeTab === 'dietary' && (
          <div className="space-y-6 animate-fade-in">
            {/* Diet Pattern Selector */}
            <div className="card-lg p-6 bg-white dark:bg-[#1e2027] border border-stone-200 dark:border-[#2f323c] rounded-3xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-display font-bold text-xl text-stone-900 dark:text-white">
                    Dietary Pattern Vulnerability Audit
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
                    Every dietary lifestyle has unique nutritional blind spots. Select your pattern to examine biochemical risks and absorption rules.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl border border-stone-200 dark:border-stone-700">
                  {(['vegan', 'veg', 'eggetarian', 'nonveg'] as const).map((dietKey) => (
                    <button
                      key={dietKey}
                      onClick={() => setLocalProfile((p) => ({ ...p, diet: dietKey }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                        localProfile.diet === dietKey
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      {dietKey}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specific Vulnerabilities for Selected Diet */}
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                {localProfile.diet === 'vegan' && (
                  <>
                    <DietVulnerabilityCard
                      level="critical"
                      title="Vitamin B12 Inadequacy"
                      desc="Plant foods contain zero bioavailable B12. Without fortified foods or cyanocobalamin supplementation, stores deplete over 1-3 years leading to elevated homocysteine and neuropathy."
                      remedy="Fortified plant milk, nutritional yeast, or a dedicated 500-1000 µg methylcobalamin weekly supplement."
                    />
                    <DietVulnerabilityCard
                      level="high"
                      title="Vitamin D3 Synthesis"
                      desc="Most dietary D3 comes from animal products. Plant sources only yield D2 (ergocalciferol) which has lower half-life bio-efficacy."
                      remedy="Daily 15-20 min midday sun exposure or lichen-derived vegan D3 (1000-2000 IU/day)."
                    />
                    <DietVulnerabilityCard
                      level="moderate"
                      title="Non-Heme Iron Absorption (Phytate Binding)"
                      desc="Legumes and grains contain phytic acid which chelates iron, reducing absorption by 50-80% compared to heme iron."
                      remedy="Soak beans 12 hours, sprout seeds, and always squeeze fresh lemon (Vitamin C) over lentils."
                    />
                    <DietVulnerabilityCard
                      level="moderate"
                      title="Omega-3 DHA / EPA Deficit"
                      desc="Plant ALA (flax, chia, walnuts) converts to active DHA/EPA at only a 2-5% biological conversion rate."
                      remedy="Incorporate microalgae oil supplements or 2 tbsp ground flaxseed/chia pudding daily."
                    />
                  </>
                )}

                {localProfile.diet === 'veg' && (
                  <>
                    <DietVulnerabilityCard
                      level="high"
                      title="Vitamin B12 Sub-Clinical Deficiency"
                      desc="Although milk, curd, and paneer contain B12, typical vegetarian portion sizes rarely supply the 2.4 µg daily requirement."
                      remedy="Ensure 3 servings of fermented dairy (curd/yogurt) or take a low-dose B-complex twice weekly."
                    />
                    <DietVulnerabilityCard
                      level="high"
                      title="Vitamin D3 Scarcity"
                      desc="Unfortified milk in many regions contains negligible Vitamin D, making sunlight or supplementation necessary."
                      remedy="Look for fortified milk brands or take cholecalciferol 60,000 IU monthly."
                    />
                    <DietVulnerabilityCard
                      level="moderate"
                      title="Bioavailable Zinc & Iron"
                      desc="High phytate intake from whole wheat rotis and unfermented pulses competes with zinc and iron transporters."
                      remedy="Sprouted moong dal, roasted pumpkin seeds (pepitas), and pairing meals with citrus salads."
                    />
                    <DietVulnerabilityCard
                      level="low"
                      title="Protein Quality (Leucine Content)"
                      desc="Plant proteins are rich but require pairing (cereal + pulse) for complete amino acid scoring and optimal muscle synthesis."
                      remedy="Pair dal with rice or paneer with roti to create complete amino acid profiles."
                    />
                  </>
                )}

                {localProfile.diet === 'eggetarian' && (
                  <>
                    <DietVulnerabilityCard
                      level="moderate"
                      title="Vitamin D3 Sufficiency"
                      desc="While egg yolks contain Vitamin D, one yolk only provides 35-45 IU (~6% of the 600 IU RDI)."
                      remedy="Combine eggs with mushrooms exposed to UV light and sunlight exposure."
                    />
                    <DietVulnerabilityCard
                      level="moderate"
                      title="Calcium Intake (If Low Dairy)"
                      desc="Eggs provide virtually no calcium (the calcium is in the shell). If dairy is minimized, calcium needs must be watched."
                      remedy="Ragi porridge, white sesame seeds (til laddoos), and dark leafy greens."
                    />
                    <DietVulnerabilityCard
                      level="low"
                      title="High Choline & Lutein Benefit"
                      desc="Eggs provide exceptional bioavailability for choline (brain membrane health) and lutein for retinal protection."
                      remedy="Enjoy whole eggs rather than egg whites alone to retain these fat-soluble micronutrients."
                    />
                  </>
                )}

                {localProfile.diet === 'nonveg' && (
                  <>
                    <DietVulnerabilityCard
                      level="high"
                      title="Dietary Fiber Gap"
                      desc="Modern non-vegetarian diets frequently displace dietary fiber (RDI: 25-38g), predisposing to dysbiosis and elevated LDL."
                      remedy="Add half-plate vegetables, oats, whole legumes (rajma/chana), and psyllium husk."
                    />
                    <DietVulnerabilityCard
                      level="moderate"
                      title="Magnesium & Potassium Depletion"
                      desc="Muscle meats contain high phosphorus and sodium relative to potassium and magnesium."
                      remedy="Increase spinach, pumpkin seeds, coconut water, and bananas."
                    />
                    <DietVulnerabilityCard
                      level="low"
                      title="Excellent Heme Iron & B12 Status"
                      desc="Meat and fish provide high bioavailability heme iron (Fe2+) and intrinsic factor B12."
                      remedy="Focus on wild-caught fish (salmon, sardines) for anti-inflammatory omega-3 EPA/DHA."
                    />
                  </>
                )}
              </div>
            </div>

            {/* Clinical Bio-availability Synergy Rules */}
            <div className="card-lg p-6 bg-white dark:bg-[#1e2027] border border-stone-200 dark:border-[#2f323c] rounded-3xl">
              <h3 className="font-display font-bold text-lg text-stone-900 dark:text-white mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span>Nutrient Synergy & Absorption Protocols</span>
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
                Nutrients interact biochemically. Follow these synergistic pairs to multiply biological bioavailability.
              </p>

              <div className="grid md:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                  <div className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <span>🍋</span>
                    <span>Iron + Vitamin C Booster</span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-1.5 leading-relaxed">
                    Ascorbic acid converts ferric iron (Fe3+) to soluble ferrous iron (Fe2+), boosting non-heme plant iron absorption by up to <strong>300%</strong>. Squeeze lemon over your spinach/dal!
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                  <div className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <span>🥛</span>
                    <span>Vitamin D + Calcium Synergy</span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-1.5 leading-relaxed">
                    Active Vitamin D (Calcitriol) stimulates the intestinal calbindin protein required to transport calcium into bloodstream. Taking calcium without adequate Vitamin D wastes up to 70% of intake.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25">
                  <div className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <span>☕</span>
                    <span>The 60-Minute Tea/Coffee Rule</span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-1.5 leading-relaxed">
                    Tannins, polyphenols, and phytates form insoluble complexes with iron and zinc. Avoid drinking black tea, green tea, or coffee within <strong>60 minutes</strong> before or after main meals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: CLINICAL SUMMARY & PRINTABLE REPORT                                */}
        {/* ========================================================================= */}
        {activeTab === 'report' && (
          <div className="space-y-6 animate-fade-in">
            <div className="card-lg p-6 sm:p-8 bg-white dark:bg-[#1e2027] border border-stone-200 dark:border-[#2f323c] rounded-3xl print:p-0 print:border-none print:shadow-none">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo.jpg"
                    alt="NutriSynth"
                    className="w-12 h-12 rounded-2xl object-cover shadow-md ring-1 ring-brand-500/20"
                  />
                  <div>
                    <h2 className="font-display font-extrabold text-xl sm:text-2xl text-stone-900 dark:text-white">
                      NutriSynth Clinical Deficiency Summary
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Generated on {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 print:hidden">
                  <button
                    onClick={() => {
                      playCongratsSound();
                      window.print();
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white dark:bg-white dark:text-stone-900 text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Report</span>
                  </button>
                </div>
              </div>

              {/* Patient / User Demographics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-5 border-b border-stone-100 dark:border-stone-800 text-xs">
                <div>
                  <span className="text-stone-400 block font-medium">Age & Gender:</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200 text-sm">
                    {localProfile.age} yrs • {localProfile.gender}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block font-medium">Dietary Lifestyle:</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200 text-sm capitalize">
                    {localProfile.diet}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block font-medium">Symptoms Checked:</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200 text-sm">
                    {selectedSymptoms.length} Reported
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block font-medium">Overall Attention Items:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
                    {statusCounts.attention || 0} Critical / Low
                  </span>
                </div>
              </div>

              {/* Priority Attention Findings */}
              <div className="py-5 space-y-3">
                <h3 className="font-bold text-sm text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Key Clinical Findings & Action Items</span>
                </h3>

                <div className="space-y-2.5">
                  {nutrientResults
                    .filter((r) => r.status === 'attention' || r.status === 'low' || (r.symptomRisk && r.symptomRisk.count >= 2))
                    .map((item) => (
                      <div
                        key={item.nutrient}
                        className="p-3.5 rounded-2xl bg-stone-50 dark:bg-[#16171b] border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-stone-900 dark:text-white">
                              {item.label}
                            </span>
                            <span
                              className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                                item.status === 'attention'
                                  ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                                  : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {item.statusLabel}
                            </span>
                          </div>
                          <p className="text-stone-500 dark:text-stone-400 mt-1">{item.reason}</p>
                        </div>

                        <div className="sm:text-right flex-shrink-0">
                          <span className="text-stone-400 block text-[11px]">Recommended Dietary Fixes:</span>
                          <span className="font-semibold text-brand-600 dark:text-brand-400">
                            {item.foodSources.slice(0, 3).join(', ')}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Clinical Medical Disclaimer */}
              <div className="mt-4 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong>Medical Notice:</strong> This summary provides algorithmically estimated screening indicators and does not replace diagnostic blood pathology or medical advice. Please share this document with your general physician or licensed clinical dietitian before commencing high-dose therapeutic supplementation.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-component: Diet Vulnerability Card
function DietVulnerabilityCard({
  level,
  title,
  desc,
  remedy,
}: {
  level: 'critical' | 'high' | 'moderate' | 'low';
  title: string;
  desc: string;
  remedy: string;
}) {
  const badgeStyle = {
    critical: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40',
    high: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40',
    moderate: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/40',
    low: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
  }[level];

  return (
    <div className="p-4 rounded-2xl bg-stone-50/80 dark:bg-[#17181f] border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-bold text-sm text-stone-900 dark:text-stone-100">{title}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${badgeStyle}`}>
            {level}
          </span>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{desc}</p>
      </div>
      <div className="mt-3 pt-2.5 border-t border-stone-200/50 dark:border-stone-800/80 text-xs">
        <span className="font-bold text-emerald-700 dark:text-emerald-400">Dietary Fix: </span>
        <span className="text-stone-600 dark:text-stone-300">{remedy}</span>
      </div>
    </div>
  );
}

// Sub-component: Nutrient Result Card with 1-Click Food Logging
function NutrientResultCard({
  result,
  onAddMeal,
  onNotifyToast,
  isHighlighted,
  userDiet,
  goalContext,
}: {
  result: DeficiencyResult & {
    symptomRisk?: { count: number; highCount: number; symptomTitles: string[] };
    labEvidence?: string;
  };
  onAddMeal?: (meal: MealItem) => void;
  onNotifyToast: (msg: string) => void;
  isHighlighted?: boolean;
  userDiet: string;
  goalContext?: GoalContext;
}) {
  const [tickedFoods, setTickedFoods] = useState<Record<string, boolean>>({});

  const statusIcon = {
    met: CheckCircle2,
    low: AlertTriangle,
    attention: AlertCircle,
    'insufficient-data': Info,
    professional: AlertCircle,
  };

  const statusColorClass = {
    met: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800',
    low: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800',
    attention: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800',
    'insufficient-data': 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800',
    professional: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800',
  };

  const Icon = statusIcon[result.status];
  const colorClass = statusColorClass[result.status];

  const pct = Math.min(200, Math.round((result.estimatedIntake / result.rdi) * 100));

  return (
    <div
      id={`nutrient-card-${result.nutrient}`}
      className={`card-lg overflow-hidden bg-white dark:bg-[#1e2027] border rounded-3xl transition-all duration-300 ${
        isHighlighted
          ? 'border-brand-500 ring-4 ring-brand-500/20 shadow-lg scale-[1.01]'
          : 'border-stone-200 dark:border-[#2f323c] shadow-sm'
      }`}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
              <Icon className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-bold text-base sm:text-lg text-stone-900 dark:text-white">
                  {result.label}
                </h3>
                <span className="text-xs text-stone-400 font-semibold">
                  RDI: {result.rdi} {result.unit}/day
                </span>
                {result.labEvidence && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                    Lab: {result.labEvidence}
                  </span>
                )}
                {result.symptomRisk && result.symptomRisk.count > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                    {result.symptomRisk.symptomTitles.length} Symptoms Linked
                  </span>
                )}
              </div>

              <div
                className={`text-xs font-bold mt-1 ${
                  result.status === 'met'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : result.status === 'low'
                    ? 'text-amber-700 dark:text-amber-400'
                    : result.status === 'insufficient-data'
                    ? 'text-sky-700 dark:text-sky-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {result.statusLabel}
              </div>

              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                {result.reason}
              </p>

              {/* Visual Intake Gauge */}
              <div className="mt-3.5 max-w-md">
                <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                  <span className="text-stone-500">Dietary Intake Sufficiency</span>
                  <span
                    className={
                      pct >= 90
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : pct >= 60
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }
                  >
                    {Math.round(result.estimatedIntake)} / {result.rdi} {result.unit} ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      pct >= 90
                        ? 'bg-emerald-500'
                        : pct >= 60
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Food Solutions with 1-Click Logging */}
      <div className="border-t border-stone-200/70 dark:border-stone-800/80 px-5 sm:px-6">
        <ExpandableSection
          title="Clinical Food Sources & 1-Click Meal Add"
          icon={<Beaker className="w-4 h-4 text-stone-400" />}
        >
          <div className="space-y-4 pb-5 pt-2">
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              {result.note}
            </p>

            <div>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-brand-500" />
                  <span>Targeted Whole-Food Fixes</span>
                </div>
                <span className="text-[11px] text-stone-400">
                  Tap &ldquo;Log Food&rdquo; to record into today&apos;s nutrition progress
                </span>
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
                              playAddProgressSound();
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
                              onNotifyToast(
                                `Added ${f.name} (${Math.round(f.calories)} kcal) to today's logged meals!`
                              );
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
