# Release Handoff: codex/museum-physical-confirmations

- Status: deployed
- Branch: `codex/museum-physical-confirmations`
- Commit: `641507d1955c62aa2753188b318cecce89d91670`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Record source-specific physical confirmations independently of original imports, proposals and planning sessions.
- Protected read/confirm API with dated immutable receipts and fresh identity/location checks; existing session behavior retained.

## Verification

- dev:check passed; 4 domain tests passed; fresh disposable physical-confirmation and session regression verifiers passed; codex:verify passed.

## Deploy Notes

- Migrations: 20261028000000_museum_move_sessions adds current-location and optional session/event tables; normal release phase only.
- Environment variables: none
- Data/backfill/release steps: No automatic data writes/backfill. After deployment, record only the authorized 22 screenshot confirmations using fresh GET revisions; keep unknown shelves empty. No proposal/session retarget, source overwrite, item fabrication or empty-case claims.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Prisma schema append; protected physical and move-session APIs; current-location resolver; museum source adapter.
- Expected conflicts: none
- Rollback notes: retain ledger and audit tables after confirmations exist. Application rollback must not delete physical history or original evidence. No destructive down migration.

## Release Captain Notes

- Integrated into `main`: `b30a9c6`
- Pushed to `main`: yes
- Merged to `deploy`: `6f281da`
- Production workflow: [40552540964](https://github.com/paragatadasi/HinduSaintsWebsite/actions/runs/40552540964) — success
