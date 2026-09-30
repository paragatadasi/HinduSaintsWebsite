# Release Handoff: codex/restore-museum-proposal-browsing

- Status: ready
- Branch: `codex/restore-museum-proposal-browsing`
- Commit: `940900e162a2635af83c36241ca827accd553475`
- Owner/agent: `Museum Data Integration`
- Bundle priority: immediate release candidate; live-site regression

## Summary

- Restore original section proposal navigation, primary/secondary/tertiary lists, family groupings, trees, search, and saint proposal modals independently of database placement acceptance.
- Keep canonical placement review and saved decisions intact, with links between reference browsing and review. Historical preview controls are explicitly temporary and do not save or overwrite database data.
- Clarify source-candidate counts versus saved placements, and distinguish pending proposals from records with no saved primary placement.

## Verification

- `npm run prepare:deployment`: passed.
- `npm run codex:verify`: passed.
- `npm test`: 202 passed, including regression coverage for 23 sections and 1,399 distinct source IDs without database placements.
- Authenticated isolated browser: all 23 section URLs returned 200 with no database placements or MuseumSection definitions; sidebar navigation, tier lists, original saint reference modal, review link, and pending-proposal label passed.
- `git diff --check`: passed.

## Deploy Notes

- Migrations: none. Keep the existing museum integration schema and saved decisions.
- Environment variables: none.
- Data/backfill/release steps: none required to restore browsing. This release does not stage or accept proposals. Production coverage audit and explicit placement review remain separate.
- Queue/deploy trigger: ready now; user requested restoration of missing live section proposal pages.
- Smoke test: verify /museumadmin shows 23 proposal sections, left-navigation and visitor-flow section links work, a section contains its primary/secondary/tertiary listings, and Placement review remains accessible.

## Risk And Conflicts

- Shared areas touched: museum index/layout/section workspace/review copy, museum documentation, and a new proposal regression test. No shared CSS, backend mutations, auth, or schema changes.
- Expected conflicts: only overlapping museum UX changes.
- Rollback notes: reverting this fix reintroduces the empty database-backed section browser. No database rollback is needed or appropriate.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
