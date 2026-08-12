# Release Handoff: codex/fact-checker-dashboard

- Status: ready
- Branch: `codex/fact-checker-dashboard`
- Commit: `d1d50c3f513a0ca1cf3d6e6fec7869b3edbd88f2`
- Owner/agent: `aporu`
- Bundle priority: immediate release candidate

## Summary

- Consolidates the fact-checker Dashboard into one role-aware My Workflow surface with Active, Available, Blocked, and Completed queues.
- Hides shared team metrics and workload data from individual workflow participants while preserving them for assignment managers.
- Keeps blocked assignments out of the Active queue and removes repeated queue headings and counts.

## Verification

- `npm run dev:check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: `app/admin/page.tsx`, `components/admin/assignment-workspace.tsx`, and Dashboard guidance in `docs/design-system.md`
- Expected conflicts: possible if another release also changes the admin Dashboard or assignment workspace
- Rollback notes: revert `d1d50c3` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
