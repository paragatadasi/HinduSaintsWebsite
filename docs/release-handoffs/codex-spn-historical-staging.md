# Release Handoff: codex/spn-historical-staging

- Status: ready
- Branch: `codex/spn-historical-staging`
- Commit: `1d9cbdd1b325096ea59f367e37a75bd5c4e0d3f8`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Reconcile residual starter-case contents to staging while preserving confirmed locations

## Verification

- Four domain tests and dev:check passed. Integrated protected-route tests and codex:verify required in release verification worktree.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: Requires companion preview integration; no automatic production backfill. Record only freshly reviewed residual source rows.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: New isolated historical-staging route/domain/service; existing ledger advisory lock
- Expected conflicts: none
- Rollback notes: revert `1d9cbdd` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
