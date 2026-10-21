# Vrindavan guide connections and planning alignment

The current catalogue contains 73 labelled connections across 21 sections in Saarthi's guide v13, incorporating the approved expansion and subsequent direct Ramaiah and Bhakti Vilas confirmations. The private manifest preserves all 63 original v9 case IDs and adds eight final-expansion IDs, stable per-connection case IDs, exact canonical IDs for actual holdings, typed research labels, source URLs and research caveats. Context-only endpoints remain context even if a similarly named website saint exists.

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

Domain tests cover stable IDs, all 73 connections, context and group semantics, canonical guru direction, reciprocal claims, missing/archived identities, biological direction and preservation of an implemented curator arrangement. After paired UI deployment, download the production alignment report and save a durable result matrix keyed by connection ID. Compare actual canonical dispositions, verify typed labels and context-only styling in family/section views, and record any unresolved identity or canonical conflicts. The guide is research evidence, not proof that a canonical database write has occurred.

Neutral regional vocabulary, locality placements, section-area reservations and the Bindu record workflow are separate checkpoints and are not completed by this feature.

The guide retains its baseline revision/time and each actual endpoint's `guideVitrine`. `planningSnapshotChanged` flags any divergence from the current saved destination. Treat placement suggestions as dated research context, never as an instruction to overwrite later curator plans.

## Private UI integration

Vrindavan family and saint trees retain canonical/source claims and add a display-only guide overlay. Teaching and succession retain endpoint direction; association, incarnation, biological-family and group-membership references do not establish teacher generations. Stable case IDs, exact role labels, sources, confidence and website comparison remain available in the research evidence disclosure. Context-only cards explicitly do not count as museum holdings.

Both the planner section workspace and section proposal tree panel offer collapsible guide groups, selected by exact current placement section. Related context within a selected research group remains visible; groups render their diagrams only after opening. Unavailable identities stay in review evidence rather than producing fabricated graph nodes. The protected download provides all 73 dispositions. Browser components import DTO types only; the research manifest is loaded by the authenticated server, never bundled as client data.

Snapshot-drift warnings and current destinations are displayed with the evidence. Static guide placement suggestions are not rendered as current instructions. This layer does not write canonical relationships, identities, tiers, families, locations or destinations. Historical research overlays do not replace canonical relationship review.

## Final approved expansion (guide v10)

Guide v10 used `data/museum/vrindavan-guide-connections-v10.json`; v9 is retained as an immutable compatibility baseline. Existing endpoint identity, type, label, confidence, evidence and caveats are unchanged. Sources and dated guide destinations reflect the supplied v10 alignment matrix. The guide revision and timestamp identify the intermediate snapshot, not a guarantee of current destination accuracy; current saved placement is loaded independently and drift remains visible.

The eight additions cover Pant Maharaj's contextual teacher Balavadhoot, four named Bhaktisiddhanta pupils, the Sai traditional-manifestation connection, Omkarnath and Parankush, and Papa Ramdas's mantra initiation of Yogi Ramsuratkumar. Balavadhoot is not identified with Akkalkot's Balappa; Papa Ramdas is not identified with source row 145. Sai manifestations remain traditional incarnation context, never a direct teacher link. Vilas, Ramaiah, Narayan source rows 431/462 and Ramdas145 identity holds are retained; no identity or source-date repair is implied. Nadi's destination reconciliation and final live verification remain separate from this read-only release.

An empty dated destination and an unassigned current arrangement now compare equally, avoiding a false drift warning for the newly included unassigned record. Missing placements still trigger review.

## Direct collection confirmation (guide v11)

The guide v11 intermediate manifest was `vrindavan-guide-connections-v11.json`: 72 connections, 21 groups. All previous 71 case IDs, endpoints and semantic/evidence fields remain unchanged. On 2026-10-21 Paragata Dasi directly confirmed source row 20 as S. A. A. Ramaiah. Only that identity hold is cleared. The new `ramaiah-tamil-kriya-001` connects a context-only Babaji figure to Ramaiah as a teacher in the traditional Tamil Kriya account, explicitly not Yogananda discipleship. The original Vitrine 24 destination remains unchanged; no canonical identity, relationship or destination writes occur. Other identity holds remain in the report. Baseline destinations are dated to the supplied 04:33:40Z intermediate snapshot and remain subject to drift checks.

Bhakti Vilas source row 188 has separately confirmed broad Gaudiya affiliation. Its specific identity as the researched Bhaktisiddhanta pupil remains held; no additional guru edge is created from affiliation alone.

## Subsequent explicit discipleship confirmation (guide v13)

The current manifest is `vrindavan-guide-connections-v13.json`: 73 connections in 21 groups. Paragata Dasi subsequently confirmed Bhakti Vilas row188 specifically as Bhaktisiddhanta's disciple, superseding the earlier affiliation-only hold above. The new stable case `bhakti-vilas-tirtha-disciple-001` retains that provenance and the institutional source. Only the Ramaiah and Vilas holds are cleared; Narayan462, Narayan431 and Ramdas145 remain held. All previous72 meanings are regression checked. No destination, canonical relationship or physical movement is written by this update.
