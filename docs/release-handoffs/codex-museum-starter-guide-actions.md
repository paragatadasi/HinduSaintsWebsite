# Release Handoff: codex/museum-starter-guide-actions

- Status: ready
- Branch: `codex/museum-starter-guide-actions`
- Commit: `58aa7f1d221954c27c9844880e38cb5611d781bd`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Versioned guide decisions, independent physical saves, full-case clearing and durable reported-placement receipts. Pair with Citra room companion.

## Verification

- Prior dev:check and fresh DB guide/physical regressions passed; registry tests passed. Final code compiled; redundant type workers stopped for machine memory pressure. Citra integrated full build is release gate.
- Workflow learning review: existing museum interpretation and planning skills already cover exact-source confirmations, unknown shelves and proposal independence; no further reusable rule change was needed for this receipt fix.

## Deploy Notes

- Migrations: 20261028010000_museum_guide_suggestion_decisions adds one table; release phase only.
- Environment variables: none
- Data/backfill/release steps: No automatic placement writes or proposal activation. Approved 23 observations require visible save and readback. Global v10 unchanged;21 refinement draft excluded.
- Queue/deploy trigger: release only with Citra's companion and a passing integrated full build.

## Risk And Conflicts

- Shared areas touched: prisma/schema.prisma; museum physical service; guide decision API and registry
- Expected conflicts: Required paired release with codex/spn-room-move-companion; Citra integrated365396d and58aa7f1.
- Rollback notes: revert the paired UI and backend changes together; retain the additive table and recorded decisions/physical receipts. Do not delete curator data during rollback.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
