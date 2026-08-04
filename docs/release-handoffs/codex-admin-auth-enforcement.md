# Release Handoff: codex/admin-auth-enforcement

- Status: ready
- Branch: `codex/admin-auth-enforcement`
- Commit: `923209d264ec56f87c4ebfccbbf966d68f468e6e`
- Owner/agent: `aporu`

## Summary

- Adds `docs/admin-overhaul-workflow.md` as the durable scope, status, acceptance-criteria, and resume source for the complete overhaul.
- Protects Saint, Tradition, Place, Instagram, Inbox, and Preview route trees with the content-view capability.
- Enforces Editor-or-higher publishing/archiving, and Site Admin-only destructive merges, bulk deletion, and destructive-action credential changes.
- Protects admin media, Instagram biography import, and Instagram claim-refresh operations with explicit capabilities.
- Adds capability-matrix coverage for Contributors, Translators, Data Admins, Curators, additive roles, and Site Admin-only authority.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed (76 tests)
- `npm run codex:verify`: compilation, type validation, page-data collection, and all 10 static pages passed; final standalone trace-copy failed on the known Windows isolated-worktree `node_modules` junction restriction.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none

## Risk And Conflicts

- Shared areas touched: admin route layouts, content/server actions, admin media/import APIs, test suite, and workflow documentation.
- Expected conflicts: possible action-file conflicts with concurrent Saint, Tradition, Place, or Instagram admin work. Preserve the capability checks at the action boundary.
- Rollback notes: revert `923209d` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
