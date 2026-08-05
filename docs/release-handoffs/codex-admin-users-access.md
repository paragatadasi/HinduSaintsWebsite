# Release Handoff: codex/admin-users-access

- Status: ready
- Branch: `codex/admin-users-access`
- Commit: `8bcadd884a79110ecd39d3cd691f3e2cd6b41d4d`
- Owner/agent: `aporu`

## Summary

- Completes Users & Access with user approval by email, additive roles, activation/deactivation, inline outcome feedback, and existing last-admin/self-demotion safeguards.
- Records last Google sign-in and a durable audit history for approvals, role changes, activations, and deactivations.
- Moves the renamed destructive-action password from the dashboard into Users & Access and documents the allowlist as bootstrap-only.
- Advances `docs/admin-overhaul-workflow.md` to the Source Data and reconciliation resume point.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed (76 tests)
- `npm run codex:verify`: compilation, type validation, page-data collection, and all 10 static pages passed; final standalone trace-copy failed on the known Windows isolated-worktree `node_modules` junction restriction.

## Deploy Notes

- Migrations: `20260805100000_admin_access_audit` adds `User.lastSignedInAt` and creates `AdminAccessAudit`.
- Environment variables: none
- Data/backfill/release steps: run the migration in the deployment migrate/release phase before serving the new application. Existing users require no backfill; their last sign-in remains empty until their next successful login.

## Risk And Conflicts

- Shared areas touched: Prisma User model, NextAuth sign-in event, Users & Access routes/actions, dashboard, admin secret action, and workflow documentation.
- Expected conflicts: integrate after other schema/Auth changes; preserve migration ordering and the existing OAuth account-linking configuration.
- Rollback notes: revert `8bcadd8` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
