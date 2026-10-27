# Release Handoff: codex/museum-stacked-intake

- Status: ready
- Branch: `codex/museum-stacked-intake`
- Commit: `ec2c37a7cebb41fce732b8b768e5e825c4ec1601`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Faithful stacked saint-and-multiple-relic intake; optional shared bio and scoped documents; Cream/Dark appearance; My entries corrections and role-aware submission.

## Verification

- codex:verify PASS; dev:check PASS; design inventory/check PASS;11 unit tests PASS; fresh localhost migration/persistence PASS; assistant2relicphoto submission and correction/resubmit browser PASS; curator queue and own scope PASS; cream/dark and390px viewport checked. Physical camera not tested. Local Windows dev preloaded sharp to avoid existing duplicateDLL issue.

## Deploy Notes

- Migrations: 20261027200000_museum_multi_relic_intake: release migration phase required; lossless legacy child and approval backfill.
- Environment variables: No changes. Airtable and website delivery adapters remain disabled. Existing public media storage remains.
- Data/backfill/release steps: Preserves IDs, photos, approval snapshots and delivery receipts. Omitted children/media archive. No operational production records edited.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Admin underline tabs; styles/tokens.css and globals.css; token inventory; intake API/schema/service.
- Expected conflicts: Regenerate inventory after other token merges. Includes Nadi835e777 and tabs a81e734.
- Rollback notes: revert `ec2c37a` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
