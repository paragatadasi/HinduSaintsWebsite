# Vrindavan saved-plan audit — 21 October 2026

This checkpoint records authenticated production saves and a fresh private export, rather than a deployment-dispatch result. Application code and research manifests are separate from these saved museum decisions.

## Verified saved state

Snapshot `vrindavan-final-saved-v3-inventory-2026-10-21.json`, generated **2026-10-21T05:03:44.672Z**, revision `88dac8acae48333d980967d08d42fc14db6bc2576de2ffdab428278cc32001ad`, source snapshot `89c0c02dcab10d81b439943be6667c981e1995448f098abcdcaf4f3c39c28c62`:

| Measure | Count |
| --- | ---: |
| Linked website saints | 402 |
| Confirmed source rows | 415 |
| Exact planned destinations | 377 |
| Valid flexible destinations within saved areas | 22 |
| Held / unassigned linked saints | 3 |
| Pending source rows without confirmed identity | 34 |
| Saved section areas | 27 |
| Canonical relationship claims retained for audit | 48 |
| Physical moves confirmed | 0 |

All 29 rows in the approved locality review were checked: 20 now have their supported section, and nine residual research cases are Planned in Vitrine 6. Whole-family section moves preserved both members of the Yellaling and Vishudhanand groups. Karnataka, Kerala and Ramana share Vitrine 24; Northern Regional Saints and Sahaj Marg share the northern 3/4 area. These are shared planning areas, not exclusive reservations or capacity estimates.

Omkarnath and Parang Kush are Planned in the distinct Jaiguru section in Vitrine 21. Parang Kush retains his existing Secondary tier and Lakshman display-family key. Madhav (444), Saranga (189), Bon (225) and curator-confirmed Vilas Tirtha (188) are Planned in Vitrine 17 with Bhaktisiddhanta. Bon’s conflicting 2018 source date is retained for investigation. Bindu’s private draft/source link is Planned in the Bhakti Marga section in Vitrine 13; this did not publish a profile or confirm a physical move.

## Read flexible placements correctly

`current.arrangement.status === "Proposed"` alone does **not** mean a saint is unassigned. The v3 export includes raw `sectionAreas.flexiblePlacements`. Match its placement ID and arrangement revision, verify that the current section still matches the area, and use the saved area vitrines. At this checkpoint 22 saints have valid flexible plans. They must not be duplicated into every vitrine or assigned an invented exact destination. The planner independently displays **402 saints / 3 to plan**.

The three genuinely open linked records are:

| Source row | Saint | Reason |
| --- | --- | --- |
| 125 | Pandit Sri Ananta Das Babaji Maharaj | Stale arrangement requires review before replacement. |
| 119 | Sri Sri Hanuman Das Babaji | Exact identity and inherited Kriya display-family assignment need review. |
| 231, 473 | Sri Narayan Maharaj | Exact identity remains held; no teacher or destination is inferred. |

Only Ananta has `arrangementNeedsReview` at this checkpoint. The 34 pending source rows remain a separate identity backlog, including combined and unnamed entries; none were converted into invented saints or holdings.

## Preservation checks

The final snapshot was compared with the earlier v3 snapshot for every one of the 402 linked saints. Tiers, display-family keys, raw dates, canonical places, publication states and source packaging are unchanged. All 48 canonical relationship claims and all 34 pending source observations are unchanged. No placement was set to Implemented and no physical confirmation timestamp was added.

The canonical-claim audit found no additional clear inventory-to-inventory direct-disciple colocation omission. Chand Kazi’s inherited guru claim remains a known type conflict: the research guide describes dialogue/reconciliation and neighboring Vitrines 18/19 are retained. Namesake/family-label candidates are not relationship proof. Research-only contextual people do not imply museum holdings.

## Runtime guide verification

The protected connection-disposition download returned **guide version 13, 73 connections across 21 groups**, retrieved 2026-10-21T04:56:59.684Z. The private UI rendered Vilas’s confirmed Bhaktisiddhanta disciple edge and Ramaiah’s separately labelled traditional Babaji/Tamil Kriya context. This does not make Ramaiah a Yogananda disciple. Research guide baselines are dated; current saved destinations take precedence when a baseline differs.

Citra owns the guide manifest and interface; Saarthi owns the research guide and curator workbook. The final snapshot and the per-record application audit were handed to both. Guide refreshes must use this saved-state revision, not a pre-application plan. Later research or identity corrections remain separate reviewed changes.

## Local evidence and handoff

Private artifacts are in the task’s `vrindavan-reconciliation-2026-10-20` output folder:

- `vrindavan-final-saved-v3-inventory-2026-10-21.json`: complete current-state export.
- `vrindavan-final-saved-application-audit-2026-10-21.json`: 29 locality checks, 22 flexible plans, three holds and preservation assertions.
- `guide-73-live-alignment-2026-10-21.json`: actual production guide dispositions.
- `vrindavan-final-planner-3-held-2026-10-21.png`, `vilas-live-tree-and-v17-2026-10-21.png`, `ramaiah-live-traditional-context-2026-10-21.png`: UI evidence.
- `planning-source-evidence.json`: all 449 original Sheet1 source observations, with the same snapshot hash; join exact source row numbers for source-reported starting vitrines/positions and preserve multiple origins. The v3 linked rows contain packaging, but not every raw location field. No implemented moves were present, so do not label source-reported origins as newly verified physical placements.

This documentation makes no application, schema, environment, public-content or production-data change. Full private artifacts are not copied into public pages or static assets.
