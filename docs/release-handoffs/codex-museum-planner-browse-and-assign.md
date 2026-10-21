# Release Handoff: codex/museum-planner-browse-and-assign

- Status: ready
- Branch: `codex/museum-planner-browse-and-assign`
- Commit: `75224102fbd36c21efd98a57db3c7a1916dad040`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Browse vitrines without assignment; global saint destination search; browse unassigned/research sections; preselect sole destination and bulk assign; remove obsolete photo pending labels.
- Enforce curator-confirmed Vrindavan Sikh Vitrine11 in Planned writes, areas, flexible allocations and suggestions. Existing saved destinations remain unchanged until explicit correction.

## Verification

- codex:verify passed; 25 planner/domain/suggestion tests passed; diff check passed. Local browser QA blocked by localhost timeout; release smoke required.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No automatic data migration or accepted-plan rewrite. Nadi owns approved Sikh tier/relationship and targeted replan actions separately.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Museum planner UI/domain/service, shared arrangement writer, suggestion generator/guide; no schema or auth changes.
- Expected conflicts: none
- Rollback notes: revert `7522410` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
