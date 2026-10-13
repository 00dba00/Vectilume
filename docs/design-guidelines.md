# Design guidelines — Phase 0 draft

Rules shared by all directions (enforced by `pnpm validate`):

- `viewBox="0 0 24 24"`, live area inside the 2 px keyline (2–22).
- Outline and Duotone: `stroke-width="1.75"`, round caps and joins, set once on the root.
- Duotone: secondary layer is a filled plane (`fill="var(--icon-secondary, currentColor)" stroke="none"`)
  drawn under the primary strokes (`stroke="var(--icon-primary, currentColor)"`).
- Solid: drawn separately as filled silhouettes that match the outline's outer edge
  (outline centerline offset by 0.875); no strokes, details are cut-outs.
- Dots are zero-length strokes (`M x y h.01`) so they follow the stroke width.

## Directions under comparison

| Direction | Idea |
|---|---|
| Soft Geometric | Closed, calm shapes with 1.5–2.5 px corner radii. Duotone fills the main mass. |
| Modern Duotone | Each icon is built from separate planes with a visible gap (roof/walls, header/body, two shield halves). The secondary colour fills one plane. |
| Distinctive | The top-right corner of every icon is replaced by a "spark" dot (vector + illuminate). Solid cuts a notch around the spark. |

The winning direction's rules will replace this section.

## Open questions

- Duotone fallback: without CSS variables the secondary layer falls back to `currentColor`
  at full opacity, so the icon looks solid. Options: a reduced-opacity fallback or a
  required `--icon-secondary`.
