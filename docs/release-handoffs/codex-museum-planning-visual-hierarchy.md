# Release Handoff: codex/museum-planning-visual-hierarchy

- Status: ready
- Branch: `codex/museum-planning-visual-hierarchy`
- Commit: `12104ac08259ee79bf3699d60309bcc246402c9a`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Shared serif/gold/muted typography, reusable MuseumPlanningStats, proposal-inspired overview, darker family/move cards, quieter secondary actions and highlighted companion destination.
- Responsive family card grid with existing largest-first order; phone companion uses same statistics and touch-sized controls.


## Verification

- Desktop 1440x1000 and phone 390x844 synthetic browser previews inspected; stats and phone filters fit. Fixture removed before final check. Visual-only change, no new behavioural tests needed.

- `npm run dev:check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Descends codex/vrindavan-integrated-planning 1aed3a3. Shared planner/list components, new stat component, global CSS/tokens and design-system documentation. No data writes or contract changes.
- Keep Nadi visitor-order integration separate; no competing catalogue edits here.

- Shared areas touched: planner/list components, shared stat component, styles and design-system docs
- Expected conflicts: none
- Rollback notes: revert `12104ac` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
