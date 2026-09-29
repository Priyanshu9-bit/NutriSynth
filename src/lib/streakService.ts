// Day Streak and 30-Day Challenge logic & helpers

export interface StreakSettings {
  waterTargetMl: number; // default 2500 ml
  foodFocus: 'high_protein' | 'clean_eating' | 'zero_sugar' | 'gut_health' | 'weight_loss';
  mealFrequencyGoal: number; // e.g. 3 meals
}

export interface DailyFoodWaterLog {
  date: string; // "YYYY-MM-DD"
  waterMl: number;
  waterTargetMl: number;
  foodAdherenceTags: string[]; // e.g. ["Hit Protein Target", "3+ Color Veggies"]
  foodNotes: string;
  updatedAt: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate: string; // "YYYY-MM-DD"
  totalCheckIns: number;
  history: string[]; // list of dates "YYYY-MM-DD"
  settings?: StreakSettings;
  dailyLogs?: Record<string, DailyFoodWaterLog>; // map of "YYYY-MM-DD" to food/water details
  unlockedBadges?: string[];
  completedChallenges?: string[];
  hydrationStreak?: number;
}

export interface ChallengeData {
  startedAt: string; // "YYYY-MM-DD"
  completedDays: number[]; // e.g. [1, 2, 3]
  tickedTodos?: Record<number, number[]>; // map of dayNumber to array of ticked todo indices
  lastCompletedAt?: number;
}

export const DEFAULT_STREAK: StreakData = {
  currentStreak: 1,
  longestStreak: 1,
  lastCheckInDate: '',
  totalCheckIns: 1,
  history: [],
  settings: {
    waterTargetMl: 2500,
    foodFocus: 'high_protein',
    mealFrequencyGoal: 3,
  },
  dailyLogs: {},
};

export const DEFAULT_CHALLENGE: ChallengeData = {
  startedAt: new Date().toISOString().split('T')[0],
  completedDays: [],
  tickedTodos: {},
};

/** Formats date into local "YYYY-MM-DD" */
export function getLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Returns the local "YYYY-MM-DD" for yesterday */
export function getYesterdayDateKey(): string {
  const yesterday = new Date(Date.now() - 86400000);
  return getLocalDateKey(yesterday);
}

/** Evaluates and updates the user's daily streak upon check-in */
export function recordDailyCheckIn(prev: StreakData | undefined): {
  streak: StreakData;
  isNewDay: boolean;
  statusMessage: string;
} {
  const today = getLocalDateKey();
  const yesterday = getYesterdayDateKey();

  const current: StreakData = prev && typeof prev.currentStreak === 'number'
    ? { ...prev, history: Array.isArray(prev.history) ? [...prev.history] : [] }
    : { ...DEFAULT_STREAK };

  // Already checked in today
  if (current.lastCheckInDate === today) {
    return {
      streak: current,
      isNewDay: false,
      statusMessage: `You're all set for today! Current streak: ${current.currentStreak} day${current.currentStreak === 1 ? '' : 's'} 🔥`,
    };
  }

  let newCurrentStreak = 1;
  let statusMessage = '';

  if (current.lastCheckInDate === yesterday) {
    // Continued streak from yesterday!
    newCurrentStreak = current.currentStreak + 1;
    statusMessage = `Streak extended! 🔥 You are on a ${newCurrentStreak}-day streak!`;
  } else if (!current.lastCheckInDate) {
    // First time checking in
    newCurrentStreak = 1;
    statusMessage = `Welcome to the Challenge! Day 1 streak started! 🔥`;
  } else {
    // Missed one or more days — restart gracefully
    newCurrentStreak = 1;
    statusMessage = `New streak started today! Consistency is built one day at a time. 🔥`;
  }

  const updated: StreakData = {
    currentStreak: newCurrentStreak,
    longestStreak: Math.max(current.longestStreak || 0, newCurrentStreak),
    lastCheckInDate: today,
    totalCheckIns: (current.totalCheckIns || 0) + 1,
    history: current.history.includes(today) ? current.history : [...current.history, today],
  };

  return {
    streak: updated,
    isNewDay: true,
    statusMessage,
  };
}

