# Move companion shelves and to-dos

The curator requested final shelf text and durable per-relic to-dos on 28 October 2026. These are SPN source-observation records, not canonical saint editorial fields or cross-museum placements. Multiple relic observations for one saint retain separate work records.

## Shelf semantics

A new physical placement may include its shelf through the existing `to.shelf` field. A later shelf annotation uses separate `MuseumCompanionShelf` metadata tied to exact source identity, confirmed vitrine and physical ledger version. It does not create another physical move, rewrite the placement receipt, change its confirmation timestamp, or invalidate undo. The shelf remains text: `3.10` is preserved exactly. Empty text explicitly clears the annotation.

Use `companionShelfApplies(note, physicalRow)` from `lib/museum-companion-work-domain.ts`. The note is authoritative only when source ID, saint ID, confirmed vitrine and physical version all match. A move, undo, rematch or loss of confirmation makes it stale. GET still returns stale notes so the UI can use their latest version for optimistic concurrency. An applicable empty annotation must not fall back to an older shelf value; absence of an applicable annotation can fall back to `physicalRow.current.shelf`.

## Tasks

`MuseumCompanionTask` stores source identity, text, open/completed status, version and creator/update/completion timestamps. Tasks can be completed or reopened. Completion is not a physical placement and does not complete a guide checkbox. Current identity is checked before create/complete; a changed binding is held instead of transferring the task silently.

## Protected API

`/api/admin/museum-companion-work` requires active museum catalog access for GET and curator management plus same-origin JSON for POST.

GET takes `museumId=museum-spn` and repeated `sourceId` values. Request the actual active phase/group rows; batch long source lists to avoid oversized URLs. It returns `{ museumId, sourceIds, shelves, tasks }`, including open and completed tasks. POST returns the same fields for the affected source plus audit receipt/replay information. Merge by the returned `sourceIds`, preserving other phase rows.

All mutations require `museumId` and stable UUID `clientRequestId`:

- `task.create`: `sourceId`, nullable `saintId`, `title` (trimmed, 1–500 characters).
- `task.complete`: `taskId`, `expectedVersion`, `completed` boolean (false reopens).
- `shelf.update`: `sourceId`, nullable `saintId`, `vitrine`, `shelf` (text, up to 100 characters), annotation `expectedVersion` (zero when absent), and physical `expectedCurrentRevision`, `expectedSourceRevision`, `expectedLocationVersion`.

Shelf writes require a current confirmed vitrine and exact physical/source concurrency values. Metadata versions are separate from physical ledger versions. Transactions use the shared SPN lock and serializable isolation. Repeated identical UUIDs return the prior receipt/current work; UUID reuse with different input conflicts. Errors preserve entered UI values, and uncertain failures must retry with the same UUID rather than create a second task.

## Migration and release

`20261028120000_museum_companion_work` adds two tables and an indexed museum/source/status task lookup. There are no destructive changes, data backfill or environment additions. Run migration in the deployment release phase, never in the web build. The route requires this migration before promotion. Existing annotations/tasks remain preserved if the UI is rolled back; do not drop their tables as release cleanup.

The additive SQL was checked in an isolated disposable PostgreSQL 16 database, including exact shelf text, task completion and reopening. Domain tests cover source/physical mismatches, stale annotations, clearing, task validation and completion versions. The release captain must run the integrated production gate with the combined Citra UI and this schema/API change.

## Save performance

The separate `9107623` change shares one immutable source snapshot only inside a write transaction while keeping before/after mutable ledger reads fresh. Undo receipt lookup selects exact current source/version/timestamp matches in SQL instead of loading 1,000 unrelated receipt payloads. The protected physical API now includes `Server-Timing` total duration. This demonstrates removed repeated work; production latency has not yet been measured, so no numerical speedup is claimed.

Museum interpretation and identity rules were reviewed: shelf precision, source-observation scope, confirmed state versus annotations, and audited corrections remain consistent. No source identities, proposals or physical locations were changed during development.
