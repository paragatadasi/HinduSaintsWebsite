# Import and reconciliation

## Airtable

Airtable is an import/reference source. It is not the live website source of truth.

Museum and relic fields must not be mapped to public pages. If they are preserved for debugging, keep them private and never expose them through public APIs.

Recommended flow:

1. Import raw Airtable rows into `ExternalRecord`.
2. Create or update draft website records only when safe.
3. If a human-edited website field conflicts with an imported value, create a reconciliation issue.
4. Do not silently overwrite CMS edits.

The Airtable mirror importer stores a private, idempotent copy of source rows in
`AirtableMirrorRecord` and also updates the generic `ExternalRecord` audit table.
It never maps museum/relic fields to public website records.

Required environment variables:

- `AIRTABLE_ACCESS_TOKEN`: read-only Airtable personal access token.
- `AIRTABLE_BASE_ID`: Airtable base ID, such as `app...`.
- `AIRTABLE_TABLES`: comma-separated table IDs or names to mirror.
- `AIRTABLE_VIEW`: optional view name or ID to limit imported rows.

Run a dry pull without writing to the database:

```sh
npm run import:airtable -- --dry-run
```

Mirror configured tables into the development database:

```sh
npm run import:airtable
```

Override tables for one run:

```sh
npm run import:airtable -- --tables "Saints,Traditions"
```

Import Airtable mirror saints that have matched Instagram tracker content into
the CMS:

```sh
npm run import:airtable-saints -- --dry-run
npm run import:airtable-saints -- --write
```

The CMS import is idempotent through `ExternalRecord` links. Imported saint
records enter as `needs_review`, preserve original Airtable names as aliases,
split birth and samadhi date fields into raw/year/month/day/precision parts,
and map safe saint images from `Picture(s) of Saint`. It does not import relic
or museum fields into public saint records.

Publish only the obvious high-confidence CMS saints:

```sh
npm run approve:obvious-cms-saints -- --dry-run
npm run approve:obvious-cms-saints -- --write
```

This approval script only publishes CMS saints whose linked Google Sheets
tracker rows are all `matched` with `high` confidence. It leaves ambiguous
tracker rows and non-obvious cases for human review.

Find likely duplicate Airtable saint records from the local mirror:

```sh
npm run reconcile:airtable
```

Create or update local reconciliation issues for those duplicate clusters:

```sh
npm run reconcile:airtable -- --write
```

This reconciliation script compares normalized Airtable `Saints.Name` values and
removes common honorifics such as Sri, Shri, Swami, Maharaj, Baba, and Ji before
grouping candidates. It also runs a date-informed second pass for records that
share a core identity and birth/samadhi year context. Human review feedback can
be encoded in the script so known false positives are ignored and known true
duplicates stay proposed. It writes only to the website development database,
not back to Airtable.

Merge human-approved duplicate records into the selected Airtable primary rows:

```sh
npm run merge:airtable
npm run merge:airtable -- --write
```

The merge script updates primary Airtable records by filling missing scalar fields,
combining link/text fields, unioning linked-record and attachment arrays, and
resolving the corresponding local reconciliation issues. It does not delete
duplicate Airtable rows.

## Instagram

The project distinguishes two Instagram-related inputs:

- `InstagramItem` is the real imported Instagram post/reel/carousel record. It
  is the source record editors should reconcile, cite, and attach to saints.
- `InstagramTrackerRow` is manually maintained tracker data from Google Sheets.
  It is useful for triangulation, bulk discovery, and Airtable matching, but it
  is noisy reference data and is not treated as the Instagram source of truth.

Recommended flow:

1. Ingest URL, type, caption text, posted date, thumbnail/media URL, shortcode, Meta media ID, and raw API payload.
2. Preserve the raw API media object in `ExternalRecord`.
3. Normalize explicit extracted saint names when the source provides them.
4. Compare explicit names against saints and aliases and auto-suggest matches with confidence.
5. Send uncertain items to `/admin/instagram`.
6. Editors review `/admin/instagram/[id]`, attach saint matches, confirm or ignore matches, and publish/hide/return items to review.

Import real Instagram data from the Instagram API:

```sh
npm run ingest:instagram -- --api --dry-run
npm run ingest:instagram -- --api
```

Required API environment:

```env
INSTAGRAM_ACCESS_TOKEN="..."
INSTAGRAM_API_BASE_URL="https://graph.instagram.com"
INSTAGRAM_MEDIA_FIELDS="id,caption,media_type,media_url,children{media_type,media_url,thumbnail_url},permalink,thumbnail_url,timestamp,username"
OPENAI_API_KEY=""
OPENAI_FIRST_PAGE_MODEL="gpt-5.5"
```

`--api` reads `/me/media`, follows pagination, and writes `InstagramItem`
records. The importer preserves each raw API media object in `ExternalRecord`
with `sourceType=instagram`; the Meta media `id` is used as the stable external
identifier when present. `thumbnail_url` is used for previews when present, and
`media_url` is used as the fallback preview for image posts. It creates
suggested `InstagramItemSaint` links only when explicit extracted names match
CMS saint names or aliases. It does not infer saints from captions by default,
does not publish saint pages, and does not overwrite reviewed saint content.

