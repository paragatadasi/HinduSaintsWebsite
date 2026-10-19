# Release Handoff: codex/tree-touch-inventory-fixes

- Status: ready
- Branch: `codex/tree-touch-inventory-fixes`
- Commit: `0eb8bbb88686b7de3e90e2c030034e1ebc07f88a`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Keep phone tree drags active when pointer capture transfers from an SVG child to the viewport. Previously the bubbled capture-loss event stopped tracking the finger after the initial movement.
- Add shared family trees below biographies in Vrindavan main inventory dialogs, with exact reviewed saint IDs and current family context. Proposal-search dialogs already included trees; this separate inventory dialog did not.

## Verification

- `npm run dev:check`: passed
- `npm run codex:verify`: passed (production build).
- `npm run prepare:deployment`: passed.
- 27 focused touch, camera, layout, tree-option and source tests: passed.
- `git diff --check`: passed.
- Physical phone and authenticated production inventory smoke checks remain required; local regression tests exercise capture transfer, full swipe movement, pinch and tap behavior.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready now
- Production smoke: on a phone, search Jagad Bandhu Sundar in the Vrindavan main inventory, open the card, verify the family tree appears below the biography, open Explore, then swipe across cards and blank canvas and pinch. Confirm long swipes keep following the finger and taps still select saints.

## Risk And Conflicts

- Shared areas touched: museum-live-trees, use-museum-tree-touch, museum-tree-options, Vrindavan inventory route and card dialog, museum integration documentation.
- Expected conflicts: no known conflicts. A separate inventory shared-name-search task is in progress; this branch does not alter its search readers or matching rules.
- Rollback notes: revert `0eb8bbb` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
