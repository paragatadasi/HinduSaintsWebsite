# Release Handoff: codex/sikh-physical-execution-hold

- Status: ready
- Branch: `codex/sikh-physical-execution-hold`
- Commit: `83f2a6e33655a593ed64962da0b0e6b1e4f7ea79`
- Owner/agent: Nadi
- Bundle priority: immediate, together with Citra's `codex/sikh-display-execution-hold`

## Summary

Retain the SPN Sikh display in physical cases 64–68 until the new room is ready.
The shared pure module and server checks prevent new physical records into/out of
those cases, including empty clears, preparation, final shelf changes, legacy
sessions, undo and clearing corrections. Legacy Implemented arrangements and
family batches, verified item moves, and relic reconciliation are covered too.
New mirrored items whose baseline location is held stay pending for review.

Future Proposed/Planned destinations, item plans/cancellation, research tasks,
readbacks and existing successful retry receipts remain available. No existing
preparation flags, placements or history are rewritten. Vrindavan is unaffected.

## Verification

- `npm run prepare:deployment`: passed after two test-only type narrowing fixes.
- Full suite: 793 tests; 792 passed, 1 skipped, 0 failed.
- Isolated localhost PostgreSQL regression: passed with actual service calls.
  Covers held incoming/outgoing/same-case records, atomic mixed batches, empty
  clears, preparation true/false for all five cases, unrelated moves/preparation,
  retry idempotency, legacy sessions, historical undo/clear correction into held
  cases, legacy Implemented records and family rollback, future plans, the
  Vrindavan exception, and preserved history/versions. Test database dropped.
- Run the regression with a localhost `DATABASE_URL` and
  `tsx scripts/verify-museum-case-execution-holds-local.ts`. Remote hosts refused.
- Release captain owns the integrated production build in the persistent worktree.

## Deploy Notes

- Migrations: none.
- Environment variables: none.
- Backfill: none. No production confirmations used for testing.
- Deploy with Citra's UI hold branch; do not ship the UI without server protection.
- Notify Nadi and Citra directly after production promotion.

## Risk And Conflicts

- Shared module: `lib/museum-case-execution-holds.ts`. Citra cherry-picked initial
  contract 414ced3 as a3f4025. Preserve THIS branch's newer optional museumId check,
  shelf-parent normalization and additional tests when resolving add/add conflicts.
- Other touched areas: physical-location services, session service, legacy
  arrangement implementations, companion shelf validation, item moves, relic
  reconciliation, documentation and isolated regression.
- Existing successful idempotent retries remain read-only receipt replays.
- The hold has no automatic expiry. Change it only after a newer curator decision.
- Rollback removes the execution protection; retain it while the instruction holds.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
