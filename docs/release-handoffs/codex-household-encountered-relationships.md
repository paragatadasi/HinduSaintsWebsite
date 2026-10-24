# Release Handoff: codex/household-encountered-relationships

- Status: ready
- Branch: `codex/household-encountered-relationships`
- Commit: `680a086ac91c0f2c8dcebd6521c41a81616ee4f8`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Add Household and Encountered to shared saint relationship types and admin validation; symmetric contextual links do not infer museum families or tiers.

## Verification

- npm run dev:check: passed; 17 focused relationship/family tests: passed; npm run codex:verify: passed (rerun outside sandbox after Windows output-directory EPERM; existing CSS autoprefixer warnings only).

## Deploy Notes

- Migrations: 20261024170000_household_encountered_relationships: additive RelationshipType enum values; release-phase migration before application writes.
- Environment variables: none
- Data/backfill/release steps: After promotion Nadi will use authenticated Summary UI for3approvedpairs listed in docs/saint-contextual-relationships.md; no automated backfill.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: prisma/schema.prisma; app/admin/saints/actions.ts; lib/saint-relationships.ts; related regression tests
- Expected conflicts: none
- Rollback notes: revert `680a086` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending

Rollback: retain the additive enum values. After new-type records are created, avoid rolling back to an admin editor that rejects these values. No destructive down migration.

