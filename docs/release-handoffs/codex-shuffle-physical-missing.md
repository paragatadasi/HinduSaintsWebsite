# Release Handoff: codex/shuffle-physical-missing

- Status: ready
- Branch: `codex/shuffle-physical-missing`
- Commit: `00243bd56eca1b1690321c2128badf99331882fe`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Shuffle confirmations save exact physical locations; checklist reopening does not undo inventory.
- Southern island missing board shows saint/relic photos and partial-set missing notes, excluding preliminary resolutions.

## Verification

- dev:check passed; 10 focused tests passed; authenticated PostgreSQL 16 HTTP concurrency/atomicity/idempotency checks passed by Nadi; browser confirmation and note rendering checked; codex:verify exit 0 with pre-existing CSS warnings and Windows junction standalone-copy warning. Release captain must verify using real node_modules.

## Deploy Notes

- Migrations: 20261112150000_shuffle_placement_receipts; additive nullable receipt/fingerprint columns; run during release.
- Environment variables: Uses existing AIRTABLE_ACCESS_TOKEN or AIRTABLE_PAT and AIRTABLE_BASE_ID for private relic-photo refresh. No new variables. Photo fallback shown if unavailable.
- Data/backfill/release steps: 45 holdings across 33 mapped transfer actions; existing checks are not backfilled as moves. Both Prasad Raju entries included by curator decision; verification note retained. Cabinet switch remains checklist-only. No production writes performed.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Shuffle API/hook, Prisma schema, shared CSS, museum design guidance.
- Expected conflicts: none
- Rollback notes: revert `00243bd` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending

- Photo verification: exact-source/attachment and host restrictions tested; production Airtable photo access not exercised. Check one live missing-board relic photo after release. Private endpoints retain museum authorization and no-store responses.
- Missing-board scope: current V51–62; staged/unknown locations fall back to effective proposal then original location. Flags remain open when moves are saved. Existing duplicate-review exclusion retained.
- Learning review: existing museum evidence and concurrency rules cover this workflow; no reusable skill changes needed. Design contract updated in the repository.
