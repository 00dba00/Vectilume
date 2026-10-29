import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { STYLES, type IconStyle } from "./svg-rules.ts";
import { buildReactSources, componentName } from "./react.ts";
import { optimizeSvg } from "./optimize.ts";
import { buildSprite } from "./sprite.ts";

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
  keywords: string[];
  /** Former names of a renamed icon; they ship as deprecated aliases until the next breaking release. */
  aliases?: string[];
  /** Id of the icon request it answers (from the requests API); the API reports it done once published. */
  request?: number;
}

export interface ReleaseIcon extends CatalogEntry {
  collection: string;
}

const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Icons of the confirmed collections, in catalog order; throws on unknown collections or duplicate names. */
export function selectReleaseIcons(release: Release, catalogs: Record<string, CatalogEntry[]>): ReleaseIcon[] {
  const seen = new Map<string, string>();
  const icons: ReleaseIcon[] = [];
  for (const collection of release.collections) {
    const entries = catalogs[collection];
    if (!entries) throw new Error(`unknown collection "${collection}" (expected ${collection}.json)`);
    for (const entry of entries) {
      if (!entry.keywords?.length) throw new Error(`icon "${entry.id}" has no keywords`);
      if (entry.request !== undefined && !(Number.isInteger(entry.request) && entry.request > 0)) {
        throw new Error(`icon "${entry.id}" has request ${JSON.stringify(entry.request)}; expected an icon request id`);
      }
      const other = seen.get(entry.id);
      if (other) throw new Error(`icon "${entry.id}" is in both "${other}" and "${collection}"`);
      seen.set(entry.id, collection);
      for (const alias of entry.aliases ?? []) {
        if (!NAME.test(alias)) throw new Error(`alias "${alias}" of "${entry.id}" is not a kebab-case name`);
        const owner = seen.get(alias);
        if (owner) throw new Error(`alias "${alias}" of "${entry.id}" is already a name in "${owner}"`);
        seen.set(alias, `${collection}, as an alias of ${entry.id}`);
      }
      icons.push({ ...entry, collection });
    }
  }
  return icons;
}

export interface Published {
  version: string;
  names: string[];
  /** Version each published name first shipped in. */
  since: Record<string, string>;
}

/** Every name the package exports: icon ids and their deprecated aliases. */
export const releaseNames = (icons: ReleaseIcon[]) => icons.flatMap((icon) => [icon.id, ...(icon.aliases ?? [])]);

/**
 * Published aliases a breaking release may drop, as `old → new`. Only listed: deleting them from the
 * collection JSON stays a deliberate edit.
 */
export function removableAliases(published: Published | null, version: string, icons: ReleaseIcon[]): string[] {
  if (!published || !isBreakingBump(published.version, version)) return [];
  const shipped = new Set(published.names);
  return icons.flatMap((icon) => (icon.aliases ?? []).filter((alias) => shipped.has(alias)).map((alias) => `${alias} → ${icon.id}`));
}

/** A name keeps the version it first shipped in; anything new ships in this release. */
export const sinceOf = (name: string, version: string, published: Published | null) => published?.since[name] ?? version;

const parseVersion = (version: string) => {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!match) throw new Error(`invalid version "${version}"`);
  return match.slice(1, 4).map(Number) as [number, number, number];
};

/** A breaking release bumps the major version, or the minor one while still on 0.x (semver). */
export function isBreakingBump(from: string, to: string): boolean {
  const [fromMajor, fromMinor] = parseVersion(from);
  const [toMajor, toMinor] = parseVersion(to);
  return toMajor > fromMajor || (fromMajor === 0 && toMajor === 0 && toMinor > fromMinor);
}

/**
 * Names that left the package since the last publish. Removing or renaming an icon breaks every
 * import of it, so it is only allowed together with a breaking version bump.
 */
export function checkAgainstPublished(published: Published, version: string, names: string[]): { removed: string[] } {
  const [a, b, c] = parseVersion(version), [x, y, z] = parseVersion(published.version);
  if (a < x || (a === x && (b < y || (b === y && c <= z)))) {
    throw new Error(`version ${version} must be higher than the published ${published.version}`);
  }
  const current = new Set(names);
  const removed = published.names.filter((name) => !current.has(name)).sort();
  if (removed.length > 0 && !isBreakingBump(published.version, version)) {
    throw new Error(
      `${removed.length} icon(s) published in ${published.version} would disappear: ${removed.join(", ")}. ` +
        "Put them back (renamed? moved to an unconfirmed collection?) or release a breaking version.",
    );
  }
  return { removed };
}

const PACKAGE = "@vectilume/icons";

const PACKAGE_META = {
  license: "MIT",
  repository: { type: "git", url: "git+https://github.com/00dba00/Vectilume.git" },
  homepage: "https://vectilume.dev",
  bugs: "https://github.com/00dba00/Vectilume/issues",
};
const KEYWORDS = ["icons", "icon-set", "outline", "duotone", "solid", "vectilume"];

