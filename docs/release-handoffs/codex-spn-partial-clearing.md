# Release Handoff: codex/spn-partial-clearing

- Status: queued
- Branch: `codex/spn-partial-clearing`
- Commit: `429b66cd17b6184c5ea9923c039a287db53ffe04`
- Owner/agent: `Nadi`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Record selected vitrine contents in staging and acknowledge available receiving space separately from full clearing

## Verification

- dev:check passed; 22 focused tests passed; codex:verify passed before the snapshot-sharing optimization, which passed final dev:check and focused tests

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No production writes or backfill. Bundle with Citra partial-clearing UX; preserve existing full-clear receipts.
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: Museum physical-location API, preparation and case-contents domains, progress ETag
- Expected conflicts: Coordinate with Citra codex/spn-clear-acknowledgement; backend commits are already cherry-picked there
- Rollback notes: revert `429b66c` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
