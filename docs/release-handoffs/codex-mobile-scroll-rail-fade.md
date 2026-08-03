# Release Handoff: codex/mobile-scroll-rail-fade

- Status: ready
- Branch: `codex/mobile-scroll-rail-fade`
- Commit: `9779486cab070b7efae2d6d99303ef1883bb33d0`
- Owner/agent: `aporu`

## Summary

- Remove the saint-profile mobile padding override that shifted related-saints rails away from the shared zero-leading-inset contract.
- Prevent iOS and Android browsers from activating the previous control and left-edge fade at the rail's initial position.

## Verification

- `npm run dev:check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none

## Risk And Conflicts

- Shared areas touched: `styles/globals.css` mobile saint-profile and scroll-rail layout
- Expected conflicts: low; possible line-level conflict with branches editing the same mobile saint-profile block
- Rollback notes: revert `9779486` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
