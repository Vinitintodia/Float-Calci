// The calculator app screen (tabs + calculator + history + theme), used by:
//   * the Chrome extension (popup.html): on-page frame, desktop window, popup
//   * the installed web app (Float Calci added to your dock / start menu) and
//     floatcalci.app/?app — see getSurface() in lib/env.ts
import React, { useEffect, useRef, useState } from "react";
import { History, Pin } from "lucide-react";
import { toast } from "sonner";
import CalculatorManager from "@/components/CalculatorManager";
import HistoryPanel from "@/components/HistoryPanel";
import ThemeToggle from "@/components/ThemeToggle";
import { Toaster } from "@/components/ui/sonner";
import { CalculatorHostContext, type CalculatorHost } from "@/components/calculator/CalculatorHost";
import { PIN_EVENT } from "@/components/calculator/CalculatorShell";
import { useSaveOnClose } from "@/hooks/use-save-on-close";
import { getSurface, isExtension, supportsAlwaysOnTop } from "@/lib/env";
import { useHistory, type CalculatorType } from "@/lib/history";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const surface = getSurface();
const notice = new URLSearchParams(location.search).get("notice");
const NOTICE_TEXT: Record<string, string> = {
  restricted: "Chrome doesn't let extensions draw on its own pages, so here's Float Calci as a popup. On any website, click the icon to float it on the page.",
  file: "To float the calculator on local files, turn on “Allow access to file URLs” for Float Calci in chrome://extensions. Here it is as a popup for now.",
  blocked: "This page doesn't allow the floating calculator, so here's Float Calci as a popup.",
};
const LAST_CALC_KEY = "floatcalci:lastCalc";
const readLastCalc = (): CalculatorType | null => {
  try {
    const v = localStorage.getItem(LAST_CALC_KEY);
    return v === "basic" || v === "scientific" || v === "financial" ? v : null;
  } catch {
    return null;
  }
};
const initialType = (new URLSearchParams(location.search).get("calc") as CalculatorType) || readLastCalc() || "basic";

/** Talk to the page overlay that hosts this iframe (extension/overlay.ts). */
const toOverlay = (msg: Record<string, unknown>) => {
  if (surface === "overlay" && window.parent !== window) window.parent.postMessage(msg, "*");
};

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

const CalculatorApp = () => {
  const [type, setType] = useState<CalculatorType>(initialType);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { unsavedCount } = useHistory();
  const { requestClose, dialog, isOpen: saveOpen } = useSaveOnClose(() =>
    surface === "overlay" ? toOverlay({ type: "floatcalci:close" }) : window.close(),
  );
  const { resolved: theme } = useTheme();
  const rootRef = useRef<HTMLDivElement>(null);

  // Remember the last calculator, and tell the page overlay about it
  useEffect(() => {
    try {
      localStorage.setItem(LAST_CALC_KEY, type);
    } catch {
      /* ignore */
    }
    toOverlay({ type: "floatcalci:calc", calc: type });
  }, [type]);

  useEffect(() => toOverlay({ type: "floatcalci:theme", dark: theme === "dark" }), [theme]);

  // Opened as a popup because the page doesn't allow the on-page calculator
  useEffect(() => {
    if (notice && NOTICE_TEXT[notice]) toast(NOTICE_TEXT[notice], { duration: 6000 });
  }, []);

  // Overlay: report our height so the window fits (taller while the save prompt
  // or history panel is open, so they don't have to scroll), and close when asked
  const needsRoom = saveOpen || historyOpen;
  const reportHeight = useRef(() => {});
  reportHeight.current = () => {
    const h = rootRef.current?.offsetHeight ?? 0;
    toOverlay({ type: "floatcalci:height", height: Math.max(h, needsRoom ? 600 : 0) });
  };
  useEffect(() => reportHeight.current(), [needsRoom]);
  const latestClose = useRef(() => requestClose(type));
  latestClose.current = () => requestClose(type);
  useEffect(() => {
    if (surface !== "overlay") return;
    toOverlay({ type: "floatcalci:ready" });
    const el = rootRef.current;
    const ro = el ? new ResizeObserver(() => reportHeight.current()) : null;
    if (el && ro) ro.observe(el);
    const onMessage = (e: MessageEvent) => {
      if (e.source === window.parent && e.data?.type === "floatcalci:request-close") latestClose.current();
    };
    window.addEventListener("message", onMessage);
    return () => {
      ro?.disconnect();
      window.removeEventListener("message", onMessage);
    };
  }, []);

  const host: CalculatorHost =
    surface === "overlay"
      ? { docked: true, compact: true, hideTitleBar: true, requestClose }
      : surface === "popup"
      ? {
          docked: true,
          compact: true,
          hideTitleBar: true, // the header has the Float button; click outside to close
          requestClose,
          // The toolbar popup closes when it loses focus, so it can't host an
          // always-on-top window itself; open the separate window instead.
          float: () => void openFloatingWindow(type),
          floatLabel: "Open as a floating window",
        }
      : surface === "app"
      ? // Installed web app: the OS window has the close / minimise buttons
        { docked: true, hideTitleBar: true, requestClose }
      : // The desktop window has its own close / minimise buttons, so no second set inside
        { docked: true, hideTitleBar: true, requestClose, onAlwaysOnTopChange: setHostWindowMinimised };

  // Desktop window / installed app: resize the window to fit the calculator
  useEffect(() => {
    const extWindow = surface === "window" && isExtension();
    const appWindow = surface === "app" && window.matchMedia("(display-mode: standalone)").matches;
    if (!extWindow && !appWindow) return;
    const el = rootRef.current?.firstElementChild as HTMLElement | null;
    if (!el) return;
    let last = 0;
    const fit = () => {
      const content = Math.ceil(el.getBoundingClientRect().height) + 8;
      if (Math.abs(content - last) < 4) return;
      last = content;
      const frame = window.outerHeight - window.innerHeight; // title bar
      if (appWindow) {
        try {
          window.resizeTo(420, content + frame);
        } catch {
          /* not allowed here */
        }
        return;
      }
      chrome.windows.getCurrent((w) => {
        if (w.id !== undefined && w.state === "normal") chrome.windows.update(w.id, { height: content + frame });
      });
    };
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      className={cn(
        "text-foreground",
        surface === "popup" ? "w-[380px]" : surface === "overlay" ? "w-full" : "min-h-screen w-full",
      )}
      style={{ background: "var(--calc-window-bg)" }}
    >
      {/* The window keeps calculator proportions even when maximised or full screen */}
      <div className={cn((surface === "window" || surface === "app") && "mx-auto w-full max-w-[420px] pt-2")}>
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
        {(surface === "window" || surface === "app") && supportsAlwaysOnTop() && (
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
      </div>

      <HistoryPanel open={historyOpen} onOpenChange={setHistoryOpen} />
      {dialog}
      <Toaster position="top-center" />
    </div>
  );
};

export default CalculatorApp;
