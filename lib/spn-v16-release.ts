import source from "../data/museum/spn-starter-reviewed-proposal-v16.json";
import baseline from "../data/museum/spn-starter-reviewed-proposal-v7.json";
import previous from "../data/museum/spn-room-explorer-final-v10-design.json";
import type { ExplorerOption, ExplorerPlacement } from "./spn-room-explorer";
import { currentSpnConceptLabel } from "./spn-proposal-labels";

const cases = new Map(source.reviewCases.map(row => [row.vitrine, row]));
const assignments = source.assignments.map(row => ({ ...row, subsection: cases.get(row.number)?.title ?? row.subsection }));
const allRows = [...source.rows, ...source.namedOnly];
const reviewNote = "Accepted East–North connections v4 proposal, approved on 28 October 2026. Newer curator choices remain in effect. Recorded physical locations are shown separately; no additional moves are confirmed. Source-only observations and identity holds remain distinct. Space estimates include unknowns and do not certify physical fit.";
const indicators = baseline.indicators.map(original => {
  const rows = source.rows.filter(row => row.vitrine === original.vitrine);
  const unresolved = rows.filter(row => row.unresolved);
  const unknown = rows.filter(row => row.planningShelfEstimate == null);
  const estimate = rows.reduce((sum, row) => sum + (row.planningShelfEstimate ?? 0), 0);
  const namedUnknown = source.namedOnly.filter(row => row.vitrine === original.vitrine).length;
  const headroom = original.referenceShelfShares - estimate;
  const exclusion = original.vitrine === "68" && source.availabilityOverrides["68"] ? null : original.flexibleSpaceExclusion;
  const flexible = !exclusion && !unknown.length && !namedUnknown && headroom >= 1;
  return { ...original, mainFocus: cases.get(original.vitrine)?.title ?? original.mainFocus,
    hasUnresolvedHoldings: unresolved.length > 0, unresolvedSourceObservationCount: unresolved.length,
    unresolvedCanonicalCount: new Set(unresolved.map(row => row.saintId).filter(Boolean)).size,
    unresolvedCanonicalIds: [...new Set(unresolved.flatMap(row => row.saintId ? [row.saintId] : []))],
    unresolvedSourceRecordIds: unresolved.map(row => row.sourceId), unresolvedNames: unresolved.map(row => row.name),
    unresolvedObservedShelfShares: unresolved.reduce((sum, row) => sum + (row.share ?? 0), 0),
    totalObservedShelfShares: rows.reduce((sum, row) => sum + (row.share ?? 0), 0),
    comparisonHeadroomShelfShares: headroom, estimatedRequiredShelfShares: estimate, planningHeadroomShelfShares: headroom,
    unknownShelfSourceObservationCount: rows.filter(row => row.share == null).length,
    unknownShelfSourceRecordIds: rows.filter(row => row.share == null).map(row => row.sourceId),
    unknownPlanningFootprintCount: unknown.length, unknownPlanningFootprintSourceIds: unknown.map(row => row.sourceId),
    namedOnlyUnknownFootprintCount: namedUnknown, potentialFlexibleSpace: flexible, flexibleSpaceExclusion: exclusion,
    flexibleSpaceLabel: flexible ? "Potential flexible space" : null,
    tertiaryCityClusters: [], specialFitNote: cases.get(original.vitrine)?.remainingReview ?? original.specialFitNote };
});
const primeAnchors = Object.fromEntries(assignments.flatMap(assignment => {
  const names = [...new Set(allRows.filter(row => row.vitrine === assignment.number && ["Primary", "Featured"].includes(row.tier)).map(row => row.name))];
  return names.length ? [[assignment.number, { people: names.join(" · "), reason: cases.get(assignment.number)?.anchors ?? "Preserve the reviewed anchor group; physical fit remains unconfirmed." }]] : [];
}));
const option: ExplorerOption = {
  id: source.version, title: currentSpnConceptLabel, summary: reviewNote,
  assignments, primeAnchors,
  displayPackets: assignments.map(row => ({ unitId: `v16-case-${row.number}`, label: row.subsection, group: row.group, cases: [Number(row.number)], navigationKind: "neighborhood" })),
  drivers: source.reviewCases.map(row => ({ connection: row.title, places: [Number(row.vitrine)], reason: `${row.cityPlacement} ${row.connection}` })),
  largeObjects: { note: "Keep fixed stick cases and full-height housing separate. Review named mixed-object holds before moving a whole source display.", fallback: "Confirm object housing and actual space with the curator." },
  tradeoffs: ["Source-shelf estimates do not certify physical fit.", "Newer curator decisions and recorded current locations remain independent of the proposed baseline."],
};
const placements: ExplorerPlacement[] = allRows.flatMap(row => row.saintId ? [{ saintId: row.saintId, vitrine: row.vitrine, rationale: cases.get(row.vitrine)?.anchors ?? row.allocationKind }] : []);

export const spnV16Release = {
  proposal: { ...source, title: currentSpnConceptLabel, assignments, indicators, reviewNote, reviewStatus: "Accepted default proposal; physical moves remain separate" },
  designData: { options: [option], comparisonPrevious: previous.options[0], placements },
};
