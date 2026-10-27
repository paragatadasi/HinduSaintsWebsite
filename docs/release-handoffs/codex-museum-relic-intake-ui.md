# Release Handoff: codex/museum-relic-intake-ui

- Status: ready
- Branch: `codex/museum-relic-intake-ui`
- Commit: `76efec7e54e59192decabb27a6728f39d785d69d`
- Owner/agent: Citra
- Bundle priority: bundle with final SPN proposal once blockers below pass

## Summary

Protected relic intake and curator review, with private photo uploads, saved drafts, field-level validation, corrections, and immutable approval snapshots. Approved records await delivery setup; neither Airtable nor website delivery is enabled.

## Verification

- `npm run dev:check`: passed.
- `npm run codex:verify`: passed for combined UI and backend.
- Seven domain/storage tests: passed, including proxy-origin regression.
- All 85 migrations applied to disposable local database `museum_intake_test_20261027`.
- Local database integration: passed persistence, retry safety, owner isolation, concurrent edits, corrections, immutable approvals, and blocked deliveries.
- Real authenticated HTTP checks: PASS on corrected build. Anonymous401, contributor403, foreign-origin403, curator create/upload200, private photo access and no-store, public media404, stale save409, submit/approve200, both deliveries blocked, approved photo deletion409. Disposable sessions removed.
- Real mobile camera and production private-storage verification: outstanding.

## Deploy Notes

- Migration: `20261027020000_museum_relic_intake` (three additive tables); apply in release phase.
- Set AUTH_URL to the canonical public origin; origin fix supports reverse-proxy internal hostnames while rejecting foreign origins.
- Requires persistent private `MUSEUM_INTAKE_UPLOAD_ROOT` outside public uploads, owned by runtime UID 1001, or a separate private `MUSEUM_INTAKE_S3_BUCKET` when using S3.
- Existing compose only has public upload storage; Mira owns private storage deployment configuration.
- Keep Airtable delivery disabled until user review in the morning. Website delivery is also unimplemented/disabled; approval does not publish or create canonical saints/relics.
- Team access and Airtable configuration questions remain deferred to morning.
- No production data migration/backfill beyond additive schema. No physical moves or identity merges.

## Risk And Conflicts

- Shared areas: museum navigation, shared admin styles, design-system documentation, Prisma schema and intake API.
- Includes Nadi backend commit `077d05e` through cherry-pick `96a9a19`; do not integrate backend twice.
- Preserve approved snapshot and private photo data on rollback; reverting UI does not require dropping tables.

## Release Captain Notes

- Direct user authorizes bundled release after checks; production private-storage configuration and integrated release checks must pass first.
- Integrated into main: pending.
- Production workflow: pending.
