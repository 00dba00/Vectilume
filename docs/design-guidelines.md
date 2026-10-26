# Design guidelines

Rules shared by all directions (enforced by `pnpm validate`):

- `viewBox="0 0 24 24"`, live area inside the 2 px keyline (2–22).
- Outline and Duotone: `stroke-width="1.75"`, round caps and joins, set once on the root.
- Duotone: secondary layer is a filled plane (`fill="var(--icon-secondary, currentColor)" stroke="none"`)
  drawn under the primary strokes (`stroke="var(--icon-primary, currentColor)"`).
- Solid: drawn separately as filled silhouettes that match the outline's outer edge
  (outline centerline offset by 0.875); no strokes, details are cut-outs.
- Dots are zero-length strokes (`M x y h.01`) so they follow the stroke width.

## Directions un## Signature: Gloss

Chosen direction (`distinctive-gloss`). Every icon carries a short highlight, like light
catching the surface:

- Placed inside the **top-left** of the icon's main body.
- Follows that corner's shape: an L with a 1 px radius for rectangles, a 90° arc for
  circles and curves, a line parallel to the edge for slopes.
- Inset **3 units** from the outer edge (centerline to centerline); **2.5** on small round
  shapes (head, heart lobe) so the gap stays visible.
- 2.5–4 units long; it must not touch any other detail (keep ≥ 0.5 visible gap at 24 px).
  Exception: `basketball` keeps its deep side seams, so its gloss sits 1.95 from the seams
  (~0.2 visible gap).
  `billiards` uses a 2.5 inset so the centred white circle fits. Rackets (`tennis`, `squash`)
  leave out the strings that would run within 2.25 of the gloss, like light washing them out.
- Base shapes: 3 px corner radius on rectangles, 2.5 px on smaller frames, round caps and joins.
- Duotone: the secondary colour fills the main silhouette, the gloss stays a primary stroke.
- Solid: the gloss becomes a cut-out of the same shape.
- Line-only glyphs (chevrons, close, check, plus, arrows, menu, code…) have no body, so they
  carry no gloss and their duotone is the outline in the primary colour.
- Bodies too busy for a 0.5 gap skip the gloss: `target` (rings), `medal` (star), `globe`
  (meridians), and `circle` by design (a bare contour).
- Slashed icons (`eye-off`, `bell-off`, `wifi-off`) cut a 1.75 gap around the slash in Solid.

Rejected directions (Soft Geometric, Modern Duotone, Spark, Cut, Break, Leaf, Overshoot)
are in git history (`git log -- packages/icons-svg/src`).

s

- Duotone fallback: without CSS variables the secondary layer falls back to `currentColor`
  at full opacity, so the icon looks solid. Options: a reduced-opacity fallback or a
  required `--icon-secondary`.
