# Release Handoff: codex/show-all-featured-saints

- Status: queued
- Branch: `codex/show-all-featured-saints`
- Commit: `cfc56ac551f4efe28df8ddcc561cbedb1d49c138`
- Owner/agent: `aporu`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Removes the homepage featured-saint cap so admins can curate any number of published saints.
- Shows 12 randomly selected published saints when no homepage saint list is configured.
- Extends the homepage Instagram carousel preview limit from 8 to 16.

## Verification

- npm run dev:check: passed; npm test: 107 passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: app/page.tsx, lib/public-saints.ts, lib/public-instagram.ts, and homepage admin configuration
- Expected conflicts: Homepage configuration or public homepage data-query changes may require manual review.
- Rollback notes: revert `cfc56ac` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
