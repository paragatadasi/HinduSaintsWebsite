# Release Handoff: codex/vrindavan-neutral-region-subsections

- Status: ready
- Branch: `codex/vrindavan-neutral-region-subsections`
- Commit: `8075975b681c551083a0cb386ad1073d49f64d64`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Add Vrindavan-only neutral Karnataka Saints and Northern Regional Saints subsections under existing parent regions; bump diagram vocabulary version. No automatic membership, tier, destination or formal tradition changes.

## Verification

- `npm run dev:check`: passed; nine approved-subsection and diagram-domain tests passed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: catalogue only; Nadi applies separately authorized locality placements after production confirmation.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: approved subsection vocabulary and diagram graph version
- Expected conflicts: none
- Rollback notes: revert `8075975` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
