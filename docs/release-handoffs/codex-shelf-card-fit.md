# Release Handoff: codex/shelf-card-fit

- Status: ready
- Branch: `codex/shelf-card-fit`
- Commit: `f61a41c6dccfcc6789a13ce1b44a5ab212657650`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Compact shelf cards: checkbox and tier in top row, full-width smaller names and quiet text actions

## Verification

- dev:check passed; browser 74 three-family 900px and 600px containment passed; five-row/expanded-tree/alert/check-uncheck QA passed; diff check passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: UI only; no data or physical changes; existing move controls unchanged
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: MuseumShelfGuide, globals.css, design-system docs
- Expected conflicts: none
- Rollback notes: revert `f61a41c` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
