# Release Handoff: codex/spn-v46-companion

- Status: ready
- Branch: `codex/spn-v46-companion`
- Commit: `17f2abbc12ed80ea42becd8a97c2940189ee1aab`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Add approved 18-record Vitrine 46 guide and shelf recommendations
- Group Vitthal Babaji and Vedananda together in the Datta guide

## Verification

- dev:check passed; 25 focused tests passed; actual React mocked-save desktop/mobile QA passed; fresh read-only data projections passed. codex:verify passed (Windows filesystem restriction required elevated retry).

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: Native proposed destinations already saved by Nadi; no physical backfill. V46 availability confirmation only. Checkboxes confirm vitrine, not suggested shelf.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Guide registry, companion projection, shelf-plan endpoint, physical confirmation guard
- Expected conflicts: none
- Source evidence: Nadi fresh read-only projection verified 18 entries, zero blockers, 18 shelf allocations, Jayatirtha Primary, and three living saints on approved shelf 2. Current origins remain four staging, two unknown, twelve source locations.
- Scope: no whole-case clearing for V46, no physical writes at release, and no suggested shelf silently recorded as actual. Existing later curator destinations remain authoritative.
- Skill review: no reusable interpretation change; the approved living-saint shelf-2 allowance is specific to this reviewed V46 plan.
- Rollback notes: revert the feature integration (e291ea6, b352d4b, 17f2abb); retain independently saved native proposals and physical history.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
