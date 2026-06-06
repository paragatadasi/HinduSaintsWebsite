# Design system

The visual identity may change, so styling must be centralized.

Token files:

- `styles/tokens.css`
- `styles/globals.css`

Reusable component folders:

- `components/ui`
- `components/layout`
- `components/saints`
- `components/sampradayas`
- `components/content`
- `components/instagram`
- `components/admin`

Rules:

- Do not hard-code colors or fonts in components.
- Use CSS variables for color, type, spacing, radius, shadows, and widths.
- Saint pages use shared templates.
- Biographies use the shared `Prose` component.
- Admin pages can be simpler but should still use shared primitives.
