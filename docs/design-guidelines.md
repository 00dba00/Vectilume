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

### Small sports details

- Tennis and squash use 1-unit filled string paths inside the 1.75-unit frame.
  Their solid versions retain open mesh cells so the rackets read as strung rackets.
  The tennis ball seam is a 0.75-unit filled path; these details do not override
  the root stroke width.
- Billiards uses a filled, font-independent numeral 8, with an offset number panel.
- Classic nine-pin bowling keeps the ball smooth; the gloss sits on the pin.
- Shooting uses uninterrupted concentric target rings and four short outer marks.
  It omits the gloss to keep the rings clear at small sizes.
- Music instruments prioritize their identifying details: acoustic sound hole,
  bass pickups, violin bridge and bow, drum rim, and saxophone keys. These compact
  bodies omit the gloss when it would crowd the instrument details.
- Piano white-key dividers use 1-unit filled paths below the wider black keys;
  Solid preserves both widths as cut-outs. Violin strings also use 1-unit filled
  paths. Singing keeps a short highlight inside the microphone capsule.
- DJ, composing, and choir omit the gloss to preserve the record, score lines,
  and open songbook at small sizes.
- Visual arts uses a pencil for drawing, a fountain-pen nib for calligraphy,
  a tablet and stylus for digital illustration, and Bezier handles for graphic
  design. Photography, filming, pottery, and sculpting retain body highlights;
  the other motifs omit them where identifying details need the space.
- Filming reel centers and the calligraphy nib slit use 1-unit filled paths.
  Solid opens the reel centers, nib slit, palette thumb hole, and video play
  triangle; timeline divisions remain clear at small sizes.
- Crafts distinguishes knitting needles from a crochet hook, a sewing machine
  from an embroidery hoop, and a model-kit sprue from a 3D printer. Yarn bands,
  cross stitches, saw teeth, and origami folds replace highlights where space
  is limited; the sewing machine and restored chair retain body highlights.
- The jewelry pendant uses a 1-unit filled center mark and a small Solid
  opening. Model-kit runners and the printer gantry remain open in every style.
- Games & tech uses a die and pawn for board games, a king for chess, a laptop
  for coding, and a telescope for astronomy. Controller buttons, dice pips,
  question marks, code symbols, robot features, and book lines take priority
  over highlights. The telescope retains a short highlight along its barrel.
- Card games keeps the rear card visible as an open contour behind the front
  card. Its diamond is fully cut out in Solid; chess tiers and the laptop base
  use clear separating cuts.
- Home & everyday distinguishes a watering can, potted seedling, and wrapped
  tulip bouquet. Volunteering uses a hand offering a heart; collecting uses a
  perforated postage stamp with a landscape cut-out in Solid.
- The cooking pot, bread slice, and watering can retain body highlights.
  Text lines, the language bubble's font-independent A, suitcase straps, and
  compact plant and hand details take priority over additional highlights.
- Line-only glyphs (chevrons, close, check, plus, arrows, menu, code…) have no body, so they
  carry no gloss and their duotone is the outline in the primary colour.
- Letters, numbers and typographic symbols use the same 1.75-unit strokes,
  rounded terminals and geometric curves. Standalone Duotone is primary-only;
  Solid follows the same stroke silhouette rather than adding extra weight.
- Lettering badges use two open frame paths: a detached top-left arc or corner
  and the remaining circle or rounded square. The two breaks stay transparent
  in all three styles. Duotone and Solid leave a pocket behind the detached
  corner so the fill cannot join it back to the body. This user-selected
  lettering treatment replaces the inset gloss on these badges only.
- Badge glyphs are optically centered, with at least 0.75 units of clearance
  from the fill boundary. Lowercase keeps its x-height; accents and Croatian
  digraphs are fitted within the same frame without touching the detached corner.
- Food & Drink uses the same rounded 1.75-unit contours and upper-left gloss.
  Cup and teapot handles stay hollow in Solid. Wine, pizza, carrot and croissant
  use the liquid line, toppings, root marks or pastry folds instead of an extra
  gloss. Burger layers and the ice-cream scoop remain separated in Solid;
  pizza toppings are fully open cut-outs. The collection contains forty motifs:
  ten each for drinks, produce, meals, and bakery & desserts. Donut and pretzel
  openings remain transparent; Solid keeps the pretzel openings wide enough
  to read at small sizes. Food surfaces use even-odd fills for nested holes.
- Travel & Transport contains forty new motifs, ten per group: road transport;
  rail, air & sea; luggage & documents; stay & navigation. Existing general and
  hobby IDs are not duplicated. Vehicle windows, rails, document symbols and
  luggage seams take priority over an extra gloss when space is limited.
- Transport Solid preserves window openings, wheel centers, handles and the
  door-hanger hook. The passport's small globe uses 1-unit filled meridians
  in all styles so its grid stays legible; Solid retains the grid inside the
  globe opening. Track, pool and route strokes retain their original weight.
- Bodies too busy for a 0.5 gap skip the gloss: `target` (rings), `medal` (star), `globe`
  (meridians), and `circle` by design (a bare contour).
- Slashed icons (`eye-off`, `bell-off`, `wifi-off`) cut a 1.75 gap around the slash in Solid.

Rejected directions (Soft Geometric, Modern Duotone, Spark, Cut, Break, Leaf, Overshoot)
are in git history (`git log -- packages/icons-svg/src`).

s

- Duotone fallback: without CSS variables the secondary layer falls back to `currentColor`
  at full opacity, so the icon looks solid. Options: a reduced-opacity fallback or a
  required `--icon-secondary`.
