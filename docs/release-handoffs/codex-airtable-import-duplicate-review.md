# Release Handoff: codex/airtable-import-duplicate-review

- Status: ready
- Branch: `codex/airtable-import-duplicate-review`
- Commit: `4729107089eaccc9c3acef9c94e906c7d6397002`
- Owner/agent: `Airtable Data Sync`
- Bundle priority: immediate release candidate

## Summary

- Prevent automatic duplicate drafts from Airtable slug collisions and match existing aliases. The legacy slug repair path also skips identity collisions.
- Add protected imported-draft review with run filters and existing archive controls.
- Document staged production recovery in docs/airtable-import-duplicate-recovery.md.

## Verification

- `npm run dev:check`: passed
- `npm run prepare:deployment`: passed
- `npm test`: passed (239 passed, 1 skipped)
- `npm run codex:verify`: passed (production build, 18 static pages, trace collection)

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: no automatic production data changes. Follow docs/airtable-import-duplicate-recovery.md after successful release. Production run identification and candidate review remain separate work; local database history only extends through June.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: lib/airtable-saint-import.ts; app/admin/airtable; new app/admin/saints/imported route. No schema, dependencies, shared styles or auth changes.
- Expected conflicts: coordinate any overlapping Airtable importer or Saint review edits. Distinct saints sharing names now require editorial review. Legacy run filters use timestamps and can overlap; they are not deletion manifests. Archiving preserves source data but does not undo shared taxonomy/media/source creation.
- Rollback notes: revert `4729107` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
