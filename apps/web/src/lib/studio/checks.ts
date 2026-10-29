import { validateSvg, type Issue } from "@vectilume/tooling/svg-rules";
import { keyPoints, shapeLabel, toPathData, type IconStyle, type Shape } from "./model";

export interface Check extends Issue {
  /** The shape the issue is about, when the studio knows it. */
  shape?: string;
}

const STROKE = 1.75;
const MIN_GLOSS_GAP = 0.5;

/** Points every 0.1 along a shape, measured by the browser's own path geometry. */
function sample(d: string): { x: number; y: number }[] {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  const length = path.getTotalLength();
  const steps = Math.max(2, Math.ceil(length / 0.1));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const p = path.getPointAtLength((i / steps) * length);
    return { x: p.x, y: p.y };
  });
}

function gap(a: { x: number; y: number }[], b: { x: number; y: number }[]) {
  let min = Infinity;
  for (const p of a) for (const q of b) min = Math.min(min, Math.hypot(p.x - q.x, p.y - q.y));
  return min;
}

/** The library validator plus studio checks: the 2–22 keyline and the Gloss gap (≥ 0.5 visible). */
export function runChecks(svg: string, shapes: Shape[], style: IconStyle): Check[] {
  const checks: Check[] = validateSvg(svg, style);
  if (!shapes.length) return [{ severity: "warning", rule: "empty", message: "Nothing drawn in this style yet" }];

  const edge = style === "solid" ? 0 : STROKE / 2;
  for (const s of shapes) {
    const out = keyPoints(s).some((p) => p.x - edge < 2 - 0.01 || p.y - edge < 2 - 0.01 || p.x + edge > 22.01 || p.y + edge > 22.01);
    if (out) checks.push({ severity: "warning", rule: "keyline", message: `${shapeLabel(s)} reaches outside the 2–22 keyline`, shape: s.id });
  }

  if (style !== "solid") {
    const glosses = shapes.filter((s) => s.gloss);
    if (style === "outline" && glosses.length === 0 && shapes.length > 1) {
      checks.push({ severity: "warning", rule: "gloss", message: "No Gloss marked: select the highlight stroke and tick Gloss (line-only glyphs have none)" });
    }
    for (const g of glosses) {
      const gd = toPathData(g);
      if (!gd) continue;
      const gp = sample(gd);
      for (const s of shapes) {
        if (s === g || s.attrs.stroke === "none") continue;
        const d = toPathData(s);
        if (!d) continue;
        const visible = gap(gp, sample(d)) - STROKE;
        if (visible < MIN_GLOSS_GAP) {
          checks.push({
            severity: "warning",
            rule: "gloss-gap",
            message: `Gloss is ${Math.max(0, visible).toFixed(2)} from ${shapeLabel(s)}; keep at least ${MIN_GLOSS_GAP} visible`,
            shape: g.id,
          });
        }
      }
    }
  }
  return checks;
}
