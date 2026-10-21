# Move companion refinement

The Vrindavan move companion separates search/sort from starting-vitrine,
destination-vitrine, region, section and status filters. Filters intersect;
flexible plans match any candidate destination. Last curator-confirmed locations
take precedence over original inventory locations. Entries without a destination
remain discoverable. Implemented arrangements needing review remain in Still to do.

Cards initially show saint, section, region and route. Native expandable details
reveal the existing biography/tree, source relics and physical confirmation form.
No completion or location-write semantics changed. Container details use the
additive source component summary documented in museum-packaging-components.md;
planning summaries retain their original entry-based categories.

Verification: 13 targeted filter and packaging tests; dev:check; actual UI in a
synthetic browser fixture, including a 390px-wide responsive viewport. No production
records were edited during testing. Release captain owns integrated build validation.


## Packaging totals across planning views

The section overview, family cards, selected-saint destination panel, family-tree dialog and vitrine contents reuse the same additive component summary as move-companion entry details. A Small Frame/Box entry contributes one Small frame and one Box while remaining one distinct source inventory entry. Source IDs are deduplicated within each displayed group; relic quantities do not multiply component counts. Frame, Small frame, Box, Bag, Urn and Paduka stay separate. Unknown or conflicting entries are held for review.

Planning aggregates retain the previous entry-category breakdown under **Original inventory-entry categories**. Those mutually exclusive entry counts and the additive component counts describe different things; neither is a measured capacity or verified physical-object total. Individual source labels remain preserved.
