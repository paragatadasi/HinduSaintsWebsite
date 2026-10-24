# SPN reviewed proposals

The main admin review route is `/admin/source-data/museum/spn-proposals?saintId=<website-record-id>`. It confirms a researched SPN section, display tier and existing display family. Source-data and full-catalog access are required, together with museum management permission to save.

Decisions are append-only `AuditEvent` records with action `museum.spn_proposal.saved`. Each retains the reviewer, reason, previous effective proposal, canonical identity, original placement ID, target section/tier/family and a baseline revision. This is a museum decision, not a historical relationship, website geography edit, profile publication or physical move confirmation.

The SPN reader applies decisions after family reconciliation. A later change to the underlying placement, source identity, museum state, section, family or tier holds the old decision for review instead of overriding the new state. The legacy saint proposal editor displays the effective scoped decision and links to its review; its original proposal remains available for comparison.

Vrindavan's reader requests the unprojected SPN baseline and does not inherit these decisions. No global saint version or canonical section assignment is changed. Existing SPN arrangement rows keep their IDs, status, coordinates, confirmation timestamp, confirmer and inventory acknowledgement. A currently valid arrangement is rebound to the new scoped revision in the same transaction; an already stale arrangement is not revived. Group moves through the original snapshot-only workflow are unavailable for families with scoped decisions because that workflow cannot move their complete current membership.

## Current authorized applications

### Museum region tags

The same protected form accepts optional Museum regions, using the approved
regional navigation names. They are private curatorial display tags, independent
of section, historical tradition and website geography. Multiple tags describe
a regional connection; an empty selection means use the section's normal region.
The scoped audit payload stores `regionTags`; working placements and protected
tier exports expose them as `spnRegionTags`. Old decisions without this field
remain valid. Older forms that omit the region control preserve saved tags.
Source/baseline conflicts still hold the whole scoped decision for review.

For the approved Puducherry-to-Pune connection, tag Mirra Alfassa, Dilip Kumar Roy
and Indira Devi with **`The South` only**, retaining their shared Integral Yoga
display family, existing tiers, traditions and localities. Their shared destination
is a separate versioned layout proposal, subject to fit and number validation;
region-tag acceptance does not save or confirm that location.
Neem Karoli Baba's separately approved Northern section decision preserves his
current tier, no-family state, biographical places and physical arrangements.

UI consumers should prefer nonempty `spnRegionTags` when showing an SPN record's
curatorial regions, falling back to its section mapping. Do not interpret these
tags as new traditions, historical guru claims, public place links or physical
destinations. Other museums do not inherit the scoped tags.

Workflow review: the museum interpretation skill already separates geography,
display grouping and physical placement. This contract is documented here;
no new general skill instruction is needed.

### Verified production applications, 24 October 2026

The user superseded the initial two-region idea: the three Integral Yoga records
belong to the Southern region, with the Western connection retained only in the
decision note. No separate South–West region was created. All three saves were
verified through the protected UI and the 19:32 UTC tier export. Their sections,
tiers, family, website places, traditions, source locations and physical states
were unchanged. Existing section navigation still follows section mapping until
the separate region-tag display consumer is integrated.

Other completed scoped decisions in this session:

- Neem Karoli Baba: Northern section, then explicitly approved Primary tier;
  no family assigned and source location 1/C preserved.
- The existing Arunachala record `cms0w7hle06te07qiegamkjgn`, imported as
  Sri Yogi Ram Baba Surat Kumar: Secondary by explicit curator instruction.
  Source 8/B, dates and profile identity preserved; historical relationships and
  conflicting dates remain a separate research task.
- Exact Pathbari Ramdas and Madhusudan: Gaudiya/FAM-002 under Radharaman's
  reviewed guru chain, both Secondary. The broad family retains its existing
  Jagad Bandhu Sundar label; no namesake merges or physical moves occurred.

The 19:32 UTC export contains 93 Primary, 193 Secondary and 1,134 Tertiary
placement rows. These are not verified unique-person or physical-item counts.
The Secondary rows comprise 191 canonical records and two unlinked source rows;
keep those identity holds distinct in physical planning and capacity ledgers.

Paragata's 24 October instruction, recorded in Saarthi's chat, authorizes Kaleshwar's SPN addition to the existing Sai family (FAM-007), governed by Maharashtra Guru Lineages. His devotional relationship to Shirdi Sai Baba has already been reviewed separately. Keep Penukonda/Andhra website geography and both museums' physical data unchanged. Apply through the production admin only after the new route is deployed, inspect the current proposal, preserve unrelated reviewed fields, and verify the resulting source placement ID and arrangement.

Separate approved tier decisions—Savata Mali Primary; Harisundari and Madhavadas Secondary—can use the same workflow after fresh current-record checks. The broader tier evidence review remains a distinct batch; this release does not apply it automatically.

## Verification

- `node --import tsx --test lib/spn-proposal-domain.test.ts`
- `MUSEUM_TEST_DATABASE_URL=<disposable localhost museum_integration_test URL> node --import tsx scripts/verify-spn-proposals.ts`
- `npm run dev:check` and production build before release.

The integration script clears its disposable fixture database. Never point it at a shared development or production database. It verifies source placement identity, physical confirmation retention, stale-form rejection, later explicit change holds, unchanged global versions, and unchanged Vrindavan inheritance fields and stored arrangements.

The tier audit now reads the same effective SPN proposal view. Public biography summaries follow the public reader's `shortDescription ?? biographySummary` precedence; older snapshots exported only the latter and can understate available public life information. `summarySource` records which field supplied the text. Unpublished summaries remain excluded. Relationship evidence includes existing public context notes so devotional and in-person connections can be distinguished during research.

Workflow skill review: existing museum-data and identity skills already distinguish relationship evidence, display families, proposal decisions and physical state. No new historical or packaging interpretation is introduced here. The arrangement-revision rule remains documented in their project evidence reference.
