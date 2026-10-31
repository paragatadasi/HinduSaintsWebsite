import type {GuideGroup, StarterMoveGuide} from "./spn-move-guide";

export const ramashrayTyagiReunion = {
  vitrine: "77",
  teacher: {sourceId: "recJHxAHzd7oNrbfR", saintId: "cms0w7fws04s707qie3wepp3x"},
  disciple: {sourceId: "rec6YZs1zGqm2SaxC", saintId: "cms0w7d8901a507qitq8nuuso"},
  basis: "Tyagi's source biography names Shri Ramashray Das Ji of Chitrakoot as his guru.",
} as const;

// A display grouping from the reviewed source biography, not a canonical relationship write.
export function projectSourceFamilyReunion(guide: StarterMoveGuide): StarterMoveGuide {
  const reunion = ramashrayTyagiReunion;
  const vitrine = guide.vitrines.find(v => v.code === reunion.vitrine);
  if (!vitrine) return guide;
  const members = [reunion.teacher, reunion.disciple];
  const visible = new Set([...vitrine.families, ...vitrine.cityGroups].flatMap(g => g.sourceIds));
  if (!members.every(member => visible.has(member.sourceId) && guide.entries.some(entry =>
    entry.sourceId === member.sourceId && entry.saintId === member.saintId && entry.destination === reunion.vitrine))) return guide;
  const sourceIds: string[] = members.map(member => member.sourceId);
  const family: GuideGroup = {
    id: "source-family:ramashray-tyagi", title: "Ramashray & Tyagi Baba", sourceIds,
    rationale: reunion.basis, suggestedVitrines: [reunion.vitrine],
    edges: [{fromSourceId: reunion.teacher.sourceId, toSourceId: reunion.disciple.sourceId,
      label: "disciple · source-recorded", basis: reunion.basis}],
  };
  const withoutPair = (groups: GuideGroup[]) => groups.flatMap(group => {
    const remaining = group.sourceIds.filter(id => !sourceIds.includes(id));
    if (remaining.length === group.sourceIds.length) return [group];
    return remaining.length ? [{...group, sourceIds: remaining, saintCount: undefined, spaceEstimate: undefined,
      edges: group.edges?.filter(edge => remaining.includes(edge.fromSourceId) && remaining.includes(edge.toSourceId))}] : [];
  });
  return {...guide, vitrines: guide.vitrines.map(v => v !== vitrine ? v : {...v,
    families: [...withoutPair(v.families), family], cityGroups: withoutPair(v.cityGroups)})};
}
