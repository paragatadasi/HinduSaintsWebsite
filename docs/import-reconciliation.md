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

Recommended flow:

1. Ingest URL, type, caption text, posted date, thumbnail, and extracted saint names.
2. Normalize extracted names.
3. Compare against saints and aliases.
4. Auto-suggest matches with confidence.
5. Send uncertain items to `/admin/instagram`.
6. Editors can match, create saint, add alias, ignore, or mark needs review.

## Instagram tracker

The Google Sheets Instagram tracker can be imported before full Instagram post
data is available. Tracker rows are preserved in `InstagramTrackerRow`, and
obvious matches flag local `AirtableMirrorRecord` saint rows with
`hasInstagramContent`.

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
