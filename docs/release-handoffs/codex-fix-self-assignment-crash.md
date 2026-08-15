# Release Handoff: codex/fix-self-assignment-crash

- Status: queued
- Branch: `codex/fix-self-assignment-crash`
- Commit: `4d5d397d4118509050bc6239233f136f93d595de`
- Owner/agent: `aporu`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Fix fact-checker self-assignment failures by executing the PostgreSQL advisory lock without asking Prisma to deserialize its `void` result.
- Keep unexpected self-assignment failures inside the saint editor with a traceable inline reference instead of replacing the editor with the admin error boundary.
- Add a regression test for the advisory-lock execution path.

## Verification

- `npm run dev:check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: `app/admin/work/actions.ts` and the new assignment-claim lock helper under `lib/`
- Expected conflicts: low; possible only with concurrent assignment workflow changes
- Rollback notes: revert `4d5d397` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
