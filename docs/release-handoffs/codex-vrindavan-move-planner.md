# Release Handoff: codex/vrindavan-move-planner

- Status: ready
- Branch: `codex/vrindavan-move-planner`
- Commit: `8c27901b82114f299e987772bfadadebeb4de964`
- Owner/agent: Citra
- Bundle priority: immediate release candidate; curator starting planning now

## Summary

- `/vrindavanadmin/plan` and shared navigation link: numbered room schematic (0–24), photo-vitrine setup with persistent saint tags, section summaries/primary saints/distinct photo counts, whole/partial section assignments to destinations with optional shelves.
- Saved printable move list shows destination and source location/relic descriptions, shared-entry warnings, and links to existing arrangement controls. Faster move-day confirmation UI follows separately; do not wait for it to release planning.

## Verification

- `npm run dev:check`: passed.
- `npm run codex:verify`: passed production build (existing CSS start-value warnings plus planner rules, nonblocking).
- `npm run prepare:deployment`: passed.
- 12 focused planner/arrangement/Vrindavan working-domain tests: passed.
- All migrations applied to fresh disposable localhost museum_planner_test; `scripts/verify-museum-move-planner.ts`: passed photo snapshot, partial/whole planning, zero/optional shelf, stale/replacement/foreign-ID protection, atomic rejection, auditing, no source/SPN/physical writes.
- Desktop and 390px browser fixture checked: room map fits, partial selection and destination feedback, readable member rows, saved move list. Temporary preview route removed.
- `git diff --check`: passed.

## Deploy Notes

- Migrations: `20261020100000_museum_planning_setup`, additive MuseumPlanningSetup table only. Run in release/migrate phase before serving route; no backfill or destructive SQL.
- Environment variables: none.
- Data/backfill/release steps: none. Curator explicitly selects photo vitrines after deployment; no photograph locations pre-assumed.
- Queue/deploy trigger: READY now under standing authorization. Please deploy first phase promptly.
- Smoke: curator visits Vrindavan → Plan the move; photo setup saves and counts update; select section/unplanned saints, numbered destination and optional shelf; verify save persists and appears in Saved move list. Planning must not change original source locations.

## Risk And Conflicts

- Shared areas: shared museum navigation, appended global CSS/tokens, Prisma schema additive model, museum/design docs. New planner modules/routes are isolated.
- Read gates: access_museum + view_full_saint_catalog; write gate additionally manage_museum. Serializable transactions use existing Vrindavan museum lock and full revision checks.
- Source inventory can describe multiple relics; no physical item assertions or moves performed by planning. Room drawing is not a capacity estimate. Unreviewed identities excluded and coverage shown.
- Photo tags are a snapshot, remain after destination changes, and are replaced only on explicit setup save. Source location ambiguity is not guessed.
- Rollback: revert feature UI/service commit; retain additive table and saved data.

## Release Captain Notes

- Integrated into main: pending
- Pushed to main: no
- Merged to deploy: pending
- Production workflow: pending