For carousel records imported before child media URLs were present in the raw
payload, backfill the preserved Instagram `ExternalRecord` payloads from the
Meta media IDs:

```sh
npm run backfill:instagram-carousels -- --dry-run
npm run backfill:instagram-carousels
```

The backfill updates only the local Instagram raw payload snapshot for existing
carousel items. It does not change saint matches, review status, captions, or
human CMS edits.

The admin review flow is:

- `/admin/instagram`: status-filtered real Instagram queue with clickable status counters and rich media cards.
- `/admin/instagram?status=published`: view items already published from the queue.
- `/admin/instagram/[id]`: item detail review screen with media preview, caption, AI-assisted first-page biodata extraction from imported image data, import metadata, raw API payload, saint match list, first-page claim review, manual saint attachment, and item publish/review/hide actions.

First-page biodata can create accepted `InstagramDerivedClaim` records for:

- aliases from extracted display names.
- birth and samadhi dates.
- associated places.
- guru saint relationships.
- tradition links.

Date claims follow the same date model as saint imports: the source string is
preserved for review, while `parseImportedDate` is used to compare and apply
year/month/day/precision parts. For example, an Instagram value such as
`c. 1350` is treated as a year-level `1350` candidate when checking it against
an existing saint date, without discarding the original source wording.

Accepted claims are preserved as review records before they are applied. If an
Instagram item already has a matched saint, accepting a claim applies it to that
saint immediately when the target field is empty or the relationship/link is
missing. If the item is matched later, previously accepted claims are piped into
the newly matched saint during the match transaction. Date conflicts create open
`ReconciliationIssue` records instead of overwriting reviewed CMS values.

Public display requires both:

- `InstagramItem.status = published`.
- an `InstagramItemSaint` link for the saint with `matchStatus` of `matched` or `published`.

Published saint pages render matched Instagram items as rich post cards with
caption expansion and a carousel viewer. Carousel viewer images come from the
reviewed Instagram item's preserved child media URLs, exposed through the public
adapter without exposing raw import payloads.

The website treats Instagram CDN media URLs as import-time source URLs only.
Those `scontent*.cdninstagram.com` links are temporary signed URLs and must not
be treated as stable display URLs for public pages or the admin queue. Raw
Instagram payloads remain preserved in `ExternalRecord.rawPayloadJson` for
review and debugging, while display media is copied into local storage and
tracked as ordered `InstagramMediaAsset` rows.

The home page Instagram rail must show the first carousel image because that
cover identifies the saint described in the post. `npm run ingest:instagram`
attempts to cache every displayable media image during import and stores the
first cached image in `InstagramItem.thumbnailUrl` for legacy thumbnail
consumers. Public saint pages, the home rail, the admin Instagram queue/detail
views, and saint image picker should prefer ordered `InstagramMediaAsset`
records over raw payload media URLs.

For already-imported records, run:

```sh
npm run cache:instagram-media -- --dry-run
npm run cache:instagram-media
```

The older `npm run cache:instagram-covers` command is kept as a compatibility
alias for the full media cache command. If cached media generation fails because
stored CDN URLs have expired, the cache script refreshes the Instagram media
payload through the Graph API before saving ordered local copies. Only website
display URLs are made durable; raw imported values are not overwritten except
when the preserved external payload is refreshed from Instagram for review.

For debugging or one-off backfills, the same importer can still read JSON/CSV
exports with common field names such as `url`, `permalink`, `caption`,
`postedAt`, `thumbnailUrl`, `shortcode`, and `saintName`:

```sh
npm run ingest:instagram -- --file path/to/instagram-posts.json --dry-run
```

## Instagram tracker

The Google Sheets Instagram tracker can be imported before or alongside full
Instagram post data. Tracker rows are preserved in `InstagramTrackerRow`, and
obvious matches flag local `AirtableMirrorRecord` saint rows with
`hasInstagramContent`. These flags are a discovery signal for CMS import and
review, not a replacement for real `InstagramItem` source records.

Configure a published Google Sheets CSV export URL:

```sh
GOOGLE_SHEETS_TRACKER_CSV_URL="https://docs.google.com/spreadsheets/d/.../export?format=csv&gid=..."
```

Run a dry import:

```sh
npm run import:instagram-tracker -- --dry-run
```

Import and flag matched Airtable mirror saints:

```sh
npm run import:instagram-tracker
```

For a local CSV file:

```sh
npm run import:instagram-tracker -- --file path/to/tracker.csv
```

The importer uses conservative name matching against the Airtable mirror:
exact normalized names, exact core names before place text such as `of ...`,
and unique contained-name matches. Ambiguous or missing names remain
`needs_review` rather than being guessed. Multiple posts can match the same
saint, and `instagramTrackerMatchCount` tracks how many tracker rows matched.

See `docs/data-integrations.md` for the current status, completed counts, and
end-to-end runbook.
