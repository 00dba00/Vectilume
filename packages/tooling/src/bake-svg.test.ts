import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { bakeSvg } from "../../../apps/web/src/lib/bake-svg.ts";

const duotone =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--icon-primary, currentColor)" stroke-width="1.75">' +
  '<path fill="var(--icon-secondary, currentColor)" stroke="none" d="M1 1"/><path fill="currentColor" d="M2 2"/></svg>';

describe("bakeSvg", () => {
  const options = { size: 48, color: "rgb(0, 0, 0)", primary: "#2563eb", secondary: "#bfdbfe", strokeWidth: 2 };

  it("resolves the colour variables, currentColor, stroke width and size", () => {
    assert.equal(
      bakeSvg(duotone, options),
      '<svg width="48" height="48" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">' +
        '<path fill="#bfdbfe" stroke="none" d="M1 1"/><path fill="rgb(0, 0, 0)" d="M2 2"/></svg>',
    );
  });

  it("falls back to the colour when a duotone layer is not set", () => {
    const baked = bakeSvg(duotone, { ...options, primary: "", secondary: "" });
    assert.doesNotMatch(baked, /var\(|currentColor/);
    assert.match(baked, /stroke="rgb\(0, 0, 0\)"/);
  });
});
