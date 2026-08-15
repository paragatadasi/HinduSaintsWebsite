# Release Handoff: codex/rank-exact-place-search

- Status: queued
- Branch: `codex/rank-exact-place-search`
- Commit: `4cc4fac2629686034adaa07abf4e9461ab5a9a0d`
- Owner/agent: `aporu`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Rank exact labels first in additive relationship-picker search results, followed by label-prefix, label-contains, and metadata matches.
- Add regression coverage for the Places and Route search so the literal `Vrindavan` result appears before place names that merely contain it.

## Verification

- `npm run dev:check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: `SearchableRelationshipPicker` and the shared search-option ranking helper
- Expected conflicts: none
- Rollback notes: revert `4cc4fac` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
