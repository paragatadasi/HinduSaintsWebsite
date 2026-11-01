import type {ShelfPlanningCase, ShelfPlanningPacket} from "./museum-shelf-planning-context";

export function appendReviewedShelfSupplements(
  packet: ShelfPlanningPacket,
  fallback: ShelfPlanningCase[],
  supplement: {version: string; vitrines: ShelfPlanningCase[]},
): ShelfPlanningPacket {
  const existingCodes = new Set(packet.vitrines.map(v => v.code));
  const existingSources = new Set(packet.vitrines.flatMap(v => v.allocations.map(a => a.sourceId)));
  const replacements = new Set(supplement.vitrines.flatMap(v => v.allocations.map(a => a.sourceId)));
  const cases = [...packet.vitrines, ...fallback.filter(v => !existingCodes.has(v.code)).map(v => ({
    ...v, allocations: v.allocations.filter(a => !existingSources.has(a.sourceId)),
  }))].map(v => ({...v, allocations: v.allocations.filter(a => !replacements.has(a.sourceId))}));
  for (const extra of supplement.vitrines) {
    const target = cases.find(v => v.code === extra.code);
    if (!target) throw new Error(`Shelf supplement has no reviewed case ${extra.code}.`);
    target.allocations.push(...extra.allocations);
    const groupIds = new Set(target.groups.map(g => g.id));
    target.groups = [...target.groups, ...extra.groups.filter(g => !groupIds.has(g.id))];
    target.notes = [...(target.notes ?? []), ...(extra.notes ?? [])];
  }
  return {...packet, version: `${packet.version}:${supplement.version}`, vitrines: cases};
}
