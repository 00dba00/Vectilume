import sharp from "sharp";
import { bakeSvg } from "@/lib/bake-svg";

// Mail apps do not show SVG, so emails load these PNGs: the logo, or any published Vectilume icon.
const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 1 108 20" width="432" height="80"><path d="M0 8l5 12 5-12M13 14h12a6 6 0 1 0-1.76 4.24M38.24 9.76a6 6 0 1 0 0 8.48M42 8h7M45 4v12a4 4 0 0 0 4 4h1M53 8v12M53 4v.01M57 2v18M60 8v6a6 6 0 0 0 12 0M72 8v12M75 20v-8a4 4 0 0 1 8 0v8m0-8a4 4 0 0 1 8 0v8M94 14h12a6 6 0 1 0-1.76 4.24" fill="none" stroke="#2d2b30" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/** Icons drawn white on a coloured tile: /email/on-blue-rocket.png. */
const TILES: Record<string, string> = { blue: "#155bd0", green: "#1b7f3b", red: "#b42318", violet: "#5b2bb5" };

const png = (body: Buffer) =>
  new Response(new Uint8Array(body), { headers: { "content-type": "image/png", "cache-control": "public, max-age=86400, immutable" } });

async function publishedSvg(id: string): Promise<string | null> {
  const response = await fetch(`https://unpkg.com/@vectilume/icons@latest/outline/${id}.svg`);
  return response.ok ? response.text() : null;
}

/** /email/logo.png, /email/<icon>.png (outline, text colour) or /email/on-<colour>-<icon>.png (white outline on a tile). */
export async function GET(_request: Request, ctx: RouteContext<"/email/[file]">) {
  const { file } = await ctx.params;
  if (file === "logo.png") return png(await sharp(Buffer.from(LOGO)).png().toBuffer());

  const match = /^(?:on-(blue|green|red|violet)-)?([a-z0-9]+(?:-[a-z0-9]+)*)\.png$/.exec(file);
  const svg = match && (await publishedSvg(match[2]));
  if (!match || !svg) return new Response("not found", { status: 404 });

  const tile = match[1] ? TILES[match[1]] : null;
  const color = tile ? "#ffffff" : "#2d2b30";
  const icon = await sharp(Buffer.from(bakeSvg(svg, { size: tile ? 48 : 96, strokeWidth: 1.75, color, primary: color, secondary: color }))).png().toBuffer();
  if (!tile) return png(icon);
  // 80 × 80 rounded tile with the icon centred, shown at 40 × 40.
  const background = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="22" fill="${tile}"/></svg>`);
  return png(await sharp(background).composite([{ input: icon, top: 16, left: 16 }]).png().toBuffer());
}
