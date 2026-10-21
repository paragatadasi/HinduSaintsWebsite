# Release Handoff: codex/museum-planner-layouts

- Status: ready
- Branch: `codex/museum-planner-layouts`
- Commit: `6c4e012195b37edc1308780e7c4aedf362dc9182`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Refine planner tabs, paired assistance/search cards, consistent section navigator and saved-area overview.
- Add group selection/dragging and named saved diagram views; retain Original connections and generate Current museum proposal from saved areas.
- Open the standard museum saint card from plan search; order vitrine first, then secondary section and details buttons.

## Verification

- dev:check passed; codex:verify passed; 9 domain/geometry tests passed; synthetic service and browser QA passed. Real PostgreSQL concurrency not exercised locally.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No inventory or destination updates. Diagram saves use museum-scoped AuditEvent snapshots. Protected live save/reload smoke check recommended after release.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Planner actions and components, shared styles, design-system docs. Includes Nadi dd953ab as f876f00.
- Expected conflicts: none
- Rollback notes: revert `6c4e012` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
