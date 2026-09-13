# Release Handoff: codex/preserve-primary-traditions

- Status: ready
- Branch: `codex/preserve-primary-traditions`
- Commit: `5e5cbc8f907e473c42250eeb108eab71a92b6f19`
- Owner/agent: `aporu`
- Bundle priority: immediate release candidate

## Summary

- Preserve saved primary traditions and restore the pre-option display fallback for legacy records without a saved primary flag.
- Persist an explicit no-primary preference; a missing primary form field no longer clears a saved primary. Retained membership IDs and notes survive saves.

## Verification

- `npm run dev:check`: passed
- `npm run prepare:deployment`: passed
- `npx tsx --test lib/saint-primary-tradition.test.ts`: 9 regression tests passed.
- `npm run codex:verify`: passed on this code before committing; all 17 static pages and production traces completed.
- `git diff --check`: passed. Production data and migration execution have not been verified from this workspace.

## Deploy Notes

- Migrations: `20260913180000_explicit_no_primary_tradition` adds `Saint.noPrimaryTradition` with default false. Apply in the release migration phase before serving the new application. No existing membership or primary flag is updated by the migration.
- Environment variables: none
- Data/backfill/release steps: no bulk backfill or import replay. Verify the user-reported Sri Vamsi Das Babaji primary against pre-release evidence. If an actual saved flag was cleared after the prior release, recover that exact membership from backup/audit evidence rather than guessing. See `docs/saint-primary-traditions.md`.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Prisma Saint model and additive migration; saint admin page, tradition editor and actions; new primary-tradition helper/tests.
- Expected conflicts: other edits to the Saint model or saint admin actions/editor. Explicit no-primary choices from the earlier release cannot be distinguished from legacy unflagged records; those choices may need to be saved again. The new flag distinguishes them going forward.
- Rollback notes: revert `5e5cbc8` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
