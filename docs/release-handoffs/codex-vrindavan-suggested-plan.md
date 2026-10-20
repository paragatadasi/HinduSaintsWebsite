# Release Handoff: codex/vrindavan-suggested-plan

- Status: `ready`
- Branch: `codex/vrindavan-suggested-plan`
- Commit: `e061d506332f3dcc8eec645d248deda292da73dc`
- Owner/agent: Citra
- Bundle priority: immediate release candidate

## Summary

- Suggest a Plan for Me opens a room-map/group preview based on Saarthi's numbered section flow and Nadi's frame/source evidence. Explicit Load saves eligible destinations as Planned; no physical move is asserted.
- Preserves current saved areas, existing exact/flexible plans and historical confirmations; other sections cannot automatically occupy an existing reservation. Shared-source and provisional display groups stay together; specific primary traditions provide capped within-section affinity.
- Clear suggested plan uses audit provenance and per-record versions to remove only unchanged suggestions. Later edits, implementation, original areas and plans survive.
- Upper-row preference appears in preview and the move companion. Actual shelves remain optional/blank. Frame counts are source entries, not measured capacity. Context holds and unresolved source identities remain excluded.

## Verification

- `npm run prepare:deployment`: passed on final code.
- `npm run codex:verify`: passed on final code (normal filesystem access needed after sandbox EPERM on generated build directory).
- `npx tsx --test lib/museum-suggested-plan.test.ts lib/museum-move-planner-domain.test.ts lib/museum-relic-packaging.test.ts`: 26 passed.
- `scripts/verify-museum-suggested-plan.ts` against disposable localhost Docker DB: passed preview-read-only, stale/replay, existing area/plan, later edit and implemented preservation, clear and unchanged source/physical records.
- Saarthi and Nadi reviewed the 400-saint snapshot draft, with no mandatory capacity-driven area changes. Added Nadi's final conditional Madhu Gujarat-context hold; runtime regeneration uses her already-deployed correction.
- Browser visual check could not connect to local preview (connection timeout). Temporary synthetic preview route/components were removed. Please verify protected production preview visually; do not apply a real plan as a smoke test.

## Deploy Notes

- Migrations: none.
- Environment variables: none.
- Data/backfill: none; does not apply any production plan during deployment. Curator previews and loads it explicitly.
- Depends on prior connected-planner66c06f6 (already ancestral). Nadi shelf parser07336c1 and canonical correction163d0a7 are compatible; correction already reported deployed.
- Ready now under standing release authorization.

## Risk And Conflicts

- Shared files: lib/museum-move-planner.ts, lib/museum-move-planner-domain.ts, plan/actions.ts, museum-move-planner.tsx, museum-move-list.tsx, docs/design-system.md.
- Preserve Nadi's additive sourceShelfPosition fields alongside new traditionIds/suggestionId fields when integrating. No parser logic replaced.
- Automatic suggestions are provisional. No measured capacity exists; especially check Tamil24, Kashi5, frame changes16/17 and availability18–22. Photos remain unknown independently of frames.
- Snapshot produced348 suggestions/52 holds before Nadi's Madhu correction; don't hard-code this count. Fresh live state may yield different totals.
- Rollback code does not erase saved plans/audits. Prefer Clear suggested plan before rollback if users want to remove unchanged generated destinations.

## Release Captain Notes

- Integrated into main: pending
- Pushed to main: no
- Merged to deploy: pending
- Production workflow: pending
