# Release Handoff: codex/museum-current-cards

- Status: queued
- Branch: `codex/museum-current-cards`
- Commit: `2c840e438142d13fa37566d13dec73aeed58afda`
- Owner/agent: Simple UX Fixes and Museum Data Integration
- Bundle priority: queue for next major/bundled deployment

## Summary

- Museum working cards use canonical database records and confirmed exhibit anchors, with the original proposal comparison preserved.
- Curators can move an entire family proposal and all family members to another museum section. Confirmed placements remain unchanged; proposal moves are durable, audited, and protected against concurrent stale updates.
- Includes responsive museum cards and a protected read-only Airtable mirror coverage audit.
- This combined branch includes all backend commits from codex/museum-family-move. Do not integrate that backend branch separately.

## Verification

- `npm run dev:check`: passed again during queue preparation.
- `npm run codex:verify`: passed on final combined code, including production build; 214 unit tests passed, one guarded database test skipped in ordinary suite and separately verified.
- Disposable PostgreSQL-compatible database: all migrations and transactional family-move tests passed, including concurrency, archived destinations, proposal review, rollback, and preserved source data.
- Authenticated browser checks passed: move dialog, destination redirect, reload persistence, confirmed placements, original proposal comparison, permissions, and mobile 390px layout without horizontal overflow.
- Queue generator encountered the already-created handoff from the coordinating task after checks passed; that same handoff was completed and explicitly marked queued.

## Deploy Notes

- Migrations: `20261001150000_museum_family_proposal_moves` creates the family proposal move table. Run during the deployment migration/release phase before serving the new code.
- Environment variables: none.
- Data/backfill/release steps: no backfill; production mirror audit remains a post-deployment follow-up. No production database was modified during feature work.
- Queue/deploy trigger: queued until the next requested or compatible bundled deployment; no immediate deployment request.

## Risk And Conflicts

- Shared areas touched: museum working-data and proposal adapters, museum admin section and saint routes, shared admin components/styles, Prisma schema/migration, and protected mirror audit route.
- Expected conflicts: branch was six code commits ahead and eleven commits behind origin/main at handoff. Release captain should reconcile newer museum/search changes and run integrated verification.
- Rollback notes: revert the combined feature commits and dependent integrations; retain the additive table and its audit data unless a separately reviewed data rollback is required.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