/** Toggles a challenge day as completed or pending */
export function toggleChallengeDayCompletion(
  prevChallenge: ChallengeData | undefined,
  dayNumber: number,
  totalTodosForDay: number = 3
): { challenge: ChallengeData; wasCompleted: boolean; isNowComplete: boolean } {
  const challenge = prevChallenge
    ? {
        ...prevChallenge,
        completedDays: [...(prevChallenge.completedDays || [])],
        tickedTodos: { ...(prevChallenge.tickedTodos || {}) },
      }
    : { ...DEFAULT_CHALLENGE };

  const exists = challenge.completedDays.includes(dayNumber);
  let updatedDays: number[];
  const updatedTicked = { ...(challenge.tickedTodos || {}) };

  if (exists) {
    updatedDays = challenge.completedDays.filter((d) => d !== dayNumber);
    // Un-tick all todos for that day when un-marking
    delete updatedTicked[dayNumber];
  } else {
    updatedDays = [...challenge.completedDays, dayNumber].sort((a, b) => a - b);
    // Mark all todos as checked when marking day done directly
    updatedTicked[dayNumber] = Array.from({ length: totalTodosForDay }, (_, i) => i);
  }

  return {
    challenge: {
      ...challenge,
      completedDays: updatedDays,
      tickedTodos: updatedTicked,
      lastCompletedAt: !exists ? Date.now() : challenge.lastCompletedAt,
    },
    wasCompleted: exists,
    isNowComplete: !exists,
  };
}

/** Toggles an individual to-do checklist item for a day */
export function toggleChallengeTodo(
  prevChallenge: ChallengeData | undefined,
  dayNumber: number,
  todoIndex: number,
  totalTodosForDay: number = 3
): { challenge: ChallengeData; dayJustCompleted: boolean; isNowComplete: boolean } {
  const challenge = prevChallenge
    ? {
        ...prevChallenge,
        completedDays: [...(prevChallenge.completedDays || [])],
        tickedTodos: { ...(prevChallenge.tickedTodos || {}) },
      }
    : { ...DEFAULT_CHALLENGE, tickedTodos: {} };

  const currentTicks = [...(challenge.tickedTodos?.[dayNumber] || [])];
  const exists = currentTicks.includes(todoIndex);
  let nextTicks: number[];

  if (exists) {
    nextTicks = currentTicks.filter((idx) => idx !== todoIndex);
  } else {
    nextTicks = [...currentTicks, todoIndex].sort((a, b) => a - b);
  }

  const updatedTicked = {
    ...(challenge.tickedTodos || {}),
    [dayNumber]: nextTicks,
  };

  let dayJustCompleted = false;
  let updatedCompletedDays = [...challenge.completedDays];

  // If all todos are now checked, mark the day completed
  if (nextTicks.length >= totalTodosForDay && !updatedCompletedDays.includes(dayNumber)) {
    updatedCompletedDays = [...updatedCompletedDays, dayNumber].sort((a, b) => a - b);
    dayJustCompleted = true;
  } else if (nextTicks.length < totalTodosForDay && updatedCompletedDays.includes(dayNumber)) {
    // If user unchecked a todo and day was marked complete, unmark the day
    updatedCompletedDays = updatedCompletedDays.filter((d) => d !== dayNumber);
  }

  return {
    challenge: {
      ...challenge,
      completedDays: updatedCompletedDays,
      tickedTodos: updatedTicked,
      lastCompletedAt: dayJustCompleted ? Date.now() : challenge.lastCompletedAt,
    },
    dayJustCompleted,
    isNowComplete: updatedCompletedDays.includes(dayNumber),
  };
}

