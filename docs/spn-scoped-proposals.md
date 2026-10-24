# SPN reviewed proposals

The main admin review route is `/admin/source-data/museum/spn-proposals?saintId=<website-record-id>`. It confirms a researched SPN section, display tier and existing display family. Source-data and full-catalog access are required, together with museum management permission to save.

Decisions are append-only `AuditEvent` records with action `museum.spn_proposal.saved`. Each retains the reviewer, reason, previous effective proposal, canonical identity, original placement ID, target section/tier/family and a baseline revision. This is a museum decision, not a historical relationship, website geography edit, profile publication or physical move confirmation.

The SPN reader applies decisions after family reconciliation. A later change to the underlying placement, source identity, museum state, section, family or tier holds the old decision for review instead of overriding the new state. The legacy saint proposal editor displays the effective scoped decision and links to its review; its original proposal remains available for comparison.

Vrindavan's reader requests the unprojected SPN baseline and does not inherit these decisions. No global saint version or canonical section assignment is changed. Existing SPN arrangement rows keep their IDs, status, coordinates, confirmation timestamp, confirmer and inventory acknowledgement. A currently valid arrangement is rebound to the new scoped revision in the same transaction; an already stale arrangement is not revived. Group moves through the original snapshot-only workflow are unavailable for families with scoped decisions because that workflow cannot move their complete current membership.

## Current authorized applications

Paragata's 24 October instruction, recorded in Saarthi's chat, authorizes Kaleshwar's SPN addition to the existing Sai family (FAM-007), governed by Maharashtra Guru Lineages. His devotional relationship to Shirdi Sai Baba has already been reviewed separately. Keep Penukonda/Andhra website geography and both museums' physical data unchanged. Apply through the production admin only after the new route is deployed, inspect the current proposal, preserve unrelated reviewed fields, and verify the resulting source placement ID and arrangement.

Separate approved tier decisions—Savata Mali Primary; Harisundari and Madhavadas Secondary—can use the same workflow after fresh current-record checks. The broader tier evidence review remains a distinct batch; this release does not apply it automatically.

## Verification

- `node --import tsx --test lib/spn-proposal-domain.test.ts`
- `MUSEUM_TEST_DATABASE_URL=<disposable localhost museum_integration_test URL> node --import tsx scripts/verify-spn-proposals.ts`
- `npm run dev:check` and production build before release.

The integration script clears its disposable fixture database. Never point it at a shared development or production database. It verifies source placement identity, physical confirmation retention, stale-form rejection, later explicit change holds, unchanged global versions, and unchanged Vrindavan inheritance fields and stored arrangements.

The tier audit now reads the same effective SPN proposal view. Public biography summaries follow the public reader's `shortDescription ?? biographySummary` precedence; older snapshots exported only the latter and can understate available public life information. `summarySource` records which field supplied the text. Unpublished summaries remain excluded. Relationship evidence includes existing public context notes so devotional and in-person connections can be distinguished during research.

Workflow skill review: existing museum-data and identity skills already distinguish relationship evidence, display families, proposal decisions and physical state. No new historical or packaging interpretation is introduced here. The arrangement-revision rule remains documented in their project evidence reference.
