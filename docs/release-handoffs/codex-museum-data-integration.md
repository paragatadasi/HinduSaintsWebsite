# Release Handoff: codex/museum-data-integration

- Status: ready
- Branch: `codex/museum-data-integration`
- Commit: `0be3226cad6088f7e9ce85f02968c940126edce9`
- Owner/agent: `Museum Data Integration`
- Bundle priority: immediate release candidate

## Summary

- Connect museum browsing and editing to canonical CMS saints and private persisted placements, with source references, review queue, exhibit groups, and audited decisions.
- Stage Airtable and historical export changes as proposals; preserve human decisions and reject stale edits. Preserve museum context through saint merges.
- Fix shared footer HTML nesting that interrupted hydration and contain the mobile header search label to prevent horizontal overflow.

## Verification

- `npm run prepare:deployment`: passed, including fresh `dev:check` and generated handoff.
- `npm run codex:verify`: passed on final code before this handoff; existing CSS compatibility warnings only.
- `npm test`: 201 passed.
- `npm run test:museum:integration`: passed against a disposable local PGlite PostgreSQL engine; all migrations applied, duplicate legacy primaries preserved and audited. Includes persistence, proposal/idempotency/reversion/conflict handling, rollback, source clearing, legacy mapping, and full saint merge. Real PostgreSQL concurrent-session stress testing was not performed.
- Browser checks passed: saved edits survive reload, stale edits retain input, proposal acceptance, mobile overflow, review search, authentication and role restrictions, noindex, and exclusion of private museum notes from public saint HTML.
- `git diff --check`: passed.

## Deploy Notes

- Migrations: `20260930090000_museum_integration`. Run in the release migration phase before serving new code, never in the web build. Adds proposal/state/group storage and one accepted primary per saint. Existing competing accepted primaries are preserved, snapshotted in audit history, and marked needs_review.
- Environment variables: no new production variables. Optional Airtable schema-read permission enables table-specific source links; imports continue without it. `MUSEUM_TEST_DATABASE_URL` is test-only.
- Data/backfill/release steps: after migration, run read-only `npm run museum:audit` against the intended production database and retain its output. Then use Prepare source proposals in `/museumadmin/review`; resolve ambiguous identities through existing import/reconciliation and review proposals explicitly. No automatic acceptance or overwriting of human edits. Production audit/staging has not run, so the historical 1,399 export IDs are not a production coverage claim. Until proposals are reviewed, the database-backed browser may show fewer placements than the old static export.
- Queue/deploy trigger: ready now under the release-captain workflow; feature agent has not merged main/deploy or changed production data.
- Full rollout context: `docs/museum-data-integration.md`.

## Risk And Conflicts

- Shared areas touched: Prisma schema/migration, Airtable cleanup importer and mirror metadata, saint merge service, package scripts, review-ui, global CSS, and shared footer. Museum routes/data contracts are replaced with database-backed versions.
- Expected conflicts: inspect overlaps with other Prisma, import, merge, shared search/layout, or admin UI branches. Preserve the header label containment and footer nesting corrections when resolving shared layout changes. Integrate schema/backend contracts before dependent UI branches.
- Rollback notes: keep additive schema and audit/proposal data. Reverting only application code restores the old static museum view and old import behavior, so pause museum cleanup/import jobs during a rollback. Do not blindly reverse the migration or erase decisions; recovery of pre-migration conflicting primaries requires explicit review of audit snapshots and the uniqueness constraint.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
