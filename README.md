# Vectilume Icons

> *Make every pixel count.*

A free, beautifully consistent icon system with powerful theming and practical icons for modern apps.

**Status:** Design lab with a 140-icon Hobbies collection. Not published yet.

## Principles

- `viewBox="0 0 24 24"`, 24 × 24 grid, default stroke `1.75`, round caps and joins.
- Three styles sharing one base geometry: **Outline**, **Duotone**, **Solid**.
- No hardcoded colors: Outline and Solid use `currentColor`, Duotone uses
  `var(--icon-primary)` and `var(--icon-secondary)`.
- Original geometry only — no paths copied from other libraries.

## Repository layout

```text
apps/
  web/              # Catalog and live editor (Next.js) — coming in Phase 0
packages/
  icons-svg/        # Source SVG files and Hobbies generator
  tooling/          # SVG validation, optimization and build scripts
docs/               # Design guidelines, naming, contributing
```

## Development

Requires Node.js 22+ and pnpm 10.

```sh
pnpm install
pnpm typecheck
pnpm test
pnpm validate
pnpm dev
```

## Hobbies collection

The catalog includes 140 hobby icons in 14 groups. Each icon has Outline,
Duotone, and Solid SVG sources on the same 24 × 24 grid, hand-drawn to the
Gloss rules in `docs/design-guidelines.md`. Croatian catalog labels and groups
live in `packages/icons-svg/hobbies.json`. Run
`pnpm --filter @vectilume/icons-svg build` to refresh the catalog manifest.
Preview sheets for all three styles are in `docs/hobbies-*-preview.png`.

## General collection

121 interface icons in 8 groups (navigation, actions, status, people,
competition, analytics, time, AI), first used by Scout AI. Labels and groups
live in `packages/icons-svg/general.json`; the source list from Scout AI is in
`docs/scout-ai-icons.md`.

## Publishing to npm

Only collections confirmed in `packages/icons-svg/release.json` go to npm, each one
whole. `pnpm --filter @vectilume/icons-svg release` assembles the `@vectilume/icons`
package in `packages/icons-svg/dist/npm`; publish it from there with `npm publish`.
The source package stays private, so unconfirmed collections never leave the repo. Icon names are the public API: the release script compares them with the latest
published version and refuses a build that drops or renames an icon unless the version
is a breaking bump (major, or minor while on 0.x).

## Roadmap

1. **Phase 0** — compare three visual directions (Soft Geometric, Modern Duotone,
   Distinctive) on 4 icons, pick one, expand to 12 and document the rules.
2. **Phase 1** — 50 icons, Outline + Duotone, catalog with search, SVG/JSX copy, npm package.
3. **Phase 2** — 150 icons, Solid style, semantic states, theme generator, ZIP export.
4. **Phase 3** — community workflow, more framework packages, Figma plugin.
5. **Later — web contributions** (not scheduled; details in [`docs/web-features.md`](./docs/web-features.md)):
   - edit an existing icon in a web form → admin approval → collection and npm, author notified;
   - submit a brand-new icon through the same approval flow;
   - request a custom icon, we draw it and notify the requester when it ships;
   - public request list with voting, meaning-based search (Croatian + English),
     custom project sets (ZIP, sprite, own package), live Gloss checks in the editor,
     in-context preview, version history with visual diffs and rename aliases,
     subscriptions, author credits, AI drafts from a description.

See [`open_source_icon_library_plan.md`](./open_source_icon_library_plan.md) for the full plan (in Croatian).

## License

[MIT](./LICENSE)
