# Release Handoff: codex/review-progress-groups

- Status: queued
- Branch: `codex/review-progress-groups`
- Commit: `11d7d7bc17c2e2f7ffe2349de266771959b7af4a`
- Owner/agent: Citra
- Bundle priority: queue for next major/bundled deployment

## Summary

- Final review progress uses the same guide-owner groups and order as Move progress.
- Merge Maharashtra into West; shorten Central journey to Central and Northern journey to North in shared navigation.
- Preserve totals, source deduplication, final-review completion semantics, and unassigned/unguided records.

## Verification

- `npm run queue:deployment`: passed (includes dev:check).
- 10 focused progress tests passed, including cross-tracker group parity and unchanged totals.
- git diff --check passed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: companion navigation, final-review progress projection and component, root companion props, design docs.
- Based on prior Mayapur/empty-map release tip e3abc63; integrate after that release. User explicitly requests waiting for a larger bundle, not a standalone deployment.
- Rollback notes: revert `11d7d7b` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
