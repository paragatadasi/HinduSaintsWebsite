# Release Handoff: codex/spn-museum-layout

- Status: ready
- Branch: `codex/spn-museum-layout`
- Commit: `6de0b71674901906bcc3b966cbcc917f684bcbec`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Adds protected SPN layout foundation: 85 mapped spaces, provisional labels, future and walking-stick constraints, map/list inspection with recorded contents.

## Verification

- dev:check passed; codex:verify passed (19/19 static pages); 5 layout tests and 5 existing geometry tests passed; browser fixture map/list/search/future details passed. Existing museum-navigation test has one unrelated visitor-sequence expectation failure (South ending in Andhra versus current Kerala); relevant catalogue and test files unchanged. Authenticated production inventory smoke check remains for release.

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
