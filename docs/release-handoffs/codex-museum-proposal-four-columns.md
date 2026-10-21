# Release Handoff: codex/museum-proposal-four-columns

- Status: ready
- Branch: `codex/museum-proposal-four-columns`
- Commit: `0ffbe1bd13995f2cb52e8e159fa3928ae2cc373a`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Current museum proposal uses four labelled physical columns; collisions move cards vertically within their column, with compact readable cards and narrow-view horizontal scrolling.

## Verification

- dev:check passed; five geometry tests passed; browser inline/expanded headings and keyboard move verified on synthetic fixture; git diff --check passed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No migrations, backfills or museum assignment changes. Multi-column sections use the saved area centroid; all vitrine numbers remain listed.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Museum connected traditions component, diagram geometry, shared CSS and width token.
- Expected conflicts: Based on proposal-diagram-default 67ca9b7. Integrate prior ready branches first. Saved custom layouts remain freeform.
- Rollback notes: revert `0ffbe1b` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
