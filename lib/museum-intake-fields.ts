// PostgreSQL JSON objects may return keys in a different order than browser form state.
export function intakeFieldsEqual(left: Record<string, string | undefined>, right: Record<string, string | undefined>) {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].every(key => (left[key] ?? "") === (right[key] ?? ""));
}
