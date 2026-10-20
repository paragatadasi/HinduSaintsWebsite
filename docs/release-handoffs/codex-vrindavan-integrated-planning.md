# Release Handoff: codex/vrindavan-integrated-planning

- Status: `ready`
- Branch: `codex/vrindavan-integrated-planning`
- Commit: `4096d66c690138f474d8066313640ea42447d8b8`
- Owner/agent: Citra
- Bundle priority: immediate release candidate

## Summary

- Explicit remove buttons for selected section vitrines, with Save/Discard and persistent visibility of exact destinations outside the saved area.
- One integrated section workspace: overview, primary saints/families largest first, remaining individuals, shared desktop destination editor.
- Family tree reference opens on demand in a dialog. Bulk remaining-tertiary selection excludes family members; family selection remains together or per member.
- Phone move companion has fitted two-column filters, touch-sized controls and readable inputs; planning remains usable on smaller screens.

## Verification

- `npm run prepare:deployment`: passed.
- `npx tsx --test lib/museum-move-planner-domain.test.ts`: 12 tests passed.
- `git diff --check`: passed.
- Synthetic local browser fixture at 1440x1000 and 390x844: removal marks area draft, warns on retained exact destinations, Discard restores area; whole-family selection and destination selection enable correct controls; phone filters/card fit viewport. Fixture and generated fixture type removed before final checks. No production data mutations.
- Shared tree viewer reused; family API loading requires authenticated museum access and was not exercised with synthetic IDs. Release captain owns integrated production build.

## Deploy Notes

- Migrations: none.
- Environment variables: none.
- Data/backfill: none. Existing guarded area and assignment actions unchanged.
- Ready now under standing phased-release authorization.

## Risk And Conflicts

- Based on prior-area-review tip f783571; integrate that branch first or this descendant includes it.
- Shared: planner component/domain/tests, global CSS/tokens, museum-data-integration docs.
- Nadi catalogue changes should compose: canonical working.sections adapter already included. Merge documentation deliberately if needed.
- Removing area does not clear exact placements; existing empty-area behavior clears flexible memberships only. Standard UI rollback.

## Release Captain Notes

- Integrated into main: pending
- Pushed to main: no
- Merged to deploy: pending
- Production workflow: pending
