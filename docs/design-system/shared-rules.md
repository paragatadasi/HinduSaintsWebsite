# Shared rules and public baseline

[Design system index](../design-system.md)

The visual identity may change, so styling must be centralized.

Reusable designer role instructions live in [Designer roles](../design/designer-roles.md):
Admin / Workflow Designer and Public Experience Designer, with explicit Editorial
and Creative modes for public work. Use these alongside this design system.

Token files:

- `styles/tokens.css`
- `styles/globals.css`

Configuration:

- `lib/site-content.ts`

Reusable component folders:

- `components/ui`
- `components/layout`
- `components/saints`
- `components/traditions`
- `components/places`
- `components/content`
- `components/instagram`
- `components/admin`

Rules:

- All design and layout changes should start in the design system.
- Use tokens for broad visual direction: color, type, spacing, radius, shadows, widths, and image treatments.
- Public theme rollout should favor calm museum-like hierarchy through shared
  tokens before page-specific restructuring. The `nocturne` theme is the active
  public baseline: keep borders soft, star texture quiet, and gold accents
  selective so existing public templates, including the Tradition detail page,
  remain visually consistent while structure-level redesign awaits approved
  mockups. On dark themes, surface contrast should read as subtle but
  unmistakable; if a panel separation feels barely visible in design review,
  strengthen the token contrast before adding page-specific effects.
- Use shared CSS classes for repeated layout patterns.
- Use shared components for repeated UI behavior and variants.
- Use `SearchableMultiSelect` for compact admin relationship pickers that need
  searchable multi-select checkbox behavior without filling the initial screen.
- Use `SearchableRelationshipPicker` for additive review workflows: clicking a
  search result adds it, selected rows own removal and relationship metadata,
  and an unmatched search can open the smallest useful create form.
- Use page files to compose design-system pieces, not to define new one-off visual systems.
- Do not hard-code colors, fonts, spacing, shadows, radii, widths, or image treatments in components.
- Do not add inline styles for design/layout changes unless the exception is explicitly justified in the change.
- Use design-system configuration for active reusable layout variants. Once a
  page has a selected production layout, remove exploratory toggles and stale
  alternate compositions so public routes have one clear template.
- The active public homepage layout is `cosmic`, configured in
  `lib/site-content.ts` and documented in `docs/design/themes.md`. Homepage
  refinements should preserve the cosmic blue/gold star-field identity, shorter
  hero, map preview, quote-of-the-day panel, featured tradition panel, and
  Instagram rail unless a new approved layout replaces it.
- Use `.section-heading` for section titles and section-level actions; avoid ad hoc heading wrappers in page layouts.
- Keep vertical rhythm in shared layout classes where possible. If one page needs special tuning, add a page-scoped hook such as `.saints-index` before changing global spacing utilities.
- When moving or removing a section, replace any spacing that section provided intentionally. Do not let a decorative band or content block be the only source of layout breathing room.
- Use `.card-grid` for catalog-style card collections whose card widths should stay stable when filtering changes the result count. Adjust `--width-card-grid-min` and `--width-card-grid` instead of adding page-specific grid column rules.
- For horizontal rows, use `ScrollRail`. Use `controls="always"` when arrow controls are part of the visual design, and leave the default auto behavior for utility rails where controls should appear only on overflow.
- Keep card presentation variants explicit in shared components, such as `summary`, `portrait`, and `icon`, so index pages and homepage rails can share data without inheriting the wrong layout.
- Use the shared interactive affordance classes for clickable card-like surfaces. Apply `.interactive-surface` to whole clickable cards, `.interactive-media` to standalone clickable image tiles, and `.interactive-image-link` when only an embedded image inside a larger component is clickable.
- Interactive affordance colors and shadows belong in theme tokens such as `--color-interactive-border` and `--shadow-interactive`; movement and scale belong in layout/motion tokens such as `--interactive-surface-lift` and `--interactive-image-scale`.
- Clickable-card hover states should read as a tight light glow rather than a dark drop shadow. Scrollable rails need enough internal paint buffer for lifted cards and their glow to remain visible.
- Do not add one-off hover transforms, borders, image zooms, or clickable-card shadows in components. Add a new shared interaction class only when the existing surface/media/image-link distinction is not accurate.
- Theme-specific changes should use theme tokens in `styles/tokens.css`, not conditional component logic.
- If a visual or layout pattern appears twice, promote it into tokens, shared CSS, shared configuration, or a reusable component.
- Saint pages use shared templates.
- Biographies use the shared `Prose` component.
- Admin pages can be simpler but should still use shared primitives.
- Museum planning routes use the shared `MuseumWorkspaceLayout` focused view:
  navigation starts collapsed to give the map and arrangement workspace the
  available width. An outlined Show/Hide navigation control stays visible,
  exposes its expanded state, and restores the existing navigation on demand.
  Other museum routes retain their normal navigation. Re-entering a planning
  route resets the focused default; opening navigation does not remount the plan.
