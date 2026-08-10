# Release Handoff: codex/fix-saints-public-tab

- Status: ready
- Branch: `codex/fix-saints-public-tab`
- Commit: `38ba1f478befc16199d51078802fd4b4f906f9a0`
- Owner/agent: `aporu`
- Bundle priority: immediate release candidate

## Summary

- Keep Site Admins in the Public saint queue by carrying an explicit catalog scope through tabs, filters, searches, and return links.
- Replace the wide saint queue filter panels with compact auto-applying dropdowns; use Team visibility on Full Catalog while retaining workflow status on Public.
- Strip view-specific filters when switching catalog tabs so workflow never leaks into Full Catalog and visibility never leaks into Public.

## Verification

- `npm run dev:check`: passed
- `tsx --test lib/admin-saint-access.test.ts lib/admin-saint-queue.test.ts`: passed (7/7)
- `npm test`: 140 tests passed; the unrelated `lib/social-metadata.test.ts` process could not load a missing AWS package from the shared workspace dependency folder
- `git diff --check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: `app/admin/saints/page.tsx`, reusable admin queue dropdown component, saint queue URL helper
- Expected conflicts: none
- Rollback notes: revert `38ba1f4` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
