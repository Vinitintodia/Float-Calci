import React, { useState, useEffect } from "react";
import CalculatorShell, { keyStyle } from "@/components/calculator/CalculatorShell";
import { recordCalculation } from "@/lib/history";

interface FinancialCalculatorProps {
  input?: string;
  onInputChange?: (value: string) => void;
  onKeyboardInput?: (key: string) => void;
}

type Field = "principal" | "rate" | "time";

const buttons = [
  ["PV", "FV", "PMT", "C", "⌫"],
  ["n", "i%", "NPV", "IRR", "/"],
  ["7", "8", "9", "ROI", "*"],
  ["4", "5", "6", "Amort", "-"],
  ["1", "2", "3", "Tax", "+"],
  ["0", ".", "Cmpd", "Calc", "="],
];

const FINANCE_KEYS = ["PV", "FV", "PMT", "n", "i%", "NPV", "IRR", "ROI", "Amort", "Tax", "Cmpd", "Calc"];
const OPERATOR_KEYS = ["C", "⌫", "/", "*", "-", "+", "="];
const NEXT: Record<Field, Field> = { principal: "rate", rate: "time", time: "principal" };
const PREV: Record<Field, Field> = { principal: "time", rate: "principal", time: "rate" };

// Format currency to fit in calculator
const formatCurrency = (value: number): string => {
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(2)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
};

const FinancialCalculator: React.FC<FinancialCalculatorProps> = ({ onInputChange }) => {
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("");
  const [time, setTime] = useState("");
  const [result, setResult] = useState("");
  const [activeField, setActiveField] = useState<Field>("principal");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setShowCursor((prev) => !prev), 1000);
    return () => clearInterval(id);
  }, []);

  const setters: Record<Field, React.Dispatch<React.SetStateAction<string>>> = {
    principal: setPrincipal,
    rate: setRate,
    time: setTime,
  };
  const updateActive = (fn: (prev: string) => string) => setters[activeField](fn);

  // Compound interest: A = P(1 + r)^t
  const calculateResult = () => {
    const p = parseFloat(principal);
    const r = parseFloat(rate) / 100;
    const t = parseFloat(time);

    if (isNaN(p) || isNaN(r) || isNaN(t)) {
      setResult("Missing values");
      return;
    }

    const amount = p * Math.pow(1 + r, t);
    const interest = amount - p;
    const text = `${formatCurrency(amount)} (Int: ${formatCurrency(interest)})`;
    setResult(text);
    recordCalculation("financial", `Compound: P ${principal}, r ${rate}%, n ${time} yrs`, text);
  };

  const handleClick = (val: string) => {
    if (val === "C") {
      setPrincipal("");
      setRate("");
      setTime("");
      setResult("");
      onInputChange?.("");
    } else if (val === "⌫") {
      updateActive((prev) => prev.slice(0, -1));
    } else if (val === "=" || val === "Calc") {
      calculateResult();
    } else if (val === "PV" || val === "Cmpd") {
      setActiveField("principal");
    } else if (val === "i%") {
      setActiveField("rate");
    } else if (val === "n") {
      setActiveField("time");
    } else if (/^[0-9.]$/.test(val)) {
      updateActive((prev) => prev + val);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key;
    if (key === "ArrowUp" || key === "ArrowLeft") {
      setActiveField((f) => PREV[f]);
    } else if (key === "ArrowDown" || key === "ArrowRight" || key === "Tab") {
      setActiveField((f) => NEXT[f]);
    } else if (key === "Enter" || key === "=") {
      calculateResult();
    } else if (key === "Backspace") {
      updateActive((prev) => prev.slice(0, -1));
    } else if (key === "Escape" || key === "c" || key === "C") {
      updateActive(() => ""); // clear the active field
    } else if (/^[0-9.]$/.test(key)) {
      updateActive((prev) => prev + key);
    } else {
      return;
    }
    e.preventDefault();
  };

  const field = (name: Field, label: string, value: string, placeholder: string) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "0.25rem",
        alignItems: "center",
      }}
    >
      <label style={{ fontSize: "0.9rem", fontWeight: "bold" }}>{label}</label>
      <div
        onClick={() => setActiveField(name)}
        style={{
          padding: "0.5rem",
          border: activeField === name ? "2px solid var(--calc-op)" : "1px solid var(--calc-border)",
          borderRadius: 4,
          width: "60%",
          textAlign: "right",
          cursor: "pointer",
          background: activeField === name ? "var(--calc-field-active)" : "var(--calc-field)",
        }}
      >
        {value || placeholder}
        {activeField === name && showCursor ? "|" : ""}
      </div>
    </div>
  );

  return (
    <CalculatorShell
      type="financial"
      title="Financial Calculator"
      width={350}
      defaultPosition={{ x: 200, y: 100 }}
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
        {result || "0"}
      </div>

      <div
        style={{
          padding: "1rem",
          borderBottom: "1px solid var(--calc-border-soft)",
          backgroundColor: "var(--calc-pad)",
        }}
      >
        {field("principal", "Principal (PV):", principal, "$0")}
        {field("rate", "Rate (i%):", rate, "0%")}
        {field("time", "Time (n):", time, "0 years")}

        <div
          style={{
            marginTop: "0.75rem",
            padding: "0.75rem",
            background: "var(--calc-result-bg)",
            borderRadius: 8,
            textAlign: "right",
            fontWeight: "bold",
            fontSize: "1.2rem",
            color: "var(--calc-fin-text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {result || "Result will appear here"}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem", padding: "1rem" }}>
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
              ...keyStyle(FINANCE_KEYS.includes(val) ? "fin" : OPERATOR_KEYS.includes(val) ? "op" : "num"),
            }}
          >
            {val}
          </button>
        ))}
      </div>
    </CalculatorShell>
  );
};

export default FinancialCalculator;
