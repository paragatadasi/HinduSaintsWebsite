# Release Handoff: codex/northern-shelf-companion

- Status: ready
- Branch: `codex/northern-shelf-companion`
- Commit: `117af6d8d109a3e4770aaf78a5ed3c018f990fa0`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Northern provisional shelf arrangement with shared move controls, expandable qualified trees, and review alerts
- Vitrine buttons show addressed and deferred progress; reference checklists collapse below shelf view

## Verification

- dev:check passed; 2 progress/data tests passed; browser checks passed for five rows, expanded trees, alerts and checkbox round trip; git diff --check passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: Static provisional Northern shelf guidance only. No migrations, physical writes, or confirmed shelf inference. Preserve all current movement guards and curator destinations. Airtable disabled.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Companion, family tree, globals.css, design-system documentation
- Expected conflicts: none
- Rollback notes: revert `117af6d` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
