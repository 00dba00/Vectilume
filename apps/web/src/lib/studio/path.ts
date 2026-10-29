/**
 * SVG path data as absolute, typed segments. Shorthands become their full form (H/V → L, S → C, T → Q),
 * but curves and arcs keep their type, so an untouched arc is written back as the same arc.
 */

export interface Pt {
  x: number;
  y: number;
}

export type Seg =
  | { c: "M"; p: Pt }
  | { c: "L"; p: Pt }
  | { c: "C"; c1: Pt; c2: Pt; p: Pt }
  | { c: "Q"; c1: Pt; p: Pt }
  | { c: "A"; rx: number; ry: number; rot: number; large: boolean; sweep: boolean; p: Pt }
  | { c: "Z" };

const TOKEN = /([MLHVCSQTAZmlhvcsqtaz])|(-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)/g;

/** Arc flags may be written without separators ("a1 1 0 0110 10"), so they are read one digit at a time. */
function tokenize(d: string): (string | number)[] {
  const out: (string | number)[] = [];
  let arcIndex = -1;
  let i = 0;
  while (i < d.length) {
    const ch = d[i];
    if (/[\s,]/.test(ch)) {
      i++;
      continue;
    }
    if (/[A-Za-z]/.test(ch)) {
      out.push(ch);
      arcIndex = ch === "A" || ch === "a" ? 0 : -1;
      i++;
      continue;
    }
    if (arcIndex >= 0 && (arcIndex % 7 === 3 || arcIndex % 7 === 4) && (ch === "0" || ch === "1")) {
      out.push(Number(ch));
      arcIndex++;
      i++;
      continue;
    }
    TOKEN.lastIndex = i;
    const m = TOKEN.exec(d);
    if (!m || m.index !== i || !m[2]) throw new Error(`Unexpected "${ch}" in path data at ${i}`);
    out.push(Number(m[2]));
    if (arcIndex >= 0) arcIndex++;
    i += m[2].length;
  }
  return out;
}

export function parsePath(d: string): Seg[] {
  const tokens = tokenize(d);
  const segs: Seg[] = [];
  let cur: Pt = { x: 0, y: 0 };
  let start: Pt = { x: 0, y: 0 };
  let lastCtrl: Pt | null = null;
  let lastCmd = "";
  let i = 0;
  let cmd = "";

  const num = () => {
    const t = tokens[i++];
    if (typeof t !== "number") throw new Error(`Path data is missing a number after ${cmd}`);
    return t;
  };

  while (i < tokens.length) {
    if (typeof tokens[i] === "string") cmd = tokens[i++] as string;
    else if (!cmd) throw new Error("Path data must start with a command");
    else if (cmd === "M") cmd = "L";
    else if (cmd === "m") cmd = "l";

    const rel = cmd === cmd.toLowerCase();
    const up = cmd.toUpperCase();
    const pt = (x: number, y: number): Pt => (rel ? { x: cur.x + x, y: cur.y + y } : { x, y });
    let ctrl: Pt | null = null;

    switch (up) {
      case "M": {
        const p = pt(num(), num());
        segs.push({ c: "M", p });
        cur = start = p;
        break;
      }
      case "L": {
        const p = pt(num(), num());
        segs.push({ c: "L", p });
        cur = p;
        break;
      }
      case "H": {
        const x = num();
        cur = { x: rel ? cur.x + x : x, y: cur.y };
        segs.push({ c: "L", p: cur });
        break;
      }
      case "V": {
        const y = num();
        cur = { x: cur.x, y: rel ? cur.y + y : y };
        segs.push({ c: "L", p: cur });
        break;
      }
      case "C": {
        const c1 = pt(num(), num());
        const c2 = pt(num(), num());
        const p = pt(num(), num());
        segs.push({ c: "C", c1, c2, p });
        ctrl = c2;
        cur = p;
        break;
      }
      case "S": {
        const c1: Pt = lastCtrl && "CS".includes(lastCmd) ? { x: 2 * cur.x - lastCtrl.x, y: 2 * cur.y - lastCtrl.y } : cur;
        const c2 = pt(num(), num());
        const p = pt(num(), num());
        segs.push({ c: "C", c1, c2, p });
        ctrl = c2;
        cur = p;
        break;
      }
      case "Q": {
        const c1 = pt(num(), num());
        const p = pt(num(), num());
        segs.push({ c: "Q", c1, p });
        ctrl = c1;
        cur = p;
        break;
      }
      case "T": {
        const c1: Pt = lastCtrl && "QT".includes(lastCmd) ? { x: 2 * cur.x - lastCtrl.x, y: 2 * cur.y - lastCtrl.y } : cur;
        const p = pt(num(), num());
        segs.push({ c: "Q", c1, p });
        ctrl = c1;
        cur = p;
        break;
      }
      case "A": {
        const rx = num();
        const ry = num();
        const rot = num();
        const large = num() !== 0;
        const sweep = num() !== 0;
        const p = pt(num(), num());
        segs.push({ c: "A", rx, ry, rot, large, sweep, p });
        cur = p;
        break;
      }
      case "Z":
        segs.push({ c: "Z" });
        cur = start;
        break;
      default:
        throw new Error(`Unknown path command ${cmd}`);
    }
    lastCtrl = ctrl;
    lastCmd = up;
    if (up === "Z" && typeof tokens[i] === "number") throw new Error("Numbers after Z need a command");
  }
  return segs;
}

/** At most 2 decimals, no trailing zeros, no "-0". */
export const fmt = (n: number) => {
  const r = Math.round(n * 100) / 100;
  return String(Object.is(r, -0) ? 0 : r);
};
const fp = (p: Pt) => `${fmt(p.x)} ${fmt(p.y)}`;

export function serializePath(segs: Seg[]): string {
  return segs
    .map((s) => {
      switch (s.c) {
        case "M":
        case "L":
          return `${s.c}${fp(s.p)}`;
        case "C":
          return `C${fp(s.c1)} ${fp(s.c2)} ${fp(s.p)}`;
        case "Q":
          return `Q${fp(s.c1)} ${fp(s.p)}`;
        case "A":
          return `A${fmt(s.rx)} ${fmt(s.ry)} ${fmt(s.rot)} ${s.large ? 1 : 0} ${s.sweep ? 1 : 0} ${fp(s.p)}`;
        case "Z":
          return "Z";
      }
    })
    .join("");
}

export const mapSegPoints = (segs: Seg[], f: (p: Pt) => Pt): Seg[] =>
  segs.map((s) => {
    switch (s.c) {
      case "Z":
        return s;
      case "C":
        return { ...s, c1: f(s.c1), c2: f(s.c2), p: f(s.p) };
      case "Q":
        return { ...s, c1: f(s.c1), p: f(s.p) };
      default:
        return { ...s, p: f(s.p) };
    }
  });

/** End points of every segment (where the pen lands), skipping Z. */
export const anchors = (segs: Seg[]): Pt[] => segs.flatMap((s) => (s.c === "Z" ? [] : [s.p]));
