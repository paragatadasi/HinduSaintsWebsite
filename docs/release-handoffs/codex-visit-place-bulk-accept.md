# Release Handoff: codex/visit-place-bulk-accept

- Status: ready
- Branch: `codex/visit-place-bulk-accept`
- Commit: `4e7e630017bea38eb2d3dea5c7d74b1fa02945cb`
- Owner/agent: museum/data integration, chat `01a0f25f-fc6a-7fd2-a3f8-cd78f289cc5e`
- Bundle priority: immediate release candidate

## Summary

- Confidence-filtered bulk visit-place acceptance with explicit selection and current-primary → proposed-locality preview, independent of list pagination. Approval notes are optional; publication permission and explicit confirmation are required.
- Accepted visit destination facts have a distinct canonical SaintVisitPlace model and public-safe shared saint-template section. Raw research, evidence notes and coordinates remain private. Draft saints remain unpublished.
- Primary locality changes are checked by default, audited and atomic. Unique compatible locality records are reused; previous primary links become associated. Other links and shared Place content/coordinates are preserved. Archived/ambiguous localities and previously private Place editorial content are protected.
- Accepted primary geography propagates to tertiary museum section proposals (e.g. Vrindavan → Braj & Krishna Bhakti), with the same projection used in section screens and the curator's confirmation service. Confirmed placements, higher tiers and manual family moves are protected. Unknown geography is flagged for section review. Relic locations and Airtable remain unchanged.

## Verification

- `npm run dev:check`: passed.
- `npm test`: 238 passed, 1 skipped, 0 failed.
- Final `npm run codex:verify`: passed.
- `npm run prepare:deployment`: passed.
- `git diff --check`: passed.
- Disposable PostgreSQL-compatible PGlite database: all repository migrations applied; acceptance integration passed atomic/stale preview protection, canonical association preservation, reuse without duplicate links, optional primary change, private/archived/ambiguous place blocking, idempotence, later-source conflict protection, public-contract privacy, draft status preservation, tertiary proposal consistency and actual curator confirmation.
- Actual private 214-row bundle: 155 high-confidence proposals previewed; 154 accepted in the disposable fixture; 1 known Pushpa memorial/burial conflict blocked. All resulting primary locality links verified; medium/low rows untouched and replay preserved decisions (about 19 seconds). No production records were accepted or modified.
- Local production HTTP role checks: Data Admin allowed; anonymous, contributor, curator and editor denied access to this Source Data acceptance route.
- Local browser: confidence-filtered batch, Select all eligible, clear/individual selection, optional note and actual acceptance confirmed. Shared public saint page showed the accepted destination and locality. Screenshots remain private outside the repository.
- PGlite is not a concurrent multi-session PostgreSQL stress test.

## Deploy Notes

- Migrations: `20261002210000_accepted_visit_places`, additive empty canonical destination table with foreign keys and indexes. Run during the deployment migration phase.
- Environment variables: none.
- Dependencies: none.
- Data/backfill/release steps: no automatic acceptance/backfill and no re-upload required. Existing 214 staging rows remain available. After deployment, a Data Admin/Site Admin filters confidence, opens Review acceptance batch, selects proposals and confirms desired primary-locality changes.
- Pilot: select a small supported batch; verify saint-card primary locality, public Places to visit and unconfirmed tertiary museum section proposals. Known Pushpa wording conflict remains blocked until edited. The caller requested direct deployment-completion notification so work can proceed.
- Queue/deploy trigger: ready now under standing user authorization.

## Risk And Conflicts

- Shared areas touched: Prisma schema/migration, public saint contract/adapter/shared template, visit research routes/service and museum family/direct proposal projections.
- Expected conflicts: coordinate with any concurrent schema, saint-template or museum-proposal changes; no direct main/deploy integration by this feature agent.
- Publication is explicit reviewer acceptance; confidence is the researcher's assessment, not independent verification. Coordinates/directions, removal of disproved historical associations and accepted-destination correction editing remain follow-up work. Existing Saint CMS can edit primary/other Place associations.
- Rollback notes: additive schema can remain after code rollback. Accepted data persists; primary changes have full before/after audit and preserve former primary associations. Any data correction should be targeted and audited; do not bulk delete research or overwrite shared places.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
- Please message chat `01a0f25f-fc6a-7fd2-a3f8-cd78f289cc5e` directly after verified production success or any blocker.
