# Release Handoff: codex/readable-museum-trees

- Status: ready
- Branch: `codex/readable-museum-trees`
- Commit: `12bb7241abe76c5b1a27e93ff15d6579a24781d8`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Tree cards start at readable site text size; optional compact date-ordered peer bands reduce width while retaining hierarchy and partner adjacency. Wide layout and Fit overview remain available.
- Full-screen native dialog reuses the tree; nested saint details close independently and restore focus. Fit-relative zoom, mobile framing, expandable explanations.
- Main comparison list matches original section reference trees (four in Gaudiya); extra same-section families/individuals are under a disclosure, with explicit membership scoping.

## Verification

- `npm run prepare:deployment`: passed (includes dev:check).
- `npm run codex:verify`: passed. Existing CSS autoprefixer warnings only.
- Layout/source/options tests: 15 passed, including chronology/wrapping, partner adjacency, no overlap, lineage ordering and section isolation.
- Local fixture browser checks at desktop and 390px: 16px node/body text parity, no document horizontal overflow, full-screen behavior, Fit68% to Zoom93%, nested saint details/Escape/focus restoration, mobile card framing. Temporary fixture removed.
- No production authenticated UI verification or database mutations performed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none. This release does not import relationship records.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: shared museum tree renderer/layout/options, shared MuseumDetailDialog full-screen variant and nested close handling, design tokens/CSS and museum docs.
- Expected conflicts: adjacent museum docs/CSS changes possible. Based on already deployed source-comparison 5de2646; preserve release cleanup of prior handoffs. Compatible with separate family-relationship reconciliation branch; no API/reader/write changes.
- Rollback notes: revert `12bb724` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
