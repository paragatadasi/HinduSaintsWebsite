# Release Handoff: codex/biography-carousel-reference

- Status: queued
- Branch: `codex/biography-carousel-reference`
- Commit: `28d79e0111098e1414dcbdbac9c35e8503a738ec`
- Owner/agent: `Save imported carousel text`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Preserve imported carousel biography text as a saved read-only reference in the biography editor; reuse the saved transcription on later imports.

## Verification

- npm run dev:check: passed; npm run codex:verify: passed with existing stylesheet warnings. No database integration or browser verification performed.

## Deploy Notes

- Migrations: 20261014120000_instagram_biography_reference adds nullable biographySlidesText and biographySlidesCount to InstagramItem. Run in deployment migration phase before starting the updated app.
- Environment variables: none
- Data/backfill/release steps: No backfill required. Previously imported carousel text must be imported once to save its reference. Migration not applied locally or in production.
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: Prisma InstagramItem model, saint admin biography editor/actions, authenticated Instagram biography import API, shared reference persistence helper.
- Expected conflicts: none
- Rollback notes: revert `28d79e0` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
