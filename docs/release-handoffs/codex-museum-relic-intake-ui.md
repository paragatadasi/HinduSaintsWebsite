# Release Handoff: codex/museum-relic-intake-ui

- Status: blocked
- Branch: `codex/museum-relic-intake-ui`
- Commit: `3c4f576e466c6ec297e548244fdc06964e0ee4b6`
- Owner/agent: Citra
- Bundle priority: bundle with final SPN proposal once blockers below pass

## Summary

Protected relic intake and curator review, with private photo uploads, saved drafts, field-level validation, corrections, and immutable approval snapshots. Approved records await delivery setup; neither Airtable nor website delivery is enabled.

## Verification

- `npm run dev:check`: passed.
- `npm run codex:verify`: passed for combined UI and backend.
- Six domain/storage tests: passed.
- All 85 migrations applied to disposable local database `museum_intake_test_20261027`.
- Local database integration: passed persistence, retry safety, owner isolation, concurrent edits, corrections, immutable approvals, and blocked deliveries.
- Real authenticated HTTP checks: Nadi investigating curator POST returning 403. Release blocked until fixed and retested.
- Real mobile camera and production private-storage verification: outstanding.

## Deploy Notes

- Migration: `20261027020000_museum_relic_intake` (three additive tables); apply in release phase.
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

- Direct user authorizes bundled release after checks; current HTTP/storage blockers must be resolved first.
- Integrated into main: pending.
- Production workflow: pending.
