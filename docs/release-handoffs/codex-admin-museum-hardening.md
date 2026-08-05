# Release Handoff: codex/admin-museum-hardening

- Status: ready
- Branch: `codex/admin-museum-hardening`
- Commit: `422e2415a30f6cdaf6413210e0a3cbf277d622d0`
- Owner/agent: `aporu`

## Summary

- Capability-gates direct Museum redirects and family-tree asset routes; SVG
  responses are private, no-store, nosniff, and CSP-sandboxed.
- Adds the Curator write/Site Admin destructive-write guard contract and tests.
- Adds a main-admin/public-site return path, curator-only main dashboard, and
  explicit notice that current Museum planning controls are not persisted.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed (84 tests)
- `npm run codex:verify`: compilation, types, page-data collection, and static
  generation passed; known Windows junction `EPERM` occurred only during trace copying.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none

## Risk And Conflicts

- Shared areas touched: `app/admin/page.tsx`, Museum layouts/routes/workspace,
  `docs/admin-overhaul-workflow.md`
- Expected conflicts: none
- Rollback notes: revert `422e241` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
