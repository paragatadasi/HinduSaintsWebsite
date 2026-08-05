# Release Handoff: codex/admin-assignments

- Status: ready
- Branch: `codex/admin-assignments`
- Commit: `fd53050ba08f50489bdc96ea1140c6ba6f1c7ee0`
- Owner/agent: `aporu`

## Summary

- Adds cross-content assignments for Saints, Traditions, Places, and Instagram posts.
- Adds personalized My Work, Available, Blocked, Recently Completed, and authorized
  Team Workload views, self-claiming, lifecycle updates, reassignments, and dashboard badges.
- Keeps assignment completion separate from capability-controlled publication.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed (81 tests)
- `npm run codex:verify`: compiled, type-checked, collected page data, and generated
  all static pages; known Windows junction `EPERM` occurred only during standalone trace copying.

## Deploy Notes

- Migrations: `20260805180000_content_assignments`
- Environment variables: none
- Data/backfill/release steps: apply the migration in the deployment migrate/release
  phase before serving assignment queries; no backfill is required.

## Risk And Conflicts

- Shared areas touched: `app/admin/layout.tsx`, `app/admin/page.tsx`,
  `lib/permissions.ts`, `prisma/schema.prisma`, admin-overhaul documentation
- Expected conflicts: none
- Rollback notes: revert `fd53050` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
