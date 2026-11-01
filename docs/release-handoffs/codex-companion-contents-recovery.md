# Release Handoff: codex/companion-contents-recovery

- Status: ready
- Branch: `codex/companion-contents-recovery`
- Commit: `ef97693`
- Owner/agent: `Citra`
- Bundle priority: Bundle with Nadi readiness and clearing protection fix

## Summary

- Manual refresh aborts its read requests after30seconds and releases loading with retry guidance; no POST changes. Latest dev:check passed after this addition. Keep paired workflow release; incident performance PR3 may release independently first.

- User-authorized museum workflow blocker removal: housing, verified-item and component restrictions no longer disable move/search controls; no extra component acknowledgement; search no longer forces destination25 or preparation. Requires Nadi central hold removal and automatic scoped component ledger support. Identity binding, permissions and concurrency remain.
- Generic component placement/clearing preview and shelf annotations follow the component location, preserving separately housed pieces.

- Urgent: placement checkboxes no longer require preparation/clearing readiness. Remove obsolete blocking notices. Requires matching backend decoupling; retain execution and record-specific guards.

- Bulk clear lists only current residuals, preserves confirmed destination placements, and displays server staged/preserved counts. Requires Nadi residualClearing backend contract.
- Cancel stuck contents reads after 30 seconds and display a retryable error. Ignore superseded responses and cancel reads on unmount.

## Verification

- Actual browser: restricted holding can be added and confirmed without preparation: passed.
- Component location and residual preview regression: 3 passed; 14 client-branch domain tests passed. Backend business-rule removal verification belongs to Nadi paired handoff.

- `npm run dev:check`: passed after full blocker-removal and component shelf changes. prepare:deployment verification passed; generator stopped because this existing handoff was being updated, so it was completed manually.
- Actual React/browser regression with stalled GET and retry: passed
- 19 clearance, historical staging and receiver availability domain tests: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none; no physical placements or readiness receipts changed.
- Immediate release requested: combine with Nadi residual-clearing and readiness fix; do not deploy UI alone.

## Risk And Conflicts

- Shared areas touched: museum-partial-clearing-controller.tsx, spn-room-move-companion.tsx, museum-companion-search.tsx, use-museum-display-work.ts, spn-move-guide.ts, museum-clearing-preview.ts; branch inherits effective-membership correction 03525f6/c62b82b.
- Expected conflicts: none
- Rollback notes: revert `b1604ad` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
