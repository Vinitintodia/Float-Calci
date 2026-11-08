// The window frame shared by all three calculators:
// macOS-style controls, dragging, minimise, keyboard input, light/dark colours
// and the green "float on top of all apps" button.
//
// "Float on top of all apps" uses Document Picture-in-Picture: Chrome/Edge open
// a small always-on-top window that stays above every app on the laptop, and we
// render the same React calculator into it with a portal (so its state is kept).
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { supportsAlwaysOnTop } from "@/lib/env";
import { useThemeOn } from "@/lib/theme";
import type { CalculatorType } from "@/lib/history";
import { useCalculatorHost } from "./CalculatorHost";

interface DocumentPictureInPicture {
  requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
  window: Window | null;
}
declare global {
  interface Window {
    documentPictureInPicture?: DocumentPictureInPicture;
  }
}

export const PIN_EVENT = "floatcalci:always-on-top";

const isTouchScreen = () => typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;

// Edge tuck: width of the tab left on screen, and how close the cursor must come.
const TAB = 28;
const MAGNET = 60;
const LEAVE = 40;
// After it tucks away, the cursor can't pull it out for 5 s (so you can get on
// with your work); after that, hover near the tab for 2 s to bring it out.
// Clicking / tapping the tab always brings it out straight away.
const COOLDOWN = 5000;
const DWELL = 2000;

// Which calculator gets keyboard input (see the keyboard effect below).
let nextShellId = 1;
let activeShell = 0;
const autoShells: number[] = [];

if (typeof document !== "undefined") {
  // Clicking a calculator gives it the keyboard; clicking elsewhere hands it
  // back to the newest floating calculator (if any).
  document.addEventListener(
    "pointerdown",
    (e) => {
      const el = (e.target as HTMLElement | null)?.closest?.("[data-shell-id]");
      activeShell = el ? Number(el.getAttribute("data-shell-id")) : autoShells[autoShells.length - 1] ?? 0;
    },
    true,
  );
}

interface CalculatorShellProps {
  type: CalculatorType;
  title: string;
  width: number;
  defaultPosition: { x: number; y: number };
  /** Keyboard handler; attached to whichever window the calculator is in. */
  onKeyDown?: (e: KeyboardEvent) => void;
  children: React.ReactNode;
}

// Copy the page's CSS into the always-on-top window so it looks identical.
const copyStyles = (target: Document) => {
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const style = target.createElement("style");
      style.textContent = Array.from(sheet.cssRules)
        .map((r) => r.cssText)
        .join("\n");
      target.head.appendChild(style);
    } catch {
      // Cross-origin sheet: link it instead.
      if (sheet.href) {
        const link = target.createElement("link");
        link.rel = "stylesheet";
        link.href = sheet.href;
        target.head.appendChild(link);
      }
    }
  }
};

const dot = (color: string, disabled = false): React.CSSProperties => ({
  width: 12,
  height: 12,
  borderRadius: "50%",
  background: color,
  border: "none",
  cursor: disabled ? "default" : "pointer",
  padding: 0,
  opacity: disabled ? 0.35 : 1,
  transition: "opacity 0.2s",
});

