# Release Handoff: codex/spn-optional-contents-staging

- Status: ready
- Branch: `codex/spn-optional-contents-staging`
- Commit: `a28f8b64207d9a7a5ae0915ca8be93809c2ff60a`
- Owner/agent: `aporu`
- Bundle priority: immediate release candidate

## Summary

- Add curator-only selected-origin staging and preparation-linked historical recovery, preserving confirmed placements and all housing/item/identity restrictions. Add complete read-only preparation/physical-history audit and optional clearing metadata for seven existing cases.

## Verification

- `npm run dev:check`: passed
- 41 focused contents/history/component/role/preparation/V1/V45 tests: passed
- `npm run prepare:deployment`: passed
- Production build: Citra owns the integrated UI/backend production gate; no standalone build claimed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none automatic. After deployment, use GET /api/admin/museum-historical-staging?mode=audit, recheck previews/current revisions and obtain targeted curator confirmation before historical writes.
- Queue/deploy trigger: ready with the combined Citra interface.
- Preliminary private audit: 23 source residuals across V1 (8), V4 (1), V45 (14). Availability does not prove they are staged. Citra has asked for targeted confirmation; no retrospective writes have occurred. Confirmed target placements must remain protected.
- Optional cases: 1,4,11,23,36,45,73; held68 excluded. New/empty receiving cases are unchanged.

## Risk And Conflicts

- Shared areas touched: historical-staging HTTP, physical-location confirmation, assistant envelope, shared guide type and seven optional-case metadata; new domain/service/tests and contract documentation.
- Bundle with Citra codex/vitrine-clearing-recovery interface. Do not release the UI or backend alone. Required whole-case clearing and dedicated component clearance contracts remain unchanged.
- Rollback notes: revert `a28f8b6` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
