# Release Handoff: codex/spn-living-bottom-shelves

- Status: ready
- Branch: `codex/spn-living-bottom-shelves`
- Commit: `545002c00de09f92830e2fcb091d5958936e1960`
- Owner/agent: `aporu`
- Bundle priority: immediate release candidate

## Summary

- Apply Saarthi's revised V46 recommendation: living Balkrishna, Gunda Narayan and Ambar Das plus the unresolved Badve observation on shelf 5; Dhaam Ji, Bhaijan and Sankali on shelf 2.
- Correct Mahant Swami guidance to bottom shelf and Datta Vedananda/Polai entry notes. Preserve frozen guide/assignment digests, physical histories, actual shelves and newer destinations.
- Retain explicitly approved V77 bottom-two exception. V46 bottom fit note: ~1.03 known shelf spaces plus an unmeasured holding; no upper overflow.
- No identities, tiers, living statuses, actual locations or shelf records are written.

## Verification

- `npm run prepare:deployment`: passed (Prisma generation / TypeScript / handoff).
- 29 focused tests passed: V46 and V1 guides, Datta reunion, additions projection, V77 exception; physical shelf preservation and idempotent guidance covered.
- `git diff --check`: passed.
- Release captain owns integrated build. No auth, routes, schema, dependency or physical mutation implementation changed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: companion additions projection, source-family display grouping, V1/V46 guide projections, V46 shelf packet, museum companion contract.
- Expected conflicts: coordinate concurrent companion projection changes. Nadi maintained museum-planner and museum-data-interpretation skills separately.
- Rollback notes: revert scoped recommendation commit; no database rollback or backfill.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
- Prior Vraj release: last authenticated check was old v1. Nadi currently has no connected browser; confirm actual served v2/counts before telling curator the revised Vraj guide is live. This branch starts from main 224cdbe and includes prior integrated work by ancestry only.
