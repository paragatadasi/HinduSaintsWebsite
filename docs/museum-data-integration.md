# Museum data integration

Existing section proposals are available directly for each unambiguously linked
canonical saint. There is no preparation step. Section pages retain all proposals,
including unresolved records, and link matched records directly to their review.
Curators can confirm a proposal or edit it before confirming. The original source
snapshot and the decision are saved atomically; simply browsing writes nothing.
Confirmed placements remain separate from source proposals and are never silently
overwritten. The working section browser uses canonical saint details and confirmed placements, falling back to existing proposals until confirmation. The original export remains a separate comparison view.
Airtable remains an import/reference source. Museum `published` assignments mean
accepted curatorial decisions, never public website content.

## Data and review

- `SaintMuseumSection` stores section, alternatives, tier, confidence, rationale,
  notes, and source provenance. One accepted primary per saint is enforced by a
  PostgreSQL partial unique index. Unreviewed legacy conflicts stay in the queue.
- `MuseumExhibitGroup` stores private curatorial groups and optional anchor saints,
  independently of historical `SaintFamily` membership and saint relationships.
- `MuseumSaintState.version` protects the entire placement set from stale saves.
  Mutations lock the saint and write assignments plus audit events atomically.
- `MuseumImportProposal` preserves museum-only source snapshots and their decision
  history. Repeated imports are idempotent; a source reversion creates a new event.
  Changes never overwrite accepted placements automatically. Conflicts create
  `ReconciliationIssue` records without copying private museum fields into the
  general reconciliation message. Museum review resolves the corresponding issue.
- A cleared source placement is a review signal, not an instruction to erase data.
- Saint merges preserve original assignment snapshots in audit history, transfer
  Airtable source links and anchor references, invalidate stale forms, and flag
  affected placements for curator review.

## Rollout

1. Apply `20260930090000_museum_integration` in the normal deployment migration
   phase. The web build does not access a database or run migrations. Existing
   accepted-primary conflicts are snapshotted in audit history and changed to
   `needs_review`; no saint, assignment, or source records are deleted.
2. Run `npm run museum:audit` against the intended database. It is read-only and
   reports source candidates, unresolved export IDs, missing primary placements,
   and competing primary assignments. Do not substitute fixture coverage for a
   production audit.
3. Open a section proposal or /museumadmin/review. Existing proposals are
   immediately reviewable; confirm or edit and confirm a saint's proposal.
4. Resolve ambiguous identities through the existing Airtable import and saint
   reconciliation workflows. Once a link is unambiguous, its proposal becomes
   available automatically on the next visit.
5. The review and reconciliation screen also projects latest Airtable mirror
   values as suggested updates automatically. Differences are listed beside the
   confirmed site placement. Keep the site value, accept the source, or edit and
   confirm a resolution. Recheck source content before saving so stale updates
   cannot replace newer values. No museum-specific preparation button is required.

The existing Airtable cleanup job now stages museum proposals instead of directly
creating assignments. Its historical `museumSectionAssignmentsCreated` and
`museumSectionAssignmentsExisting` summary keys remain compatible; new UI copy
calls these museum proposals.

The checked-in proposal export contains 1,399 distinct record IDs across 23
sections. These are source rows, not a current production coverage
claim. All existing proposal rows remain accessible in the original comparison, including
unmapped records. Missing or competing database placements remain discoverable
in the review queue. Source-candidate counts describe eligible source records,
not confirmed placements. Static family trees are labeled historical references on saint
review pages and do not purport to show the current relationship graph.

## Source links and permissions

Museum reads require `access_museum`; saves and proposal staging/review require
`manage_museum`. Curators receive only selected museum/source context here,
without general Source Data access. All pages remain authenticated and noindexed.
No museum model or raw source payload is added to a public page contract.

Airtable mirror refresh attempts the optional base-schema metadata read and stores
its table ID in the preserved payload. This enables valid base/table/record links.
Tokens without schema-read access continue to import records; older mirrors show
an honest base link and record ID until metadata is available. No new environment
variables are required. Reference: https://support.airtable.com/articles/4688931572-finding-airtable-ids

## Verification

- `npm run dev:check`
- `npm test`
- `npm run codex:verify` (required for this migration/route change)
- Apply all migrations to a disposable local database named
  `museum_integration_test`, set `MUSEUM_TEST_DATABASE_URL`, and run
  `npm run test:museum:integration`. The script refuses nonlocal hosts or another
  database name. It creates fixtures; use a fresh disposable database for each run.

The integration suite exercises persisted placements and anchors, optimistic
conflicts, repeat imports and source reversions, retained human edits, proposal
acceptance, rollback, section moves, primary uniqueness, cleared source values,
legacy identity mapping, and a full saint merge. A PGlite socket server can run
these scenarios when Docker is unavailable; it does not replace a production
coverage audit or a real PostgreSQL concurrent-session stress test.

Browser verification also covers save/reload, retaining form input after a stale
save, accepting a source proposal, mobile overflow, review search, authentication,
role restrictions, noindex, and exclusion of private museum notes from public
saint HTML. Two shared layout fixes discovered during these checks correct invalid
footer nesting (which interrupted hydration) and contain the header search label
within its scrolling mobile navigation.

## Current cards and mirror coverage

