# Release Handoff: codex/admin-editorial-assignments

- Status: ready
- Branch: `codex/admin-editorial-assignments`
- Commit: `bd19588ef4dfd0a5901022998b321d93da4b42eb`
- Owner/agent: `aporu`
- Bundle priority: immediate release candidate

## Summary

- Adds a shared Saint, Tradition, and Place readiness assignment panel with active reviewer visibility, self-assignment, assignee workflow updates, and assignment-manager override.
- Enforces Fact-checker structured editing versus Writer long-form editing in both page controls and server actions; all publication-state changes remain Editor/Admin-only.
- Preserves read-only review content and established responsive review styling for roles without editing authority.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed (120/120)
- `npm run codex:verify`: passed end-to-end (compile, type checks, 16/16 static pages, and trace collection); existing Autoprefixer warnings only

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: admin permissions, assignment actions, Saint/Tradition/Place detail pages, shared admin review CSS, workflow documentation
- Expected conflicts: coordinate if another branch changes `app/admin/work/actions.ts`, `lib/permissions.ts`, or the same readiness layouts
- Rollback notes: revert `bd19588` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
