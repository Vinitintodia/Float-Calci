// Light / dark / system theme. Adds or removes the `dark` class on <html>,
// which Tailwind (darkMode: "class") and the calculator CSS variables use.
import { useEffect, useSyncExternalStore } from "react";

export type ThemeSetting = "light" | "dark" | "system";

const KEY = "floatcalci:theme";
const media = () => window.matchMedia("(prefers-color-scheme: dark)");

let setting: ThemeSetting = (() => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" || v === "system" ? v : "system";
  } catch {
    return "system";
  }
})();

const listeners = new Set<() => void>();

export const resolveTheme = (s: ThemeSetting = setting): "light" | "dark" =>
  s === "system" ? (media().matches ? "dark" : "light") : s;

/** Apply the theme to a document (the main page or a floating PiP window). */
export const applyTheme = (doc: Document = document) => {
  const dark = resolveTheme() === "dark";
  doc.documentElement.classList.toggle("dark", dark);
  doc.documentElement.style.colorScheme = dark ? "dark" : "light";
};

const emit = () => {
  applyTheme();
  listeners.forEach((l) => l());
};

export const setTheme = (next: ThemeSetting) => {
  setting = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* ignore */
  }
  emit();
};

/** Flip between light and dark (leaving "system" mode). */
export const toggleTheme = () => setTheme(resolveTheme() === "dark" ? "light" : "dark");

if (typeof window !== "undefined") {
  applyTheme();
  media().addEventListener("change", () => setting === "system" && emit());
  // Keep other tabs / extension pages in sync.
  window.addEventListener("storage", (e) => {
    if (e.key === KEY && e.newValue) {
      setting = e.newValue as ThemeSetting;
      emit();
    }
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useTheme = () => {
  const current = useSyncExternalStore(subscribe, () => setting);
  return { setting: current, resolved: resolveTheme(current), setTheme, toggleTheme };
};

/** Keep an extra document (e.g. the always-on-top window) in the same theme. */
export const useThemeOn = (doc: Document | null) => {
  const { resolved } = useTheme();
  useEffect(() => {
    if (doc) applyTheme(doc);
  }, [doc, resolved]);
};
