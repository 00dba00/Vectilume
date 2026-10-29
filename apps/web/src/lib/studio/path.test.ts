import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { describe, it } from "node:test";
import { parsePath, serializePath, type Seg } from "./path.ts";

const close = (a: Seg[], b: Seg[]) => {
  assert.equal(a.length, b.length);
  a.forEach((s, i) => {
    const t = b[i];
    assert.equal(s.c, t.c);
    const nums = (x: Seg) => JSON.stringify(x).match(/-?\d+(\.\d+)?(e-?\d+)?/g)?.map(Number) ?? [];
    nums(s).forEach((v, j) => assert.ok(Math.abs(v - nums(t)[j]) <= 0.006, `segment ${i}: ${v} vs ${nums(t)[j]}`));
  });
};

describe("parsePath", () => {
  it("makes relative and shorthand commands absolute but keeps curves and arcs", () => {
    const segs = parsePath("M2 2h4v2l-1 1c1 1 2 1 3 0s1-1 2 0q1 1 2 0t2 0a2 2 0 0 1 2 2z");
    assert.deepEqual(
      segs.map((s) => s.c),
      ["M", "L", "L", "L", "C", "C", "Q", "Q", "A", "Z"],
    );
    assert.equal(serializePath(segs), "M2 2L6 2L6 4L5 5C6 6 7 6 8 5C9 4 9 4 10 5Q11 6 12 5Q13 4 14 5A2 2 0 0 1 16 7Z");
  });

  it("reads arc flags written without separators", () => {
    const [, arc] = parsePath("M0 0a1 1 0 0110 10");
    assert.deepEqual(arc, { c: "A", rx: 1, ry: 1, rot: 0, large: false, sweep: true, p: { x: 10, y: 10 } });
  });

  it("treats extra pairs after M as lines", () => {
    assert.equal(serializePath(parsePath("M1 1 2 2 3 3")), "M1 1L2 2L3 3");
  });

  it("rejects broken data", () => {
    assert.throws(() => parsePath("M1"));
    assert.throws(() => parsePath("1 1"));
  });

  it("round-trips every path in the library", () => {
    const root = new URL("../../../../../packages/icons-svg/src/", import.meta.url);
    let count = 0;
    for (const style of ["outline", "duotone", "solid"]) {
      for (const file of readdirSync(new URL(`${style}/`, root))) {
        const svg = readFileSync(new URL(`${style}/${file}`, root), "utf8");
        for (const [, d] of svg.matchAll(/ d="([^"]+)"/g)) {
          const segs = parsePath(d);
          close(parsePath(serializePath(segs)), segs);
          count++;
        }
      }
    }
    assert.ok(count > 5000, `only ${count} paths`);
  });
});
