import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { normalizeSvg } from "./build-manifest.ts";
import { STYLES } from "./svg-rules.ts";

const PACKAGE = "@vectilume/icons";
const SIZE = 96;
/** Per-channel difference that still counts as anti-aliasing noise rather than a change. */
const TOLERANCE = 48;

/** Fixed colours for the CSS variables and currentColor, which a rasterizer cannot resolve. */
export function paint(svg: string): string {
  return svg
    .replaceAll("var(--icon-primary, currentColor)", "#1d4ed8")
    .replaceAll("var(--icon-secondary, currentColor)", "#93c5fd")
    .replaceAll("currentColor", "#111111");
}

/** Pixels (RGBA, same size) where any channel differs by more than the tolerance. */
export function changedPixels(a: Uint8Array, b: Uint8Array, tolerance = TOLERANCE): boolean[] {
  if (a.length !== b.length) throw new Error("images differ in size");
  const changed: boolean[] = [];
  for (let i = 0; i < a.length; i += 4) {
    changed.push([0, 1, 2, 3].some((c) => Math.abs(a[i + c]! - b[i + c]!) > tolerance));
  }
  return changed;
}

const render = async (svg: string) =>
  new Uint8Array(await sharp(Buffer.from(paint(svg)), { density: 288 }).resize(SIZE, SIZE).ensureAlpha().raw().toBuffer());

const png = (rgba: Uint8Array) => sharp(rgba, { raw: { width: SIZE, height: SIZE, channels: 4 } }).png().toBuffer();
const dataUri = (buffer: Buffer) => `data:image/png;base64,${buffer.toString("base64")}`;

/** The new icon faded, with changed pixels in red. */
function diffImage(next: Uint8Array, changed: boolean[]): Uint8Array {
  const out = new Uint8Array(next.length);
  changed.forEach((hit, p) => {
    const i = p * 4;
    if (hit) out.set([220, 38, 38, 255], i);
    else out.set([next[i]!, next[i + 1]!, next[i + 2]!, Math.round(next[i + 3]! * 0.25)], i);
  });
  return out;
}

/** Downloads and unpacks the latest published package; returns its version and folder. */
async function fetchPublished(work: string): Promise<{ version: string; dir: string }> {
  const meta = await fetch(`https://registry.npmjs.org/${PACKAGE.replace("/", "%2F")}`);
  if (!meta.ok) throw new Error(`npm registry answered ${meta.status} for ${PACKAGE}`);
  const json = (await meta.json()) as { "dist-tags": { latest: string }; versions: Record<string, { dist: { tarball: string } }> };
  const version = json["dist-tags"].latest;
  const tarball = await fetch(json.versions[version]!.dist.tarball);
  if (!tarball.ok) throw new Error(`cannot download ${PACKAGE}@${version} (${tarball.status})`);
  const file = path.join(work, "package.tgz");
  await writeFile(file, Buffer.from(await tarball.arrayBuffer()));
  const tar = spawnSync("tar", ["-xzf", "package.tgz"], { cwd: work });
  if (tar.status !== 0) throw new Error(`tar failed: ${tar.stderr}`);
  return { version, dir: path.join(work, "package") };
}

interface Changed {
  id: string;
  pixels: number;
  images: [string, string, string];
}

async function main(): Promise<void> {
  const root = path.resolve(process.argv[2] ?? ".");
  const work = await mkdtemp(path.join(tmpdir(), "vectilume-diff-"));
  try {
    const { version, dir } = await fetchPublished(work);
    const visible: Changed[] = [];
    const codeOnly: string[] = [];
    const missing: string[] = [];
    let added = 0;

    for (const style of STYLES) {
      const published = new Set((await readdir(path.join(dir, style))).filter((f) => f.endsWith(".svg")));
      for (const file of published) {
        const id = `${style}/${file.slice(0, -4)}`;
        const source = path.join(root, "src", style, file);
        if (!existsSync(source)) {
          missing.push(id);
          continue;
        }
        const [before, after] = await Promise.all([readFile(path.join(dir, style, file), "utf8"), readFile(source, "utf8")]);
        if (normalizeSvg(before) === normalizeSvg(after)) continue;
        const [a, b] = await Promise.all([render(before), render(after)]);
        const changed = changedPixels(a, b);
        const pixels = changed.filter(Boolean).length;
        if (pixels === 0) {
          codeOnly.push(id);
          continue;
        }
        const images = await Promise.all([png(a), png(b), png(diffImage(b, changed))]);
        visible.push({ id, pixels, images: images.map(dataUri) as Changed["images"] });
      }
      added += (await readdir(path.join(root, "src", style))).filter((f) => f.endsWith(".svg") && !published.has(f)).length;
    }

    visible.sort((x, y) => y.pixels - x.pixels);
    const out = path.join(root, "dist/visual-diff.html");
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, report(version, visible, codeOnly, missing, added));

    console.log(`compared with ${PACKAGE}@${version}:`);
    console.log(`  ${visible.length} visible change(s)${visible.length ? `: ${visible.map((c) => c.id).join(", ")}` : ""}`);
    console.log(`  ${codeOnly.length} code-only change(s) with identical pixels`);
    console.log(`  ${added} new file(s), ${missing.length} missing${missing.length ? `: ${missing.join(", ")}` : ""}`);
    console.log(`report → ${path.relative(process.cwd(), out)}`);
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

const escape = (text: string) => text.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

function report(version: string, visible: Changed[], codeOnly: string[], missing: string[], added: number): string {
  const rows = visible
    .map(
      ({ id, pixels, images: [a, b, d] }) =>
        `<tr><th>${escape(id)}<small>${pixels} px</small></th>` +
        `<td><img src="${a}" alt="published"></td><td><img src="${b}" alt="source"></td><td><img src="${d}" alt="difference"></td></tr>`,
    )
    .join("\n");
  const list = (title: string, ids: string[]) =>
    ids.length ? `<h2>${title} (${ids.length})</h2><p class="ids">${ids.map(escape).join(", ")}</p>` : "";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Vectilume visual diff</title>
<style>
  body { margin: 32px; font: 14px/1.5 system-ui, sans-serif; color: #2d2b30; }
  table { border-collapse: collapse; }
  th, td { padding: 8px 16px; border-bottom: 1px solid #e5e5ea; text-align: left; }
  th small { display: block; color: #6e6e73; font-weight: 400; }
  td img { display: block; background: repeating-conic-gradient(#f5f5f7 0 25%, #fff 0 50%) 0 0 / 12px 12px; }
  .ids { color: #6e6e73; }
</style></head><body>
<h1>Visual diff against ${PACKAGE}@${escape(version)}</h1>
<p>${visible.length} visible, ${codeOnly.length} code-only, ${added} new, ${missing.length} missing.</p>
${visible.length ? `<table><thead><tr><th>Icon</th><th>Published</th><th>Source</th><th>Changed pixels</th></tr></thead><tbody>\n${rows}\n</tbody></table>` : "<p>No visible changes.</p>"}
${list("Code-only changes", codeOnly)}
${list("Missing from source", missing)}
</body></html>
`;
}

// Run only as a script, so the test can import the pure helpers.
if (process.argv[1]?.endsWith("visual-diff.ts")) {
  await main();
}