const CalculatorShell: React.FC<CalculatorShellProps> = ({
  type,
  title,
  width,
  defaultPosition,
  onKeyDown,
  children,
}) => {
  const host = useCalculatorHost();
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  // Fit small screens (phones): never wider than the viewport, start fully visible.
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  width = Math.min(width, vw - 16);
  const [offset, setOffset] = useState(() => ({
    x: Math.max(8, Math.min(defaultPosition.x, vw - width - 8)),
    y: vw < 640 ? 72 : defaultPosition.y,
  }));
  const calcRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  useThemeOn(pipWindow?.document ?? null);

  const docked = host.docked || !!pipWindow;

  // ---- Keyboard: always call the latest handler, on the right window -----
  const keyHandler = useRef(onKeyDown);
  keyHandler.current = onKeyDown;
  const [shellId] = useState(() => nextShellId++);
  const autoKeyboard = host.autoKeyboard !== false;

  // Only one calculator takes the keyboard: the one you last clicked, or the
  // newest floating one.
  useEffect(() => {
    if (autoKeyboard) {
      autoShells.push(shellId);
      activeShell = shellId;
    }
    return () => {
      const i = autoShells.indexOf(shellId);
      if (i >= 0) autoShells.splice(i, 1);
      if (activeShell === shellId) activeShell = autoShells[autoShells.length - 1] ?? 0;
    };
  }, [shellId, autoKeyboard]);

  useEffect(() => {
    const target: Window = pipWindow ?? window;
    const listener = (e: KeyboardEvent) => {
      if (!pipWindow && activeShell !== shellId) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      // Don't type into the calculator while a dialog (e.g. save prompt) is open.
      if (!pipWindow && document.querySelector('[role="dialog"]')) return;
      keyHandler.current?.(e);
    };
    target.addEventListener("keydown", listener);
    return () => target.removeEventListener("keydown", listener);
  }, [pipWindow, shellId]);

  // ---- Dragging, staying on screen, and the magnetic edge tuck (website only)
  //
  // * The calculator can't get lost: if the window shrinks or the calculator
  //   grows, it slides back into view.
  // * Drag it mostly past the left/right edge and it tucks in, leaving a small
  //   tab. Bring the cursor near the tab (or tap it) and it slides out like a
  //   magnet; move away and it tucks back. Drag it in to keep it out.
  const [viewport, setViewport] = useState(() => ({ w: vw, h: typeof window !== "undefined" ? window.innerHeight : 768 }));
  const [tuck, setTuck] = useState<"left" | "right" | null>(null);
  const [peek, setPeek] = useState(false);
  const [dragging, setDragging] = useState(false);
  const unpeekTimer = useRef<number | undefined>(undefined);
  const dwellTimer = useRef<number | undefined>(undefined);
  const cooldownUntil = useRef(0);
  const [charging, setCharging] = useState(false); // tab filling up while you hover

  const cancelDwell = useCallback(() => {
    if (dwellTimer.current !== undefined) window.clearTimeout(dwellTimer.current);
    dwellTimer.current = undefined;
    setCharging(false);
  }, []);
  /** Slide (back) into the edge and start the 5 s cool-down. */
  const tuckAway = useCallback(() => {
    cancelDwell();
    setPeek(false);
    cooldownUntil.current = Date.now() + COOLDOWN;
  }, [cancelDwell]);

  /** Keep the calculator fully on screen (vertically always; horizontally unless tucked). */
  const clampToView = useCallback(
    (pos: { x: number; y: number }, allowOffscreenX = false) => {
      const w = calcRef.current?.offsetWidth ?? width;
      const h = calcRef.current?.offsetHeight ?? 400;
      const vwNow = window.innerWidth;
      const vhNow = window.innerHeight;
      const x = allowOffscreenX
        ? Math.max(-w + TAB, Math.min(pos.x, vwNow - TAB))
        : Math.max(0, Math.min(pos.x, vwNow - w));
      const y = Math.max(0, Math.min(pos.y, Math.max(0, vhNow - h)));
      return { x, y };
    },
    [width],
  );

  // Window resized, or the calculator changed size (minimise, worksheet chips…)
  useEffect(() => {
    if (docked) return;
    const refit = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      setOffset((o) => clampToView(o));
    };
    window.addEventListener("resize", refit);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(refit) : null;
    if (ro && calcRef.current) ro.observe(calcRef.current);
    return () => {
      window.removeEventListener("resize", refit);
      ro?.disconnect();
    };
  }, [docked, clampToView]);

  // Where the panel is drawn
  const { w: panelW } = { w: calcRef.current?.offsetWidth ?? width };
  const shownX = !tuck
    ? offset.x
    : tuck === "left"
      ? peek
        ? 8
        : -panelW + TAB
      : peek
        ? viewport.w - panelW - 8
        : viewport.w - TAB;

  // Latest values for the document listeners below
  const live = useRef({ tuck, peek, dragging });
  live.current = { tuck, peek, dragging };
  const offsetRef = useRef(offset);
  offsetRef.current = offset;

  useEffect(() => {
    if (docked) return;

    const move = (e: PointerEvent) => {
      // Dragging
      if (dragStart.current) {
        setOffset(clampToView({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }, true));
        return;
      }
      // Magnet: only for a mouse/pen hovering near a tucked calculator
      const { tuck: t, peek: p } = live.current;
      if (!t || e.pointerType === "touch" || !calcRef.current) return;
      const r = calcRef.current.getBoundingClientRect();
      const nearY = e.clientY > r.top - MAGNET && e.clientY < r.bottom + MAGNET;
      if (!p) {
        const nearX = t === "left" ? e.clientX < TAB + MAGNET : e.clientX > window.innerWidth - TAB - MAGNET;
        const near = nearX && nearY && Date.now() >= cooldownUntil.current;
        if (near && dwellTimer.current === undefined) {
          // Start filling the tab; slide out if the cursor stays for DWELL ms
          setCharging(true);
          dwellTimer.current = window.setTimeout(() => {
            dwellTimer.current = undefined;
            setCharging(false);
            window.clearTimeout(unpeekTimer.current);
            setPeek(true);
          }, DWELL);
        } else if (!near && dwellTimer.current !== undefined) {
          cancelDwell();
        }
      } else {
        const inside =
          e.clientX > r.left - LEAVE && e.clientX < r.right + LEAVE && e.clientY > r.top - LEAVE && e.clientY < r.bottom + LEAVE;
        if (inside) window.clearTimeout(unpeekTimer.current);
        else if (unpeekTimer.current === undefined || unpeekTimer.current === -1) {
          unpeekTimer.current = window.setTimeout(() => {
            unpeekTimer.current = -1;
            tuckAway();
          }, 600);
        }
      }
    };

    const up = () => {
      if (!dragStart.current) return;
      dragStart.current = null;
      setDragging(false);
      const w = calcRef.current?.offsetWidth ?? width;
      const o = offsetRef.current;
      if (o.x < -w * 0.35) {
        setTuck("left");
        tuckAway();
      } else if (o.x + w > window.innerWidth + w * 0.35) {
        setTuck("right");
        tuckAway();
      } else {
        setTuck(null);
        setOffset(clampToView(o)); // snap back fully on screen
      }
    };

    // Touch: tap outside a peeking calculator to tuck it away again
    const down = (e: PointerEvent) => {
      const { tuck: t, peek: p } = live.current;
      // composedPath(): the tab you tapped may already be gone from the page by now
      if (t && p && calcRef.current && !e.composedPath().includes(calcRef.current)) tuckAway();
    };
    // Cursor left the browser window: stop filling the tab
    const leave = () => cancelDwell();

    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointerdown", down);
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointerdown", down);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.clearTimeout(unpeekTimer.current);
      window.clearTimeout(dwellTimer.current);
    };
  }, [docked, clampToView, width, tuckAway, cancelDwell]);

  const startDrag = (e: React.PointerEvent) => {
    if (docked) return;
    // Pick it up from wherever it is shown (tucked or peeking)
    const from = { x: shownX, y: offset.y };
    if (tuck) {
      setTuck(null);
      setPeek(false);
      cancelDwell();
      setOffset(from);
    }
    setDragging(true);
    dragStart.current = { x: e.clientX - from.x, y: e.clientY - from.y };
  };

  /** Tapping a tucked calculator slides it out (touch has no hover). */
  const onPanelPointerDown = () => {
    activeShell = shellId;
    if (tuck && !peek) {
      cancelDwell();
      setPeek(true);
    }
  };

  // ---- Always on top -------------------------------------------------------
  const closeAlwaysOnTop = useCallback(() => pipWindow?.close(), [pipWindow]);

  const openAlwaysOnTop = async () => {
    if (!supportsAlwaysOnTop()) {
      toast.error("Floating over all apps needs Chrome or Edge 116+ on a computer.");
      return;
    }
    try {
      const height = Math.max(calcRef.current?.offsetHeight ?? 480, 200);
      const pip = await window.documentPictureInPicture!.requestWindow({ width, height });
      copyStyles(pip.document);
      pip.document.title = `Float Calci – ${title}`;
      pip.document.body.style.margin = "0";
      pip.document.body.style.background = "var(--calc-window-bg)";
      pip.addEventListener("pagehide", () => {
        setPipWindow(null);
        host.onAlwaysOnTopChange?.(false);
      });
      setIsMinimized(false);
      setPipWindow(pip);
      host.onAlwaysOnTopChange?.(true);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't open the floating window.");
    }
  };

  // Close the always-on-top window if this calculator goes away.
  useEffect(() => () => closeAlwaysOnTop(), [closeAlwaysOnTop]);

  // Lets a button outside the calculator (e.g. "Pin on top" in the extension
  // window) open it. Must be dispatched from a click so Chrome allows it.
  const openRef = useRef(openAlwaysOnTop);
  openRef.current = openAlwaysOnTop;
  useEffect(() => {
    const onPin = () => void openRef.current();
    window.addEventListener(PIN_EVENT, onPin);
    return () => window.removeEventListener(PIN_EVENT, onPin);
  }, []);

  const onGreen = () => {
    if (pipWindow) closeAlwaysOnTop();
    else if (host.float) host.float();
    else void openAlwaysOnTop();
  };

  const greenTitle = pipWindow
    ? "Put back in the page"
    : host.floatLabel ?? "Float on top of all apps";

  const onRed = () => {
    closeAlwaysOnTop();
    host.requestClose(type);
  };

  // ---- Render --------------------------------------------------------------
  // Fades a little when you're not using it (not on touch screens: no hover there)
  const faded = !docked && !isHovered && !(tuck && peek) && !isTouchScreen();
  const tucked = !docked && !!tuck && !peek;

  const panel = (
    <div
      ref={calcRef}
      data-calculator={type}
      data-shell-id={shellId}
      onPointerDownCapture={onPanelPointerDown}
      style={{
        ...(docked
          ? { position: "relative", width: "100%" }
          : { position: "fixed", top: offset.y, left: shownX, width, zIndex: 1000 }),
        borderRadius: pipWindow ? 0 : 16,
        boxShadow: pipWindow ? "none" : "var(--calc-shadow)",
        backgroundColor: "var(--calc-surface)",
        color: "var(--calc-text)",
        userSelect: "none",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        opacity: faded ? 0.82 : 1,
        transition: dragging
          ? "opacity 0.3s ease, background-color 0.3s ease"
          : "opacity 0.3s ease, background-color 0.3s ease, left 0.28s cubic-bezier(0.2, 0.9, 0.3, 1.15), top 0.2s ease",
        overflow: "hidden",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Edge tab while tucked: hover near it or tap it to bring the calculator back */}
      {tucked && (
        <div
          data-testid="tuck-tab"
          title="Click, or hover here for 2 seconds, to bring the calculator back"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            [tuck === "left" ? "right" : "left"]: 0,
            width: TAB,
            zIndex: 2,
            background: "var(--calc-op)",
            color: "var(--calc-op-text)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {/* Fills up while the cursor hovers near the tab */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: charging ? "100%" : "0%",
              background: "rgba(255,255,255,0.4)",
              transition: charging ? `height ${DWELL}ms linear` : "height 150ms ease",
            }}
          />
          <span style={{ position: "relative" }}>{tuck === "left" ? "›" : "‹"}</span>
        </div>
      )}

      {/* Title bar */}
      {!host.hideTitleBar && (
      <div
        style={{
          padding: host.compact ? "0.45rem 0.75rem" : "0.75rem 1rem",
          background: faded ? "var(--calc-titlebar-dim)" : "var(--calc-titlebar)",
          fontWeight: 500,
          borderBottom: isMinimized ? "none" : "1px solid var(--calc-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "background 0.3s ease",
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button aria-label="Close" title="Close" onClick={onRed} style={dot("#FF5F57")} />
          <button
            aria-label={isMinimized ? "Expand" : "Minimise"}
            title={isMinimized ? "Expand" : "Minimise"}
            onClick={() => !pipWindow && setIsMinimized((m) => !m)}
            disabled={!!pipWindow}
            style={dot("#FFBD2E", !!pipWindow)}
          />
          <button aria-label={greenTitle} title={greenTitle} onClick={onGreen} style={dot("#28C840")} />
        </div>

        <div
          onPointerDown={startDrag}
          style={{
            cursor: docked ? "default" : "move",
            flex: 1,
            textAlign: "center",
            fontSize: "0.875rem",
            color: "var(--calc-title-text)",
            touchAction: "none",
          }}
        >
          {title}
        </div>

        <div style={{ width: 60 }} />
      </div>
      )}

      {!isMinimized && children}
    </div>
  );

  if (pipWindow) {
    return (
      <>
        {host.docked && (
          <div className="flex flex-col items-center gap-3 p-6 text-center text-sm text-muted-foreground">
            <p>The calculator is floating on top of all your apps.</p>
            <button
              onClick={closeAlwaysOnTop}
              className="rounded-full bg-brand-blue px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-blue/90"
            >
              Bring it back here
            </button>
          </div>
        )}
        {createPortal(panel, pipWindow.document.body)}
      </>
    );
  }

  return panel;
};

export default CalculatorShell;

// Shared button colours (theme-aware via CSS variables in index.css).
export const keyStyle = (kind: "op" | "fn" | "fin" | "num"): React.CSSProperties => {
  switch (kind) {
    case "op":
      return { backgroundColor: "var(--calc-op)", color: "var(--calc-op-text)" };
    case "fn":
      return { backgroundColor: "var(--calc-fn)", color: "var(--calc-fn-text)", fontWeight: "bold" };
    case "fin":
      return { backgroundColor: "var(--calc-fin)", color: "var(--calc-fin-text)", fontWeight: "bold" };
    default:
      return { backgroundColor: "var(--calc-key)", color: "var(--calc-key-text)" };
  }
};
