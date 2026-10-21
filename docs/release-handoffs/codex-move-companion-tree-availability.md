# Release Handoff: codex/move-companion-tree-availability

- Status: ready
- Branch: `codex/move-companion-tree-availability`
- Commit: `46c8e8a7da23e10b349dac25259150f263c5ca3b`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Only show move companion family-tree actions when the selected saint has a real connected tree; include canonical, preserved export and guide evidence.

## Verification

- npm run dev:check passed; 24 availability/layout/source tests passed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: Read-only batched availability; no data writes, migrations or environment changes.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Planner row contract, planner read service, move list, new tree availability helper/service/tests.
- Expected conflicts: Integrate with latest guide baseline; helper imports the active guide catalogue. No guide JSON changes.
- Rollback notes: revert `46c8e8a` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
