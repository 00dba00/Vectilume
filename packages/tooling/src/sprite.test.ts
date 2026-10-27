import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildSprite } from "./sprite.ts";

describe("buildSprite", () => {
  it("turns each icon into a symbol that keeps its viewBox and root attributes", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M1 1"/></svg>';
    assert.equal(
      buildSprite([{ id: "check", svg }, { id: "tick", svg }]),
      '<svg xmlns="http://www.w3.org/2000/svg">' +
        '<symbol id="check" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M1 1"/></symbol>' +
        '<symbol id="tick" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M1 1"/></symbol></svg>\n',
    );
  });

  it("rejects anything but a single svg element", () => {
    assert.throws(() => buildSprite([{ id: "x", svg: "<g/>" }]), /single <svg>/);
  });
});
