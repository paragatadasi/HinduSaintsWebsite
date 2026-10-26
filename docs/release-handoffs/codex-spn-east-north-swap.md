# Release Handoff: codex/spn-east-north-swap

- Status: ready
- Branch: `codex/spn-east-north-swap`
- Commit: `14db0a76241055f56838fcfe151b422b407e5e34`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Exchange complete Gosaiji/Yogmaya and Puri groups between vitrines 26 and 37 in the current East-North candidate.

## Verification

- dev:check passed; 9 focused tests passed; manifest hashes verified; 34 source observations changed, 1423 IDs/303 shares/3 named-only retained, zero other destination changes.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: Static proposal amendment only. No database writes or backfill. Preserve candidate ID/default and live curator overrides; Sankaranya correction remains. No pilgrimage, Sikh, or 70/22 experiments included.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Two current East-North JSON fixtures and focused tests; no UI, schema, auth, or route changes.
- Expected conflicts: none
- Rollback notes: revert `14db0a7` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
