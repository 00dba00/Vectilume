# Vectilume Icons

> *Make every pixel count.*

Free, consistent, themeable icons in three styles — **Outline**, **Duotone** and **Solid** — drawn on
one 24 × 24 grid. 835 icons, MIT licensed.

**[Browse the catalog → vectilume.vercel.app](https://vectilume.vercel.app)** — search, preview in every style and size,
try the React props and copy SVG or JSX.

[![npm @vectilume/react](https://img.shields.io/npm/v/@vectilume/react?label=%40vectilume%2Freact)](https://www.npmjs.com/package/@vectilume/react)
[![npm @vectilume/icons](https://img.shields.io/npm/v/@vectilume/icons?label=%40vectilume%2Ficons)](https://www.npmjs.com/package/@vectilume/icons)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

| Collection | Icons | What's in it |
|---|---:|---|
| General | 192 | navigation, actions, status, people, analytics, time, AI |
| Hobbies | 140 | sports, music, crafts and everyday activities |
| Letters & Numbers | 357 | upper- and lowercase letters, Croatian characters and digraphs, numbers and symbols; plain, circle and square forms |
| Content | 66 | files and folders, text editing, media controls, devices |
| Food & Drink | 40 | drinks, fruit and vegetables, meals, pastries, desserts |
| Travel & Transport | 40 | road, rail, air and sea, luggage, documents, accommodation |

## React

```sh
npm install @vectilume/react
```

```jsx
import { Trash, TrashDuotone, TrashSolid } from "@vectilume/react";

<Trash />                                  {/* 24 px, inherits the text colour */}
<Trash size={16} color="#dc2626" />        {/* size and colour */}
<Trash strokeWidth={2} />                  {/* heavier line (outline and duotone) */}
<TrashSolid title="Delete" />              {/* accessible name; without it the icon is aria-hidden */}
<TrashDuotone style={{ "--icon-primary": "#2563eb", "--icon-secondary": "#bfdbfe" }} />
```

- One component per icon and style: the icon name in PascalCase, plus `Duotone` or `Solid`
  (`trending-up` → `TrendingUp`, `TrendingUpDuotone`, `TrendingUpSolid`); names starting with a digit
  get an `Icon` prefix (`3d-printing` → `Icon3dPrinting`).
- `size` (default 24), `color` (sets `currentColor`), `title`, `ref` and every other SVG prop.
- Tree-shakeable ESM: an app bundles only the icons it imports. React 18 or newer.

## Plain SVG

```sh
npm install @vectilume/icons
```

```js
import trash from "@vectilume/icons/outline/trash.svg";
```

Files live at `<style>/<name>.svg`. `manifest.json` lists every icon with its collection, group,
label, keywords and the version it first shipped in. Outline and Solid use `currentColor`; Duotone
uses `var(--icon-primary)` and `var(--icon-secondary)`, both falling back to `currentColor`:

```css
.brand { color: #1e293b; --icon-primary: #2563eb; --icon-secondary: #bfdbfe; }
```

## Versioning

Icon names are the public API. Adding or redrawing icons is a regular release; removing one is a
breaking release. A renamed icon keeps its old name as a deprecated alias (old file name and a
`@deprecated` React export) until the next breaking release, so a rename never breaks an import
right away. While on 0.x, breaking releases bump the minor version.

## Design rules

- 24 × 24 grid, 2 px keylines, stroke `1.75`, round caps and joins.
- Outline, Duotone and Solid share one base geometry; the Gloss highlight sits in the top-left.
- No hardcoded colours; original geometry only — no paths copied from other libraries.

Details in [`docs/design-guidelines.md`](./docs/design-guidelines.md) and
[`docs/icon-naming.md`](./docs/icon-naming.md).

## Development

Requires Node.js 22+ and pnpm 10.

```sh
pnpm install
pnpm dev        # catalog with search, inspector and React playground
pnpm validate   # SVG rules: grid, stroke, colours, Gloss
pnpm test
pnpm typecheck
```

```text
apps/web/            catalog (Next.js)
packages/icons-svg/  source SVGs and collection metadata (*.json)
packages/tooling/    validator, release builder (SVG + React packages), visual diff
docs/                design rules, naming, release checklist, plans
```

Releasing: [`docs/release-checklist.md`](./docs/release-checklist.md). Roadmap:
[`docs/icon-definition-of-done.md`](./docs/icon-definition-of-done.md) and
[`open_source_icon_library_plan.md`](./open_source_icon_library_plan.md) (in Croatian).

## License

[MIT](./LICENSE)
