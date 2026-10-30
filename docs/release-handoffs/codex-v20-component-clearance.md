# Release Handoff: codex/v20-component-clearance

- Status: queued
- Branch: `codex/v20-component-clearance`
- Commit: `4afcecca53d179ffd583ae98b8dcc9d144a4a0f6`
- Owner/agent: `Nadi`
- Bundle priority: consumed by Citra's combined `codex/v20-component-clearance-ui` handoff; do not integrate this backend twice

## Summary

- Record only V20-held components for two compound observations while leaving their whole-source ledgers and walking-stick locations untouched. Ordinary source moves and scoped component records share one atomic audited clearance.
- Full snapshots and fast progress expose explicit partial scope. Later source/current changes or an audited component correction invalidate the clearance prerequisite. Global display-placement and housing holds remain intact.

## Verification

- `npm run dev:check`: passed
- `npm run prepare:deployment`: passed
- Full test suite: 742 passed, 1 skipped, 0 failed (743 total).
- Scoped domain/read/progress/hold tests: 11 passed.
- Real disposable localhost PostgreSQL integration: passed twice; rollback without acknowledgement, 14 ordinary + 2 component records, unchanged held ledgers, idempotent replay, retained display holds, audited correction.
- `git diff --check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none; no production writes performed. Curator confirms through Citra's updated UI. Local database verifier creates and removes only its own isolated test database.
- Queue/deploy trigger: integrate only through Citra's combined UI branch; backend 4afcecc already cherry-picked there as b37e86a. The release captain owns the integrated build.

## Risk And Conflicts

- Shared areas touched: physical confirmation/read/progress, source movement-hold predicate, component-clearance domain and documentation.
- Expected conflicts: do not ship without companion UI support for partial locations and explicit acknowledgements. Citra owns those UI/type changes.
- Rollback notes: revert `4afcecc` and any dependent release commits
- Rollback after a curator has saved a component receipt requires preserving the component-aware reader or migrating its evidence explicitly; an old reader would otherwise show the untouched whole-source origin. No schema migration is needed.
- Workflow learning: museum-data-interpretation now explains origin-held component scope and stale-clearance checks. Focused structural review and representative/counterexample tests passed; the standard skill validator could not run because the local Python runtime lacks PyYAML. saint-identity-reconciliation needed no rule change.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
