# Release Handoff: codex/progress-exclusions

- Status: ready
- Branch: `codex/progress-exclusions`
- Commit: `6fbb064fcbd7df984bad377fbc237fad0cf67b34`
- Owner/agent: `aporu`
- Bundle priority: immediate release candidate

## Summary

- Exclude four curator-confirmed empty observations, existing private-display exclusions and suppressed duplicates from all move progress counts. Preserve restored Unknown collection, unresolved records, and ordinary declined/not-on-display completion semantics. Validate guide entry destinations before deduplicating summary membership, so stale groups do not claim moved records.

## Verification

- `npm run prepare:deployment`: passed
- Progress, vitrine-progress and search-roster tests: 11 passed.
- Exact live 1319 count not reconstructed; historical snapshot is not presented as current. Increasing guide coverage legitimately raises the denominator.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: museum-progress-summary, museum-vitrine-progress and new scoped SPN progress-exclusion predicate.
- Expected conflicts: none known; no inventory, proposal or physical-state writes.
- Rollback notes: revert `6fbb064` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending

## Evidence

Nadi confirmed exact empty source IDs on 2 November 2026: recq8jg20kMAD2Erc, rec4xOqRUEzWnxTdw, recPWVPc3i5A0KH7h, recTIJVFjrG7OSvlI. Unknown collection recaTTfjinlSVDk4n was explicitly restored and remains counted. Private and duplicate exclusions reuse existing authoritative configuration. No reusable interpretation change was needed; existing museum skill already defines unique active-roster counting.
