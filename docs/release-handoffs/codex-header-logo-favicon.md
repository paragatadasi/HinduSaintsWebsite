# Release Handoff: codex/header-logo-favicon

- Status: ready
- Branch: `codex/header-logo-favicon`
- Commit: `7a51b8cb9aee9e56dbfc9452709bd881a84cd13b`
- Owner/agent: `aporu`

## Summary

- Add a 64x64 favicon downscaled from the logo used in the public site header.
- Preserve the original gold artwork and dark blue fill inside the lotus while making the area outside the petals transparent.
- Use the Next.js App Router `app/icon.png` convention so the favicon is discovered automatically.

## Verification

- `npm run dev:check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none

## Risk And Conflicts

- Shared areas touched: root App Router metadata asset (`app/icon.png`)
- Expected conflicts: none
- Rollback notes: revert `9a2526e` and `7a51b8c`, plus any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
