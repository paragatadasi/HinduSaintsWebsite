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