The working browser, sidebar counts, and search use one authenticated,
request-cached database projection. Current names, aliases, dates, traditions,
places, spiritual regions, family memberships and relationships come from the
canonical records. A canonical blank remains blank; it is not filled with an
older export value. Relationships display their evidence/review state. Museum
display groups remain separate from canonical family memberships.

Confirmed placements control section and tier. Without a confirmed placement,
the existing proposal remains visible. Unlinked or ambiguous source identities
retain their export details with an explicit label. Identical proposals for
merged saint identities are deduplicated; differing proposals remain labeled for
review. Moving the last saint out never removes a section. Every original section
has an Original proposal comparison, including the original reference tree images.
No read causes an import or confirmation.

Visit /admin/airtable/mirror-audit with view_source_data permission for a read-only
field inventory: configured tables/view, import dates, per-field populated/missing
counts, value shapes, and possible collection fields. It returns no raw record
values. The equivalent command is:

    npx tsx scripts/audit-museum-mirror.ts

Run the command with an approved read-only database connection. It uses a
read-only transaction and does not call Airtable. The mirror importer preserves
every returned field, but only reads configured tables and an optional view.
Old rows remain when later imports omit them. Therefore observed field coverage
is not proof of a complete or current Airtable base. Linked record IDs do not
include the referenced table contents unless that table was imported too.

No vitrine/collection model or additional import is introduced by the card work.
Use the production coverage report to determine whether collection data already
exists and whether a saint can have multiple items/locations before defining
that model. Broader collection-field reconciliation depends on that field map;
existing placement reconciliation remains in the museum review workflow.

## Family proposal moves

The coordinated family-move feature requires
20261001150000_museum_family_proposal_moves in the deployment migration phase.
It adds a private, versioned destination override keyed by the original
curatorial-family key (or original family ID). It changes proposals for every
original member, including unlinked members and members proposed in other
sections. Confirmed assignments change only after individual review.

Move family is available on original-family cards and their saint detail dialogs
to users with manage_museum. Original comparison values never change; its move
controls act on the working proposals. Confirmed exhibit-group keys do not expose
a bulk source-family move. The shared working view applies overrides before
canonical saint details and confirmed placements. Concurrent or stale moves are
rejected, and decisions remain in audit history.

No environment-variable changes are required. Deploy the migration, move service,
and working-view adapter together. Browser checks cover submission, destination
redirect, reload, source-section removal, original comparison, preserved confirmed
placement, canonical search, mobile containment, mirror-audit permissions, and
absence of raw mirror values in audit HTML.

## Multi-museum collection foundation

The collection model separates canonical saints, individual physical items,
collection catalogues, and physical locations. The migration registers SPN
(Shree Peetha Nilaya, near Frankfurt) and Vrindavan; it creates no relics or
vitrine assignments. The existing source is SPN. Vrindavan currently has Excel
files that have not yet been inspected or imported.

Inventory codes are unique within a catalogue museum; location codes are unique
within a museum. Codes are strings so leading zeroes survive. One saint can link
to multiple items in multiple museums, and one item can link to multiple saints.
An item has at most one current physical placement. Closing a placement and
opening another preserves location history, including transfers between museums.
The catalogue museum scopes inventory identity; it does not assert legal ownership
and need not equal the current physical museum. Unknown location remains null.

The protected working proposal data now includes `collectionItems` per canonical
saint: item ID, label, inventory code, review status, catalogue museum, and current
location (museum, code, label, kind, room). It is an array, never a single vitrine
field on Saint. Archived items/locations are excluded from the applicable view;
saint merges preserve and deduplicate item links. This payload is private to the
museum workflow. No public saint query includes collection data. Original proposal
snapshots remain unchanged. Existing curatorial sections/family moves have not
been converted into museum-specific proposal catalogues.

`stageCollectionObservation` is an ingestion service, not a live Airtable read.
It preserves raw and normalized source values with a mapping version and stable
museum/source identity. Consecutive identical observations are idempotent;
a later source reversion remains a new observation. Pending observations never
create inventory or overwrite reviewed items/placements. This foundation does
not yet implement an approval/reconciliation screen or a source-specific adapter.

Before activating SPN imports, inspect the production mirror audit and identify
the actual item identity, saint links, location fields and linked tables. A saint
row with a vitrine number alone must not be treated as proof of a distinct relic.
Before importing Vrindavan, inspect its Excel sheets and establish stable item
identifiers. Excel can feed the same staging contract directly. Airtable is
optional editorial/import tooling; PostgreSQL remains authoritative. Do not
invent field mappings or turn curatorial sections into physical locations.

Deploy `20261001170000_museum_collections` in the migration phase before this
reader code. It is additive, with museum seeds, foreign keys, a placement-period
check and a partial unique index enforcing one current placement per item.
No environment changes are required. The card UI can consume the contract once
reviewed inventory exists; this phase does not populate live cards or import the
SPN/Vrindavan records. No production migration or import has been run.

Verification: `npm run dev:check`, `npm test`, `npm run codex:verify`, plus
`npx tsx scripts/verify-museum-collections.ts` against a fresh disposable local
PostgreSQL-compatible database using `MUSEUM_TEST_DATABASE_URL` (database name
`museum_integration_test`). The integration fixture tests museum-scoped codes,
current-location uniqueness, transfer history, private working-card projection,
source idempotence/reversions, saint merges and archival. Never run that fixture
against production or a database containing useful data.
