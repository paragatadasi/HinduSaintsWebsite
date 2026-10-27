# Release Handoff: codex/museum-assistant-accounts

- Status: ready
- Branch: `codex/museum-assistant-accounts`
- Commit: `d5c7f1c878218c2c821899ae62b1fffb14cd2fdb`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Site Admin-created username/password Museum Assistant accounts; read-only museum browsing and own intake submissions only.
- Password reset and deactivation revoke sessions; existing Google/email sign-in preserved.

## Verification

- dev:check PASS; codex:verify PASS (elevated Windows packaging retry); npm test 585 passed, 0 failed, 1 skipped; disposable migration and real HTTP assistant/own-intake/denial/reset/logout checks PASS.

## Deploy Notes

- Migrations: 20261027040000_museum_assistant_accounts: nullable User.email, role, credential and throttle tables. Apply in release migration phase.
- Environment variables: No new variables. Verify existing AUTH_SECRET and canonical HTTPS AUTH_URL/NEXTAUTH_URL. Keep Airtable delivery disabled; preserve private intake storage settings.
- Data/backfill/release steps: No account creation or backfill. Airtable delivery remains disabled; no delivery worker enabled. Full intake dependency is merged on this branch.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Auth, admin access, permissions, users UI/actions, museum layouts/navigation/read guards, Prisma schema, design guidance.
- Expected conflicts: Intake base was merged into this branch; preserve release-captain cleanup of prior intake handoffs. Backend 05e7c7c is already cherry-picked here as 69f80ad; do not integrate twice.
- Rollback notes: do not restore User.email NOT NULL while username accounts exist. Older code may not support the new role/null emails; prefer disabling affected accounts and a forward fix. Preserve private intake storage/public media guard. This release includes the complete feature history, not only the final test commit.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
