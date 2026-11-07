import React, { useState, useEffect } from "react";
import CalculatorShell, { keyStyle } from "@/components/calculator/CalculatorShell";
import { recordCalculation } from "@/lib/history";
import { evaluate } from "@/lib/evaluate";

interface ScientificCalculatorProps {
  input?: string;
  onInputChange?: (value: string) => void;
  onKeyboardInput?: (key: string) => void;
}

const buttons = [
  ["sin", "cos", "tan", "C", "⌫"],
  ["π", "e", "^", "√", "log"],
  ["(", ")", "%", "±", "/"],
  ["7", "8", "9", "x²", "*"],
  ["4", "5", "6", "x³", "-"],
  ["1", "2", "3", "EXP", "+"],
  ["0", ".", "×10^", "Ans", "="],
];

const FUNCTION_KEYS = ["sin", "cos", "tan", "π", "e", "^", "√", "log", "(", ")", "x²", "x³", "EXP", "×10^", "Ans"];
const OPERATOR_KEYS = ["C", "⌫", "%", "±", "/", "*", "-", "+", "="];

const keyMap: Record<string, string> = {
  Escape: "C",
  Backspace: "⌫",
  Delete: "C",
  "/": "/",
  "*": "*",
  "-": "-",
  "+": "+",
  ".": ".",
  "%": "%",
  "^": "^",
  "(": "(",
  ")": ")",
  s: "sin",
  c: "cos",
  t: "tan",
  l: "log",
  r: "√",
  p: "π",
  " ": ")", // Spacebar closes bracket
};

const formatResult = (result: number): string => {
  if (!Number.isFinite(result)) return "Error";
  if ((Math.abs(result) < 0.000001 && result !== 0) || Math.abs(result) > 1000000) {
    return result.toExponential(6);
  }
  return Number.isInteger(result) ? result.toString() : result.toFixed(8).replace(/\.?0+$/, "");
};

const ScientificCalculator: React.FC<ScientificCalculatorProps> = ({ input, onInputChange }) => {
  const [expression, setExpression] = useState<string>(input || "");

  useEffect(() => {
    if (input !== undefined) setExpression(input);
  }, [input]);

  const set = (value: string) => {
    setExpression(value);
    onInputChange?.(value);
  };

  const calculate = () => {
    try {
      // Trig functions take degrees (handled inside evaluate)
      const newValue = formatResult(evaluate(expression));
      recordCalculation("scientific", expression, newValue);
      set(newValue);
    } catch (error) {
      console.error("Scientific calculation error:", error);
      set("Error");
    }
  };

  const handleClick = (val: string) => {
    if (val === "C") {
      set("");
    } else if (val === "⌫") {
      set(expression.slice(0, -1));
    } else if (val === "=") {
      calculate();
    } else if (val === "x²" || val === "x³") {
      const num = parseFloat(expression);
      if (!isNaN(num)) {
        const newValue = (val === "x²" ? num * num : num * num * num).toString();
        recordCalculation("scientific", `${expression}${val === "x²" ? "²" : "³"}`, newValue);
        set(newValue);
      }
    } else if (val === "√") {
      set(expression + "sqrt(");
    } else if (["sin", "cos", "tan", "log", "ln"].includes(val)) {
      set(expression + val + "(");
    } else if (val === "(" || val === "π" || val === "e") {
      set(expression + val);
    } else if (expression === "Error") {
      set(val);
    } else {
      // Prevent multiple consecutive operators
      const operators = ["+", "-", "*", "/", "%", "^"];
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
      type="scientific"
      title="Scientific Calculator"
      width={350}
      defaultPosition={{ x: 150, y: 100 }}
      onKeyDown={handleKeyDown}
    >
      <div
        style={{
          padding: "1rem",
          textAlign: "right",
          fontSize: "1.8rem",
          fontWeight: 600,
          minHeight: "4rem",
          fontFamily: "monospace",
          overflowX: "auto",
          whiteSpace: "nowrap",
          backgroundColor: "var(--calc-display)",
          borderBottom: "1px solid var(--calc-border-soft)",
        }}
      >
        {expression || "0"}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "0.5rem",
          padding: "1rem",
          backgroundColor: "var(--calc-pad)",
        }}
      >
        {buttons.flat().map((val, idx) => (
          <button
            key={idx}
            onClick={() => handleClick(val)}
            style={{
              padding: "0.75rem 0.5rem",
              fontSize: "0.9rem",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              ...keyStyle(FUNCTION_KEYS.includes(val) ? "fn" : OPERATOR_KEYS.includes(val) ? "op" : "num"),
            }}
          >
            {val}
          </button>
        ))}
      </div>
    </CalculatorShell>
  );
};

export default ScientificCalculator;
