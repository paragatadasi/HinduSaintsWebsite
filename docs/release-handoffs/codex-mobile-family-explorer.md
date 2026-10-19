# Release Handoff: codex/mobile-family-explorer

- Status: ready
- Branch: `codex/mobile-family-explorer`
- Commit: `1314bbecf1cffb17cc867d271974f93727c59327`
- Owner/agent: Citra
- Bundle priority: immediate release candidate

## Summary

- Mobile labeled previews preserve normal page scrolling and open an immersive Explore tree viewer.
- One-finger touch pans; two-finger pinch preserves the midpoint anchor. Named selection, keyboard navigation, zoom buttons and Recenter remain available.
- Narrow mobile cards wrap names without reducing font size or wrapping sibling generations. Whole-family corner map shows selection and viewport bounds with a large Fit whole family target.
- Expandable bottom saint details preserve camera position. Tree/source settings start collapsed. Shared SPN, Vrindavan and saint-dialog renderer; desktop retains its labeled graph and controls.

## Verification

- `npm run dev:check`: passed.
- `npm run codex:verify`: passed with elevated filesystem access; existing stylesheet autoprefixer warnings remain non-blocking.
- `npm run prepare:deployment`: passed.
- `npx tsx --test lib/museum-tree-camera.test.ts lib/museum-tree-layout.test.ts lib/museum-tree-source.test.ts lib/museum-tree-options.test.ts`: 23 passed, including midpoint zoom, zoom bounds, mobile name wrapping and sibling generations.
- Browser fixture smoke at 390x844, 320x740 and desktop 1280x900: open/close explorer, select saint, fit/recenter, keyboard pan and minimap viewport tracking, details open/close retaining exact scroll position, desktop controls/card width restored, fullscreen selection retained. At 320px dialog clientWidth and scrollWidth both 303px.
- Temporary Gaudiya FAM-001 fixture route removed before final verification. Docker was unavailable; no live authenticated API/DB checks. Browser tooling did not provide physical multi-touch input: gesture math is regression-tested, but actual phone pinch/pan remains a device smoke check.

## Deploy Notes

- Migrations: none.
- Environment variables: none.
- Data/backfill/release steps: none.
- Queue/deploy trigger: ready now; user explicitly requested implementation and release-captain coordination to deploy.
- Production smoke: open a family in SPN and Vrindavan and a saint dialog, open mobile explorer, pan/pinch on iOS/Android, select a saint, fit/recenter, expand/collapse details, close explorer. Confirm sources and evidence remain accessible from the page and selected-saint details.

## Risk And Conflicts

- Shared areas touched: museum-live-trees.tsx, new use-museum-tree-touch hook, museum-tree-layout.ts, new camera helpers/tests, globals.css, tokens.css, design-system and museum-data-integration docs.
- Expected conflicts: other active tree-renderer, layout or shared CSS work. No API, schema, auth, dependency, route or record changes.
- Mobile gesture capture is scoped to the immersive viewer; preview page swipes remain native. Source identity and museum evidence semantics are unchanged.
- Rollback notes: revert `1314bbe` and dependent release commits.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
