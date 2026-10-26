# Icon naming

Source files live in `packages/icons-svg/src`:

```text
src/<style>/<name>.svg
```

- The Phase 0 `<direction>` level is gone: Gloss was chosen and every icon now lives
  directly under its style.
- `style` — `outline`, `duotone`, `solid`.
- `name` — kebab-case, noun first, modifier after: `calendar`, `calendar-add`,
  `wallet-minus`, `budget-warning`.

The React component name is derived as PascalCase plus the style suffix when needed
(`CalendarAdd`, `CalendarAddDuotone`).
