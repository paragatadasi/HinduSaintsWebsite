# Companion save concurrency

The companion can submit independent placement, shelf and task requests without making every user wait behind one museum-wide exclusive save. Request payloads, scoped response rows, receipt identifiers and conflict status codes stay unchanged.

## Transaction boundaries

- Ordinary physical confirmations and companion work hold the shared side of the existing `museum-move-session:spn` advisory barrier. Clearing, selected-contents staging, component placement, undo, preparation, proposal-addition writes and session mutations retain its exclusive side.
- Placements lock their request ID and sorted source IDs. Transfer dependencies and the Vitrine 9 retained-object dependency join the source lock set. Shelf annotations use the same source lock as physical placements and lock the physical ledger row before validating their snapshot. Task completion uses its task key; every work request also locks its request ID.
- Placement validation takes shared proposal/configuration locks; the corresponding mutation services retain exclusive locks. Existing arrangement locks and source, identity, guide, current-revision, component and readiness checks remain in force.
- Transactions remain Serializable. Only rolled-back serialization failures are retried, at most five attempts, with a short stagger outside the transaction. Prisma `P2034`, the pg adapter's commit-time `40001`/`TransactionWriteConflict`, and the same adapter conflict wrapped by a raw-query `P2010` are recognized. Business conflicts and uncertain network errors are not automatically retried. Exhaustion returns a recoverable 409.

An advisory lock wait can start before the transaction's snapshot. A whole-case clear therefore reads the confirmation receipt set. Placements read the clearance receipt set before commit. This creates the serializable dependency needed to reject or retry a clear whose contents list predates a placement that committed while it waited. Keep this dependency if changing receipt queries or adding indexes; an exclusive advisory barrier alone does not refresh a Serializable snapshot.

## Reused reads

`withMuseumTransactionReads` opts a physical-confirmation transaction into caching the canonical/museum working read model by transaction and interpretation options. That workflow does not update the underlying editorial or arrangement model itself. Source snapshot construction, guide validation and receiver checks can therefore share the same reconstruction.

The mutable physical ledger, component state, receipt history, preparations and clearances are **not** cached this way. Response reads still see this transaction's own changes. Other workflows retain uncached working reads, including arrangement workflows that deliberately reread after taking additional locks. Do not enable the cache around a workflow that changes its own cached inputs.

## Verification

`npx tsx scripts/verify-museum-save-concurrency.ts` requires an empty disposable localhost database named `museum_physical_test_concurrency_*`. It loads `.env.local`, refuses non-local/non-test database names and applies migrations only to that empty test database. Never point it at an existing development or production database.

The verifier exercises the actual save services for four simultaneous requests on distinct sources, same-source conflicting destinations, identical request replay, changed replay payloads, independent task and shelf writes, task replay and a stale shelf after a physical move. It also holds transactions open to test both clear-first and incoming-placement-first orderings. A waiting clear must reject an incomplete roster after an incoming placement commits.

The fixture adds a 100 ms source-loader delay to observe overlapping transactions. Its read-model comparison measures three uncached reconstructions against three reads inside one opted-in transaction. These are local fixture timings, not production latency or a physical-fit claim. Unit tests separately cover cache scope, option separation, failed reads, retry classification and exhaustion.

No migration, production backfill, environment variable or museum data change is required.


## Final review (2 November 2026)

Final-review decisions use one versioned `MuseumFinalReviewState` per museum/source observation. The independent review counter and uniquely keyed request receipts provide shared deltas and idempotency. Source identity, evidence revision and physical revision are checked before a proposal changes. Six competing edits to one version must produce one winner and five recoverable conflicts; six independent records can save concurrently.

A final-review proposal supersedes ordinary suggestions. A later confirmed physical location remains physical truth; a deliberate later final-review proposal can describe a future move. Existing physical history is never rewritten by a flag or proposal. Checkbox confirmation records the vitrine only unless a shelf was explicitly supplied; a proposed shelf is not evidence of its physical placement.

Flag-only updates do not bump `MuseumDataRevision`. Only the state table's planning/decision fields feed the heavy snapshot, guarded by selective deferred triggers. Catalogue proof versions and final-review deltas use indexed review state/counters outside that cache. Physical, shelf and to-do changes still invalidate their normal shared data revision. A matching final-review ETag returns before loading inventory.