/** Latest published version and its icon names, or null before the first publish. */
async function fetchPublished(): Promise<Published | null> {
  const meta = await fetch(`https://registry.npmjs.org/${PACKAGE.replace("/", "%2F")}`);
  if (meta.status === 404) return null;
  if (!meta.ok) throw new Error(`npm registry answered ${meta.status}; cannot check what is already published`);
  const version = ((await meta.json()) as { "dist-tags": { latest: string } })["dist-tags"].latest;
  const file = await fetch(`https://unpkg.com/${PACKAGE}@${version}/manifest.json`);
  if (!file.ok) throw new Error(`cannot read manifest.json of ${PACKAGE}@${version} (${file.status})`);
  const manifest = (await file.json()) as { icons: { id: string; since?: string }[] };
  const since = Object.fromEntries(manifest.icons.map((icon) => [icon.id, icon.since ?? version]));
  return { version, names: Object.keys(since), since };
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

  const published = await fetchPublished();
  if (published) {
    const { removed } = checkAgainstPublished(published, release.version, releaseNames(icons));
    if (removed.length > 0) console.warn(`breaking release: removes ${removed.join(", ")}`);
    const stale = removableAliases(published, release.version, icons);
    if (stale.length > 0) {
      console.warn(`breaking release: these aliases can now be deleted from the collection JSON: ${stale.join(", ")}`);
    }
  }

  await rm(out, { recursive: true, force: true });
  type ManifestEntry = Omit<ReleaseIcon, "aliases"> & { style: IconStyle; since: string; deprecated?: true; replacedBy?: string };
  const manifest: ManifestEntry[] = [];
  await mkdir(path.join(out, "sprite"), { recursive: true });
  for (const style of STYLES) {
    await mkdir(path.join(out, style), { recursive: true });
    const symbols: { id: string; svg: string }[] = [];
    for (const { aliases = [], ...icon } of icons) {
      const source = path.join(root, "src", style, `${icon.id}.svg`);
      if (!existsSync(source)) throw new Error(`missing ${style}/${icon.id}.svg`);
      const svg = optimizeSvg(await readFile(source, "utf8"));
      await writeFile(path.join(out, style, `${icon.id}.svg`), svg);
      symbols.push({ id: icon.id, svg });
      manifest.push({ ...icon, style, since: sinceOf(icon.id, release.version, published) });
      for (const alias of aliases) {
        await writeFile(path.join(out, style, `${alias}.svg`), svg);
        symbols.push({ id: alias, svg });
        const since = sinceOf(alias, release.version, published);
        manifest.push({ ...icon, id: alias, style, since, deprecated: true, replacedBy: icon.id });
      }
    }
    await writeFile(path.join(out, "sprite", `${style}.svg`), buildSprite(symbols));
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
        ...PACKAGE_META,
        keywords: [...KEYWORDS, "svg"],
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
      "One sprite per style for plain HTML: `sprite/outline.svg`, `sprite/duotone.svg`, `sprite/solid.svg`.",
      "",
      "```html",
      '<svg width="24" height="24"><use href="/sprite/outline.svg#check"/></svg>',
      "```",
      "",
      "Outline and solid use `currentColor`; duotone uses `--icon-primary` and `--icon-secondary`.",
      "Browse and search every icon: https://vectilume.dev",
      "",
      "`manifest.json` lists every icon with its style, collection, group, label and `since` version.",
      "Renamed icons keep their old file name until the next breaking release (`deprecated`, `replacedBy`).",
      "",
      "Missing an icon? Request it through the API: https://vectilume.dev/request-icons",
      "",
    ].join("\n"),
  );
  console.log(`${icons.length} icons × ${STYLES.length} styles → ${path.relative(process.cwd(), out)}`);

  const react = path.join(root, "dist/react");
  await rm(react, { recursive: true, force: true });
  await mkdir(react, { recursive: true });
  const sources = buildReactSources(
    icons,
    (style, id) => optimizeSvg(readFileSync(path.join(root, "src", style, `${id}.svg`), "utf8")),
  );
  await writeFile(path.join(react, "index.js"), sources.js);
  await writeFile(path.join(react, "index.d.ts"), sources.dts);
  await copyFile(path.join(repoRoot, "LICENSE"), path.join(react, "LICENSE"));
  await writeFile(
    path.join(react, "package.json"),
    `${JSON.stringify(
      {
        name: "@vectilume/react",
        version: release.version,
        description: "Vectilume Icons as React components (outline, duotone, solid)",
        ...PACKAGE_META,
        keywords: [...KEYWORDS, "react", "react-icons"],
        type: "module",
        sideEffects: false,
        exports: { ".": { types: "./index.d.ts", default: "./index.js" } },
        peerDependencies: { react: ">=18" },
      },
      null,
      2,
    )}\n`,
  );
  const example = icons[0]!.id;
  await writeFile(
    path.join(react, "README.md"),
    [
      "# @vectilume/react",
      "",
      `${icons.length} icons × outline, duotone and solid as React components (${release.collections.join(", ")}).`,
      "",
      "```jsx",
      `import { ${componentName(example, "outline")}, ${componentName(example, "duotone")}, ${componentName(example, "solid")} } from "@vectilume/react";`,
      "",
      `<${componentName(example, "outline")} size={16} color="tomato" />`,
      `<${componentName(example, "duotone")} title="${icons[0]!.label}" className="brand" />`,
      "```",
      "",
      "Browse icons and try the props: https://vectilume.dev",
      "",
      "- Names are the icon id in PascalCase plus `Duotone` / `Solid`; ids starting with a digit get an `Icon` prefix.",
      "- Renamed icons keep their old name as a `@deprecated` alias until the next breaking release.",
      "- `size` sets width and height (default 24); `color` sets `currentColor`; every other SVG prop is passed through.",
      "- Without `title` or `aria-label` an icon is decorative (`aria-hidden`).",
      "- Duotone colours come from CSS variables, e.g. `.brand { --icon-primary: #2563eb; --icon-secondary: #bfdbfe; }`;",
      "  without them both layers fall back to `currentColor`.",
      "",
      "Missing an icon? Request it through the API: https://vectilume.dev/request-icons",
      "",
    ].join("\n"),
  );
  console.log(`${icons.length * STYLES.length} React components → ${path.relative(process.cwd(), react)}`);
}

// Run only as a script, so the test can import selectReleaseIcons.
if (process.argv[1]?.endsWith("build-release.ts")) {
  await main();
}
