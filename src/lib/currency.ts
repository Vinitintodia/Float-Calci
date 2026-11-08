// Currency + number formatting for the financial calculator.
// International grouping (1,000,000) and million / billion wording for every currency.

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  decimals?: number; // natural decimals (JPY has none)
}

export const CURRENCIES: Currency[] = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", decimals: 0 },
  { code: "AED", symbol: "AED ", name: "UAE Dirham" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "CHF", symbol: "CHF ", name: "Swiss Franc" },
  { code: "CNY", symbol: "CN¥", name: "Chinese Yuan" },
  { code: "NONE", symbol: "", name: "No symbol" },
];

export const getCurrency = (code: string) => CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];

/** Display decimals: a fixed number, or "F" for floating (up to 9). */
export type Decimals = 0 | 2 | 4 | 6 | "F";

const MINUS = "−";

const fmt = (abs: number, decimals: Decimals) =>
  decimals === "F"
    ? abs.toLocaleString("en-US", { maximumFractionDigits: 9 })
    : abs.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** Plain number: 1,234,567.89 (scientific notation when huge or tiny). */
export const formatNumber = (v: number, decimals: Decimals = 2): string => {
  if (!Number.isFinite(v)) return "Error";
  const abs = Math.abs(v);
  if (abs >= 1e15 || (abs > 0 && abs < 1e-9 && decimals === "F")) {
    return v.toExponential(6).replace("-", MINUS);
  }
  const s = fmt(abs, decimals);
  // Don't show "−0.00"
  return v < 0 && /[1-9]/.test(s) ? MINUS + s : s;
};

/** Money: −₹1,234,567.89 */
export const formatMoney = (v: number, currency: Currency, decimals: Decimals = 2): string => {
  const d: Decimals = currency.decimals === 0 && decimals === 2 ? 0 : decimals;
  const n = formatNumber(v, d);
  if (n === "Error" || n.includes("e")) return n;
  return n.startsWith(MINUS) ? MINUS + currency.symbol + n.slice(1) : currency.symbol + n;
};

const SCALES: [number, string][] = [
  [1e12, "trillion"],
  [1e9, "billion"],
  [1e6, "million"],
];

/** Words for big amounts: "₹12.35 million". Empty under a million. */
export const formatWords = (v: number, currency: Currency): string => {
  const abs = Math.abs(v);
  const scale = SCALES.find(([s]) => abs >= s);
  if (!scale || !Number.isFinite(v)) return "";
  const n = (abs / scale[0]).toLocaleString("en-US", { maximumFractionDigits: 2 });
  return `${v < 0 ? MINUS : ""}${currency.symbol}${n} ${scale[1]}`;
};

/** Short form for tight spaces: ₹12.3M, 360, 8.5 */
export const formatCompact = (v: number, currency?: Currency): string => {
  if (!Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  const sym = currency?.symbol.trim() ?? "";
  const short = abs.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: abs >= 1000 ? 2 : 4 });
  return `${v < 0 ? MINUS : ""}${sym}${short}`;
};

/** Group the integer part of a number the user is typing, keeping what they typed after the dot. */
export const formatEntry = (entry: string): string => {
  const neg = entry.startsWith("-");
  const body = neg ? entry.slice(1) : entry;
  const [int, frac] = body.split(".");
  const grouped = (int ? Number(int) : 0).toLocaleString("en-US");
  return (neg ? MINUS : "") + grouped + (frac !== undefined ? "." + frac : "");
};
