// PostgreSQL JSON objects may return keys in a different order than browser form state.
export function intakeFieldsEqual(left: Record<string, string | undefined>, right: Record<string, string | undefined>) {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].every(key => (left[key] ?? "") === (right[key] ?? ""));
}

type RelicFormFields = {
  id: string;
  relicDescription: string;
  broughtByRaw?: string;
  relicPlaceRaw?: string;
};

export function intakeRelicPayload(relic: RelicFormFields) {
  return {
    id: relic.id,
    relicDescription: relic.relicDescription,
    broughtByRaw: relic.broughtByRaw?.trim() || undefined,
    relicPlaceRaw: relic.relicPlaceRaw?.trim() || undefined,
  };
}

export function intakeRelicsEqual(left: RelicFormFields[], right: RelicFormFields[]) {
  return JSON.stringify(left.map(intakeRelicPayload)) === JSON.stringify(right.map(intakeRelicPayload));
}
