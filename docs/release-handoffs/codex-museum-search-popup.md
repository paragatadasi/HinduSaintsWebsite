# Release Handoff: codex/museum-search-popup

- Status: queued
- Branch: `codex/museum-search-popup`
- Commit: `a0cb36b12df7bd6e87a05685802fb26b5f148c87`
- Owner/agent: Simple UX Fixes
- Bundle priority: queue for next major/bundled deployment

## Summary

- Overall museum proposal search results open the same biography-first saint dialog used within section pages, instead of navigating directly to a section.
- Section name inside the dialog links to its configured section slug. Preserves photos, relationships, collection/vitrine facts, review actions, and authorized family moves.
- Extracts the existing popup into a shared component to prevent the two search experiences diverging.

## Verification

- `npm run queue:deployment`: passed (Prisma generation and TypeScript).
- `git diff --check`: passed.
- Local browser fixture: Visnudas result opens dialog without navigating; custom section slug link verified; Escape closes and returns focus to result.
- Temporary fixture and layout override removed. Integrated production build remains release captain gate; no live database changes.

## Deploy Notes

- Migrations: none.
- Environment variables: none.
- Data/backfill/release steps: none.
- Queue/deploy trigger: queued for the next requested or compatible automatic/bundled release.

## Risk And Conflicts

- Shared areas touched: museum index and section workspace, shared saint dialog and search-results components, shared CSS.
- Expected conflicts: older queued `codex/museum-shared-search` overlaps index/dialog/workspace and predates biography and collection changes. This branch implements its search-popup behavior on current main without reverting recent UX. Its separate search-matching improvements are not included; reconcile those independently rather than blindly merging the old UI.
- Existing protected museum authorization is retained; manage_museum controls family-move visibility.
- Rollback notes: revert `a0cb36b` and dependent integration changes; no database rollback required.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
