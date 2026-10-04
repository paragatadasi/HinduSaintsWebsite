# Museum data integration: status and remaining work

Status recorded October 3, 2026. This is the data workstream record; release handoffs and the release captain establish production deployment status. The UX workstream owns the curator screens and museum-specific working proposal editor.

## Completed checkpoints

- Website PostgreSQL/Prisma records remain the canonical saint identities. Airtable is mirrored import/reference evidence, not the public website source of truth.
- SPN source refresh, clear saint-location matching and uncertain identity review are available through the main admin Source Data workflow. Reviewed identities and physical placements survive later refreshes; conflicting changes go to review.
- SPN curator pilot was checked by the user: Vishnudas location was correct; the old Visnudas website spelling was reported separately. Other representative cards were as expected. This does not establish that every museum record has been physically verified.
- Museum-scoped relic/location contracts support multiple museums. SPN and Vrindavan inventory are kept separate from shared saint identity, biography, lineage and geography.
- Visit-place research proposals have review and acceptance workflows. Acceptance can promote the visit locality to the website primary place, retaining other associations. Confidence filtering and tertiary geographic proposal propagation were prepared in their respective releases. Existing reviewed content is not silently replaced by source refresh.
- Vrindavan workbook evidence is preserved privately, including quantities, packaging, display, shelf/position, source place and notes. The original inventory has 449 review rows and 437 distinct named labels. Labels are not verified unique people or objects.
- The user confirmed 278 clear Vrindavan identity links in production. These link source observations to website saints; they do not publish drafts, create objects or verify placements. The remaining 171 rows from that audit are deferred, and current counts may change with website duplicate cleanup.
- The confirmed-inventory reader supports the Vrindavan pilot without another upload. Each entry represents one source row, potentially several objects; quantity and position remain text. Archived or unavailable targets are preserved as warnings.
- Read-only Vrindavan section proposals inherit SPN spiritual-region proposals with their provenance. They do not copy accepted SPN museum assignments or physical locations. The UX workstream is extending museum-scoped editing/status/display-group controls separately.
- An Excel shortlist of 84 published saints and 87 related inventory rows was delivered at the user's explicit request using the workspace database baseline. Its latest saint update was July 25, 2026. It includes biography URLs and highlight/notes columns. It is not asserted to be the exact published subset of the current 278 confirmations. Private workbooks and source data are not committed to Git.

## Approved corrections prepared for production application

Branch `codex/reviewed-museum-corrections`, handoff commit `ebd5e44`, was pushed ready to the release captain. Check its handoff/release status before using the production routes.

| Saint | Approved action |
| --- | --- |
| Haridas Thakur | Preserve legitimate multiple places; Gaudiya Vaishnava proposal takes precedence over geographic inference. |
| Madhu Pandit Goswami | Website primary locality Vrindavan; associate Vamshi Vat. Retain Jaipur with deity-current-residence context, not lived-place interpretation. Use Gaudiya Vaishnava proposal. |
| Somappar Swami | Preserve Madurai / Thiruparankundram. Record workbook Mayapur as erroneous source geography; preserve its raw value. |

The explicit, audited, repeat-safe apply operation is at `/admin/source-data/museum/reviewed-corrections`. Deployment alone does not apply it. An authenticated editor with reconciliation, structured editing and full-catalogue capabilities clicks Apply approved corrections once. The agent has not confirmed production execution. Canonical identity or ambiguous locality failures abort the entire transaction. Repeat execution preserves later human edits.

No historical relationships, accepted museum assignments, physical objects or placements are changed by this batch. Proposed Gaudiya overrides are persisted as reviewed decisions. The raw Mayapur value remains evidence, not authoritative geography.

## Inventory readiness checkpoint

`readVrindavanInventoryReadiness` supplies a private read-only report over the selected confirmed snapshot. `/admin/source-data/museum/vrindavan/inventory-audit` downloads it; optional `snapshot` is the original SHA-256. Both museum and full-catalogue access are required. Responses are private, uncached and noindexed.

The report preserves every source inventory field and adds review reasons for missing physical object identity, missing description, quantity interpretation, missing source display/position, unavailable or multiple saint associations, and source notes/warnings. A positive integer text quantity does not identify that many individual objects. No numeric coercion of ranges, compound quantities or shelf labels occurs. Every row remains unverified for physical placement by this source-only reader, including rows already linked to an item.

Applied geography decisions appear beside the original place text. Exact normalized erroneous-place matches are excluded separately for each linked saint; another saint in a combined row is not automatically excluded. This does not write website places or museum proposals. Section-audit consumers must also honor the approved geography registry before deriving geographic section candidates; that follow-through remains a separate checkpoint.

## Remaining sequence and ownership

1. Release and apply the approved three-saint correction batch. Release captain deploys; authenticated editor executes the approved one-time operation. Confirm resulting public Madhu locality and the inherited proposals.
2. UX agent completes independent Vrindavan section/status/display-membership editing with shared components. Data decisions and spiritual regions remain shared; operational proposals and implementation state are museum-scoped. Inventory gaps must stay explicit when curators record implementation.
3. Release inventory readiness report and connect it to the UX review surface. Consume reviewed geography exclusions in section comparisons so erroneous source values do not produce misleading adjustment suggestions.
4. Review individual objects behind confirmed inventory rows: decide splits for combined relic descriptions, quantities, packaging and photograph-only evidence; reconcile movement comments; assign stable object identities. Curator decisions are required before object creation. Source row numbers or name-plus-vitrine are not permanent object IDs.
5. Introduce object-level Vrindavan inventory only after those decisions. Record current placement from verified museum evidence, keep placement history, and retain immutable import provenance. Idempotent updates must preserve curator edits and surface conflicts.
6. Return to uncertain identity rows in the existing review workflow. Batch clear decisions; review competing candidates, unavailable links and combined-person rows individually. Do not automatically create/merge saints or publish drafts. Re-audit after duplicate-draft cleanup by the other workstream.
7. Test ongoing maintenance with new saints separately, as deferred by the user. Existing Airtable refresh may create website drafts; museum identity/placement matching remains a distinct review. A new source file requires cross-snapshot reconciliation, not automatic duplicate inventory creation.
8. Later spatial planning and QR label production follow curator pilot feedback. The delivered shortlist can be marked Yes/Maybe/No; validate final live biography URLs before printing selected codes.

## Deployment discipline

Each checkpoint is a scoped feature branch with tests appropriate to its data contract, `dev:check`, and a committed ready release handoff. New protected routes receive a production build check. No production database migration runs during a web build. The release captain integrates into main/deploy and reports completion directly to this chat. Feature branches do not merge directly into main/deploy.

See [museum-data-integration.md](museum-data-integration.md) for implementation contracts, source review semantics and earlier checkpoints. See branch handoffs under `docs/release-handoffs/` for verification and release inputs.

## Remaining identity reconciliation: next checkpoint

The remaining-row phase now starts from current production decisions and current website names/aliases, not the July workspace catalogue. Source Data > Museum updates > Vrindavan saint matching offers named review batches: clear current matches, one-candidate name/title variants, competing website identities, combined-person rows, unmatched named rows, unnamed rows, and inventory-linked rows. Pending and deferred are available together. Only existing pending clear matches use the established bulk confirmation operation; no uncertain batch is linked automatically.

The protected Download current identity review (JSON) action at `/admin/source-data/museum/vrindavan/review-export` supplies `vrindavan-remaining-identity-review.json`: selected snapshot, current counts, review batches, source relic/place/location notes, candidate identities, repeated-name evidence including already-linked rows, unavailable confirmed-link alerts, and current website catalogue aliases. The download excludes raw contact fields and is uncached/noindexed. It is research input, not an import or approval file. Before any decision, the existing server action rechecks the current review version and available saint identities.

Latest observations supersede older observations of the same source row; snapshots remain separate. Confirmed decisions are never rewritten by grouping/export, including unavailable targets. Duplicate-draft cleanup can change candidates and counts, so 171 is the historical pending-row count, not a hardcoded target or number of saints. The agent's configured database was rechecked October 3 and still had July 25 data; the agent browser was not signed into production. A protected production export is needed to prepare exact live reconciliation recommendations. The release captain has been asked whether an established private read-only export route is available.

Broader geography research is assigned by the user to a separate research chat. The user's successful unrelated acceptance test confirms that workflow but does not establish that the three-saint reviewed correction batch was applied. Physical multi-location/duplicate questions remain in the delivered curator workbook; identity review does not settle current physical placements.

## Preserved family-tree connection reconciliation (October 4)

Citra's live Gaudiya Math screenshot had 16 nodes but one canonical connection, while the preserved export contains 18 distinct connections. Repository source evidence covers 252 family member rows and 189 distinct linked claims (167 guru, 10 partner, 12 incarnation). These are export counts, not confirmed production import totals. SVG/source-reference rendering remains separate from canonical data.

Source Data > Museum source updates > Reconcile preserved family-tree connections (`/admin/source-data/museum/family-connections`) compares the preserved member linked fields against current website identities and relationships. Explicit import requires run-imports, reconciliation and full-catalogue capabilities, confirmation and the current preview version. Uniquely mapped missing connections create private `needs_review`/`imported`/medium-confidence relationships with immutable raw member snapshot and linked-field evidence, relationship provenance and audit. This is not independent historical research or public publication. Canonical guru direction remains disciple to teacher; reciprocal fields and multiple source rows sharing canonical endpoints produce one relationship.

Equivalent canonical relationships preserve their review state. Archived equivalent connections, same-person endpoints, conflicting pair decisions and guru cycles are not restored/overwritten; unresolved identities remain unresolved. Those blocks become idempotent reconciliation issues after explicit application. Any endpoint mapping or canonical relationship edit since preview aborts the whole batch. Repeated application does not create duplicate relationships or reopen resolved issues. No saints, aliases, families, source Airtable rows, geography or physical inventory are modified. No schema migration or environment change.

Protected rendering is read-only. Production data has not been updated merely by releasing this code: apply the operation in the authenticated production admin and record its counts. This chat cannot apply via its unsigned production browser; the configured workspace catalogue is older than production. Connections become available to both museum live readers when pending relationships are included.

Verification: domain invariants plus guarded disposable-local-PostgreSQL application test cover reciprocal direction, deduplication, ambiguous/archived identities, self links, cyclic proposals, stale preview rejection, provenance, audit and preservation of curator rejection. Run `MUSEUM_RECONCILIATION_TEST_DATABASE_URL` against localhost database `museum_integration_test` with `scripts/verify-family-tree-reconciliation.ts`; it refuses other database targets.
