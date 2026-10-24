# Release Handoff: codex/spn-tier-review-audit

- Status: ready
- Branch: `codex/spn-tier-review-audit`
- Commit: `2fd9fe2703f8b0f3318fb2d966d8ba24263a71d1`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Add a protected, read-only SPN tier review snapshot and Source Data download page.
- Separate canonical IDs, source observations, unlinked/unplaced records, baseline/effective tiers, published biographies, curator decisions and saved arrangements. No tier application is included.

## Verification

- `npm run dev:check`: passed
- Four tier-audit domain tests: passed.
- `scripts/verify-spn-tier-audit.ts` against disposable localhost PostgreSQL-compatible database: passed real reader coverage, private biography filtering, same-name separation and no-write checks.
- `npm run codex:verify`: passed final full build; existing CSS/autoprefixer warnings only.
- `npm run prepare:deployment`: passed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: no automatic writes. After actual runtime promotion, Nadi will download the snapshot through the signed-in admin UI; supported tier application remains a separate guarded checkpoint.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: one navigation link in `app/admin/source-data/museum/page.tsx`; new isolated audit routes/modules/docs/tests.
- Expected conflicts: possible adjacent Source Data links from other branches; preserve both. No schema/auth-policy/dependency changes.
- Rollback notes: revert `2fd9fe2` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending

Runtime check: signed-in `/admin/source-data/museum/tier-review` must show
"Download SPN tier snapshot". The export route requires museum, Source Data and
full-catalogue access, and returns a private no-store attachment. Please notify
Nadi directly when actual runtime promotion is confirmed. A successful dispatch
alone is insufficient to capture current production data.
