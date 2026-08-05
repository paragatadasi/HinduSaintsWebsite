# Release Handoff: codex/admin-reconciliation

- Status: ready
- Branch: `codex/admin-reconciliation`
- Commit: `b78436ddfefa99fa659ff70101e952051e14be86`
- Owner/agent: `aporu`

## Summary

- Adds a protected Source Data overview, chronological history spanning generic,
  Airtable, Instagram, CSV, and manual import records, and a unified reconciliation queue.
- Adds unresolved navigation badges and records reviewer decisions/notes without
  allowing the generic workflow to overwrite reviewed CMS values.
- Updates the durable admin-overhaul workflow to resume at Chunk 6 after deployment.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed (80 tests)
- `npm run codex:verify`: compiled, type-checked, collected page data, and generated
  all static pages; the known Windows junction `EPERM` occurred only while copying
  standalone build traces.

## Deploy Notes

- Migrations: `20260805140000_reconciliation_decisions`
- Environment variables: none
- Data/backfill/release steps: apply the migration in the deployment migrate/release
  phase before serving the new routes; no backfill is required.

## Risk And Conflicts

- Shared areas touched: `app/admin/layout.tsx`, `prisma/schema.prisma`, admin-overhaul
  and import/reconciliation documentation
- Expected conflicts: none
- Rollback notes: revert `b78436d` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
