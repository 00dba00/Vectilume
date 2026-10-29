import { parseSvg, type Element, type IconStyle } from "@vectilume/tooling/svg-rules";
import { anchors, fmt, mapSegPoints, parsePath, serializePath, type Pt, type Seg } from "./path";

export type { IconStyle };
export const STYLES: IconStyle[] = ["outline", "duotone", "solid"];

export type Geometry =
  /** `d` is the source text, kept until the path is edited so untouched paths are written back byte for byte. */
  | { kind: "path"; segs: Seg[]; d?: string }
  | { kind: "rect"; x: number; y: number; w: number; h: number; r: number }
  | { kind: "circle"; cx: number; cy: number; r: number }
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  /** Anything the studio cannot edit point by point (a transformed group): shown and kept, not editable. */
  | { kind: "raw"; markup: string };

export type Shape = Geometry & {
  id: string;
  /** Presentation attributes in source order (fill, stroke, fill-rule, opacity…), geometry excluded. */
  attrs: Record<string, string>;
  /** Studio-only: the Gloss highlight, checked for its gap to other details. Not written to the SVG. */
  gloss?: boolean;
};

export const ROOT: Record<IconStyle, Record<string, string>> = {
  outline: { fill: "none", stroke: "currentColor", "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round" },
  duotone: {
    fill: "none",
    stroke: "var(--icon-primary, currentColor)",
    "stroke-width": "1.75",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  },
  solid: { fill: "currentColor" },
};

