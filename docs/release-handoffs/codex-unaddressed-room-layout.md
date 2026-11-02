# Release Handoff: codex/unaddressed-room-layout

- Status: ready
- Branch: `codex/unaddressed-room-layout`
- Commit: `30f6a0830a2e2ffcb70f1db372d97a4122bbefd1`
- Owner/agent: `aporu`
- Bundle priority: immediate release candidate

## Summary

- Reuse the colored room layout beside flagged and remaining unaddressed records. Map clicks filter both panels by proposed vitrine; All vitrines resets that filter. Preserve independent starting/current/search filters and 30-record pagination. No extra data requests.

## Verification

- `npm run prepare:deployment`: passed
- Final review render and filter tests: 5 passed
- Release smoke check: Unaddressed map beside panels; click vitrine filters both, All vitrines restores records, stays on Unaddressed; narrow screens stack.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: museum-final-review.tsx and its render tests; uses existing companion layout classes.
- Expected conflicts: based on codex/final-review-navigation a27451c; includes its dependency.
- Rollback notes: revert `30f6a08` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
