// Lets the page that shows a calculator decide how it behaves:
// floating + draggable on the website, or docked (filling the window) in the
// Chrome extension popup / floating window.
import { createContext, useContext } from "react";
import type { CalculatorType } from "@/lib/history";

export interface CalculatorHost {
  /** Fill the container instead of floating and dragging over the page. */
  docked: boolean;
  /** Red button. */
  requestClose: (type: CalculatorType) => void;
  /** Green button override. When missing, green = "float on top of all apps". */
  float?: () => void;
  floatLabel?: string;
  /** Called when the always-on-top window opens or closes. */
  onAlwaysOnTopChange?: (active: boolean) => void;
  /**
   * Take keyboard input as soon as it appears (default true). The demo
   * calculators embedded in the landing page set this to false, so they only
   * listen to the keyboard after you click them.
   */
  autoKeyboard?: boolean;
  /** Tighter layout for small spaces (the Chrome toolbar popup is max 600px tall). */
  compact?: boolean;
  /** Hide the window title bar (the page overlay draws its own draggable bar). */
  hideTitleBar?: boolean;
  /** Open straight into the always-on-top window (must follow a click). */
  startAlwaysOnTop?: boolean;
}

const defaultHost: CalculatorHost = {
  docked: false,
  // Keeps the original behaviour: the page listens for this event.
  requestClose: (type) => window.dispatchEvent(new CustomEvent("closeCalculator", { detail: type })),
};

export const CalculatorHostContext = createContext<CalculatorHost>(defaultHost);
export const useCalculatorHost = () => useContext(CalculatorHostContext);
