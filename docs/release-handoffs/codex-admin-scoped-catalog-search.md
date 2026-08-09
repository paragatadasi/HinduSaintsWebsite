# Release Handoff: codex/admin-scoped-catalog-search

- Status: ready
- Branch: `codex/admin-scoped-catalog-search`
- Commit: `011998ae1548e914599a339984174ba175e484af`
- Owner/agent: `admin-overhaul B2`
- Bundle priority: immediate release candidate

## Summary

- Adds role-scoped Full Catalog and Public saint review with workflow cards and orthogonal filters.
- Unifies weighted fuzzy saint search across the queue and assignment target picker with server-enforced catalog scope.
- Hides private saint names, counts, assignments, and Instagram matching surfaces from unauthorized roles while preserving curator visibility controls.

## Verification

- `npm run dev:check` passed; `npm test` passed 119/119; `npm run codex:verify` passed, including production compilation, type checking, page-data collection, 16/16 static pages, and build-trace collection

## Deploy Notes

- Migrations: 20260810100000_backfill_fact_checker_roles changes the User.roles default to fact_checker and replaces stored contributor roles with deduplicated fact_checker roles.
- Environment variables: none
- Data/backfill/release steps: Migration performs the planned rolling-safe Contributor-to-Fact-checker role backfill; no manual backfill step.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: admin navigation/dashboard, saint review/detail/actions/search, assignment workspace/actions, tradition/place saint references, ReviewEditToggle, Prisma User role default, workflow documentation
- Expected conflicts: Coordinate with branches touching admin navigation, dashboard, saint review, assignments, or the User role default.
- Rollback notes: revert `011998a` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
