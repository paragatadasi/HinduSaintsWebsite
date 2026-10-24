# Editorial museum navigation

Paragata approved the Color cues direction with long gold underlines, compact regional accordions and a scalable museum dropdown on 24 October 2026. Subsection type remains 13px; gaps between regional groups reduced to the shared space-1 token. Serif headings, quiet utility links and regional guide colors preserve hierarchy without the former circular icon badges.

Shared implementation: MuseumNavigation, MuseumNavigationDisclosure, MuseumWorkspace shell, navigation tokens and shared CSS. Museum selector uses a static route allowlist. Existing access filtering, section names/order/counts and active URL matching are unchanged. Disclosure keys preserve the existing Browse sections preference and add a distinct key per museum/region. Native details work even when browser storage is unavailable. No schema, inventory or proposal changes.

Verification: dev:check; browser-rendered production components for both museums (example zero counts), selector navigation, correct query-based Vrindavan active state, retained expanded groups, computed 13px subsections. Three existing navigation tests pass; the fourth has an unchanged baseline expectation that South ends in Andhra, whereas current catalogue ends in Kerala. Catalogue and tests were not modified by this feature.

Prototype direction selected; exploratory code remains outside the repository for reference during release. Remove the isolated navigation prototype files after successful release, retaining this decision record. No production picker or variant branches exist.


## SPN regional grouping — 24 October 2026

SPN uses six navigation parents from Saarthi's approved v2 comparison: Himalaya & the North; Sikh Gurus & Udasin; Braj & the Ganga; Bengal, Odisha & the East; Maharashtra & the West; The South. The single SPN configuration in `lib/spn-region-navigation.ts` drives the sidebar and section overview. Bhakti Marga & Global Context and Needs review remain separate. All 23 detailed subsection names, URLs, counts, and placement identities are retained. New/unmapped sections remain visible in Needs review rather than receiving an inferred geographical placement.

This is a display hierarchy, not a saint reassignment or physical move. Nadi owns separately reviewed SPN family exceptions (including Kaleshwar); no database operation is part of this UI change. Vrindavan retains its existing visitor sequence.

Workspace no longer advertises Placement review or Moves and relics. Source matching belongs in Main admin / Source Data / Museum updates. Legacy relic move action links are removed from curator saint and vitrine views; the underlying routes and history remain intact for compatibility. The existing Plan the move layout experience remains available; future execution controls should be designed when needed.
