# Release Handoff: codex/spn-proposal-explorer-v16

- Status: ready
- Branch: `codex/spn-proposal-explorer-v16`
- Commit: `8a5c1186301e0b1aff870d2b77b3bd9a4cc0fd0e`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Load reviewed v16 as default with selectable v15 and independent per-version data
- Surface four held identity/merge cases and add optional Nar Hari exact-source curator question; fix mobile width and rotated map token collision

## Verification

- codex:verify passed; dev:check passed; 11 targeted tests passed; desktop/mobile comparison, four rotations, version-specific saint search passed; manifest hashes verified; private metadata absent from public static chunks

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No database writes/backfill. Preserve newer curator overrides and all physical state; immutable 1423 observations,303 shares,3 named-only entries. Final 25 Oct 14:23:51Z snapshot.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Museum plan route, explorer component/scoped CSS, questionnaire seed and empty candidate handling
- Expected conflicts: design:inventory/design:check scripts unavailable on origin/main; run after compatible design-system integration. Planning docs 4f86c02 depend on bc88083 guide; not runtime dependency.
- Rollback notes: revert `8a5c118` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
