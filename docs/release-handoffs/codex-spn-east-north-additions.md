# Release Handoff: codex/spn-east-north-additions

- Status: ready
- Branch: `codex/spn-east-north-additions`
- Commit: `30572244294608407305a53ba723eaaafe38088a`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Show all 18 saved East/North additions in coherent guide groups; preserve qualified identities and the Motilal-Anilananda branch.
- Add a receiving-only V8/V9 supplement for three approved additions, without clearing or full-case allocation claims.

## Verification

- dev:check passed; npm test 906 passed, 1 skipped; codex:verify passed after generated-folder permission retry; native catalog audit: all 18 appear exactly once, Anilananda physical V23 retained.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No migration or backfill. Nadi already saved and verified all 18 native proposed destinations. No physical, shelf, canonical or Gopal Das edits. Packet v4 SHA256 b8b1b7fc3e6067ff9a815ef60fb623d023d564282c4671e32a03ba3d4090c4c2.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Move page, phase navigation and registry, addition projection, family/checklist note component, admin design guidance.
- Expected conflicts: Eastern active-shelves branch is already an ancestor. V11 fit remains provisional; V8/V9 are additions only. No reusable skill rule changed.
- Rollback notes: revert `3057224` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
