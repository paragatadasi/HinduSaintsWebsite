# Release Handoff: codex/spn-curatorial-region-tags

- Status: ready
- Branch: `codex/spn-curatorial-region-tags`
- Commit: `1dd8992015b463c56d3ac3415e8bc484fd0b47c9`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Add private SPN curatorial region tags independent of website geography, traditions and physical placements.

## Verification

- dev:check passed; 12 focused tests passed; prepare:deployment dev:check gate passed but npm argument forwarding failed in metadata generator, so handoff generated directly. Integrated full build belongs to release captain.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: After promotion Nadi applies South plus West tags to Mirra Alfassa, Dilip Roy and Indira Devi via guarded UI. Citra owns explorer display/filter consumption in a separate checkpoint. Do not claim existing section navigation changed. Physical hinge remains separate research proposal.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: SPN proposal domain/service/form, MuseumSaintPlacement, protected tier audit, legacy saint detail.
- Expected conflicts: none
- Rollback notes: revert `1dd8992` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
