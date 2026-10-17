# Release Handoff: codex/museum-search-refresh

- Status: queued
- Branch: `codex/museum-search-refresh`
- Commit: `425802c2f195dd5731238c9e079fb026b76b70dc`
- Owner/agent: `Search Logic`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Supersedes codex/museum-shared-search at 9d03ccf (code cfe99e0); rebuilt on origin/main 11d1dc6 without merging the conflicting old UI.
- Share weighted matching across current working museum views, historical proposals, tertiary search and review; preserve current aliases and saved placement scopes.
- Fix false fuzzy scores for unrelated four-to-six-letter queries. Preserve existing result dialogs, native focus and Escape behavior, wrapped values, relationship/family controls and working-placement data.

## Verification

- dev:check passed; 50 targeted tests passed; full npm test: 338 passed, 1 opt-in DB integration test skipped. Full suite used a dummy localhost:1 URL for mocked Prisma initialization; no real DB required. Integrated production build remains with release captain.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No migrations, environment changes or backfills. Smoke-test Anandamayi Ma, aliases, g and baba in museum search; result should open current Saint overview with saved controls. Shared working search is also used by Vrindavan sections. Broad single-letter queries may return many candidates.
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: lib/search-text.ts scoring guard; museum search/working-view/proposal helpers; components/admin/museum-section-workspace.tsx filtering only; app/museumadmin/review/page.tsx matching only.
- Expected conflicts: Replaces old museum-shared-search branch; do not merge or cherry-pick cfe99e0 or 9d03ccf. Existing museum index, result/dialog components, shared styles and saved mutation controls are untouched. Based on origin/main 11d1dc6.
- Rollback notes: revert `425802c` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
