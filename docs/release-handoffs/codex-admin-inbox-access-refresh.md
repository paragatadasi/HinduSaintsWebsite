# Release Handoff: codex/admin-inbox-access-refresh

- Status: queued
- Branch: `codex/admin-inbox-access-refresh`
- Commit: `35cf7f6b540e6b466abb102d3d5f3334debbb6a1`
- Owner/agent: `/root`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Restricts the admin feedback inbox, sidebar and dashboard links, detail routes, and workflow actions to editors, data admins, and site admins.

## Verification

- npm run dev:check: passed; permissions suite: 13/13 passed; full suite: 141 passed with 4 unrelated current-main path-alias loader failures in database-backed tests

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: lib/permissions.ts, app/admin/layout.tsx, app/admin/page.tsx, and app/admin/feedback routes/actions
- Expected conflicts: refreshed from main 84aa950; current editorial-preview dashboard and layout structure preserved; no known remaining conflicts
- Rollback notes: revert `35cf7f6` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
