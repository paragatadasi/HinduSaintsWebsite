import display from "../data/museum/spn-display-regions-v4.json";

// Presentation only: current physical case numbers, never placement or identity data.
export const spnDisplayRegions: Record<string, string> = display.labels;
export const spnDisplayMemberships: Record<string, string[]> = {...display.memberships,"14":["C"],"15":["C"]};
export const spnDisplayShortLabels: Record<string, string> = {
 N:"North", B:"Vraj & Ganga", E:"East", W:"West", S:"South", K:"Sikh & Udasin", C:"Bhakti Marga",
};
const base: Record<string, string> = {...display.regionByVitrine,"14":"C","15":"C"};
const blends: Record<string, string> = display.blendTones;
export const spnDisplayTones: Record<string, string> = Object.fromEntries([
  ...Object.keys(base).map(number => [number, blends[number] ?? base[number]]),
  ...display.neutralCases.filter(number=>number!=="14"&&number!=="15").map(number => [number, "R"]),
]);
export function spnDisplayLabel(number: string) {
  return (spnDisplayMemberships[number] ?? []).map(region => spnDisplayRegions[region]).join(" / ");
}
export function spnDisplayMatches(number: string, region: string | null) {
  return !region || (spnDisplayMemberships[number] ?? []).includes(region);
}
