# Release Handoff: codex/museum-curator-review-data

- Status: ready
- Branch: `codex/museum-curator-review-data`
- Commit: `0f4d7bef25aca466a23d31757b582977aaf50e53`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Private v3 curator review DTO and guarded pure projection; approved Vrindavan subsection vocabulary; stale arrangement review flag; Bon/Bawra collector-context investigation register.

## Verification

- `npm run dev:check`: passed; `npm run prepare:deployment`: passed
- Targeted curator, subsection, working-view and family reconciliation tests: 30/30 passed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: pair with Citra codex/museum-curator-review service/interface. No automatic live assignments; apply separately through protected UI after deployment and fresh checks.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: curator review domain/helper, Vrindavan working projection and subsection catalogue.
- Expected conflicts: Citra temporarily copied helper files; integrate this data commit before her service/UI branch. Her synthetic transaction tests are not real PostgreSQL integration verification.
- Rollback notes: revert `0f4d7be` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
