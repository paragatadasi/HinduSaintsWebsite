# Release Handoff: codex/intake-save-start-new

- Status: ready
- Branch: `codex/intake-save-start-new`
- Commit: `5e1502656fca106e827b381eda3f59568ce30f71`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Save & start new preserves the current unfinished intake entry before opening a blank saint form.

## Verification

- npm run dev:check PASS; browser save unfinished entry, new blank form, My entries and reopen preserved name/description PASS. Pending photos guarded; save failure leaves form untouched.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No data changes, migrations or delivery changes. Keep Airtable delivery disabled.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: components/admin/museum-relic-intake.tsx only; existing styles/components reused.
- Expected conflicts: Immediate user-requested release; may bundle Nadi relic_document constraint hotfix if ready. Exclude companion.
- Rollback notes: revert `5e15026` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
