# Release Handoff: codex/cookie-notice-language

- Status: queued
- Branch: `codex/cookie-notice-language`
- Commit: `b12f10d645af6d61dd51cc9c8464aa9a6bde47b1`
- Owner/agent: `aporu`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Updates the cookie-notice explanation from “to remember this notice” to “to
  ensure this cookie notice is displayed to new users.”
- Changes “authorised editors” to “authorized editors.”

## Verification

- `npm run dev:check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: `components/privacy/cookie-notice.tsx`
- Expected conflicts: only if another queued branch edits the same notice copy
- Rollback notes: revert `b12f10d` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
