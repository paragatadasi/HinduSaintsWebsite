# Release Handoff: codex/admin-conflicts

- Status: ready
- Branch: `codex/admin-conflicts`
- Commit: `3194e6f9957afd9a8834aad7a32e5469337a0235`
- Owner/agent: `aporu`

## Summary

- Adds atomic version preconditions to top-level Saint, Tradition, Place, and
  Instagram review saves so stale forms cannot overwrite newer edits.
- Adds private current-versus-attempted conflict snapshots with reload and
  preconditioned reapply choices.
- Adds authenticated, expiring viewer/editor presence to the four detail workflows.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed (82 tests)
- `npm run codex:verify`: compilation, typed routes, page-data collection, and all
  static pages passed; known Windows junction `EPERM` occurred only during standalone trace copying.

## Deploy Notes

- Migrations: `20260805220000_admin_conflicts_presence`
- Environment variables: none
- Data/backfill/release steps: apply migration during deployment migrate/release
  phase before serving the versioned routes; no backfill required.

## Risk And Conflicts

- Shared areas touched: four core admin detail pages/actions, `prisma/schema.prisma`,
  new protected presence API, shared conflict/presence components, overhaul documentation
- Expected conflicts: none
- Rollback notes: revert `3194e6f` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
