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


### SPN source vitrine display (curator pilot)

Working saint proposal cards show `SPN vitrine (source record)` from the website
PostgreSQL Airtable mirror. This is a read-only source observation, not an
approved relic placement. No Airtable request, CSV upload, new saint, merge,
collection import, or migration is required to display existing mirrored values.

The SPN Website base binding is explicit in `lib/museum-vitrine-source.ts`.
Only exact base/table/record ExternalRecord links to active saints are eligible.
All linked SPN rows must exist and agree on one valid vitrine and shelf; blank
vitrines, malformed values, missing mirror rows, and conflicting locations are
omitted. An absent shelf is allowed only when all source rows agree it is absent.
Other museum bases cannot supply SPN locations. Original proposal comparisons
and unlinked proposals are not annotated. No public saint route uses this data.

The value changes when the existing mirror is refreshed. It does not update
live from Airtable, and any source change newer than the mirror remains pending.
Multiple locations and individual relic placement remain a later review phase.


## Museum update jobs and uncertain matches

The next workflow lives in **Admin > Source Data > Museum updates** at
`/admin/source-data/museum`. The museum placement review screen links to it only
for Source Data users. It uses the shared admin review components, not a separate
museum import interface. Source Data access does not grant public publication.

`view_source_data` controls page/status access. Starting an update also requires
`run_imports` and the existing sensitive-action password. Decisions require
`resolve_reconciliation`. Curator-only accounts are not granted general source
access by this change. Linking an unlinked source to an active saint preserves
all existing content. Already-linked sources cannot be reassigned here; use the
existing domain merge workflow. Matching an existing saint does not require a decision note; optional context is retained. Defer and reopen require a decision note.

The server reads the configured **Website** Airtable base, explicitly restricted
to the known SPN base, and fetches full Saints and Relics tables without a view.
It never uses the separate current-museum token. The deployment must already
supply AIRTABLE_BASE_ID and AIRTABLE_ACCESS_TOKEN (or AIRTABLE_PAT). A nonempty
AIRTABLE_VIEW blocks this full-base workflow. PUBLIC_SITE_URL or NEXTAUTH_URL
must describe the real application origin for the same-origin request check.
No new environment variables are required.

A recorded job runs after the start response. A database advisory lock serializes
job creation; a conditional claim and expiring lease prevent duplicate execution.
Progress and safe summaries are polled without exposing raw job snapshots. If the
process is lost, the expired run can be retried explicitly after twenty minutes;
this is not an external worker queue or automatic restart scheduler.

Both source tables must finish fetching before a single serializable transaction
updates the mirror, raw ExternalRecord payloads, review entries, import batch,
private before/after source snapshot and completion audit. Canonical entity links
are preserved. A changed mirror during the fetch aborts application. Empty tables,
missing previously mirrored rows, malformed pagination and source errors fail
without applying any mirror changes. Removed source records require a separate
completeness/deletion review; they are not silently deleted.

Clear linked source locations refresh through the existing read-only card
projection. Unlinked identities, missing vitrines and conflicting locations enter
one source-keyed review queue. Repeated identical evidence preserves deferrals;
changed evidence reopens the existing entry and preserves the previous decision
in audit history. Newly linked sources are checked again on the next update for
location conflicts. Linking a source does not approve an item placement.

This increment does not create saints or inventory, merge saints, alter accepted
placements, automatically accept ambiguous locations, publish content, or ingest
Vrindavan. Scoped draft creation and relic-level acceptance remain later phases.
The full source snapshot stays server-side; no raw payload is returned by the
status endpoint or public routes.

Apply migration `20261002120000_museum_update_jobs` in the release migration
phase. It adds MuseumUpdateJob and MuseumSourceReview only. Verification includes
`npm run dev:check`, `npm test`, `npm run codex:verify`, and
`node --import tsx scripts/verify-museum-updates.ts` with a fresh disposable local
MUSEUM_TEST_DATABASE_URL whose database name is museum_integration_test. The
fixture replaces Airtable network reads; never run it on useful data. PGlite
exercises persistence/rollback but does not certify real PostgreSQL concurrent
session behavior. Production data volume and authenticated visual checks remain
release smoke-test responsibilities.

