# Release Handoff: codex/spn-east-north-version-label

- Status: queued
- Branch: `codex/spn-east-north-version-label`
- Commit: `dd2546f490c812d25d461e79ac71300d0dfe48a5`
- Owner/agent: `aporu`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Label the latest Sikh–North study as East–North connections · v3; retain East–North v2 under earlier versions. Preserve study IDs, allocations and default selection.

## Verification

- `npm run dev:check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: components/admin/spn-room-explorer.tsx (proposal labels and grouping only)
- Expected conflicts: none
- Rollback notes: revert `dd2546f` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending

