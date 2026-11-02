# Release Handoff: codex/spn-reviewed-cohort-27

- Status: ready
- Branch: `codex/spn-reviewed-cohort-27`
- Commit: `184b70bc738f4df5ea834bf0d20ded6599316935`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Companion search buttons/filters use actual loaded vitrine roster membership. Frozen fallbacks appear only as earlier proposals; unallocated records remain searchable without blanket pending classification.
- Five audited regional records show Allocation pending in companion and reviewer search, scoped by exact source/canonical/revision; current physical locations, housing restrictions, and newer curator destinations are preserved.
- Family connections rail collapses to full-width shelf rows without horizontal scrolling; reopening preserves controls/state.
- Includes previously approved cohort27/starterv6 integration: reviewed20 from28 to27,28 unallocated (not physically empty),76 preserved;29 branch consolidation and distinct Baman/Vaman78 proposals; approved Adi56 and Kumardas/Sanjivan47 shelf guidance. No native or physical writes.
- Starterv6 retires superseded13 old27 actions, retains full snapshot/history and equivalent decision inheritance.

## Verification

- `npm run prepare:deployment`: passed on final code (includes dev:check).
- Full npm test: 1001 passed, 1 skipped, zero failures. Subsequent changes only narrow test-helper types.
- Targeted roster tests: 3 passed; pending projection tests: 5 passed.
- Browser checks: rail collapse/reopen, no shelf overflow at900/600/390px, checkbox retention; alias search, pending/roster state, no stale target, physical location and housing hold.
- Earlier local codex:verify failed with EPERM creating .next/server/app/api/admin/museum-intake. Not reported passed. Release captain must run integrated codex:verify in persistent real-dependency worktree.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: native proposal changes already completed/read back by Nadi; do not rerun or overwrite physical records. No database backfill.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: starter registry/projection, approved proposal presentation, companion search, room explorer, shared shelf CSS/design docs.
- Expected conflicts: unreleased Bhakti joint-fill branch also edits registry, companion search and room companion; preserve its work separately. Do not include the newly requested West/veena delta.
- Rollback notes: revert release code as a bundle; do not reverse native curator proposal decisions or physical moves. Skill review found no new reusable interpretation requiring changes.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