## Direct relic baseline and later discrepancies

The user chose to trust the current museum records as the initial state, rather
than approve every existing relic as a proposal. New saint creation is deferred;
the existing Airtable missing-draft importer remains the future maintenance path.

Admin > Source Data > Museum updates > Relics provides **Connect relics from
current mirror**. Refresh the mirror first. The action is scoped to the Website
SPN base and actual Relics rows; it does not split saint descriptions into objects.
Each source relic uses only its explicitly linked Saints source rows. Existing
canonical saint links must resolve for all linked rows. Agreeing valid vitrine /
shelf evidence supplies the initial item location; conflicting or missing values
produce an item with unknown location and a review entry. Missing saint identities
or item names remain unconnected. New saints are never created.

Baseline items, saint associations and locations are applied directly, with
source identity and audit provenance. Repeating the same evidence is a no-op.
Changed evidence creates a new immutable observation bound to the same item;
it does not overwrite the accepted item or placement. Reviewers can keep the
website state, confirm corrected item/location values, defer, or reopen. Notes
and prior decisions remain audited. A location correction closes the former
placement and creates a new one; it does not rewrite history. Existing saint
associations are retained when accepting additional source associations. Removing
associations or reassigning an established source-item identity is intentionally
outside this workflow. Attachment URL rotation does not create false differences;
full raw payloads remain in the private mirror, with relevant identity/location
evidence retained in each collection observation.

Reading requires view_source_data; baseline import also requires run_imports and
manage_museum, and decisions require manage_museum. A curator needs Source Data
access as well, or a Data Admin needs the curator capability, for these combined
operations. Site Admin already has all required capabilities. Transactions use a
shared advisory lock, stale evidence/item checks and serializable isolation.
There are no schema or environment changes in this checkpoint.

Private proposal cards now show connected item locations, including multiple
vitrines for one saint. The temporary saint-wide source vitrine is hidden once
collection items exist. No public reader receives collection data.

This checkpoint does not schedule imports, create saints, delete removed source
records, or implement proposed future vitrine moves. Future moves belong in a
separate curator planning workflow. The existing mirror updater stops on source
removals for completeness review. Vrindavan remains deferred until SPN acceptance.
The first live baseline and curator sample check remain manual release smoke
steps; no production data has been imported by feature verification.

Verification: development check, 232 passing unit tests (one guarded database
skip), full production build, disposable PostgreSQL-compatible transaction tests
for baseline/replay, two locations per saint, unresolved links, keep decisions,
stale source rejection and movement history. A 1,304-row fixture including 1,300
new baseline items and repeat import passed. Authenticated local page checks cover
Site Admin, Data Admin, curator and anonymous access. PGlite does not certify real
PostgreSQL concurrent-session behavior; that remains an integration limitation.

## Planned vitrine moves

Museum Admin > Relics and planned moves is separate from Source Data imports.
Curators can browse SPN items and their current locations, propose a new vitrine
and shelf, cancel a plan, or explicitly confirm that the physical move happened.
Creating a plan does not alter inventory placement. Completion closes the former
placement, opens the new placement, increments the item version and records the
actor and note. Plans and location history remain available on the item page.

There is at most one open plan per item. Both the recorded item version and its
original location must still match at completion. A source correction or another
item edit invalidates the old plan; the curator cancels and replans. Archived
items/locations and moves outside SPN are rejected. This is deliberately not a
Vrindavan transfer workflow. A curator can both propose and confirm a move; no
separate two-person approval policy has been introduced.

Pages require access_museum; server mutations require manage_museum. The shared
museum layout remains authenticated and noindexed. Source Data remains the home
for import/update operations. Relic links in the private saint modal lead to the
move workflow. Completed moves survive an unchanged source replay; subsequent
source differences still require the existing reconciliation decision.

Migration 20261002160000_museum_item_move_plans adds a plan table with item and
location foreign keys and a partial unique index for one planned move per item.
Run it in the release phase before serving the new routes. No environment changes
or production data backfill are required. Rollback can retain plans and audit
history; do not delete completed placement history.

