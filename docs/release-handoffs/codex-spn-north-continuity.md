# Release Handoff: codex/spn-north-continuity

- Status: ready
- Branch: `codex/spn-north-continuity`
- Commit: `3f45a71c21f4c376354b70da5358c028131b0fff`
- Owner/agent: Citra
- Bundle priority: immediate release candidate

## Summary

- Move the complete Haidakhan/northern packet from proposed 70 to existing general-use 22. Label provisional 70 as potential northern spillover with no planned family.
- Keep the true full-height clearance guard on 23, including a vitrine-specific visible note; remove the stale 23 dependency from 22/70. Fit remains unverified.

## Verification

- `npm run prepare:deployment`: passed.
- 10 focused proposal/correction tests passed; source packet manifest hashes verified.
- Exactly 23 source observations move 70 to 22. All 1423 source IDs, canonical bindings, 303 recorded shares, 3 named-only assignments, tiers and source-location fields preserved.
- Physical layout metadata unchanged: 22 existing/general, 70 new/provisional. No change to other destinations, including approved 26/37 and Sankaranya co-location.
- Existing Planned/Implemented curator overrides remain authoritative; tests cover this.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none. Static proposal amendment only; no database or physical-state writes.
- Depends on `codex/spn-east-north-swap` head `c0146b1`. This branch is stacked on that ready handoff; integrate it after 26/37 or merge both coherently.
- Original candidate ID, default selection and all other proposal options remain unchanged.
- No geographical pilgrimage or Sikh experiment included.

## Risk And Conflicts

- Shared areas touched: two East–North proposal JSON fixtures and their focused tests. No UI component, routing, auth or schema changes.
- Expected conflicts: same JSON files as the prerequisite 26/37 branch; stacked ancestry preserves both.
- Rollback: revert `3f45a71` to remove this follow-up while retaining the earlier 26/37 amendment.
- Museum data skill review: no new reusable interpretation rules found.

## Release Captain Notes

- Integrated into main: pending
- Pushed to main: no
- Merged to deploy: pending
- Production workflow: pending
