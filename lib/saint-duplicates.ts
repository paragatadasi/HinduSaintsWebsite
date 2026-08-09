import { getIdentitySearchForms } from "@/lib/search-text";

export type DuplicateScanSaint = {
  id: string;
  displayName: string;
  canonicalName: string;
  birthYear?: number | null;
  birthYearEnd?: number | null;
  samadhiYear?: number | null;
  samadhiYearEnd?: number | null;
  aliases?: Array<{ alias: string }>;
  places?: Array<{ placeId: string }>;
  traditions?: Array<{ traditionId: string }>;
};

export type DuplicateEvidence = {
  version: 1;
  score: number;
  nameSimilarity: number;
  exactIdentityForm: boolean;
  matchedNames: [string, string];
  sharedBirthRange: boolean;
  sharedSamadhiRange: boolean;
  sharedPlaceIds: string[];
  sharedTraditionIds: string[];
  reasons: string[];
};

export type SaintDuplicateCandidate = {
  entityId: string;
  candidateEntityId: string;
  confidence: "high" | "medium" | "low";
  evidence: DuplicateEvidence;
};

export function buildSaintDuplicateCandidates(saints: readonly DuplicateScanSaint[]) {
  const candidates: SaintDuplicateCandidate[] = [];
  const indicesByKey = new Map<string, number[]>();
  saints.forEach((saint, index) => {
    for (const key of blockingKeys(saint)) {
      const indices = indicesByKey.get(key) ?? [];
      indices.push(index);
      indicesByKey.set(key, indices);
    }
  });
  const pairIndices = new Set<string>();
  for (const indices of indicesByKey.values()) {
    for (let left = 0; left < indices.length; left += 1) {
      for (let right = left + 1; right < indices.length; right += 1) {
        pairIndices.add(`${Math.min(indices[left], indices[right])}:${Math.max(indices[left], indices[right])}`);
      }
    }
  }
  for (const pair of pairIndices) {
    const [leftIndex, rightIndex] = pair.split(":").map(Number);
    const candidate = compareSaintsForDuplicate(saints[leftIndex], saints[rightIndex]);
    if (candidate) candidates.push(candidate);
  }

  return candidates.sort((left, right) => right.evidence.score - left.evidence.score);
}

export function compareSaintsForDuplicate(left: DuplicateScanSaint, right: DuplicateScanSaint): SaintDuplicateCandidate | null {
  const nameMatch = bestNameMatch(left, right);
  const sharedBirthRange = rangesOverlap(left.birthYear, left.birthYearEnd, right.birthYear, right.birthYearEnd);
  const sharedSamadhiRange = rangesOverlap(left.samadhiYear, left.samadhiYearEnd, right.samadhiYear, right.samadhiYearEnd);
  const sharedPlaceIds = intersection(left.places?.map((item) => item.placeId), right.places?.map((item) => item.placeId));
  const sharedTraditionIds = intersection(left.traditions?.map((item) => item.traditionId), right.traditions?.map((item) => item.traditionId));
  const contextSignals = Number(sharedBirthRange) + Number(sharedSamadhiRange) + Number(sharedPlaceIds.length > 0) + Number(sharedTraditionIds.length > 0);

  if (!nameMatch.exact && nameMatch.similarity < 0.82 && !(nameMatch.similarity >= 0.72 && contextSignals > 0)) return null;

  const contextScore = Math.min(0.2, contextSignals * 0.06);
  const score = round(Math.min(1, nameMatch.similarity * 0.8 + contextScore + (nameMatch.exact ? 0.14 : 0)));
  const reasons = [
    nameMatch.exact ? "Exact normalized name or alias" : `Similar normalized names (${Math.round(nameMatch.similarity * 100)}%)`,
    sharedBirthRange ? "Overlapping birth year" : null,
    sharedSamadhiRange ? "Overlapping samadhi year" : null,
    sharedPlaceIds.length > 0 ? `${sharedPlaceIds.length} shared place${sharedPlaceIds.length === 1 ? "" : "s"}` : null,
    sharedTraditionIds.length > 0 ? `${sharedTraditionIds.length} shared tradition${sharedTraditionIds.length === 1 ? "" : "s"}` : null
  ].filter((reason): reason is string => Boolean(reason));
  const [entityId, candidateEntityId] = [left.id, right.id].sort();

  return {
    entityId,
    candidateEntityId,
    confidence: score >= 0.94 ? "high" : score >= 0.8 ? "medium" : "low",
    evidence: {
      version: 1,
      score,
      nameSimilarity: round(nameMatch.similarity),
      exactIdentityForm: nameMatch.exact,
      matchedNames: [nameMatch.left, nameMatch.right],
      sharedBirthRange,
      sharedSamadhiRange,
      sharedPlaceIds,
      sharedTraditionIds,
      reasons
    }
  };
}

