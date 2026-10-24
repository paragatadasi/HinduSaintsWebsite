# Public foundations

[Design system index](../design-system.md)

## Direction

Iterate on the current system. Nocturne is the active theme (`app/layout.tsx`);
cosmic is the selected homepage (`lib/site-content.ts`). Alternative token layers
are implementation history, not interchangeable approved public directions.

Keep the blue/cream/gold character, uppercase serif saint names, image-led
discovery, and contrast between editorial serif text and sans interface text.
Editorial mode organizes predictable exploration. Creative mode can surprise
users while retaining understandable affordances and the same foundations.

## Choose a token

Read `styles/tokens.css` before adding a visual value. Components consume named
role tokens, never raw colors, font stacks, spacing, radii, widths, or shadows.
The generated catalogue records declarations and backing values by selector;
it is not a second editable token source.

Background choice:

```text
Page canvas → --color-bg
Panel/card → --color-surface, through the existing component class
Biography reading panel → --color-saint-profile-biography and its text pair
```

Text choice:

```text
Main reading text → --color-text
Supporting text → --color-muted
Interactive emphasis → existing button/link class and its theme tokens
```

Use `--font-serif` and `--font-sans` through existing text classes. Saint profile
title, overview, action, and source roles already have dedicated tokens. Do not
apply a generic typography rule that removes their approved contrast.
Use `--space-*`, `--radius-*`, `--width-*`, and `--shadow-*` through shared classes.
`--width-prose` is the approved restored overview width; do not reintroduce a
narrower measure without reviewing the actual page.

## Preserve approved saint behavior

- Photo first on narrow screens; retain the uppercase display name.
- View the Post is primary for the Instagram audience.
- Keep the expandable overview until reviewed biographies are available.
- Keep era/date/place/tradition context consolidated; do not add a competing band.
- Do not add Guru to key facts; related saints provide that discovery context.
- Preserve portrait cards, up to eight related saints, and featured fallback.
- Keep the hero divider and clean sources without internal row dividers.
- Keep the gold sans source heading and contrasting serif entry titles.

## Review before changing broad tokens

Compare the homepage, saint page, tradition page, place page, and directory.
Check long names, missing images, sparse content, full rails, keyboard focus,
touch targets, light reading panels, and reduced motion. A specimen demonstrates
a component; it does not prove contrast, screen-reader, or real-device compliance.

Raw values still exist in older CSS. Consolidate a repeated rule when changing
that pattern; do not treat this inventory as authorization for a site-wide rewrite.
