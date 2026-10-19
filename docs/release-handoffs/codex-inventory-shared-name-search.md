# Release Handoff: codex/inventory-shared-name-search

- Status: ready
- Branch: `codex/inventory-shared-name-search`
- Commit: `46638b96da44765914c98ee2bd6d790b24637a40`
- Owner/agent: `Nadi (Museum Data Integration)`
- Bundle priority: immediate release candidate

## Summary

- Use shared site weighted matching for Vrindavan source inventory and SPN relic/location search, including current website aliases.
- Match Jagadbandhu to Jagad Bandhu Sundar in shared ranking and PostgreSQL saint-name/alias candidate retrieval; preserve exact-match priority and inventory location filters.

## Verification

- dev:check and codex:verify passed;49 focused site/museum/location/option search tests passed;guarded disposable PostgreSQL joined-name/alias retrieval and public/private scope test passed. Heavier build gate used for public search backend changes instead of redundant prepare check.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No backfill or data writes. After deployment smoke-test Jagadbandhu in /vrindavanadmin and /museumadmin/locations, plus public search. Blank query preserves inventory order; nonblank query ranks by relevance. Identity-normalization forms and automatic identity decisions unchanged.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: lib/search-text.ts, lib/postgres-saint-search.ts, inventory reader/matchers and museum status documentation. No UI/layout/auth or schema changes.
- Expected conflicts: Review concurrent shared search edits and additive museum status doc overlap. PostgreSQL spacing fallback adds regex comparisons on names/aliases; no migration or index changes.
- Rollback notes: revert `46638b9` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
