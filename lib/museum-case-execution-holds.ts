const retainedSikhCases = new Set(["64", "65", "66", "67", "68"]);
const retainedSikhDisplay = "Sikh display retained here pending the new room; temporary Southern placement under review.";

type Location = { kind?: string; code?: string } | null | undefined;

export function spnCaseExecutionHold(code: string): string | null {
  return retainedSikhCases.has(code) ? retainedSikhDisplay : null;
}

export function spnPhysicalExecutionHold(from: Location, to: Location): string | null {
  return (from?.kind === "vitrine" && from.code ? spnCaseExecutionHold(from.code) : null)
    ?? (to?.kind === "vitrine" && to.code ? spnCaseExecutionHold(to.code) : null);
}
