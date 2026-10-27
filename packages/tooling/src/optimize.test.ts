import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { optimizeSvg } from "./optimize.ts";
import { STYLES, validateSvg } from "./svg-rules.ts";

const src = path.resolve(import.meta.dirname, "../../icons-svg/src");

describe("optimizeSvg", () => {
  it("keeps every published icon valid: grid, stroke, colour variables and Gloss rules", () => {
    const failures: string[] = [];
    for (const style of STYLES) {
      for (const file of readdirSync(path.join(src, style))) {
        const errors = validateSvg(optimizeSvg(readFileSync(path.join(src, style, file), "utf8")), style).filter(
          (issue) => issue.severity === "error",
        );
        if (errors.length) failures.push(`${style}/${file}: ${errors.map((issue) => issue.message).join("; ")}`);
      }
    }
    assert.deepEqual(failures.slice(0, 10), []);
  });
});
