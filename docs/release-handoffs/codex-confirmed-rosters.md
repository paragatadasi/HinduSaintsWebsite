# Release Handoff: codex/confirmed-rosters

- Status: `ready`
- Branch: `codex/confirmed-rosters`
- Commit: `707f0b80b368713c00f086c1574f461d169d8eb5`
- Owner/agent: Citra
- Bundle priority: Immediate, together with Nadi confirmed-placement projection

## Summary

- Confirmed holdings are represented once in their actual destination checklist and progress, including receiving cases without shelf recommendations. Component and identity scopes are preserved.
- Open Vitrines 14 and 15 as manual Bhakti Marga receivers, using existing search/destination controls and map tones. No automatic split, shelf proposal, or move confirmation.
- Current proposal reviewer reads the same shared review projection as the catalogue. Historical proposals remain available.

## Verification

- `npm run dev:check`: passed.
- `npm run prepare:deployment`: passed.
- `npx tsx --test lib/museum-confirmed-rosters.test.ts lib/museum-progress-summary.test.ts lib/museum-companion-membership.test.ts`: 15 passed.
- `git diff --check`: passed.

## Deploy Notes

- Required dependency: integrate `codex/confirmed-placement-projection` at `8336bfa` or its later handoff first. It provides confirmed destination precedence in the shared catalogue/review; do not deploy this UI alone as the complete reconciliation.
- Migrations: none.
- Environment variables: none.
- Data/backfill: none; no physical or identity writes.
- Queue/deploy trigger: ready, bundle both branches.
- Verify current proposal, search, actual receiving checklist and progress agree for confirmed placements. Verify a later deliberate proposal still wins and staged/source-only records do not become placed.
- Verify manual search addition to either 14 or 15 appears only in the chosen receiving case. Existing 17/18 placements remain unchanged until the curator acts.

## Risk And Conflicts

- Shared areas: companion roster projection, main proposal page reader, room presentation configuration, design-system guidance.
- Changes are read projections, not synthetic save events. Original receipts and guide digests remain intact.
- Release captain should run integrated tests/build with the backend dependency. No dependency, auth, schema or route-path changes.
- Existing museum data interpretation rules cover this workflow; no skill change needed.
- Rollback: revert both projection changes together; saved locations are unaffected.

## Release Captain Notes

- Integrated into main: pending
- Pushed to main: no
- Merged to deploy: pending
- Production workflow: pending
