# Release Handoff: codex/editorial-revision-preview

- Status: queued
- Branch: `codex/editorial-revision-preview`
- Commit: `7f74a2db6506affdbe09f60287ab9c69550961de`
- Owner/agent: `aporu`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Adds authenticated, noindexed previews that render Saint, Tradition, and Place public-page templates with an active editorial revision overlaid on the published content.
- Adds preview actions to entity review pages and the Site Admin/Editor Dashboard review queue while preserving existing publish permissions and Saint visibility rules.
- Extracts reusable public detail-page bodies, removes the obsolete sample Saint preview route, and documents the preview workflow and design contract.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed (150 tests)
- `npm run codex:verify`: passed (production build and 16/16 generated pages; existing Autoprefixer warnings only)
- `git diff --check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: public Saint, Tradition, and Place detail templates/loaders; admin editorial review queue; shared admin preview styles.
- Expected conflicts: none against `main` at `e6a2d9b`; the earlier Saint detail-page conflict was resolved by carrying the current “View all saints” action into the shared live/preview renderer.
- Rollback notes: revert `7f74a2d` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
