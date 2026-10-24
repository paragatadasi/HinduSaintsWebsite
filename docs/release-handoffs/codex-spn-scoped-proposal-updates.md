# Release Handoff: codex/spn-scoped-proposal-updates

- Status: ready
- Branch: `codex/spn-scoped-proposal-updates`
- Commit: `6c06ebb9d3d650b897b3df333ea1f19a7f4b4613`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Add guarded SPN-only section, tier and family decisions in main-admin Source Data, preserving placement IDs and current arrangements.
- Export current public summaries, effective scoped decisions and relationship context for research.

## Verification

- dev:check passed; 9 domain tests passed; disposable database integration passed; final codex:verify passed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: After runtime promotion Nadi applies Kaleshwar Sai family update and independently approved tier decisions through authenticated admin UI; no automatic backfill or migration.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: lib/museum-working-data.ts; lib/museum-proposals.ts; SPN tier audit; museum saint detail annotation; new main-admin source-data review route.
- Expected conflicts: Citra regional navigation branch also changes saint detail backlink to Section overview; identical replacement. Preserve scoped decision annotation.
- Rollback notes: revert `6c06ebb` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