export function duplicatePairKey(leftId: string, rightId: string) {
  return [leftId, rightId].sort().join(":");
}

export function duplicateDecisionUpdate(decision: "confirm" | "ignore" | "defer" | "reopen") {
  if (decision === "confirm") return { finalized: true, status: "resolved" as const };
  if (decision === "ignore") return { finalized: true, status: "ignored" as const };
  return { finalized: false, status: "open" as const };
}

function bestNameMatch(left: DuplicateScanSaint, right: DuplicateScanSaint) {
  const leftNames = saintNames(left);
  const rightNames = saintNames(right);
  let best = { exact: false, left: left.displayName, right: right.displayName, similarity: 0 };

  for (const leftName of leftNames) {
    for (const rightName of rightNames) {
      for (const leftForm of getIdentitySearchForms(leftName)) {
        for (const rightForm of getIdentitySearchForms(rightName)) {
          if (leftForm.length < 4 || rightForm.length < 4) continue;
          const exact = leftForm === rightForm;
          const similarity = exact ? 1 : Math.max(characterSimilarity(leftForm, rightForm), tokenSimilarity(leftForm, rightForm));
          if (similarity > best.similarity) best = { exact, left: leftName, right: rightName, similarity };
        }
      }
    }
  }

  return best;
}

function saintNames(saint: DuplicateScanSaint) {
  return Array.from(new Set([saint.displayName, saint.canonicalName, ...(saint.aliases ?? []).map((alias) => alias.alias)].filter(Boolean)));
}

function blockingKeys(saint: DuplicateScanSaint) {
  const keys = saintNames(saint).flatMap((name) => {
    const forms = getIdentitySearchForms(name).filter((form) => form.length >= 4);
    const minimumTokenCount = Math.min(...forms.map((form) => form.split(" ").length));
    return forms.filter((form) => form.split(" ").length === minimumTokenCount).map((form) => form.slice(0, 3));
  });
  return Array.from(new Set(keys));
}

function characterSimilarity(left: string, right: string) {
  const maximumLength = Math.max(left.length, right.length);
  return maximumLength === 0 ? 0 : 1 - levenshtein(left, right) / maximumLength;
}

function tokenSimilarity(left: string, right: string) {
  const leftTokens = new Set(left.split(" ").filter(Boolean));
  const rightTokens = new Set(right.split(" ").filter(Boolean));
  const shared = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union === 0 ? 0 : shared / union;
}

function levenshtein(left: string, right: string) {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current.push(Math.min(
        previous[rightIndex] + 1,
        current[rightIndex - 1] + 1,
        previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1)
      ));
    }
    previous = current;
  }
  return previous[right.length];
}

function rangesOverlap(leftStart?: number | null, leftEnd?: number | null, rightStart?: number | null, rightEnd?: number | null) {
  if (leftStart == null || rightStart == null) return false;
  return leftStart <= (rightEnd ?? rightStart) && rightStart <= (leftEnd ?? leftStart);
}

function intersection(left: string[] = [], right: string[] = []) {
  const rightSet = new Set(right);
  return Array.from(new Set(left.filter((value) => rightSet.has(value)))).sort();
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}
