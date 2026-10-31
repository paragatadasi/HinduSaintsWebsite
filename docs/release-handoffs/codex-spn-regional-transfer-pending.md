# Release Handoff: codex/spn-regional-transfer-pending

- Status: ready
- Branch: `codex/spn-regional-transfer-pending`
- Commit: `860faaf5e3baba2ed60e00b17bfb406815848a95`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Keep approved South/Andhra transfer pending without a fabricated vitrine

## Verification

- dev:check passed; 24 focused tests passed; prepare:deployment checker passed, handoff generated directly due to nested npm argument forwarding

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: Read-only scoped projection; no backfill or physical writes
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: SPN reviewer, catalog/search/staging, shelf and guide projection
- Expected conflicts: Citra staging-destination-groups: preserve per-row proposalTransfer label inside grouped staging contents
- Rollback notes: revert `860faaf` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
