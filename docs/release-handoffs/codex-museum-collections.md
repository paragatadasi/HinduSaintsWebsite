# Release Handoff: codex/museum-collections

- Status: ready
- Branch: `codex/museum-collections`
- Commit: `0d1ec314006e8efbe641da2b6cd3a6b76933d162`
- Owner/agent: `museum-data-integration`
- Bundle priority: immediate release candidate

## Summary

- Private multi-museum collections: museum-scoped inventory and locations, many relics per saint, placement history, and private card payload.
- Preserves raw source observations without overwriting reviewed inventory; saint merges preserve collection links.

## Verification

- dev:check passed; npm test 221 passed, 1 unrelated guarded skip; isolated PGlite/PostgreSQL integration passed all migrations, scoped inventory/vitrines, uniqueness, transfers/history, card projection, observation idempotence/reversion, saint merge and archive; codex:verify passed (existing CSS autoprefixer warnings). Checks completed on unchanged code 0d1ec31 before handoff.

## Deploy Notes

- Migrations: 20261001170000_museum_collections: additive tables, SPN/Vrindavan museum seeds, foreign keys, placement-period check and one-current-placement partial unique index. Run in release migration phase BEFORE new readers serve requests.
- Environment variables: none
- Data/backfill/release steps: No production import or backfill. Actual SPN mirror field mapping and Vrindavan Excel inspection remain pending. No relics/vitrine assignments seeded. Collection reconciliation UI and source-specific adapters are not included.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: prisma/schema.prisma; lib/museum-working-data.ts; lib/museum-working-view.ts; lib/museum-proposals.ts; lib/saint-merge-service.ts; docs/museum-data-integration.md
- Expected conflicts: Coordinate codex/museum-saint-biodata changes in shared museum reader/types; preserve collectionItems projection. Queued codex/museum-clickable-family is UI-only and has no direct overlap.
- Rollback notes: roll back application code and dependent readers together; retain additive collection tables and any captured observations. Do not drop collection data during rollback.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending

