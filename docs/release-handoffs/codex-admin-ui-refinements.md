# Release Handoff: codex/admin-ui-refinements

- Status: ready
- Branch: `codex/admin-ui-refinements`
- Commit: `e703ab4dfbdcca2c174f6e777b87a8448f9f6b42`
- Owner/agent: `aporu`
- Bundle priority: immediate release candidate

## Summary

- Align the Admin CMS and Museum Admin sign-in screens with the shared admin design system through one responsive access component.
- Let the Saint Overview short description span the full summary-card width below the identity fields.
- Prevent task-status eligibility checks from raising validation before submission; genuine errors now use clean field labels and clear when corrected.
- Add passwordless Resend sign-in links for approved Yahoo, Outlook/Hotmail, Gmail, and private-domain admin accounts while retaining optional Google OAuth.
- Use 15-minute, single-use verification tokens, throttle approved-address requests, and return the same neutral confirmation for unknown, inactive, or throttled addresses.

## Verification

- `npm run dev:check`: passed; `npm test`: 163 passed; `npm run codex:verify`: passed

## Deploy Notes

- Migrations: none
- Environment variables: set `AUTH_RESEND_KEY` and `AUTH_EMAIL_FROM` to enable passwordless email; existing Google OAuth variables remain optional and supported
- Data/backfill/release steps: verify the `AUTH_EMAIL_FROM` sending domain in Resend before enabling the production variables; no backfill required
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Auth.js provider configuration, admin layouts and sign-in UI, shared admin form validation, and global admin design-system styles/tokens
- Expected conflicts: possible overlap with concurrent authentication, admin layout, validation-guard, or global-style changes
- Rollback notes: revert `e703ab4` and `67849c8` plus any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
