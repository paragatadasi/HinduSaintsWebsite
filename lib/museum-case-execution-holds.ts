const retainedSikhCases = new Set(["64", "65", "66", "67", "68"]);
const retainedSikhDisplay = "Sikh display retained here pending the new room; temporary Southern placement under review.";

type Location = { kind?: string; code?: string; museumId?: string } | null | undefined;

export function spnCaseExecutionHold(code: string): string | null {
  return retainedSikhCases.has(code) ? retainedSikhDisplay : null;
}

export function spnPhysicalExecutionHold(from: Location, to: Location): string | null {
  const held = (location: Location) => {
    if (location?.museumId && location.museumId !== "museum-spn") return null;
    const code = location?.kind === "shelf" ? location.code?.split("/")[0]
      : location?.kind === "vitrine" ? location.code : undefined;
    return code ? spnCaseExecutionHold(code) : null;
  };
  return held(from) ?? held(to);
}
