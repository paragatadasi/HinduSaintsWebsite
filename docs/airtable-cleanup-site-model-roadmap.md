# Airtable cleanup site model roadmap

This document records the site-model decisions from the July 2026 Airtable
cleanup workflow. Airtable remains an import and review source only. The website
database remains the source of truth for public pages and editorial state.

## Completed in this workflow

- Reviewed the new Airtable cleanup fields and exports for normalized places,
  spiritual regions, saint relationships, family graphs, duplicate candidates,
  and museum-section planning.
- Replaced the flat place assumption with first-class place graph
  infrastructure:
  - `Place.placeKind` identifies countries, states, cities, sacred sites,
    ashrams, monasteries, route areas, and spiritual regions.
  - `PlaceRelationship` stores typed edges such as `contained_in`, `part_of`,
    `near`, and `associated_region`.
  - The admin place workflow now keeps reviewed parent-state relationships in
    sync with place records.
  - The public map can derive broader state and region context from the place
    graph while still falling back gracefully for legacy place rows.
- Documented place behavior in `docs/data-model.md` and
  `docs/map-and-places.md`.
- Kept generated Airtable and family-tree export artifacts local. The
  `exports/` directory is ignored and should remain a working folder, not a
  source-controlled contract.
- Preserved the broader Airtable cleanup history in
  `docs/airtable-saints-cleanup-workstream.md`, including the latest family
  graph, duplicate review fields, maintenance scripts, and import cautions.
- Added the website data infrastructure for the next Airtable import phase:
  richer `SaintRelationship` review/provenance fields, relationship source
  evidence rows, `SaintFamily` and `SaintFamilyMember`, `DuplicateCandidate`,
  private `MuseumSection` and `SaintMuseumSection`, and broader
  `AirtableImportJob` counters.
- Added `npm run reset:airtable-cms`, a dry-run-first reset command for clean
  Airtable reingests when there are no CMS edits to preserve.
- Added `/admin/airtable`, a protected web workflow for mirror refresh,
  Airtable-derived CMS reset, and import job queueing. Write actions require the
  same bulk delete password used by bulk delete actions.

## Modeling principle

Do not copy Airtable helper fields directly into the website as permanent
domain concepts. Airtable fields are useful review surfaces, but the website
should model durable concepts:

- places as a graph of typed places.
- saints as a graph of typed relationships.
- families as computed or curated views over saint relationships.
- duplicates as reconciliation candidates, not public saint relationships.
- museum sections as private editorial taxonomy, not public relic/museum data.
- spiritual regions as place nodes and place relationships, not saint scalar
  fields.

This keeps future public pages flexible: a map, lineage page, family tree,
museum planning board, and reconciliation queue can all read the same reviewed
model without reparsing Airtable-specific columns.

## Implemented site infrastructure

### Saint relationships

`SaintRelationship` should become the canonical saint-to-saint graph. It should
cover guru-disciple links, partners, incarnation associations, family
relationships, influences, contemporaries, initiators, patrons, lineage
successors, and uncategorized imported connections.

Implemented representation:

- Keep directed endpoints: `fromSaintId` and `toSaintId`.
- Expand `RelationshipType` with `partner`, `incarnation`, `family`,
  `influence`, `initiator`, `patron`, `successor`, `debate_opponent`, and
  `untyped`.
- Add lifecycle and visibility fields: `status`, `publicVisible`,
  `displayOrder`, and optional `publicNote`.
- Add evidence fields: `RelationshipEvidenceStatus`, `confidence`, `notes`,
  and `internalNotes`.
- Support multiple sources per relationship through `SaintRelationshipSource`
  while preserving the existing single `sourceId` compatibility field.
- Preserve import provenance with `externalRecordId` and `importJobId`.

The current Airtable guru importer stores `fromSaintId` as the disciple,
`toSaintId` as the guru, and `relationshipType = guru`. New import logic should
preserve that existing meaning unless a deliberate migration changes all
callers. Symmetric kinds such as partner should be deduplicated by canonical
pair logic in application code.

### Families and tree views

