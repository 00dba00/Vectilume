/**
 * One SVG sprite per style: every icon becomes `<symbol id="<name>">`, keeping its viewBox and the
 * root presentation attributes (fill, stroke, stroke-width…), so `<use href="…#trash">` draws it
 * exactly like the standalone file and still inherits currentColor and the duotone variables.
 */
export function buildSprite(icons: { id: string; svg: string }[]): string {
  const symbols = icons.map(({ id, svg }) => {
    const match = /^\s*<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/.exec(svg);
    if (!match) throw new Error(`${id}: not a single <svg> element`);
    const attrs = match[1]!.replace(/\s+xmlns="[^"]*"/, "");
    return `<symbol id="${id}"${attrs}>${match[2]}</symbol>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg">${symbols.join("")}</svg>\n`;
}
