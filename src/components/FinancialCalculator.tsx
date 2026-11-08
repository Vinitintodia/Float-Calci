// Financial calculator with the workflow of exam financial calculators:
// TVM keys + CPT, 2ND functions, and CF / NPV / IRR / AMORT / BOND / ICONV / Δ% worksheets.
// The keystroke logic lives in src/lib/finCalc.ts; this file is the screen and the keys.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CalculatorShell from "@/components/calculator/CalculatorShell";
import { useCalculatorHost } from "@/components/calculator/CalculatorHost";
import { recordCalculation } from "@/lib/history";
import { storage } from "@/lib/storage";
import {
  CURRENCIES,
  formatCompact,
  formatEntry,
  formatMoney,
  formatNumber,
  formatWords,
  getCurrency,
  type Decimals,
} from "@/lib/currency";
import {
  SECOND,
  TVM_LABEL,
  WORKSHEET_NAME,
  fromSaved,
  jumpTo,
  press,
  toSaved,
  view,
  type FinState,
  type FormatCtx,
  type KeyId,
  type SavedRegisters,
} from "@/lib/finCalc";

interface FinancialCalculatorProps {
  input?: string;
  onInputChange?: (value: string) => void;
  onKeyboardInput?: (key: string) => void;
}

// ---- Keys --------------------------------------------------------------------

type KeyKind = "second" | "cpt" | "ctl" | "tvm" | "ws" | "fn" | "num" | "op";

interface KeyDef {
  id: KeyId;
  label: string;
  second?: string;
  kind: KeyKind;
  kbd?: string; // keyboard shortcut shown in the tooltip
}

const KEYS: KeyDef[][] = [
  [
    { id: "2ND", label: "2ND", kind: "second", kbd: "S" },
    { id: "CPT", label: "CPT", second: "QUIT", kind: "cpt", kbd: "C" },
    { id: "ENTER", label: "ENTER", second: "SET", kind: "ctl", kbd: "Enter" },
    { id: "UP", label: "↑", second: "DEL", kind: "ctl", kbd: "↑" },
    { id: "DOWN", label: "↓", second: "INS", kind: "ctl", kbd: "↓" },
  ],
  [
    { id: "N", label: "N", second: "xP/Y", kind: "tvm", kbd: "N" },
    { id: "IY", label: "I/Y", second: "P/Y", kind: "tvm", kbd: "I" },
    { id: "PV", label: "PV", second: "AMORT", kind: "tvm", kbd: "P" },
    { id: "PMT", label: "PMT", second: "BGN", kind: "tvm", kbd: "M" },
    { id: "FV", label: "FV", second: "CLR TVM", kind: "tvm", kbd: "F" },
  ],
  [
    { id: "CF", label: "CF", kind: "ws" },
    { id: "NPV", label: "NPV", kind: "ws" },
    { id: "IRR", label: "IRR", kind: "ws" },
    { id: "BOND", label: "BOND", kind: "ws" },
    { id: "BKSP", label: "⌫", kind: "ctl", kbd: "Backspace" },
  ],
  [
    { id: "STO", label: "STO", kind: "fn" },
    { id: "RCL", label: "RCL", kind: "fn" },
    { id: "PCT", label: "%", second: "ICONV", kind: "fn", kbd: "%" },
    { id: "DELTA", label: "Δ%", kind: "ws" },
    { id: "DIV", label: "÷", kind: "op", kbd: "/" },
  ],
  [
    { id: "7", label: "7", kind: "num" },
    { id: "8", label: "8", kind: "num" },
    { id: "9", label: "9", kind: "num" },
    { id: "POW", label: "yˣ", second: "eˣ", kind: "fn", kbd: "^" },
    { id: "MUL", label: "×", kind: "op", kbd: "*" },
  ],
  [
    { id: "4", label: "4", kind: "num" },
    { id: "5", label: "5", kind: "num" },
    { id: "6", label: "6", kind: "num" },
    { id: "SQRT", label: "√x", second: "x²", kind: "fn" },
    { id: "SUB", label: "−", kind: "op", kbd: "-" },
  ],
  [
    { id: "1", label: "1", kind: "num" },
    { id: "2", label: "2", kind: "num" },
    { id: "3", label: "3", kind: "num" },
    { id: "INV", label: "1/x", second: "LN", kind: "fn" },
    { id: "ADD", label: "+", kind: "op", kbd: "+" },
  ],
  [
    { id: "CEC", label: "CE/C", second: "CLR WORK", kind: "ctl", kbd: "Esc" },
    { id: "0", label: "0", kind: "num" },
    { id: "DOT", label: ".", kind: "num" },
    { id: "NEG", label: "+/−", second: "RESET", kind: "fn" },
    { id: "EQ", label: "=", kind: "op", kbd: "=" },
  ],
];

