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
