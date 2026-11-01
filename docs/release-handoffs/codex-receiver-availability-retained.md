# Release Handoff: codex/receiver-availability-retained

- Status: ready
- Branch: `codex/receiver-availability-retained`
- Commit: `579a69c4c10c8d634496d8b70a765a079b6f3746`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Allow curator moves independently of preparation, housing, verified-item workflow, Sikh, transfer and proposal business-rule gates; preserve authorization, identity, revisions and audit.
- Stage only residual contents, preserving confirmed destinations and later moves; automatically continue selected component locations without moving whole-source or other-piece records.

## Verification

- npm run dev:check passed; npm test 956 tests, 955 passed, 1 skipped; npm run codex:verify passed; disposable-localhost save verifier 22 checks passed; git diff --check passed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No production data writes or backfill. Component effective versions advance on read; refresh existing clients before further operations. Museum interpretation skill updated locally; no identity-skill change.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Museum physical confirmations, component projection/read/undo and shelf annotations, partial clearing preview, search additions and alternative destinations.
- Expected conflicts: Bundle with Citra db4eb4b and reviewed PR3 aa139928. Preserve PR3 memoized full loader and client omitted receiverAvailabilities fallback. No schema overlap.
- Rollback notes: revert `579a69c` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
