# Release Handoff: codex/vrindavan-visitor-flow-order

- Status: ready
- Branch: `codex/vrindavan-visitor-flow-order`
- Commit: `1acd51003805fbe98987be6c27cedf96dcebe7ce`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Add shared researched visitor ordering for region/subsection navigation, overview and planner consumers; retain existing subsection names/slugs/parents and all saved area plans.
- Keep visitor positions separate from stable region keys and book chapter references; preserve full research evidence and caveats in a data file.

## Verification

- `npm run dev:check` and `npm run prepare:deployment`: passed.
- 17 policy/navigation/working-domain tests passed, including bridge adjacency, parent/count preservation and shuffled-input order.
- Small client-safe metadata change; release captain owns integrated production-build verification. No dependency, auth, routing, schema or migration changes.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none. Display order only; no saint/subsection parent/family/physical changes. Requires region/subsection guard6971019 first (included in this branch ancestry). Citra will adapt planner palette to consume shared vrindavanRegionGroups.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: lib/vrindavan-lineage-catalogue.ts shared grouping helper, lib/museum-navigation.ts and tests; new compact lib/vrindavan-visitor-flow.ts; research data and documentation. No planner UI files touched.
- Expected conflicts: depends on codex/vrindavan-region-subsection-guard. Integrate that guard before this order commit; avoid reintroducing released ready handoffs from branch ancestry. Citra explicitly made no ordering edits and owns planner consumption.
- Rollback notes: revert `1acd510` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
