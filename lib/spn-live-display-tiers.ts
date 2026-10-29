import {activeSpnGuide} from "./spn-observation-suppression";
import type { MuseumSaintPlacement } from "./museum-proposals";
import type { StarterMoveGuide } from "./spn-move-guide";
import type { ExplorerOption } from "./spn-room-explorer";
import type { ExplorerObservation } from "./spn-room-proposal";

type TierRow = Pick<MuseumSaintPlacement, "id" | "sourceRecordId" | "saintId" | "tier" | "linkIssue" | "placementState">;

export function projectStarterDisplayTiers(guide: StarterMoveGuide, current: TierRow[]): StarterMoveGuide {
  guide = activeSpnGuide(guide);
  const bySaint = new Map<string, TierRow[]>();
  for (const row of current) if (row.saintId) bySaint.set(row.saintId, [...(bySaint.get(row.saintId) ?? []), row]);
  return { ...guide, entries: guide.entries.map(entry => {
    if (!entry.saintId) return entry;
    const candidates = bySaint.get(entry.saintId) ?? [];
    const exact = candidates.filter(row => row.sourceRecordId === entry.sourceId || row.id === entry.sourceId);
    const matches = exact.length ? exact : candidates;
    const row = matches.length === 1 ? matches[0] : null;
    if (!row || row.linkIssue || row.placementState?.startsWith("Conflicting")) return { ...entry,
      reviewNotes: [...(entry.reviewNotes ?? []), "Current tier needs review; showing the guide's captured tier."] };
    return { ...entry, tier: row.tier === "Featured" ? "Primary" : row.tier };
  }) };
}

export function projectCurrentPrimaryAnchors(option: ExplorerOption, rows: ExplorerObservation[]): ExplorerOption {
  const byCase = new Map<string, Map<string, string>>();
  for (const row of rows) {
    if (row.unresolved || !["Primary", "Featured"].includes(row.tier)) continue;
    const members = byCase.get(row.effectiveVitrine) ?? new Map<string, string>();
    members.set(row.saintId || row.sourceId, row.name);
    byCase.set(row.effectiveVitrine, members);
  }
  return { ...option, primeAnchors: Object.fromEntries([...byCase].map(([code, members]) => [code, {
    people: [...members.values()].join(" · "),
    reason: option.primeAnchors[code]?.reason ?? "Current SPN Primary saints; physical placement remains separate.",
  }])) };
}
