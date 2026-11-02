# Release Handoff: codex/search-staging

- Status: ready
- Branch: `codex/search-staging`
- Commit: `50b231ddf4e9f297cd5656b3c94cd6a3d85c0468`
- Owner/agent: `aporu`
- Bundle priority: immediate release candidate

## Summary

- Add Move to staging to museum search results using the existing version-checked physical-location save. Preserve proposed destinations and separately housed components. Show confirmation and inline save errors.

## Verification

- `npm run dev:check`: passed
- Component-clearance and physical-progress targeted tests: 17 passed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready now; user explicitly approved branch push and Mira deployment handoff on 2 November 2026.

## Risk And Conflicts

- Shared areas touched: museum-companion-search.tsx and spn-room-move-companion.tsx
- Expected conflicts: inspect concurrent companion UI changes when integrating.
- Rollback notes: revert `50b231d` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending


