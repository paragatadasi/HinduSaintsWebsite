# Release Handoff: codex/preliminary-review-notes

- Status: ready
- Branch: `codex/preliminary-review-notes`
- Commit: `02e8e8178a8a993d276f6a3434a1bce7ce28ab70`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Preliminary resolution notes, note filters/counts and separate Flagged/Unaddressed tabs

## Verification

- dev:check passed; full suite 1054 passed, 1 skipped; codex:verify exit 0 with Windows junction standalone-copy warning: require clean release-worktree packaging check. Disposable database: all migrations, six concurrent notes, reopen, stale edit 409, idempotency, physical/review invariance and no heavy-cache invalidation passed. Six note saves 4.36s total on local machine, not production.

## Deploy Notes

- Migrations: 20261110000000_review_preliminary_note: additive nullable TEXT column; apply in release phase
- Environment variables: none
- Data/backfill/release steps: No backfill or placement changes. Notes do not resolve flags or confirm review. Prior app can ignore column.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Final-review domain/server/hook/UI; shared AdminViewTabs import; globals.css; Prisma schema
- Expected conflicts: none
- Rollback notes: revert `02e8e81` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
