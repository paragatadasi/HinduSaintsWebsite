# Release Handoff: codex/spn-vraj-girnar-comparison

- Status: `ready`
- Branch: `codex/spn-vraj-girnar-comparison`
- Commit: `53970dc86cbe833450d8153ba99e395a8930c7c3`
- Owner/agent: Citra
- Bundle priority: immediate release candidate

## Summary

- Adds the user-authorized Vraj gateway and Girnar / Nath comparison option. Proposal 16 revision 1 remains the default; East, original v16 and v15 remain selectable.
- Preserves every source observation and canonical ID, source coordinates, tiers, recorded weights, named-only entries and live curator overrides. No database writes or physical confirmations.
- Keeps Rama 79 open for refinement; both Keshava candidates, conflicting birth years and possible shared paduka assembly remain qualified. Identity-review labels now follow the supplied display band instead of always claiming lower display.

## Verification

- `npm run prepare:deployment`: passed (Prisma generation and TypeScript).
- 22 targeted explorer/proposal tests: passed, including all reviewed case permutations and exact-record exceptions, protected housing conservation, identity holds and newer-curator destination precedence.
- Manifest SHA256 checks and all 1423 source allocations verified against the reviewed East baseline; 303 shelf shares and 3 named-only entries conserved.
- Actual component desktop 1440px and mobile 390px browser checks passed: default retained, gateway2/mission38 correct, Keshava main-regional-band and hold visible, older versions unchanged; no horizontal overflow or runtime errors.
- Release captain owns integrated `codex:verify`.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: private versioned proposal JSON only, server-loaded behind existing museum authorization. No additional framework sketches loaded.
- Queue/deploy trigger: ready now; preceding East workflow 40321516677 succeeded.
- Skill review: no new reusable interpretation rule; existing identity-versus-placement distinction applied and design contract updated.

## Risk And Conflicts

- Shared areas touched: `app/museumadmin/plan/page.tsx`, `components/admin/spn-room-explorer.tsx`, explorer design documentation.
- Expected conflicts: none; based on main after East integration. No routing/auth/dependency changes.
- Rollback notes: revert this feature; previous proposals remain unchanged.

## Release Captain Notes

- Integrated into main: pending
- Pushed to main: no
- Merged to deploy: pending
- Production workflow: pending
