# Release Handoff: codex/confirmed-placement-projection

- Status: ready
- Branch: `codex/confirmed-placement-projection`
- Commit: `8336bfa8ed64381ab3b4bff8ff82279cefc503c0`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Project confirmed placements into current destinations while preserving later plans and component scope

## Verification

- npm run dev:check passed; 27 regression tests and 4 focused helper tests passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: Read projections only; no database writes or backfill; historical proposal releases unchanged
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Museum companion snapshot, catalogue, shelf reader, case contents, GuideEntry scope type
- Expected conflicts: Bundle with Citra confirmed-rosters 707f0b8; integrate backend first
- Rollback notes: revert `8336bfa` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
