import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseIconPath, type IconPath } from "./svg-rules.ts";

export interface ManifestIcon extends IconPath {
  /** `<direction>/<style>/<name>` or `<style>/<name>` */
  id: string;
  svg: string;
}

export interface Manifest {
  icons: ManifestIcon[];
}

/** Strips the XML declaration and comments and collapses whitespace between tags. */
export function normalizeSvg(source: string): string {
  return source
    .replace(/<\?xml[\s\S]*?\?>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .replace(/\s+/g, " ")
    .trim();
}

async function main(): Promise<void> {
  const [srcArg = "src", outArg = "dist/manifest.json"] = process.argv.slice(2);
  const root = path.resolve(srcArg);
  const entries = await readdir(root, { withFileTypes: true, recursive: true });
  const icons: ManifestIcon[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".svg")) continue;
    const file = path.join(entry.parentPath, entry.name);
    const relPath = path.relative(root, file).split(path.sep).join("/");
    const parsed = parseIconPath(relPath);
    if ("severity" in parsed) throw new Error(`${relPath}: ${parsed.message} (run pnpm validate)`);
    icons.push({ id: relPath.slice(0, -".svg".length), ...parsed, svg: normalizeSvg(await readFile(file, "utf8")) });
  }

  icons.sort((a, b) => a.id.localeCompare(b.id));
  const outFile = path.resolve(outArg);
  await mkdir(path.dirname(outFile), { recursive: true });
  await writeFile(outFile, `${JSON.stringify({ icons } satisfies Manifest, null, 2)}\n`);
  console.log(`${icons.length} icons → ${path.relative(process.cwd(), outFile)}`);
}

await main();
