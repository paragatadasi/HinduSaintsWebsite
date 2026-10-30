# Release Handoff: codex/vraj-active-shelves

- Status: `ready`
- Branch: `codex/vraj-active-shelves`
- Commit: `3820cf66ce0e1503ef4ed0b5bc68ebfd571c06ca`
- Owner/agent: Citra, with Nadi backend
- Bundle priority: immediate release candidate

## Summary

- Adds Vraj Phase 2 with reviewed receivers 32, 33, 34, 35 and 38: 98 source observations. Existing Vraj 79/77 version, decisions and physical history stay unchanged.
- Connects guarded Vraj/East shelf recommendations to the active companion using existing shelf cards, bring-from locations, checkbox and decline/defer controls. Current source identities/revisions and destinations filter stale recommendations.
- Shared shelf reader reuses loaded context when switching vitrines. Errors have inline retry; complete checklists stay available. Checkbox placement never writes a suggested shelf.
- New registered guide rechecks current assignment/source/identity under existing move lock, with per-receiver clearance/preparation. Null-canonical sources remain source-scoped. Case 33 unknown footprint and 35 fit warnings remain.

## Verification

- `npm run prepare:deployment`: passed (Prisma generation + TypeScript).
- `npm test`: 778 passed, 1 skipped, 0 failed.
- Actual component browser checks: V35/V33 shelf cards, failed-load retry, no refetch on case switching, stale-source suppression; Vraj Phase 2 mocked placement saves V32 without shelf and immediate pending feedback (30ms observed fixture, not production latency).
- Nadi actual captured production snapshot preflight: 98 active, 0 held, 0 changed; counts 18/22/19/19/20. Runtime guards re-evaluate newer data.

- Final provenance correction: exact upstream `spn-vraj-locked-2026-10-29-v17`, canonical content digest regenerated; seven focused tests and dev:check passed again. Runtime assertion prevents proposal-version drift. Assignment digest and all 98 rows unchanged.

## Deploy Notes

- Migrations: none.
- Environment variables: none.
- Data/backfill/release steps: none; no production physical writes. Airtable remains disabled.
- Integrate this combined branch, not Nadi backend alone. Includes cherry-pick of his `0b6234b` as `ca0f67f`.
- Queue/deploy trigger: ready now per user request to load remaining Vraj shelves.

## Risk And Conflicts

- Shared areas: move page/companion, guide registry, physical-location mutation validation, shelf context reader, addition owner order, design-system documentation.
- Prior reviewed-component staging commits are ancestors and already released; do not replay as separate data work.
- Fit estimates remain recommendations. Saved curator overrides and physical ledger win; new phase does not auto-clear or auto-place.
- Rollback: revert this combined feature; do not delete saved decisions or physical records.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending; public dispatch success alone does not verify serving image.
