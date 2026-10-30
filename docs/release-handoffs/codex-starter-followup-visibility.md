# Release Handoff: codex/starter-followup-visibility

- Status: ready
- Branch: `codex/starter-followup-visibility`
- Commit: `697b43e2e7478c1d596f3d71ffc444cf34d9ddbe`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Make all seven starter photo follow-ups visible with live location, remaining-piece tags and receiving-guide links; no duplicate execution controls.
- Guarded provisional Bilash V29 correction in reviewer/source projection and companion boot; retain newer curator decisions and reject obsolete V57 execution. Historical guide/digests stay unchanged.

## Verification

- Combined `npm run prepare:deployment`: passed.
- Browser checks: seven cards, two remainder tags, no move controls/writes, receiver navigation, held identity hides target.
- Bilash focused tests passed; backend suite 749 passed / 1 skipped, 12 focused passed; production snapshot47 read-only projection verified by Nadi.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none; preserve all physical receipts and component holds. Airtable remains disabled.
- Includes Nadi 0edcdc6 as cherry-pick697b43e; backend handoff is consumed, do not integrate twice.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: companion UI/server boot, guide types, official proposal/source projection, physical/pinned-session target guard, design docs.
- Expected conflicts: none
- Rollback notes: no data migration. Revert this follow-up bundle only; retain previously deployed V20 component-aware readers.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
