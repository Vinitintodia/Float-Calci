// Drives the financial calculator with real keystroke sequences.
import { describe, expect, it } from "vitest";
import { initialState, press, view, type FinState, type KeyId, type Recorded } from "./finCalc";
import { CURRENCIES, formatEntry, formatMoney, formatNumber } from "./currency";

const inr = CURRENCIES[0];
const ctx = { money: (v: number) => formatMoney(v, inr, 2), num: (v: number) => formatNumber(v, 2) };

const KEY_ALIASES: Record<string, KeyId> = {
  "+": "ADD",
  "-": "SUB",
  "*": "MUL",
  "/": "DIV",
  "=": "EQ",
  ".": "DOT",
  "+/-": "NEG",
  "I/Y": "IY",
  "↑": "UP",
  "↓": "DOWN",
};

/** run("1 0 0 PV 2ND N") — numbers can be written together: "100000 PV" */
const run = (keys: string, start: FinState = initialState()) => {
  let s = start;
  const records: Recorded[] = [];
  for (const token of keys.trim().split(/\s+/)) {
    const ids: KeyId[] = /^-?[0-9.]+$/.test(token) && token.length > 1
      ? (token.split("").map((c) => (c === "." ? "DOT" : c)) as KeyId[])
      : [KEY_ALIASES[token] ?? (token as KeyId)];
    for (const id of ids) {
      const r = press(s, id, ctx);
      s = r.state;
      if (r.record) records.push(r.record);
    }
  }
  return { s, records, display: view(s, ctx, formatEntry) };
};

describe("TVM keystrokes", () => {
  it("mortgage payment: 2ND P/Y 12, then N I/Y PV, CPT PMT", () => {
    const { s, display, records } = run("2ND I/Y 12 ENTER 2ND CPT 360 N 6 I/Y 100000 PV 0 FV CPT PMT");
    expect(s.tvm.PMT).toBeCloseTo(-599.55, 2);
    expect(display.label).toBe("PMT");
    expect(display.text).toBe("−₹599.55");
    expect(display.computed).toBe(true);
    expect(records).toHaveLength(1);
    expect(records[0].result).toBe("PMT = −₹599.55");
  });

  it("2ND xP/Y multiplies by payments per year", () => {
    const { s } = run("2ND I/Y 12 ENTER 2ND CPT 30 2ND N N");
    expect(s.tvm.N).toBe(360);
  });

  it("BGN mode via 2ND BGN, 2ND SET", () => {
    const { s } = run("2ND PMT 2ND ENTER 2ND CPT 10 N 8 I/Y 100 +/- PMT 0 PV CPT FV");
    expect(s.tvm.BGN).toBe(true);
    expect(s.tvm.FV).toBeCloseTo(1564.55, 2);
  });

  it("arithmetic before a TVM key is finished first", () => {
    const { s } = run("5 * 12 N");
    expect(s.tvm.N).toBe(60);
  });

  it("2ND CLR TVM clears the five values", () => {
    const { s } = run("100 PV 5 N 2ND FV");
    expect(s.tvm.PV).toBe(0);
    expect(s.tvm.N).toBe(0);
  });

  it("RCL + TVM key recalls a value", () => {
    const { display } = run("250 PV 9 RCL PV");
    expect(display.text).toBe("₹250.00");
  });
});

describe("cash flow worksheets", () => {
  it("CF, NPV and IRR", () => {
    const { s, display, records } = run("CF 1000 +/- ENTER ↓ 300 ENTER ↓ ↓ 400 ENTER ↓ ↓ 500 ENTER NPV 10 ENTER ↓ CPT");
    expect(s.cf0).toBe(-1000);
    expect(s.flows.map((f) => f.c)).toEqual([300, 400, 500]);
    expect(display.label).toBe("NPV");
    expect(s.results.NPV).toBeCloseTo(-21.04, 2);
    expect(records.at(-1)!.result).toBe("NPV = −₹21.04");

    const irr = run("IRR CPT", s);
    expect(irr.s.results.IRR).toBeCloseTo(8.896, 3);
    expect(irr.display.text).toBe("8.90");
  });

  it("frequencies", () => {
    const { s } = run("CF 1000 +/- ENTER ↓ 300 ENTER ↓ 4 ENTER");
    expect(s.flows).toEqual([{ c: 300, f: 4 }]);
  });

  it("2ND DEL removes a cash flow and 2ND CLR WORK clears them all", () => {
    let r = run("CF 100 +/- ENTER ↓ 10 ENTER ↓ ↓ 20 ENTER ↑ ↑ 2ND ↑");
    expect(r.s.flows).toEqual([{ c: 20, f: 1 }]);
    r = run("2ND CEC", r.s);
    expect(r.s.flows).toEqual([]);
    expect(r.s.cf0).toBe(0);
  });
});

describe("amortization worksheet", () => {
  it("first year of the mortgage", () => {
    const loan = run("2ND I/Y 12 ENTER 2ND CPT 360 N 6 I/Y 100000 PV 0 FV CPT PMT").s;
    const { display, records } = run("2ND PV 1 ENTER ↓ 12 ENTER ↓", loan);
    expect(display.label).toBe("BAL");
    expect(display.text).toBe("₹98,771.99");
    expect(records.at(-1)!.result).toMatch(/^BAL ₹98,771\.99 · PRN −₹1,228\.01 · INT −₹5,966\.59$/);
  });
});

describe("other worksheets", () => {
  it("bond price", () => {
    const { s } = run("BOND 100 ENTER ↓ 8 ENTER ↓ 10 ENTER ↓ ↓ 6 ENTER ↓ CPT");
    expect(s.bond.pri).toBeCloseTo(114.877, 3);
  });

  it("interest conversion", () => {
    const { s } = run("2ND PCT 12 ENTER ↓ ↓ 12 ENTER ↑ CPT");
    expect(s.iconv.eff).toBeCloseTo(12.6825, 4);
  });

  it("percent change", () => {
    const { s } = run("DELTA 100 ENTER ↓ 121 ENTER ↓ ↓ 2 ENTER ↑ CPT");
    expect(s.delta.pct).toBeCloseTo(10, 8);
  });
});

describe("standard calculator", () => {
  it("chains left to right", () => {
    const { display, records } = run("2 + 3 * 4 =");
    expect(display.text).toBe("20.00");
    expect(records[0]).toEqual({ expression: "2.00 + 3.00 × 4.00", result: "20.00" });
  });

  it("percent of a number when adding", () => {
    expect(run("200 + 10 PCT =").display.text).toBe("220.00");
  });

  it("starts a new number after =", () => {
    expect(run("6 * 6 = 7").display.text).toBe("7");
  });

  it("backspace deletes one digit", () => {
    expect(run("1234 BKSP").display.text).toBe("123");
  });

  it("errors on divide by zero, cleared by CE/C", () => {
    let r = run("5 / 0 =");
    expect(r.display.label).toBe("Error");
    r = run("CEC", r.s);
    expect(r.display.label).toBeNull();
  });

  it("STO and RCL memory", () => {
    expect(run("42 STO 3 CEC RCL 3").display.text).toBe("42.00");
  });

  it("2ND +/- asks before resetting", () => {
    let r = run("100 PV 2ND NEG");
    expect(r.display.label).toBe("RST?");
    r = run("ENTER", r.s);
    expect(r.s.tvm.PV).toBe(0);
  });
});
