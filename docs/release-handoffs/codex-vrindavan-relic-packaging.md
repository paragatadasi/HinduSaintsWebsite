# Release Handoff: codex/vrindavan-relic-packaging

- Status: ready
- Branch: `codex/vrindavan-relic-packaging`
- Commit: `e04e93e891044d97684f750318a72d79aad58daa`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Expose preserved Vrindavan column E as frame/small-frame/mixed/unframed/unknown evidence in inventory, section/family placements, current-state export and planner sources.
- Add shared source-ID-deduplicated counts for curator planning. Sheet1 wins comparison-sheet discrepancies per direct user instruction; quantities never imply physical frame counts or dimensions.

## Verification

- `npm run dev:check` and `npm run prepare:deployment`: passed.
- 37 focused packaging, inventory, search, section and planner tests passed.
- Disposable database integration passed via scripts/verify-vrindavan-packaging.ts: existing raw E reaches inventory/working/planner, Sheet1 wins, shared IDs deduplicate, pending rows excluded, and persisted identities/locations/photo setup/audits remain unchanged.
- No branch-specific production build required: no dependencies/schema/migrations/auth/routing/build changes; release captain owns integrated codex:verify.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none. Workbook hash matches existing89c0c02d snapshot; E already preserved in rawJson.cells[4]. Read-only projection, no reimport or DB writes. Current413linked entries yield125Frame/13mixedFrame/2SmallFrame/270unframed/3unknown;4secondary discrepancies are informational and useSheet1. Citra owns planner/family count presentation; bundle her compatible UI follow-up when ready, or report data support released before presentation.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: museum source entry type, MuseumSaintPlacement optional sourcePackaging, planner source contract/revision input and new plannerPackagingCounts helper; Vrindavan adapters/current-state export; docs/tests. No styles or UI components changed.
- Expected conflicts: Citra may edit planner adapters/domain for regional UX. Merge packaging sources and revision input additively; keep photo status independent. Send exact helper contract to Citra, preserve her shared region ordering.
- Rollback notes: revert code and dependent presentation code; no database rollback. Existing raw E, identity links and saved arrangements stay intact.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
