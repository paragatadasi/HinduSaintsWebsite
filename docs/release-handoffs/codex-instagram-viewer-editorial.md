# Release Handoff: codex/instagram-viewer-editorial

- Status: ready
- Branch: `codex/instagram-viewer-editorial`
- Commit: `f1fd3f465ba696fb0563fddc11cd1a479cc3a840`
- Owner/agent: `aporu`

## Summary

- Restyle the Instagram carousel viewer as a quieter, wider editorial gallery using shared theme tokens.
- Keep the thumbnail filmstrip aligned beneath the primary image while the caption rail extends to the bottom with anchored metadata actions.

## Verification

- `npm run dev:check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none

## Risk And Conflicts

- Shared areas touched: `styles/tokens.css`, Instagram viewer rules in `styles/globals.css`
- Expected conflicts: possible CSS/token conflicts with other public-style branches touching the same shared files
- Rollback notes: revert `f1fd3f4` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
