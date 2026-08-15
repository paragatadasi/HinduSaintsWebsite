# Release Handoff: codex/about-hero-share-preview

- Status: queued
- Branch: `codex/about-hero-share-preview`
- Commit: `16c29db382b85c260573c14ba547297f572b7bfa`
- Owner/agent: `aporu`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Use the current CMS-configured About hero image for Open Graph and Twitter previews instead of the legacy static fallback image.
- Reuse the shared focal-point-aware 1200x630 social JPEG route so future About hero replacements automatically update preview metadata.

## Verification

- `npm run dev:check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: `app/about/page.tsx` metadata only
- Expected conflicts: possible only if another queued change modifies About-page metadata
- Rollback notes: revert `16c29db` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
