# Release Handoff: codex/museum-switch-performance

- Status: ready
- Branch: `codex/museum-switch-performance`
- Commit: `12ba1b1d87a5f7b56e6951b0135a0f7e7136f484`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Deduplicate the Vrindavan inventory and full SPN reference view during museum switching. Start independent audit dependencies concurrently. Layout and inventory page share the same request-local inventory promise. No persistent cache or changed placement rules.

## Verification

- `npm run dev:check`: passed
- Focused inventory, section, working-domain, and working-reader tests: 15 passed. Reader regression verifies one inventory/SPN load and fresh names on a subsequent call.
- `npm run codex:verify`: passed elevated. Initial sandbox attempt reached standalone packaging but hit Windows EPERM; elevated retry completed successfully.
- Production latency improvement not yet measured; verified reduction in duplicate work, not a claimed live percentage.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Vrindavan section audit, working/workspace readers, inventory route. Existing transactional callers retain uncached reads.
- Expected conflicts: based on selector feedback branch e2bfd1e and SPN map 297d965. Can cherry-pick code 12ba1b1 if ancestors already integrated.
- Rollback notes: revert `12ba1b1` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending


