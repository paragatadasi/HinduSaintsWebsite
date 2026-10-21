# Release Handoff: codex/museum-move-companion-refine

- Status: ready
- Branch: `codex/museum-move-companion-refine`
- Commit: `f2dc084d15b62690401b5561ef31b6a91085fac1`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Search/sort above five intersecting filters; compact expandable move cards; distinct source-reported container components

## Verification

- dev:check passed; 13 tests passed; synthetic desktop and 390px responsive browser checks

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: Includes Nadi helper 008dfe1 as e5534ef; no data mutations
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Museum move list; shared CSS; new packaging component summary
- Expected conflicts: Based on museum-planner-layouts 0929e2e; retain those changes
- Rollback notes: revert `f2dc084` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
