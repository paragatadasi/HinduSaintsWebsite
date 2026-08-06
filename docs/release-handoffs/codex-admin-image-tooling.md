# Release Handoff: codex/admin-image-tooling

- Status: ready
- Branch: `codex/admin-image-tooling`
- Commit: `429219256511ba3ff12c42338574ec1382bb85ad`
- Owner/agent: `aporu`

## Summary

- Adds tokenized compact dimensions for admin focal-point and crop editors instead of page-width image canvases.
- Adds a shared native-dialog image editor for synchronized large homepage/directory editing and full-size Saints/Traditions inspection.
- Adds labeled range controls and arrow-key focal positioning so pointer gestures are no longer the only adjustment method.
- Keeps Site uploader metadata collapsed until a file is selected, reducing default density across homepage, directory, and About image slots.
- Documents the compact-image and keyboard-parity contract in the design system.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed (100 tests, including focal-position and crop-mapping coverage)
- `npm run codex:verify`: compiled, type-checked, collected page data, and generated all 15 static pages; nonzero only at the known Windows junction `EPERM` during standalone trace copying
- `npm run prepare:deployment`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none

## Risk And Conflicts

- Shared areas touched: Site image controls, Saint and Tradition image actions, `components/admin`, `styles/tokens.css`, `styles/globals.css`, design/admin-overhaul documentation
- Expected conflicts: possible if another branch changed the same image editors/actions or nearby shared style/token sections
- Rollback notes: revert `4292192` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
