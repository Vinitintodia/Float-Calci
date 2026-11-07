// Tiny async key-value store.
// In the Chrome extension it uses chrome.storage.local (shared by the popup and
// the floating window). On the website it falls back to localStorage.
import { isExtension } from "./env";

type Listener = () => void;

export const storage = {
  async get<T>(key: string, fallback: T): Promise<T> {
    try {
      if (isExtension()) {
        const res = await chrome.storage.local.get(key);
        return (res[key] as T) ?? fallback;
      }
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      if (isExtension()) {
        await chrome.storage.local.set({ [key]: value });
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (err) {
      console.warn("Float Calci: could not save", err);
    }
  },

  // Fires when another tab / extension page changes the value.
  onExternalChange(key: string, listener: Listener): () => void {
    if (isExtension()) {
      const handler = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
        if (area === "local" && key in changes) listener();
      };
      chrome.storage.onChanged.addListener(handler);
      return () => chrome.storage.onChanged.removeListener(handler);
    }
    const handler = (e: StorageEvent) => {
      if (e.key === key) listener();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  },
};
