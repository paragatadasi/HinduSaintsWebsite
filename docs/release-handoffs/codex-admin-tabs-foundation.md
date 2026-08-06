# Release Handoff: codex/admin-tabs-foundation

- Status: ready
- Branch: `codex/admin-tabs-foundation`
- Commit: `ecd950c32e47930be5fe1aa1d662452bd535195b`
- Owner/agent: `aporu`

## Summary

- Replaces the long permission-aware admin sidebar with compact Operations,
  Source Data, Content, and Museum workspace destinations.
- Adds one shared horizontal route-tab bar with active-page state, preserved
  counts, horizontal overflow, and the same server-derived permission filtering.
- Replaces misleading detail-page "task tabs" with section jump navigation
  that opens collapsed cards and exposes the active anchor as a location.
- Documents the navigation contracts and reopens the admin UX remediation
  workflow with Airtable consolidation as the deployment-gated next step.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed (95 tests)
- `npm run codex:verify`: compiled, type-checked, collected page data, and
  generated all 14 static pages; final exit was the known Windows worktree
  junction `EPERM` during standalone trace copying

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none

## Risk And Conflicts

- Shared areas touched: `app/admin/layout.tsx`, shared admin navigation/review
  components, `styles/globals.css`, and admin UX documentation
- Expected conflicts: branches editing the shared admin layout, global admin
  styles, or the four core detail-page section navigation imports
- Integration note: the branch started from `638e7b0`; `origin/main` advanced to
  `73f7e1f` with anonymous aggregate telemetry while this step was in progress.
  Cherry-pick the feature commit onto the current `main` and resolve only if the
  telemetry release also changed the shared admin shell.
- Rollback notes: revert `ecd950c` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
