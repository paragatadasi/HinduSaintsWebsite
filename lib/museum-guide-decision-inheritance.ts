import type { GuideDefinition, RegisteredSuggestion } from "./spn-starter-guide-registry";

type Decision = { suggestionId: string; decision: string; note: string | null; version: number; updatedAt: Date };
const scope = (suggestion: RegisteredSuggestion) => JSON.stringify([suggestion.kind, suggestion.targetVitrine, [...suggestion.sourceIds].sort()]);

export function inheritGuideDecisions(guide: GuideDefinition, current: Decision[], previous: { guide: GuideDefinition; decisions: Decision[] }[]) {
  const result: (Decision & { inheritedFrom?: { guideVersion: string; suggestionId: string; version: number } })[] = [...current];
  for (const suggestion of guide.suggestions) {
    if (result.some(row => row.suggestionId === suggestion.id)) continue;
    for (const history of previous) {
      const equivalent = history.guide.suggestions.find(row => scope(row) === scope(suggestion));
      const decision = equivalent && history.decisions.find(row => row.suggestionId === equivalent.id);
      if (!decision) continue;
      // No new-version row exists yet; the first explicit save must use version zero.
      result.push({ ...decision, suggestionId: suggestion.id, version: 0,
        inheritedFrom: { guideVersion: history.guide.context.guideVersion, suggestionId: decision.suggestionId, version: decision.version } });
      break;
    }
  }
  return result;
}
