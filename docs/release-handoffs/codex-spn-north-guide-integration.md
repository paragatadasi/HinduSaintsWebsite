# Release Handoff: codex/spn-north-guide-integration

- Status: ready
- Branch: `codex/spn-north-guide-integration`
- Commit: `4a163cbc18a64c346ad10d8b0cddee9403801cbc`
- Owner/agent: `aporu`
- Bundle priority: immediate release candidate

## Summary

- Publish approved Northern proposal and next companion phase
- Preserve physical ledger and curator overrides; eleven Northern holdings remain pending

## Verification

- dev:check passed; 730 tests passed, 1 skipped; browser QA passed; codex:verify production build passed (28 static pages); final ordering tests passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: Read-only reviewed overlay; no backfill or automatic physical confirmations
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Guide registry, physical move guards, proposal projection, companion and shared relationship tree
- Expected conflicts: none
- Rollback notes: revert `4a163cb` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending

## Operational safeguards and host verification

- Approved V16 semantic cards, V15 destinations/snapshot43 baselines: 122 exact source observations, 111 assignments and 11 Northern pending holdings. Existing private/East holds also remain pending (22 total held rows in the no-override test).
- Receiver order: 74, 72, 68, 36, 11, then 21, 22, 19, 20. Availability/fit acknowledgement is required; an absence of records is not a claim of emptiness.
- Whole-case clearing is registered only for 19/20/21/22, independently. Existing housing holds block 19/20; do not bypass them. No whole-case clearing of 11/36/68/73.
- Preserve the 18 confirmed occupants in36 and the14 confirmed occupants in73. Proposal74 is not a recorded move. Pending holdings are not staging records.
- Old guide actions are rejected for superseded Northern targets; later explicit alternatives/additions retain their validated path. Existing undo remains available.
- On the actual host verify `/museumadmin/move?phase=north`, nine cases, per-case readiness, current bring-from origins, the reviewer allocation and pending tray. Do not check physical-move boxes for deployment smoke tests.
- No migration/environment changes; no production backfill. Airtable delivery stays disabled.
- Browser verification used the real React component with isolated fixture API data, not production writes.

## Follow-up after this release

Prototype shelf-by-shelf allocation presentation for unfinished phases before sourcing recommendations with Saarthi/Nadi. Primaries at top; related saints nearby or vertically aligned under their primary; living saints at bottom; famous deity relics lower rather than leading. Respect actual shelf/relic dimensions and keep proposed shelves distinct from confirmed placement.

Skill review: existing source/physical separation, identity and uncertainty rules cover this work; no reusable skill changes were needed.
