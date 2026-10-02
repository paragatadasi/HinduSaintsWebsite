# Release Handoff: codex/visit-place-review

- Status: `ready`
- Branch: `codex/visit-place-review`
- Commit: `be7958142c8e72e4eb9d83b7316f67c6fff19cda`
- Owner/agent: Museum Data Integration
- Bundle priority: immediate release candidate

## Summary

- Adds protected Source Data → Visit-place research with private JSON upload,
  source provenance, exact existing-saint matching, and a paginated review queue.
- Destination research decisions and catalog-association follow-ups are separate.
  Research approval does not publish destinations or modify Place, SaintPlace,
  saint editorial data, Airtable, or SPN relic locations.
- Supports reviewed destination edits, evidence, coordinate precision,
  approve/defer/reject/reopen decisions, optimistic versions, and audit history.
  Approval notes are optional; evidence and destination confirmation are required.
- Raw source evidence is preserved; repeated import does not reset decisions.
  New source evidence opens review. Unmatched/archived saints cannot be approved.

## Verification

- `npm run dev:check`: passed.
- `npm test`: 236 passed, 1 skipped.
- Focused final domain tests after private-upload change: 2 passed.
- `npm run codex:verify`: passed on final deployable code.
- `npm run prepare:deployment`: passed.
- `scripts/verify-visit-place-review.ts`: passed with actual 214-row bundle in a
  disposable PGlite PostgreSQL-compatible database. Covered source replay,
  original-value preservation, independent catalog decisions, approval gates,
  stale edits/new source observations, unmatched identity and no canonical changes.
  This is not a concurrent multi-session PostgreSQL stress test.
- Local production HTTP access: Data Admin can view; anonymous, contributor,
  curator and editor without Source Data access cannot see research details.
- Local browser: actual private file upload succeeded, returned 214 unchanged
  rows, and retained the existing fixture research decision. Detail/queue inspected.
  All local helper servers and the temporary fixture/tab were removed/stopped.

## Deploy Notes

- Migrations: `20261002190000_visit_place_proposals`; additive empty staging table,
  foreign key to Saint, unique source/fingerprint and status constraints.
  Apply in normal migrate/release phase. No build-time DB access.
- Environment variables: none for production. Verification accepts
  MUSEUM_TEST_DATABASE_URL and VISIT_RESEARCH_TEST_BUNDLE only for disposable tests.
- Data/backfill/release steps: no backfill or automatic research import.
  After deployment, user uploads the prepared research JSON using the protected UI.
  Unreviewed research data is not included in repository history or public assets.
- Queue/deploy trigger: ready now under the user's standing checkpoint authorization.
- Notify Museum Data Integration chat `01a0f25f-fc6a-7fd2-a3f8-cd78f289cc5e` directly
  after verified deployment success, or with a failure/blocker.

## Risk And Conflicts

- Shared areas touched: prisma/schema.prisma and app/admin/layout.tsx.
- Expected conflicts: additive schema relation/model and Source Data sidebar entry.
- Rollback: normal app rollback; preserve the additive research table/decisions.
- This is checkpoint 1. Following checkpoints add canonical SaintVisitPlace data,
  explicit publication/public display, and individually evidenced catalog corrections.
  Vrindavan remains after this intermediate place-quality phase.
- Pilot instructions and phase boundaries: docs/visit-place-research.md.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: not triggered
