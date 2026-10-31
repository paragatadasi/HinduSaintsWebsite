# Release Handoff: codex/clear-vitrine-destination-groups

- Status: `ready`
- Branch: `codex/clear-vitrine-destination-groups`
- Commit: `fb27528e34a0ef90b0bae88991d33e72e5016b40`
- Owner/agent: Citra
- Bundle priority: Ready curator clearing-card refinement

## Summary

Both companion clearing cards use shared compact destination groups sorted numerically, with counts of recorded entries (not inferred individual objects), quiet shelf text, and retained handling warnings. Unknown destinations and unlinked records stay separate. Repeated source-reported and current vitrine labels removed as requested. Clearing acknowledgements, handlers and blockers unchanged.

Catalog destination fallback uses current approved reviewer rather than old v16; saved additions and alternatives retain precedence. Grouping prefers current catalog over captured guide entries, then saved alternatives/additions.

## Verification

- prepare:deployment: passed.
- Focused grouping/addition tests: 11 passed.
- Real component browser fixture: numeric grouping/counts, unknown bucket, warnings, no source-reported; desktop and 390px no overflow. Screenshot inspected.
- git diff --check: passed.
- No production mutations for verification.

## Deploy Notes

- Migrations: none.
- Environment variables: none.
- Backfill: none.
- Counts are source/display entries; one can contain multiple relics.
- No tokens changed; shared theme-token CSS and design index documented.
- Skills review: no new general data interpretation rule; approved-review precedence was already documented by Nadi.

## Risk And Conflicts

- Shared areas: companion component, catalog reader, globals.css, design-system index; new MuseumClearContents component/test.
- Release captain owns integrated verification, including catalog read path.
- Rollback only changes presentation/read grouping; physical state unaffected.

## Release Captain Notes

- Integrated into main: pending
- Pushed to main: no
- Merged to deploy: pending
- Production workflow: pending
