import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { STYLES, type IconStyle } from "./svg-rules.ts";

export interface Release {
  version: string;
  /** Collections confirmed for npm; each one ships whole. */
  collections: string[];
}

export interface CatalogEntry {
  id: string;
  label: string;
  group: string;
  groupLabel: string;
}

export interface ReleaseIcon extends CatalogEntry {
  collection: string;
}

/** Icons of the confirmed collections, in catalog order; throws on unknown collections or duplicate names. */
export function selectReleaseIcons(release: Release, catalogs: Record<string, CatalogEntry[]>): ReleaseIcon[] {
  const seen = new Map<string, string>();
  const icons: ReleaseIcon[] = [];
  for (const collection of release.collections) {
    const entries = catalogs[collection];
    if (!entries) throw new Error(`unknown collection "${collection}" (expected ${collection}.json)`);
    for (const entry of entries) {
      const other = seen.get(entry.id);
      if (other) throw new Error(`icon "${entry.id}" is in both "${other}" and "${collection}"`);
      seen.set(entry.id, collection);
      icons.push({ ...entry, collection });
    }
  }
  return icons;
}

async function main(): Promise<void> {
  const root = path.resolve(process.argv[2] ?? ".");
  const out = path.join(root, "dist/npm");
  const release = JSON.parse(await readFile(path.join(root, "release.json"), "utf8")) as Release;
  if (release.collections.length === 0) throw new Error("release.json confirms no collections; nothing to publish");

  const catalogs: Record<string, CatalogEntry[]> = {};
  for (const collection of release.collections) {
    const file = path.join(root, `${collection}.json`);
    if (existsSync(file)) catalogs[collection] = JSON.parse(await readFile(file, "utf8")) as CatalogEntry[];
  }
  const icons = selectReleaseIcons(release, catalogs);

  await rm(out, { recursive: true, force: true });
  const manifest: (ReleaseIcon & { style: IconStyle })[] = [];
  for (const style of STYLES) {
    await mkdir(path.join(out, style), { recursive: true });
    for (const icon of icons) {
      const source = path.join(root, "src", style, `${icon.id}.svg`);
      if (!existsSync(source)) throw new Error(`missing ${style}/${icon.id}.svg`);
      await copyFile(source, path.join(out, style, `${icon.id}.svg`));
      manifest.push({ ...icon, style });
    }
  }

  const repoRoot = path.resolve(root, "../..");
  await copyFile(path.join(repoRoot, "LICENSE"), path.join(out, "LICENSE"));
  await writeFile(path.join(out, "manifest.json"), `${JSON.stringify({ icons: manifest }, null, 2)}\n`);
  await writeFile(
    path.join(out, "package.json"),
    `${JSON.stringify(
      {
        name: "@vectilume/icons",
        version: release.version,
        description: "Vectilume Icons — free, consistent, themeable SVG icons (outline, duotone, solid)",
        license: "MIT",
        repository: "github:00dba00/Vectilume",
        type: "module",
        exports: { "./manifest.json": "./manifest.json", "./*.svg": "./*.svg" },
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    path.join(out, "README.md"),
    [
      "# @vectilume/icons",
      "",
      `${icons.length} icons in outline, duotone and solid (${release.collections.join(", ")}).`,
      "",
      "```js",
      'import check from "@vectilume/icons/outline/check.svg";',
      "```",
      "",
      "Outline and solid use `currentColor`; duotone uses `--icon-primary` and `--icon-secondary`.",
      "`manifest.json` lists every icon with its style, collection, group and label.",
      "",
    ].join("\n"),
  );
  console.log(`${icons.length} icons × ${STYLES.length} styles → ${path.relative(process.cwd(), out)}`);
}

// Run only as a script, so the test can import selectReleaseIcons.
if (process.argv[1]?.endsWith("build-release.ts")) {
  await main();
}
