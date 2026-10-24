# Release Handoff: codex/spn-regional-navigation

- Status: ready
- Branch: `codex/spn-regional-navigation`
- Commit: `c74ba35b64f3840b4a02accdd3a4958371543acf`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- SPN sidebar and overview use approved six-region headings, preserving all 23 subsections and separate supplementary/review groups.
- Remove Placement review and Moves and relics navigation and legacy curator action links; source matching belongs in Main admin.

## Verification

- dev:check passed; SPN preservation tests 2/2 passed; combined navigation tests 5/6 with pre-existing Vrindavan Kerala/Andhra ordering assertion; production component browser fixture verified groups, stable expansion and legacy links absent. prepare:deployment verification passed; npm argument forwarding failed so handoff generator invoked directly.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No data changes. Nadi separately owns SPN scoped Kaleshwar family apply. Regions are navigation parents, not physical placements.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Museum navigation, proposal overview, saint dialog, location browser
- Expected conflicts: Nadi scoped SPN backend may touch saint detail page; preserve its annotation and the Section overview backlink. Existing Vrindavan southern-order test mismatch remains.
- Rollback notes: revert `c74ba35` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
