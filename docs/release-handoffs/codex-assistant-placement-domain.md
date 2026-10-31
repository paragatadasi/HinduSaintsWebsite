# Release Handoff: codex/assistant-placement-domain

- Status: ready
- Branch: `codex/assistant-placement-domain`
- Commit: `b94d5710b6a87cbae122f44251ad800ae0e0cf82`
- Owner/agent: `aporu`
- Bundle priority: immediate release candidate

## Summary

- Enforce assistant placement authority inside the physical-location transaction: one approved locked-guide destination, current identity and effective proposal, preserving curator-only clearing and overrides.

## Verification

- 
pm run dev:check`: passed
- 16 focused domain/component tests: passed
- 
pm run prepare:deployment`: passed
- Full production build: delegated to Citra/Mira for the combined release; standalone build stopped before completion.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: lib/museum-physical-locations.ts and new assistant domain helpers/tests
- Dependency: bundle with Citra codex/assistant-placement-checks permissions, HTTP actor and UI changes. Backend alone grants no capability. Conservative guide-only exceptions with a different global effective destination remain curator-only.
- Rollback notes: revert `b94d571` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending

