# Release Handoff: codex/museum-arrangement-status

- Status: ready
- Branch: `codex/museum-arrangement-status`
- Commit: `6c9b81a6ba82580c8b11ace35c42dc3df665d3b3`
- Owner/agent: `aporu`
- Bundle priority: immediate release candidate

## Summary

- Adds Proposed / Planned / Implemented to SPN saint cards. Planned requires a vitrine, optional shelf. Implemented records explicit physical confirmation with the incomplete-inventory caveat.
- Proposal and membership revisions invalidate old status. Location browser distinguishes saint arrangements from individual relic move plans. No item locations are fabricated or changed.

## Verification

- `npm run prepare:deployment`: passed.
- `npm run codex:verify`: passed.
- Fifteen focused domain/family/location tests passed.
- Disposable PostgreSQL migration and arrangement integration passed: vitrine requirement, stale updates, physical attestation/actor/audit, no invented inventory, invalidation after membership edits.

## Deploy Notes

- Migrations: additive 20261003143000_museum_arrangement; run in release migration phase.
- Environment variables: none
- Data/backfill/release steps: no backfill. Legacy editorial confirmation starts Proposed; physical implementation is never inferred.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: SPN working-data reader, saint dialog/search/section cards, proposal editor copy, location browser, Prisma schema.
- Expected conflicts: depends on membership b6093bc (included in ancestry). No edits to getEditableMuseumProposalData in this slice. Vrindavan pilot stays read-only; shared arrangement contract/model ready for later reuse.
- Rollback notes: keep additive table/audit records if rolling back application. Generated guidance: revert `6c9b81a` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
