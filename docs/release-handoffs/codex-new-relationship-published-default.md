# Release Handoff: codex/new-relationship-published-default

- Status: queued
- Branch: `codex/new-relationship-published-default`
- Commit: `49cc290e204948bdb59218ff684f91cca842128f`
- Owner/agent: `Save imported carousel text`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Default manually added saint relationships to published in the editor and creation action fallback. Existing saved relationships retain their status; needs_review remains selectable.

## Verification

- npm run dev:check passed. No new schema, dependency, auth or route structure changes. Browser confirmation not performed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: Saint admin new relationship form and createSaintRelationship action.
- Expected conflicts: Stacked on codex/related-saints-network-fill and earlier carousel/status branches; confirm ancestors already integrated or integrate in order.
- Rollback notes: revert `49cc290` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
