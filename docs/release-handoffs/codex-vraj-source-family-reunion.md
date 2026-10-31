# Release Handoff: codex/vraj-source-family-reunion

- Status: ready
- Branch: `codex/vraj-source-family-reunion`
- Commit: `59c6af993498a93aa12907149a3b7ae1b944a6dd`
- Owner/agent: Citra
- Bundle priority: immediate release candidate

## Summary

- Show Ramashray and Tyagi as a separate source-recorded guru/disciple group in Vitrine 77 when both exact source/canonical pairs remain assigned there. Keep Nimbarka–Kathia distinct.
- Preserve pinned guide versions, physical confirmations and current destinations; no canonical relationship or shelf writes.

## Verification

- `npm run dev:check`: passed
- `npm test`: 788 passed, 1 skipped.
- `npm run prepare:deployment`: passed.
- Group regression covers deduplication, unchanged confirmed placement, idempotence, destination changes, identity mismatch and absent membership.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Nadi verified the approved Ramashray proposal to 77 through the native workflow. The group appears from current additions; do not replay a data write for this release.
- Shelf repack is deliberately excluded pending user guidance: six living saints total 1.033333 estimated shelf spaces, beyond one bottom shelf. No new shelf recommendation for Ramashray is asserted; the family and full checklist remain usable. Existing shelf recommendations are not recertified by this grouping.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: companion addition projection; new source-family projection and tests; museum companion documentation.
- Expected conflicts: none
- Rollback notes: revert `59c6af9` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
