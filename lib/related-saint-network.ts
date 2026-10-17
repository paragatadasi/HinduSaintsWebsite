type Edge = { fromSaintId: string; toSaintId: string };

// The caller supplies only published saints and published, publicly visible edges.
// Each successful level adds at least one saint, so targetCount bounds traversal.
export async function collectRelatedSaintDepths(
  rootSaintId: string,
  directRelationshipIds: string[],
  targetCount: number,
  loadPublishedSaintIds: (ids: string[], take?: number) => Promise<string[]>,
  loadPublicEdges: (frontier: string[]) => Promise<Edge[]>
) {
  const depthById = new Map<string, number>();
  let frontier = await loadPublishedSaintIds([...new Set(directRelationshipIds)].filter((id) => id !== rootSaintId));
  frontier.forEach((id) => depthById.set(id, 1));

  for (let depth = 2; frontier.length > 0 && depthById.size < targetCount; depth += 1) {
    const edges = await loadPublicEdges(frontier);
    const candidates = [...new Set(edges.flatMap(({ fromSaintId, toSaintId }) => [fromSaintId, toSaintId]))]
      .filter((id) => id !== rootSaintId && !depthById.has(id));
    frontier = await loadPublishedSaintIds(candidates, targetCount - depthById.size);
    frontier.forEach((id) => depthById.set(id, depth));
  }

  return depthById;
}
