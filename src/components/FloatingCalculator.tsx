import React, { useState, useEffect } from "react";
import CalculatorShell, { keyStyle } from "@/components/calculator/CalculatorShell";
import { recordCalculation } from "@/lib/history";
import { evaluate } from "@/lib/evaluate";

interface FloatingCalculatorProps {
  input?: string;
  onInputChange?: (value: string) => void;
  onKeyboardInput?: (key: string) => void;
}

const OPERATOR_KEYS = ["C", "±", "%", "/", "*", "-", "+", "=", "⌫"];

const buttons = [
  ["C", "±", "%", "/"],
  ["7", "8", "9", "*"],
  ["4", "5", "6", "-"],
  ["1", "2", "3", "+"],
  ["0", ".", "⌫", "="],
];

const keyMap: Record<string, string> = {
  Escape: "C",
  Delete: "C",
  Backspace: "⌫",
  "/": "/",
  "*": "*",
  "-": "-",
  "+": "+",
  ".": ".",
  "%": "%",
};

// Format display to prevent overflow
const formatDisplay = (value: string): string => {
  if (value.length > 12) {
    const num = parseFloat(value);
    if (!isNaN(num)) return num.toExponential(6);
  }
  return value;
};

const FloatingCalculator: React.FC<FloatingCalculatorProps> = ({ input, onInputChange }) => {
  const [expression, setExpression] = useState<string>(input || "");
  const [showCursor, setShowCursor] = useState(true);
  // True right after "=": the next digit starts a new calculation
  const [justEvaluated, setJustEvaluated] = useState(false);

  // Blinking cursor
  useEffect(() => {
    const id = setInterval(() => setShowCursor((prev) => !prev), 800);
    return () => clearInterval(id);
  }, []);

  // Update local state when input prop changes
  useEffect(() => {
    if (input !== undefined) setExpression(input);
  }, [input]);

  const set = (value: string) => {
    setExpression(value);
    onInputChange?.(value);
  };

  const handleClick = (val: string) => {
    const wasResult = justEvaluated;
    setJustEvaluated(false);
    if (val === "C") {
      set("");
    } else if (val === "⌫") {
      set(expression === "Error" ? "" : expression.slice(0, -1));
    } else if (val === "±") {
      set(expression.charAt(0) === "-" ? expression.slice(1) : "-" + expression);
    } else if (val === "%") {
      const n = parseFloat(expression);
      set(isNaN(n) ? "Error" : (n / 100).toString());
    } else if (val === "=") {
      try {
        const result = evaluate(expression);
        const newValue = Number.isFinite(result)
          ? Number.isInteger(result)
            ? result.toString()
            : result.toFixed(10).replace(/\.?0+$/, "")
          : "Error";
        recordCalculation("basic", expression, newValue);
        set(newValue);
        setJustEvaluated(newValue !== "Error");
      } catch (error) {
        console.error("Calculation error:", error);
        set("Error");
      }
    } else if (expression === "Error" || (wasResult && /^[0-9.]$/.test(val))) {
      // After a result (or an error), typing a number starts fresh
      set(val === "." ? "0." : val);
    } else {
      // Prevent multiple consecutive operators
      const operators = ["+", "-", "*", "/", "%"];
      const lastChar = expression.slice(-1);
      if (operators.includes(val) && operators.includes(lastChar)) {
        set(expression.slice(0, -1) + val);
      } else {
        set(expression + val);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      handleClick("=");
      e.preventDefault();
    } else if (/^[0-9]$/.test(e.key) || e.key in keyMap) {
      handleClick(keyMap[e.key] || e.key);
      e.preventDefault();
    }
  };

  return (
    <CalculatorShell
      type="basic"
      title="Calculator"
      width={300}
      defaultPosition={{ x: 200, y: 100 }}
      onKeyDown={handleKeyDown}
    >
      {/* Display */}
      <div
        style={{
          padding: "1rem",
          fontSize: "1.5rem",
          borderBottom: "1px solid var(--calc-border-soft)",
          minHeight: "3.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          overflow: "hidden",
          whiteSpace: "nowrap",
          backgroundColor: "var(--calc-display)",
        }}
      >
        {formatDisplay(expression) || "0"}
        {showCursor ? "|" : ""}
      </div>

      {/* Buttons */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "0.5rem",
          padding: "1rem",
          backgroundColor: "var(--calc-pad)",
        }}
      >
        {buttons.flat().map((val, idx) => (
          <button
            key={idx}
            onClick={() => handleClick(val)}
            disabled={val === ""}
            aria-label={val === "⌫" ? "Backspace" : undefined}
            style={{
              padding: "1rem",
              fontSize: "1.1rem",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              opacity: val === "" ? 0 : 1,
              ...keyStyle(OPERATOR_KEYS.includes(val) ? "op" : "num"),
            }}
          >
            {val}
          </button>
        ))}
      </div>
    </CalculatorShell>
  );
};

export default FloatingCalculator;
