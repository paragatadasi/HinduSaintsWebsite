# Release Handoff: codex/vrindavan-remaining-review

- Status: ready
- Branch: `codex/vrindavan-remaining-review`
- Commit: `9fc5d38178a0b778290d199fbfdf53d11baac550`
- Owner/agent: `Museum Data Integration (Nadi)`
- Bundle priority: immediate release candidate

## Summary

- Group current Vrindavan pending and deferred identity rows into review batches; preserve confirmed links and surface unavailable targets.
- Add protected uncached JSON download with current website matching evidence and repeated source-name rows.

## Verification

- dev:check and codex:verify passed; four targeted grouping tests passed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: Read-only. After deployment obtain the private current identity review export to prepare recommendations; no import, identity or placement writes.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Main admin Vrindavan identity listing and museum workflow documentation. Existing identity decision actions unchanged.
- Expected conflicts: Coordinate simultaneous edits to app/admin/source-data/museum/vrindavan/page.tsx; no schema or museum workspace UX changes.
- Rollback notes: revert `9fc5d38` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
