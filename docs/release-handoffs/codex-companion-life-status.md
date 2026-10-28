# Release Handoff: codex/companion-life-status

- Status: ready
- Branch: `codex/companion-life-status`
- Commit: `06814e1`
- Owner/agent: Citra
- Bundle priority: immediate curator-requested correction

## Summary

- Starter adapter now passes through existing lifeStatus metadata, restoring the omitted tags in checklist/tree entries.
- Current exact-source/saint museum member dates and explicit living flags project into all three phase guides. Reuses already loaded museum data; no added inventory/database request.
- Suppress only May be alive when reliable birth evidence establishes more than100years. Respect exact day/month boundaries, unknown year-only boundary, and latest plausible range year. Never infer living from missing death; preserve explicit Still alive regardless of age. Suppression is not death confirmation.
- Pure presentation projection; immutable packets, canonical dates, placements, proposals and physical history untouched.

## Verification

- prepare:deployment passed; final dev:check passed after month-boundary refinement.
-13 focused life-status/Datta/Ram tests passed;5 life-status tests rerun after final month-boundary addition passed.
- Existing browser fixture smoke passed desktop/mobile, placements/undo, phase switching, search, shelves/tasks/alternatives. Fixture restores starter captured tags; age policy is covered by pure tests rather than fabricated birth data.
- Release captain owns integrated production build/full test gate for this small display-data correction.

## Deploy Notes

- Migrations: none.
- Environment variables: none; Airtable delivery remains disabled.
- Backfill/data changes: none. No new dependencies.
- User requested restoration as follow-up to just-deployed companion refinements.
- Nadi reviewed the evidence source and added/validated dated interpretation skill reference for the century rule.

## Risk And Conflicts

- Shared: starter guide adapter and protected move page; new pure life-status helper/tests/doc.
- Current member text is stored evidence, not fresh verification. Numeric/raw canonical contradictions need separate evidence review; no claim this display helper resolves all such conflicts.
- Missing or ambiguous current identity retains captured status rather than borrowing another saint's birth data. Narrative-only birth text is not treated as a trustworthy year.
- Rollback: revert this scoped correction; preserve prior release's placement undo decoder and added work/alternative storage.

## Release Captain Notes

- Integrated into main: pending
- Pushed to main: no
- Merged to deploy: pending
- Production workflow: pending
