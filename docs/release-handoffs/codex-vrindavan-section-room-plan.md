# Release Handoff: codex/vrindavan-section-room-plan

- Status: ready
- Branch: `codex/vrindavan-section-room-plan`
- Commit: `0b7a04d0132d88379861c074e4997ed03a9948e5`
- Owner/agent: Citra
- Bundle priority: immediate curator refinement under standing deployment authorization

## Summary

- Room-first planner at `/vrindavanadmin/plan`: drag a section card onto numbered vitrines on desktop, or select and tap/keyboard-toggle vitrines. Explicit area save/discard, unsaved indicators, shared-area labels and exact-assignment counts.
- Stable display-family grouping with whole-family selection, expandable names/current destinations, partial-family notices, and bulk unassigned tertiary selection. Individual target choices are limited to the selected section's saved area; a section may span several vitrines.
- Selected Proposed saints can have an explicit flexible plan within the section area. Their checklist says Area planned and requires one actual vitrine when physically confirming. Exact plans and implemented locations take precedence; no duplicate per-vitrine counts for flexible saints.
- Draft area version guards prevent an old section draft from silently overwriting a newer saved area after another page refresh. Flexible membership is tied to placement revisions and invalidates when proposals change.

## Verification

- `npm run dev:check`: passed during development.
- 16 planner/arrangement/Vrindavan domain tests: passed.
- Disposable localhost museum_planner_test: additive migration applied; `scripts/verify-museum-move-planner.ts` passed area/flexible saves, older draft versions, stale global revisions, wrong/absent completion vitrine, exact precedence, completion, proposal revision invalidation, clearing areas, audit preservation and no source/SPN/physical writes.
- `npm run codex:verify`: passed complete production build; existing unrelated CSS start-value warnings remain. Planner start warnings fixed.
- `npm run prepare:deployment`: passed.
- Desktop fixture: actual pointer drag onto vitrine 9 produced reserved draft area; bulk tertiary selection and partial-family warnings verified. Mobile 390x844: tap map, discard, whole-family selection, sticky destination link, and flexible checklist's actual-vitrine selector verified. Temporary preview route removed; no authenticated production mutations tested.
- `git diff --check`: passed. Documentation encoding/line-ending cleanup follows code commit in handoff commit; no code change after checks.

## Deploy Notes

- Migrations: `20261020120000_museum_section_space_plan`, additive MuseumSectionSpacePlan table. Run in release/migrate phase before serving new planner; no backfill.
- Environment variables: none.
- Data/backfill: none. No photo import or proposal-catalog replacement performed.
- Queue/deploy trigger: READY now, coordinate with other curator work as appropriate.
- Smoke: choose a section, drag/tap three vitrines, Save section area and reload. Select whole family and exact vitrine; separately bulk-select unassigned tertiary and Keep selected flexible. Check flexible checklist requires one actual allowed vitrine and physical acknowledgements. Do not mark real saints implemented merely for testing.

## Risk And Conflicts

- Shared areas: planner service/domain/actions/components, room component/new drag helper, schema additive model/migration, planner CSS/tokens, design/museum docs. No changes to working-data/domain, section catalog/nav/routes, auth or public saint fields.
- New table keys use current section names. Nadi is preparing a new regional catalogue; direct coordination now authorized by Paragata and contract message sent. A later section rename must explicitly preserve/map or expose earlier reserved areas. Flexible members invalidate on changed section/proposal revision rather than guessing a physical destination. Do not silently merge a catalogue rewrite that hides saved areas without resolving that transition.
- Nadi's photo import may touch planner reads: existing photo IDs and pending/untagged semantics remain; no manual photo setup UI restored.
- Family action is explicitly scoped to members in the selected section; other-section members are counted and labelled, not silently moved. Flexible plan does not automatically enroll future imports or override exact destinations. General arrangement status remains Proposed until one exact vitrine is selected; the planner shows the separate Area planned state.
- Rollback: revert feature code, keep additive table and saved area data. Existing exact plans continue to work with previous planner.

## Release Captain Notes

- Integrated into main: pending
- Pushed to main: no
- Merged to deploy: pending
- Production workflow: pending