Verification includes development type generation/check, the full production
build, 232 unit tests (one guarded skip), and disposable transaction tests for
plan/cancel/complete, required physical confirmation, repeated submission, stale
item versions, archived destinations, museum scope, movement history and source
replay after a curator move. Live physical placement verification remains a
curator task. New saints and Vrindavan are deferred by user direction.

## Vrindavan website identity review checkpoint

Vrindavan source rows now match directly to canonical website Saint IDs using
current display names, canonical names, and aliases. SPN Airtable record IDs are
not matching targets. Active draft saints may be linked without publication;
archived saints are excluded. Exact names and names with a location suffix can
be clear suggestions only when the broader title/alias comparison identifies
one website record. Multiple candidates, including newly imported duplicate
drafts, are held for individual review. Title-only guesses are never bulk linked.

Source Data > Museum updates > Vrindavan saint matching accepts a private,
prepared JSON snapshot of the original workbook (maximum 1 MB). The snapshot
contract is version 1, museum vrindavan, sourceName, original-file sha256, and
sheets containing name plus rows with original row numbers and typed cell arrays.
Supported sheets are Sheet1 and DuplicatesMagenta. Both sheets and original
headers, section markers, comments, quantities and display labels are preserved.
No source dataset is committed to the public repository.

The original workbook yields 449 review rows: 447 named inventory entries plus
two unidentified entries. It contains 437 distinct named labels, which are not
necessarily 437 unique saints. Section markers and narrative headings are not
inventory. Secondary-sheet differences remain evidence rather than a second
inventory or an automatic correction.

Uploading creates an immutable ExternalRecord snapshot and private
MuseumCollectionImport observations. Identical replay preserves every reviewed
identity decision. Source keys include the original file hash, sheet and row;
they identify observations within that snapshot, not permanent physical relics.
A different file is a separate snapshot and requires cross-snapshot reconciliation
before physical inventory import. Do not use row numbers or name-plus-vitrine as
permanent object IDs. MuseumCollectionImport normalized data has mappingVersion
vrindavan-identity-v1 and is intentionally separate from SPN relic observations.

The review screen reads current website identities on every request. It supports
snapshot, review-status, confidence and text filters. Clear matches can be
explicitly selected and confirmed in batches of at most 500 source rows.
Uncertain rows support a searchable canonical saint picker, multiple identities
for combined source rows, optional link notes, and deferral with a required note.
Confirmed identity links are preserved and read-only at this checkpoint.

Preview tokens include canonical identity/alias state and observation decisions.
Every batch is rechecked server-side in a serializable transaction; changed
identities, newly archived targets, duplicate candidates and stale decisions
reject the full batch. Upload requires Source Data, full catalogue and import
capabilities; decisions require Source Data, full catalogue and reconciliation.
The main, detail and batch routes are protected, and raw evidence stays private.

This checkpoint creates no saints, MuseumCollectionItem records, locations or
placements. It does not publish drafts, modify saint-place associations, change
SPN imports, merge people, split compound descriptions into invented objects, or
write Airtable. Before the next checkpoint, review movement/photo discrepancies,
identify individual physical objects, assign stable inventory identities, and
recheck matches against production after the summer-import duplicate cleanup.
Saint merges or archival after a decision can invalidate a saved source link;
these are displayed as unavailable targets and must be reconciled before item
creation. No confirmed decision is silently rewritten.

Verification: npm run dev:check, npm test, npm run codex:verify; focused pure
matching tests; scripts/verify-vrindavan-identity-review.ts against a disposable
local museum_integration_test database, optionally with VRINDAVAN_TEST_BUNDLE
pointing to the private prepared JSON. No schema, migration, dependency or
environment-variable changes. Production snapshot upload is a separate admin
action after deployment, not part of the release or build.

## Vrindavan confirmed inventory pilot data contract

