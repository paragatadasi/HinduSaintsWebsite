# Data integrations status and runbook

This document summarizes the Airtable, Instagram tracker, CMS import, and review work completed so far. Airtable and Google Sheets are reference/import sources only; the website database remains the source of truth for public pages.

## Current state

As of June 8, 2026, the local development database has:

- 270 CMS `Saint` records imported from Airtable mirror saints with matched Instagram tracker content.
- 270 of those saints marked `published` after approving only high-confidence Google Sheets tracker matches.
- 84 Google Sheets tracker rows still marked `needs_review`.
- 270 Airtable `ExternalRecord` links pointing imported CMS saints back to their source Airtable mirror records.
- 273 places, 530 saint-place links, 24 traditions, 52 saint-tradition links, and 237 saint gallery image links created from safe saint fields.

The public saints index and saint detail pages now read published saints from the CMS database through `lib/public-saints.ts`. Sample saint data is no longer the source for `/saints` or `/saints/[slug]`.

The admin saint review workflow now has:

- `/admin` live workflow counts.
- `/admin/saints` status-filtered review queues.
- `/admin/saints/[id]` review detail pages with editable public fields, source context, tracker matches, images, and publish/review/hide actions.

## Integration boundaries

Airtable is import/reference only. Do not use Airtable as the live website source of truth.

Museum, relic, vitrine, shelf, and other private collection fields must never be mapped into public page contracts. The CMS saint import maps only safe saint fields such as names, dates, places, traditions, biography notes, saint images, links, and tracker match context.

Raw external values are preserved for debugging and review:

- Airtable rows are mirrored in `AirtableMirrorRecord`.
- Generic source links are tracked in `ExternalRecord`.
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

## Known gaps and next steps

- Build full edit workflows for aliases, places, traditions, biographies, sources, and image review rather than only displaying imported relationships.
- Add review queues for the 84 unmatched Google Sheets tracker rows.
- Download or rehost reviewed Airtable image attachments so public pages do not depend on expiring Airtable URLs.
- Add reconciliation UI for open duplicate/conflict issues.
- Add role-aware publishing permissions once real user roles are populated from authenticated users.
- Add tests around the public saint adapter and review server actions.