/** Computes the suggested "Current Active Day" (from 1 to 30) based on calendar progression and completed days */
export function computeActiveChallengeDay(
  challenge: ChallengeData | undefined
): number {
  if (!challenge) return 1;

  const completed = new Set(Array.isArray(challenge.completedDays) ? challenge.completedDays : []);

  // 1. Calculate calendar progression if startedAt is set
  let calendarDay = 1;
  if (challenge.startedAt) {
    try {
      const start = new Date(challenge.startedAt).getTime();
      const now = new Date(getLocalDateKey()).getTime();
      const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
      calendarDay = Math.min(Math.max(diffDays, 1), 30);
    } catch {
      calendarDay = 1;
    }
  }

  // 2. If the current calendar day is not yet completed, that is the active focus day
  if (!completed.has(calendarDay)) {
    return calendarDay;
  }

  // 3. If calendar day is completed, find the next uncompleted day (starting from calendarDay + 1 up to 30)
  for (let day = calendarDay + 1; day <= 30; day++) {
    if (!completed.has(day)) return day;
  }

  // 4. If all subsequent days are completed, check earlier incomplete days (catch-up)
  for (let day = 1; day <= 30; day++) {
    if (!completed.has(day)) return day;
  }

  // All 30 days completed!
  return 30;
}

const LOCAL_STREAK_KEY = 'nutrisynth_guest_streak';
const LOCAL_CHALLENGE_KEY = 'nutrisynth_guest_challenge';

export function loadLocalStreak(): StreakData {
  try {
    const raw = localStorage.getItem(LOCAL_STREAK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_STREAK,
          ...parsed,
          currentStreak: typeof parsed.currentStreak === 'number' ? parsed.currentStreak : DEFAULT_STREAK.currentStreak,
          longestStreak: typeof parsed.longestStreak === 'number' ? parsed.longestStreak : DEFAULT_STREAK.longestStreak,
          totalCheckIns: typeof parsed.totalCheckIns === 'number' ? parsed.totalCheckIns : DEFAULT_STREAK.totalCheckIns,
          history: Array.isArray(parsed.history) ? parsed.history : DEFAULT_STREAK.history,
          settings: { ...DEFAULT_STREAK.settings!, ...(parsed.settings || {}) },
          dailyLogs: parsed.dailyLogs && typeof parsed.dailyLogs === 'object' ? parsed.dailyLogs : {},
        };
      }
    }
  } catch {
    // fallback
  }
  return { ...DEFAULT_STREAK };
}

export function saveLocalStreak(data: StreakData): void {
  try {
    localStorage.setItem(LOCAL_STREAK_KEY, JSON.stringify(data));
  } catch {
    // fallback
  }
}

export function loadLocalChallenge(): ChallengeData {
  try {
    const raw = localStorage.getItem(LOCAL_CHALLENGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_CHALLENGE,
          ...parsed,
          startedAt: typeof parsed.startedAt === 'string' ? parsed.startedAt : DEFAULT_CHALLENGE.startedAt,
          completedDays: Array.isArray(parsed.completedDays) ? parsed.completedDays : DEFAULT_CHALLENGE.completedDays,
          tickedTodos: parsed.tickedTodos && typeof parsed.tickedTodos === 'object' ? parsed.tickedTodos : DEFAULT_CHALLENGE.tickedTodos,
        };
      }
    }
  } catch {
    // fallback
  }
  return { ...DEFAULT_CHALLENGE };
}

export function saveLocalChallenge(data: ChallengeData): void {
  try {
    localStorage.setItem(LOCAL_CHALLENGE_KEY, JSON.stringify(data));
  } catch {
    // fallback
  }
}

/** Updates food and water details logged for a specific date in the streak */
export function updateDailyFoodWaterLog(
  prevStreak: StreakData | undefined,
  dateKey: string,
  update: Partial<DailyFoodWaterLog>
): StreakData {
  const current: StreakData = prevStreak
    ? {
        ...prevStreak,
        history: [...(prevStreak.history || [])],
        settings: { ...(prevStreak.settings || DEFAULT_STREAK.settings!) },
        dailyLogs: { ...(prevStreak.dailyLogs || {}) },
      }
    : { ...DEFAULT_STREAK };

  const existingLog = current.dailyLogs?.[dateKey] || {
    date: dateKey,
    waterMl: 0,
    waterTargetMl: current.settings?.waterTargetMl || 2500,
    foodAdherenceTags: [],
    foodNotes: '',
    updatedAt: Date.now(),
  };

  const updatedLog: DailyFoodWaterLog = {
    ...existingLog,
    ...update,
    updatedAt: Date.now(),
  };

  return {
    ...current,
    dailyLogs: {
      ...(current.dailyLogs || {}),
      [dateKey]: updatedLog,
    },
  };
}