The data-only pilot reader is readVrindavanMuseumInventory in
lib/vrindavan-museum-inventory.ts. Server callers must enforce access_museum;
this private museum/relic information must never enter public saint contracts.
It reads existing identity_linked Vrindavan workbook observations immediately:
no second upload, copy, import button, backfill or production mutation is needed.
The UX workstream owns the separate Vrindavan shell, navigation and pilot screens.

The reader returns museum, snapshotHash, snapshots, entries, saints,
entriesBySaintId, displays and counts. Default selection is the newest workbook
snapshot, including when it has no reviewed identities; it does not silently
fall back to old data or double-count snapshots. An explicit snapshotHash selects
an older snapshot. Unknown hashes fail rather than displaying another inventory.
Only confirmed identity rows appear as inventory entries; the uncertain set is
left untouched. Counts describe source entries, not unique saints or objects.

MuseumSourceInventoryEntry (lib/museum-source-inventory-domain.ts) exposes:
- observationId, sourceKey, snapshotHash, sourceName, sourceRow, museum;
- active saintIds and unavailableSaintIds, sourceSaintName, identityConfirmedAt;
- relicDescription, quantityText, packagingText, sourcePlaceText;
- displayText, positionText, comments, warnings;
- physicalItemId, sourceLocation (nullable).

Source location has museumId/name/slug, code, label, kind, room, displayText,
positionText and evidence=source_reported. This shares museum/location field
names with the collection-card contract but deliberately has no physical
MuseumLocation ID. Code encodes the display/position components; e.g. 17/3.4.
Quantity and position remain strings: ranges, compound amounts and decimal-like
shelf labels must not be coerced into object counts or numeric coordinates.
Position without a display produces no location and retains a warning. Source
place text never modifies the saint's primary place or visit destination.

Each entry represents one original workbook row, which can describe several
physical objects. observationId is not a MuseumCollectionItem ID. Current pilot
physicalItemId values are null; no physical item/placement records are fabricated
and no move controls should be attached to observation IDs. Unavailable or
archived saint targets remain visible as evidence/warnings but are excluded from
active saint associations. Existing reviewed links are not rewritten.

The UX can show these entries now grouped by saint or display, including the
reported vitrine, shelf/position, quantity, packaging, source place and comments.
Label locations as source-reported; identity confirmation does not verify a
physical move or resolve contradictory movement evidence. Source-only entries
must stay separate from implemented object-level placements and SPN inventory.

Verification: ten focused domain/reader tests cover field preservation, museum
scope, identity gating, missing targets, unknown locations, source key/row
consistency, location-code collisions, snapshot isolation, draft retention and
pending-snapshot behavior; npm run dev:check and prepare:deployment passed.
This checkpoint changes no schema, environment, dependency, public route or UI.
Next: UX pilot over this reader, then museum-scoped section proposals for linked
saints. Object identities/splits and physical placement verification remain a
separate inventory checkpoint; the 171 uncertain identity rows remain deferred.
Latest-per-sourceKey observations supersede earlier decisions before projection and counts. A MuseumInventoryUnavailableError distinguishes an unavailable museum from general database failures for the protected UX.


## Curator UX rollout: shared SPN and Vrindavan shell

The curator pilot uses direct SPN/Vrindavan main-admin subtabs and a shared
protected `MuseumWorkspace` shell. `/vrindavanadmin` consumes only the scoped
Vrindavan source-inventory reader. It offers saint/relic/place search, exact
textual display/position filters, pagination and biography-first inventory
cards. Source quantity, packaging, comments and original place remain visible;
provenance is expandable. No physical placements or section assignments are
created by browsing. SPN keeps its section workflow and gains a separate
vitrine/shelf browser with distinct current, planned and source-only locations.

The broader revamp remains phased. Display-group removal/restoration and
historical relationship correction are separate next workflows. Proposed,
optional Planned, and Implemented will replace the separate curator confirmation
step. The user approved recording physical implementation even with incomplete
relic inventory, provided the inventory gap is explicit and the curator's
confirmation is recorded. Such confirmation must not fabricate item records or
item-level placements. Changing the latest proposal must invalidate its prior
implementation status. Interactive spatial planning remains a later dedicated
design phase after these basic workflows are piloted.


