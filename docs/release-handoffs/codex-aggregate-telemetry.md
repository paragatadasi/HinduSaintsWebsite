# Release Handoff: codex/aggregate-telemetry

- Status: ready
- Branch: `codex/aggregate-telemetry`
- Commit: `7151acf0a61cdb5eb8f348faa172810f78c7fe71`
- Owner/agent: `/root`

## Summary

- Adds anonymous aggregate reliability, performance, navigation, and engagement telemetry without cookies, browser storage, or visitor identifiers.
- Adds a protected admin dashboard for aggregate errors, load outcomes, Core Web Vital buckets, interaction counts, and existing page-view totals.

## Verification

- `npm run prepare:deployment`: passed
- `npm test`: passed (92 tests)
- `npm run codex:verify`: passed, including the production Next.js build
- Local development migration and real API aggregate-write test: passed; synthetic counters removed afterward

## Deploy Notes

- Migrations: adds `20260806120000_aggregate_telemetry`; run `prisma migrate deploy` during the deployment release phase
- Environment variables: none
- Data/backfill/release steps: no backfill; collection begins after deployment and existing aggregate page-view data remains unchanged

## Risk And Conflicts

- Shared areas touched: `app/admin/analytics/page.tsx`, `components/analytics/page-view-tracker.tsx`, `components/ui/button.tsx`, `lib/page-view-path.ts`, and `prisma/schema.prisma`
- Expected conflicts: possible overlap with concurrent changes to admin analytics, global page tracking, shared Button props, public path normalization, or the Prisma schema
- Rollback notes: revert `7151acf` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
