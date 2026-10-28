# Release Handoff: codex/move-ram-bhakti

- Status: ready
- Branch: `codex/move-ram-bhakti`
- Commit: `05a51b1235bbe59f444bfa1e7e2788c725c8b147`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Add seven-entry Ram Bhakti core as a separate move guide phase for Vitrine80

## Verification

- dev:check PASS;11 focused tests PASS;browser exact7 roster/search/modal/mobile PASS;production build compiled successfully but final completion is pending; release captain must pass integrated codex:verify before deploying

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Move route, companion phase navigation, registered guide physical scope
- Expected conflicts: none
- Rollback notes: revert `05a51b1` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
`/museumadmin/move?phase=ram-bhakti` opens the seven-source Ram Bhakti core at80. Starter default, Datta and Vitrine2 tree retained. Includes Nadi2a51fe9 contract as97dcf1e. Five current Primaries/two Secondaries; Godsay positive-source living uncertainty retained. No new tier/physical/canonical writes. Whole clearing, staging, unrelated sources/targets rejected by registered scope. Other ten80 records remain outside phase, not moved or declared cleared. No schema/migrations/env/backfill. Notify Citra and Nadi after actual hosting promotion; public workflow dispatch alone is not private hosting readback. User add-next-phase authorization verified by Nadi; no hold.

