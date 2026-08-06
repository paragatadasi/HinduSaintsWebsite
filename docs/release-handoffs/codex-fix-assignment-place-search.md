# Release Handoff: codex/fix-assignment-place-search

- Status: ready
- Branch: `codex/fix-assignment-place-search`
- Commit: `89e33a09d56b72ef46b7b7786a25b7abac9ee83a`
- Owner/agent: `aporu`

## Summary

- Add authenticated server-backed search to the assignment content picker so records beyond the 300-item preload remain selectable.
- Guarantee exact content-name matches are included and ranked above related matches, including the canonical Vrindavan place.

## Verification

- `npm run dev:check`: passed
- Live browser check: not run because Docker Desktop was unavailable for the local PostgreSQL development environment

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none

## Risk And Conflicts

- Shared areas touched: `components/ui/searchable-select.tsx`, admin assignment dashboard, new admin assignment-target search API
- Expected conflicts: possible overlap with branches changing the shared searchable selector or `app/admin/work/page.tsx`
- Rollback notes: revert `89e33a0` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
