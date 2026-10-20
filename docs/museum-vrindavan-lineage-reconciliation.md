# Vrindavan lineage-first section reconciliation

**Superseding clarification, 20 October 2026:** Region > existing named subsection > reviewed display family > saints. The v2 replacement writer described below is retired and rejected on the server. Current subsection assignments are not replaced by regional names. Navigation groups existing subsection URLs/counts beneath six regional parents, with optional supplementary context and regional totals. `data/museum/vrindavan-region-parent-plan.json` preserves Saarthi’s v3 clarification. Old region-only snapshots are retained as evidence but no longer projected by the working reader. The preview/export reports `applyEnabled=false`, retains `afterSection=beforeSection` and exposes `proposedRegionalParent` for research. It must not be treated as an approved section-move batch. Existing family anchor review does not approve individual membership or context repairs.

The 133 authorized identity links were separately saved and verified: 413 linked source rows, 400 unique saints, 36 held, zero link alerts. A fresh export verified every saved target and the exact held set. No section batch was applied. Holds include suggested Kriya-family Hanuman Das membership, incorrect inherited Andhra context for Rishikesh Chidananda, and missing inherited context for published Narayan Maharaj/Kuladananda. These require explicit separate review; do not revert correct canonical identities to recover duplicate-draft context.

## Historical v2 implementation (superseded where noted)

Implementation checkpoint: 20 October 2026. This documents deployable code, not a claim that production proposals have already been applied.

## Policy and preserved data

The agreed v2 source is `data/museum/vrindavan-lineage-first-plan.json`, including the original file SHA-256. The v2 lineage-first decision order supersedes the old book-first proposal. Book references are supporting context, never proof of holdings or family membership.

Six ordered roots: Himalaya & the North; Sikh Gurus & Udasin; Braj & the Ganga; Bengal, Odisha & the East; Maharashtra & the West; The South. Bhakti Marga & Global Context is conditional on confirmed relevant holdings, outside the six. Existing subgroup labels, family keys, tiers and stable `vrindavan:<saintId>` placement IDs are preserved. Earlier section URLs remain navigable, including zero-member sections. Protected or unresolved legacy proposals stay visible for review. SPN retains its own vocabulary.

An explicitly reviewed family anchor takes precedence over regional defaults and must match the family's complete current canonical membership. Missing, changed or conflicting membership holds the family from automatic partial moves. Canonical graph membership and shared traditions are not evidence of reviewed display membership. Explicit Vrindavan curator proposals always win. Geographic fallback exists in the pure policy only for ungrouped saints; the current adapter deliberately does not populate that fallback automatically.

## Protected review workflow

- `/admin/source-data/museum/vrindavan/sections`: fresh before/after preview, unique canonical counts, result/name filters, exact existing-family anchor review and explicit bulk apply.
- `/admin/source-data/museum/vrindavan/sections/export`: private no-store JSON, including changed/unchanged/protected/conflicting/unassigned counts, pending source rows excluded, exact family membership and revision.
- `/admin/source-data/museum/vrindavan/current-state`: private no-store proposals/families export. Distinguishes curator overrides, inherited subgroup suggestions, canonical graph membership and exact saved arrangements.

Bulk apply affects all eligible changed proposals across the complete review, independently of display filters. Capability checks, explicit confirmation and complete current-state revision validation run server-side. The existing museum curator advisory lock and a serializable transaction prevent partial batch updates. A stale review is rejected. Repeating an unchanged review produces zero further writes.

Applied snapshots use `ExternalRecord.sourceType=vrindavan_lineage_proposal`; reviewed exact family bindings use `vrindavan_lineage_family_anchor`. Both retain provenance and generate audit events. No schema migration is required. Later human curator overrides supersede automatic snapshots. Membership changes require fresh anchor review.

No SPN proposals, saint identities/publication, website geography, raw source observations, physical relic records or raw saved arrangements are written. Exact Planned/Implemented destinations survive regrouping. Changed proposal revisions expose `MuseumSaintPlacement.arrangementNeedsReview=true`, retaining status/vitrine/shelf; reconfirmation against the new revision clears the flag. Legacy planner area records remain evidence rather than being silently remapped.

## Release and live application

1. Release the code; verify actual private deployment completion and live routes. Public dispatch success alone is insufficient.
2. Export fresh current proposals/families to Saarthi, who will bind the agreed family rules to exact existing keys/members and inspect family splits.
3. Confirm applicable family anchors and inspect the refreshed full before/after preview. Hold unresolved or protected conflicts.
4. Apply eligible proposals, export resulting data and report concrete current coverage counts. No production counts should be inferred from an old local database or raw source-row counts.
5. Newly reconciled identities can join through the same workflow later; physical placement and uncertain identity research remain separate.

## Verification

`npm run dev:check`; policy/navigation/working-domain tests; `npm run codex:verify` for protected routes. The guarded `scripts/verify-vrindavan-lineage.ts` requires `MUSEUM_LINEAGE_TEST_DATABASE_URL` and refuses targets other than a local `/museum_integration_test` database. It verifies actual atomic writes, stale revision rejection, exact family anchors, idempotence, later curator edits, preserved exact destinations and unchanged identities/geography/SPN/physical records against a disposable database.

## Parallel identity research checkpoint

Saarthi owns research and direct clarifying questions for 132 unresolved source rows. They are separate from 39 previously approved straightforward decisions: two saved live and 37 awaiting verified identity form rollout at the last checkpoint. Saarthi additionally relayed Paragata's direct confirmation that source rows 113 and 267 both represent the Braj poet, published Sri Surdasji (`cms0w7dmj01tf07qiin8e9ha3`). These are approved identity recommendations awaiting a protected current-version save; both observations and their objects/locations must remain separate. Research recommendations do not themselves authorize database merges or physical changes.
