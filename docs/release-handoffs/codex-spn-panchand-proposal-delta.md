# Release Handoff: codex/spn-panchand-proposal-delta

- Status: deployed
- Branch: `codex/spn-panchand-proposal-delta`
- Commit: `53a406f`
- Owner/agent: Nadi
- Bundle priority: immediate release candidate

## Summary

- Publish independently reviewed city-first corrected v3 as application proposal `spn-city-first-2026-10-27-v10`, including the earlier v9 Haridwar delta.
- Preserve all 1423 source observations, 3 named-only records, 99 reviewed relationship pairs, Primary/Secondary/fixed assignments, raw evidence and physical history. Show the four unknown footprints beside their cases.
- Accepted baseline becomes default only when the saved arrangement revision still matches the captured baseline. Newer curator revisions retain precedence; recorded physical fields stay separate.
- Static companion coverage now includes all 82 source-occupied cases, including 64/69; neither is listed as unallocated. Regression test checks every occupied case. No source assignment/digest changed.
- Metadata correction: Vitrine64 has a retained Sri Potty Amma source holding and is labelled availability-dependent, never unallocated or vacant; its flexible-space exclusion remains. No destination/digest changed.
- Include dated user confirmation that 76/78 are empty new vitrines; later occupancy wins. No actual move is confirmed.

## Verification

- `npm run prepare:deployment`: passed (Prisma generation + TypeScript + handoff generation).
- 13 focused tests: passed (`spn-final-v10`, immutable v9, proposal reconciliation), including static companion script syntax, full case ledger agreement, unknowns and newer curator precedence.
- Independent Saarthi audit: passed for reviewed candidate SHA256 `629e0355ce29fc7362fbc0c9c42ca6cc91ec77a411cb36de97c86b5e7e9ff95c`.
- Sorted source-ID/destination assignment digest matches phase1 guidance: `80ce917be4ef96be4e014e37bda9860e529bbf24e56e2e52d093f2d180ebdc7d`.
- Integrated `codex:verify`: release captain owns this gate.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: no database writes; new immutable v10 JSON artifacts and default registry `lib/spn-current-proposal.ts`.
- Bundle: include Citra's independently verified intake-team UI/backend handoff in this user-requested release. Exclude unfinished room-move companion/session work.
- Operational notes: 76/78 confirmed empty as of 27 Oct. Hemalata in 2, Sudama/Sant Ramdas in 78, Maitrayani in 28 retain unknown footprints; known shares do not prove fit. User authorized shipping with those notes.
- Queue/deploy trigger: deployed

## Risk And Conflicts

- Shared areas touched: SPN plan page/static pilgrimage route, `lib/spn-room-proposal.ts`, shared active-proposal registry, private proposal/design/static companion data.
- Expected conflicts: room-companion work may later use the active-proposal registry; do not include unfinished branch in this release.
- Rollback notes: revert `0de3e09`, `f8b652e` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: `f8ad261`
- Pushed to `main`: yes
- Merged to `deploy`: `bed29c7`
- Production workflow: [40525298331](https://github.com/paragatadasi/HinduSaintsWebsite/actions/runs/40525298331) — success
