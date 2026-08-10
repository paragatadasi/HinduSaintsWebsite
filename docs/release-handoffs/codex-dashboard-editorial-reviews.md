# Release Handoff: codex/dashboard-editorial-reviews

- Status: queued
- Branch: `codex/dashboard-editorial-reviews`
- Commit: `7d862e0a551eb649fb3fca739815669e373e9e41`
- Owner/agent: `aporu`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Moves the actionable submitted narrative-revision queue into the main admin Dashboard for users with the `site_admin` or `editor` role.
- Removes the duplicated Editorial Reviews sidebar destination and dashboard count card.
- Preserves old `/admin/revisions` bookmarks by redirecting authorized reviewers to the Dashboard queue anchor.
- Centralizes and tests the exact role rule, and updates the admin design/workflow documentation.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed (133 tests)
- `git diff --check`: passed
- Local visual preview: not run because Docker Desktop was unavailable for the development database

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: admin layout/navigation, admin Dashboard, editorial-review route, shared permissions helper/tests, shared review-row heading styles, and admin workflow documentation
- Expected conflicts: reconcile carefully with concurrent changes to `app/admin/layout.tsx`, `app/admin/page.tsx`, `lib/permissions.ts`, or the shared review-row styles
- Rollback notes: revert `7d862e0` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
