// Financial maths used by the financial calculator.
// Pure functions, no UI, so they are easy to test (see finance.test.ts).
//
// Sign convention (same as exam financial calculators): money you receive is
// positive, money you pay out is negative. A loan: PV = +100000, PMT = -599.55.

export interface TVM {
  N: number; // number of payments
  IY: number; // annual interest rate, in %
  PV: number;
  PMT: number;
  FV: number;
  PY: number; // payments per year
  CY: number; // compounding periods per year
  BGN: boolean; // payments at the beginning of each period
}

export type TvmKey = "N" | "IY" | "PV" | "PMT" | "FV";

export class FinanceError extends Error {}

const EPS = 1e-12;

/** Interest rate per payment period, as a decimal. */
export const periodicRate = (IY: number, PY: number, CY: number) => {
  const nominal = IY / 100;
  if (PY === CY) return nominal / PY;
  return Math.pow(1 + nominal / CY, CY / PY) - 1;
};

/** Inverse of periodicRate: periodic decimal rate -> annual I/Y in %. */
export const annualRate = (i: number, PY: number, CY: number) => {
  if (PY === CY) return i * PY * 100;
  return CY * (Math.pow(1 + i, PY / CY) - 1) * 100;
};

/** The TVM equation; it equals 0 when the five values are consistent. */
const tvmEquation = (i: number, t: TVM) => {
  const { N, PV, PMT, FV } = t;
  if (Math.abs(i) < EPS) return PV + PMT * N + FV;
  const v = Math.pow(1 + i, -N);
  const annuity = ((1 - v) / i) * (t.BGN ? 1 + i : 1);
  return PV + PMT * annuity + FV * v;
};

