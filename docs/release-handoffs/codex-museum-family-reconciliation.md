# Release Handoff: codex/museum-family-reconciliation

- Status: ready
- Branch: `codex/museum-family-reconciliation`
- Commit: `34ec71712786ad2c4b22931713cca564f4d8debd`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Automatically reconcile unreviewed Secondary tiers and membership in the unique nearest Primary family from supported published website relationships, in SPN and Vrindavan.
- Preserve explicit curator decisions and all current Planned/Implemented vitrine, shelf and confirmation state. Competing, missing-family and cross-section anchors remain held.
- Extend private trees to display biological family and lineage connections without labelling them guru-disciple relationships.

## Verification

- `npm run prepare:deployment`: passed; final `npm run dev:check`: passed.
- 60 targeted regression tests passed, including Citra manual editor and Sikh context integration.
- Production build: release captain owns integrated `npm run codex:verify`.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none; read-time projection activates on deployment. No production database writes performed by this feature. Smoke-check Chand Kazi and Haridas against current relationships/overrides and retain their saved Vitrine 18/19 plans.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: museum-working-data, vrindavan-working-data/domain, raw SPN inheritance, museum-family-move-domain and shared tree reader/normalizer. Details: docs/museum-family-reconciliation.md.
- Expected conflicts: current main including Citra manual editor and Sikh context merged and tested; original two import/type conflicts resolved preserving both changes. Later overlapping reader/tree edits require inspection.
- Rollback notes: revert scoped feature commits b53f050, 5fbf664 and 34ec717 (not the main-integration merge). Saved destinations, raw sources and curator decisions were not rewritten.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
