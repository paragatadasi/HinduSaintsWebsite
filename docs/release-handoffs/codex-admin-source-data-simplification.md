# Release Handoff: codex/admin-source-data-simplification

- Status: ready
- Branch: `codex/admin-source-data-simplification`
- Commit: `f7e6c899c122ca2f8c1be146e4fc13b466f7186a`
- Owner/agent: `aporu`
- Bundle priority: immediate release candidate

## Summary

- Simplifies Source Data navigation to Reconciliation, Airtable, and Instagram.
- Retires the redundant overview and combined history destinations while keeping legacy URLs safe through redirects.
- Keeps operational job histories in their source workspaces and adds source-specific, expandable raw `ImportBatch` history for Airtable and Instagram.
- Preserves existing Airtable, Instagram, CSV, and manual raw import records without changing the shared data model.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed (107/107)
- `npm run codex:verify`: passed; compiled, type-checked, collected page data, and generated all 15 static pages. The non-failing trace-copy warning is the known Windows worktree junction limitation.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: admin primary navigation, Source Data routes, Airtable and Instagram source workspaces/panels, shared admin history component, admin workflow/import documentation
- Expected conflicts: other changes to Source Data navigation or Airtable/Instagram history presentation
- Rollback notes: revert `f7e6c89` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
