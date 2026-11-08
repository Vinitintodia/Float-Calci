// Keystroke engine for the financial calculator.
//
// It follows the workflow of exam financial calculators:
//   * Type a number, press N / I/Y / PV / PMT / FV to store it.
//   * Press CPT, then one of those keys, to compute it.
//   * 2ND gives each key its second function (P/Y, AMORT, BGN, CLR TVM, ...).
//   * Worksheets (CF, NPV, IRR, AMORT, BOND, ICONV, Δ%, P/Y, BGN) are lists of
//     variables: ↑ ↓ to move, type + ENTER to set, CPT to compute.
//   * Arithmetic is chained left to right, like those calculators ("Chn" mode).
//
// press(state, key, ctx) is a pure function, so key sequences can be unit-tested.
import {
  amortize,
  bondDuration,
  bondPrice,
  bondYield,
  effectiveRate,
  irr,
  nfv,
  nominalRate,
  npv,
  payback,
  percentChange,
  solveTVM,
  type Bond,
  type CashFlow,
  type TVM,
  type TvmKey,
} from "./finance";

// ---- Keys ----------------------------------------------------------------------

export type KeyId =
  | "2ND" | "CPT" | "ENTER" | "UP" | "DOWN"
  | "N" | "IY" | "PV" | "PMT" | "FV"
  | "CF" | "NPV" | "IRR" | "BOND" | "BKSP"
  | "STO" | "RCL" | "PCT" | "DELTA" | "DIV"
  | "7" | "8" | "9" | "POW" | "MUL"
  | "4" | "5" | "6" | "SQRT" | "SUB"
  | "1" | "2" | "3" | "INV" | "ADD"
  | "CEC" | "0" | "DOT" | "NEG" | "EQ";

type SecondAction =
  | "SET" | "DEL" | "INS" | "QUIT" | "xPY" | "PY" | "AMORT" | "BGN" | "CLRTVM"
  | "ICONV" | "EXP" | "SQ" | "LN" | "CLRWORK" | "RESET";

type Action = KeyId | SecondAction;

/** What each key does after 2ND. */
export const SECOND: Partial<Record<KeyId, SecondAction>> = {
  ENTER: "SET",
  UP: "DEL",
  DOWN: "INS",
  CPT: "QUIT",
  N: "xPY",
  IY: "PY",
  PV: "AMORT",
  PMT: "BGN",
  FV: "CLRTVM",
  PCT: "ICONV",
  POW: "EXP",
  SQRT: "SQ",
  INV: "LN",
  CEC: "CLRWORK",
  NEG: "RESET",
};

type Op = "ADD" | "SUB" | "MUL" | "DIV" | "POW";
const OP_SYMBOL: Record<Op, string> = { ADD: "+", SUB: "−", MUL: "×", DIV: "÷", POW: "^" };
const TVM_KEYS: TvmKey[] = ["N", "IY", "PV", "PMT", "FV"];
export const TVM_LABEL: Record<TvmKey, string> = { N: "N", IY: "I/Y", PV: "PV", PMT: "PMT", FV: "FV" };
const MONEY_TVM: TvmKey[] = ["PV", "PMT", "FV"];

export type WorksheetId = "CF" | "NPV" | "IRR" | "AMORT" | "BGN" | "PY" | "BOND" | "ICONV" | "DELTA";

export const WORKSHEET_NAME: Record<WorksheetId, string> = {
  CF: "Cash flows",
  NPV: "NPV",
  IRR: "IRR",
  AMORT: "Amortization",
  BGN: "Payment timing",
  PY: "Payments per year",
  BOND: "Bond",
  ICONV: "Interest conversion",
  DELTA: "Percent change",
};

// ---- State -----------------------------------------------------------------------

export interface FinState {
  // Registers (kept between sessions, like a real calculator's memory)
  tvm: TVM;
  cf0: number;
  flows: CashFlow[];
  npvI: number;
  p1: number;
  p2: number;
  bond: Bond & { yld: number; pri: number };
  iconv: { nom: number; eff: number; cy: number };
  delta: { old: number; new: number; pct: number; pd: number };
  results: Record<string, number>; // NPV, NFV, PB, DPB, IRR
  mem: number[];

  // Display / keystroke state
  x: number;
  entry: string | null; // what the user is typing
  label: string | null; // e.g. "PV" or "C01"
  computed: boolean; // value was computed (shown with *)
  second: boolean;
  cpt: boolean;
  memOp: "STO" | "RCL" | null;
  pending: { acc: number; op: Op; expr: string } | null;
  fresh: boolean; // a new operand is on the display since the last operator
  ws: WorksheetId | null;
  idx: number;
  error: string | null;
  confirmReset: boolean;
}

