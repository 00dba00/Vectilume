export interface BakeOptions {
  /** Pixel size of the exported image. */
  size: number;
  /** Concrete colour for currentColor. */
  color: string;
  /** Duotone layers; empty falls back to `color`, like the CSS variables do. */
  primary: string;
  secondary: string;
  strokeWidth: number;
}

/** An SVG with every colour variable and the stroke width resolved, so a rasterizer draws it as previewed. */
export function bakeSvg(svg: string, { size, color, primary, secondary, strokeWidth }: BakeOptions): string {
  return svg
    .replaceAll("var(--icon-primary, currentColor)", primary || color)
    .replaceAll("var(--icon-secondary, currentColor)", secondary || color)
    .replaceAll("currentColor", color)
    .replace(/stroke-width="[\d.]+"/, `stroke-width="${strokeWidth}"`)
    .replace("<svg ", `<svg width="${size}" height="${size}" `);
}
