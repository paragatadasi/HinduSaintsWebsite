# Release Handoff: codex/scoped-vitrine-clearing-ui

- Status: `ready`
- Branch: `codex/scoped-vitrine-clearing-ui`
- Commit: `3a6ed5bdce39d75a790ec6167f6230ac64979eae`
- Owner/agent: Citra
- Bundle priority: immediate release candidate

## Summary

Connect shared backend eligibility to contents-only clearing for19/20/42. Curator confirms all origin-vitrine pieces are staged and separately housed sticks were not moved. Both ordinary and required clearing use the same scope. Staging, warning and correction text use the actual origin number. Includes queued original-vitrine staging labels.

## Verification

- `npm run prepare:deployment`: passed.
- 20 focused component-clearance, read/correction, move-guide and grouping tests passed.
- Combined TypeScript check passed, including the nullable-current-shelf helper fix.
- git diff --check passed.

## Deploy Notes

- Includes Nadi backend HEAD82c414c from codex/spn-v19-component-clear; integrate that first or merge this combined head.
- Includes codex/staging-origin-labels f06b02a; avoid double-applying changes.
- Migrations: none.
- Environment variables: none.
- Backfill/production writes: none. Deployment does not clear any vitrine; curator confirmation is still required.
- Vitrine64 is NOT enabled by this release; separate including-stick clearing follow-up underway. Existing64–68 holds remain.

## Risk And Conflicts

- Shared areas: companion clearing controls, component backend, shared location label.
- Exact canonical/source/origin guards retained, external object location never invented, prior20 receipts/corrections preserved.
- Rollback: standard code rollback; do not erase receipts.
- Skill review: no reusable data rule changed; scoped origin confirmation already covered.

## Release Captain Notes

- Integration and production verification: pending.
