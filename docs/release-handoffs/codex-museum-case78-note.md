# Release Handoff: codex/museum-case78-note

- Status: queued
- Branch: `codex/museum-case78-note`
- Commit: `1ca3a48cee69791aba4047a47309efd34c6ccd70`
- Owner/agent: `aporu`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Remove obsolete Vitrine 78 Hemalata display instruction; preserve historical proposal and all placements

## Verification

- `npm run dev:check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: none
- Expected conflicts: none
- Rollback notes: revert `1ca3a48` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
