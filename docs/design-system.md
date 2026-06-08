# Design system

The visual identity may change, so styling must be centralized.

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
- Use shared CSS classes for repeated layout patterns.
- Use shared components for repeated UI behavior and variants.
- Use page files to compose design-system pieces, not to define new one-off visual systems.
- Do not hard-code colors, fonts, spacing, shadows, radii, widths, or image treatments in components.
- Do not add inline styles for design/layout changes unless the exception is explicitly justified in the change.
- Use design-system configuration for layout variants instead of deleting old page compositions.
- Use `.section-heading` for section titles and section-level actions; avoid ad hoc heading wrappers in page layouts.
- Keep vertical rhythm in shared layout classes where possible. If one page needs special tuning, add a page-scoped hook such as `.saints-index` before changing global spacing utilities.
- When moving or removing a section, replace any spacing that section provided intentionally. Do not let a decorative band or content block be the only source of layout breathing room.
- For horizontal rows, use `ScrollRail`. Use `controls="always"` when arrow controls are part of the visual design, and leave the default auto behavior for utility rails where controls should appear only on overflow.
- Keep card presentation variants explicit in shared components, such as `summary`, `portrait`, and `icon`, so index pages and homepage rails can share data without inheriting the wrong layout.
- Theme-specific changes should use theme tokens in `styles/tokens.css`, not conditional component logic.
- If a visual or layout pattern appears twice, promote it into tokens, shared CSS, shared configuration, or a reusable component.
- Saint pages use shared templates.
- Biographies use the shared `Prose` component.
- Admin pages can be simpler but should still use shared primitives.
