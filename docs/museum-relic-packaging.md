# Relic packaging and frame evidence

Vrindavan column E (`Relic Box / Photo Frame`) is already preserved in `MuseumCollectionImport.rawJson.cells[4]`, with comparison-sheet evidence in `rawJson.secondarySheet.cells[4]`. The workbook supplied on 20 October 2026 has exactly the same SHA-256 as the existing inventory snapshot: `89c0c02dcab10d81b439943be6667c981e1995448f098abcdcaf4f3c39c28c62`. No new identity import, migration, backfill, or source rewrite is needed. Read the preserved data through the existing confirmed-identity adapter.

`lib/museum-relic-packaging.ts` owns the shared private museum contract:

- `classifyRelicPackaging(raw, secondary)` returns `type`, unmodified `rawText`, `secondaryText`, `sourceColumn: E`, size, other-container information and review flag.
- Types: `frame`, `small_frame`, `mixed_frame`, `unframed`, `unknown`, `conflicting`.
- `Frame` means size unspecified; do not present it as a measured large frame. Explicit Small Frame remains separate. Box/Frame or Bag/Frame are mixed entries, not verified numbers of physical frames. Box/no picture does not change separately managed saint-photo status. Blanks and unrecognized values remain unknown.
- Per Paragata’s explicit direction, Sheet1 wins when the comparison sheet disagrees. `secondaryDisagrees` and the original secondary text preserve that provenance without blocking or overriding the primary classification. `conflicting` is reserved for inconsistent evidence supplied for the same observation ID during aggregation. Equivalent order/case/whitespace is normalized for classification; raw values remain available. The source sheets disagree on rows 106, 112, 113 and 114. No source values are overwritten.
- `summarizeRelicPackaging(sources)` counts distinct source observation IDs, including six exclusive categories, reportedFrameEntries (frame + small + mixed) and reviewEntries (unknown + conflicting). It never multiplies by quantity, deduplicates an observation linked to several saints within the selected section/family, and preserves distinct observations that might later require physical duplicate review. Shared observations can appear in multiple section/family views; museum totals must use the helper on the union rather than sum those independent views.

Data adapters:

- `MuseumSourceInventoryEntry.packaging` plus existing `packagingText` expose original evidence from existing raw rows. `readVrindavanMuseumInventory().packagingSummary` aggregates only confirmed current-snapshot entries; pending identities are excluded.
- `MuseumSaintPlacement.sourcePackaging` contains the same observation IDs/evidence through section proposals and working placements, so section/family-tree consumers can aggregate safely.
- `PlannerRow.sources[].packaging` and `packagingText` carry the evidence to the planner. `plannerPackagingCounts(rows)` uses the shared deduplication helper for the current section, family or selection. Existing saint/photo counts keep their separate meaning. Packaging enters the planner revision so a later evidence change invalidates stale plan submissions.
- The protected current-state export includes each saint's sourcePackaging. Raw museum packaging never enters public content.

At the verified 413-linked-row checkpoint, conservative source-entry classifications are: 125 Frame, 2 explicitly Small Frame (with other objects), 13 mixed Frame, 270 unframed and 3 unknown. Four entries also carry comparison-sheet discrepancy provenance; their counts use Sheet1. These are inventory-entry counts, not verified physical relic/frame counts or vitrine capacity. All 449 source observations include another 36 pending identity rows; those do not enter saint/family planning counts until reconciled.

Citra owns presentation in section/family/selection planning summaries and family-tree UX, using the shared classifier/helper rather than inferring framing from photo tags. Show mixed/unknown/conflicting evidence separately; keep original packaging and quantity inspectable. Exact dimensions and physical object separation remain future curator data, not inferred by this import.

Verification covers all observed labels, Sheet1 precedence on contradictory sheets, semantic equivalent labels, shared multisubject entries, distinct observation IDs, pending/foreign museum filtering, preserved identity/quantity/source locations, and absence of quantity-based frame multiplication. There are no database writes in this feature.


## Source shelf positions and planning baseline

Paragata clarified column G as `row.position`: the first number is the row from top to bottom; the second is the order along that row and may be omitted. `parseSourceShelfPosition` in `lib/museum-source-shelf-position.ts` retains raw text and separates row-only, exact row/position, missing and unparsed evidence. It never assigns a missing position to slot 1. Inventory entries and planner source rows expose optional `sourceShelfPosition`; original position text and exact destination fields remain untouched.

Five rows per vitrine is Paragata's working planning assumption, not a hard validation or measured capacity. The parser preserves a valid observed row beyond five for review. The source records levels 1-5 in many vitrines, only1-4 in6-9/11/24, only2-3 in23, and no numbered source entries for0/18-22. Those gaps do not establish empty space. Vitrines16/17 contain many row-only entries, so repeated row labels are not conflicting exact slots. Source-entry counts and recorded position maxima do not establish dimensions or physical frame capacity.

The read-only observed planning fixture is stored as a private task artifact, version2, combining the verified400-saint/413-linked-row export with all449 source rows. It preserves the live Gaudiya section reservation17-19, flags36 unlinked and3 unparseable/blank source displays, retains photo status unknown, separates primary/secondary tiers and provisionally suggested families, and exposes recorded shelf levels plus packaging. Any actual suggested-plan preview/apply/clear must re-read current saved areas, exact destinations and revision guards; the fixture is not an apply payload. Related groups take priority, with upper-row preference for primary/secondary saints afterward. Public affiliation tags are soft context only; known contested memberships/context gaps remain held.
