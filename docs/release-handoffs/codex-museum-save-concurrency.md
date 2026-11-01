# Release Handoff: codex/museum-save-concurrency

- Status: ready
- Branch: `codex/museum-save-concurrency`
- Commit: `90a1246917b60f54c2a67621485caf649b0da254`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Reuse the canonical/museum read model within a physical-confirmation transaction; keep physical ledger and receipt reads fresh.
- Allow independent placements, shelves and tasks under shared museum barriers with request/source locks, preserving exclusive clearing and correction workflows.
- Retry only rolled-back Serializable conflicts with bounded staggered attempts, including Prisma pg-adapter commit and raw-query errors.

## Verification

- `npm run prepare:deployment`: passed after the final build, sequentially to avoid generated-type file races.
- `npm run codex:verify`: passed on committed code 90a1246; existing CSS autoprefixer warnings only.
- `npm test`: 949 passed, 1 expected skip. Final focused cache/retry/shelf tests: 10 passed.
- Actual disposable-local-PostgreSQL verifier: four simultaneous distinct-source requests all saved, with overlapping transactions; same-record conflicts, identical request replay, changed replay rejection, both ordered clear/placement races, independent tasks/shelves, task replay and concurrent stale shelf rejection passed.
- Existing physical-location database regression verifier: passed (roles, exact-source/version/date guards, item/housing holds, guide readiness and session independence).
- Local fixture reconstruction: three uncached reads 1927 ms versus one cached reconstruction 515 ms; four concurrent fixture requests 1379 ms with a deliberately injected 100 ms loader delay. These are fixture timings, not production latency guarantees.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none. No production data writes were performed. Combine with Citra’s `codex/companion-concurrent-saves` client branch; backend first is preferred.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: `lib/museum-physical-locations.ts`, `lib/museum-companion-work.ts`, `lib/museum-working-data.ts`; new transaction-read and write-lock helpers.
- Expected conflicts: no expected path overlap with Citra’s client work. Base is main 01c58eb. Preserve the clear/confirmation Serializable read dependency and shelf physical-row lock during integration.
- Operational limitation: heavy contention can still return a recoverable 409 after five attempts; network errors are not retried automatically. Museum data and skills require no updates.
- Rollback notes: revert `90a1246` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
