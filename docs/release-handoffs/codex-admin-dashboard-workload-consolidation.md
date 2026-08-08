# Release Handoff: codex/admin-dashboard-workload-consolidation

- Status: ready
- Branch: `codex/admin-dashboard-workload-consolidation`
- Commit: `c9063e5c188ce877f49afbf454444c9d14f48f98`
- Owner/agent: `aporu`
- Bundle priority: immediate release candidate

## Summary

- Makes the Dashboard sidebar brand the single `/admin` landing link and removes duplicate Dashboard and My Work entries from Operations.
- Separates shared editorial counters into Team Workflow and personal assignment counters into My Workflow.
- Embeds the full My Work assignment workspace at the bottom of Dashboard, preserving manager-only coordination and Team views.
- Redirects legacy `/admin/work` URLs and assignment action results to the matching embedded Dashboard queue.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed (107/107)
- `npm run codex:verify`: passed; compiled, type-checked, collected page data, and generated all 15 static pages. It emitted only existing CSS compatibility notices and the known non-failing Windows worktree junction trace-copy warning.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: admin primary navigation, Dashboard route, assignment workspace/actions and legacy route, shared admin heading selectors, admin workflow documentation
- Expected conflicts: other changes to `/admin`, Operations navigation, `/admin/work`, assignment presentation, or the shared heading selectors
- Rollback notes: revert `c9063e5` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
