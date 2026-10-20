# Release Handoff: codex/museum-connected-planner

- Status: ready
- Branch: `codex/museum-connected-planner`
- Commit: `1230d5b2bd07135bf1aa74e214a8abafe98234f6`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Connected-traditions reference beside map: regional fields, focus, source popups and expanded view
- Proposal-style section hero and family hierarchy; numbered regional section groups with matching colors
- Nadi frame summaries in sections, families, selections, tree dialogs and move-day cards

## Verification

- dev:check passed; 20 targeted graph/planner/packaging tests passed; desktop and 390px sample-data visual checks, priority popup checked

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: Reviewed static graph; no database writes, migrations or reimport
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Planner/move-list components, museum CSS/tokens, design docs; includes region-flow 5e6ca85 and packaging 290026e
- Expected conflicts: Retain both regional ordering and packaging helpers in domain/docs during integration. Temporary sample route removed. Existing auth, routing and save actions unchanged.
- Rollback notes: revert `1230d5b` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
