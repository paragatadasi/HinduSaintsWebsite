# Release Handoff: codex/museum-tree-overview

- Status: ready
- Branch: `codex/museum-tree-overview`
- Commit: `dd4877d03527c418b94ce4c8eabe1fc93d87ee53`
- Owner/agent: Citra
- Bundle priority: immediate release candidate; user explicitly requested tree and placement-symbol changes deployed together

## Summary

- Shared desktop/mobile whole-family overview preserves generation rows, with focus and neighborhood outlines and a separate museum-record presence key.
- Select a map card or a saint by name to explore readable Teachers, Disciples, Partners and Incarnation groups. Back and Return to selected saint preserve context; Whole family reopens the overview. Full-screen labeled graph and zoom remain available.
- Solid connections replace dashed styling; review/source evidence remains explicit in expandable details. Compact name/date cards omit repetitive Source inventory and inferred-head labels. Cycle warnings remain distinct from lineage shortcuts; no historical corrections are inferred.
- Shared placement symbols replace repeated Proposed/Planned/Implemented labels: clock/list/check, with accessible names, tooltips, one legend, and tap-to-open existing saint placement details. Per-saint status semantics remain unchanged.
- Design-system and museum integration documentation updated.

## Verification

- `npm run dev:check`: passed.
- `npm run prepare:deployment`: passed before final one-line cycle warning; final production verification includes type checking.
- `npm run codex:verify`: passed on final code commit dd4877d.
- Focused tree layout/options/source and navigation tests: 21 passed, including direct neighborhood direction and unwrapped generation rows.
- Browser: real 16-saint Gaudiya reference fixture at desktop and 390px width. Verified no horizontal page overflow (375px content/scroll width), compact 128px mobile overview, named selection showing 9 direct disciples, keyboard map activation, full-screen controls, and Planned status button activation.
- Temporary fixture removed. Local checks used reference data, not authenticated production API; release smoke still needed for actual museum cards and data.

## Deploy Notes

- Migrations: none.
- Environment variables: none.
- Data/backfill/release steps: none. No relationship or museum record writes.
- Queue/deploy trigger: ready now; deploy both changes together under standing release-captain authorization.
- Smoke: SPN and Vrindavan family panels and saint overviews; map selection, return/back, collapsed map reopening, full screen and selected-saint context. Family member status icons should open the same saint overview and retain explicit arrangement text there. Research alerts remain independent.
- FAM-073 contains source relationship direction conflicts per data audit; warning is intentional. Do not correct/import historical direction as part of this UI release.

## Risk And Conflicts

- Shared areas touched: museum live trees, section workspace, new arrangement indicator, tree geometry/helper/tests, global styles/tokens and docs.
- No API/auth/schema changes. Review conflicts with concurrent museum renderer/CSS changes.
- Whole-family map intentionally omits names; keyboard activation, named selector and full-screen labeled graph provide alternatives to tiny touch targets. Unlinked source identities remain unknown, not absent.
- Full-screen graph still uses its own scroll/zoom workspace; inline cards scroll with the page.
- Rollback: revert dd4877d and 0184eb9 and dependent handoff; no data rollback needed.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
