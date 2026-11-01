# Shared museum companion reads

Shelf-plan and catalog GET endpoints share a private server read model. Authorization runs before cache lookup. Mutation services validate fresh data in their own transactions.

## API contract

- Shelf GET retains ShelfPlanningContext. Optional `?vitrine=CODE` selects one case; unknown layout codes return 400. A valid empty case returns no recommendations.
- Shelf responses include availableVitrines and revision. Catalog responses include the same base revision; `?view=revision` returns only the museum identifier and revision.
- Private ETags include resource and selected-case scope. An unchanged request returns 304 before rebuilding. Server-Timing exposes request work.
- POST payloads are unchanged. Client writes invalidate local GET state; cached responses never authorize physical moves.

## Revision and consistency

MuseumDataRevision is a PostgreSQL counter maintained by triggers on the 34 tables in museum-snapshot-tables.ts. A commit affecting these tables increments it once; rollback leaves it unchanged. Row triggers are deferred to commit. TRUNCATE triggers run immediately and hold the counter lock until transaction end. The single counter conservatively invalidates all variants, including unrelated audit writes. Authentication/session and public traffic counters are excluded.

The API revision includes a process-wide epoch and UTC day so deployments and date-based projections refresh. Add dependencies to both manifest and trigger migration before caching them. Static source changes require a process restart. These cache identities are not record versions or physical-placement evidence.

All three models use museum-snapshot-cache.ts. Shared reuse requires database-enforced READ ONLY RepeatableRead or Serializable transactions. Ordinary database calls create such a transaction. Supplied read-write transactions bypass shared reuse even before their first write, preserving underlying reads for Serializable conflict detection. Mutation services retain fresh validation and transaction-local reuse. This does not promise cross-request source-cache savings for POST requests.

Builds capture counter and data in one snapshot. Producer and waiting-reader transaction state is checked before returning shared data. Errors and unshareable builds are removed. Every caller receives an independent structured clone, including Map, Set and Date values. The bounded cache retains two revision/variant entries per model name, not two per variant; cycling variants can rebuild them. Same-key readers share work. Newer revisions build separately and cannot receive older in-flight snapshots. Revision checks are also deduplicated in process.

The dependency scanner is a heuristic, not proof of complete coverage. The database verifier checks enabled installed triggers and captures representative runtime reads across every working-data and source-index variant. New conditional paths still require review. The global counter can serialize commits; concurrent-user fixtures passed, but production contention and cache hit rate require monitoring.

## Measured local comparison - 1 November 2026

The disposable database verifier compares baseline 88cedab using the full static inventory, two linked canonical saints and one receiver-space receipt. This run overlapped local verification workloads; elapsed times are not isolated benchmarks or production promises. Counts include transaction statements.

| Read | Queries | Working-model loads | Elapsed |
| --- | ---: | ---: | ---: |
| Previous catalog | 85 | 2 | 2,222 ms |
| Previous full shelves | 137 | 3 | 2,775 ms |
| Cold concurrent catalog + selected shelves | 59 | 1 | 2,773 ms |
| Warm full shelves | 5 | 0 | 772 ms |
| Unchanged catalog | 1 | 0 | 5 ms |
| Unchanged selected shelves | 1 | 0 | 4 ms |

The cold pair loaded one working model rather than five. Selected-case payload was 14,207 bytes versus 750,329 bytes for all cases (98.1% smaller). The verifier's revision-only object is 95 bytes; actual HTTP 304 responses have no JSON body. Full warm responses still incur copying and projection cost. Monitor production Server-Timing, memory, hit rate and overall request load.

## Verification and deployment

- verify-museum-read-performance.ts uses a fresh disposable localhost museum_read_test_ database. It checks baseline/full/selected value equality, concurrent reuse, unchanged reads, raw edits without timestamps, alias deletion, source relinks, stale-write rejection and an in-flight revision race. Temporary baseline modules are removed afterward.
- verify-museum-data-revision-local.ts uses an owned localhost museum_revision_test database. It checks installed triggers, commit/rollback/TRUNCATE, concurrent commits, isolated mutable values, read-only reuse, read-write bypass, warmed-cache Serializable write-skew on an untriggered guard table, real model equality and runtime dependency coverage.
- verify-museum-save-concurrency.ts checks 22 physical/shelf/task/component scenarios with the migration installed in a fresh localhost museum_physical_test_concurrency_ database.
- Unit tests cover mutable-value isolation, late/waiting writers, read-committed and read-write bypass, and revision/resource scopes. Full tests, development check and production build remain release gates.

Apply migration 20261102000000_museum_data_revision in the release/migrate phase before promoting this code. Never add database access to the web build. No environment changes or content backfill. Roll back application code without dropping the additive table/triggers during an incident. On production, verify two curator devices, unchanged conditional responses, progress polling and independent saves.
