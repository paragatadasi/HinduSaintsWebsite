# Release Handoff: codex/museum-read-performance

- Status: ready
- Branch: `codex/museum-read-performance`
- Commit: `6a93266f56077aa7c009c307af53ac95ab0b3569`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Share one revisioned private snapshot across museum shelf and catalog reads; return 304 before heavy work when source/CMS/placement inputs are unchanged.
- Support selected-vitrine shelf responses and shared revision metadata while preserving legacy full reads and all fresh mutation validation.

## Verification

- npm run dev:check passed; npm test 972 tests, 971 passed, 1 skipped; npm run codex:verify passed; disposable PostgreSQL baseline-equivalence, query/payload, freshness and concurrency proof passed; four cache/revision regressions passed; git diff --check passed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No migrations, environment changes, backfill or production writes. Cached GET snapshots never authorize writes. Dependency manifest must track source/relation table changes. Local fixture: 222 to 48 queries and 5 to 1 working-model loads for paired reads; selected shelves 14207 vs 750329 bytes. Production benefit still needs measurement. Museum interpretation skill cache-freshness rule maintained locally.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Museum shelf-plans and companion-catalog GET routes, read-only shared snapshot/revision/cache modules, optional transaction-preloaded addition reads.
- Expected conflicts: Bundle with Citra codex/companion-performance-followup tip 9ff2520 or newer. Backend before client. Based on integrated incident main 88cedab. No page/client files touched.
- Rollback notes: revert `6a93266` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
