# Release Handoff: codex/museum-guide-relationship-ui

- Status: ready
- Branch: `codex/museum-guide-relationship-ui`
- Commit: `d22150e785af226ef6724302b824c2a9532c0b51`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Paired Nadi backend and Citra UI: display all 63 guide research connections through typed private tree overlays and collapsible planner/section review groups.

## Verification

- codex:verify passed; final dev:check passed; 28 domain/adapter/layout tests passed; browser synthetic UI verified 17 groups, lazy diagram rendering, exact labels, context-only nodes, source evidence and destination-drift warnings; static browser chunks checked for manifest leakage; git diff --check passed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No schema, migrations, environment changes or production data writes. Includes Nadi b41b7df and f2b86d4 as a5599df/9dc711c. After deployment Nadi should fetch protected guide-connections export and verify 63 dispositions and representative authenticated tree/section views. This is a research display overlay, not canonical relationship reconciliation.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Museum live-tree service, shared tree layout types, tree UI, Vrindavan planner, protected guide report route.
- Expected conflicts: Do not deploy backend alone; release this paired branch. Current saved tiers, families and destinations remain unchanged. Static guide placement suggestions are not shown; current placement and snapshot drift are explicit.
- Rollback notes: revert `d22150e` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
