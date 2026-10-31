# Release Handoff: codex/museum-assistant-full-access

- Status: `ready`
- Branch: `codex/museum-assistant-full-access`
- Commit: `8daec4ba579280bdffc7729b4145b9390c592c1e`
- Owner/agent: Citra
- Bundle priority: Immediate user-requested permission expansion

## Summary

- User explicitly authorized assistants access to everything in museum for now. Add manage_museum to Museum Assistant for both museums: planning, clearing, physical moves, corrections, tasks, intake review/approval.
- Main-site editorial, publishing, imports, user/site management remain unavailable. Existing museum domain validations and special restricted editorial records remain enforced.
- Existing username accounts stay Museum Assistant; no new passwords or user data changes. No automatic expiry; future reversal is explicit.
- Update account-creation copy and role documentation. Earlier narrow-assistant rules in documentation are historical.

## Verification

- 21 focused permission/password/physical-move-domain tests passed.
- npm run dev:check passed.
- npm run prepare:deployment passed.
- npm run codex:verify: passed. Initial local attempt hit Windows .next EPERM; elevated rerun used.
- Release captain must run integrated auth-sensitive verification.

## Deploy Notes

- Migrations: none.
- Environment variables: none. Airtable delivery remains disabled.
- Backfill/data changes: none. Existing sessions read server roles/capabilities; refresh UI after deployment.
- All existing drafts, submissions, photos and physical-move records remain intact.

## Risk And Conflicts

- Shared areas: lib/permissions.ts; museum assistant account-form copy; permission tests.
- Broad museum access is intentional user authorization, including intake approvals and corrections.
- No broad main-site sensitive-action privilege granted.
- Rollback: revert capability addition and corresponding copy/tests.

## Release Captain Notes

- Main integration: pending
- Deploy integration: pending
- Workflow: pending

