# Release Handoff: codex/family-tree-relationship-reconciliation

- Status: ready
- Branch: `codex/family-tree-relationship-reconciliation`
- Commit: `3606d946230e4adcb277fb8690be452467742689`
- Owner/agent: `Nadi (Museum Data Integration)`
- Bundle priority: immediate release candidate

## Summary

- Add protected Source Data reconciliation of preserved family-tree linked fields into private canonical website relationship candidates.
- Preserve raw snapshot and reciprocal field provenance, existing and archived decisions; unresolved/conflicting/cyclic claims become idempotent review issues.

## Verification

- dev:check and codex:verify passed. Seven domain tests and guarded disposable PostgreSQL write integration passed. Heavier new-route build gate used instead of redundant prepare:deployment check.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: After deployment, open /admin/source-data/museum/family-connections in authenticated production admin, review live counts and apply. Production data NOT applied by this feature chat. Imported records are needs_review/publicVisible=false; both museum trees can display with pending enabled. No source Airtable, saint or placement writes.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Main admin museum source-data navigation, additive protected route, museum integration/status documentation. No Citra tree renderer/API changes.
- Expected conflicts: Possible additive docs overlap with Citra. No schema changes. Reverting code does not remove imported data; retain provenance and review or archive any connection needing correction.
- Rollback notes: revert `3606d94` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
