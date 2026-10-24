# Release Handoff: codex/spn-museum-layout

- Status: ready
- Branch: `codex/spn-museum-layout`
- Commit: `6deb053`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Adds protected SPN layout foundation plus the user-approved Map first UI: 85 mapped spaces, lighter available vitrines, dark future vitrines, Provisional Number legend, compact navigation and recorded-content sidebar.

## Verification

- Map first follow-up: dev:check passed twice; browser component preview verified search, map/list, no-match recovery, selection, future and sticks restrictions. prepare:deployment completed checks but its nested argument forwarding failed; this existing handoff was updated manually. No production inventory smoke performed in this preview.
- Foundation verification: dev:check passed; codex:verify passed (19/19 static pages); 5 layout tests and 5 existing geometry tests passed; browser fixture map/list/search/future details passed. Existing museum-navigation test has one unrelated visitor-sequence expectation failure (South ending in Andhra versus current Kerala); relevant catalogue and test files unchanged. Authenticated production inventory smoke check remains for release.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No database writes. Source photo and versioned transcription are private repository data; operational locations are not created.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: MuseumRoomPlan, MuseumNavigation, shared CSS/tokens and design-system documentation.
- Expected conflicts: none
- Rollback notes: revert `6de0b71` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
