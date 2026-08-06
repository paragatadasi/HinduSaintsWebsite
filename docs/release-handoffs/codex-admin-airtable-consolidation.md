# Release Handoff: codex/admin-airtable-consolidation

- Status: ready
- Branch: `codex/admin-airtable-consolidation`
- Commit: `734d966f85a485530a44a6803c575e05bc586286`
- Owner/agent: `aporu`

## Summary

- Moves the complete Airtable sync review from the Saints queue into Source Data -> Airtable.
- Preserves check/import/repair/cleanup actions, live polling, progress, rich job summaries, and affected-record links.
- Removes the duplicate server-action queue and simplified job history from the Airtable maintenance page.
- Keeps mirror refresh and destructive reset together in one secondary collapsed maintenance card.
- Removes the Airtable query and panel from `/admin/saints` and updates the workflow runbooks.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed (100 tests)
- `npm run codex:verify`: compiled, type-checked, collected page data, and generated all 15 static pages; nonzero only at the known Windows junction `EPERM` during standalone trace copying
- `npm run prepare:deployment`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none

## Risk And Conflicts

- Shared areas touched: `app/admin/airtable`, `app/admin/saints/page.tsx`, admin-overhaul and integration runbooks
- Expected conflicts: possible only if another branch changed the Airtable admin page, Saints queue imports/query, or the same workflow documentation
- Rollback notes: revert `734d966` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
