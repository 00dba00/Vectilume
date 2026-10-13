import { XMLParser, XMLValidator } from "fast-xml-parser";

export const STYLES = ["outline", "duotone", "solid"] as const;
export type IconStyle = (typeof STYLES)[number];

/** Chosen visual direction. Removed from the path once the catalog drops the direction level. */
export const DIRECTIONS = ["distinctive-gloss"] as const;

export const VIEW_BOX = "0 0 24 24";
export const STROKE_WIDTH = "1.75";

export type Severity = "error" | "warning";

export interface Issue {
  severity: Severity;
  rule: string;
  message: string;
}

export interface IconPath {
  direction: string | null;
  style: IconStyle;
  name: string;
}

const ALLOWED_ELEMENTS = new Set([
  "svg",
  "g",
  "path",
  "circle",
  "ellipse",
  "rect",
  "line",
  "polyline",
  "polygon",
]);

const FORBIDDEN_ATTRIBUTES = new Set(["id", "class", "style", "href", "xlink:href"]);
const COLOR_ATTRIBUTES = ["fill", "stroke", "color", "stop-color", "flood-color"];
const OPACITY_ATTRIBUTES = ["opacity", "fill-opacity", "stroke-opacity"];
const COORDINATE_ATTRIBUTES = ["x", "y", "cx", "cy", "x1", "y1", "x2", "y2"];

const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ICON_VAR_PATTERN = /^var\(--icon-(primary|secondary)(?:,\s*currentColor)?\)$/;
const NUMBER_PATTERN = /-?\d*\.?\d+(?:e-?\d+)?/gi;

/** Parses `<direction>/<style>/<name>.svg` or `<style>/<name>.svg` (forward slashes). */
export function parseIconPath(relPath: string): IconPath | Issue {
  const parts = relPath.split("/");
  const fileName = parts.pop() ?? "";
  const fail = (message: string): Issue => ({ severity: "error", rule: "path", message });

  if (!fileName.endsWith(".svg")) return fail(`expected a .svg file, got "${fileName}"`);
  const name = fileName.slice(0, -".svg".length);
  if (!NAME_PATTERN.test(name)) return fail(`icon name "${name}" must be kebab-case`);

  const [first, second] = parts;
  let direction: string | null = null;
  let style: string | undefined;
  if (parts.length === 2) {
    direction = first ?? null;
    style = second;
    if (!(DIRECTIONS as readonly string[]).includes(direction ?? "")) {
      return fail(`unknown direction "${direction}", expected one of: ${DIRECTIONS.join(", ")}`);
    }
  } else if (parts.length === 1) {
    style = first;
  } else {
    return fail(`expected <direction>/<style>/<name>.svg or <style>/<name>.svg`);
  }

  if (!(STYLES as readonly string[]).includes(style ?? "")) {
    return fail(`unknown style "${style}", expected one of: ${STYLES.join(", ")}`);
  }
  return { direction, style: style as IconStyle, name };
}

interface XmlNode {
  [tag: string]: XmlNode[] | Record<string, string> | undefined;
  ":@"?: Record<string, string>;
}

interface Element {
  tag: string;
  attrs: Record<string, string>;
  children: Element[];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  preserveOrder: true,
  allowBooleanAttributes: true,
  parseAttributeValue: false,
  parseTagValue: false,
});

function toElements(nodes: XmlNode[]): Element[] {
  const elements: Element[] = [];
  for (const node of nodes) {
    const tag = Object.keys(node).find((key) => key !== ":@");
    if (!tag || tag.startsWith("?") || tag.startsWith("#")) continue;
    elements.push({
      tag,
      attrs: node[":@"] ?? {},
      children: toElements((node[tag] as XmlNode[] | undefined) ?? []),
    });
  }
  return elements;
}

function hasText(nodes: XmlNode[]): boolean {
  return nodes.some((node) => {
    const text: unknown = node["#text"];
    if (typeof text === "string" && text.trim() !== "") return true;
    const tag = Object.keys(node).find((key) => key !== ":@" && !key.startsWith("?"));
    return tag !== undefined && tag !== "#text" && hasText((node[tag] as XmlNode[] | undefined) ?? []);
  });
}

function walk(element: Element, visit: (element: Element) => void): void {
  visit(element);
  for (const child of element.children) walk(child, visit);
}