const KIND_STYLE: Record<KeyKind, React.CSSProperties> = {
  second: { background: "var(--calc-2nd)", color: "var(--calc-2nd-text)", fontWeight: 700 },
  cpt: { background: "var(--calc-cpt)", color: "var(--calc-cpt-text)", fontWeight: 700 },
  ctl: { background: "var(--calc-ctl)", color: "var(--calc-ctl-text)", fontWeight: 600 },
  tvm: { background: "var(--calc-fin)", color: "var(--calc-fin-text)", fontWeight: 700 },
  ws: { background: "var(--calc-fn)", color: "var(--calc-fn-text)", fontWeight: 700 },
  fn: { background: "var(--calc-ctl)", color: "var(--calc-ctl-text)", fontWeight: 600 },
  num: { background: "var(--calc-key)", color: "var(--calc-key-text)", fontWeight: 500, fontSize: "1.05rem" },
  op: { background: "var(--calc-op)", color: "var(--calc-op-text)", fontWeight: 600, fontSize: "1.05rem" },
};

// Physical keyboard -> calculator key
const KEYBOARD: Record<string, KeyId> = {
  "+": "ADD",
  "-": "SUB",
  "*": "MUL",
  x: "MUL",
  "/": "DIV",
  "^": "POW",
  "=": "EQ",
  ".": "DOT",
  ",": "DOT",
  "%": "PCT",
  Backspace: "BKSP",
  Escape: "CEC",
  Delete: "CEC",
  ArrowUp: "UP",
  ArrowDown: "DOWN",
  n: "N",
  i: "IY",
  p: "PV",
  m: "PMT",
  f: "FV",
  c: "CPT",
  s: "2ND",
};

// ---- Settings ------------------------------------------------------------------

interface Settings {
  currency: string;
  decimals: Decimals;
}

const SETTINGS_KEY = "floatcalci:fin:settings";
const REGISTERS_KEY = "floatcalci:fin:registers";
const DECIMAL_OPTIONS: { value: Decimals; label: string }[] = [
  { value: 0, label: "0 dp" },
  { value: 2, label: "2 dp" },
  { value: 4, label: "4 dp" },
  { value: 6, label: "6 dp" },
  { value: "F", label: "Float" },
];

const selectStyle: React.CSSProperties = {
  background: "var(--calc-field)",
  color: "var(--calc-text)",
  border: "1px solid var(--calc-border)",
  borderRadius: 6,
  fontSize: "0.75rem",
  padding: "0.2rem 0.35rem",
  cursor: "pointer",
};

// ---- Component ------------------------------------------------------------------

