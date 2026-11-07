// Calculation history + the user's profile (name or Google account).
//
// Every successful calculation is recorded straight away, so nothing is lost if
// the tab or popup is closed. Entries start "unsaved" (no profile). When the
// user gives a name or signs in with Google, the unsaved entries are attached
// to that profile, and everything after that is saved to it automatically.
import { useSyncExternalStore } from "react";
import { storage } from "./storage";

export type CalculatorType = "basic" | "scientific" | "financial";

export interface HistoryEntry {
  id: string;
  calculator: CalculatorType;
  expression: string;
  result: string;
  createdAt: number;
  profileId: string | null; // null = not saved to a profile yet
}

export interface Profile {
  id: string; // "name:vinit" or "google:<sub>"
  name: string;
  email?: string;
  picture?: string;
  provider: "name" | "google";
}

interface State {
  profile: Profile | null;
  entries: HistoryEntry[];
}

const KEY = "floatcalci:history:v1";
const MAX_ENTRIES = 500;

let state: State = { profile: null, entries: [] };
let loaded = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

const load = async () => {
  state = await storage.get<State>(KEY, { profile: null, entries: [] });
  loaded = true;
  emit();
};

const update = (next: State) => {
  state = next;
  emit();
  void storage.set(KEY, state);
};

// Load once, and stay in sync with other tabs / the extension window.
if (typeof window !== "undefined") {
  void load();
  storage.onExternalChange(KEY, () => void load());
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// ---- Actions -------------------------------------------------------------

export const recordCalculation = (
  calculator: CalculatorType,
  expression: string,
  result: string,
) => {
  if (!expression.trim() || !result || result === "Error") return;
  const entry: HistoryEntry = {
    id: newId(),
    calculator,
    expression,
    result,
    createdAt: Date.now(),
    profileId: state.profile?.id ?? null,
  };
  update({ ...state, entries: [entry, ...state.entries].slice(0, MAX_ENTRIES) });
};

/** Sign in (name or Google) and attach all unsaved calculations to that profile. */
export const saveToProfile = (profile: Profile) => {
  update({
    profile,
    entries: state.entries.map((e) => (e.profileId ? e : { ...e, profileId: profile.id })),
  });
};

/** Sign out. Saved calculations stay on this device and come back on next sign-in. */
export const signOut = () => update({ ...state, profile: null });

/** Delete the calculations currently visible (the user's saved ones + unsaved ones). */
export const clearVisibleHistory = () => {
  const pid = state.profile?.id ?? null;
  update({
    ...state,
    entries: state.entries.filter((e) => e.profileId !== null && e.profileId !== pid),
  });
};

export const deleteEntry = (id: string) =>
  update({ ...state, entries: state.entries.filter((e) => e.id !== id) });

// ---- Selectors -----------------------------------------------------------

export const getProfile = () => state.profile;

export const getUnsavedCount = () => state.entries.filter((e) => e.profileId === null).length;

/** What the current user can see: their saved entries plus anything unsaved. */
export const getVisibleEntries = (s: State = state) => {
  const pid = s.profile?.id ?? null;
  return s.entries.filter((e) => e.profileId === null || e.profileId === pid);
};

/** True when closing should ask the user to save (unsaved work and no profile). */
export const shouldPromptToSave = () => !state.profile && getUnsavedCount() > 0;

// ---- React hook ----------------------------------------------------------

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useHistory = () => {
  const s = useSyncExternalStore(subscribe, () => state);
  return {
    loaded,
    profile: s.profile,
    entries: getVisibleEntries(s),
    unsavedCount: s.entries.filter((e) => e.profileId === null).length,
  };
};

export const profileFromName = (name: string): Profile => ({
  id: `name:${name.trim().toLowerCase()}`,
  name: name.trim(),
  provider: "name",
});