const defaults = () => ({
  tvm: { N: 0, IY: 0, PV: 0, PMT: 0, FV: 0, PY: 1, CY: 1, BGN: false } as TVM,
  cf0: 0,
  flows: [] as CashFlow[],
  npvI: 0,
  p1: 1,
  p2: 1,
  bond: { rv: 100, cpn: 0, yrs: 0, freq: 2 as const, yld: 0, pri: 0 },
  iconv: { nom: 0, eff: 0, cy: 1 },
  delta: { old: 0, new: 0, pct: 0, pd: 1 },
  results: {} as Record<string, number>,
  mem: Array<number>(10).fill(0),
});

export const initialState = (): FinState => ({
  ...defaults(),
  x: 0,
  entry: null,
  label: null,
  computed: false,
  second: false,
  cpt: false,
  memOp: null,
  pending: null,
  fresh: true,
  ws: null,
  idx: 0,
  error: null,
  confirmReset: false,
});

const PERSISTED = ["tvm", "cf0", "flows", "npvI", "p1", "p2", "bond", "iconv", "delta", "results", "mem"] as const;
export type SavedRegisters = Pick<FinState, (typeof PERSISTED)[number]>;

export const toSaved = (s: FinState): SavedRegisters =>
  Object.fromEntries(PERSISTED.map((k) => [k, s[k]])) as SavedRegisters;

export const fromSaved = (saved: Partial<SavedRegisters> | null | undefined): FinState => {
  const base = initialState();
  if (!saved) return base;
  return {
    ...base,
    ...saved,
    tvm: { ...base.tvm, ...saved.tvm },
    bond: { ...base.bond, ...saved.bond },
    iconv: { ...base.iconv, ...saved.iconv },
    delta: { ...base.delta, ...saved.delta },
    mem: saved.mem?.length === 10 ? saved.mem : base.mem,
  };
};

/** Multiply every money amount (TVM PV/PMT/FV, cash flows) by a rate. */
export const scaleMoney = (s: FinState, rate: number): FinState => ({
  ...s,
  tvm: { ...s.tvm, PV: s.tvm.PV * rate, PMT: s.tvm.PMT * rate, FV: s.tvm.FV * rate },
  cf0: s.cf0 * rate,
  flows: s.flows.map((f) => ({ ...f, c: f.c * rate })),
});

// ---- Formatting context (the UI passes currency-aware formatters) -----------------

export interface FormatCtx {
  money: (v: number) => string;
  num: (v: number) => string;
}

export interface Recorded {
  expression: string;
  result: string;
}

export type Format = "money" | "num" | "int" | "pct" | "toggle";

// ---- Worksheet variables ------------------------------------------------------------

