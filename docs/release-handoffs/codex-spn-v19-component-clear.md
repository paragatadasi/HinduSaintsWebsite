# Release Handoff: codex/spn-v19-component-clear

- Status: ready
- Branch: `codex/spn-v19-component-clear`
- Commit: `2e7cbe4` plus the shared helper type follow-up on this branch
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Support origin-only component clearing for exact reviewed sources in Vitrines 19 and 42, preserving separately housed sticks and whole-collection uncertainty. Existing Vitrine 20 receipts remain readable.
- Shared componentClearanceScope helper supplies UI eligibility. No physical writes occur until curator confirmation.

## Verification

- `npm run dev:check`: passed
- 19 focused component domain/read/correction, arm-support and Sikh execution-hold tests passed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: integrate with Citra's scoped-vitrine-clearing-ui before release. Vitrine 64 clear-only support is a separate follow-up; current Sikh case holds remain intact.

## Risk And Conflicts

- Shared areas touched: component scope types, receipt reader, protected physical confirmation and correction service; museum data contract documentation.
- Expected conflicts: UI requires this helper and scope union. No migrations, environment changes or backfill. Production service tests here use fixtures, not production writes.
- Rollback notes: revert `b52a10e` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
