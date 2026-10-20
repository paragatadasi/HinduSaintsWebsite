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
