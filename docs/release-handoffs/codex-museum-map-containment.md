# Release Handoff: codex/museum-map-containment

- Status: ready
- Branch: `codex/museum-map-containment`
- Commit: `48c3435ed6cb24ffc36b5e8d6340a86b41321a9f`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Give Connected traditions more desktop width, constrain controls and four-column canvas to the panel, and scale proposal labels down responsively.

## Verification

- dev:check passed; browser measured panel/scroll width equal at 712px and 439px, no overflowing nodes; expanded canvas 1223px remains contained with larger labels. git diff --check passed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No museum data, schema, migrations or environment changes. Original/custom views and saved positions remain available.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Connected traditions geometry sizing, shared planning CSS and font token.
- Expected conflicts: none
- Rollback notes: revert `48c3435` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
