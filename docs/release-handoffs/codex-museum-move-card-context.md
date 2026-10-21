# Release Handoff: codex/museum-move-card-context

- Status: ready
- Branch: `codex/museum-move-card-context`
- Commit: `473bca13724500b210a7c4a8bd6b74bc406abf0a`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Compact move cards show Primary/Secondary/Tertiary and direct family-tree dialog

## Verification

- dev:check passed; phone-sized synthetic UI tier/button/dialog interaction passed; shared existing tree renderer reused

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: components/admin/museum-move-list.tsx
- Expected conflicts: Builds on ready companion-refine f51e94e; no backend destination-sync dependency
- Rollback notes: revert `473bca1` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
