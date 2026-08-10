# Release Handoff: codex/longform-draft-review

- Status: ready
- Branch: `codex/longform-draft-review`
- Commit: `49e5ba86b5524205993c7ad8964ddef3b6fdaf0c`
- Owner/agent: `aporu`
- Bundle priority: immediate release candidate

## Summary

- Adds an editorial revision workflow for longer text and its associated sources while preserving the currently published copy until an editor publishes the revision.
- Supports saint short descriptions and biographies, tradition descriptions and long-form sections, and public place overviews.
- Adds a revision review queue, role-aware draft/submit/publish/return actions, source snapshots, concurrent-change protection, legacy draft-biography compatibility, and merge cleanup.
- Documents the workflow and keeps public queries on the canonical published records.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed (132 tests)
- `npm run codex:verify`: passed, including the production build and generation of all 16 static pages

## Deploy Notes

- Migrations: `prisma/migrations/20260811110000_editorial_revisions/migration.sql` adds the `EditorialRevision` table and supporting indexes/constraints
- Environment variables: none
- Data/backfill/release steps: run the migration in the normal deployment migrate/release phase before the new application code serves revision reads or writes; no data backfill is required
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Prisma schema/migrations, admin layout/dashboard/navigation, saint/tradition/place detail actions and pages, source editing, and saint/tradition merge services
- Expected conflicts: reconcile carefully with concurrent changes to those admin entity workflows or shared navigation; public rendering contracts are unchanged
- Rollback notes: revert `49e5ba8` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
