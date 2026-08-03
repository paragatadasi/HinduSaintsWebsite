# Release Handoff: codex/preserve-partial-card-rows

- Status: ready
- Branch: `codex/preserve-partial-card-rows`
- Commit: `ab4ee5131e1090545ec6359dfe701c73cf0a1f1a`
- Owner/agent: `aporu`

## Summary

- Preserve full-row card sizing when shared public card grids contain only a partial row, preventing lone saint cards from stretching across tradition pages.
- Size the Saints catalog from a `20rem` minimum card width so full rows fill naturally, partial rows remain stable, and the encounter CTA stays on one line.
- Cap the shared design canvas at `1920px` so browser zoom-out scales the page into a narrower centered composition with stable proportions rather than widening the responsive layout indefinitely.

## Verification

- `npm run dev:check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none

## Risk And Conflicts

- Shared areas touched: `styles/globals.css` shared page/card layouts and `styles/tokens.css` public width tokens
- Expected conflicts: possible if another branch changes `.page-shell`, `.card-grid`, `.saints-index .card-grid`, or related width tokens
- Rollback notes: revert `5cb4bab`, `6e2c156`, and `6a82601` plus any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
