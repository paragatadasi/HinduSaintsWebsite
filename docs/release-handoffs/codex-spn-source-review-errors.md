# Release Handoff: codex/spn-source-review-errors

- Status: ready
- Branch: `codex/spn-source-review-errors`
- Commit: `eacae6d17129512df6c6b928f3a6812e5e8e7c95`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Explain blocked SPN source-link decisions with safe recovery messages while preserving every existing guard

## Verification

- dev:check; seven domain tests; disposable local database guard integration; codex:verify production build: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No automatic writes. After runtime confirmation, retry one supported source link and inspect its specific result; do not backfill or bypass occupied links.
- Queue/deploy trigger: ready now

Read-only runtime check: authenticated
`/admin/source-data/museum?error=choose_saint` must display
"Select an existing website saint before linking this source." Older code shows
the generic review error for that same query. This check renders a message only;
it does not submit a decision. Notify Nadi directly when confirmed, so the
authorized targeted source-link check can resume.

## Risk And Conflicts

- Shared areas touched: museum source review domain/service, action and page
- Expected conflicts: none
- Rollback notes: revert `eacae6d` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
