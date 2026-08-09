# Release Handoff: codex/admin-workflow-foundation

- Status: ready
- Branch: `codex/admin-workflow-foundation`
- Commit: `92e1d282382f56602ecfa1817934022054316bdf`
- Owner/agent: `aporu`
- Bundle priority: immediate release candidate

## Summary

- Adds orthogonal Team Visibility, Publication Status, and Workflow Status fields for Saints, Traditions, and Places while retaining the current combined-status UI until B2/B3 can replace it coherently.
- Adds Fact-checker and Writer roles plus the capability foundation for scoped catalog, Instagram, editorial, assignment, visibility, duplicate, and merge workflows. Existing Contributor values render and authorize as Fact-checker during the rolling-safe transition.
- Dual-writes current Saint/Tradition publication actions, enforces Published implies Public in PostgreSQL, and centralizes the derived Saint Match Status contract.
- Updates Users & Access within the existing responsive role grid and records the five-chunk dependency/design workflow in admin documentation.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed (115 tests)
- `npm run codex:verify`: compiled, type-checked, collected page data, and generated all 15 static pages; stopped only at the known Windows junction `EPERM` during standalone trace copying.
- Migration execution: not run locally because Docker Desktop was unavailable; Prisma generation/schema validation passed. Release captain should validate both migrations in the integrated release environment.

## Deploy Notes

- Migrations: `20260809100000_admin_workflow_foundation_schema` and `20260809101000_admin_workflow_foundation_backfill`
- Environment variables: none
- Data/backfill/release steps: normal deployment migration phase only. Saints and Traditions are mapped from legacy status, existing Places become Published/Public, and all three entity types begin at Needs Review. The stored Contributor-to-Fact-checker role backfill is intentionally deferred to B2 so the migration cannot expose the new enum to the old application during rolling replacement.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Prisma schema/migrations, shared permissions, Saint/Tradition publication actions, Saint bulk match filter, Users & Access, admin workflow documentation
- Expected conflicts: branches changing `prisma/schema.prisma`, `lib/permissions.ts`, Users & Access roles, or Saint/Tradition publication actions should integrate after this foundation.
- UX review: no new one-off styles or workflow shells; the only visible change reuses the established responsive role-option grid with concise explanatory copy. Live browser/database QA was unavailable because local PostgreSQL could not start without Docker Desktop.
- Rollback notes: revert `92e1d28` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
