# Scoped Datta move guide

The user locked the target rosters for SPN vitrines 3, 81 and 82 on 28 October 2026. The phase contains 48 source observations (14, 15 and 19 respectively). It is not a complete replacement museum allocation. Forty outgoing observations still need receiving destinations.

## Integration

`lib/spn-datta-guide.ts` exports `dattaMoveGuide`, `dattaGuideContext`, and `projectDattaGuide(currentPlacements, physicalState)`. The projection uses the same current-tier rules as the starter guide and the fresh physical ledger supplied by `readMuseumPhysicalLocations`. It does not read captured `currentLocation` from the research packet as current physical evidence. Missing, duplicate or changed identities have an unknown projected location and a movement hold.

The immutable packet is `data/museum/spn-datta-move-guide-v2.json`. Its content digest is checked independently of the unchanged 48-row roster digest. The corrected v2 life-status metadata requires positive source/reviewed evidence; missing death data alone does not imply that a saint may still be alive.

The guide registry recognizes this phase alongside the existing starter guide. Decisions remain version-scoped. Physical confirmations carrying this phase context must name an exact roster source and its accepted target. Whole-case clearing, staging and alternative destinations are rejected before database writes. Existing item, source identity, movement hold, fixed-housing and concurrency checks still apply.

## UX composition

The UI owner should provide the normalized guide with `allowClear={false}`, `phaseLabel="Datta · 3, 81 & 82"` and `key={guide.version}`. Read current physical locations separately and pass the result to the projection and companion. Keep outgoing dependencies visible without presenting their former cases as empty. Do not activate this phase as a full museum proposal or mark any row completed from its source coordinates.

This branch does not change route composition or the default starter guide. Citra owns the phase selector and companion presentation. The user requested deployment of the starter-row guide first; this contract is a separate subsequent integration and must not be bundled into that release without the coordinated handoff.

## Verification

Focused checks cover the exact partition, isolation from the starter registration, invalid physical targets and clearing, fresh confirmations versus captured source positions, changed/ambiguous identity holds, tier overlays and corrected living-status interpretation. No migration, environment change, production data write or physical move is included.

The evidence review found no additional immediate family holding outside the accepted set in the checked production snapshot and preserved family set. The reciprocal Akkalkot Balappa/Pant source pointer remains a held namesake issue. Both Tukadoji observations and both Gulabrao variants stay separate observations; no identity merge or object deduplication was performed.
