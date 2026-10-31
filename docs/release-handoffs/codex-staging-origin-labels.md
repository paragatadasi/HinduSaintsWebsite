# Release Handoff: codex/staging-origin-labels

- Status: `queued`
- Branch: `codex/staging-origin-labels`
- Commit: `310a410c7463f83a2663ceecd2f01cd789c9ff48`
- Owner/agent: Citra
- Bundle priority: next compatible release

## Summary

Shared companion location labels now show Staging area · originally Vitrine N. Uses the preserved original source location, not the proposal or last destination. Applies to shelf cards, family/checklists, search and details using companionLocationLabel. Existing partial Vitrine20 scope remains explicit; unknown origins remain unlabelled.

## Verification

- 8 move-guide tests passed including staged original vitrine, unknown origin, non-staged location and partial20 behavior.
- dev:check and queue:deployment passed.
- git diff --check passed.

## Deploy Notes

- Migrations: none.
- Environment variables: none.
- Data/backfill: none; display-only, no physical writes or clearing hold changes.
- Queue/deploy trigger: next compatible release.

## Risk And Conflicts

- Shared areas: lib/spn-move-guide.ts location formatter.
- Expected conflicts: other formatter edits only.
- Rollback: code rollback.

## Release Captain Notes

- Integration and production: pending.
