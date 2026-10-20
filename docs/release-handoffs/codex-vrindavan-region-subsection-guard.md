# Release Handoff: codex/vrindavan-region-subsection-guard

- Status: ready
- Branch: `codex/vrindavan-region-subsection-guard`
- Commit: `ccb0eb64012abb9a3aed56e70f7dd796cfbaebf2`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Correct clarified hierarchy: six regional containers contain existing named subsections, display families and saints; retain subsection URLs/counts and expose region totals.
- Retire region-only replacement writer and projection; old forms fail safely server-side. No data backfill or section apply.
- Preserve shared grouping helper for Citra/Saarthi subsection sequencing; current incoming subsection order is retained pending that separate review.

## Verification

- `npm run dev:check`, `npm run prepare:deployment`, `npm run codex:verify`: passed (existing CSS autoprefixer warnings).
- 16 domain/navigation tests pass. Disposable database test verifies old apply cannot write and subsection/family/identity/SPN/arrangement/physical data stay unchanged.
- Live rendering confirmation follows actual deployment; do not infer from dispatch alone.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none. No production section batch has been applied. Verify live region headings contain actual legacy subsection links/counts, roots are not assignment options, and the source-data review has no apply button. Existing413confirmedsource rows/400saints/36held identity data unaffected. Family/context exception holds remain separate research work.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: museum nav/overview and shared client-safe vrindavanRegionGroups helper; Vrindavan working reader/current-state export; source-data section review/action guard; integration docs/tests. No planner, schema, migration, style or environment changes.
- Expected conflicts: Citra will consume vrindavanRegionGroups for planner palette; coordinate to avoid conflicting shared metadata order. Preserve subsection names/slugs/area keys. Saarthi v3 clarifies parent metadata; no new subsection ordering frozen here.
- Rollback notes: do not restore the obsolete flattening writer; if rendering needs rollback keep the unconditional server guard. No data rollback required.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
