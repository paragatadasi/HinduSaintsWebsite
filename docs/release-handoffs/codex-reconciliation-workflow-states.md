# Release Handoff: codex/reconciliation-workflow-states

- Status: ready
- Branch: `codex/reconciliation-workflow-states`
- Commit: `592cc1f115c4966e3633275abfbbeae64cbcab3e`
- Owner/agent: `Review admin reconciliation UX (01a08072-2914-7392-b659-fbc0cfe0903c)`
- Bundle priority: immediate release candidate

## Summary

- Pass one of the reconciliation cleanup: separate duplicate and source-conflict workflow states, explicit deferral with a reason, completed summaries and reopening, and confirmation-to-merge navigation.
- Source change/merge requests remain open but appear in Follow-up needed. Completed merges have a dedicated history queue, distinguishing the selected pair from other reviews closed by the merge.
- Record each new decision atomically with its actor and audit event; reject stale forms. Preserve source issue type during navigation and order severity explicitly before the queue limit.

## Verification

- `npm run dev:check`: passed
- `npm run prepare:deployment`: passed
- `npm run codex:verify`: passed; existing Autoprefixer warnings in unchanged global CSS.
- `node --import tsx --test lib/reconciliation-decisions.test.ts lib/reconciliation-workflow.test.ts lib/saint-duplicates.test.ts lib/saint-merge.test.ts`: 29 tests passed.
- `git diff --check`: passed.
- Live database migration and authenticated browser smoke tests: not run. Docker was not ready; starting Docker Desktop did not make the engine respond during this preparation.

## Deploy Notes

- Migrations: `20260908120000_duplicate_review_action` adds nullable `DuplicateCandidate.resolutionAction`. Run in the migrate/release phase before the new web image serves requests.
- Environment variables: none
- Data/backfill/release steps: the migration backfills legacy completed duplicate reviews only from durable `merge_saints` audit evidence. Legacy deferrals without an action stay in Needs review. No external sources are changed.
- Recommended development smoke check before release: apply the migration to a development database; confirm/defer/reopen a duplicate, request/defer/reopen a source issue, and check that a stale form cannot overwrite the newer decision. Confirmed pairs must remain unmerged until the existing protected merge action executes.
- Queue/deploy trigger: ready now
- Sequencing: the user requested one pass at a time. Send production deployment confirmation to task `01a08072-2914-7392-b659-fbc0cfe0903c` before pass two (focused review screens) begins.

## Risk And Conflicts

- Shared areas touched: Prisma schema/migration, saint merge service, reconciliation decision helpers, reconciliation admin page/actions, import workflow documentation. No design tokens, dependencies, auth, or public templates changed.
- Expected conflicts: concurrent reconciliation or saint-merge changes may overlap. Based on `origin/main` at `3732d8d`; does not include the separate pending authentication branch.
- Rollback notes: revert `592cc1f` and any dependent release commits. The additive nullable column can remain after application rollback; do not drop preserved review metadata.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
