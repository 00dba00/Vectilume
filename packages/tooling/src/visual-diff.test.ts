import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { changedPixels, paint } from "./visual-diff.ts";

describe("paint", () => {
  it("replaces the colour variables and currentColor with fixed colours", () => {
    const svg = '<svg stroke="var(--icon-primary, currentColor)"><path fill="var(--icon-secondary, currentColor)"/><path fill="currentColor"/></svg>';
    assert.equal(paint(svg), '<svg stroke="#1d4ed8"><path fill="#93c5fd"/><path fill="#111111"/></svg>');
  });
});

describe("changedPixels", () => {
  it("ignores anti-aliasing noise and flags real changes", () => {
    const a = new Uint8Array([0, 0, 0, 255, 0, 0, 0, 0]);
    const b = new Uint8Array([20, 20, 20, 255, 0, 0, 0, 200]);
    assert.deepEqual(changedPixels(a, b), [false, true]);
  });
});
