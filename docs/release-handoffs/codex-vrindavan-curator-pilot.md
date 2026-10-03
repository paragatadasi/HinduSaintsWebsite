# Release Handoff: codex/vrindavan-curator-pilot

- Status: `ready`
- Branch: `codex/vrindavan-curator-pilot`
- Commit: `8581cb1525cd8ab0bdedd0ef0df89135d128dd02`
- Owner/agent: Museum Data Integration
- Bundle priority: immediate data dependency for the Vrindavan UX pilot

## Summary

- Private readVrindavanMuseumInventory reader exposes already confirmed source rows grouped by canonical website saint or display, with museum-scoped source location contract.
- Preserves relic description, original quantity text, packaging, source place, display/position, comments, evidence warnings and confirmation provenance. Draft saints remain private.
- One entry per confirmed workbook row; physicalItemId is null unless a future object import explicitly links it. Source observations can describe several objects and are not fabricated physical items or implemented placements.
- Snapshot isolation prevents double counting; removed/archived saint targets retain warnings without active saint links. No mutation or second upload is needed.

## Verification

- npm run dev:check: passed.
- npx tsx --test lib/museum-source-inventory-domain.test.ts lib/vrindavan-museum-inventory.test.ts: 9 passed (run as two focused commands).
- npm run prepare:deployment: passed.
- No UI/routes/auth/dependency/schema changes; integrated production build belongs to Release Captain alongside the consuming UX branch.

## Deploy Notes

- Migrations: none.
- Environment variables/dependencies: none.
- Data/backfill/release steps: none; reads existing identity_linked observations in museum-vrindavan. Expected 278 based on user's confirmed production audit, not hardcoded or asserted by local tests.
- Queue/deploy trigger: ready; UX chat is implementing the separate /vrindavanadmin pilot shell against this contract. Integrate data first, then consuming UI when ready; coordinate today-pilot release with that chat.

## Risk And Conflicts

- Shared areas touched: appended docs/museum-data-integration.md only; four new data/test modules.
- Reader is private server-side; callers must enforce access_museum. Never feed public saint routes.
- SourceLocation has no MuseumLocation database ID and evidence=source_reported. Do not connect observationId to physical item move routes. Source place never updates saint place/visit destination.
- Rollback notes: code-only rollback; no data mutations.

## Release Captain Notes

- Notify Museum Data Integration thread 01a0f25f-fc6a-7fd2-a3f8-cd78f289cc5e when deployed, per standing user request.
- Integrated into main: pending
- Pushed to main: no
- Merged to deploy: pending
- Production workflow: pending