# Shared museum companion reads

The shelf-plan and catalog GET endpoints share a private server read model. Authorization runs before revision/cache lookup. Mutation services do not consume this cache: physical moves, shelf updates, planning changes and identity links continue to validate current data in their own transactions.

## API contract

- `GET /api/admin/museum-shelf-plans` retains the full `ShelfPlanningContext` response.
- Optional `?vitrine=CODE` returns the same shape with only that case in `cases`. A valid layout case without a recommendation returns an empty `cases` array. Unknown layout codes return 400 before a museum-data read.
- Shelf responses add `availableVitrines` (the unfiltered recommendation-case codes) and `revision` (the shared base revision).
- `GET /api/admin/museum-companion-catalog` retains catalog fields and adds the same base `revision`.
- Optional catalog `?view=revision` returns only `{museumId: "museum-spn", revision}` without building the snapshot.
- GET responses provide private, revalidated ETags and Server-Timing. Send each resource's ETag in `If-None-Match`; an unchanged resource returns 304 before a source/model rebuild. ETags include resource and selected-case scope; a catalog tag cannot suppress a shelf response. The revision-only response uses the shared base tag.
- Existing POST and save payloads are unchanged. Client writes must invalidate their local GET cache and use fresh server validation; a cached response never authorizes a move.

## Revision and consistency

`museum-companion-read-revision.ts` lists every current database dependency of the working model, physical/source projection, collection links, source identities, family/section/locality decisions and shelf/catalog projections. A single PostgreSQL query hashes visible MVCC tuple versions and tuple identities for those tables. It reads tuple headers, not every private JSON payload. This detects updates made without parent timestamps, relation-only edits, source relinks and deletions. It intentionally invalidates conservatively for other rows in the listed tables. Authentication/session and public traffic counters are excluded.

The revision also includes a process-wide epoch and UTC day; deployments invalidate prior code's tags and date-based life-status projections refresh. Audit new reader dependencies against this manifest whenever changing the read model. New source tables must be added before they participate in these cached views. Static source/packet changes take effect with a process restart. These revisions are private cache identities, not record versions or evidence of physical placement.

One process-wide in-flight revision check is shared by simultaneous readers. A bounded two-revision snapshot cache serializes heavy builds across resources. Each build captures its own revision and data inside one RepeatableRead transaction. Transaction-scoped working-model reuse avoids the catalog's separate duplicate model read. A reader asking for a newer revision waits for a fresh build instead of receiving an older in-flight snapshot. Errors are not cached. Derived catalog and selected-case shelf projections are reused only for their exact snapshot object.

## Measured local comparison · 1 November 2026

The disposable database verifier compares against the integrated incident baseline `88cedab`, using the full static museum inventory, two linked canonical saints and one receiver-space receipt. This is a controlled local fixture, not a production load test. Query counts include transaction statements; the full-source counter counts the working model's mirror reads and excludes lightweight revision SQL.

| Read | Queries | Full working-model loads | Local elapsed |
| --- | ---: | ---: | ---: |
| Previous catalog | 85 | 2 | 1,305 ms |
| Previous full shelves | 137 | 3 | 1,553 ms |
| New concurrent catalog + selected shelves | 48 | 1 | 633 ms |
| Warm full shelves | 1 | 0 | 150 ms |
| Unchanged catalog | 1 | 0 | 26 ms |
| Unchanged selected shelves | 1 | 0 | 6 ms |

The two cold requests used 48 queries rather than 222 and one working-model load rather than five. A selected-case shelf payload was 14,207 bytes versus 750,329 bytes for all cases (98.1% smaller in this fixture). Conditional HTTP responses carry no JSON body. Wall times vary with hardware, warm-up and real data; verify production Server-Timing and overall request load after release.

## Verification

Run `scripts/verify-museum-read-performance.ts` only against a fresh disposable localhost `museum_read_test_...` database. It applies migrations only there and temporarily loads the baseline catalog reader from Git history. It checks strict old/new catalog and full-shelf value equality; selected-case equality; one build across concurrent resource readers; lightweight unchanged reads; source edits without timestamps; alias deletion; identity relinks; cached stale location/identity write rejection; and a controlled source edit while an older snapshot is in flight. Its temporary baseline module is removed afterward.

Pure regressions cover in-flight build deduplication, newer revisions, retry after failure, bounded cache entries, actual-revision cache keys and revision/resource scopes. The normal full test suite and production verification remain release gates. Production testing should use two curator devices and confirm that shelf/catalog conditional requests avoid repeated snapshot work, alongside the already optimized progress poll.
