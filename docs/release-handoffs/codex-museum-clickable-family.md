# Release Handoff: codex/museum-clickable-family

- Status: queued
- Branch: `codex/museum-clickable-family`
- Commit: `f3a40a1a3fb12b9703def4aca35a654684ca46f4`
- Owner/agent: `aporu`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Make family card surfaces open the move dialog, with a compact corner move icon replacing the tree icon and large button. Preserve individual saint links and tree expansion.

## Verification

- npm run dev:check passed; git diff --check passed. Browser interaction was not rerun for this small follow-up.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: Museum section workspace, shared family move dialog component, shared CSS
- Expected conflicts: Coordinate with ongoing museum collections work; this branch starts from main after the prior museum release.
- Rollback notes: revert `f3a40a1` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
