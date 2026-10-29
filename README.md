# Vectilume Icons

> *Make every pixel count.*

Free, consistent, themeable icons in three styles — **Outline**, **Duotone** and **Solid** — drawn on
one 24 × 24 grid. 840 icons, MIT licensed.

**[Browse the catalog → vectilume.dev](https://vectilume.dev)** — search, preview in every style and size,
try the React props and copy SVG or JSX.

[![npm @vectilume/react](https://img.shields.io/npm/v/@vectilume/react?label=%40vectilume%2Freact)](https://www.npmjs.com/package/@vectilume/react)
[![npm @vectilume/icons](https://img.shields.io/npm/v/@vectilume/icons?label=%40vectilume%2Ficons)](https://www.npmjs.com/package/@vectilume/icons)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

| Collection | Icons | What's in it |
|---|---:|---|
| General | 196 | navigation, actions, status, people, analytics, time, AI |
| Hobbies | 140 | sports, music, crafts and everyday activities |
| Letters & Numbers | 357 | upper- and lowercase letters, Croatian characters and digraphs, numbers and symbols; plain, circle and square forms |
| Content | 67 | files and folders, text editing, media controls, devices |
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

For plain HTML there is one sprite per style (`sprite/outline.svg`, `sprite/duotone.svg`,
`sprite/solid.svg`); icons drawn with `<use>` inherit the colour and the duotone variables:

```html
<svg width="24" height="24"><use href="/sprite/outline.svg#trash"/></svg>
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

## Missing an icon?

Request it right on the website, or from your terminal, your app or your AI assistant. Get a token once, then send it with
every call; at most 20 requests per hour per token. Full guide:
**[vectilume.dev/request-icons](https://vectilume.dev/request-icons)**, and as plain
Markdown for AI assistants: [icon-requests.md](https://vectilume.dev/icon-requests.md).

```sh
curl -X POST https://vectilume.dev/api/keys   -H "content-type: application/json"   -d '{"email":"you@example.com"}'
# → 202 {"sent":true,…}: open the link from the email to get your token (201 {"token":"vl_…"} until email confirmation is on)

curl -X POST https://vectilume.dev/api/requests   -H "authorization: Bearer vl_…"   -H "content-type: application/json"   -d '{"name":"basketball-hoop","description":"Hoop with net, shown next to the live score","keywords":["nba","score"]}'
# → 201 {"id":42,"status":"open","statusUrl":"…/api/requests/42"}

curl https://vectilume.dev/api/requests/42 -H "authorization: Bearer vl_…"
# → {"id":42,"name":"basketball-hoop","status":"done","icon":"basketball-hoop","version":"0.2.0","createdAt":"…"}

curl https://vectilume.dev/api/requests -H "authorization: Bearer vl_…"
# → {"requests":[…]}  every request made with this token, newest first
```

`status` is `open`, `accepted` (queued to be drawn), `in-progress`, `ready` (drawn and added, ships with the next npm release),
`declined` (with an optional `reason`) or `done`. `done` means
the icon is in the latest `@vectilume/icons` on npm; `icon` is its final name, which may differ
from the one you asked for. You also get an email when a request is received, changes status and
ships on npm; turn it off on the page, by the link in the email or with `PATCH /api/settings {"emails":false}`. A token only shows your own requests: those made with it, or, when it came from a confirmed email,
every request of that email. The admin token lists
every request, with its email.

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
