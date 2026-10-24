# SPN map and navigation refinements — 24 October 2026

## Implemented

- SPN planning keeps the shared museum sidebar visible, with no separate hide/show control. Vrindavan planning retains its current space-saving layout.
- The SPN whole-room map occupies the content width; selected vitrine information sits below it.
- Browse sections uses an integrated chevron and native disclosure semantics. Its open/closed choice persists per museum for the browser session, including navigation and reloads. Storage restrictions do not prevent native disclosure use.
- The SPN map uses a shared 8px gap token and a tighter selection offset. Adjacent vitrines retain their schematic positions; outlines no longer intersect neighboring buttons.
- Source provenance is explained once in About these locations. Per-row provenance labels appear only when inventory items and source-recorded locations are mixed. This changes presentation, not verification or inventory status.

## Verification

- `npm run dev:check` passed.
- Actual-component browser fixture: open and closed Browse sections states survived full-page navigation; SPN sidebar remained visible.
- Vitrine 35 measured 8px clearance to 27, 34 and 38; selected outline plus offset remains inside that clearance.
- Desktop 1280px and mobile 390px: no page overflow. The small-screen map retains its contained horizontal scrolling and list alternative.
- Fixture data only; no production location or inventory writes.

## Separate design exploration

The local saint-contents prototype compares the unchanged text list, quiet cards, and portrait rows grouped by shelf. It uses real names and published portrait URLs, with explicitly illustrative shelf assignments. No prototype variants or portrait data enter production. The selected direction will be integrated after review.

The Public Experience Designer has incorporated the integrated-chevron preference and persistent museum navigation into the upcoming shared design documentation. This note avoids competing edits to that documentation consolidation.
