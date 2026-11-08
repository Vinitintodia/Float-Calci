import { describe, expect, it } from "vitest";
import {
  amortize,
  bondDuration,
  bondPrice,
  bondYield,
  effectiveRate,
  irr,
  nominalRate,
  npv,
  payback,
  percentChange,
  solveTVM,
  type TVM,
} from "./finance";

const tvm = (t: Partial<TVM>): TVM => ({ N: 0, IY: 0, PV: 0, PMT: 0, FV: 0, PY: 1, CY: 1, BGN: false, ...t });

describe("TVM", () => {
  it("30-year mortgage payment", () => {
    // ₹/$ 100,000 at 6% for 30 years, monthly
    expect(solveTVM("PMT", tvm({ N: 360, IY: 6, PV: 100000, PY: 12, CY: 12 }))).toBeCloseTo(-599.55, 2);
  });

  it("future value of a lump sum", () => {
    expect(solveTVM("FV", tvm({ N: 5, IY: 10, PV: -1000 }))).toBeCloseTo(1610.51, 2);
  });

  it("present value", () => {
    expect(solveTVM("PV", tvm({ N: 5, IY: 10, FV: 1610.51 }))).toBeCloseTo(-1000, 1);
  });

  it("interest rate (doubling in 10 years)", () => {
    expect(solveTVM("IY", tvm({ N: 10, PV: -1000, FV: 2000 }))).toBeCloseTo(7.177, 3);
  });

  it("number of periods", () => {
    expect(solveTVM("N", tvm({ IY: 5, PV: -1000, FV: 2000 }))).toBeCloseTo(14.2067, 4);
  });

  it("annuity due (BGN) is worth one period more interest", () => {
    const end = solveTVM("FV", tvm({ N: 10, IY: 8, PMT: -100 }));
    const bgn = solveTVM("FV", tvm({ N: 10, IY: 8, PMT: -100, BGN: true }));
    expect(end).toBeCloseTo(1448.66, 2);
    expect(bgn).toBeCloseTo(1564.55, 2);
  });

  it("I/Y of a loan with payments", () => {
    expect(solveTVM("IY", tvm({ N: 360, PV: 100000, PMT: -599.55, PY: 12, CY: 12 }))).toBeCloseTo(6, 3);
  });

  it("zero interest", () => {
    expect(solveTVM("PMT", tvm({ N: 10, PV: 1000 }))).toBeCloseTo(-100, 10);
  });

  it("monthly payments with semi-annual compounding (P/Y 12, C/Y 2)", () => {
    const pmt = solveTVM("PMT", tvm({ N: 300, IY: 6, PV: 200000, PY: 12, CY: 2 }));
    expect(pmt).toBeCloseTo(-1279.61, 2);
  });

  it("refuses impossible problems", () => {
    expect(() => solveTVM("IY", tvm({ N: 10, PV: 1000, FV: 2000 }))).toThrow();
  });
});

describe("cash flows", () => {
  const cf0 = -1000;
  const flows = [
    { c: 300, f: 1 },
    { c: 400, f: 1 },
    { c: 500, f: 1 },
  ];

  it("NPV", () => {
    expect(npv(10, cf0, flows)).toBeCloseTo(-21.04, 2);
  });

  it("IRR makes NPV zero", () => {
    const r = irr(cf0, flows);
    expect(r).toBeCloseTo(8.896, 3);
    expect(npv(r, cf0, flows)).toBeCloseTo(0, 6);
  });

  it("frequencies repeat a cash flow", () => {
    expect(npv(10, -1000, [{ c: 300, f: 4 }])).toBeCloseTo(npv(10, -1000, Array(4).fill({ c: 300, f: 1 })), 10);
  });

  it("payback and discounted payback", () => {
    expect(payback(cf0, flows)).toBeCloseTo(2.6, 10);
    expect(() => payback(cf0, flows, 10)).toThrow(); // never recovered at 10%
    expect(payback(-1000, [{ c: 600, f: 2 }], 10)).toBeCloseTo(1.917, 3);
  });

  it("IRR needs both signs", () => {
    expect(() => irr(100, [{ c: 50, f: 2 }])).toThrow();
  });
});

describe("amortization", () => {
  const loan = tvm({ N: 360, IY: 6, PV: 100000, PMT: -599.55, PY: 12, CY: 12 });

  it("first year of a mortgage", () => {
    const a = amortize(loan, 1, 12);
    expect(a.INT).toBeCloseTo(-5966.59, 0);
    expect(a.PRN).toBeCloseTo(-1228.0, 0);
    expect(a.BAL).toBeCloseTo(98772.0, 0);
    expect(a.PRN + a.INT).toBeCloseTo(-599.55 * 12, 6);
  });

  it("whole loan pays off", () => {
    expect(amortize({ ...loan, PMT: solveTVM("PMT", loan) }, 1, 360).BAL).toBeCloseTo(0, 4);
  });
});

describe("bonds", () => {
  const bond = { rv: 100, cpn: 8, yrs: 10, freq: 2 as const };

  it("price from yield", () => {
    expect(bondPrice(bond, 6)).toBeCloseTo(114.877, 3);
    expect(bondPrice(bond, 8)).toBeCloseTo(100, 8);
  });

  it("yield from price", () => {
    expect(bondYield(bond, 114.877)).toBeCloseTo(6, 3);
  });

  it("duration", () => {
    const d = bondDuration({ rv: 100, cpn: 5, yrs: 3, freq: 1 }, 5);
    expect(d.macaulay).toBeCloseTo(2.8594, 4);
    expect(d.modified).toBeCloseTo(2.7232, 4);
  });
});

describe("interest conversion and percent change", () => {
  it("12% monthly is 12.68% effective", () => {
    expect(effectiveRate(12, 12)).toBeCloseTo(12.6825, 4);
    expect(nominalRate(12.6825, 12)).toBeCloseTo(12, 4);
  });

  it("percent change", () => {
    expect(percentChange.pct(100, 121, 2)).toBeCloseTo(10, 10);
    expect(percentChange.new(100, 10, 2)).toBeCloseTo(121, 10);
    expect(percentChange.old(121, 10, 2)).toBeCloseTo(100, 10);
    expect(percentChange.pd(100, 121, 10)).toBeCloseTo(2, 10);
  });
});
