import { describe, expect, it } from "vitest";
import { evaluate } from "./evaluate";

describe("evaluate", () => {
  const cases: [string, number][] = [
    ["12*3", 36],
    ["7+8*2", 23],
    ["(7+8)*2", 30],
    ["10/4", 2.5],
    ["-5+2", -3],
    ["2^3^2", 512],
    ["2**10", 1024],
    ["sin(30)", 0.5],
    ["cos(60)", 0.5],
    ["sin(180)", 0],
    ["tan(45)", 1],
    ["tan(90)", Infinity],
    ["log(1000)", 3],
    ["ln(e)", 1],
    ["sqrt(16)", 4],
    ["2π", 2 * Math.PI],
    ["π", Math.PI],
    ["3(4+1)", 15],
    ["sin(30", 0.5],
    ["1.5e3", 1500],
    ["2.5E-2", 0.025],
    ["10%3", 1],
    ["5×4÷2", 10],
    ["sqrt(9)+sin(90)*2", 5],
    ["--3", 3],
  ];

  it.each(cases)("%s = %d", (expr, want) => {
    const got = evaluate(expr);
    if (Number.isFinite(want)) expect(got).toBeCloseTo(want, 12);
    else expect(got).toBe(want);
  });

  it.each(["", "2+", "foo(2)", "2)", "EXP"])("rejects %j", (expr) => {
    expect(() => evaluate(expr)).toThrow();
  });
});

describe("scientific notation keys", () => {
  it.each([
    ["1.5E3", 1500],
    ["2E-3", 0.002],
    ["2×10^3", 2000],
    ["4×10^-2", 0.04],
    ["3×36", 108],
  ])("%s = %d", (expr, want) => {
    expect(evaluate(expr as string)).toBeCloseTo(want as number, 12);
  });
});
