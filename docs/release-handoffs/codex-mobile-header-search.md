# Release Handoff: codex/mobile-header-search

- Status: queued
- Branch: `codex/mobile-header-search`
- Commit: `d7d771cb032c0bc81870afe8c373a5cba3fa4237`
- Owner/agent: `Simple UX Fixes`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Keep the expanding header search in the navigation row, pushing links left without horizontal page movement or overlapping them. Focus the input synchronously and close on Escape or focus leaving the form.

## Verification

- `npm run dev:check`: passed

- Browser verification: passed at 320px, 390px, and 1280px; search remains in bounds, page position is unchanged, links make room without overlap, focus/typing/Escape/submission work. Physical phone keyboard behavior remains unverified.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: components/layout/header-search.tsx, components/layout/site-header.tsx, styles/globals.css, styles/tokens.css
- Expected conflicts: low risk; possible overlap with shared header or navigation style changes.
- Rollback notes: revert `d7d771c` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
