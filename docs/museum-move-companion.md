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

## Remaining Vraj receivers

The independent `spn-vraj-remainder-2026-10-30-v1` guide registers the 98 reviewed source observations for 32, 33, 34, 35 and 38 (18, 22, 19, 19 and 20 respectively). Its packet derives from revision 5 of the reviewed Vraj/East shelf recommendations. The existing 79/77 guide and its decisions and digests remain unchanged.

Each receiver requires its own complete current-content clearance and preparation before incoming confirmations. A clearance reads the current physical ledger and includes every then-current occupant, including one intended to return; capturing the guide does not clear a case. Normal confirmations recheck the current shelf context inside the existing transaction and museum lock. A changed source, identity, baseline, living-status conflict or newer destination cannot execute the captured assignment. Valid curator additions and alternatives retain their existing guarded workflows.

Two observations have no canonical saint binding. They remain source-scoped inventory entries and acquire no identity link. Original locations, saved proposed destinations, suggested shelf bands and curator-confirmed physical placements remain distinct. Case 33 retains its unknown footprint; case 35 retains the lower-band comparison warnings. These are fit checks, not certified dimensions or capacity.

Server callers use `readVrajRemainderGuide(currentData, physical, alternatives?)`; the pure `projectVrajRemainderGuide` requires an evaluated shelf context. The backend registry owns physical scope; the companion owns phase and shelf rendering. The rollout performs no database migration, backfill or physical confirmation. Workflow review found no new evidence or identity policy requiring a skill change.
