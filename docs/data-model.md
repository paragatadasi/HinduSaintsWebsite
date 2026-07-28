# Data model

The website database is the source of truth. Airtable and Instagram imports are reference inputs only.

Core entities:

- `Saint`
- `SaintAlias`
- `Tradition`
- `Place`
- `PlaceRelationship`
- `SaintRelationship`
- `SaintFamily`
- `MuseumSection`
- `DuplicateCandidate`
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
- Public saint and full editorial pages show only `ContentStatus.published`.
- `Tradition` records in `draft` or `needs_review` may appear through a
  deliberately minimal public contract containing their name, neutral fallback
  copy, and associated published saints. Archived traditions remain private.
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

- birth values use `birthDateRaw`, `birthYear`, `birthYearEnd`, `birthMonth`,
  `birthDay`, and `birthDatePrecision`.
- samadhi values use `samadhiDateRaw`, `samadhiYear`, `samadhiYearEnd`,
  `samadhiMonth`, `samadhiDay`, and `samadhiDatePrecision`.
- `dateNotes` can preserve parsing notes or traditional/textual date context.

This allows partial dates such as `June 2013`, year-only values, and text such
as `Still alive` without inventing invalid Gregorian dates. An uncertain year
range such as `1914-1915` is retained in the raw field, parsed with `range`
precision, and stores both endpoints in the corresponding start/end year
columns. `Unknown` uses explicit `unknown` precision and no numeric parts. This
is intentionally different from a blank field, which means that no reviewed
date value has been recorded.

Locations are first-class records:

- `Place` stores the reusable place name and optional future geography.
- `SaintPlace` links a saint to a place and classifies the relationship with
  `PlaceType`.
- uncertain imported locations should use `associated`.
- `birth` and `samadhi` place types should only be used when the source
  explicitly supports that meaning.

Places are no longer limited to a flat state/locality split. A `Place` can now
represent a country, state, city, sacred site, ashram, monastery, route area, or
spiritual region through `Place.placeKind`. Hierarchy and sacred geography live
in `PlaceRelationship` records:

- administrative containment: `Bengaluru contained_in Karnataka`.
- site containment: `Nilachal Math contained_in Puri`.
- sacred grouping: `Vrindavan associated_region Braj Mandal`.
- broader regions: `Bangladesh part_of South Asia`.

Prefer linking a saint to the most specific reviewed place that is known. Broader
state, country, and spiritual-region associations should be derived from the
place graph unless the broad place is the only known reviewed location.

The public Map page and place detail routes are documented in
`docs/map-and-places.md`, including the published-content threshold, geocoding
fallback, and timeline behavior.

The July 2026 Airtable cleanup workflow and recommended site-model follow-ups
are documented in `docs/airtable-cleanup-site-model-roadmap.md`.

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
`lib/public-traditions.ts`. It maps published traditions into the full public
contract used by `/traditions` and `/traditions/[slug]`. Draft and
`needs_review` traditions use a separate basic presentation that does not expose
unpublished descriptions, founder data, media, sources, or other editorial
fields. The full detail page expects a richer editorial layout than the current
database fully stores, so published records use graceful fallbacks for missing
data and derive related places from published saints until the admin editor can
persist curated values.

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

### Tradition lineage cutovers

`TraditionLineageSaint` is the curated lineage table for tradition detail
pages. It is separate from `SaintTradition`, which means a schema or adapter
change must not simply switch public rendering from `SaintTradition` to
`TraditionLineageSaint` without also migrating existing links.

When introducing or replacing curated relationship tables:

- backfill from the prior source of truth in a migration, or keep an explicit
  public fallback until editors have reviewed the new table.
- preserve existing human CMS edits; imported Airtable, Instagram, CSV, or
  script data may seed missing rows but must not overwrite reviewed lineage
  rows.
- keep merge and delete workflows relationship-aware. If a tradition merge
  moves `SaintTradition`, source links, or child traditions, it must also move
  or merge `TraditionLineageSaint` rows before deleting the duplicate record.
- verify a representative published tradition after the migration. At minimum,
  compare the tradition's `SaintTradition` count with its
  `TraditionLineageSaint` count and confirm public rendering still shows
  associated saints.

Instagram public rendering also goes through `lib/public-saints.ts`. It queries
reviewed `InstagramItemSaint` links and returns safe display fields for
matched/published Instagram items on published saints. Carousel child image URLs
are derived from the preserved Instagram `ExternalRecord` payload and exposed
only as public URL arrays for the viewer. Raw API payloads, reconciliation
state, and internal notes remain outside the public contract. The Instagram item
is supporting content; `Saint.status` is the direct public publishing gate.

## Saint relationship graph

Saint-to-saint connections are modeled as a first-class relationship graph, not
only as prose inside biographies. Biographies can narrate relationships, but
they should not be the only source of truth for them.

`SaintRelationship` should support both typed and untyped connections:

- A typed relationship identifies a known relationship category, such as guru, disciple, initiator, lineage successor, family relation, influence, contemporary, patron, debate opponent, or association.
- An untyped relationship records that two saints are known or believed to be connected, while leaving the exact relationship category uncategorized until an editor can review it.

Relationship records carry or are now structured to carry:

- source saint and target saint
- relationship type, including guru, disciple, partner, incarnation, family,
  influence, initiator, patron, successor, debate opponent, association,
  lineage, related, and untyped relationships.
- directionality through the source and target saint fields.
- certainty or evidence status, such as certain, probable, traditional, disputed, imported, or uncategorized
- editorial display rank or weight, for prioritizing which relationships appear first on saint biographies and other public pages
- public description, when appropriate
- internal editorial notes
- citations and source records through `sourceId`, `SaintRelationshipSource`,
  `externalRecordId`, and `importJobId`.
- draft, review, and published status
- public/private visibility controls

Display rank should be treated as an editorial presentation field, not as evidence strength. A relationship may be highly important to show on a biography page even when its evidence status is traditional or disputed, and a well-attested relationship may still be low-priority for public display.

Individual biography stories or events should eventually be linkable to saints and to `SaintRelationship` records. This allows a story to serve as narrative context or evidence for a connection without making the story itself the canonical relationship record.

Public tradition and grouping pages may render curated tree, lineage, timeline, or network views from this graph. The underlying data should allow graph-shaped relationships even when a public page presents a simplified tree.

Imported Airtable, Instagram, CSV, and manual-ingest values may create candidate relationship records or reconciliation issues, but they must not silently overwrite reviewed CMS relationship data.

## Family graph

Family IDs from Airtable are review/export labels, not website truth. The
`SaintFamily` and `SaintFamilyMember` models support computed or curated saint
families from reviewed `SaintRelationship` edges such as guru-disciple,
partner, incarnation, and explicit family relationships.

- family slug, display name, description, graph version, status, and visibility.
- saint membership with role, tier, sort order, notes, and provenance.
- public tree rendering from reviewed relationship edges instead of committed
  SVG/HTML export artifacts.

Duplicate candidates and loose association-only links should not automatically
join family components unless editors explicitly approve that behavior.

## Duplicate review

Potential duplicate matches are reconciliation data, not saint relationships.
They should create `DuplicateCandidate` rows, optionally linked to
`ReconciliationIssue`, with evidence, confidence, review status, and resolution
notes.

Public pages should never expose duplicate-review candidates.

## Museum sections

Museum sections should be modeled as private editorial taxonomy. A future
`MuseumSection` plus `SaintMuseumSection` assignment model stores primary and
alternative placements, tier, confidence, rationale, and internal placement
notes. Visibility defaults to private.

Do not expose relic, vitrine, shelf, storage, or other collection-management
fields through public contracts.
