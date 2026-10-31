# Release Handoff: codex/spn-bimal-reviewed-assembly

- Status: ready
- Branch: `codex/spn-bimal-reviewed-assembly`
- Commit: `dd720e8`
- Owner/agent: Citra
- Bundle priority: Immediate release candidate

## Summary

- Applies the 1 November curator clarification: Bimal's yoga support stick and handwritten prayer book are together in 64/E and proposed together for 40.
- Exact source, canonical identity, source revision and fresh raw housing digest required; changed/missing evidence retains the hold.
- Companion and server permit only this assembly's 64/E to 40 transfer across the retained-case guard. General case clearing and other source guards remain unchanged. Existing validated undo receipt can restore a mistaken check.

## Verification

- Tests: 867 passed, 1 existing skip; focused guards 5 passed after final correction.
- `npm run prepare:deployment` / dev:check: passed.
- `npm run codex:verify`: passed on elevated retry after a Windows build-folder permission failure.

## Deploy Notes

- Migrations: none.
- Environment variables: none.
- No database writes or physical confirmation. Nadi owns proposed destination 40 save and preservation readback once runtime unblocked.
- Keep Sukhdev hold and all other V64 records unchanged. No inferred separate item IDs or invented stick location.
- After release, verify Bimal's catalog housing hold clears only with matching evidence, then notify Nadi. Do not click physical confirmation for testing.
- Current 40-44 companion content is separate; this patch does not load that guide.

## Risk And Conflicts

- Shared physical save/undo, movement holds, fresh mirror digest projection and companion preflight touched.
- Parent branch is released Junagadh/Saurashtra; integrate this branch's additional delta.
- Rollback code preserves all records; no migrations/backfill.
- Skill review: existing exact-source and housing evidence rules cover this correction; no new reusable rule needed.

## Release Captain Notes

- Integration and production pending.

