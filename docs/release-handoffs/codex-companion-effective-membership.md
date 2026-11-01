# Release Handoff: codex/companion-effective-membership

- Status: ready
- Branch: `codex/companion-effective-membership`
- Commit: `03525f67723ec45d357d37c1ca9d207773fe9625`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Remove obsolete companion group allocations when the same source and saint have a newer effective destination; preserve physical history and external relationship context.

## Verification

- dev:check passed; 23 focused projection and membership regressions passed. Fresh all-phase live audit remains pending and is not claimed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No writes or backfills. Vitrine 47 pair additions remain held pending fresh data validation.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: lib/museum-companion-addition-projection.ts
- Expected conflicts: none
- Rollback notes: revert `03525f6` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
