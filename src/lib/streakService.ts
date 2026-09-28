// Day Streak and 30-Day Challenge logic & helpers

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate: string; // "YYYY-MM-DD"
  totalCheckIns: number;
  history: string[]; // list of dates "YYYY-MM-DD"
}

export interface ChallengeData {
  startedAt: string; // "YYYY-MM-DD"
  completedDays: number[]; // e.g. [1, 2, 3]
  lastCompletedAt?: number;
}

export const DEFAULT_STREAK: StreakData = {
  currentStreak: 1,
  longestStreak: 1,
  lastCheckInDate: '',
  totalCheckIns: 1,
  history: [],
};

export const DEFAULT_CHALLENGE: ChallengeData = {
  startedAt: new Date().toISOString().split('T')[0],
  completedDays: [1], // day 1 checked by default as welcome
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
  dayNumber: number
): ChallengeData {
  const challenge = prevChallenge
    ? { ...prevChallenge, completedDays: [...(prevChallenge.completedDays || [])] }
    : { ...DEFAULT_CHALLENGE };

  const exists = challenge.completedDays.includes(dayNumber);
  let updatedDays: number[];

  if (exists) {
    updatedDays = challenge.completedDays.filter((d) => d !== dayNumber);
  } else {
    updatedDays = [...challenge.completedDays, dayNumber].sort((a, b) => a - b);
  }

  return {
    ...challenge,
    completedDays: updatedDays,
    lastCompletedAt: Date.now(),
  };
}

/** Computes the suggested "Current Active Day" (from 1 to 30) based on days elapsed */
export function computeActiveChallengeDay(
  challenge: ChallengeData | undefined
): number {
  if (!challenge?.startedAt) return 1;

  try {
    const start = new Date(challenge.startedAt).getTime();
    const now = new Date(getLocalDateKey()).getTime();
    const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
    return Math.min(Math.max(diffDays, 1), 30);
  } catch {
    return 1;
  }
}

const LOCAL_STREAK_KEY = 'nutrisynth_guest_streak';
const LOCAL_CHALLENGE_KEY = 'nutrisynth_guest_challenge';

export function loadLocalStreak(): StreakData {
  try {
    const raw = localStorage.getItem(LOCAL_STREAK_KEY);
    if (raw) return JSON.parse(raw);
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
    if (raw) return JSON.parse(raw);
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

