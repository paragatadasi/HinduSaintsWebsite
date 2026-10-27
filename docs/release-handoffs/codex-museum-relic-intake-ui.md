# Release Handoff: codex/museum-relic-intake-ui

- Status: deployed
- Branch: `codex/museum-relic-intake-ui`
- Feature commit: `ae196a4`
- Integrated main: `7a05f66`
- Integrated deploy: `c382461`
- Owner/agent: Citra
- Bundle priority: immediate authorized intake release; SPN proposal already deployed

## Summary

Protected relic intake and curator review, with private photo uploads, saved drafts, field-level validation, corrections, and immutable approval snapshots. Approved records await delivery setup; neither Airtable nor website delivery is enabled.

## Verification

- `npm run dev:check`: passed.
- `npm run codex:verify`: passed for combined UI and backend.
- Nine domain/storage/public-namespace tests: passed, including proxy-origin regression and public filesystem/S3 guards.
- All 85 migrations applied to disposable local database `museum_intake_test_20261027`.
- Local database integration: passed persistence, retry safety, owner isolation, concurrent edits, corrections, immutable approvals, and blocked deliveries.
- Real authenticated HTTP checks: PASS on corrected build. Anonymous401, contributor403, foreign-origin403, curator create/upload200, private photo access and no-store, public media404, stale save409, submit/approve200, both deliveries blocked, approved photo deletion409. Disposable sessions removed.
- Reserved shared-volume verification: combined codex:verify PASS; updated authenticated HTTP test PASS using exact temporary public-root/_museum-private subtree. Actual reserved public key returned404 with no redirect.
- App restart test PASS: approved photo persists, authenticated GET returns matching bytes, public key remains404 after restart. Disposable test sessions removed and local server stopped.
- Real mobile camera and production persistence/private URL verification: outstanding.

## Deploy Notes

- Migration: `20261027020000_museum_relic_intake` (three additive tables); apply in release phase.
- Set AUTH_URL to the canonical public origin; origin fix supports reverse-proxy internal hostnames while rejecting foreign origins.
- Approved fallback uses existing persistent app_uploads volume: `MUSEUM_INTAKE_STORAGE_BACKEND=filesystem`, `MUSEUM_INTAKE_UPLOAD_ROOT=/app/uploads/_museum-private`, `MEDIA_UPLOAD_ROOT=/app/uploads`. Exact reserved subtree only; public media guard must be deployed atomically. Intake backend is independent of the public S3 backend.
- Compose now configures the reserved private subtree without adding a volume. Verify actual production app_uploads persistence and UID 1001 write access; no Caddy/static mapping may expose it. `.dockerignore` excludes private-uploads and uploads.
- Keep Airtable delivery disabled until user review in the morning. Website delivery is also unimplemented/disabled; approval does not publish or create canonical saints/relics.
- Team access and Airtable configuration questions remain deferred to morning.
- No production data migration/backfill beyond additive schema. No physical moves or identity merges.

## Risk And Conflicts

- Shared areas: museum navigation, shared admin styles, design-system documentation, Prisma schema and intake API.
- Includes Nadi backend commit `077d05e` through cherry-pick `96a9a19`; do not integrate backend twice.
- Preserve approval snapshots and private photos on rollback. NEVER revert public media deny guards while private photos remain in the shared volume. Retain guards in rollback image, or relocate photos to protected storage first; do not delete data.

## Release Captain Notes

- Direct user authorizes intake deployment with approved reserved-volume fallback. Verify actual production persistence, UID1001 permissions and no direct static exposure before accepting photos.
- Integrated into main: `7a05f66`.
- Integrated into deploy: `c382461`.
- Production workflow: [40489005792](https://github.com/paragatadasi/HinduSaintsWebsite/actions/runs/40489005792) — completed successfully.
- Production storage checks remain operational follow-up: confirm the live `app_uploads` volume is persistent, writable by UID 1001, and not directly exposed by Caddy/static hosting before accepting photos.
