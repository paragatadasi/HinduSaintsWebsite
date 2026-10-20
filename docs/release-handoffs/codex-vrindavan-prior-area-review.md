# Release Handoff: codex/vrindavan-prior-area-review

- Status: ready
- Branch: `codex/vrindavan-prior-area-review`
- Commit: `05c9c59`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Propagate optional arrangementNeedsReview from Nadi overlay, warn on saved destinations, and retain flagged Implemented rows in Still to do. No mutation semantics changed.

- Planner now reads names/slugs/order from canonical Vrindavan working.sections, so forthcoming regional catalogue flows through automatically; editorial summaries only reused by exact matching name.

- Keep earlier section areas visible after catalogue/proposal changes; show affected flexible assignments for review without remapping or changing exact destinations.

## Verification

- dev:check and all 11 domain tests passed after review flag follow-up.

- dev:check passed again after canonical catalogue adapter.

- dev:check passed; 11 planner domain tests passed; git diff --check passed. prepare:deployment checks passed but npm stripped handoff arguments; handoff generator rerun directly. Integrated production build owned by release captain.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Museum move planner service/UI/domain/tests; docs/museum-data-integration.md
- Expected conflicts: none
- Rollback notes: revert `16de897` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
