// Concept versions describe the approved design lineage, not artifact filenames.
export const currentSpnConceptLabel = "East–North connections · v4 · current";
export const spnProposalLabels: Record<string, { label: string; versionLabel: string; group: "candidate" | "earlier" }> = {
  "spn-approved-refinements-2026-10-28-v1": { label: "East–North connections · current refinements", versionLabel: "East–North connections · refined 28 October", group: "candidate" },
  "spn-highlighted-anchor-city-refinement-2026-10-27-v16": { label: currentSpnConceptLabel, versionLabel: "East–North connections · v4", group: "candidate" },
  "spn-sikh-north-connections-2026-10-27-v8": { label: "East–North connections · v3 · refined interim", versionLabel: "East–North connections · v3", group: "candidate" },
  "spn-sikh-north-connections-2026-10-26-v1": { label: "East–North connections · v3 · Sikh–North interim", versionLabel: "East–North connections · v3", group: "candidate" },
  "spn-vraj-girnar-alternative-2026-10-26-v1": { label: "East–North connections · v2", versionLabel: "East–North connections · v2", group: "candidate" },
  "spn-east-cave-room-alternative-2026-10-26-v2": { label: "East–North connections · v1", versionLabel: "East–North connections · v1", group: "earlier" },
  "spn-proposal-16-revision-2026-10-25-r1": { label: "Compact regional neighborhoods · v3", versionLabel: "Compact regional neighborhoods · v3", group: "candidate" },
  "compact-baseline-v16": { label: "Compact regional neighborhoods · v2", versionLabel: "Compact regional neighborhoods · v2", group: "earlier" },
  "compact-baseline-v15": { label: "Compact regional neighborhoods · v1", versionLabel: "Compact regional neighborhoods · v1", group: "earlier" },
  "archived-earlier": { label: "Compact regional neighborhoods · baseline study", versionLabel: "Baseline study", group: "earlier" },
};
