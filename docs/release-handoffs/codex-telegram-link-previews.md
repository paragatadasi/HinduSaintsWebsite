# Release Handoff: codex/telegram-link-previews

- Status: ready
- Branch: `codex/telegram-link-previews`
- Commit: `d495bd5e0f052bfecaa6ad573300005124667736`
- Owner/agent: `aporu`

## Summary

- Adds canonical, Open Graph, and Twitter large-image metadata for the homepage and `/saints` directory.
- Reuses the existing devotional hero artwork and resolves canonical/image URLs through the existing `PUBLIC_SITE_URL` setting.

## Verification

- `npm run dev:check`: passed
- `npm run codex:verify`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none

## Risk And Conflicts

- Shared areas touched: root metadata configuration in `app/layout.tsx`
- Expected conflicts: none
- Rollback notes: revert `d495bd5` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
