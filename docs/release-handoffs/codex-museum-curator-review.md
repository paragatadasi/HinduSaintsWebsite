# Release Handoff: codex/museum-curator-review

- Status: ready
- Branch: `codex/museum-curator-review`
- Commit: `4af57fb0020179c8afa480679de916c0e5e6234f`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Add an evidence-led curator identity review workspace in Vrindavan plan mode, with guarded museum-subsection confirmation and notes for uncertain cases.
- Includes Nadi's reviewed case contracts, three approved subsections, stale-plan flags and collector investigation register (0f4d7be cherry-picked as 444a4e8).

## Verification

- dev:check passed; codex:verify passed after Windows permission and UTF-8 fixes; 25 targeted tests passed; synthetic browser and service transaction-adapter QA passed. Real PostgreSQL concurrency and production ready/blocked counts remain unverified.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No automatic assignments or physical moves. After deployment inspect protected Review identities queue counts and options. Existing source-link cases stay in reconciliation. Preserve held and stale destinations.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Vrindavan plan actions and planner; review DTO/manifest/service; shared CSS and design docs; approved subsection vocabulary and working projection.
- Expected conflicts: Contains Nadi data code 0f4d7be as 444a4e8: do not duplicate that patch. Treat his separate handoff as included by this combined branch. No schema or environment changes.
- Rollback notes: revert `4af57fb` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
