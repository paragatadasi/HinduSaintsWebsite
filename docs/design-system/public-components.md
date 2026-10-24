# Public component decisions

[Design system index](../design-system.md) · [Full registry](../../lib/design-system/public-registry.ts)

The registry names every inventoried component, source file, existing variants,
defaults, intended use, and preview coverage. An unlisted variant is not an option.
The component's TypeScript API remains authoritative.

## Navigation and controls

`components/ui/button.tsx`: Button renders a link and requires `href`.
Use a native button for state changes or submission, with existing button classes.
Variants: `primary`, `secondary`, `text`; default `primary`. No size prop exists.
`iconPosition` is `start` (default) or `end`.

```text
Main navigation action → primary
Supporting navigation action → secondary
Low-emphasis navigation → text
```

```tsx
// Correct: explicit navigation hierarchy.
<Button href="/saints" variant="secondary">Explore Saints</Button>
// Incorrect: ghost is not implemented.
<Button href="/saints" variant="ghost">Explore Saints</Button>
```

Use PublicSearchField inside a form for directory search; HeaderSearch owns
global header search. SaintCatalogSelect submits its parent form automatically.
Use SaintEraRange for two-ended year selection. These have no invented visual
variants, loading props, or error props.

## Cards and collections

SaintCard: `summary` (default) for catalogs; `portrait` for discovery rails.
TraditionCard: `summary` (default) for descriptions; `icon` for compact discovery.
`showSaintCount=false` by default; true replaces summary text with the count.
PlaceCard has no variant. Prefer these over composing Card for the same entity.

```tsx
// Correct: the actual portrait variant in a discovery rail.
<SaintCard saint={saint} variant="portrait" />
// Incorrect: compact is not an implemented card variant.
<SaintCard saint={saint} variant="compact" />
```

Use `.card-grid` for catalogs; ScrollRail for horizontal discovery.
ScrollRail `controls` is `auto` (default) or `always`. Always preserves designed
arrow controls; auto shows them only when overflowing. Eight related cards are
intentional. An abbreviated mockup does not authorize reducing the production set.

SaintEncounterCard requires `catalog`, `hero`, `profile`, or `rail`:

```text
Catalog insertion → catalog
Hero invitation → hero
Profile fallback → profile
Horizontal discovery collection → rail
```

```tsx
// Correct
<SaintEncounterCard variant="rail" />
// Incorrect: there is no default variant.
<SaintEncounterCard />
```

## Editorial content

Prose renders sanitized Markdown; use it for rich text rather than raw HTML.
SaintProfileSummary handles plain-text expansion: `compact` is the default;
public saint pages explicitly use `editorial`. Preserve supplied paragraph breaks.
SaintBiography supplies the light reading panel and BiographyTableOfContents.
Use SaintDetailPageContent instead of copying its source list or facts markup.

```tsx
// Correct: approved public overview.
<SaintProfileSummary variant="editorial">{saint.shortDescription}</SaintProfileSummary>
// Incorrect: rich Markdown belongs in Prose, not a plain-text summary.
<SaintProfileSummary>{"## Biography\n\n**Markdown**"}</SaintProfileSummary>
```

## Images and posts

Use FocalImage for existing responsive image/crop handling. SaintHeroGallery
switches hero images; SaintGallery supplies full-image inspection. Use the shared
placeholder and empty state; never fabricate missing imagery or biography text.
InstagramEmbedGrid supports layout `section` (default) / `sidebar` and presentation
`modal` (default) / `inline`. HomeInstagramRail composes the homepage experience.

```tsx
// Correct: supported embedded presentation.
<InstagramEmbedGrid items={saint.instagramItems} saintName={saint.displayName} presentation="inline" />
// Incorrect: carousel is a post type, not a grid layout.
<InstagramEmbedGrid items={saint.instagramItems} saintName={saint.displayName} layout="carousel" />
```

## Page and shell compositions

Expandable panels use a chevron integrated into the panel header or disclosure
row, rather than a separate Show/Hide button. Use a native `details`/`summary`
when its behavior fits; otherwise use a native button with `aria-expanded` and
`aria-controls`. Keep the panel title or an accessible action label on the control,
a visible focus indicator, and Enter/Space operation. The chevron reflects state;
it must not be an unlabeled icon-only click target. Do not turn permanently useful
navigation into a disclosure merely to apply this pattern. Preserve existing
expansion persistence unless a specific workflow requires a different lifetime.

Use IndexPageHero for directory headings; use domain page components for detail
pages. Their `rootElement="div"` option supports private previews without nested
main landmarks. TraditionPageLayouts is for reviewed editorial detail; basic
tradition route restrictions still apply. Header, footer, contact, map, and route
transition workflows require integration review at the locations in the registry.