### Display membership and relationship corrections

SPN saint dialogs expose separate, expandable display-membership and historical
relationship workflows. Removing a member preserves its current section, item
links, physical location/history, and historical relationships. Source-family
removals are stored as private `MuseumDisplayMembership` overrides; subsequent
family proposal moves exclude detached members and stale move/membership forms
are rejected. A changed source export cannot silently reattach a removed saint.
Restoration follows the family's latest proposal; if the source family itself
changed, restoration requires proposal review. Original CSV/SVG evidence remains
available in the original comparison. Edited working groups do not display an
outdated exported tree as if it represented current display membership.

Canonical exhibit-group removal updates only the primary placement's group,
uses the existing saint version lock, and clears a removed anchor. Restoration
can restore the original anchor if another anchor has not replaced it. Neither
operation changes museum sections or relic placements. Both operations are
audited. The additive membership migration runs in the release migration phase.

Curators can request historical relationship corrections in a separate form;
requests enter the existing reconciliation queue and are audited. Duplicate
open requests with identical text are reused. Users with structured editorial
capability also get a link to the existing relationship editor. Curator access
does not grant public-content editing rights.

## Apply the October 3 reviewed corrections

The one-time applyReviewedMuseumCorrections operation is explicit and audited;
no build, render or routine source refresh invokes it. Protected Source Data
page /admin/source-data/museum/reviewed-corrections applies the approved batch
with one button, requiring reconciliation, structured editing and full-catalogue
capabilities. Canonical IDs and slugs must match the three reviewed saints;
missing/archived/mismatched identities or ambiguous localities abort the entire
transaction. It is not a bulk name-based correction.

Madhu Pandit's website primary place becomes Vrindavan with Vamshi Vat associated;
old Jaipur association is retained with deity-context notes. Haridas and Somappar
website places are unchanged. No coordinates, accepted visit destinations,
saint publication, historical families or physical placements are invented.
Manual-review ExternalRecords preserve all three decisions and a batch marker;
repeat application is a no-op preserving later human edits. Audit records retain
Madhu's before/after places and direct user-decision provenance.

Reviewed Gaudiya overrides are consumed by SPN editable proposal projection and
therefore inherited by the Vrindavan proposal reader. They preserve tier and
actual inventory and do not overwrite confirmed museum assignments. Somappar's
Mayapur source error is recorded as sourcePlaceError evidence, not erased from
the workbook or promoted to website geography. Future review UX should expose
that decision beside the raw source place.

Current authenticated public-profile shortlist export is
/admin/source-data/museum/vrindavan/qr-shortlist. It selects published canonical
saints from the current confirmed Vrindavan inventory only, groups their linked
entries by saint, and includes real biography URLs. This private JSON is the
input to the requested Excel QR selection workbook; never approximate the live
278 confirmations with the older local website baseline. No museum metadata is
exposed publicly by this export.

Verification: three pure override tests, disposable-database correction regression
(primary locality, retained deity context, untouched other places, no inventory or
confirmed assignments, idempotent replay preserving later edits), dev:check and
codex:verify. No schema, migration, environment or dependency changes. Production
application and an exact production shortlist still require authenticated execution/export. The workspace 84-saint Excel was subsequently delivered at the user's request. No production write is implied by feature deployment.

## Consolidated status and remaining work

See [museum-data-status.md](museum-data-status.md) for the October 3 checkpoint record, user-approved corrections, production actions still pending, the workspace 84-saint QR shortlist provenance, and the remaining phased backlog. Deployment is tracked by the release captain; code preparation does not imply production data application.

The inventory readiness reader in lib/vrindavan-inventory-readiness.ts is a private, read-only projection over existing confirmed observations. It preserves quantity/location text and supplies explicit object, quantity, identity, location and source-note review reasons. Applied manual geography decisions are included per canonical saint; raw erroneous geography remains intact. The protected JSON export is /admin/source-data/museum/vrindavan/inventory-audit. No schema, environment, object creation, physical verification or production backfill is introduced.
