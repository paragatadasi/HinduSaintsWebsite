# Release Handoff: codex/vrindavan-move-day

- Status: ready
- Branch: `codex/vrindavan-move-day`
- Commit: `4ce02361c0f73530a9ca8549c6b13e8c4aee9a15`
- Owner/agent: Citra
- Bundle priority: immediate release candidate; curator move planning active

## Summary

- Adds move-day checklist to `/vrindavanadmin/plan`: filter by progress, source/destination vitrine and saint; inspect source relic entries and lazy-loaded saint photos/biography/tree; record final shelf, note and physical completion per saint.
- Preserves last physically confirmed location across subsequent replanning using existing implementation audit history. Photo snapshot refresh uses confirmed locations when available.
- Latest user correction: REMOVE manual photo-vitrine setup controls and server action. Vrindavan already supplied photo-presence data and user will coordinate import with Nadi. Keep photo counts with honest pending/untagged labels; do not claim missing tags mean no photo. Existing saved IDs retained; import wiring remains Nadi coordination work.

## Verification

- 14 focused planner/arrangement/Vrindavan domain tests passed.
- Disposable localhost database integration passed: checked-entry validation, completion/replay protection, last confirmed location survives replanning, photo refresh, stale/foreign/atomic rejection, audits, no source/SPN/physical writes.
- `npm run codex:verify` passed for checklist commit 11a4148 after elevated retry of Windows EPERM standalone-copy failure. Initial compilation/typecheck succeeded; elevation resolved packaging.
- Final photo-control removal 4ce0236 passed `npm run dev:check` and `npm run prepare:deployment`; integrated build remains captain's gate.
- Mobile 390x844 fixture verified readable completion form, input/checkbox interaction and source/destination context. Fixture route removed before production build. Actual authenticated production save not exercised.
- `git diff --check` passed.

## Deploy Notes

- Migrations: none additional. Depends on already-deployed planning phase 8c27901 and migration 20261020100000_museum_planning_setup.
- Environment variables: none.
- Data/backfill: none. No photo import executed by this branch.
- Queue/deploy trigger: READY now under standing user authorization.
- Smoke: Vrindavan → Plan the move has no photo setup controls. Assign a destination, open Move-day checklist, filter source/destination, open saint reference. Complete only a physically moved saint with all entry checks/acknowledgements; verify removal from Still to do and presence in Implemented. Replan only when intended and verify previous physical location remains visible.

## Risk And Conflicts

- Shared areas: planner services/domain/actions/components, appended print rule in globals.css, museum integration docs. No auth/schema changes.
- Access gates retained: access_museum + full catalog; writes additionally manage_museum. Museum serializable lock and revision validation guard mutations.
- Physical completion is a curator-confirmed saint arrangement, with incomplete inventory explicitly acknowledged. It does not overwrite source observations or claim individual item placements; partial/uncertain moves stay Planned.
- Audit history may contain old implementations without location; these are ignored rather than guessed.
- Rollback: revert follow-up commits; retain existing data/audits. Phase 1 is already in main; do not reintroduce its released handoff status.

## Release Captain Notes

- Integrated into main: pending
- Pushed to main: no
- Merged to deploy: pending
- Production workflow: pending
