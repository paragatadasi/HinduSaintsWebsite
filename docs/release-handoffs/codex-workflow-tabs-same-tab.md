# Release Handoff: codex/workflow-tabs-same-tab

- Status: queued
- Branch: `codex/workflow-tabs-same-tab`
- Commit: `5a32e36a0324d455be2ae88aac8738df66d013c7`
- Owner/agent: `aporu`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Keep Dashboard workflow queue navigation in the current browser tab and align assignment controls in a compact bottom-right row.
- Remove assignment notes and priority from the UI, server contract, Prisma model, and database.
- Derive Saint, Tradition, and Place assignment types from starting workflow status: Needs review to Fact-check, Fact-checked to Populate, and Populated to Polish; keep Instagram assignments as Review.
- Backfill existing assignment types, retain the Assigned badge, and prevent new workflow assignments for polished content.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed (163/163)
- `npm run codex:verify`: passed; the web build completed with the known standalone trace-copy warning caused by this feature worktree's `node_modules` junction. Run the definitive integrated build in the persistent release worktree with its real dependency install.
- `git diff --check`: passed

## Deploy Notes

- Migrations: `20260815130000_remove_assignment_notes` and `20260815131000_derive_assignment_tasks_remove_priority`
- Environment variables: none
- Data/backfill/release steps: run the normal deployment migration phase. Existing assignment notes and priority values are deleted; existing task types are normalized from content workflow status before conversion to `AssignmentTaskType`.
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: assignment server actions and components, assignment target API, shared admin CSS, Prisma schema, and admin workflow documentation
- Expected conflicts: assignment workflow/dashboard work, `styles/globals.css`, or Prisma schema/migrations
- Rollback notes: application code can be reverted, but removed notes and priority data cannot be recovered from the migrations. Restoring the removed columns or enum requires a forward migration.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
