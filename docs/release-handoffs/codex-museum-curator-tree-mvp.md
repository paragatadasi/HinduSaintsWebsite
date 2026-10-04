# Release Handoff: codex/museum-curator-tree-mvp

- Status: ready
- Branch: `codex/museum-curator-tree-mvp`
- Commit: `680fcb1a806980b22d2a7b2b3c0ae19644da70fd`
- Owner/agent: Citra
- Bundle priority: immediate release candidate; user requested MVP deployment before mobile planning

## Summary

- Shared museum navigation has larger primary headings, no redundant category subtitles, Choose Museum, and Section overview under Section proposals with Browse sections collapsed initially.
- Live diagrams replace the original SVG display section. Singleton family choices and isolated graph nodes are excluded; groups without actual connections show a message instead of a diagram.
- Inline diagrams fit their available width, wrap peers into compact rows, and expand vertically with page scrolling. Full-screen exploration retains zoom controls.
- Shared saint overviews load connected relationships below biography and above placement, highlighting the selected saint. Both museums use the same components.
- Updated design-system and museum integration documentation. Original SVG assets and preserved evidence remain private reference data.

## Verification

- `npm run dev:check`: passed.
- `npm run codex:verify`: passed; existing CSS autoprefixer warnings only.
- `npm run prepare:deployment`: passed.
- Focused tree layout/options/source and museum navigation tests: 19 passed.
- Local browser fixture using the real 16-person Gaudiya reference: inline viewport 925px wide with scrollWidth 925px; height and scrollHeight both 2074px; overflow visible. Verified selected highlight, collapsed navigation, full-screen and readable-size controls.
- Temporary preview route removed before build and commit. No local database configured, so authenticated API-to-saint-dialog behavior requires production smoke verification.

## Deploy Notes

- Migrations: none.
- Environment variables: none.
- Data/backfill/release steps: none; no relationship imports or museum record writes.
- Queue/deploy trigger: ready now under standing user authorization to coordinate directly with release captain.
- Smoke: open SPN and Vrindavan section overviews; confirm navigation grouping, multi-member family diagrams, whole-page tree scrolling, and selected-saint tree between biography and placement. Check source-only and linked saint cards. A tree request failure should leave placement controls usable and offer Retry.

## Risk And Conflicts

- Shared areas: museum navigation, live tree renderer, saint dialog, section workspace, tree layout/options, shared CSS/tokens, design and museum docs.
- Expected conflicts: any concurrent edits to these shared museum components; based on origin/main 2eb8b7b.
- Tree requests remain bounded and protected by existing access checks. This release does not change API permissions or canonical relationships.
- Multi-member families with no known relationships can show a no-connections message when opened; no empty tree is rendered.
- Narrow-screen dedicated exploration is the next design phase; inline diagrams currently fit to width, with full-screen available.
- Rollback: revert feature commit 680fcb1 and dependent handoff; no data rollback needed.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
