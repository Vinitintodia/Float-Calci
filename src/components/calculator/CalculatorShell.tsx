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
  const [offset, setOffset] = useState(defaultPosition);
  const calcRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  useThemeOn(pipWindow?.document ?? null);

  const docked = host.docked || !!pipWindow;

  // ---- Keyboard: always call the latest handler, on the right window -----
  const keyHandler = useRef(onKeyDown);
  keyHandler.current = onKeyDown;

  useEffect(() => {
    const target: Window = pipWindow ?? window;
    const listener = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      // Don't type into the calculator while a dialog (e.g. save prompt) is open.
      if (!pipWindow && document.querySelector('[role="dialog"]')) return;
      keyHandler.current?.(e);
    };
    target.addEventListener("keydown", listener);
    return () => target.removeEventListener("keydown", listener);
  }, [pipWindow]);

  // ---- Dragging (website only) -------------------------------------------
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragStart.current) return;
      const w = calcRef.current?.offsetWidth ?? width;
      const h = calcRef.current?.offsetHeight ?? 400;
      setOffset({
        x: Math.max(0, Math.min(e.clientX - dragStart.current.x, window.innerWidth - w)),
        y: Math.max(0, Math.min(e.clientY - dragStart.current.y, window.innerHeight - h)),
      });
    };
    const up = () => (dragStart.current = null);
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
    return () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
    };
  }, [width]);

  const startDrag = (e: React.PointerEvent) => {
    if (docked) return;
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
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
  const faded = !docked && !isHovered;

  const panel = (
    <div
      ref={calcRef}
      data-calculator={type}
      style={{
        ...(docked
          ? { position: "relative", width: "100%" }
          : { position: "fixed", top: offset.y, left: offset.x, width, zIndex: 1000 }),
        borderRadius: pipWindow ? 0 : 16,
        boxShadow: pipWindow ? "none" : "var(--calc-shadow)",
        backgroundColor: "var(--calc-surface)",
        color: "var(--calc-text)",
        userSelect: "none",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        opacity: faded ? 0.7 : 1,
        transition: "opacity 0.3s ease, background-color 0.3s ease",
        overflow: "hidden",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Title bar */}
      <div
        style={{
          padding: "0.75rem 1rem",
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
