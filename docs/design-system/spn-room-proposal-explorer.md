# SPN room proposal explorer

The protected SPN plan page opens with the approved room explorer. Original and saved connected-tradition arrangements remain available in a disclosure below it.

Use the shared museum panel, button, typography and regional color tokens. The room is a schematic SVG grid; its geometry is data rather than CSS styling. Turning the map changes the view only. Counter-rotate numbers and reserve an outside margin for Cave and Entrance markers.

Two independent cues may coexist: `Identity under review · lower display` and `Potential flexible space`. The former is record-based, including unknown or zero-footprint records. The latter is only a comparison estimate, never a vacancy or capacity guarantee. Suppress flexibility for protected housings, future cases, and cases affected by current-record changes. Case 4 flexibility is restricted to Sai / Meher.

Keep lower-review records distinct from the main regional display. Never inherit the host region or lineage. Proposed upper/lower bands do not assign physical shelf numbers. The total shelf-share estimate already includes lower-review records.

The immutable v15 baseline is packaged with source IDs, provenance hashes, and the current-record comparison baseline. Read current museum data on every authorized page request. Preserve current names, tiers, region overrides and saved destinations; flag changed identity/section/family/proposal state. Loading this view performs no database writes and does not apply physical moves. Future proposals can reuse the explorer with a separately versioned baseline.

The floating hover preview is shared by pointer and keyboard focus; the inspector contains equivalent information for touch. All vitrines are keyboard selectable, including future spaces so their exclusion is explainable.

## Approved visual implementation

The Room explorer follows the reviewed prototype directly: the proposal picker,
search, Sections / Primary saints / Connections tabs, paired turn controls,
regional legend, hover card and right-hand vitrine inspector retain the same
layout. Its scoped shared stylesheet is styles/spn-room-explorer.css; it uses
existing theme tokens and does not restyle unrelated admin screens.

Saints use one vertical column of portrait rows, with published profile portraits,
stable image dimensions, quiet placeholders and an integrated disclosure chevron.
Keep exact vitrine placements separate from other primary saints in the area.
Show only a rationale involving the selected display in the vitrine inspector.
General display policies and routes merely passing a vitrine belong to the
proposal-level Connections view.

The current v16, retained v15 and earlier design study can be compared without applying any of them.
Browser-local shortlist and view orientation are convenience preferences, not
saved curator move plans. The hover card is a pointer/focus preview; touch users
can select the same vitrine for the full inspector.


## Versioned proposal review

Each release owns its source allocations, indicators, snapshot date, exact saint placements and connection rationale. Switching versions must switch the entire dataset together. V16 is the default; v15 remains selectable. Current scoped curator decisions are reconciled independently against each version, and viewing or comparing a proposal never writes placements.

Show held identity or merge cases beside the affected vitrine without conflating them with physical fit. Optional curator questions retain exact source evidence and ask only for missing planning clues. Published portraits remain shared; private proposal metadata stays server-loaded behind museum authorization.
