# Release Handoff: codex/vrindavan-relic-housing-copy

- Status: ready
- Branch: `codex/vrindavan-relic-housing-copy`
- Commit: `e2407ef1d33ab86eb717a3f5804c8a1c679ba5ac`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Clarify Frame/Box as relic housing, not portrait presence; remove misleading no-frames-move promise from five-move copy.

## Verification

- dev:check passed; thirteen proposal/core tests passed after updating expected error wording.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: Copy and documentation only; no raw packaging, placements or confirmations changed. V6 all pictures; V16 three pictures at top; V17 no framed pictures. No new picture-exchange rule introduced. Existing saved descriptions retained as history; persistent UI clarification applies to all variants.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: museum-plan-variants UI/domain error wording, minimal template description, museum proposal documentation.
- Expected conflicts: Based2e809b7 including Tinkodi option and tier-retention fix. No migrations/env. Captain integrated verification.
- Rollback notes: revert `e2407ef` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
