# Release Handoff: codex/museum-data-revision

- Status: ready
- Branch: `codex/museum-data-revision`
- Commit: `b59f77c2f3e0dc660e26650e256c3966a18fe93c`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Share museum GET snapshots using a trigger-maintained revision and database-enforced read-only transactions; preserve fresh mutation reads and independent mutable values.

## Verification

- dev:check PASS; npm test 982 passed/1 skipped; codex:verify PASS; actual revision/SSI/model verifier PASS; 22 physical concurrency checks PASS; read performance/equality/invalidation/race verifier PASS.

## Deploy Notes

- Migrations: 20261102000000_museum_data_revision: additive counter and triggers on 34 tables; run release migration before promoting app.
- Environment variables: none
- Data/backfill/release steps: No content backfill. Preserve existing placements and proposals.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Museum working-data/source cache, shelf/catalog GET snapshot and revision; dependency manifest; local verification scripts.
- Expected conflicts: none known; branch includes reviewed PR4 bd84a9f and deployed PR5 baseline a9260ea.
- Monitoring: one global counter can serialize commits and audit writes invalidate all variants; observe save conflicts, memory, hit rate and Server-Timing. Cache retains two revision/variant entries per model name. TRUNCATE locks the counter until transaction end.
- Local performance: unchanged reads one query and no working-model load; cold concurrent pair one load rather than five. Full warm responses still incur cloning/projection cost. See docs/museum-companion-read-performance.md for fixture limits.
- Learning review: no new museum interpretation or identity rule; engineering findings documented in the shared-read documentation.
- Rollback notes: restore the prior application release a9260ea, including the original PR4 integration; do not revert only the safety-fix commit. Leave the additive counter/triggers installed during an incident.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending

