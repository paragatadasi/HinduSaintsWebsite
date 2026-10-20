# Release Handoff: codex/researched-key-localities

- Status: ready
- Branch: `codex/researched-key-localities`
- Commit: `671da5e2e164aa4e842a5e1b67cc5f5cd1260e02`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Add an audited bulk update for published saints' researched primary and additional key localities, with live coverage gaps and preserved source evidence.

## Verification

- npm run dev:check passed on October 20 via prepare:deployment; npm run codex:verify passed on code 671da5e; 9 focused tests passed; guarded disposable PostgreSQL locality integration passed. No production DB writes or authenticated browser smoke claimed. Handoff generated directly after npm nested argument forwarding failed.

## Deploy Notes

- Migrations: 20261019160000_saint_key_locality_order: nullable SaintPlace.keyLocalityOrder, range constraint and index; release/migrate phase only.
- Environment variables: none
- Data/backfill/release steps: No automatic backfill. After deployment an authorized editor uses /admin/source-data/key-localities to preview and explicitly apply selected updates. Source covers 214 identities, at most 161 with a usable named representative before live identity/place checks. No production data changed yet.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: SaintPlace schema; public saint/place/tradition primary location helpers; admin saint/place editing and merges; visit-place acceptance; protected Source Data routes.
- Expected conflicts: Keep codex/vrindavan-six-region-proposals (caf7bb7) OUT: user is refining section proposals with Saarthi. Review overlap with concurrent saint/place actions or merge changes.
- Rollback notes: revert `671da5e` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
