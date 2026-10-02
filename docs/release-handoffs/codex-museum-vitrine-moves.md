# Release Handoff: codex/museum-vitrine-moves

- Status: `ready`
- Branch: `codex/museum-vitrine-moves`
- Commit: `9097ce91d3eb22b74466d5e16f702ef815898f8a`
- Owner/agent: Museum Data Integration
- Bundle priority: immediate release candidate

## Summary

- Adds Museum Admin > Relics and planned moves, with private item details, current location, proposed moves and history. This is separate from the Source Data baseline/import flow.
- Saving a plan never changes placement. Curators cancel or explicitly confirm the physical move, which closes the old placement and records the new one. Changed items invalidate old plans.
- Saint modal links to item planning. Source review forms reuse shared form styling and checkbox controls.

## Verification

- npm run prepare:deployment: passed.
- npm run codex:verify: passed on final code.
- npm test: 232 passed, one guarded database test skipped.
- Disposable database integration: plan/cancel/complete, required physical confirmation, duplicate/replay rejection, stale item version, archived destination, museum scope, location history and unchanged source import preserving a curator move passed.
- Local authenticated curator browser: item detail/history rendered; saving a proposal kept the current location unchanged and displayed its separate target. Shared styling inspected. No production data operations.

## Deploy Notes

- Migrations: 20261002160000_museum_item_move_plans adds MuseumItemMovePlan, foreign keys and a partial unique index for one planned move per item. Apply in release migration phase before serving new routes.
- Environment variables: none.
- Data/backfill/release steps: none. No baseline import, saint creation or physical moves on deployment. User reports preceding baseline deployment live, but actual production baseline data state remains unverified by this feature task.
- Queue/deploy trigger: ready under standing user authorization for phase checkpoints.

## Risk And Conflicts

- Shared areas touched: Prisma schema; museum layout navigation and saint modal; two Source Data review form class updates. No shared CSS/token changes.
- Expected conflicts: preserve unrelated museum navigation/modal work.
- SPN only; no Vrindavan transfers or new saint creation. Both propose and complete use manage_museum; no unrequested two-person approval policy.
- Source corrections invalidate prior plans through item version checks. Current placement changes only after explicit physical confirmation. PGlite tests do not certify real PostgreSQL concurrent sessions.
- Rollback notes: revert feature code; retain additive table, plans/audits and completed movement history. No automatic data reversal.

## Release Captain Notes

- Integrated into main: pending
- Pushed to main: no
- Merged to deploy: pending
- Production workflow: pending
- User explicitly asks Release Captain to notify Museum Data Integration (01a0f25f-fc6a-7fd2-a3f8-cd78f289cc5e) directly on completion. Include actual verification status, main/deploy SHAs and any migration/config blocker. Distinguish a deploy push from confirmed live workflow success.
