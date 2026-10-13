# Vectilume Icons

> *Make every pixel count.*

A free, beautifully consistent icon system with powerful theming and practical icons for modern apps.

**Status:** Phase 0 — defining the design system. Not published yet.

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
  icons-svg/        # Source SVG files
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

## Roadmap

1. **Phase 0** — compare three visual directions (Soft Geometric, Modern Duotone,
   Distinctive) on 4 icons, pick one, expand to 12 and document the rules.
2. **Phase 1** — 50 icons, Outline + Duotone, catalog with search, SVG/JSX copy, npm package.
3. **Phase 2** — 150 icons, Solid style, semantic states, theme generator, ZIP export.
4. **Phase 3** — community workflow, more framework packages, Figma plugin.

See [`open_source_icon_library_plan.md`](./open_source_icon_library_plan.md) for the full plan (in Croatian).

## License

[MIT](./LICENSE)
