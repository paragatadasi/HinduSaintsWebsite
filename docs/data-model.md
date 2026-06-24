# Data model

The website database is the source of truth. Airtable and Instagram imports are reference inputs only.

Core entities:

- `Saint`
- `SaintAlias`
- `Tradition`
- `Place`
- `SaintRelationship`
- `MediaAsset`
- `InstagramItem`
- `Biography`
- `Source`
- `ImportBatch`
- `ExternalRecord`
- `ReconciliationIssue`
- `AuditEvent`
- `User`

Important rules:

- `Saint.slug` is unique.
- Public pages show only `ContentStatus.published`.
- `InstagramItem` stores real imported Instagram post/reel/carousel records.
- Instagram items can map to multiple saints through `InstagramItemSaint`.
- Public saint pages expose Instagram URLs for matched/published `InstagramItemSaint` links when the attached `InstagramItem` is matched/published and the saint itself is published.
- Guru/disciple data belongs in `SaintRelationship`, not in one-off text fields.
- Airtable record IDs and raw payloads are preserved in `ExternalRecord`.
- Conflicts become `ReconciliationIssue` records.

## Imported saint fields

Imported saint records should keep source values reviewable while exposing only
safe public fields.

Dates are separated by meaning:

- birth values use `birthDateRaw`, `birthYear`, `birthMonth`, `birthDay`, and
  `birthDatePrecision`.
- samadhi values use `samadhiDateRaw`, `samadhiYear`, `samadhiMonth`,
  `samadhiDay`, and `samadhiDatePrecision`.
- `dateNotes` can preserve parsing notes or traditional/textual date context.

This allows partial dates such as `June 2013`, year-only values, and text such
as `Still alive` without inventing invalid Gregorian dates.

Locations are first-class records:

- `Place` stores the reusable place name and optional future geography.
- `SaintPlace` links a saint to a place and classifies the relationship with
  `PlaceType`.
- uncertain imported locations should use `associated`.
- `birth` and `samadhi` place types should only be used when the source
  explicitly supports that meaning.

The public Map page and place detail routes are documented in
`docs/map-and-places.md`, including the published-content threshold, geocoding
fallback, and timeline behavior.

Names are separated for review:

- `displayName` is the public-facing name.
- `canonicalName` is the normalized primary identity.
- original external names should be preserved in `SaintAlias`, often with
  `AliasType.airtable_name`.

## Public frontend contracts

Frontend public views should consume explicit public contracts rather than full CMS records. The current launch contract lives in `lib/public-contracts.ts` and intentionally contains only display-safe fields for saint and tradition cards/detail headers. Museum, relic, raw import payload, reconciliation, and internal editorial fields must stay out of those public shapes.

The current DB-backed saint public adapter lives in `lib/public-saints.ts`. It
queries only `ContentStatus.published` saints and maps safe CMS fields into the
public contract used by `/`, `/saints`, and `/saints/[slug]`.

The current DB-backed tradition public adapter lives in
`lib/public-traditions.ts`. It queries only `ContentStatus.published`
traditions and maps safe CMS fields into the public contract used by
`/traditions` and `/traditions/[slug]`. The detail page now expects a richer
editorial layout than the current database fully stores, so the public adapter
uses graceful fallbacks for missing data and derives related places from
published saints until the admin editor can persist curated values.

To fully support the public tradition detail layout, the admin/data model should
add or expose reviewed fields for:

- a public reviewed hero image or emblem
- dedicated Markdown for founding acharya, history, and key teachings sections
- sidebar overview facts: founder, origin, era, focus, and scriptural basis
- a curated origin place link, separate from places derived through saints
- ordered lineage saint links, with optional role labels and parent/relationship
  metadata for tree rendering
- curated related tradition and related place links with display order
- source or scripture links that can back the scriptural basis field

Instagram public rendering also goes through `lib/public-saints.ts`. It queries
reviewed `InstagramItemSaint` links and returns safe display fields for
matched/published Instagram items on published saints. Carousel child image URLs
are derived from the preserved Instagram `ExternalRecord` payload and exposed
only as public URL arrays for the viewer. Raw API payloads, reconciliation
state, and internal notes remain outside the public contract. The Instagram item
is supporting content; `Saint.status` is the direct public publishing gate.

## Saint relationship graph

Long-term, saint-to-saint connections should be modeled as a first-class relationship graph, not only as prose inside biographies. Biographies can narrate relationships, but they should not be the only source of truth for them.

`SaintRelationship` should support both typed and untyped connections:

- A typed relationship identifies a known relationship category, such as guru, disciple, initiator, lineage successor, family relation, influence, contemporary, patron, debate opponent, or association.
- An untyped relationship records that two saints are known or believed to be connected, while leaving the exact relationship category uncategorized until an editor can review it.

Relationship records should be able to carry:

- source saint and target saint
- optional relationship type
- directionality, when known
- certainty or evidence status, such as certain, probable, traditional, disputed, imported, or uncategorized
- editorial display rank or weight, for prioritizing which relationships appear first on saint biographies and other public pages
- public description, when appropriate
- internal editorial notes
- citations and source records
- draft, review, and published status
- public/private visibility controls

Display rank should be treated as an editorial presentation field, not as evidence strength. A relationship may be highly important to show on a biography page even when its evidence status is traditional or disputed, and a well-attested relationship may still be low-priority for public display.

Individual biography stories or events should eventually be linkable to saints and to `SaintRelationship` records. This allows a story to serve as narrative context or evidence for a connection without making the story itself the canonical relationship record.

Public tradition and grouping pages may render curated tree, lineage, timeline, or network views from this graph. The underlying data should allow graph-shaped relationships even when a public page presents a simplified tree.

Imported Airtable, Instagram, CSV, and manual-ingest values may create candidate relationship records or reconciliation issues, but they must not silently overwrite reviewed CMS relationship data.
