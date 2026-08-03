# Release Handoff: codex/hide-profile-encounter-with-related

- Status: ready
- Branch: `codex/hide-profile-encounter-with-related`
- Commit: `cee48ff177eff794ddeded0db8fa4a318d9fdc31`
- Owner/agent: `aporu`

## Summary

- Hides the "Encounter a New Saint" profile experience whenever published related saints are available.
- Keeps the encounter experience as a fallback for profiles without related saints.

## Verification

- `npm run dev:check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none

## Risk And Conflicts

- Shared areas touched: `app/saints/[slug]/page.tsx`
- Expected conflicts: none
- Rollback notes: revert `cee48ff` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
