import type { StarterMoveGuide, GuideGroup } from "./spn-move-guide";

// Source-observation suppression only; canonical saints and raw imports remain intact.
export const spnDuplicateObservations: Record<string, { duplicateOfSourceId: string; reason: string }> = {
  rec419YldTnqJc6lM: {
    duplicateOfSourceId: "recL5wb5a9ffIoqO9",
    reason: "Curator-reported duplicate observation of the Gopal murti retained under Sri Krishna Das. Attribution remains unverified.",
  },
};
export function isActiveSpnObservation(sourceId: string) {
  return !Object.hasOwn(spnDuplicateObservations, sourceId);
}
export function activeSpnGuide(guide: StarterMoveGuide): StarterMoveGuide {
  const group = (value: GuideGroup): GuideGroup => ({
    ...value,
    sourceIds: value.sourceIds.filter(isActiveSpnObservation),
    ...(value.sourceIds.every(isActiveSpnObservation)?{}:{saintCount:undefined,spaceEstimate:undefined}),
    edges: value.edges?.filter(edge => isActiveSpnObservation(edge.fromSourceId) && isActiveSpnObservation(edge.toSourceId)),
  });
  return {
    ...guide,
    entries: guide.entries.filter(row => isActiveSpnObservation(row.sourceId)),
    vitrines: guide.vitrines.map(v => ({ ...v,
      families: v.families.map(group).filter(g => g.sourceIds.length),
      cityGroups: v.cityGroups.map(group).filter(g => g.sourceIds.length),
    })),
    alternatives: guide.alternatives.map(group).filter(g => g.sourceIds.length),
  };
}
