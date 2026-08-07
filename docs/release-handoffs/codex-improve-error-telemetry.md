# Release Handoff: codex/improve-error-telemetry

- Status: queued
- Branch: `codex/improve-error-telemetry`
- Commit: `b374fea672bb894e3fb7e3d0672bcf2c5de4d7aa`
- Owner/agent: `aporu`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Separate confirmed first-party exceptions, opaque browser signals, resource
  failures, and suppression notices in anonymous telemetry and the admin
  analytics dashboard.
- Derive fingerprints only from sanitized same-origin bundle frames; never
  retain messages, rejection values, raw stacks, or external URLs.
- Capture React route failures and resource load failures, reject browser
  requests marked as cross-origin, and cap repeated diagnostics per tab/route.
- Reclassify existing legacy `Error|unknown` rows as opaque signals in the
  dashboard and retain all diagnostic categories for 30 days.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed (107 tests)
- `npm run build:local`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none; existing legacy opaque rows are
  reclassified at render time and require no database rewrite
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: telemetry contract/client/API, public application error
  boundaries, and the admin analytics page
- Expected conflicts: possible if another queued branch edits the same
  telemetry or analytics files
- Rollback notes: revert `b374fea` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