/** Validates one icon's SVG source against the Vectilume source conventions. */
export function validateSvg(source: string, style: IconStyle): Issue[] {
  const issues: Issue[] = [];
  const error = (rule: string, message: string) => issues.push({ severity: "error", rule, message });
  const warn = (rule: string, message: string) => issues.push({ severity: "warning", rule, message });

  const wellFormed = XMLValidator.validate(source);
  if (wellFormed !== true) {
    error("xml", `${wellFormed.err.msg} (line ${wellFormed.err.line}, col ${wellFormed.err.col})`);
    return issues;
  }

  const nodes = parser.parse(source) as XmlNode[];
  const roots = toElements(nodes);
  const root = roots[0];
  if (roots.length !== 1 || !root || root.tag !== "svg") {
    error("root", "file must contain exactly one root <svg> element");
    return issues;
  }
  if (hasText(nodes)) error("text", "text content is not allowed");

  const rootAttrs = root.attrs;
  if (rootAttrs.xmlns !== "http://www.w3.org/2000/svg") {
    error("root", `root must have xmlns="http://www.w3.org/2000/svg"`);
  }
  if (rootAttrs.viewBox !== VIEW_BOX) {
    error("view-box", `viewBox must be "${VIEW_BOX}", got "${rootAttrs.viewBox ?? "(missing)"}"`);
  }
  for (const attr of ["width", "height"]) {
    if (attr in rootAttrs) error("root", `root must not set ${attr}; size is controlled by the consumer`);
  }

  const expectRoot = (attr: string, value: string | RegExp, label = String(value)) => {
    const actual = rootAttrs[attr];
    const ok = typeof value === "string" ? actual === value : actual !== undefined && value.test(actual);
    if (!ok) error("root-style", `${style} root must set ${attr}="${label}", got "${actual ?? "(missing)"}"`);
  };
  if (style === "outline" || style === "duotone") {
    expectRoot("fill", "none");
    if (style === "outline") expectRoot("stroke", "currentColor");
    else expectRoot("stroke", /^var\(--icon-primary(?:,\s*currentColor)?\)$/, "var(--icon-primary, currentColor)");
    expectRoot("stroke-width", STROKE_WIDTH);
    expectRoot("stroke-linecap", "round");
    expectRoot("stroke-linejoin", "round");
  } else {
    expectRoot("fill", "currentColor");
  }

  const usedVars = new Set<string>();
  walk(root, (element) => {
    const where = `<${element.tag}>`;
    if (!ALLOWED_ELEMENTS.has(element.tag)) {
      error("element", `${where} is not allowed; use only ${[...ALLOWED_ELEMENTS].join(", ")}`);
    }

    for (const [attr, value] of Object.entries(element.attrs)) {
      if (FORBIDDEN_ATTRIBUTES.has(attr) || attr.startsWith("on")) {
        error("attribute", `${where} must not use the "${attr}" attribute`);
      }

      if (COLOR_ATTRIBUTES.includes(attr)) {
        const iconVar = ICON_VAR_PATTERN.exec(value);
        if (iconVar) {
          usedVars.add(iconVar[1] ?? "");
          if (style !== "duotone") error("color", `${where} ${attr}="${value}": CSS variables are only allowed in duotone`);
        } else if (value !== "none" && value !== "currentColor") {
          error("color", `${where} ${attr}="${value}" is hardcoded; use currentColor, none or var(--icon-primary|secondary)`);
        }
      }

      if (OPACITY_ATTRIBUTES.includes(attr)) {
        const opacity = Number(value);
        if (Number.isNaN(opacity) || opacity < 0 || opacity > 1) {
          error("opacity", `${where} ${attr}="${value}" must be a number between 0 and 1`);
        }
      }

      if (attr === "stroke-width" && element !== root) {
        error("stroke-width", `${where} must not override stroke-width; it is set once on the root`);
      }

      if (COORDINATE_ATTRIBUTES.includes(attr) || attr === "points") {
        for (const match of value.match(NUMBER_PATTERN) ?? []) {
          const n = Number(match);
          if (n < 0 || n > 24) warn("bounds", `${where} ${attr}="${value}" lies outside the 24×24 grid`);
        }
      }

      if (attr === "d" || attr === "points" || COORDINATE_ATTRIBUTES.includes(attr)) {
        const precise = (value.match(NUMBER_PATTERN) ?? []).find((n) => (n.split(".")[1]?.length ?? 0) > 2);
        if (precise) warn("precision", `${where} ${attr} uses more than 2 decimals (${precise})`);
      }
    }
  });

  if (style === "duotone") {
    for (const name of ["primary", "secondary"]) {
      if (!usedVars.has(name)) error("duotone", `duotone icon must use var(--icon-${name})`);
    }
  }

  return issues;
}

/** Reports icons that are missing in some styles within the same direction. */
export function findMissingStyles(icons: IconPath[]): Issue[] {
  const groups = new Map<string, Map<IconStyle, Set<string>>>();
  for (const icon of icons) {
    const key = icon.direction ?? "";
    const byStyle = groups.get(key) ?? new Map<IconStyle, Set<string>>();
    const names = byStyle.get(icon.style) ?? new Set<string>();
    names.add(icon.name);
    byStyle.set(icon.style, names);
    groups.set(key, byStyle);
  }

  const issues: Issue[] = [];
  for (const [direction, byStyle] of groups) {
    const allNames = new Set([...byStyle.values()].flatMap((names) => [...names]));
    for (const style of byStyle.keys()) {
      const missing = [...allNames].filter((name) => !byStyle.get(style)?.has(name)).sort();
      if (missing.length > 0) {
        issues.push({
          severity: "warning",
          rule: "coverage",
          message: `${direction ? `${direction}/` : ""}${style} is missing: ${missing.join(", ")}`,
        });
      }
    }
  }
  return issues;
}
