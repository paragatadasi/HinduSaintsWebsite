# Release Handoff: codex/shared-museum-navigation

- Status: ready
- Branch: `codex/shared-museum-navigation`
- Commit: `93ae96b4f245e0819cb791022a763d0ec79684f5`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Shared museum sidebar uses Museum, Curator workspace, Section proposals and More groups based on the existing numbered section style.
- Vrindavan gains all grouped section links with its own working counts and query-based current-page highlight; empty destinations remain available.
- Section readers run only after museum and full-catalogue permission checks. Request-local Vrindavan reader reuse avoids duplicate layout/page work; no persistent cache.

## Verification

- `npm run prepare:deployment`: passed.
- `npm run codex:verify`: passed, full production build.
- Navigation domain tests: 2 passed (museum URLs/counts/empty destinations and active query/path handling).
- Local synthetic fixture browser checks: desktop and390px styling,23 section links targeting Vrindavan, active museum indicator, no document horizontal overflow. Temporary fixture removed.
- Access ordering reviewed in code; no production authenticated navigation test performed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none. Counts are read from each museum working view; no data mutations.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: MuseumWorkspace, both museum layouts, Vrindavan section-page reader import, new shared navigation and request-local reader wrapper, shared CSS/museum docs.
- Expected conflicts: adjacent museum docs/CSS/layout changes possible. Based on readable-tree tip78c5496; integrate that ready dependency if not already released and preserve prior handoff cleanup. Independent of canonical relationship reconciliation.
- Rollback notes: revert `93ae96b` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
