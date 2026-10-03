# Release Handoff: codex/vrindavan-website-matching

- Status: `ready`
- Branch: `codex/vrindavan-website-matching`
- Commit: `523099fc40d181b555bc1e1ff51b116cedcadfd4`
- Owner/agent: Museum Data Integration
- Bundle priority: immediate release candidate

## Summary

- Source Data > Museum updates > Vrindavan saint matching stages the private workbook evidence and matches inventory rows directly to canonical website saints and aliases, including drafts.
- Snapshot/status/confidence/search filters, explicit clear-match batch confirmation, and individual uncertain/multiple-saint links or deferral. Reviewed decisions are preserved and preview tokens reject stale website identities or duplicate targets atomically.
- This checkpoint creates no saints, physical collection items, vitrines or placements; does not publish or merge saints; does not write Airtable or change saint places/SPN data.

## Verification

- npm run dev:check and npm run prepare:deployment: passed.
- npm test with disposable local DATABASE_URL: 247 passed, 1 skipped, 0 failed.
- npm run codex:verify: passed; npm run build after final shared form styling: passed.
- scripts/verify-vrindavan-identity-review.ts against disposable local museum_integration_test: passed replay preservation, duplicate/stale batch rejection, confirmation, draft non-publication, manual linking and deferral. Private actual workbook snapshot staged 449 rows and replay preserved them.
- Browser pilot on the compiled local app: clear-match confirmation saved, confidence filter returned ambiguous candidates, final layout inspected. Anonymous/contributor/curator/editor protected; data_admin allowed and pages noindexed. No production mutations.

## Deploy Notes

- Migrations: none; existing MuseumCollectionImport and ExternalRecord models, existing museum-vrindavan seed.
- Environment variables/dependencies: none.
- Data/backfill/release steps: none during release. After deployment, an authorized admin uploads the prepared private Vrindavan inventory review.json in the new screen. Dataset is not committed to Git. Suggestions recalculate against production; local baseline counts are not production audit results.
- Queue/deploy trigger: ready now under standing user authorization.

## Risk And Conflicts

- Shared areas touched: museum source-data landing page; generic batch-review selection promoted from visit-place acceptance while preserving its API; museum integration documentation. Isolated Vrindavan routes/domain/service.
- Possible overlap: museum-data-integration.md appended documentation and Source Data landing link. Coordinate with ongoing Airtable duplicate cleanup; multiple candidate IDs always block bulk matching, even with an exact name candidate.
- Rollback: standard code rollback; preserved source snapshots and identity decisions are additive/private and create no physical inventory.
- Remaining checkpoint: corrections to confirmed identity links, cross-snapshot reconciliation, stable physical inventory IDs, movement/photo discrepancy review and actual relic/location import. Different workbook snapshots intentionally remain separate.

## Release Captain Notes

- Please notify Museum Data Integration directly when deployment completes (thread 01a0f25f-fc6a-7fd2-a3f8-cd78f289cc5e), per user request.
- Integrated into main: pending
- Pushed to main: no
- Merged to deploy: pending
- Production workflow: pending