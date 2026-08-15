# Release Handoff: codex/place-relationship-editor

- Status: queued
- Branch: `codex/place-relationship-editor`
- Commit: `056921967a29db90db92c996d6adf59156c3f2f1`
- Owner/agent: `Codex place-relationship-editor task`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Adds conditional State and Country selection when creating locality and state places, with server-side hierarchy validation.
- Simplifies saint relationships by removing redundant confidence editing, using an inline visibility checkbox, and presenting saved relationships as compact summaries with explicit edit controls.

## Verification

- `npm run dev:check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: app/admin/saints/[id]/page.tsx, app/admin/saints/[id]/saint-place-route-editor.tsx, app/admin/saints/actions.ts, styles/globals.css
- Expected conflicts: Potential overlap with queued codex/source-flow-alignment changes in the admin Saint editor/actions and shared global styles; integrate this branch after or reconcile against that branch.
- Rollback notes: revert `0569219` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
