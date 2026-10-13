# Icon naming

Source files live in `packages/icons-svg/src`:

```text
src/<direction>/<style>/<name>.svg
```

- `direction` — Phase 0 only: `soft-geometric`, `modern-duotone`, `distinctive`.
  After a direction is chosen, the `<direction>` level is removed.
- `style` — `outline`, `duotone`, `solid`.
- `name` — kebab-case, noun first, modifier after: `calendar`, `calendar-add`,
  `wallet-minus`, `budget-warning`.

The React component name is derived as PascalCase plus the style suffix when needed
(`CalendarAdd`, `CalendarAddDuotone`).
