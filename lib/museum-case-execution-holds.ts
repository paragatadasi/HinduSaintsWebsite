type Location = { kind?: string; code?: string; museumId?: string } | null | undefined;

// Curators can record operational moves independently of the proposed room plan.
export function spnCaseExecutionHold(_code: string): string | null { return null; }
export function spnPhysicalExecutionHold(_from: Location, _to: Location): string | null { return null; }
