# Release Handoff: codex/visit-place-location-filter

- Status: ready
- Branch: `codex/visit-place-location-filter`
- Commit: `81ba11faf439f09998d7d926be451ab833e87362`
- Owner/agent: Museum Data Integration
- Bundle priority: immediate compatible release candidate

## Summary

- Adds Current location filtering directly to the visit-place acceptance batch: All saints, No primary place, No place associations.
- Missing-primary includes saints with other existing associations; missing-all requires no SaintPlace records. Unresolved identities are excluded from the two missing-location subsets.
- Combines with existing confidence/status/search/catalog filters before the 300-proposal preview cap. Select all eligible stays scoped to the filtered batch. Acceptance validation, revision checks and confirmation are unchanged.

## Verification

- `npm run prepare:deployment`: passed (Prisma generation and TypeScript).
- `git diff --check`: passed.
- Existing stale .next/types from the previous worktree branch caused unrelated Vrindavan route typing errors; removed only generated types and reran successfully.
- No new routes, dependencies, auth, schema, migration or build configuration; integrated production build belongs to release captain.

## Deploy Notes

- Migrations: none.
- Environment variables: none.
- Data/backfill: none. Filter reads current website SaintPlace associations and writes no records.
- Queue/deploy trigger: ready now.
- Production UI verification still needed after deployment: combine High confidence with No primary place; apply filters; select eligible rows. No proposal is accepted automatically by this change.

## Risk And Conflicts

- Shared areas: app/admin/source-data/visit-places/accept/page.tsx and docs/visit-place-research.md only.
- No museum UX, shared styles/components or research data changes.
- Standard code rollback; no data rollback.

## Release Captain Notes

- Integrated into main: pending.
- Pushed to main: no.
- Merged to deploy: pending.
- Production workflow: pending.
- Notify this chat directly after deployment completion.
