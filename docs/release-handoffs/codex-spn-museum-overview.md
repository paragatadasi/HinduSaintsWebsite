# Release Handoff: codex/spn-museum-overview

- Status: ready
- Branch: `codex/spn-museum-overview`
- Commit: `a6431fd66aadc49d1c6e3248b157fb81b2584668`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Make Museum Overview the first SPN workspace item and museum-selector/sign-in landing destination.
- Layout and Vitrine records share /museumadmin/overview; filters, pagination and selected-vitrine links stay in that experience. Old plan/locations links redirect with supported filters preserved.
- Keep room component reusable, questionnaire below the map, and browsing copy independent of reorganization.

## Verification

- dev:check passed; museum-overview URL tests 2/2 passed; production-component browser checks passed for record links, current sidebar state, filters and pagination with no console errors. codex:verify passed outside sandbox after initial local standalone-packaging EPERM.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No data, schema, migration or environment changes. Existing access_museum and full-catalog rules retained; legacy routes are compatibility redirects. Section proposal routes and Vrindavan unchanged.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Museum navigation, room/layout components, inventory filters, SPN layout/plan/locations routes, admin museum dashboard link
- Expected conflicts: Based on ca2f89c regional navigation already deployed. Prefer code a6431fd plus this handoff if cherry-picking. Nadi backend files untouched.
- Rollback notes: revert `a6431fd` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
