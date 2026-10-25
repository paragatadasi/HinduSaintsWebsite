# Release Handoff: codex/spn-v16-neem-revision

- Status: ready
- Branch: `codex/spn-v16-neem-revision`
- Commit: `393f958b039ae88e671f5f79804247fd48458f8d`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Approved v16 revision 1: exact Neem Karoli source proposed from 26 to 75; original v16/v15 remain selectable
- North-Vraj link labelled thematic; Kriya stays in 5; review cohort in 75 unchanged; no East-cave study included

## Verification

- dev:check and full codex:verify passed; 16 tests pass; browser revised 75/original 26/search/thematic/mobile passed; static chunk privacy spot-check passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No database writes or backfill. Only one proposal source destination differs; all 1423 observations, 303 shares, and 3 named-only entries preserved. Current curator destination wins; provenance hashes retain original v16 and approved delta.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Protected museum plan route, explorer component/helper, versioned data and indexed docs
- Expected conflicts: Based on released semantics fix; no known conflict; no dependencies, migrations or environment changes
- Rollback notes: revert `393f958` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
