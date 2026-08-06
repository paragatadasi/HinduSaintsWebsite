# Release Handoff: codex/admin-durable-drafts

- Status: ready
- Branch: `codex/admin-durable-drafts`
- Commit: `f3ee9532d28eab4e66ce5f3a4fffe10d62a5fabe`
- Owner/agent: `aporu`

## Summary

- Adds shared, versioned server-side editorial drafts plus browser recovery and autosave for the core Saint, Tradition, and Place editing sections without changing live public values.
- Makes live content mutation, version advancement, and draft cleanup atomic, with explicit conflict/rebase handling, session-expiry recovery, and an admin error boundary.
- Documents the draft lifecycle and preserves explicit-save behavior for relationship, media, and import workflows that are not safe to autosave generically.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed (91 tests)
- `npm run codex:verify`: application compiled, type-checked, and generated 14 pages; the command ended nonzero only at the known Windows standalone trace-copy step because the worktree uses a `node_modules` junction (`EPERM`).

## Deploy Notes

- Migrations: apply `prisma/migrations/20260806120000_admin_editorial_drafts/migration.sql` in the deployment migrate/release phase before rolling out the web application.
- Environment variables: none
- Data/backfill/release steps: no backfill; the `AdminEditorialDraft` table starts empty.

## Risk And Conflicts

- Shared areas touched: Prisma schema/migrations, admin content editor pages/actions, admin conflict/session/error handling, the shared admin form guard, and shared admin CSS.
- Expected conflicts: branches editing the same Saint/Tradition/Place detail pages or actions, `lib/admin-conflicts.ts`, `prisma/schema.prisma`, or `styles/globals.css`.
- Rollback notes: revert `f3ee953` and dependent release commits. The additive draft table can remain unused after an application rollback; only remove it later through a coordinated migration after confirming it contains no drafts that must be retained.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
