# Release Handoff: codex/cookie-notice-language

- Status: queued
- Branch: `codex/cookie-notice-language`
- Commit: `0d7bd00bc0eff3e08d1531190cc01eec7694625a`
- Owner/agent: `aporu`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Updates the cookie-notice explanation from “to remember this notice” to “to
  ensure this cookie notice is displayed to new users.”
- Changes “authorised editors” to “authorized editors.”
- Styles the footer’s Cookie information control like the neutral Imprint and
  Privacy Policy links, leaving only Contact us in the accent color.

## Verification

- `npm run dev:check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: `components/privacy/cookie-notice.tsx` and
  `styles/globals.css`
- Expected conflicts: possible if another queued branch edits the cookie notice
  or public-footer styles
- Rollback notes: revert `0d7bd00`, `b12f10d`, and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
