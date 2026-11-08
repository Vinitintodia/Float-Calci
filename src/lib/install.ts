// Installable web app (PWA): the "Install app" button and the service worker.
//
// Chrome and Edge fire `beforeinstallprompt` when the site can be installed; we
// keep that event so our own button can show the install dialog later.
import { useSyncExternalStore } from "react";
import { isExtension } from "./env";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
let installedNow = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Call once, as early as possible (the browser may fire the event before React renders). */
export const initInstall = () => {
  if (typeof window === "undefined" || isExtension()) return;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // we show our own button instead of the mini-infobar
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installedNow = true;
    emit();
  });
};

export const isRunningInstalled = () =>
  typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches;

/** Shows the browser's install dialog. Resolves true if the user installed. */
export const promptInstall = async () => {
  if (!deferred) return false;
  const e = deferred;
  deferred = null;
  emit();
  await e.prompt();
  const { outcome } = await e.userChoice;
  return outcome === "accepted";
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useInstall = () => {
  const canInstall = useSyncExternalStore(subscribe, () => !!deferred);
  const installed = useSyncExternalStore(subscribe, () => installedNow || isRunningInstalled());
  return { canInstall, installed, install: promptInstall };
};

/** Offline support for the website (not in dev, not in the extension). */
export const registerServiceWorker = () => {
  if (!import.meta.env.PROD || isExtension() || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* offline support is optional */
    });
  });
};
