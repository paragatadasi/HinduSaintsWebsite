# Release Handoff: codex/v20-component-clearance-ui

- Status: ready
- Branch: `codex/v20-component-clearance-ui`
- Commit: `b37e86aa4f1abc4d27111a1adc1b7b67b89b3b64`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Confirm only Vitrine 20-held pieces as staged for the two compound records; separately housed walking sticks remain untouched.
- Explicit scope acknowledgement, partial staging labels and correction dialog. Ordinary whole-source moves remain blocked.

## Verification

- `npm run prepare:deployment`: passed on combined branch.
- Focused tests: 11 passed; browser acknowledgement/payload/staging/correction-dialog checks passed.
- Nadi backend full suite: 742 passed, 1 skipped. Real disposable PostgreSQL integration passed twice (atomic 14 ordinary + 2 scoped component records, rollback, replay, correction, retained holds).

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: no production backfill; curator confirms through UI. Airtable remains disabled.
- Includes Nadi backend `4afcecc` cherry-picked as `b37e86a`; do not integrate that backend twice.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: physical confirmation/snapshot/progress; scoped component domain; companion, search, shelf and tree UI; guide types and design documentation.
- Expected conflicts: none
- Rollback notes: after component receipts exist, preserve the component-aware reader or explicitly migrate evidence. An old reader would resurrect the untouched whole-source origin; do not blindly revert the reader.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
