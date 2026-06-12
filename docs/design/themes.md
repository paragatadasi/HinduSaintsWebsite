# Design System Themes

Reference boards are stored in `docs/design/references/`:

- `artistic-site-layouts.png`
- `modern-site-layouts.png`

## Starter Themes

The themes live in `styles/tokens.css` as CSS custom property layers. Components should continue to consume tokens only; do not hard-code theme colors or fonts in components.

### `archive-light`

Default theme in `:root`. Inspired by the cleaner editorial layouts in `modern-site-layouts.png`: warm paper background, restrained red accent, quiet borders, and readable content cards.

### `watercolor`

Inspired by the parchment and botanical composition in `artistic-site-layouts.png`: softer paper tones, ochre accents, muted green support color, and gentler image treatment.

### `nocturne`

Inspired by the star-lit devotional layout in `artistic-site-layouts.png`: dark blue-green background, gold accents, higher-contrast imagery, and deeper shadows for luminous saint portraits.

### `temple`

Inspired by the dark temple layout in `modern-site-layouts.png`: charcoal green foundation, warm stone accents, stronger image overlays, and a more cinematic treatment for temple or pilgrimage pages.

## Applying A Theme

Set `data-theme` on an ancestor, usually `<html>` or `<body>`:

```tsx
<html lang="en" data-theme="watercolor">
```

Valid initial values:

- `watercolor`
- `nocturne`
- `temple`

Omitting `data-theme` uses `archive-light`.

## Layout Variants

Layout choices live beside editable site copy in `lib/site-content.ts` so visual compositions can be switched without rewriting page data.

Current homepage layouts:

- `devotional`: the image-led nocturne homepage with the large search pill, intentional hero spacing, horizontal scroll rails, and Instagram previews.
- `archive`: the original MVP homepage layout with a two-column hero, action buttons, and responsive card grids.

The default is controlled by `siteDesignConfig.homeLayout`:

```ts
export const siteDesignConfig = {
  homeLayout: "devotional"
};
```

For a temporary runtime toggle, set `NEXT_PUBLIC_HOME_LAYOUT` to `archive` or `devotional`. Invalid values fall back to `siteDesignConfig.homeLayout`.

## Layout Lessons

Treat theme, layout, and component variants as separate decisions:

- Theme changes belong in token values. For example, the nocturne palette defines the dark background, gold accents, translucent card surface, cream text, and image treatments.
- Interactive state colors and shadows are theme decisions. Keep clickable-card affordance values such as `--color-interactive-border` and `--shadow-interactive` in each theme, while shared CSS controls when the state appears.
- Layout changes belong in layout variants or shared layout classes. The archive and devotional homepages should be switchable without deleting either composition.
- Interactive movement and image scale are layout/motion decisions. Keep values such as `--interactive-surface-lift` and `--interactive-image-scale` in shared tokens unless a future layout variant needs a deliberate override.
- Component presentation changes belong in component variants. Saint cards use summary and portrait variants; tradition cards use summary and icon variants.

When adjusting a section:

- Use `.section-heading` for section titles and section-level actions so headings align consistently across homepage and index-page sections.
- Avoid relying on a removed section to create vertical spacing. If a band such as stats is removed, move the intended spacing onto the surrounding layout.
- Prefer page-scoped rhythm fixes over global spacing edits when only one page is visually off.
- For visual carousels in the devotional layout, set `ScrollRail` controls explicitly so arrows remain part of the design even when overflow measurement changes during rendering.
