import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findMissingStyles, parseIconPath, validateSvg, type Issue } from "./svg-rules.ts";

const OUTLINE_ROOT =
  'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"';
const DUOTONE_ROOT =
  'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--icon-primary, currentColor)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"';
const SOLID_ROOT = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"';

const rules = (issues: Issue[], severity: Issue["severity"] = "error") =>
  issues.filter((issue) => issue.severity === severity).map((issue) => issue.rule);

describe("parseIconPath", () => {
  it("accepts direction/style/name and style/name", () => {
    assert.deepEqual(parseIconPath("soft-geometric/outline/calendar-add.svg"), {
      direction: "soft-geometric",
      style: "outline",
      name: "calendar-add",
    });
    assert.deepEqual(parseIconPath("solid/home.svg"), { direction: null, style: "solid", name: "home" });
  });

  it("rejects unknown styles, directions and non-kebab names", () => {
    for (const bad of ["soft-geometric/thin/home.svg", "retro/outline/home.svg", "outline/CalendarAdd.svg", "home.svg"]) {
      assert.equal((parseIconPath(bad) as Issue).severity, "error", bad);
    }
  });
});

describe("validateSvg", () => {
  it("accepts valid icons in every style", () => {
    assert.deepEqual(validateSvg(`<svg ${OUTLINE_ROOT}><path d="M4 10.5 12 4l8 6.5V20H4z"/></svg>`, "outline"), []);
    assert.deepEqual(
      validateSvg(
        `<svg ${DUOTONE_ROOT}><path d="M4 10.5 12 4l8 6.5V20H4z" fill="var(--icon-secondary, currentColor)" stroke="none"/><path d="M4 10.5 12 4l8 6.5V20H4z"/></svg>`,
        "duotone",
      ),
      [],
    );
    assert.deepEqual(validateSvg(`<svg ${SOLID_ROOT}><circle cx="12" cy="12" r="8"/></svg>`, "solid"), []);
  });

  it("rejects malformed XML and wrong root", () => {
    assert.deepEqual(rules(validateSvg("<svg><path></svg>", "outline")), ["xml"]);
    assert.deepEqual(rules(validateSvg(`<g ${OUTLINE_ROOT}/>`, "outline")), ["root"]);
  });

  it("requires the 24×24 viewBox and no fixed size", () => {
    const svg = `<svg ${OUTLINE_ROOT.replace("0 0 24 24", "0 0 32 32")} width="24"><path d="M1 1h2"/></svg>`;
    assert.deepEqual(rules(validateSvg(svg, "outline")), ["view-box", "root"]);
  });

  it("rejects hardcoded colors and CSS variables outside duotone", () => {
    assert.deepEqual(rules(validateSvg(`<svg ${OUTLINE_ROOT}><path d="M1 1h2" stroke="#2563EB"/></svg>`, "outline")), ["color"]);
    assert.deepEqual(
      rules(validateSvg(`<svg ${OUTLINE_ROOT}><path d="M1 1h2" fill="var(--icon-secondary)"/></svg>`, "outline")),
      ["color"],
    );
  });

  it("requires both duotone layers", () => {
    assert.deepEqual(rules(validateSvg(`<svg ${DUOTONE_ROOT}><path d="M1 1h2"/></svg>`, "duotone")), ["duotone"]);
  });

  it("enforces root stroke settings and forbids per-element stroke-width", () => {
    const svg = `<svg ${OUTLINE_ROOT.replace('stroke-linecap="round"', 'stroke-linecap="butt"')}><path d="M1 1h2" stroke-width="2"/></svg>`;
    assert.deepEqual(rules(validateSvg(svg, "outline")), ["root-style", "stroke-width"]);
  });

  it("rejects unsafe elements and attributes", () => {
    const svg = `<svg ${OUTLINE_ROOT}><script/><path id="a" class="b" style="fill:red" onclick="x()" d="M1 1h2"/><text>hi</text></svg>`;
    assert.deepEqual(rules(validateSvg(svg, "outline")).sort(), [
      "attribute",
      "attribute",
      "attribute",
      "attribute",
      "element",
      "element",
      "text",
    ]);
  });

  it("warns about out-of-grid coordinates and excess precision", () => {
    const svg = `<svg ${OUTLINE_ROOT}><line x1="-1" y1="2" x2="25" y2="2"/><path d="M1.12345 2h3"/></svg>`;
    assert.deepEqual(rules(validateSvg(svg, "outline")), []);
    assert.deepEqual(rules(validateSvg(svg, "outline"), "warning"), ["bounds", "bounds", "precision"]);
  });
});

describe("findMissingStyles", () => {
  it("lists icons missing from a style within a direction", () => {
    const issues = findMissingStyles([
      { direction: "distinctive", style: "outline", name: "home" },
      { direction: "distinctive", style: "outline", name: "wallet" },
      { direction: "distinctive", style: "duotone", name: "home" },
      { direction: "soft-geometric", style: "outline", name: "wallet" },
    ]);
    assert.deepEqual(
      issues.map((issue) => issue.message),
      ["distinctive/duotone is missing: wallet"],
    );
  });
});
