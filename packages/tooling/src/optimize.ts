import { optimize } from "svgo";

/**
 * Minified SVG for the published packages. Sources stay hand-readable; only release output is
 * optimised, and `visual-diff` proves the pixels do not change.
 */
export function optimizeSvg(source: string): string {
  // Lossless settings only, each one found by the 0.1.0 visual diff:
  // - mergePaths off: merged overlapping strokes paint shared edges once, changing anti-aliasing (367 icons);
  // - no makeArcs / straightCurves / convertToQ: they swap curves for approximations (27 icons);
  // - no removeUseless: it drops the closing Z of stroked shapes, turning a join into two caps (13 icons);
  // - no applyTransforms / convertTransform: baking or merging rotate() and translate() rounds the
  //   rotation centre and shifts the shape (4 icons).
  const plugins = [
    {
      name: "preset-default" as const,
      params: {
        overrides: {
          mergePaths: false as const,
          convertTransform: false as const,
          convertPathData: { makeArcs: false as unknown as undefined, straightCurves: false, convertToQ: false, removeUseless: false, applyTransforms: false },
        },
      },
    },
  ];
  return optimize(source, { multipass: true, plugins }).data;
}