Airtable `Family ID` is useful as a review/export label, but it should not be
the website source of truth. Website families should be derived from reviewed
relationships and optionally materialized for performance and editorial
curation.

Implemented representation:

- `SaintFamily`: a computed or curated family/component with slug, display
  name, description, graph version, status, and visibility.
- `SaintFamilyMember`: links saints to a family with role, sort order, tier,
  notes, and optional source/provenance.
- Family trees should render from `SaintRelationship` edges. Stored SVG/HTML
  exports should remain local review artifacts until the site has a reviewed
  public renderer.
- Recompute families from reviewed relationship types such as guru-disciple,
  partner, incarnation, and explicit family relation. Do not include duplicate
  candidates or loose association-only links unless editors opt in.

This lets the same graph support lineage pages, family trees, museum grouping,
and relationship chips without maintaining separate truth in each feature.

### Duplicate candidates

Airtable `Potential duplicate match` should feed reconciliation, not public
content.

Implemented representation:

- `DuplicateCandidate` stores pairwise candidate details, scored evidence,
  merge-review status, and optional links back to `ReconciliationIssue`.
- Candidate rows store entity type, primary entity, candidate entity, source,
  confidence, evidence JSON, status, reviewer, and resolution notes.
- Never model duplicates as `SaintRelationship`, because duplicate review is a
  data hygiene workflow rather than a historical or devotional relationship.

### Museum sections

Museum-section planning should become a private editorial taxonomy. It may
later support public curated collections, but only through explicit visibility
controls.

Implemented representation:

- `MuseumSection`: slug, name, description, sort order, status, and
  `publicVisible` defaulting to false.
- `SaintMuseumSection`: saint, section, assignment type
  (`primary`/`alternative`), tier, confidence, rationale, internal placement
  note, source/provenance, and review status.
- Suggestions can be generated from saint families, traditions, and the place
  graph, but editors should approve assignments before any public use.
- Do not expose relic, vitrine, shelf, storage, or collection-management fields
  through public contracts.

### Spiritual regions

The Airtable `Spiritual Region` helper should map into the place graph:

- create spiritual-region `Place` records with `placeKind = spiritual_region`.
- link concrete places to them with `associated_region` or `part_of`.
- link saints to the most specific reviewed place known.
- derive broad spiritual-region context through the place graph.

Only attach a saint directly to a spiritual-region place when the region itself
is the best available reviewed location.

### Traditions and sampradaya

Sampradaya and tradition values should continue to land in `Tradition` and
`SaintTradition`, with aliases and provenance for imported labels.

Recommended additions:

- preserve imported tradition labels as aliases or source values.
- keep curated `TraditionLineageSaint` separate from general saint
  relationships.
- use `SaintRelationship` for actual person-to-person links and
  `TraditionLineageSaint` for editorial tradition-page presentation.

### Import and reconciliation jobs

The Airtable import job model now has counters for work beyond missing saints
and guru links.

Supported future job categories:

- normalized place graph import, now available through
  `npm run import:airtable-cleanup`.
- saint relationship candidate import, now available through
  `npm run import:airtable-cleanup`.
- family graph preview/recompute. Airtable `Family ID` review rows now import
  into `SaintFamily` and `SaintFamilyMember`; a later pass should recompute
  reviewed families from approved relationships.
- duplicate candidate import, now available through
  `npm run import:airtable-cleanup`.
- museum-section suggestion import, now available through
  `npm run import:airtable-cleanup`.

Each job should have dry-run counts for created, skipped, conflicted, and
unresolved records. Write jobs should create draft/candidate records or
reconciliation issues; they should not overwrite reviewed CMS edits.

## Public contract guardrails

- Public pages must read only published saints and explicitly public-safe
  fields.
- Relationship, family, and museum-section data should remain private until
  reviewed and marked visible.
- Museum, relic, vitrine, shelf, storage, raw payload, and reconciliation data
  must stay out of public adapters.
- Missing graph data must degrade gracefully: show known published biography,
  places, traditions, and images without requiring every saint to have a family
  or relationship record.
