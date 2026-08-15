# Release Handoff: codex/admin-user-profile-fields

- Status: queued
- Branch: `codex/admin-user-profile-fields`
- Commit: `6fdf63dc89d2f216dbc5a3e7cae2d0b76205a7f5`
- Owner/agent: `aporu`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Adds optional Name, Spiritual Name, Telegram ID, and Instagram ID fields to admin user creation and editing.
- Uses one shared display-name fallback across admin user cards, assignments, presence, review attribution, and editorial bylines: Spiritual Name, Name, Telegram ID, Instagram ID, then email.
- Adds focused tests for the fallback order and whitespace handling.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed (169 tests)

## Deploy Notes

- Migrations: `20260815120000_user_profile_fields` adds three nullable columns to `User`; `name` already exists.
- Environment variables: none
- Data/backfill/release steps: apply the Prisma migration through the normal deployment migration phase; no backfill is required.
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: Prisma `User` model, admin user management, shared user labels in assignments and editorial review.
- Expected conflicts: assignment workflow UI may conflict with branches editing the same reviewer/assignee labels; this branch is rebased onto `origin/main` at `7eec21e`.
- Rollback notes: revert `6fdf63d` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
