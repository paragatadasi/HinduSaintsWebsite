# Release Handoff: codex/fix-oauth-account-link

- Status: ready
- Branch: `codex/fix-oauth-account-link`
- Commit: `38a8703b4f96380aaacaf8a3adaccf49086d00bb`
- Owner/agent: `aporu`

## Summary

- Allows Auth.js to link a verified Google OAuth identity to an approved user record pre-created by Users & Access or allowlist grandfathering.
- Fixes the production `OAuthAccountNotLinked` lockout while retaining database-backed active-user authorization.

## Verification

- `npm run dev:check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none

## Risk And Conflicts

- Shared areas touched: `lib/auth.ts` Google provider configuration.
- Expected conflicts: only with concurrent authentication configuration changes.
- Rollback notes: revert `38a8703` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
