# Release Handoff: codex/museum-final-review

- Status: ready
- Branch: `codex/museum-final-review`
- Commit: `7f394ad7a1d8a29512cf4df7bb0fe8be8b0d92df`
- Owner/agent: Citra
- Bundle priority: immediate release candidate

## Summary

- Adds Final review and Unaddressed records tabs: unique effective rosters, Starting/Proposed/Current locations, Missing/Other flags and notes, independent location filters, shared shelf/to-do controls, and final-review destination edits with optional physical confirmation.
- Final decisions supersede earlier proposals across rosters and Progress. Flags do not change physical locations. Checkbox confirmation does not accept a suggested shelf.
- Incremental refreshes, ETags, paginated queues, scoped save reconciliation and stable retry IDs preserve performance and concurrent-review safety.

## Verification

- Combined `npm run prepare:deployment`: passed at 7f394ad.
- 33 focused UI/domain/progress/roster/late-response regression tests: passed.
- Nadi backend `npm run codex:verify`: passed, including standalone packaging; persistent final-review-build-verification.exit = 0.
- Genuine disposable PostgreSQL six-user verification: passed, persistent final-review-database-verification.exit = 0. Covers independent saves, competing edits, retry receipts, source/physical races, delta refresh, lower-priority guards and zero heavy inventory invalidations for flags.
- Existing Active move PostgreSQL regression: 22 checks passed.
- Local service timings documented in docs/museum-companion-save-concurrency.md. Batch times are not per-user or production latency measurements.
- SSR UI checks passed. Interactive browser QA remains a release integration check: file-protocol preview was blocked by browser tooling; no workaround attempted.

## Deploy Notes

- Includes backend code commits 233f2f7 and 3b9d45b. Release frontend and backend together; do not cherry-pick only UI.
- Migrations: additive `20261102120000_museum_final_review` (state, revision and receipt tables plus selective triggers). Apply in release/migrate phase, never web build.
- Environment variables: none.
- Data/backfill: none; existing physical history, source evidence, shelves and tasks are preserved. No production data writes performed.
- Queue/deploy trigger: ready for Mira's integrated verification and release.

## Risk And Conflicts

- Shared areas: move companion, progress, shared roster projection, admin CSS/design guidance, catalogue/read cache, physical save authorization, schema/migration.
- Backend handoff is the same code already integrated here; avoid duplicate cherry-picks.
- Run integrated build and browser checks in the persistent release verification worktree before deployment.
- Rollback: revert feature code while retaining additive tables/history; do not delete saved review decisions.
- Museum evidence skill review found no reusable interpretation changes.

## Release Captain Notes

- Integrated into main: pending
- Pushed to main: no
- Merged to deploy: pending
- Production workflow: pending