const GEOMETRY_ATTRS: Record<Geometry["kind"], string[]> = {
  path: ["d"],
  rect: ["x", "y", "width", "height", "rx", "ry"],
  circle: ["cx", "cy", "r"],
  ellipse: ["cx", "cy", "rx", "ry"],
  raw: [],
};
const ELEMENTS = new Set(["path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "g"]);

let counter = 0;
export const newId = () => `s${++counter}`;

const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const safeAttrs = (attrs: Record<string, string>) =>
  Object.fromEntries(Object.entries(attrs).filter(([k]) => !k.startsWith("on") && k !== "style" && k !== "href" && k !== "xlink:href"));
const n = (v: string | undefined) => Number(v ?? 0) || 0;

function elementMarkup(el: Element): string {
  const attrs = Object.entries(safeAttrs(el.attrs))
    .map(([k, v]) => ` ${k}="${esc(v)}"`)
    .join("");
  if (!el.children.length) return `<${el.tag}${attrs}/>`;
  return `<${el.tag}${attrs}>${el.children.filter((c) => ELEMENTS.has(c.tag)).map(elementMarkup).join("")}</${el.tag}>`;
}

function shapeFrom(el: Element, inherited: Record<string, string>): Shape[] {
  if (!ELEMENTS.has(el.tag)) throw new Error(`<${el.tag}> is not allowed in an icon`);
  const own = safeAttrs(el.attrs);
  if (el.tag === "g") {
    if (own.transform) return [{ id: newId(), kind: "raw", markup: elementMarkup(el), attrs: {} }];
    return el.children.flatMap((child) => shapeFrom(child, { ...inherited, ...own }));
  }
  const all = { ...inherited, ...own };
  const pick = (geometryKeys: string[]) => Object.fromEntries(Object.entries(all).filter(([k]) => !geometryKeys.includes(k)));
  const base = (geo: Geometry, keys: string[]): Shape => ({ id: newId(), ...geo, attrs: pick(keys) });

  switch (el.tag) {
    case "path":
      return [base({ kind: "path", segs: parsePath(all.d ?? ""), d: all.d }, ["d"])];
    case "rect":
      return [base({ kind: "rect", x: n(all.x), y: n(all.y), w: n(all.width), h: n(all.height), r: n(all.rx ?? all.ry) }, GEOMETRY_ATTRS.rect)];
    case "circle":
      return [base({ kind: "circle", cx: n(all.cx), cy: n(all.cy), r: n(all.r) }, GEOMETRY_ATTRS.circle)];
    case "ellipse":
      return [base({ kind: "ellipse", cx: n(all.cx), cy: n(all.cy), rx: n(all.rx), ry: n(all.ry) }, GEOMETRY_ATTRS.ellipse)];
    case "line":
      return [
        base(
          { kind: "path", segs: [{ c: "M", p: { x: n(all.x1), y: n(all.y1) } }, { c: "L", p: { x: n(all.x2), y: n(all.y2) } }] },
          ["x1", "y1", "x2", "y2"],
        ),
      ];
    default: {
      // polyline / polygon
      const nums = (all.points ?? "").match(/-?\d*\.?\d+/g)?.map(Number) ?? [];
      const segs: Seg[] = [];
      for (let i = 0; i + 1 < nums.length; i += 2) segs.push({ c: i === 0 ? "M" : "L", p: { x: nums[i], y: nums[i + 1] } });
      if (el.tag === "polygon") segs.push({ c: "Z" });
      return [base({ kind: "path", segs }, ["points"])];
    }
  }
}

/** Reads an icon SVG into editable shapes. Root presentation attributes come from the style, not the file. */
export function importSvg(source: string): Shape[] {
  const root = parseSvg(source)[0];
  if (!root || root.tag !== "svg") throw new Error("The code must be one <svg> element");
  return root.children.flatMap((child) => shapeFrom(child, {}));
}

/** Re-applies Gloss marks to shapes that are written exactly as before (the mark is not part of the SVG). */
export function keepGloss(next: Shape[], previous: Shape[]): Shape[] {
  const marked = new Set(previous.filter((s) => s.gloss).map(shapeMarkup));
  return next.map((s) => (marked.has(shapeMarkup(s)) ? { ...s, gloss: true } : s));
}

export function geometryAttrs(shape: Shape): Record<string, string> {
  switch (shape.kind) {
    case "path":
      return { d: shape.d ?? serializePath(shape.segs) };
    case "rect":
      return { x: fmt(shape.x), y: fmt(shape.y), width: fmt(shape.w), height: fmt(shape.h), ...(shape.r > 0 ? { rx: fmt(shape.r) } : {}) };
    case "circle":
      return { cx: fmt(shape.cx), cy: fmt(shape.cy), r: fmt(shape.r) };
    case "ellipse":
      return { cx: fmt(shape.cx), cy: fmt(shape.cy), rx: fmt(shape.rx), ry: fmt(shape.ry) };
    case "raw":
      return {};
  }
}

const TAG: Record<Exclude<Geometry["kind"], "raw">, string> = { path: "path", rect: "rect", circle: "circle", ellipse: "ellipse" };

export function shapeMarkup(shape: Shape): string {
  if (shape.kind === "raw") return shape.markup;
  const attrs = { ...geometryAttrs(shape), ...shape.attrs };
  return `<${TAG[shape.kind]}${Object.entries(attrs)
    .map(([k, v]) => ` ${k}="${esc(v)}"`)
    .join("")}/>`;
}

/** The icon file, formatted like the sources in packages/icons-svg. */
export function exportSvg(shapes: Shape[], style: IconStyle): string {
  const root = Object.entries(ROOT[style])
    .map(([k, v]) => ` ${k}="${v}"`)
    .join("");
  const body = shapes.map((s) => `  ${shapeMarkup(s)}\n`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"${root}>\n${body}</svg>\n`;
}

/** Path data for any editable shape, for hit tests, measuring and "convert to path". */
export function toPathData(shape: Shape): string | null {
  switch (shape.kind) {
    case "path":
      return shape.d ?? serializePath(shape.segs);
    case "rect": {
      const { x, y, w, h } = shape;
      const r = Math.min(shape.r, w / 2, h / 2);
      if (r <= 0) return `M${fmt(x)} ${fmt(y)}H${fmt(x + w)}V${fmt(y + h)}H${fmt(x)}Z`;
      const a = `A${fmt(r)} ${fmt(r)} 0 0 1`;
      return (
        `M${fmt(x + r)} ${fmt(y)}H${fmt(x + w - r)}${a} ${fmt(x + w)} ${fmt(y + r)}V${fmt(y + h - r)}${a} ${fmt(x + w - r)} ${fmt(y + h)}` +
        `H${fmt(x + r)}${a} ${fmt(x)} ${fmt(y + h - r)}V${fmt(y + r)}${a} ${fmt(x + r)} ${fmt(y)}Z`
      );
    }
    case "circle":
    case "ellipse": {
      const rx = shape.kind === "circle" ? shape.r : shape.rx;
      const ry = shape.kind === "circle" ? shape.r : shape.ry;
      const { cx, cy } = shape;
      return `M${fmt(cx - rx)} ${fmt(cy)}A${fmt(rx)} ${fmt(ry)} 0 1 0 ${fmt(cx + rx)} ${fmt(cy)}A${fmt(rx)} ${fmt(ry)} 0 1 0 ${fmt(cx - rx)} ${fmt(cy)}Z`;
    }
    case "raw":
      return null;
  }
}

export function toPath(shape: Shape): Shape {
  const d = toPathData(shape);
  if (shape.kind === "path" || d === null) return shape;
  return { id: shape.id, attrs: shape.attrs, gloss: shape.gloss, kind: "path", segs: parsePath(d) };
}

export function translate(shape: Shape, dx: number, dy: number): Shape {
  switch (shape.kind) {
    case "path":
      return { ...shape, d: undefined, segs: mapSegPoints(shape.segs, (p) => ({ x: p.x + dx, y: p.y + dy })) };
    case "rect":
      return { ...shape, x: shape.x + dx, y: shape.y + dy };
    case "circle":
    case "ellipse":
      return { ...shape, cx: shape.cx + dx, cy: shape.cy + dy };
    case "raw":
      return shape;
  }
}

export interface Handle {
  key: string;
  p: Pt;
  type: "anchor" | "control";
  /** Draws a line from the control to the anchor it belongs to. */
  to?: Pt;
}

export function handles(shape: Shape): Handle[] {
  switch (shape.kind) {
    case "path": {
      const out: Handle[] = [];
      let prev: Pt | null = null;
      shape.segs.forEach((s, i) => {
        if (s.c === "Z") return;
        if (s.c === "C") {
          out.push({ key: `${i}:c1`, p: s.c1, type: "control", to: prev ?? s.p });
          out.push({ key: `${i}:c2`, p: s.c2, type: "control", to: s.p });
        }
        if (s.c === "Q") out.push({ key: `${i}:c1`, p: s.c1, type: "control", to: s.p });
        out.push({ key: `${i}:p`, p: s.p, type: "anchor" });
        prev = s.p;
      });
      return out;
    }
    case "rect":
      return [
        { key: "tl", p: { x: shape.x, y: shape.y }, type: "anchor" },
        { key: "br", p: { x: shape.x + shape.w, y: shape.y + shape.h }, type: "anchor" },
        { key: "r", p: { x: shape.x + shape.r, y: shape.y }, type: "control", to: { x: shape.x, y: shape.y } },
      ];
    case "circle":
      return [
        { key: "c", p: { x: shape.cx, y: shape.cy }, type: "anchor" },
        { key: "r", p: { x: shape.cx + shape.r, y: shape.cy }, type: "control", to: { x: shape.cx, y: shape.cy } },
      ];
    case "ellipse":
      return [
        { key: "c", p: { x: shape.cx, y: shape.cy }, type: "anchor" },
        { key: "rx", p: { x: shape.cx + shape.rx, y: shape.cy }, type: "control", to: { x: shape.cx, y: shape.cy } },
        { key: "ry", p: { x: shape.cx, y: shape.cy + shape.ry }, type: "control", to: { x: shape.cx, y: shape.cy } },
      ];
    case "raw":
      return [];
  }
}

const same = (a: Pt, b: Pt) => Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6;

/** Moves one handle. Moving an anchor carries its two bezier handles with it, like a pen tool does. */
export function moveHandle(shape: Shape, key: string, p: Pt): Shape {
  switch (shape.kind) {
    case "path": {
      const [index, part] = key.split(":");
      const i = Number(index);
      const segs = shape.segs.map((s) => ({ ...s })) as Seg[];
      const s = segs[i];
      if (!s || s.c === "Z") return shape;
      if (part === "c1" && (s.c === "C" || s.c === "Q")) s.c1 = p;
      else if (part === "c2" && s.c === "C") s.c2 = p;
      else if (part === "p") {
        const old = s.p;
        const dx = p.x - old.x;
        const dy = p.y - old.y;
        const shift = (q: Pt) => ({ x: q.x + dx, y: q.y + dy });
        s.p = p;
        if (s.c === "C") s.c2 = shift(s.c2);
        const next = segs[i + 1];
        if (next?.c === "C") next.c1 = shift(next.c1);
        // A closed subpath often repeats its start point right before Z: keep the two together.
        if (s.c === "M") {
          for (let j = i + 1; j < segs.length && segs[j].c !== "M"; j++) {
            const sj = segs[j];
            if (sj.c !== "Z" && segs[j + 1]?.c === "Z" && same(sj.p, old)) {
              sj.p = p;
              if (sj.c === "C") sj.c2 = shift(sj.c2);
            }
          }
        }
      }
      return { ...shape, d: undefined, segs };
    }
    case "rect": {
      if (key === "tl") {
        const right = shape.x + shape.w;
        const bottom = shape.y + shape.h;
        return { ...shape, x: Math.min(p.x, right), y: Math.min(p.y, bottom), w: Math.abs(right - p.x), h: Math.abs(bottom - p.y) };
      }
      if (key === "br") return { ...shape, w: Math.max(0, p.x - shape.x), h: Math.max(0, p.y - shape.y) };
      return { ...shape, r: Math.max(0, Math.min(p.x - shape.x, shape.w / 2, shape.h / 2)) };
    }
    case "circle":
      return key === "c" ? { ...shape, cx: p.x, cy: p.y } : { ...shape, r: Math.max(0, Math.hypot(p.x - shape.cx, p.y - shape.cy)) };
    case "ellipse":
      if (key === "c") return { ...shape, cx: p.x, cy: p.y };
      return key === "rx" ? { ...shape, rx: Math.max(0, Math.abs(p.x - shape.cx)) } : { ...shape, ry: Math.max(0, Math.abs(p.y - shape.cy)) };
    case "raw":
      return shape;
  }
}

/** Points that matter for the keyline check: where strokes start, end and bend. */
export function keyPoints(shape: Shape): Pt[] {
  switch (shape.kind) {
    case "path":
      return anchors(shape.segs);
    case "rect":
      return [
        { x: shape.x, y: shape.y },
        { x: shape.x + shape.w, y: shape.y + shape.h },
      ];
    case "circle":
      return [
        { x: shape.cx - shape.r, y: shape.cy - shape.r },
        { x: shape.cx + shape.r, y: shape.cy + shape.r },
      ];
    case "ellipse":
      return [
        { x: shape.cx - shape.rx, y: shape.cy - shape.ry },
        { x: shape.cx + shape.rx, y: shape.cy + shape.ry },
      ];
    case "raw":
      return [];
  }
}

/** Display name in the layer list. */
export function shapeLabel(shape: Shape): string {
  if (shape.gloss) return "Gloss";
  if (shape.kind === "raw") return "Group (read only)";
  if (shape.kind !== "path") return shape.kind[0].toUpperCase() + shape.kind.slice(1);
  const filled = shape.attrs.fill && shape.attrs.fill !== "none";
  const closed = shape.segs.some((s) => s.c === "Z");
  const points = anchors(shape.segs).length;
  if (points === 2 && !closed) return "Line";
  return `${filled ? "Filled path" : closed ? "Closed path" : "Path"} · ${points} pts`;
}

/** Point-level edits on a path anchor (`<segment index>:p`). */
export function editAnchor(shape: Shape, key: string, op: "delete" | "curve" | "straight"): Shape {
  if (shape.kind !== "path") return shape;
  const i = Number(key.split(":")[0]);
  const segs = [...shape.segs];
  const s = segs[i];
  if (!s || s.c === "Z") return shape;
  if (op === "delete") {
    segs.splice(i, 1);
    // The next segment starts the subpath when its start point goes away.
    if (s.c === "M" && segs[i] && segs[i].c !== "Z") segs[i] = { c: "M", p: (segs[i] as { p: Pt }).p };
    while (segs.length && segs[segs.length - 1].c === "Z" && segs.length < 3) segs.pop();
    return { ...shape, d: undefined, segs };
  }
  if (s.c === "M") return shape;
  const prev = [...segs.slice(0, i)].reverse().find((x) => x.c !== "Z") as { p: Pt } | undefined;
  if (!prev) return shape;
  if (op === "straight") segs[i] = { c: "L", p: s.p };
  else if (s.c === "L" || s.c === "A") {
    const third = (t: number): Pt => ({ x: prev.p.x + (s.p.x - prev.p.x) * t, y: prev.p.y + (s.p.y - prev.p.y) * t });
    segs[i] = { c: "C", c1: third(1 / 3), c2: third(2 / 3), p: s.p };
  } else if (s.c === "Q") segs[i] = { c: "C", c1: s.c1, c2: s.c1, p: s.p };
  return { ...shape, d: undefined, segs };
}

export function setClosed(shape: Shape, closed: boolean): Shape {
  if (shape.kind !== "path") return shape;
  const open = shape.segs.filter((s) => s.c !== "Z");
  return { ...shape, d: undefined, segs: closed ? [...open, { c: "Z" }] : open };
}
