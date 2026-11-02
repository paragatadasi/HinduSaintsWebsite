import packet from "../data/museum/spn-combined-reviewed-allocations-v1.json";
import type {StarterMoveGuide} from "./spn-move-guide";
import type {CompanionAddition} from "./museum-companion-additions-state";
import type {ShelfPlanningPacket} from "./museum-shelf-planning-context";

export const combinedReviewedAllocations = packet;
const superseded = new Set(packet.preservedCuratorOverrides.map(source => source.sourceId));
const activeSources = packet.sources.filter(source => !superseded.has(source.sourceId));
const sourceById = new Map(activeSources.map(source => [source.sourceId, source]));

export function registerCombinedReceivers<T extends string>(guides: Record<T, StarterMoveGuide>): Record<T, StarterMoveGuide> {
  const owner = (Object.keys(guides) as T[]).find(key => guides[key].vitrines.some(v => v.code === "74"));
  if (!owner) return guides;
  const existing = new Set(Object.values<StarterMoveGuide>(guides).flatMap(g => g.vitrines.map(v => v.code)));
  const missing = ["16", "70"].filter(code => !existing.has(code));
  if (!missing.length) return guides;
  return {...guides, [owner]: {...guides[owner], vitrines: [...guides[owner].vitrines, ...missing.map(code => ({
    code, summary: "Receiving review", fitGuidance: packet.cases.find(v => v.code === code)?.notes.join(" "), families: [], cityGroups: [],
  }))]}};
}

// Saved proposals determine membership; this packet only supplies the reviewed rationale.
export function applyCombinedReviewedGuide(guide: StarterMoveGuide, additions: CompanionAddition[]): StarterMoveGuide {
  const saved = new Map(additions.map(addition => [addition.sourceId, addition]));
  const incomingCases = new Set<string>();
  const entries = guide.entries.map(entry => {
    const source = sourceById.get(entry.sourceId), addition = saved.get(entry.sourceId);
    if (!source || !addition || source.saintId !== entry.saintId || addition.saintId !== source.saintId ||
      addition.sourceRevision !== source.sourceRevision || addition.vitrine !== source.draftVitrine || entry.destination !== source.draftVitrine) return entry;
    incomingCases.add(entry.destination);
    return {...entry, reviewNotes: [...new Set([...(entry.reviewNotes ?? []), source.basis, source.shelfAdvice,
      ...("objectQualification" in source && source.objectQualification ? [source.objectQualification] : []),
      ...("groupQualification" in source && source.groupQualification ? [source.groupQualification] : []),
    ])], reviewNotesCollapsible: true};
  });
  return {...guide, entries, vitrines: guide.vitrines.map(vitrine => {
    const review = packet.cases.find(v => v.code === vitrine.code);
    if (!review || !incomingCases.has(vitrine.code)) return vitrine;
    return {...vitrine, fitGuidance: [...new Set([vitrine.fitGuidance, ...review.notes].filter(Boolean))].join(" ")};
  })};
}

export function applyCombinedReviewedShelves(plan: ShelfPlanningPacket): ShelfPlanningPacket {
  const retained = new Set(plan.vitrines.flatMap(v => v.allocations.filter(a => {
    const source = sourceById.get(a.sourceId);
    return source && source.draftVitrine === v.code && source.saintId === a.saintId && source.sourceRevision === a.sourceRevision;
  }).map(a => a.sourceId)));
  const vitrines = plan.vitrines.map(v => ({...v, allocations: v.allocations.filter(a => !sourceById.has(a.sourceId) || retained.has(a.sourceId)), groups: [...v.groups]}));
  for (const review of packet.cases) {
    let target = vitrines.find(v => v.code === review.code);
    if (!target) { target = {code: review.code, allocations: [], groups: [], relationships: []}; vitrines.push(target); }
    const groupId = "reviewed-additions:" + review.code;
    const incoming = activeSources.filter(s => s.draftVitrine === review.code && !retained.has(s.sourceId));
    target.allocations.push(...incoming.map(source => ({sourceId: source.sourceId, saintId: source.saintId,
      sourceRevision: source.sourceRevision, name: source.name, groupId, suggestedShelfIndex: source.sourceId === "recaTTfjinlSVDk4n" ? 5 : null,
      suggestedBand: "fit-review", reviewAlerts: [{message: source.basis}, {message: source.shelfAdvice},
        ...("objectQualification" in source && source.objectQualification ? [{message: source.objectQualification}] : [])],
    })));
    if (incoming.length) target.groups.push({id: groupId, title: "Reviewed additions", kind: "display"});
    target.notes = [...new Set([...(target.notes ?? []), ...review.notes])];
  }
  return {...plan, version: plan.version + ":" + packet.version, vitrines: vitrines.map(v => {
    const removed = plan.vitrines.find(old => old.code === v.code)?.allocations.some(a => !v.allocations.some(current => current.sourceId === a.sourceId));
    if (!removed) return v;
    const ids = new Set([...v.allocations.map(a => a.sourceId), ...(v.contextNodes ?? []).map(node => node.id)]);
    return {...v, groups: v.groups.filter(g => v.allocations.some(a => a.groupId === g.id)),
      relationships: v.relationships.filter(r => ids.has(r.fromSourceId) && ids.has(r.toSourceId))};
  })};
}
