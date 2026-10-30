# Release Handoff: codex/vraj-east-shelf-coverage

- Status: `ready`
- Branch: `codex/vraj-east-shelf-coverage`
- Commit: `79ccdbac71f492a04a9b22e9a550a5003b84e6b4`
- Owner/agent: Citra
- Bundle priority: immediate release candidate, combined shelf context and UI

## Summary

- Add a read-only Shelf plans workspace tab covering all 18 reviewed Vraj/East vitrines and 347 source observations. Link: /museumadmin/move?moveView=shelves&shelfVitrine=2 .
- Includes Nadi's guarded adapter (3dbcb8a cherry-picked as ae7dbbf), shared shelf rendering, current location/life labels, five conceptual rows, family rails, explicit fit warnings, and changed/pending recommendation review.
- Packet revision 5 SHA256 0956406b2c20871fb81712ffa933e19129e2861d76012eb9b9f1aeb5e4d1b240. Final independent runtime audit: 347 active, zero pending. Runtime changes still trigger review rather than silent replacement. Two stale captured baselines were reviewed/refreshed with history; no current museum data was changed.
- Existing Northern/V5 shelf plans remain intact; V36 carry-forward is exact. V73 is not claimed cleared or given an invented shelf roster.

## Verification

- npm run codex:verify: passed, 29 pages. Initial restricted build failed on Windows EPERM output directory creation; elevated rerun succeeded.
- npm test: 759 passed, one skipped, zero failed.
- Focused adapter tests: 8/8; reviewed packet invariants: 2/2.
- npm run prepare:deployment: passed. Fixed a test-only JSON-array inference issue caught by final TypeScript checking.
- Browser QA with final audited rev5 fixture: all 18 cases and 347 records visible; no physical mutation controls/writes; selection survives refresh; current guide navigation, fit warning, unlabelled-entry fallback and refresh error recovery passed. Earlier rev4 fixture also verified explicit held rows/earlier shelf suggestions.
- Final packet audited independently by Nadi and Saarthi. V35 lower-band shortfall 0.49 and V33 unknown-size uncertainty remain visible. Geometry remains unverified.

## Deploy Notes

- Migrations: none.
- Environment variables: none. Airtable delivery remains disabled.
- Data/backfill: none; recommendation packet is server-loaded behind museum access checks.
- Queue/deploy trigger: ready now; use this combined branch instead of separately integrating codex/shelf-planning-context. It already contains the tested adapter and updated contract documentation.
- Do not change physical move contexts, clearances, source restrictions or receipts as part of this release. The walking sticks outside V20 remain excluded from its component-scoped staging confirmation.

## Risk And Conflicts

- Shared areas: MuseumShelfGuide, SpnRoomMoveCompanion, design documentation, new protected GET /api/admin/museum-shelf-plans.
- Context refresh is read-only on entry/focus/30-second interval; physical labels use the existing live companion state. Open move guide returns to an already registered phase.
- Rollback: ordinary code rollback; no persisted data or schema changes. Retain prior component-aware physical readers from the V20 release.
- Skill review found no new reusable interpretation rule.

## Release Captain Notes

- Integrated into main: pending.
- Pushed to main: no.
- Merged to deploy: pending.
- Production workflow: pending.