To avoid rebuilding source evidence for unrelated concurrent final plans, a write compares the inventory revision delta with committed final-review transactions not visible in its pinned PostgreSQL snapshot (`pg_visible_in_snapshot`). Every other inventory change requires a fresh snapshot. Receipt transaction IDs, the selective trigger condition and the recorded `inventoryRevisionBumped` value are one contract; change them together. Serialization retries remain bounded, idempotent and outside rolled-back transactions. Physical and shared-work writes use a larger bounded retry budget for six reviewers, without retrying stale-record conflicts.

Run `scripts/verify-museum-final-review-local.ts` only with a new disposable localhost `museum_final_review_test_...` database. It applies all migrations, tests real concurrent reviewers, retries, stale source/physical evidence, shared work, and records cold/warm service timings. The verifier also changes source identity while a proposal is waiting for its source lock; the old proposal must fail. Local service timings exclude browser rendering, proxy latency and production load.


The lightweight review counter is database-derived on state inserts, updates, deletes and truncation. A gap between that counter and request receipts forces a complete review-state refresh (using the cached inventory), covering maintenance edits without losing deltas. Physical proof reads lock the review row; review replies take their source-revision barrier after the shared review counter to avoid lock-order inversions. Request replays return the original receipt with the latest source record, so a retry cannot replace newer source/location data with an old receipt payload.

Local service measurements during development (six simultaneous saves are batch completion times, not individual-save latency):

| Operation | Observed local time |
| --- | --- |
| Cold source review read | 1.2–2.6 seconds |
| Six warm scoped reads | 1.2–2.3 seconds per batch |
| Six flags | 2.1–3.8 seconds per batch |
| Six proposals, after avoiding unrelated source rebuilds | 2.7–3.9 seconds per batch |
| First checkbox, proposal plus physical confirmation | 0.65–1.57 seconds |
| Six physical checkboxes | 7.6–17.4 seconds per batch |
| Six shelf saves | 6.9–12.5 seconds per batch |
| Six to-do creates | 0.6–1.5 seconds per batch |

These are disposable-localhost service measurements, with concurrent build checks affecting some runs. They exclude browser rendering and network/proxy latency; no per-request p50/p95 or production latency claim is implied. Existing Active move concurrency regressions also passed, including overlap, same-source conflicts, receipt replay, clearing races, shelf/physical races, component scope and undo.


### Separate final-placement review (2 November 2026)

A moved record is not automatically finally reviewed. Existing records start with no review marker. The final-review snapshot always returns `finallyReviewed` and a nullable ISO `reviewedAt`; catalogue entries and source-scoped decision overlays also return `finallyReviewed` for the shared progress reader.

`review.confirm` requires the common source/review pins, the selected effective `vitrine`, and both physical pins (`expectedCurrentRevision`, `expectedLocationVersion`). `review.clear` requires the common and physical pins but no destination. Neither action accepts a shelf. A confirmation creates a physical confirmation and a review marker in one serializable transaction when the source is not yet confirmed at its final vitrine. Already-correct confirmed placements get only the marker, with no duplicate physical event. Clearing removes only the marker and preserves the physical ledger.

The marker binds the source identity/evidence, final plan version, vitrine, physical version and any separately tracked component revision. A later actual move, component revision, identity change or explicit proposal change invalidates it. Returning to an earlier vitrine does not resurrect the old review. Shared shelf notes and other annotations do not change the physical version and do not revoke a vitrine review. Proposed shelves are never copied into a checkbox confirmation.

An explicit review confirmation can supersede an older declined or deferred decision. Not-on-display records must first receive an explicit destination update. An open Missing flag must be resolved before presence is confirmed; an Other follow-up may remain open. No flag is resolved automatically. Finally reviewed implies addressed in both the record and shared progress overlay; the reverse is false. The final-placement denominator excludes not-on-display and existing static nonholding/private exclusions.

Marker-only edits use the indexed review counter and receipts without invalidating the heavy inventory cache. Receipts now separately record whether source/physical evidence remained unchanged. The snapshot-reuse optimization must exclude transactions that also confirmed a physical placement, even though those transactions have a final-review receipt.

Verification covers initially unchecked existing moves, stale reviewers, retry receipts, review clearing without physical change, explicit proposal invalidation, shelf-note preservation, actual move/return invalidation, and an injected review-write failure that rolls back the physical confirmation in the same transaction. Use the disposable localhost PostgreSQL verifier; these checks do not authorize production backfills.
