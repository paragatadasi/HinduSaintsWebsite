# Release Handoff: codex/live-tree-source-comparison

- Status: ready
- Branch: `codex/live-tree-source-comparison`
- Commit: `a0feb49530e47ea912f5078b98b652a54759fb68`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Independent collapsed live-family panels load on open and support multiple open trees. Keep families without linked identities visible.
- Add explicitly labeled read-only preserved family-member relationship comparison; website decisions (including archived/corrected relationships) take precedence. No data writes.
- Hide lineage-shortcut control when none exist and report missing connections/identity links.

## Verification

- `npm run prepare:deployment`: passed (includes dev:check).
- `npm run codex:verify`: passed, full production build.
- Layout/source tests: 13 passed, including all four original Gaudiya families. Preserved Gaudiya Math fixture: 16 nodes / 18 distinct connections.
- Guarded disposable PostgreSQL verification: passed, including source overlay and no relationship mutations.
- Local browser: simultaneous expansion, automatic load initiation, connected source fixture and hidden empty shortcut control verified. Unauthenticated API rejected with 401; production authenticated coverage was not audited. Temporary preview route removed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none. Source connections are unreviewed comparison evidence, not canonical imports. Exact production import coverage remains a separate audit.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: live tree reader/layout types, protected tree API, shared live tree component/CSS, museum docs
- Expected conflicts: possible adjacent museum documentation/CSS edits. Based on the prior deployed live-tree branch; preserve captain cleanup of its old handoff.
- Rollback notes: revert `a0feb49` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
