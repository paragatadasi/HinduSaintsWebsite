# Map and Places Infrastructure

The public map experience is built from the same published CMS data as the
saints pages. Airtable and other imports can seed place records, but public map
rendering must read from the website database.

## Public Routes

- `/map` is the public map/index page.
- `/places` redirects to `/map` for backward compatibility.
- `/places/[slug]` is the public detail page for a single place.

Keep place detail URLs under `/places/[slug]` even when the index is branded as
Map. Place cards and map panel links should continue to point to place detail
routes.

## Data Flow

Core database records:

- `Place` stores reusable place names and optional geography.
- `SaintPlace` links saints to places and classifies the relationship with
  `PlaceType`.
- `SaintPlace.routeOrder`, `routeLabel`, and `routeConfidence` optionally
  describe an editorially reviewed route sequence for a saint's mapped places.
- `Saint` provides publication status and date fields used by the map timeline.

Public adapters:

- `lib/public-places.ts` is the DB-backed adapter for place summaries, place
  detail pages, and map data.
- `lib/public-contracts.ts` defines public-safe place and map types.
- `lib/place-geocoding.ts` resolves map coordinates.

The adapter only includes saints with `status: "published"`. Do not expose raw
import payloads, museum/relic fields, private editorial notes, or unpublished
saints in map responses.

## Filtering Rules

The public Map and place index list only places with at least 3 associated
published saints. The threshold lives in `lib/public-places.ts` as
`MIN_PUBLIC_PLACE_SAINTS` and is applied consistently to:

- map points
- place summary cards
- generated place slugs
- place detail lookups

If this threshold changes, update it in one place and verify `/map` and
`/places/[slug]` behavior together.

## Map Coordinates

The database has `Place.latitude` and `Place.longitude`, but imported rows may
not have coordinates yet. `lib/place-geocoding.ts` provides a curated fallback
dictionary for common Indian places and regions currently present in the CMS.

Coordinate precedence:

1. Use reviewed DB latitude/longitude when both exist and fall within India map
   bounds.
2. Fall back to the curated coordinate dictionary.
3. Omit the place from the map if no usable coordinate exists.

When editors add reviewed coordinates to the CMS, the map automatically prefers
those values over the fallback dictionary.

## Visualization Component

`components/places/india-saints-map.tsx` is a client component rendered on the
`/map` page. It receives serialized map data from `getIndiaPlaceMapData()`.

Current MVP behavior:

- simplified SVG India silhouette
- markers sized by active saint count
- keyboard-accessible marker selection
- hover/focus card with place name and saint count
- always-visible intro/prompt text from `lib/site-content.ts`
- selected place details below the intro
- optional year slider that filters saints who lived during the selected year
- time-filter route mode that shows each saint portrait once at the visible
  route start and draws dotted connectors to other visible route places

Styling belongs in `styles/globals.css` and should use design tokens from
`styles/tokens.css`. Avoid inline layout/color styles in the component.

## Route Rules

The map route view is derived from visible `SaintPlace` links while the time
filter is enabled. It does not expose unpublished saints or private import data.

Portrait display place precedence:

1. birth place
2. lowest explicit `routeOrder`
3. primary place
4. samadhi place
5. sadhana, associated, then other places by stable name order

Ordered dotted route precedence:

1. birth place links
2. non-birth/non-samadhi links with explicit `routeOrder`, sorted ascending
3. samadhi place links

Links without `routeOrder` are not inserted into the chronological route. If
they are visible and are not the portrait display place, the map may show them
as quieter associated connectors from the display place. This avoids inventing a
life sequence while still showing that the saint is associated with more than
one visible location.

When the same saint has both a broad state-level place and a more specific
mapped city/town in that state, route mode suppresses the state-level
association for that saint. The all-eras map keeps state associations visible
for regional discovery, and state markers are styled distinctly from city/town
markers. The state can still appear in route mode for saints who only have the
broad association.

Editors should use `birth` and `samadhi` place types only when the source
identifies those roles. Use `routeOrder` for reviewed route sequence among other
key places, and leave it blank when the order is unknown.

## Timeline Rules

The time filter uses `Saint.birthYear` and `Saint.samadhiYear`.

- Saints with both years are active when `birthYear <= selectedYear <= samadhiYear`.
- Saints with one known endpoint use that known year as both start and end.
- Saints with no usable years are hidden when the time filter is enabled.

The year range is derived from mapped saints with date metadata.

## Site Content

Public copy for the page and visualization lives in `lib/site-content.ts`:

- `placesIndexContent` controls the `/map` page intro.
- `placesMapContent` controls the visualization heading, description, and
  selection prompt.
- `placeDetailTemplateContent` controls `/places/[slug]` detail labels.

Use site content configuration for copy changes instead of hard-coding page text
inside components.

## Verification

For ordinary map/place code changes, run:

```powershell
npm run dev:check
```

If Prisma generation is blocked by a Windows file lock, at minimum run:

```powershell
npx.cmd tsc --noEmit
```

Then smoke-check:

- `/map` returns 200 and renders the map prompt.
- `/places` redirects to `/map`.
- a known `/places/[slug]` detail page returns 200 when the place meets the
  public threshold.

For larger route/rendering changes or pre-deployment handoff, use
`npm run codex:verify` once the Prisma client lock is cleared.
