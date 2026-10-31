# Release Handoff: codex/staging-destination-groups

- Status: `queued`
- Branch: `codex/staging-destination-groups`
- Commit: `a3e4e3b7e80ad870aa1282fae7232042abed6f7e`
- Owner/agent: Citra
- Bundle priority: next compatible deployment

## Summary

Staging entries grouped by proposed destination vitrine, numerically sorted, with count-and-jump controls at the top. Unassigned and unlinked records remain separate. Uses the current catalog, alternatives and additions across phases, preserving component-specific notices and correction actions.

## Verification

- `npm run queue:deployment`: passed (dev:check and queued handoff).
- Destination grouping test: passed.
- Real-component browser fixture: counts, unassigned/unlinked groups, open-and-focus jump controls, component notes, empty state and 390px overflow checks passed; desktop screenshot reviewed.
- `git diff --check`: passed.

## Deploy Notes

- Migrations: none.
- Environment variables: none.
- Data/backfill/release steps: none. Presentation-only; no mutation handlers changed.
- Queue/deploy trigger: queued for next compatible deployment.

## Risk And Conflicts

- Shared areas: move companion, shared staging component, shared CSS and design-system documentation.
- Expected conflicts: any concurrent move-companion edits.
- Rollback: standard code rollback.
- Counts represent source/display entries rather than individual physical pieces.

## Release Captain Notes

- Integrated into main: pending.
- Production workflow: pending.