/** Updates user streak customization settings (water target, food focus, meal frequency) */
export function updateStreakSettings(
  prevStreak: StreakData | undefined,
  newSettings: StreakSettings
): StreakData {
  const current: StreakData = prevStreak
    ? {
        ...prevStreak,
        history: [...(prevStreak.history || [])],
        dailyLogs: { ...(prevStreak.dailyLogs || {}) },
      }
    : { ...DEFAULT_STREAK };

  return {
    ...current,
    settings: { ...newSettings },
  };
}

/** Plays a celebratory fanfare chime using Web Audio API */
export function playGrandCelebrationSound(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Notes of a triumphant fanfare chord (C5, E5, G5, C6)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 1.3);
    });
  } catch {
    // Audio playback fallback
  }
}

export interface DailyWellnessChallenge {
  id: string;
  title: string;
  category: 'hydration' | 'nutrition' | 'mindfulness' | 'movement';
  description: string;
  xp: number;
  icon: string;
}

export const DAILY_WELLNESS_CHALLENGES: DailyWellnessChallenge[] = [
  {
    id: 'hydra-sprint',
    title: 'Hydration Sprint',
    category: 'hydration',
    description: 'Drink 1,000ml (4 glasses) of water before 1:00 PM for optimal metabolic flow.',
    xp: 50,
    icon: '🌊',
  },
  {
    id: 'protein-power',
    title: 'Protein Power Fuel',
    category: 'nutrition',
    description: 'Hit 25g+ of clean protein in your lunch or post-activity snack.',
    xp: 50,
    icon: '🥩',
  },
  {
    id: 'rainbow-plate',
    title: 'Rainbow Phytochemicals',
    category: 'nutrition',
    description: 'Eat at least 2 differently colored vegetables or fruits with your meals today.',
    xp: 50,
    icon: '🥗',
  },
  {
    id: 'mindful-fuel',
    title: 'Mindful Eating',
    category: 'mindfulness',
    description: 'Enjoy one meal completely distraction-free — no phone, laptop, or TV.',
    xp: 40,
    icon: '🧘',
  },
  {
    id: 'fiber-ignition',
    title: 'Fiber Ignition',
    category: 'nutrition',
    description: 'Incorporate legumes, chia seeds, oats, or cruciferous greens for gut health.',
    xp: 50,
    icon: '🌾',
  },
  {
    id: 'post-fuel-stride',
    title: 'Post-Fuel Stride',
    category: 'movement',
    description: 'Take a relaxed 15-minute walk after your largest meal to blunt blood glucose spikes.',
    xp: 50,
    icon: '👟',
  },
  {
    id: 'weekly-prep',
    title: 'Nourish Prep Reset',
    category: 'nutrition',
    description: 'Plan or prepare your favorite healthy snack or dinner meal ahead of time.',
    xp: 60,
    icon: '🥑',
  },
];

export function getTodayWellnessChallenge(): DailyWellnessChallenge {
  const dayIndex = new Date().getDay();
  const index = (dayIndex + 6) % 7;
  return DAILY_WELLNESS_CHALLENGES[index % DAILY_WELLNESS_CHALLENGES.length];
}

export function calculateHydrationStreak(streak: StreakData | undefined): number {
  if (!streak?.dailyLogs) return 0;
  let count = 0;
  const now = new Date();

  // Check today first
  const todayKey = getLocalDateKey(now);
  const todayLog = streak.dailyLogs[todayKey];
  const target = streak.settings?.waterTargetMl || 2500;
  if (todayLog && todayLog.waterMl >= target) {
    count++;
  }

  // Check previous consecutive days
  for (let i = 1; i <= 365; i++) {
    const pastDate = new Date(now.getTime() - i * 86400000);
    const key = getLocalDateKey(pastDate);
    const log = streak.dailyLogs[key];
    if (log && log.waterMl >= (log.waterTargetMl || target)) {
      count++;
    } else {
      break;
    }
  }
  return count;
}


