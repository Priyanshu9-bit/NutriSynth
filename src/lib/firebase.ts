// Firebase Authentication & Firestore configuration.
// Supports both live Firebase Spark/free tier and offline/local fallback.

import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  type Auth,
  type User,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isAnonymous?: boolean;
}

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  config.apiKey &&
  config.projectId &&
  config.appId &&
  config.apiKey !== 'YOUR-FIREBASE-WEB-API-KEY' &&
  !config.apiKey.includes('PASTE_YOUR')
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
export let firestore: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(config);
    auth = getAuth(app);
    firestore = getFirestore(app);
  } catch (err) {
    console.warn('[NutriSynth] Firebase initialization error:', err);
  }
}

// Format Firebase user to clean AuthUser
function mapFirebaseUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
    photoURL: user.photoURL,
    isAnonymous: user.isAnonymous,
  };
}

// -------------------------------------------------------------
// Local Mock Store for Offline / Before-Firebase-Keys mode
// -------------------------------------------------------------
const LOCAL_STORAGE_USERS_KEY = 'nutrisynth_mock_users';
const LOCAL_STORAGE_SESSION_KEY = 'nutrisynth_active_session';

interface LocalUserRecord {
  uid: string;
  email: string;
  displayName: string;
  passwordHash: string;
}

function getLocalUsers(): Record<string, LocalUserRecord> {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_USERS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveLocalUsers(users: Record<string, LocalUserRecord>) {
  localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
}

function getLocalActiveSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setLocalActiveSession(user: AuthUser | null) {
  if (user) {
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
  }
}

// -------------------------------------------------------------
// Auth Observers & Event Dispatcher
// -------------------------------------------------------------
const authListeners = new Set<(user: AuthUser | null) => void>();
let cachedUser: AuthUser | null = null;

function notifyListeners(user: AuthUser | null) {
  cachedUser = user;
  authListeners.forEach((fn) => {
    try {
      fn(user);
    } catch (e) {
      console.error(e);
    }
  });
}

// Initialize listener
if (isFirebaseConfigured && auth) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      notifyListeners(mapFirebaseUser(user));
    } else {
      notifyListeners(null);
    }
  });
} else {
  // Use local session
  cachedUser = getLocalActiveSession();
}

/** Subscribe to auth state changes (login, logout, account switch) */
export function subscribeToAuth(callback: (user: AuthUser | null) => void): () => void {
  authListeners.add(callback);
  callback(cachedUser);
  return () => {
    authListeners.delete(callback);
  };
}

export function getCurrentUser(): AuthUser | null {
  if (isFirebaseConfigured && auth?.currentUser) {
    return mapFirebaseUser(auth.currentUser);
  }
  return cachedUser || getLocalActiveSession();
}

/** Resolves to the current user's UID (or anonymous user) for Firestore queries */
export async function getUserId(): Promise<string | null> {
  const current = getCurrentUser();
  if (current?.uid) return current.uid;

  if (isFirebaseConfigured && auth) {
    try {
      const cred = await signInAnonymously(auth);
      return cred.user.uid;
    } catch (err) {
      console.warn('[NutriSynth] Anonymous sign-in failed:', err);
    }
  }
  return null;
}

// -------------------------------------------------------------
// Auth Actions: Sign Up, Sign In, Sign Out
// -------------------------------------------------------------

export async function registerWithEmail(
  email: string,
  pass: string,
  displayName?: string
): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();
  const name = displayName?.trim() || cleanEmail.split('@')[0];

  if (isFirebaseConfigured && auth) {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    if (displayName) {
      await updateProfile(cred.user, { displayName: name }).catch(() => {});
    }
    const formatted = mapFirebaseUser(cred.user);
    formatted.displayName = name;
    return formatted;
  }

  // Local fallback mode
  const users = getLocalUsers();
  if (users[cleanEmail]) {
    const err: any = new Error('An account with this email already exists.');
    err.code = 'auth/email-already-in-use';
    throw err;
  }

  const uid = `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  users[cleanEmail] = {
    uid,
    email: cleanEmail,
    displayName: name,
    passwordHash: btoa(pass), // local simulation
  };
  saveLocalUsers(users);

  const localUser: AuthUser = {
    uid,
    email: cleanEmail,
    displayName: name,
    isAnonymous: false,
  };
  setLocalActiveSession(localUser);
  notifyListeners(localUser);
  return localUser;
}

export async function loginWithEmail(email: string, pass: string): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();

  if (isFirebaseConfigured && auth) {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    return mapFirebaseUser(cred.user);
  }

  // Local fallback mode
  const users = getLocalUsers();
  const found = users[cleanEmail];
  if (!found || found.passwordHash !== btoa(pass)) {
    const err: any = new Error('Invalid email or password.');
    err.code = 'auth/invalid-credential';
    throw err;
  }

  const localUser: AuthUser = {
    uid: found.uid,
    email: found.email,
    displayName: found.displayName,
    isAnonymous: false,
  };
  setLocalActiveSession(localUser);
  notifyListeners(localUser);
  return localUser;
}

export async function loginAsGuest(): Promise<AuthUser> {
  if (isFirebaseConfigured && auth) {
    const cred = await signInAnonymously(auth);
    return mapFirebaseUser(cred.user);
  }

  const uid = `guest_${Date.now()}`;
  const guestUser: AuthUser = {
    uid,
    email: null,
    displayName: 'Guest User',
    isAnonymous: true,
  };
  setLocalActiveSession(guestUser);
  notifyListeners(guestUser);
  return guestUser;
}

export async function logout(): Promise<void> {
  if (isFirebaseConfigured && auth) {
    await signOut(auth);
  }
  setLocalActiveSession(null);
  notifyListeners(null);
}

export function formatAuthError(err: any): string {
  if (!err) return 'An unexpected error occurred.';
  const code = err.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in Firebase Console (Authentication -> Sign-in method).';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up first.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please try again.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection.';
    default:
      return err.message || 'Authentication failed. Please try again.';
  }
}
