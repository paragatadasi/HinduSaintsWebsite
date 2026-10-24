# Release Handoff: codex/spn-proposal-explorer-v15

- Status: ready
- Branch: `codex/spn-proposal-explorer-v15`
- Commit: `aad53198a142333345b9ae0ac7a08145802efca6`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Approved SPN v15 room explorer with portrait rows, turn controls, proposal comparison and vitrine-specific connections
- Preserves newer curator decisions and keeps private proposal metadata behind the authenticated museum route

## Verification

- npm run codex:verify passed; eight targeted proposal/explorer tests passed; browser rotations, portraits, search and overflow checks passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No database writes or backfill; immutable v15 baseline reconciles with current curator decisions at read time
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: app/museumadmin/plan/page.tsx, styles/globals.css, scoped explorer styles, museum data adapters
- Expected conflicts: Inspect museum plan route and shared styles during integration; user explicitly resumed deployment on 2026-10-25
- Rollback notes: revert `aad5319` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
