# Release Handoff: codex/admin-nav-logout

- Status: queued
- Branch: `codex/admin-nav-logout`
- Commit: `1723da8df751e8d6699a0583312e966a8cd1906c`
- Owner/agent: `aporu`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Adds a working Log Out action at the bottom of the shared admin sidebar and redirects signed-out users to the public homepage.
- Aligns the Log Out control with the Dashboard link and changes sidebar destinations and nested admin subtabs to regular font weight.

## Verification

- `npm run dev:check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: admin layout, shared admin navigation component, and global admin navigation styles
- Expected conflicts: possible stylesheet conflicts with other branches editing the admin sidebar or shared tab strip
- Rollback notes: revert `1723da8` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
