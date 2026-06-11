# Data integrations status and runbook

This document summarizes the Airtable, Instagram API, Instagram tracker, CMS import, and review work completed so far. Airtable, Instagram, and Google Sheets are import/reference sources only; the website database remains the source of truth for public pages.

## Current state

As of June 10, 2026, the local development database has:

- 270 CMS `Saint` records imported from Airtable mirror saints with matched Instagram tracker content.
- 270 of those saints marked `published` after approving only high-confidence Google Sheets tracker matches.
- 337 real Instagram media records imported from the Instagram API into `InstagramItem` for editorial review.
- 84 Google Sheets tracker rows still marked `needs_review`.
- 270 Airtable `ExternalRecord` links pointing imported CMS saints back to their source Airtable mirror records.
- 273 places, 530 saint-place links, 24 traditions, 52 saint-tradition links, and 237 saint gallery image links created from safe saint fields.

The public saints index and saint detail pages now read published saints from the CMS database through `lib/public-saints.ts`. Sample saint data is no longer the source for `/saints` or `/saints/[slug]`.

The admin saint review workflow now has:

- `/admin` live workflow counts.
- `/admin/saints` status-filtered review queues.
- `/admin/saints/[id]` review detail pages with editable public fields, source context, tracker matches, images, and publish/review/hide actions.

The admin Instagram review workflow now has:

- `/admin/instagram` status-filtered queues for real imported Instagram posts, reels, and carousel records.
- clickable status counters so editors can view imported, suggested, matched, review, hidden, and legacy published queues.
- rich queue cards with media previews, status/type/date badges, caption previews, Instagram links, and review actions.
- `/admin/instagram/[id]` detail review pages with a large preview, AI-assisted first-page biodata extraction from imported image data, caption/import metadata, raw API source snapshot, saint match list, manual saint attachment, saint-draft creation, and review/hide actions.

Public saint pages render matched Instagram items as Instagram-style post cards.
Carousel posts expose a public carousel viewer with thumbnail and keyboard
navigation; the image list comes from reviewed Instagram child media URLs stored
in the preserved API payload, not from tracker rows.

## Integration boundaries

Airtable is import/reference only. Do not use Airtable as the live website source of truth.

Museum, relic, vitrine, shelf, and other private collection fields must never be mapped into public page contracts. The CMS saint import maps only safe saint fields such as names, dates, places, traditions, biography notes, saint images, links, and tracker match context.

Raw external values are preserved for debugging and review:

- Airtable rows are mirrored in `AirtableMirrorRecord`.
- Generic source links are tracked in `ExternalRecord`.
- Instagram API media payloads are preserved in `ExternalRecord` with `sourceType=instagram` and linked to `InstagramItem`.
- Google Sheets tracker rows are stored in `InstagramTrackerRow`.
- Potential conflicts or duplicate candidates are stored in `ReconciliationIssue`.

## Scripts

Mirror Airtable into the local database:

```sh
npm run import:airtable
```

Find likely duplicate Airtable saints:

```sh
npm run reconcile:airtable
npm run reconcile:airtable -- --write
```

Merge human-approved Airtable duplicate pairs into primary Airtable rows:

```sh
npm run merge:airtable -- --write
```

Import the Google Sheets Instagram tracker and flag matched Airtable mirror saints:

```sh
npm run import:instagram-tracker
```

Import real Instagram media from the Instagram API into the admin review queue:

```sh
npm run ingest:instagram -- --api --dry-run
npm run ingest:instagram -- --api
```

Use `--limit N` or `INSTAGRAM_IMPORT_LIMIT` for a smaller refresh:

```sh
npm run ingest:instagram -- --api --limit 30
```

Backfill child image URLs for existing carousel records whose preserved payloads
only contain a cover image:

```sh
npm run backfill:instagram-carousels -- --dry-run
npm run backfill:instagram-carousels
```

Import matched Airtable mirror saints into the CMS:

```sh
npm run import:airtable-saints -- --write
```

Publish only imported CMS saints whose tracker rows are all high-confidence matches:

```sh
npm run approve:obvious-cms-saints -- --write
```

Most import and approval scripts support a dry-run mode by default or through `--dry-run`. Use dry runs before write runs when changing matching logic.

## CMS saint import behavior

`scripts/import-airtable-saints-to-cms.ts` imports only Airtable mirror rows where:

- `tableIdOrName` is `Saints`
- `hasInstagramContent` is true

The importer is idempotent by linking each CMS saint to its Airtable source through an `ExternalRecord` with source type `airtable`. It updates importer-owned CMS records on later runs and preserves the Airtable record ID for traceability.

Name handling:

- `displayName` removes conservative trailing place phrases such as `of Arunachala`.
- `canonicalName` removes leading honorifics where safe.
- the original Airtable `Name` is preserved as a `SaintAlias` with alias type `airtable_name`.

Date handling:

- birth and samadhi dates are stored separately.
- raw values are preserved in `birthDateRaw` and `samadhiDateRaw`.
- parsed parts are stored in `birthYear`, `birthMonth`, `birthDay`, `samadhiYear`, `samadhiMonth`, and `samadhiDay`.
- partial or textual values such as `June 2013` and `Still alive` are preserved with date precision instead of being forced into invalid dates.

Location handling:

- Airtable `Place` values become `Place` records and `SaintPlace` links.
- trailing place phrases removed from names are also preserved as place links.
- uncertain imported places default to `associated`.
- birth and samadhi place types should only be set when the source explicitly supports that classification.
- review/import flows should not add a second `SaintPlace` link for the same
  saint and `Place` when another relationship type already exists.

Media handling:

- only `Picture(s) of Saint` is imported into public CMS image structures.
- relic image fields are not imported into public saint records.
- Airtable attachment URLs are preserved as source URLs for now; long-term, production should download and store reviewed assets through the site media system.

## Review and publishing behavior

Imported CMS saints initially enter the CMS as `needs_review`. The approval script publishes only saints whose linked tracker rows are all `matched` with `high` confidence.

Editors can use `/admin/saints` to filter by status and `/admin/saints/[id]` to:

- edit public display name, canonical name, short description, and biography summary.
- inspect aliases, places, traditions, dates, Airtable source linkage, Instagram tracker rows, and images.
- approve and publish, return to review, or hide a saint.

Public pages query only `status = published`.

Imported Instagram items initially enter the CMS as `needs_review` unless a confident explicit saint-name field exists in the source row. API imports preserve captions and media metadata but do not guess saint matches from captions by default.

Editors can use `/admin/instagram` to filter real Instagram items by status and `/admin/instagram/[id]` to:

- inspect the media preview, caption, posted date, shortcode, import batch, and raw API payload.
- accept first-page biodata claims for aliases, dates, places, gurus, and traditions while preserving the accepted source value.
- attach a saint and mark the `InstagramItemSaint` link as `matched`.
- create a new `needs_review` saint draft from first-page biodata and attach the Instagram item immediately.
- return an Instagram item to review, hide it, or ignore individual suggested saint links.

Instagram review is a matching workflow, not a direct publishing workflow.
Accepted Instagram place claims add an `associated` place link only when the
saint does not already have that same `Place` linked under any relationship
type. If a stronger reviewed relationship such as `primary`, `birth`, or
`samadhi` already exists, the claim is considered applied without creating a
duplicate place chip on public profiles.
Public saint pages show Instagram links only when all conditions are true:

- the saint has `status = published`.
- the `InstagramItem` has `status = matched` or legacy `published`.
- the `InstagramItemSaint` link for that saint is `matched` or `published`.

Multiple Instagram posts can be attached to a single saint. Once the saint is
published, all of that saint's matched, non-hidden Instagram content is available
through the public saint page adapter. Carousel child images remain supporting
Instagram media; the adapter exposes only public-safe URLs and never the raw API
payload itself.

Manual Google Sheets tracker rows are not public source records. They remain discovery/triangulation inputs for Airtable matching and CMS import decisions.

## Known gaps and next steps

- Build full edit workflows for aliases, places, traditions, biographies, sources, and image review rather than only displaying imported relationships.
- Add richer tracker-specific review actions for the 84 unmatched Google Sheets tracker rows.
- Add caption-assisted saint suggestion logic for API-imported Instagram items, with conservative review-first behavior.
- Download or rehost reviewed Airtable image attachments so public pages do not depend on expiring Airtable URLs.
- Add reconciliation UI for open duplicate/conflict issues.
- Add role-aware publishing permissions once real user roles are populated from authenticated users.
- Add tests around the public saint adapter and review server actions.
