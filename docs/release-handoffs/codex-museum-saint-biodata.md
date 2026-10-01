# Release Handoff: codex/museum-saint-biodata

- Status: queued
- Branch: `codex/museum-saint-biodata`
- Commit: `6dff7f24868c33ad60bac870af8a4865051d50b5`
- Owner/agent: Simple UX Fixes
- Bundle priority: queue for next major/bundled deployment

## Summary

- Lead museum saint popups with canonical biography, photos, era, readable dates, places, traditions, and expandable introduction using the public gallery and summary components.
- Follow with relationships and museum placement/actions; collapse longer proposal notes while preserving source details.
- Add an authenticated section-level profile lookup, graceful missing-photo/unlinked fallbacks, and a native dialog with keyboard dismissal.

## Verification

- `npm run queue:deployment`: passed (Prisma generation and TypeScript).
- `git diff --check`: passed.
- Local browser fixture checks passed: desktop layout, gallery navigation, expandable introduction, Escape dismissal, missing-photo/unlinked fallback, and 390px mobile layout (dialog scroll width equals client width).
- Temporary preview route/layout were removed/restored. No live database records were changed or used to validate the new profile lookup.
- Integrated production build remains the release captain's gate.

## Deploy Notes

- Migrations: none introduced by this feature.
- Environment variables: none.
- Data/backfill/release steps: none.
- Queue/deploy trigger: queued until next requested or compatible bundled deployment; not an immediate release request.

## Risk And Conflicts

- Shared areas touched: museum section page/workspace, shared styles and tokens; new private profile reader/type and admin profile component.
- Expected conflicts: based on clickable-family branch, now reported integrated by release captain. No need to integrate that feature twice. Preserve museum collections fields and newer main changes. This feature does not modify museum-working-data/view or collection data contracts.
- New profile lookup is batched by section saint IDs; existing access_museum authorization precedes the lookup. Public content routes remain unchanged.
- Rollback notes: revert feature commit `6dff7f2` and dependent integration changes; no database rollback needed.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
