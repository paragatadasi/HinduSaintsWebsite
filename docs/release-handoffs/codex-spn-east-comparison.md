# Release Handoff: codex/spn-east-comparison

- Status: ready
- Branch: `codex/spn-east-comparison`
- Commit: `a3a002f62a6589a5d0745ba4b8448705668c2c56`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Add East meets Kriya and Vraj comparison study; retain v16 revision 1 default and all older proposals.
- Verified 1423 observations, 3 named-only entries, source coordinates, protected housings and current curator overrides; no physical writes.

## Verification

- dev:check passed; 19 targeted tests passed; desktop 1440 and mobile 390 browser checks passed with no overflow/runtime errors. prepare:deployment checks passed, handoff retried after required code commit. Release captain to run integrated codex:verify.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: Versioned private JSON only. Vitrine 2 Vraj story remains under review; 23 full-height clearance dependency retained. Do not load separate framework sketches.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Protected museum plan server composition and SpnRoomExplorer optional review note; no auth or routing changes.
- Expected conflicts: none
- Rollback notes: revert `a3a002f` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
