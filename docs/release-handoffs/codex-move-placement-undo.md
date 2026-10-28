# Release Handoff: codex/move-placement-undo

- Status: ready
- Branch: `codex/move-placement-undo`
- Commit: `e58e2b381d6b24953b85f95eb5ed60584a98d337`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Allow audited undo of mistaken placement checks and show bring-from locations in saint pop-ups

## Verification

- 26 focused tests PASS;browser simulated check/undo synchronized copies and bring-from modal PASS;dev:check PASS; production compilation PASS, final build completion pending (integrated codex:verify required before release)

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Physical ledger/session readers, protected physical endpoint, companion and tree dialog
- Expected conflicts: none
- Rollback notes: revert `e58e2b3` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
User explicitly requests deploy both refinements when ready. Includes backend8879a33 as6c1c354. No schema/migration/env changes. New JSON restored_recorded_state envelope in existing ledger: ROLLBACK MUST retain decoder support once any undo has occurred; do not deploy old plain-location-only readers. Undo corrects mistaken check, not physical return; restores exact safe prior basis, retains audit, monotonic version, stale/identity/item/whole-clear restrictions. No production undo executed. Latest1000 receipt limit: older unsupported checks show reason. Popups show live current bring-from with source qualifier. Successful undo immediately updates rows then GET refreshes history/receipts; GET failure does not retry correction. Preserve all existing phase registries and actual history. Release captain must pass integrated build if branch build does not return. Confirm private hosting separately from public workflow dispatch.

