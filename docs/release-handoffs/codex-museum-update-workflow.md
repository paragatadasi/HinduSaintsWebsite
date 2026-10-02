# Release Handoff: codex/museum-update-workflow

- Status: `ready`
- Branch: `codex/museum-update-workflow`
- Commit: `044379f255d01e8fccec7b804843872ea1299175`
- Owner/agent: Museum Data Integration
- Bundle priority: immediate release candidate

## Summary

- Adds Admin > Source Data > Museum updates with a reusable refresh control, job progress and uncertain-match review.
- Refreshes the Website SPN Saints/Relics mirror atomically; preserves canonical content and existing source links. Reviewers can link unlinked rows to existing saints, defer or reopen with an audit note.

## Verification

- npm run prepare:deployment: passed.
- npm run codex:verify: passed on deployable code (Prisma, TypeScript and production build).
- npm test: 230 passed, one guarded database test skipped.
- Disposable database integration: passed persistence, replay, stale review, preserved edits, failed/missing-source rollback and expired job recovery. Paginated 1,423 Saints / 1,311 Relics fixture passed in 13 seconds.
- Authenticated local HTTP/visual checks: main Source Data page works; anonymous/curator access denied; Data Admin/Site Admin allowed; invalid origin, malformed body and wrong sensitive-action password rejected. No production data was used or modified.

## Deploy Notes

- Migrations: additive 20261002120000_museum_update_jobs (MuseumUpdateJob and MuseumSourceReview); run in release migration phase.
- Environment variables: no new variables. Requires existing AIRTABLE_BASE_ID for Website SPN base appMapiXrtNwnS9oZ and AIRTABLE_ACCESS_TOKEN or AIRTABLE_PAT. AIRTABLE_VIEW must be empty/unset. PUBLIC_SITE_URL or NEXTAUTH_URL must match production origin. Existing sensitive-action password required to start updates.
- Data/backfill/release steps: no automatic import/backfill. After deployment, an authorized Data Admin can run Check for museum updates. No saints or inventory are created, no content published and no confirmed placements modified. Please confirm configuration without exposing values/secrets.
- Queue/deploy trigger: ready now; user explicitly requested deployment preparation and coordinated release checkpoints.

## Risk And Conflicts

- Shared areas touched: Prisma schema; admin navigation; museum review cross-link. New Source Data page/API/services isolated otherwise.
- Expected conflicts: no known conflict; preserve other navigation changes.
- Runtime: Next after task with recorded twenty-minute lease and manual retry; no automatic worker restart. Both tables must finish before writes. Source removals abort for review.
- Tests use PGlite and mocked Airtable; real PostgreSQL concurrent sessions and live authenticated refresh remain release smoke checks.
- Rollback notes: revert feature code; retain additive tables/audit evidence. If a refresh has been run, do not delete data or restore snapshots automatically.

## Release Captain Notes

- Integrated into main: pending
- Pushed to main: no
- Merged to deploy: pending
- Production workflow: pending