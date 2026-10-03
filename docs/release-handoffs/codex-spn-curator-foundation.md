# Release Handoff: codex/spn-curator-foundation

- Status: `ready`
- Branch: `codex/spn-curator-foundation`
- Commit: `0fb45ee555121e5fb851b86a3c593c3b6f56d34c`
- Owner/agent: Simple UX Fixes
- Bundle priority: immediate intermediate release, authorized by user

## Summary

- Name the existing workspace SPN in admin navigation and museum header.
- Remove malformed family-list bullets and repeated primary-saint labels; widen supporting cards and anchor their status at the bottom right.
- Replace repeated research labels with accessible compact indicators that open saint details with research notes expanded.

## Verification

- `npm run prepare:deployment`: passed (Prisma generation and TypeScript).
- `git diff --check`: passed.
- Local read-only fixture: desktop and 390px layouts inspected, no horizontal overflow; research indicator opens details, Escape restores focus. Temporary fixture and layout override removed.
- Initial check encountered a stale generated preview route reference; removed generated cache and rerun passed.

## Deploy Notes

- Migrations: none.
- Environment variables: none.
- Data/backfill/release steps: none.
- Queue/deploy trigger: ready now. User authorized intermediate releases during phased curator revamp.
- This slice preserves current status semantics. Proposed/Planned/Implemented and membership editing follow separately.

## Risk And Conflicts

- Shared areas touched: admin navigation, museum layout/index/workspace, shared saint dialog, global CSS and tokens.
- Expected conflicts: subsequent curator slices may depend on this branch; no other known conflict.
- Rollback notes: standard code rollback; no persisted data changes.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
