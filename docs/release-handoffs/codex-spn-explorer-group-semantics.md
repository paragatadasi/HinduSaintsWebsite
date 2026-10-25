# Release Handoff: codex/spn-explorer-group-semantics

- Status: ready
- Branch: `codex/spn-explorer-group-semantics`
- Commit: `736af08a0897ab25f4101c874042b625e3be5fd8`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Exclude operational review/reserve/stick/full-height groups from neighborhood navigation and search
- Label all matching neighborhoods explicitly; only clicked vitrine selected by default; distinguish V75 optional Kriya continuation from actual holdings

## Verification

- dev:check passed; 13 tests passed; browser75/24/6/5/3 and v15 switch plus mobile width passed; structural JSON comparison confirms allocations unchanged

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No writes or source allocation changes; metadata navigationKind/contextPlaces only; newer curator guards unchanged
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: SPN explorer component, helper, versioned design metadata, indexed docs
- Expected conflicts: No known conflicts; release captain integrated production gate required
- Rollback notes: revert `736af08` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