/** Find a root of f between lo and hi (f(lo) and f(hi) must differ in sign). */
const bisect = (f: (x: number) => number, lo: number, hi: number) => {
  let flo = f(lo);
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    const fm = f(mid);
    if (Math.abs(fm) < 1e-10 || hi - lo < 1e-14) return mid;
    if (Math.sign(fm) === Math.sign(flo)) {
      lo = mid;
      flo = fm;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
};

/**
 * Solve f(rate) = 0 for a rate > -100%. Tries Newton's method from a guess,
 * then falls back to scanning for a sign change and bisecting.
 */
export const solveRate = (f: (r: number) => number, guess = 0.1): number => {
  // Newton
  let r = guess;
  for (let k = 0; k < 60; k++) {
    const fr = f(r);
    if (!Number.isFinite(fr)) break;
    if (Math.abs(fr) < 1e-10) return r;
    const h = 1e-7 * Math.max(1, Math.abs(r));
    const d = (f(r + h) - f(r - h)) / (2 * h);
    if (!Number.isFinite(d) || Math.abs(d) < 1e-14) break;
    const next = r - fr / d;
    if (next <= -0.999999 || !Number.isFinite(next)) break;
    if (Math.abs(next - r) < 1e-13) return next;
    r = next;
  }
  // Scan outwards from the guess for a sign change
  const points: number[] = [];
  for (let x = -0.99; x < 10; x += x < 1 ? 0.01 : 0.25) points.push(x);
  points.sort((a, b) => Math.abs(a - guess) - Math.abs(b - guess));
  for (const a of points) {
    const step = a < 1 ? 0.01 : 0.25;
    const b = a + step;
    const fa = f(a);
    const fb = f(b);
    if (!Number.isFinite(fa) || !Number.isFinite(fb)) continue;
    if (fa === 0) return a;
    if (Math.sign(fa) !== Math.sign(fb)) return bisect(f, a, b);
  }
  throw new FinanceError("No solution: check the signs (paid out = negative)");
};

/** Compute one TVM value from the other four. */
export const solveTVM = (target: TvmKey, t: TVM): number => {
  if (t.PY <= 0 || t.CY <= 0) throw new FinanceError("P/Y and C/Y must be above 0");
  const i = periodicRate(t.IY, t.PY, t.CY);
  const s = t.BGN ? 1 + i : 1;

  switch (target) {
    case "FV": {
      if (Math.abs(i) < EPS) return -(t.PV + t.PMT * t.N);
      const g = Math.pow(1 + i, t.N);
      return -(t.PV * g + t.PMT * s * ((g - 1) / i));
    }
    case "PV": {
      if (Math.abs(i) < EPS) return -(t.PMT * t.N + t.FV);
      const v = Math.pow(1 + i, -t.N);
      return -(t.PMT * s * ((1 - v) / i) + t.FV * v);
    }
    case "PMT": {
      if (t.N === 0) throw new FinanceError("N can't be 0");
      if (Math.abs(i) < EPS) return -(t.PV + t.FV) / t.N;
      const v = Math.pow(1 + i, -t.N);
      return -(t.PV + t.FV * v) / (s * ((1 - v) / i));
    }
    case "N": {
      if (Math.abs(i) < EPS) {
        if (t.PMT === 0) throw new FinanceError("No solution: PMT is 0 and I/Y is 0");
        return -(t.PV + t.FV) / t.PMT;
      }
      const k = (t.PMT * s) / i;
      const ratio = (k - t.FV) / (t.PV + k);
      if (!(ratio > 0)) throw new FinanceError("No solution: check the signs (paid out = negative)");
      return Math.log(ratio) / Math.log(1 + i);
    }
    case "IY": {
      if (t.N <= 0) throw new FinanceError("N must be above 0");
      const hasIn = [t.PV, t.PMT, t.FV].some((x) => x > 0);
      const hasOut = [t.PV, t.PMT, t.FV].some((x) => x < 0);
      if (!hasIn || !hasOut) throw new FinanceError("No solution: you need both a + and a − amount");
      const i0 = solveRate((r) => tvmEquation(r, t), 0.01);
      return annualRate(i0, t.PY, t.CY);
    }
  }
};

// ---- Cash flows ------------------------------------------------------------

export interface CashFlow {
  c: number; // amount
  f: number; // how many times in a row (frequency)
}

/** Expand CF0 + grouped flows into one amount per period: [CF0, CF1, CF2, ...]. */
export const expandFlows = (cf0: number, flows: CashFlow[]) => {
  const out = [cf0];
  for (const { c, f } of flows) for (let k = 0; k < Math.max(0, Math.round(f)); k++) out.push(c);
  return out;
};

export const npv = (ratePct: number, cf0: number, flows: CashFlow[]) =>
  expandFlows(cf0, flows).reduce((sum, c, t) => sum + c / Math.pow(1 + ratePct / 100, t), 0);

/** Net future value: NPV carried forward to the last period. */
export const nfv = (ratePct: number, cf0: number, flows: CashFlow[]) => {
  const n = expandFlows(cf0, flows).length - 1;
  return npv(ratePct, cf0, flows) * Math.pow(1 + ratePct / 100, n);
};

export const irr = (cf0: number, flows: CashFlow[]) => {
  const all = expandFlows(cf0, flows);
  if (!all.some((c) => c > 0) || !all.some((c) => c < 0)) {
    throw new FinanceError("No IRR: you need both + and − cash flows");
  }
  const f = (r: number) => all.reduce((s, c, t) => s + c / Math.pow(1 + r, t), 0);
  return solveRate(f, 0.1) * 100;
};

/**
 * Payback period in periods (with a fraction for the last period).
 * Discounted when ratePct is given. Throws when the investment is never recovered.
 */
export const payback = (cf0: number, flows: CashFlow[], ratePct = 0) => {
  const all = expandFlows(cf0, flows).map((c, t) => c / Math.pow(1 + ratePct / 100, t));
  let cum = all[0];
  if (cum >= 0) return 0;
  for (let t = 1; t < all.length; t++) {
    const next = cum + all[t];
    if (next >= 0) return t - 1 + -cum / all[t];
    cum = next;
  }
  throw new FinanceError("Never paid back with these cash flows");
};

// ---- Amortisation ------------------------------------------------------------

export interface AmortResult {
  BAL: number; // balance after payment P2
  PRN: number; // principal paid in payments P1..P2
  INT: number; // interest paid in payments P1..P2
}

export const amortize = (t: TVM, p1: number, p2: number): AmortResult => {
  p1 = Math.round(p1);
  p2 = Math.round(p2);
  if (p1 < 1 || p2 < p1) throw new FinanceError("P1 must be ≥ 1 and P2 ≥ P1");
  const i = periodicRate(t.IY, t.PY, t.CY);
  let bal = t.PV;
  let prn = 0;
  let int = 0;
  for (let k = 1; k <= p2; k++) {
    const interest = t.BGN && k === 1 ? 0 : bal * i; // interest added this period
    const principal = t.PMT + interest; // the part of the payment that reduces the balance
    bal += principal;
    if (k >= p1) {
      prn += principal;
      int -= interest;
    }
  }
  return { BAL: bal, PRN: prn, INT: int };
};

// ---- Bonds -------------------------------------------------------------------
// Whole coupon periods (no settlement dates): price per `rv` of face value.

export interface Bond {
  rv: number; // redemption value (face), usually 100
  cpn: number; // annual coupon rate, %
  yrs: number; // years to maturity
  freq: 1 | 2; // coupons per year
}

export const bondPrice = (b: Bond, yldPct: number) => {
  const n = b.yrs * b.freq;
  const c = (b.rv * b.cpn) / 100 / b.freq;
  const y = yldPct / 100 / b.freq;
  if (Math.abs(y) < EPS) return c * n + b.rv;
  const v = Math.pow(1 + y, -n);
  return c * ((1 - v) / y) + b.rv * v;
};

export const bondYield = (b: Bond, price: number) => {
  if (price <= 0) throw new FinanceError("Price must be above 0");
  const y = solveRate((r) => bondPrice(b, r * 100 * b.freq) - price, b.cpn / 100 / b.freq || 0.03);
  return y * b.freq * 100;
};

/** Macaulay and modified duration, in years. */
export const bondDuration = (b: Bond, yldPct: number) => {
  const n = Math.round(b.yrs * b.freq);
  if (n < 1) throw new FinanceError("Years must be above 0");
  const c = (b.rv * b.cpn) / 100 / b.freq;
  const y = yldPct / 100 / b.freq;
  let pv = 0;
  let weighted = 0;
  for (let t = 1; t <= n; t++) {
    const cash = c + (t === n ? b.rv : 0);
    const d = cash / Math.pow(1 + y, t);
    pv += d;
    weighted += t * d;
  }
  const macaulay = weighted / pv / b.freq;
  return { macaulay, modified: macaulay / (1 + y) };
};

// ---- Interest conversion and percent change ----------------------------------

export const effectiveRate = (nomPct: number, cy: number) => (Math.pow(1 + nomPct / 100 / cy, cy) - 1) * 100;

export const nominalRate = (effPct: number, cy: number) => cy * (Math.pow(1 + effPct / 100, 1 / cy) - 1) * 100;

/** NEW = OLD × (1 + %CH/100)^#PD; solve any one of the four. */
export const percentChange = {
  pct: (oldV: number, newV: number, pd: number) => {
    if (oldV === 0 || pd === 0) throw new FinanceError("OLD and #PD can't be 0");
    return (Math.pow(newV / oldV, 1 / pd) - 1) * 100;
  },
  new: (oldV: number, pct: number, pd: number) => oldV * Math.pow(1 + pct / 100, pd),
  old: (newV: number, pct: number, pd: number) => newV / Math.pow(1 + pct / 100, pd),
  pd: (oldV: number, newV: number, pct: number) => {
    if (oldV === 0 || pct === 0 || newV / oldV <= 0) throw new FinanceError("No solution");
    return Math.log(newV / oldV) / Math.log(1 + pct / 100);
  },
};
