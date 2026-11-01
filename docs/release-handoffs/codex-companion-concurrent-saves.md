# Release Handoff: codex/companion-concurrent-saves

- Status: ready
- Branch: `codex/companion-concurrent-saves`
- Commit: `5a64a6f32a3e76d63ca6de5eb9affe60885b9743`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Placement checkboxes save independently per record with immediate checked/Saving feedback; unrelated rows remain usable.
- Narrow version-aware receipt merging preserves concurrent responses; failed saves roll back with an exact request-ID retry; same-record conflicts load authoritative state.
- Shelf/to-do saves lock only their source. To-do checkboxes show pending state immediately; shelf/task updates refresh from other users without a page reload.
- Clearing/preparation/undo remain exclusive while placements are pending. Unknown-outcome placement failures retain a retry and block bulk mutation until resolved.

## Verification

- `npm run prepare:deployment` (Prisma + TypeScript): passed.
- 12 focused tests: museum-save-receipts, museum-physical-progress-client, museum-companion-work-domain passed.
- Three real React browser harnesses with delayed/mocked responses passed: independent assistant checkbox clicks + reversed responses + 503 rollback/exact retry; same-record 409 refresh preserving other saves; concurrent shelf/task saves with reversed responses.
- Local harnesses: companion-parchment-qa/concurrent-save-check.cjs, concurrent-conflict-check.cjs, work-concurrency-check.cjs (adjacent to feature worktree; no production writes).
- Backend real-database concurrency/timing coverage belongs to Nadi's companion branch and is REQUIRED before this bundle releases.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: release together with verified `codex/museum-save-concurrency`; hold until its actual database concurrency tests and handoff are ready. User requested one combined performance release.

## Risk And Conflicts

- Shared areas touched: SPN companion client, shared museum display-work hook, new receipt merging helper; no styles/schema/data.
- Expected conflicts: none with Nadi backend; review any concurrent edits to spn-room-move-companion.tsx. API contracts unchanged.
- Rollback notes: revert `5a64a6f` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
