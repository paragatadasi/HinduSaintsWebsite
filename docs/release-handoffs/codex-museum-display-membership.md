# Release Handoff: codex/museum-display-membership

- Status: ready
- Branch: `codex/museum-display-membership`
- Commit: `56a593f91293108855aefdcff2ea51efa86fc4be`
- Owner/agent: `Simple UX Fixes`
- Bundle priority: immediate release candidate

## Summary

- Curators can detach/restore saints from SPN display families without changing historical relationships or physical inventory; separate relationship-correction requests go to reconciliation.

## Verification

- `npm run prepare:deployment`: passed.
- `npm run codex:verify`: passed (production build).
- Six family/membership domain tests passed.
- Disposable PostgreSQL integration script passed: detach/restore, stale revisions, anchor handling, preserved physical placements and historical relationships, correction-request deduplication.
- Desktop and mobile dialog checks passed.

## Deploy Notes

- Migrations: additive 20261003113000_museum_display_membership; apply in release migration phase. Verified against disposable PostgreSQL with all repository migrations.
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: SPN proposal reader, family move revisions, working-data builder, saint dialog/search/section pages, Prisma schema.
- Expected conflicts: depends on shared Vrindavan UX branch e26bd7b (included in ancestry); integrate pilot first. Source family and canonical exhibit-group detach/restore covered.
- Rollback notes: additive membership table can remain on application rollback; preserve rows. Feature includes checkpoint a54b348 and final code 56a593f; do not revert only final commit. Original generated guidance: revert `56a593f` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
