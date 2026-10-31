# Release Handoff: codex/spn-west-v45-domain

- Status: ready
- Branch: `codex/spn-west-v45-domain`
- Commit: `1f84291a758dea67097969b8084006ff6c9680ca`
- Owner/agent: `aporu`
- Bundle priority: immediate release candidate

## Summary

- Register the approved V45 Varkari subset: 21 holding observations plus one separate contextual anchor. Validate live source/identity/effective proposal under transaction locks; require available-space preparation without whole-case clearing.

## Verification

- `npm run dev:check`: passed
- 19 focused guide/registry/assistant tests: passed
- `npm run prepare:deployment`: passed
- Production build: Citra owns combined UI/domain verification; no standalone build claimed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready with the combined Citra V45 interface
- Fit: known 5.37 / 5 plus two unmeasured holdings; three optional additions last. Source-only Dhunda remains curator-only while global effective destination is 41. No identity links or placements are created by release.

## Risk And Conflicts

- Shared areas touched: lib/spn-starter-guide-registry.ts, lib/museum-physical-locations.ts, docs/museum-move-companion.md; new guide/source/packet/tests.
- Dependency: bundle with Citra codex/v45-move-guide UI phase/navigation and context-anchor rendering. Keep the anchor outside checkboxes and progress.
- Rollback notes: revert `1f84291` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
