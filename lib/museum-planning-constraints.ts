// Curator-confirmed physical constraints, independent of suggested-plan versions.
export function requiredPlanningVitrine(museumId: string, section: string): string | null {
 return museumId === "museum-vrindavan" && section === "Sikh & Punjab Traditions" ? "11" : null;
}

export function planningVitrineAllowed(museumId: string, section: string, vitrine: string) {
 const required = requiredPlanningVitrine(museumId, section);
 return !required || vitrine === required;
}
