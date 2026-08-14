# Release Handoff: codex/task-status-readiness

- Status: queued
- Branch: `codex/task-status-readiness`
- Commit: `96b6b49ebac27b0891ac425d45ff6a14491d4c3f`
- Owner/agent: `aporu`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Renames assignment state to Task status in the admin UI and requires a separately stored reason when a reviewer blocks a task.
- Adds the current reviewer's Task status beside Editorial progress on Saint, Tradition, and Place readiness pages.
- Corrects native admin select-option contrast and lets Tradition/Place readiness fill the decision area when merge tools are unavailable.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed (147/147)
- `npm run codex:verify`: application compilation, type validation, and 16/16 static pages passed; standalone trace copying then failed because the feature worktree uses a Windows `node_modules` junction (`EPERM`)
- Visual browser check: unavailable because Docker Desktop was not running

## Deploy Notes

- Migrations: `20260812140000_add_assignment_blocked_reason` adds nullable `ContentAssignment.blockedReason`
- Environment variables: none
- Data/backfill/release steps: apply the migration in the normal release/migrate phase before the new web image; no backfill required
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: assignment server actions and workspace, Saint/Tradition/Place readiness assignment component, Prisma schema, shared admin form/readiness styles
- Expected conflicts: possible with branches changing `app/admin/work/actions.ts`, `components/admin/readiness-assignment-section.tsx`, `prisma/schema.prisma`, or `styles/globals.css`
- Rollback notes: revert `96b6b49` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
