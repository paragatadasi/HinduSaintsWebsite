# Release Handoff: codex/museum-plan-focus-navigation

- Status: ready
- Branch: `codex/museum-plan-focus-navigation`
- Commit: `13e4d4a82a3b2548897bcc1fd7c45fa04284eab5`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Planning workspace starts with navigation collapsed; Show/Hide navigation restores it without resetting the plan.

## Verification

- dev:check passed; diff check passed. Browser interaction not verified locally; release smoke: enter plan, toggle nav, preserve selections, leave and re-enter.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: MuseumWorkspace, MuseumWorkspaceLayout, styles/globals.css, docs/design-system.md
- Expected conflicts: none
- Rollback notes: revert `13e4d4a` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
