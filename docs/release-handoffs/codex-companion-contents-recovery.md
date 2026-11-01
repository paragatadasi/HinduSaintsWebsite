# Release Handoff: codex/companion-contents-recovery

- Status: queued
- Branch: `codex/companion-contents-recovery`
- Commit: `5a4e219`
- Owner/agent: `Citra`
- Bundle priority: Bundle with Nadi readiness and clearing protection fix

## Summary

- Bulk clear lists only current residuals, preserves confirmed destination placements, and displays server staged/preserved counts. Requires Nadi residualClearing backend contract.
- Cancel stuck contents reads after 30 seconds and display a retryable error. Ignore superseded responses and cancel reads on unmount.

## Verification

- `npm run dev:check`: passed after bulk-clear changes; prepare:deployment verification passed, existing handoff updated manually.
- Actual React/browser regression with stalled GET and retry: passed
- 19 clearance, historical staging and receiver availability domain tests: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none; no physical placements or readiness receipts changed.
- Queue/deploy trigger: combine with Nadi residual-clearing and readiness fix; do not deploy UI alone.

## Risk And Conflicts

- Shared areas touched: museum-partial-clearing-controller.tsx, spn-room-move-companion.tsx, museum-clearing-preview.ts; branch inherits effective-membership correction 03525f6/c62b82b.
- Expected conflicts: none
- Rollback notes: revert `b1604ad` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
