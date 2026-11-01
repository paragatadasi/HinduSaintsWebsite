# Release Handoff: codex/companion-contents-recovery

- Status: queued
- Branch: `codex/companion-contents-recovery`
- Commit: `b1604ad9c795044d82ba016a847f9e5d2e25e5fc`
- Owner/agent: `Citra`
- Bundle priority: Bundle with Nadi readiness and clearing protection fix

## Summary

- Cancel stuck contents reads after 30 seconds and display a retryable error. Ignore superseded responses and cancel reads on unmount.

## Verification

- `npm run prepare:deployment`: passed
- Actual React/browser regression with stalled GET and retry: passed
- 17 clearance, historical staging and receiver availability domain tests: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none; no physical placements or readiness receipts changed.
- Queue/deploy trigger: combine with Nadi backend readiness/clearing fix when ready; this UI change alone does not resolve invalid availability.

## Risk And Conflicts

- Shared areas touched: museum-partial-clearing-controller.tsx; branch inherits effective-membership correction 03525f6/c62b82b.
- Expected conflicts: none
- Rollback notes: revert `b1604ad` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
