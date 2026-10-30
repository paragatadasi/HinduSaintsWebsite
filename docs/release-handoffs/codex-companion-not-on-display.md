# Release Handoff: codex/companion-not-on-display

- Status: ready
- Branch: `codex/companion-not-on-display`
- Commit: `3956b7047e11270a8778b23a7c76f8910b2c8fbf`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Individual Not on display decline with optional note, restorable inactive list and addressed progress
- Show explicit reasons when held records block whole-case clearing

## Verification

- dev:check passed; full tests738passed1skip; focused progress tests3passed; browser save/note/restore confirms no physical request

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No migrations or physical writes. Existing notes/history preserved. V20 component-scoped clearing is a separate pending backend change; no hold bypass in this release. Airtable disabled.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Companion UI, guide decision validation/type, progress helper, design docs
- Expected conflicts: none
- Rollback notes: revert `3956b70` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
