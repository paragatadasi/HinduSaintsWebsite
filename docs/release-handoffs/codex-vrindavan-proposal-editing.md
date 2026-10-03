# Release Handoff: codex/vrindavan-proposal-editing

- Status: ready
- Branch: `codex/vrindavan-proposal-editing`
- Commit: `70b8fc64c81c24b7fc7dfde0c3407eb307eaa54e`
- Owner/agent: curator UX
- Bundle priority: immediate release candidate

## Summary

- Add independent Vrindavan section, tier and display-family proposals using shared saint/family dialogs and arrangement forms.
- Support whole-family section moves and Proposed / Planned / Implemented arrangements, with stale-form protection and explicit incomplete-inventory attestations.
- Keep SPN proposals, historical relationships and physical relic placements separate. Document architecture, rules and remaining work.

## Verification

- `npm run prepare:deployment`: passed.
- `npm run codex:verify`: passed (production build and type checks).
- Focused arrangement, Vrindavan working-view and section-view tests: 11 passed.
- `scripts/verify-vrindavan-proposals.ts`: passed against disposable local PostgreSQL after all 79 migrations.
- `scripts/verify-museum-arrangement.ts`: passed, including SPN single/family regression after shared writer refactor.
- Browser visual verification unavailable: browser control timed out during navigation/focus. No new visual pass claimed. Temporary fixture removed.

## Deploy Notes

- Migrations: additive `20261003163000_museum_curator_proposal`; run during release migration phase, never web build.
- Environment variables: none.
- Data/backfill/release steps: no backfill; inherited suggestions remain until explicit curator edits. Do not convert source observations to physical items.
- Depends on prior curator phases through family planning `68fd4a0` and Vrindavan section view `b4d071b` (included in ancestry).
- Queue/deploy trigger: ready now under user authorization for intermediate releases.

## Risk And Conflicts

- Shared areas touched: museum arrangement writer/domain and shared saint/search/family/membership components, Prisma schema, museum integration/security docs.
- Expected conflicts: additive schema/docs overlap with Museum Data Integration; preserve both teams' additions. Its section-audit reader was not edited.
- Canonical SPN exhibit-group section transfer and verified Vrindavan physical item linking remain subsequent work.
- Rollback: revert feature code and dependent commits; retain additive table/data for recovery rather than dropping curator overrides.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
