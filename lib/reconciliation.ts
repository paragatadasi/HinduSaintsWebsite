export function confidenceForNameMatch(extractedName: string, candidateName: string) {
  const left = extractedName.trim().toLowerCase();
  const right = candidateName.trim().toLowerCase();

  if (!left || !right) return "low";
  if (left === right) return "high";
  if (left.includes(right) || right.includes(left)) return "medium";
  return "low";
}
