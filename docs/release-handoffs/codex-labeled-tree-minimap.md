# Release Handoff: codex/labeled-tree-minimap

- Status: ready
- Branch: `codex/labeled-tree-minimap`
- Commit: `95b8cac013f38466c07f1615e10faeb61a566c82`
- Owner/agent: Citra
- Bundle priority: immediate release candidate

## Summary

- Restore names and dates directly on the main family tree, replacing the separate neighborhood cards.
- Add a small upper-right whole-family map. Selecting a saint in either diagram or the selector highlights both views and centers its labeled card.
- Preserve selection through full-screen mode, readable starting size, explicit fit/zoom controls, and saint details. Shared across SPN, Vrindavan, and saint dialogs.

## Verification

- `npm run dev:check`: passed.
- `npm run codex:verify`: passed with elevated filesystem access. Initial sandbox run passed compilation/types/page generation but failed standalone packaging with Windows EPERM; elevated rerun completed successfully.
- `npm run prepare:deployment`: passed.
- `npx tsx --test lib/museum-tree-layout.test.ts lib/museum-tree-source.test.ts lib/museum-tree-options.test.ts`: 19 passed.
- Browser preview using preserved Gaudiya FAM-001 data: desktop labels, selection highlight and centering verified; 390 x 844 mobile fullscreen selection survives closing; document clientWidth and scrollWidth both 375px. Temporary preview route removed before production build.
- Authenticated production API flow was not exercised locally; release smoke should open a family in both museums and a saint dialog, select a map node, and enter/exit fullscreen.

## Deploy Notes

- Migrations: none.
- Environment variables: none.
- Data/backfill/release steps: none. No relationship or museum records changed.
- Queue/deploy trigger: ready now under standing user authorization to coordinate deployment with the release captain.
- Main diagram starts at readable size in a bounded scroll viewport; corner map provides whole-family orientation. Fit overview remains explicit.

## Risk And Conflicts

- Shared areas touched: `components/admin/museum-live-trees.tsx`, `styles/globals.css`, `styles/tokens.css`, `docs/design-system.md`, `docs/museum-data-integration.md`.
- Expected conflicts: possible overlap with other tree renderer or shared stylesheet work; no API, schema, auth, or route changes.
- Existing provenance details, cycle warnings, museum presence semantics, solid connections, and placement status icons remain intact.
- Rollback notes: revert `95b8cac` and any dependent release commits.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
