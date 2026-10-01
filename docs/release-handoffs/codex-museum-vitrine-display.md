# Release Handoff: codex/museum-vitrine-display

- Status: ready
- Branch: `codex/museum-vitrine-display`
- Commit: `712e97035d36d3087e657151f2afd2085eaa64b6`
- Owner/agent: `Museum data integration`
- Bundle priority: immediate release candidate

## Summary

- Show SPN vitrine and shelf on working saint proposal cards only when exact source links resolve to consistent mirror values.
- Read-only curator pilot: no saint creation, merges, placement writes, or public data exposure.

## Verification

- dev:check passed during prepare:deployment; npm argument forwarding prevented handoff creation, recovered using generator directly. 13 focused tests passed. Authenticated visual QA not performed; captain owns integrated build.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No backfill. Uses existing SPN Website Saints mirror; values change on normal mirror refresh. Do not run CSV review/import or reset CMS.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: lib/museum-working-data.ts, lib/museum-working-view.ts, lib/museum-proposals.ts, app/museumadmin/[section]/museum-section-workspace.tsx
- Expected conflicts: Queued codex/museum-saint-biodata rewrites SaintModal. Preserve biography-first native dialog; insert SPN vitrine fact in Museum placement below Section.
- Rollback notes: revert `712e970` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
