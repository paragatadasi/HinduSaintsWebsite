# Release Handoff: codex/saint-biography-reading

- Status: queued
- Branch: `codex/saint-biography-reading`
- Commit: `9c0f934f436f3651ec78733cb5ee9fea34a4eb0a`
- Owner/agent: `/root`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Restores the shared compact review-row inset when role permissions omit the bulk-selection checkbox column.
- Standardizes single-select chevrons, arrow spacing, text clearance, and forced-colors fallback across catalog, admin review, editor, and museum surfaces.
- Refreshes the spacing-only queue onto `main` commit `84aa950`; previously bundled biography, feedback, Instagram, and task-status work is not duplicated.

## Verification

- `prisma generate`: passed.
- `node node_modules/typescript/bin/tsc --noEmit`: passed.
- `git diff --check origin/main...HEAD`: passed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: `styles/globals.css`, `styles/tokens.css`
- Expected conflicts: possible conflicts with branches modifying shared select-control or compact review-row styles; known conflict with current `main` was resolved by retaining its admin-field fallback colors while changing the shorthand to `background-color`.
- Rollback notes: revert `9c0f934` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
