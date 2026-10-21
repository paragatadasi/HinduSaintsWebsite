# Vrindavan guide connections and planning alignment

The curator requested the 63 labelled connections in Saarthi's placement guide v9 to appear in museum planning trees and section proposals. The private manifest preserves the original 17 guide sections, stable per-connection case IDs, exact canonical IDs for actual holdings, typed research labels, source URLs and research caveats. Context-only endpoints remain context even if a similarly named website saint exists.

## Data contract

`lib/vrindavan-guide-connections-domain.ts` exports `GuideConnection`, `ResolvedGuideConnection`, `GuideEndpoint`, `GuideKind`, the manifest, and a pure projection. `readVrindavanGuideConnections()` loads current canonical relationships and museum proposals without writes. Every caller must require both `access_museum` and `view_full_saint_catalog`. The protected admin download is `/admin/source-data/museum/vrindavan/guide-connections`.

The connection `id` is the research matrix case ID. `from` and `to` remain directed as stated: teacher to pupil, predecessor to successor, mother to daughter, husband to wife, devotional origin to traditional manifestation. Association and group links remain nonstructural. Incarnation is theological context, never biological descent. Fine roles such as sannyasa teacher, tantric training, spiritual formation, friendship and household association come from `type` and `label`; the broad rendering kind must not erase them.

Resolved saint endpoints have current canonical details and independently loaded placement data. Context endpoints have `contextOnly: true`, `presence: none`, no canonical person and no placement. Missing or archived IDs are unavailable; no name-based substitution occurs. A canonical person without a confirmed museum source has no asserted holding.

The read-only comparison reports `reviewed_match`, `unreviewed_match`, `missing`, `type_conflict`, `context_only` or `unavailable_identity` per connection, retaining all existing claims and IDs. A reviewed match concerns the broad canonical relationship kind, not independent confirmation of every fine research label. Guru direction is normalized from the database's disciple-to-guru convention. Imported, disputed and uncategorized claims are not silently promoted to reviewed claims.

## Planning protection and display integration

This is an additional museum-only research layer. It never creates a canonical relationship, public page, saint, inventory entry, formal tradition, family membership, tier, destination or physical move. Preserve existing canonical claims alongside it. Do not send these claims through automatic family/tier reconciliation, alphabetize directed endpoints, merge branches or downgrade Primary/Featured anchors. Uncertain identities and conflicting canonical claims must remain visible for review rather than be rewritten to fit the guide. Citra owns typed graph rendering and the section planning panel.

The v9 baseline has 38 connections with two actual inventory endpoints and 25 with contextual endpoints. All 22 actual teacher pairs are already planned in the same vitrine. Of the 38 actual pairs, 36 share a destination; Lahiri (4) with Trailanga (5), and Mahaprabhu (19) with Chand Kazi (18), intentionally connect neighbouring displays. No destination batch is needed for the guide alignment.

Retain Venabai's inconsistent date fields for investigation. Nityananda archive cases remain medium confidence, including Sadanand's birth-year discrepancy and Saligram's missing biography/dates/photo. Narayan source row 462 remains held outside the 63 connections because the record dates conflict with the researched twentieth-century identity. Do not conflate the Haidakhan Mahendra with Mahanam's Mahendra Brahmachari, or the Shinor record with Nigamananda's sannyasa guru.

## Verification and remaining checkpoints

Domain tests cover stable IDs, all 63 connections, context and group semantics, canonical guru direction, reciprocal claims, missing/archived identities, biological direction and preservation of an implemented curator arrangement. After paired UI deployment, download the production alignment report and save a durable result matrix keyed by connection ID. Compare actual canonical dispositions, verify typed labels and context-only styling in family/section views, and record any unresolved identity or canonical conflicts. The guide is research evidence, not proof that a canonical database write has occurred.

Neutral regional vocabulary, locality placements, section-area reservations and the Bindu record workflow are separate checkpoints and are not completed by this feature.
