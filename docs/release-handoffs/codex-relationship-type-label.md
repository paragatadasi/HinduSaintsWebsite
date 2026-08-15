# Release Handoff: codex/relationship-type-label

- Status: queued
- Branch: `codex/relationship-type-label`
- Commit: `224eed788a3a2c30581f962d4a3165ad8d3a26fb`
- Owner/agent: `Codex relationship-type-label task`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Moves the relationship type from a status badge to muted parenthetical text beside the related saint name while retaining status, evidence, and visibility badges.

## Verification

- `npm run dev:check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: app/admin/saints/[id]/page.tsx, styles/globals.css
- Expected conflicts: Potential overlap with concurrent admin Saint editor or shared global-style work.
- Rollback notes: revert `224eed7` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
