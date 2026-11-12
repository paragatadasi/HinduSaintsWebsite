# Release Handoff: codex/feedback-retention-release

- Status: ready
- Branch: `codex/feedback-retention-release`
- Commit: `c430feda998d159e7b806925ea3cbbcc87a5ccaa`
- Owner/agent: `Feedback retention`
- Bundle priority: immediate release candidate

## Summary

- Purge expired feedback submissions and linked inbox audit entries at production startup and hourly thereafter.

## Verification

- npm run codex:verify passed on the release branch. Local PostgreSQL cutoff test passed with synthetic records.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: First production startup purges existing submissions at least one calendar year old. Deleted rows and audit entries cannot be recovered by reverting the code. Backup expiry is separate.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Production Next.js server startup and feedback inbox database tables.
- Expected conflicts: No conflicts expected. If another change adds instrumentation.ts, combine both startup hooks.
- Rollback notes: revert `c430fed` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