interface WsVar {
  id: string;
  label: string;
  /** input: type + ENTER · compute: CPT · both: either · auto: always calculated · toggle: SET */
  kind: "input" | "compute" | "both" | "auto" | "toggle";
  format: Format;
  get: (s: FinState) => number;
  set?: (s: FinState, v: number) => FinState;
  compute?: (s: FinState) => number;
  toggleText?: (s: FinState) => string;
  toggle?: (s: FinState) => FinState;
  hint?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

const cfVars = (s: FinState): WsVar[] => {
  const vars: WsVar[] = [
    {
      id: "CF0",
      label: "CF0",
      kind: "input",
      format: "money",
      get: (st) => st.cf0,
      set: (st, v) => ({ ...st, cf0: v }),
      hint: "Initial cash flow (investment = negative)",
    },
  ];
  s.flows.forEach((_, j) => {
    const n = pad(j + 1);
    vars.push({
      id: `C${n}`,
      label: `C${n}`,
      kind: "input",
      format: "money",
      get: (st) => st.flows[j]?.c ?? 0,
      set: (st, v) => ({ ...st, flows: st.flows.map((f, k) => (k === j ? { ...f, c: v } : f)) }),
      hint: `Cash flow ${j + 1}`,
    });
    vars.push({
      id: `F${n}`,
      label: `F${n}`,
      kind: "input",
      format: "int",
      get: (st) => st.flows[j]?.f ?? 1,
      set: (st, v) => ({
        ...st,
        flows: st.flows.map((f, k) => (k === j ? { ...f, f: Math.min(999, Math.max(1, Math.round(v))) } : f)),
      }),
      hint: `How many times C${n} repeats`,
    });
  });
  if (s.flows.length < 32) {
    const n = pad(s.flows.length + 1);
    vars.push({
      id: `C${n}`,
      label: `C${n}`,
      kind: "input",
      format: "money",
      get: () => 0,
      set: (st, v) => ({ ...st, flows: [...st.flows, { c: v, f: 1 }] }),
      hint: "Next cash flow",
    });
  }
  return vars;
};

const amortVar = (id: "BAL" | "PRN" | "INT", hint: string): WsVar => ({
  id,
  label: id,
  kind: "auto",
  format: "money",
  get: (s) => amortize(s.tvm, s.p1, s.p2)[id],
  compute: (s) => amortize(s.tvm, s.p1, s.p2)[id],
  hint,
});

const deltaVar = (id: "old" | "new" | "pct" | "pd", label: string, format: Format, hint: string): WsVar => ({
  id: label,
  label,
  kind: "both",
  format,
  get: (s) => s.delta[id],
  set: (s, v) => ({ ...s, delta: { ...s.delta, [id]: v } }),
  compute: (s) => {
    const d = s.delta;
    if (id === "pct") return percentChange.pct(d.old, d.new, d.pd);
    if (id === "new") return percentChange.new(d.old, d.pct, d.pd);
    if (id === "old") return percentChange.old(d.new, d.pct, d.pd);
    return percentChange.pd(d.old, d.new, d.pct);
  },
  hint,
});

const result = (id: string, format: Format, fn: (s: FinState) => number, hint: string): WsVar => ({
  id,
  label: id,
  kind: "compute",
  format,
  get: (s) => s.results[id] ?? 0,
  compute: fn,
  hint,
});

export const worksheetVars = (ws: WorksheetId, s: FinState): WsVar[] => {
  switch (ws) {
    case "CF":
      return cfVars(s);
    case "NPV":
      return [
        {
          id: "I",
          label: "I",
          kind: "input",
          format: "pct",
          get: (st) => st.npvI,
          set: (st, v) => ({ ...st, npvI: v }),
          hint: "Discount rate per period, %",
        },
        result("NPV", "money", (st) => npv(st.npvI, st.cf0, st.flows), "Net present value"),
        result("NFV", "money", (st) => nfv(st.npvI, st.cf0, st.flows), "Net future value"),
        result("PB", "num", (st) => payback(st.cf0, st.flows), "Payback period"),
        result("DPB", "num", (st) => payback(st.cf0, st.flows, st.npvI), "Discounted payback"),
      ];
    case "IRR":
      return [result("IRR", "pct", (st) => irr(st.cf0, st.flows), "Internal rate of return, %")];
    case "AMORT":
      return [
        {
          id: "P1",
          label: "P1",
          kind: "input",
          format: "int",
          get: (st) => st.p1,
          set: (st, v) => ({ ...st, p1: Math.max(1, Math.round(v)) }),
          hint: "First payment in the range",
        },
        {
          id: "P2",
          label: "P2",
          kind: "input",
          format: "int",
          get: (st) => st.p2,
          set: (st, v) => ({ ...st, p2: Math.max(1, Math.round(v)) }),
          hint: "Last payment in the range",
        },
        amortVar("BAL", "Balance left after P2"),
        amortVar("PRN", "Principal paid, P1 to P2"),
        amortVar("INT", "Interest paid, P1 to P2"),
      ];
    case "BGN":
      return [
        {
          id: "TIMING",
          label: "TIMING",
          kind: "toggle",
          format: "toggle",
          get: (st) => (st.tvm.BGN ? 1 : 0),
          toggleText: (st) => (st.tvm.BGN ? "BGN" : "END"),
          toggle: (st) => ({ ...st, tvm: { ...st.tvm, BGN: !st.tvm.BGN } }),
          hint: "END = payments at period end, BGN = at the start",
        },
      ];
    case "PY":
      return [
        {
          id: "P/Y",
          label: "P/Y",
          kind: "input",
          format: "num",
          get: (st) => st.tvm.PY,
          set: (st, v) => (v > 0 ? { ...st, tvm: { ...st.tvm, PY: v, CY: v } } : st),
          hint: "Payments per year (also sets C/Y)",
        },
        {
          id: "C/Y",
          label: "C/Y",
          kind: "input",
          format: "num",
          get: (st) => st.tvm.CY,
          set: (st, v) => (v > 0 ? { ...st, tvm: { ...st.tvm, CY: v } } : st),
          hint: "Compounding periods per year",
        },
      ];
    case "BOND": {
      const b = (st: FinState) => st.bond;
      return [
        {
          id: "RV",
          label: "RV",
          kind: "input",
          format: "num",
          get: (st) => b(st).rv,
          set: (st, v) => ({ ...st, bond: { ...st.bond, rv: v } }),
          hint: "Redemption (face) value, usually 100",
        },
        {
          id: "CPN",
          label: "CPN",
          kind: "input",
          format: "pct",
          get: (st) => b(st).cpn,
          set: (st, v) => ({ ...st, bond: { ...st.bond, cpn: v } }),
          hint: "Annual coupon rate, %",
        },
        {
          id: "YRS",
          label: "YRS",
          kind: "input",
          format: "num",
          get: (st) => b(st).yrs,
          set: (st, v) => ({ ...st, bond: { ...st.bond, yrs: v } }),
          hint: "Years to maturity",
        },
        {
          id: "FREQ",
          label: "FREQ",
          kind: "toggle",
          format: "toggle",
          get: (st) => b(st).freq,
          toggleText: (st) => (b(st).freq === 2 ? "2/Y" : "1/Y"),
          toggle: (st) => ({ ...st, bond: { ...st.bond, freq: st.bond.freq === 2 ? 1 : 2 } }),
          hint: "Coupons per year",
        },
        {
          id: "YLD",
          label: "YLD",
          kind: "both",
          format: "pct",
          get: (st) => b(st).yld,
          set: (st, v) => ({ ...st, bond: { ...st.bond, yld: v } }),
          compute: (st) => bondYield(st.bond, st.bond.pri),
          hint: "Yield to maturity, % (enter, or CPT from PRI)",
        },
        {
          id: "PRI",
          label: "PRI",
          kind: "both",
          format: "num",
          get: (st) => b(st).pri,
          set: (st, v) => ({ ...st, bond: { ...st.bond, pri: v } }),
          compute: (st) => bondPrice(st.bond, st.bond.yld),
          hint: "Price per RV (enter, or CPT from YLD)",
        },
        {
          id: "DUR",
          label: "DUR",
          kind: "auto",
          format: "num",
          get: (st) => bondDuration(st.bond, st.bond.yld).macaulay,
          compute: (st) => bondDuration(st.bond, st.bond.yld).macaulay,
          hint: "Macaulay duration, years",
        },
        {
          id: "MDUR",
          label: "MDUR",
          kind: "auto",
          format: "num",
          get: (st) => bondDuration(st.bond, st.bond.yld).modified,
          compute: (st) => bondDuration(st.bond, st.bond.yld).modified,
          hint: "Modified duration, years",
        },
      ];
    }
    case "ICONV":
      return [
        {
          id: "NOM",
          label: "NOM",
          kind: "both",
          format: "pct",
          get: (st) => st.iconv.nom,
          set: (st, v) => ({ ...st, iconv: { ...st.iconv, nom: v } }),
          compute: (st) => nominalRate(st.iconv.eff, st.iconv.cy),
          hint: "Nominal annual rate, %",
        },
        {
          id: "EFF",
          label: "EFF",
          kind: "both",
          format: "pct",
          get: (st) => st.iconv.eff,
          set: (st, v) => ({ ...st, iconv: { ...st.iconv, eff: v } }),
          compute: (st) => effectiveRate(st.iconv.nom, st.iconv.cy),
          hint: "Effective annual rate, %",
        },
        {
          id: "C/Y",
          label: "C/Y",
          kind: "input",
          format: "num",
          get: (st) => st.iconv.cy,
          set: (st, v) => (v > 0 ? { ...st, iconv: { ...st.iconv, cy: v } } : st),
          hint: "Compounding periods per year",
        },
      ];
    case "DELTA":
      return [
        deltaVar("old", "OLD", "num", "Old value"),
        deltaVar("new", "NEW", "num", "New value"),
        deltaVar("pct", "%CH", "pct", "Percent change per period"),
        deltaVar("pd", "#PD", "num", "Number of periods"),
      ];
  }
};

const clearWorksheet = (ws: WorksheetId, s: FinState): FinState => {
  const d = defaults();
  switch (ws) {
    case "CF":
      return { ...s, cf0: 0, flows: [] };
    case "NPV":
    case "IRR": {
      const results = { ...s.results };
      for (const k of ["NPV", "NFV", "PB", "DPB", "IRR"]) delete results[k];
      return ws === "NPV" ? { ...s, npvI: 0, results } : { ...s, results };
    }
    case "AMORT":
      return { ...s, p1: 1, p2: 1 };
    case "BGN":
      return { ...s, tvm: { ...s.tvm, BGN: false } };
    case "PY":
      return { ...s, tvm: { ...s.tvm, PY: 1, CY: 1 } };
    case "BOND":
      return { ...s, bond: d.bond };
    case "ICONV":
      return { ...s, iconv: d.iconv };
    case "DELTA":
      return { ...s, delta: d.delta };
  }
};

// ---- Helpers ------------------------------------------------------------------------

const err = (s: FinState, message: string): FinState => ({
  ...s,
  error: message,
  pending: null,
  cpt: false,
  entry: null,
  memOp: null,
});

const applyOp = (a: number, op: Op, b: number) => {
  switch (op) {
    case "ADD":
      return a + b;
    case "SUB":
      return a - b;
    case "MUL":
      return a * b;
    case "DIV":
      if (b === 0) throw new Error("Can't divide by 0");
      return a / b;
    case "POW":
      return Math.pow(a, b);
  }
};

const currentVar = (s: FinState): WsVar | null => (s.ws ? worksheetVars(s.ws, s)[s.idx] ?? null : null);

/** Show the current worksheet variable on the display. */
const showVar = (s: FinState): FinState => {
  const v = currentVar(s);
  if (!v) return s;
  let value = 0;
  let error: string | null = null;
  try {
    value = v.get(s);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  return {
    ...s,
    x: value,
    entry: null,
    label: v.label,
    computed: v.kind === "auto" || (v.kind === "compute" && v.id in s.results),
    fresh: true,
    error: error && v.kind === "auto" ? null : error,
  };
};

/** Jump straight to a worksheet variable (tapping its chip). */
export const jumpTo = (s: FinState, idx: number): FinState =>
  showVar({ ...s, idx, pending: null, cpt: false, second: false, error: null });

const openWorksheet = (s: FinState, ws: WorksheetId): FinState =>
  showVar({ ...resolvePending(s), ws, idx: 0, cpt: false, pending: null });

/** Finish a pending a ⊕ b before a TVM key / worksheet. */
const resolvePending = (s: FinState): FinState => {
  if (!s.pending) return s;
  const v = s.fresh ? applyOp(s.pending.acc, s.pending.op, s.x) : s.pending.acc;
  return { ...s, pending: null, x: v, entry: null, fresh: true };
};

const fmtVal = (v: number, format: Format, ctx: FormatCtx) =>
  format === "money" ? ctx.money(v) : format === "pct" ? `${ctx.num(v)}%` : ctx.num(v);

const tvmSummary = (t: TVM, target: TvmKey, ctx: FormatCtx) =>
  TVM_KEYS.map((k) => {
    if (k === target) return `${TVM_LABEL[k]}=?`;
    const v = t[k];
    return `${TVM_LABEL[k]}=${MONEY_TVM.includes(k) ? ctx.money(v) : k === "IY" ? `${ctx.num(v)}%` : ctx.num(v)}`;
  }).join(", ") + ` (P/Y ${t.PY}${t.CY !== t.PY ? `, C/Y ${t.CY}` : ""}, ${t.BGN ? "BGN" : "END"})`;

const flowsSummary = (s: FinState, ctx: FormatCtx) =>
  [`CF0 ${ctx.money(s.cf0)}`, ...s.flows.map((f, j) => `C${pad(j + 1)} ${ctx.money(f.c)}${f.f > 1 ? ` ×${f.f}` : ""}`)].join("; ");

const recordFor = (s: FinState, v: WsVar, value: number, ctx: FormatCtx): Recorded | undefined => {
  const shown = `${v.label} = ${fmtVal(value, v.format, ctx)}`;
  switch (s.ws) {
    case "NPV":
      return { expression: `${v.label} @ ${ctx.num(s.npvI)}%: ${flowsSummary(s, ctx)}`, result: shown };
    case "IRR":
      return { expression: `IRR: ${flowsSummary(s, ctx)}`, result: shown };
    case "BOND": {
      const b = s.bond;
      return {
        expression: `Bond: RV ${ctx.num(b.rv)}, CPN ${ctx.num(b.cpn)}%, ${ctx.num(b.yrs)} yrs, ${b.freq}/Y, ${
          v.id === "PRI" ? `YLD ${ctx.num(b.yld)}%` : `PRI ${ctx.num(b.pri)}`
        }`,
        result: shown,
      };
    }
    case "ICONV":
      return {
        expression: `Interest conversion (C/Y ${ctx.num(s.iconv.cy)}): ${
          v.id === "EFF" ? `NOM ${ctx.num(s.iconv.nom)}%` : `EFF ${ctx.num(s.iconv.eff)}%`
        }`,
        result: shown,
      };
    case "DELTA": {
      const d = s.delta;
      return {
        expression: `Percent change: OLD ${ctx.num(d.old)}, NEW ${ctx.num(d.new)}, %CH ${ctx.num(d.pct)}, #PD ${ctx.num(d.pd)}`.replace(
          new RegExp(`${v.label.replace(/[%#]/g, "\\$&")} [^,]+`),
          `${v.label} ?`,
        ),
        result: shown,
      };
    }
    default:
      return undefined;
  }
};

const amortRecord = (s: FinState, ctx: FormatCtx): Recorded | undefined => {
  try {
    const a = amortize(s.tvm, s.p1, s.p2);
    return {
      expression: `Amortization, payments ${s.p1}–${s.p2}: PV ${ctx.money(s.tvm.PV)}, I/Y ${ctx.num(s.tvm.IY)}%, PMT ${ctx.money(
        s.tvm.PMT,
      )}, P/Y ${s.tvm.PY}`,
      result: `BAL ${ctx.money(a.BAL)} · PRN ${ctx.money(a.PRN)} · INT ${ctx.money(a.INT)}`,
    };
  } catch {
    return undefined;
  }
};

const isDigit = (a: Action): a is "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" => /^[0-9]$/.test(a);
const MAX_DIGITS = 12;

// ---- The reducer ------------------------------------------------------------------

export interface PressResult {
  state: FinState;
  record?: Recorded;
}

export const press = (prev: FinState, key: KeyId, ctx: FormatCtx): PressResult => {
  if (key === "2ND") return { state: { ...prev, second: !prev.second } };

  const action: Action = prev.second && SECOND[key] ? SECOND[key]! : key;
  let s: FinState = { ...prev, second: false };

  try {
    // RESET? waits for ENTER
    if (s.confirmReset) {
      if (action === "ENTER") return { state: { ...initialState() } };
      return { state: showVar({ ...s, confirmReset: false, label: s.ws ? s.label : null, x: s.ws ? s.x : 0 }) };
    }

    // Any key clears an error; CE/C only clears it
    if (s.error) {
      s = s.ws ? showVar({ ...s, error: null }) : { ...s, error: null, x: 0, label: null };
      if (action === "CEC") return { state: s };
    }

    // STO n / RCL n / RCL + TVM key
    if (s.memOp) {
      const op = s.memOp;
      s = { ...s, memOp: null };
      if (isDigit(action)) {
        const n = Number(action);
        if (op === "STO") {
          const mem = [...s.mem];
          mem[n] = s.x;
          return { state: { ...s, mem, entry: null, fresh: true } };
        }
        return { state: { ...s, x: s.mem[n], entry: null, fresh: true, computed: false, label: s.ws ? s.label : null } };
      }
      if (op === "RCL" && (TVM_KEYS as Action[]).includes(action)) {
        const k = action as TvmKey;
        return { state: { ...s, ws: null, x: s.tvm[k], label: TVM_LABEL[k], entry: null, fresh: true, computed: false } };
      }
    }

    // ---- Number entry ----
    if (isDigit(action) || action === "DOT") {
      const ch = action === "DOT" ? "." : action;
      let entry = s.entry;
      if (entry === null) entry = ch === "." ? "0." : ch;
      else if (ch === "." && entry.includes(".")) return { state: s };
      else if (entry.replace(/[-.]/g, "").length >= MAX_DIGITS) return { state: s };
      else if ((entry === "0" || entry === "-0") && ch !== ".") entry = entry.slice(0, -1) + ch;
      else entry += ch;
      return {
        state: {
          ...s,
          entry,
          x: parseFloat(entry) || 0,
          fresh: true,
          computed: false,
          cpt: false,
          label: s.ws ? s.label : null,
        },
      };
    }

    switch (action) {
      // ---- Editing ----
      case "BKSP": {
        if (s.entry === null) return { state: s };
        const entry = s.entry.slice(0, -1);
        if (entry === "" || entry === "-") {
          return { state: s.ws ? showVar(s) : { ...s, entry: null, x: 0 } };
        }
        return { state: { ...s, entry, x: parseFloat(entry) || 0 } };
      }

      case "NEG": {
        if (s.entry !== null) {
          const entry = s.entry.startsWith("-") ? s.entry.slice(1) : "-" + s.entry;
          return { state: { ...s, entry, x: parseFloat(entry) || 0 } };
        }
        return { state: { ...s, x: -s.x, fresh: true, computed: false } };
      }

      case "CEC": {
        if (s.entry !== null) return { state: s.ws ? showVar(s) : { ...s, entry: null, x: 0, fresh: true } };
        if (s.pending) return { state: { ...s, pending: null, x: 0, fresh: true } };
        if (s.cpt) return { state: { ...s, cpt: false } };
        if (s.ws) return { state: { ...s, ws: null, idx: 0, x: 0, label: null, computed: false } };
        return { state: { ...s, x: 0, label: null, computed: false, fresh: true } };
      }

      // ---- Arithmetic ----
      case "ADD":
      case "SUB":
      case "MUL":
      case "DIV":
      case "POW": {
        const op = action;
        if (s.pending && !s.fresh) {
          // Changed their mind about the operator
          const expr = s.pending.expr.replace(/ [^ ]+$/, ` ${OP_SYMBOL[op]}`);
          return { state: { ...s, pending: { ...s.pending, op, expr } } };
        }
        const acc = s.pending ? applyOp(s.pending.acc, s.pending.op, s.x) : s.x;
        const expr = s.pending
          ? `${s.pending.expr} ${ctx.num(s.x)} ${OP_SYMBOL[op]}`
          : `${ctx.num(s.x)} ${OP_SYMBOL[op]}`;
        return {
          state: { ...s, pending: { acc, op, expr }, x: acc, entry: null, fresh: false, cpt: false, label: s.ws ? s.label : null },
        };
      }

      case "EQ": {
        if (!s.pending) return { state: { ...s, entry: null, fresh: true } };
        const v = s.fresh ? applyOp(s.pending.acc, s.pending.op, s.x) : s.pending.acc;
        const record = s.fresh
          ? { expression: `${s.pending.expr} ${ctx.num(s.x)}`, result: ctx.num(v) }
          : undefined;
        return { state: { ...s, pending: null, x: v, entry: null, fresh: true, computed: false }, record };
      }

      case "PCT": {
        const v = s.pending && s.fresh && (s.pending.op === "ADD" || s.pending.op === "SUB") ? (s.pending.acc * s.x) / 100 : s.x / 100;
        return { state: { ...s, x: v, entry: null, fresh: true } };
      }

      case "SQRT":
      case "SQ":
      case "INV":
      case "LN":
      case "EXP": {
        const x = s.x;
        if (action === "SQRT" && x < 0) return { state: err(s, "Can't take √ of a negative number") };
        if (action === "INV" && x === 0) return { state: err(s, "Can't divide by 0") };
        if (action === "LN" && x <= 0) return { state: err(s, "LN needs a number above 0") };
        const v =
          action === "SQRT" ? Math.sqrt(x) : action === "SQ" ? x * x : action === "INV" ? 1 / x : action === "LN" ? Math.log(x) : Math.exp(x);
        return { state: { ...s, x: v, entry: null, fresh: true, computed: false } };
      }

      // ---- Memory ----
      case "STO":
      case "RCL":
        return { state: { ...s, memOp: action, entry: null } };

      // ---- TVM ----
      case "N":
      case "IY":
      case "PV":
      case "PMT":
      case "FV": {
        const k = action;
        s = resolvePending({ ...s, ws: null, idx: 0 });
        if (s.cpt) {
          const v = solveTVM(k, s.tvm);
          if (!Number.isFinite(v)) return { state: err(s, "No solution with these values") };
          const tvm = { ...s.tvm, [k]: v };
          const value = MONEY_TVM.includes(k) ? ctx.money(v) : k === "IY" ? `${ctx.num(v)}%` : ctx.num(v);
          return {
            state: { ...s, tvm, x: v, label: TVM_LABEL[k], computed: true, cpt: false, entry: null, fresh: true },
            record: { expression: `TVM: ${tvmSummary(s.tvm, k, ctx)}`, result: `${TVM_LABEL[k]} = ${value}` },
          };
        }
        return {
          state: { ...s, tvm: { ...s.tvm, [k]: s.x }, label: TVM_LABEL[k], computed: false, entry: null, fresh: true },
        };
      }

      case "xPY":
        return { state: { ...s, x: s.x * s.tvm.PY, entry: null, fresh: true, label: s.ws ? s.label : null } };

      case "CLRTVM":
        return {
          state: { ...s, tvm: { ...s.tvm, N: 0, IY: 0, PV: 0, PMT: 0, FV: 0 }, x: 0, label: null, entry: null, cpt: false, computed: false },
        };

      case "CPT": {
        s = resolvePending(s);
        const v = currentVar(s);
        if (v && v.compute && (v.kind === "compute" || v.kind === "both" || v.kind === "auto")) {
          const value = v.compute(s);
          if (!Number.isFinite(value)) return { state: err(s, "No solution with these values") };
          let next: FinState =
            v.kind === "compute" ? { ...s, results: { ...s.results, [v.id]: value } } : v.set ? v.set(s, value) : s;
          next = { ...next, x: value, label: v.label, computed: true, entry: null, fresh: true, cpt: false };
          const record = s.ws === "AMORT" ? amortRecord(s, ctx) : recordFor(s, v, value, ctx);
          return { state: next, record };
        }
        return { state: { ...s, cpt: !s.cpt, entry: null } };
      }

      // ---- Worksheets ----
      case "CF":
      case "NPV":
      case "IRR":
      case "BOND":
      case "AMORT":
      case "BGN":
      case "PY":
      case "ICONV":
      case "DELTA":
        return { state: openWorksheet(s, action) };

      case "QUIT":
        return { state: { ...s, ws: null, idx: 0, x: 0, label: null, entry: null, computed: false, pending: null, cpt: false } };

      case "UP":
      case "DOWN": {
        if (!s.ws) return { state: s };
        const n = worksheetVars(s.ws, s).length;
        const idx = (s.idx + (action === "DOWN" ? 1 : -1) + n) % n;
        return { state: showVar({ ...s, idx, pending: null, cpt: false }) };
      }

      case "ENTER":
      case "SET": {
        const v = currentVar(s);
        if (!v) return { state: { ...s, entry: null } };
        if (v.kind === "toggle") return { state: showVar(v.toggle!(s)) };
        if (action === "SET" || !v.set || v.kind === "compute" || v.kind === "auto") return { state: s };
        s = resolvePending(s);
        const next = showVar(v.set(s, s.x));
        // Entering P2 (or P1) shows the amortization result in the history
        const record = s.ws === "AMORT" && v.id === "P2" ? amortRecord(next, ctx) : undefined;
        return { state: next, record };
      }

      case "DEL":
      case "INS": {
        if (s.ws !== "CF") return { state: s };
        const v = currentVar(s);
        const j = v && v.id !== "CF0" ? Number(v.id.slice(1)) - 1 : -1;
        if (j < 0) return { state: s };
        if (action === "DEL") {
          if (j >= s.flows.length) return { state: s };
          const flows = s.flows.filter((_, k) => k !== j);
          return { state: showVar({ ...s, flows, idx: 1 + j * 2 }) };
        }
        const flows = [...s.flows.slice(0, j), { c: 0, f: 1 }, ...s.flows.slice(j)];
        return { state: showVar({ ...s, flows, idx: 1 + j * 2 }) };
      }

      case "CLRWORK":
        if (!s.ws) return { state: s };
        return { state: showVar({ ...clearWorksheet(s.ws, s), idx: 0 }) };

      case "RESET":
        return { state: { ...s, confirmReset: true, entry: null } };
    }
  } catch (e) {
    return { state: err(s, e instanceof Error ? e.message : String(e)) };
  }

  return { state: s };
};

// ---- View model (what the display shows) ----------------------------------------------

export interface DisplayView {
  label: string | null;
  format: Format;
  typing: boolean;
  text: string;
  /** The raw value when it is a money amount (for "₹12.5 million"). */
  moneyValue: number | null;
  computed: boolean;
  hint: string;
  worksheet: WorksheetId | null;
  vars: { label: string; active: boolean }[];
  canCompute: boolean;
}

const tvmFormat = (label: string | null): Format | null => {
  const k = TVM_KEYS.find((t) => TVM_LABEL[t] === label);
  if (!k) return null;
  return MONEY_TVM.includes(k) ? "money" : k === "IY" ? "pct" : "num";
};

export const view = (s: FinState, ctx: FormatCtx, formatEntry: (e: string) => string): DisplayView => {
  const v = currentVar(s);
  const vars = s.ws ? worksheetVars(s.ws, s).map((w, i) => ({ label: w.label, active: i === s.idx })) : [];
  const format: Format = v ? v.format : tvmFormat(s.label) ?? "num";

  if (s.error) {
    return { label: "Error", format, typing: false, text: s.error, moneyValue: null, computed: false, hint: "Press CE/C (or any key) to clear", worksheet: s.ws, vars, canCompute: false };
  }
  if (s.confirmReset) {
    return {
      label: "RST?",
      format,
      typing: false,
      text: "Reset everything?",
      moneyValue: null,
      computed: false,
      hint: "ENTER to reset all values · any other key to cancel",
      worksheet: s.ws,
      vars,
      canCompute: false,
    };
  }

  let text: string;
  if (s.entry !== null) {
    text = formatEntry(s.entry);
  } else if (v?.kind === "toggle" && v.toggleText) {
    text = v.toggleText(s);
  } else if (v?.kind === "auto") {
    try {
      text = fmtVal(v.compute!(s), format, ctx);
    } catch (e) {
      text = e instanceof Error ? e.message : "—";
    }
  } else {
    text = format === "money" ? ctx.money(s.x) : ctx.num(s.x);
  }

  let hint: string;
  if (s.memOp) hint = `${s.memOp}: press a digit 0–9${s.memOp === "RCL" ? " (or a TVM key)" : ""}`;
  else if (s.second) hint = "2ND: keys now do their orange function";
  else if (s.cpt) hint = "Compute: press N, I/Y, PV, PMT or FV";
  else if (s.pending) hint = `${s.pending.expr} … press = to finish`;
  else if (v) {
    const how =
      v.kind === "input"
        ? "type + ENTER"
        : v.kind === "compute"
          ? "press CPT"
          : v.kind === "both"
            ? "type + ENTER, or CPT"
            : v.kind === "toggle"
              ? "press ENTER to switch"
              : "calculated for you";
    hint = `${v.hint ?? v.label} · ${how} · ↑↓ move`;
  } else if (s.label && tvmFormat(s.label)) {
    hint = s.computed ? `${s.label} computed` : `Stored in ${s.label}. Next value, or CPT + key to compute`;
  } else {
    hint = "Type a value, then N, I/Y, PV, PMT or FV";
  }

  return {
    label: s.label,
    format,
    typing: s.entry !== null,
    text,
    moneyValue: format === "money" && s.entry === null && v?.kind !== "toggle" ? (v?.kind === "auto" ? safe(() => v.compute!(s)) : s.x) : null,
    computed: s.computed,
    hint,
    worksheet: s.ws,
    vars,
    canCompute: !!v && (v.kind === "compute" || v.kind === "both"),
  };
};

const safe = (fn: () => number): number | null => {
  try {
    const v = fn();
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
};
