# Release Handoff: codex/museum-shared-search

- Status: queued
- Branch: `codex/museum-shared-search`
- Commit: `cfe99e0fa151c307dc45bb3bbe958e5e2d62b7f1`
- Owner/agent: `Search Logic`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Use shared text matching for museum proposals, section search, and placement review; Anandamayi matches Anandamoyi.
- Open the reusable Saint Proposal dialog directly from search results; retain preview controls, keyboard focus, and wrap long reference values.

## Verification

- dev:check passed; 27 targeted search and museum access tests passed; local component browser preview verified opening, preview edits, Escape closing, focus restoration and layout. Integrated production build remains with release captain.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No migrations, backfill, or environment changes. Historical exports remain reference-only; no data writes added. Smoke-test Anandamayi Ma and opening its proposal card after release.
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: Museum proposal/search helpers, museum index and review pages, section workspace, shared proposal dialog, and museum classes in styles/globals.css.
- Expected conflicts: No known conflicts. Review overlap with museum UX changes and shared styles. Compatible with separately queued codex/shared-search-refinement; no changes to lib/search-text.ts in this branch.
- Rollback notes: revert `cfe99e0` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
