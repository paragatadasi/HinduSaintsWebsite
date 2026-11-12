# Release Handoff: codex/shuffle-guide

- Status: ready
- Branch: `codex/shuffle-guide`
- Commit: `c56531d825c0cd201e165a127fed31a3512178ab`
- Owner/agent: Citra
- Bundle priority: immediate release candidate

## Summary

- Add Saarthi's SPN Shuffle Guide: 33 required actions plus one conditional action, shared saved checkboxes, undo, inline retry, and concurrent-edit protection.
- Rename visible Final review labels to Review; preserve existing route/state keys.
- Checklist completion is independent of physical inventory moves and existing review decisions.

## Verification

- `npm run prepare:deployment`: passed.
- `npm test`: 1,057 passed, zero failed, one skipped.
- `npm run codex:verify`: exit 0, compiled and generated routes. Local dependency junction caused standalone trace-copy EPERM warning; release captain must verify packaging with the real dependency installation.
- Browser: check/uncheck, second-client refresh, reload persistence, conditional progress exclusion, and failed-response idempotent retry passed against mock endpoint.
- Nadi authenticated API + fresh migrated PostgreSQL: curator/assistant access, unauthorized/origin rejection, simultaneous same-action conflict, undo, idempotent retry and latest-version reads passed. Physical inventory/session/arrangement tables remained unchanged.
- Reproducible private verifier: `C:/Users/aporu/.codex/visualizations/2026/09/30/01a0f25f-fc6a-7fd2-a3f8-cd78f289cc5e/spn-shuffle-guide-http-verification-2026-11-12.mts` (copy to scripts for relative imports; disposable local database only).

## Deploy Notes

- Migration: `20261112130000_museum_shuffle_guide_progress`; additive append-only checklist revision table. Run during release migration phase, not image build.
- Environment variables: none.
- Data/backfill: none; initial checkboxes unchecked. Existing placements, flags and review data are preserved.
- Queue/deploy trigger: ready now; user requested preparation for deployment.

## Risk And Conflicts

- Shared areas: companion component, global CSS, Prisma schema, design documentation. New guide/API/client helper files.
- Branch builds on review-before-flag-resolution `9f82549`; feature commits `bdc2b27` and `c56531d`. Backend c56531d cherry-picks Nadi's 67fb64e; do not integrate both copies independently.
- Keep stable action IDs across copy edits. Conditional action excluded from required progress.
- Rollback: revert UI/API feature commits if needed; retain additive table and saved checklist history. No destructive down migration.

## Release Captain Notes

- Integrated into main: pending
- Pushed to main: no
- Merged to deploy: pending
- Production workflow: pending
