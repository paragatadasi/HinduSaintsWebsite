# Release Handoff: codex/companion-progress

- Status: ready
- Branch: `codex/companion-progress`
- Commit: `6aec45d9fe18a2f4665dc109f99b72670a393276`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Progress tab with overall, regional and clickable vitrine trackers
- One authenticated batch decision read with inheritance; no additional polling

## Verification

- dev:check passed; 984 tests passed, 1 existing skip; 8 focused checks passed; Chrome desktop/mobile totals and navigation passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Companion, guide decision GET handler, shared CSS and design guidance
- Expected conflicts: none
- Rollback notes: revert `6aec45d` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
