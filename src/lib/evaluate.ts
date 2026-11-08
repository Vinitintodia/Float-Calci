// Safe maths expression evaluator.
//
// Why not eval() / Function()? Chrome extensions (Manifest V3) block them with
// their Content Security Policy, and running user text as code is risky anyway.
// This is a small recursive-descent parser instead.
//
// Supports: + - * / % ^ ** × ÷, parentheses, unary minus, implicit multiplication
// (2π, 3(4+1)), constants π / pi / e, and sin cos tan (degrees), log (base 10),
// ln, sqrt. Missing ")" at the end are closed automatically, e.g. "sin(30".

type Token =
  | { kind: "num"; value: number }
  | { kind: "id"; value: string }
  | { kind: "op"; value: string };

const FUNCTIONS: Record<string, (x: number) => number> = {
  sin: (x) => roundTrig(Math.sin(toRad(x))),
  cos: (x) => roundTrig(Math.cos(toRad(x))),
  tan: (x) => {
    // tan(90), tan(270)… are undefined
    if (Math.abs(((x % 180) + 180) % 180 - 90) < 1e-12) return Infinity;
    return roundTrig(Math.tan(toRad(x)));
  },
  log: Math.log10,
  ln: Math.log,
  sqrt: Math.sqrt,
};

const CONSTANTS: Record<string, number> = { π: Math.PI, pi: Math.PI, e: Math.E };

const toRad = (deg: number) => (deg * Math.PI) / 180;
// sin(180) should be 0, not 1.2e-16
const roundTrig = (v: number) => (Math.abs(v) < 1e-12 ? 0 : v);

const tokenize = (input: string): Token[] => {
  const tokens: Token[] = [];
  const s = input.replace(/×/g, "*").replace(/÷/g, "/").replace(/\s+/g, "");
  let i = 0;
  while (i < s.length) {
    const rest = s.slice(i);
    const num = rest.match(/^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/);
    if (num) {
      tokens.push({ kind: "num", value: parseFloat(num[0]) });
      i += num[0].length;
      continue;
    }
    const id = rest.match(/^(π|[a-zA-Z]+)/);
    if (id) {
      tokens.push({ kind: "id", value: id[0].toLowerCase() });
      i += id[0].length;
      continue;
    }
    if (rest.startsWith("**")) {
      tokens.push({ kind: "op", value: "^" });
      i += 2;
      continue;
    }
    if ("+-*/%^()".includes(s[i])) {
      tokens.push({ kind: "op", value: s[i] });
      i += 1;
      continue;
    }
    throw new Error(`Unexpected "${s[i]}"`);
  }
  return tokens;
};

export const evaluate = (input: string): number => {
  const tokens = tokenize(input);
  let pos = 0;

  const peek = () => tokens[pos];
  const isOp = (v: string) => peek()?.kind === "op" && peek()!.value === v;
  const next = () => tokens[pos++];

  // A value can start here: number, name, or "(" -> implicit multiplication
  const startsValue = () => {
    const t = peek();
    return !!t && (t.kind === "num" || t.kind === "id" || (t.kind === "op" && t.value === "("));
  };

  const closeParen = () => {
    if (isOp(")")) next();
    else if (pos < tokens.length) throw new Error('Expected ")"');
    // at the end of input: auto-close
  };

  const primary = (): number => {
    const t = next();
    if (!t) throw new Error("Incomplete expression");
    if (t.kind === "num") return t.value;
    if (t.kind === "op" && t.value === "(") {
      const v = expr();
      closeParen();
      return v;
    }
    if (t.kind === "id") {
      if (t.value in FUNCTIONS) {
        if (!isOp("(")) throw new Error(`${t.value} needs "("`);
        next();
        const arg = expr();
        closeParen();
        return FUNCTIONS[t.value](arg);
      }
      if (t.value in CONSTANTS) return CONSTANTS[t.value];
      throw new Error(`Unknown "${t.value}"`);
    }
    throw new Error(`Unexpected "${t.value}"`);
  };

  // power is right-associative: 2^3^2 = 2^9
  const power = (): number => {
    const base = primary();
    if (isOp("^")) {
      next();
      return Math.pow(base, unary());
    }
    return base;
  };

  const unary = (): number => {
    if (isOp("-")) {
      next();
      return -unary();
    }
    if (isOp("+")) {
      next();
      return unary();
    }
    return power();
  };

  const term = (): number => {
    let v = unary();
    for (;;) {
      if (isOp("*") || isOp("/") || isOp("%")) {
        const op = next().value;
        const rhs = unary();
        v = op === "*" ? v * rhs : op === "/" ? v / rhs : v % rhs;
      } else if (startsValue()) {
        v *= unary(); // implicit: 2π, 3(4+1)
      } else {
        return v;
      }
    }
  };

  const expr = (): number => {
    let v = term();
    for (;;) {
      if (isOp("+") || isOp("-")) {
        const op = next().value;
        const rhs = term();
        v = op === "+" ? v + rhs : v - rhs;
      } else {
        return v;
      }
    }
  };

  if (tokens.length === 0) throw new Error("Empty expression");
  const result = expr();
  if (pos < tokens.length) throw new Error(`Unexpected "${tokens[pos].value}"`);
  return result;
};