const FinancialCalculator: React.FC<FinancialCalculatorProps> = () => {
  const [state, setState] = useState<FinState>(() => fromSaved(null));
  const [settings, setSettings] = useState<Settings>({ currency: "INR", decimals: 2 });
  const loaded = useRef(false);
  const compact = !!useCalculatorHost().compact;

  // Load the saved registers and settings once ("continuous memory")
  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      storage.get<Partial<SavedRegisters> | null>(REGISTERS_KEY, null),
      storage.get<Settings | null>(SETTINGS_KEY, null),
    ]).then(([regs, saved]) => {
      if (cancelled) return;
      setState(fromSaved(regs));
      if (saved) setSettings(saved);
      loaded.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Save registers whenever they change
  const savedJson = JSON.stringify(toSaved(state));
  useEffect(() => {
    if (loaded.current) void storage.set(REGISTERS_KEY, JSON.parse(savedJson));
  }, [savedJson]);

  const updateSettings = (next: Partial<Settings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...next };
      void storage.set(SETTINGS_KEY, merged);
      return merged;
    });
  };

  const currency = getCurrency(settings.currency);
  const ctx: FormatCtx = useMemo(
    () => ({
      money: (v) => formatMoney(v, currency, settings.decimals),
      num: (v) => formatNumber(v, settings.decimals),
    }),
    [currency, settings.decimals],
  );

  // Keep the latest state/ctx in a ref so key presses never use stale values
  const latest = useRef({ state, ctx });
  latest.current = { state, ctx };

  const pressKey = useCallback((key: KeyId) => {
    const { state: s, ctx: c } = latest.current;
    const r = press(s, key, c);
    latest.current.state = r.state;
    setState(r.state);
    if (r.record) recordCalculation("financial", r.record.expression, r.record.result);
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    let key: KeyId | undefined;
    if (/^[0-9]$/.test(e.key)) key = e.key as KeyId;
    else if (e.key === "Enter") key = latest.current.state.ws ? "ENTER" : "EQ";
    else key = KEYBOARD[e.key] ?? KEYBOARD[e.key.toLowerCase()];
    if (key) {
      e.preventDefault();
      pressKey(key);
    }
  };

  const d = view(state, ctx, formatEntry);
  const words = d.moneyValue !== null ? formatWords(d.moneyValue, currency) : "";
  const text =
    d.typing && d.format === "money" && currency.symbol
      ? d.text.startsWith("−")
        ? `−${currency.symbol}${d.text.slice(1)}`
        : `${currency.symbol}${d.text}`
      : d.text;
  const isError = d.label === "Error";

  const tvm = state.tvm;

  return (
    <CalculatorShell
      type="financial"
      title="Financial Calculator"
      width={380}
      defaultPosition={{ x: 200, y: 80 }}
      onKeyDown={handleKeyDown}
    >
      <div style={{ padding: compact ? "0.45rem 0.6rem 0.6rem" : "0.6rem 0.75rem 0.75rem", background: "var(--calc-pad)" }}>
        {/* Settings */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
          <select
            aria-label="Currency"
            value={currency.code}
            onChange={(e) => updateSettings({ currency: e.target.value })}
            style={selectStyle}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code === "NONE" ? "No currency" : `${c.symbol.trim()} ${c.code}`}
              </option>
            ))}
          </select>
          <select
            aria-label="Decimal places"
            value={String(settings.decimals)}
            onChange={(e) => updateSettings({ decimals: e.target.value === "F" ? "F" : (Number(e.target.value) as Decimals) })}
            style={selectStyle}
          >
            {DECIMAL_OPTIONS.map((o) => (
              <option key={String(o.value)} value={String(o.value)}>
                {o.label}
              </option>
            ))}
          </select>
          <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "var(--calc-title-text)" }}>
            {d.worksheet ? WORKSHEET_NAME[d.worksheet] : "Standard"}
          </span>
        </div>

        {/* LCD */}
        <div
          data-testid="fin-display"
          title={d.hint}
          style={{
            background: "var(--calc-lcd)",
            color: "var(--calc-lcd-text)",
            border: "1px solid var(--calc-lcd-border)",
            borderRadius: 10,
            padding: "0.4rem 0.6rem 0.45rem",
            fontVariantNumeric: "tabular-nums",
            boxShadow: "inset 0 2px 6px rgba(0,0,0,0.12)",
          }}
        >
          <div style={{ display: "flex", gap: 6, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.04em", minHeight: 14 }}>
            <Indicator on={state.second}>2ND</Indicator>
            <Indicator on={state.cpt}>COMPUTE</Indicator>
            <Indicator on={!!state.memOp}>{state.memOp ?? "STO"}</Indicator>
            <Indicator on={tvm.BGN}>BGN</Indicator>
            <span style={{ marginLeft: "auto", opacity: 0.75 }}>
              P/Y {formatNumber(tvm.PY, "F")}
              {tvm.CY !== tvm.PY ? ` · C/Y ${formatNumber(tvm.CY, "F")}` : ""}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 8, minHeight: compact ? 32 : 38 }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, minWidth: 44, whiteSpace: "nowrap" }}>
              {d.label ? `${d.label}${isError || d.label === "RST?" ? "" : "="}` : ""}
            </span>
            <span
              data-testid="fin-value"
              style={{
                flex: 1,
                textAlign: "right",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                fontSize: isError || text.length > 16 ? "1rem" : text.length > 12 ? "1.35rem" : "1.7rem",
                fontWeight: 600,
                whiteSpace: isError ? "normal" : "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {text}
            </span>
            <span style={{ width: 10, fontWeight: 700, opacity: d.computed ? 1 : 0 }} title="Computed">
              *
            </span>
          </div>

          <div style={{ fontSize: "0.7rem", textAlign: "right", minHeight: 14, opacity: 0.8 }}>{words}</div>
        </div>

        {/* Hint (a tooltip on the display in the compact popup layout) */}
        {compact ? (
          <div style={{ height: 6 }} />
        ) : (
          <p style={{ fontSize: "0.7rem", color: "var(--calc-title-text)", margin: "0.35rem 0.1rem", minHeight: 16, lineHeight: 1.3 }}>
            {d.hint}
          </p>
        )}

        {/* Registers (standard) or worksheet variables */}
        {d.worksheet ? (
          <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 2, marginBottom: 6 }}>
            {d.vars.map((v, i) => (
              <button
                key={`${v.label}-${i}`}
                onClick={() => setState((s) => jumpTo(s, i))}
                style={{
                  flexShrink: 0,
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  padding: "0.2rem 0.45rem",
                  borderRadius: 999,
                  border: "1px solid var(--calc-border)",
                  background: v.active ? "var(--calc-op)" : "var(--calc-field)",
                  color: v.active ? "var(--calc-op-text)" : "var(--calc-text)",
                  cursor: "pointer",
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, marginBottom: 6 }}>
            {(["N", "IY", "PV", "PMT", "FV"] as const).map((k) => {
              const money = k === "PV" || k === "PMT" || k === "FV";
              return (
                <button
                  key={k}
                  title={`Recall ${TVM_LABEL[k]}`}
                  onClick={() => {
                    pressKey("RCL");
                    pressKey(k);
                  }}
                  style={{
                    border: "1px solid var(--calc-border)",
                    background: d.label === TVM_LABEL[k] ? "var(--calc-field-active)" : "var(--calc-field)",
                    color: "var(--calc-text)",
                    borderRadius: 6,
                    padding: "0.15rem 0.2rem",
                    cursor: "pointer",
                    lineHeight: 1.15,
                    minWidth: 0,
                  }}
                >
                  <div style={{ fontSize: "0.6rem", color: "var(--calc-title-text)", fontWeight: 700 }}>{TVM_LABEL[k]}</div>
                  <div style={{ fontSize: "0.7rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {formatCompact(tvm[k], money ? currency : undefined)}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Keypad */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: compact ? 4 : 5 }}>
          {KEYS.flat().map((k) => {
            const showSecond = state.second && !!SECOND[k.id];
            const dim = state.second && !SECOND[k.id] && k.id !== "2ND";
            const tooltip = [k.second ? `${k.label} · 2ND: ${k.second}` : k.label, k.kbd ? `(key: ${k.kbd})` : ""].join(" ");
            return (
              <button
                key={k.id}
                onClick={() => pressKey(k.id)}
                title={tooltip.trim()}
                aria-label={showSecond ? k.second : k.label}
                aria-pressed={k.id === "2ND" ? state.second : undefined}
                style={{
                  ...KIND_STYLE[k.kind],
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  height: compact ? 35 : 42,
                  padding: "2px 2px 0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1.05,
                  opacity: dim ? 0.45 : 1,
                  boxShadow: k.id === "2ND" && state.second ? "0 0 0 2px var(--calc-text) inset" : "0 1px 0 rgba(0,0,0,0.08)",
                  transition: "opacity 0.15s",
                  fontSize: KIND_STYLE[k.kind].fontSize ?? (k.label.length > 3 ? "0.72rem" : "0.85rem"),
                }}
              >
                {k.second && (
                  <span
                    style={{
                      fontSize: showSecond ? "0.72rem" : "0.55rem",
                      fontWeight: 700,
                      color: showSecond ? "inherit" : "var(--calc-2nd-label)",
                      order: showSecond ? 1 : 0,
                      opacity: showSecond ? 1 : 0.95,
                      letterSpacing: "0.02em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {k.second}
                  </span>
                )}
                <span style={showSecond ? { fontSize: "0.55rem", opacity: 0.6, order: 2 } : undefined}>{k.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </CalculatorShell>
  );
};

const Indicator: React.FC<{ on: boolean; children: React.ReactNode }> = ({ on, children }) => (
  <span style={{ opacity: on ? 1 : 0.15 }}>{children}</span>
);

export default FinancialCalculator;
