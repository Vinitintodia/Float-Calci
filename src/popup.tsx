// Chrome extension UI. The same page is used in two places:
//   popup.html              -> the toolbar popup
//   popup.html?mode=window  -> a small separate window that can be pinned
//                              "on top of all apps" (Document Picture-in-Picture)
import { createRoot } from "react-dom/client";
import React, { useState } from "react";
import { History, Pin } from "lucide-react";
import "./index.css";
import CalculatorManager from "./components/CalculatorManager";
import HistoryPanel from "./components/HistoryPanel";
import ThemeToggle from "./components/ThemeToggle";
import { Toaster } from "./components/ui/sonner";
import { CalculatorHostContext, type CalculatorHost } from "./components/calculator/CalculatorHost";
import { PIN_EVENT } from "./components/calculator/CalculatorShell";
import { useSaveOnClose } from "./hooks/use-save-on-close";
import { getSurface, isExtension, supportsAlwaysOnTop } from "./lib/env";
import { useHistory, type CalculatorType } from "./lib/history";
import { cn } from "./lib/utils";

const surface = getSurface();
const initialType = (new URLSearchParams(location.search).get("calc") as CalculatorType) || "basic";

const TABS: { type: CalculatorType; label: string }[] = [
  { type: "basic", label: "Basic" },
  { type: "scientific", label: "Scientific" },
  { type: "financial", label: "Financial" },
];

const openFloatingWindow = async (calc: CalculatorType) => {
  if (isExtension()) {
    await chrome.runtime.sendMessage({ type: "open-floating-window", calc });
    window.close();
  } else {
    window.open(`popup.html?mode=window&calc=${calc}`, "floatcalci", "width=400,height=700");
  }
};

// Minimise the extension window while the calculator floats on top of everything.
const setHostWindowMinimised = (minimised: boolean) => {
  if (!isExtension() || surface !== "window") return;
  chrome.windows.getCurrent((w) => {
    if (w.id !== undefined) chrome.windows.update(w.id, minimised ? { state: "minimized" } : { focused: true, state: "normal" });
  });
};

const ExtensionApp = () => {
  const [type, setType] = useState<CalculatorType>(initialType);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { unsavedCount } = useHistory();
  const { requestClose, dialog } = useSaveOnClose(() => window.close());

  const host: CalculatorHost =
    surface === "popup"
      ? {
          docked: true,
          compact: true,
          requestClose,
          // The toolbar popup closes when it loses focus, so it can't host an
          // always-on-top window itself; open the separate window instead.
          float: () => void openFloatingWindow(type),
          floatLabel: "Open as a floating window",
        }
      : { docked: true, requestClose, onAlwaysOnTopChange: setHostWindowMinimised };

  return (
    <div
      className={cn("text-foreground", surface === "popup" ? "w-[380px]" : "min-h-screen w-full")}
      style={{ background: "var(--calc-window-bg)" }}
    >
      <header className="flex items-center gap-1.5 px-2.5 pb-2 pt-2.5">
        <nav className="flex flex-1 gap-0.5 rounded-xl bg-card p-0.5 shadow-sm" role="tablist" aria-label="Calculator">
          {TABS.map((t) => (
            <button
              key={t.type}
              role="tab"
              aria-selected={type === t.type}
              onClick={() => setType(t.type)}
              className={cn(
                "flex-1 rounded-lg px-1.5 py-1.5 text-xs font-medium transition-colors",
                type === t.type ? "bg-brand-blue text-white" : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
        {surface === "window" && supportsAlwaysOnTop() && (
          <button
            onClick={() => window.dispatchEvent(new Event(PIN_EVENT))}
            className="inline-flex h-8 items-center gap-1 rounded-full bg-brand-blue px-2.5 text-xs font-medium text-white hover:bg-brand-blue/90"
            title="Keep the calculator above all your apps"
          >
            <Pin className="h-3.5 w-3.5" /> Pin
          </button>
        )}
        {surface === "popup" && (
          <button
            onClick={() => void openFloatingWindow(type)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-accent"
            title="Float: open in its own window that you can pin above all apps"
            aria-label="Float"
          >
            <Pin className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => setHistoryOpen(true)}
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-accent"
          aria-label="Calculation history"
          title="History"
        >
          <History className="h-4 w-4" />
          {unsavedCount > 0 && (
            <span className="absolute -right-1 -top-1 min-w-[1.1rem] rounded-full bg-brand-blue px-1 text-[10px] font-semibold leading-[1.1rem] text-white">
              {unsavedCount > 99 ? "99+" : unsavedCount}
            </span>
          )}
        </button>
        <ThemeToggle className="h-8 w-8" />
      </header>

      <main className="px-2.5 pb-2.5">
        <CalculatorHostContext.Provider value={host}>
          <CalculatorManager key={type} type={type} />
        </CalculatorHostContext.Provider>
      </main>

      <HistoryPanel open={historyOpen} onOpenChange={setHistoryOpen} />
      {dialog}
      <Toaster position="top-center" />
    </div>
  );
};

createRoot(document.getElementById("root")!).render(<ExtensionApp />);
