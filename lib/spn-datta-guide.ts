import { createHash } from "node:crypto";
import packet from "../data/museum/spn-datta-move-guide-v2.json";
import { MuseumMoveSessionError } from "./museum-move-session-domain";
import { spnMovementBlockedReason } from "./spn-movement-holds";
import { projectStarterDisplayTiers } from "./spn-live-display-tiers";
import type { GuideDefinition, RegisteredSuggestion } from "./spn-starter-guide-registry";
import type { CompanionRow, GuideGroup, PhysicalState, StarterMoveGuide } from "./spn-move-guide";

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}
const { contentDigest: _digest, ...content } = packet;
const digest = createHash("sha256").update(canonical(content)).digest("hex");
const sourceIds = new Set(packet.rows.map(row => row.sourceId));
if (packet.version !== "spn-datta-move-guide-phase-2026-10-28-v2" || digest !== packet.contentDigest ||
  digest !== "9c50c15146eb0a0b9f8375ee7afbf4efde9d5fc3ae9baa2b971ab36ff7f3692d" ||
  packet.rosterDigest !== "1225116aaf368a9004b502375585b3c8d2d2945a088e93d69bb0c9e69bfa8149" ||
  sourceIds.size !== 48 || packet.rows.length !== 48) throw new Error("The locked Datta guide changed.");

const suggestions: RegisteredSuggestion[] = [];
const membership = new Set<string>();
function groupFor(group: (typeof packet.vitrines)[number]["families"][number], code: string, kind: "family" | "city"): GuideGroup {
  for (const id of group.sourceIds) {
    if (membership.has(id) || !packet.rows.some(row => row.sourceId === id && row.vitrine === code)) throw new Error("The Datta group partition changed.");
    membership.add(id);
  }
  suggestions.push({ id: group.id, kind, sourceIds: group.sourceIds, targetVitrine: code });
  return { ...group, suggestedVitrines: [code], allowedTargetVitrines: [] };
}
const vitrines = packet.vitrines.map(vitrine => ({ code: vitrine.code, summary: vitrine.summary,
  families: vitrine.families.map(group => groupFor(group, vitrine.code, "family")),
  cityGroups: vitrine.cityGroups.map(group => groupFor(group, vitrine.code, "city")) }));
for (const row of packet.rows) suggestions.push({ id: `row:${row.sourceId}`, kind: "row", sourceIds: [row.sourceId], targetVitrine: row.vitrine });
if (membership.size !== 48 || new Set(suggestions.map(row => row.id)).size !== suggestions.length ||
  vitrines.map(v => v.code).join(",") !== "3,81,82") throw new Error("The Datta guide membership changed.");

export const dattaGuideContext = { guideVersion: packet.version, contentDigest: packet.contentDigest, assignmentDigest: packet.rosterDigest };
export const dattaGuideDefinition: GuideDefinition = { context: dattaGuideContext, suggestions,
  physicalScope: { allowClear: false, destinations: Object.fromEntries(packet.rows.map(row => [row.sourceId, row.vitrine])) } };
export const dattaMoveGuide: StarterMoveGuide = {
  version: packet.version, contentDigest: packet.contentDigest, proposalVersion: packet.proposalVersion,
  assignmentDigest: packet.rosterDigest, title: packet.title, proposalLabel: packet.proposalLabel,
  allowClear: false, phaseLabel: "Datta · 3, 81 & 82", outgoingDependencies: packet.outgoingDependencies,
  entries: packet.rows.map(row => ({ sourceId: row.sourceId, saintId: row.saintId, name: row.name, tier: row.tier,
    city: row.city, relicDescription: row.relicDescription ?? "", destination: row.vitrine, section: row.section,
    family: row.family, rationale: row.placementReason.text, reviewNotes: row.reviewNotes,
    movementBlockedReason: row.movementBlockedReason || spnMovementBlockedReason(row.sourceId),
    lifeStatus: row.lifeStatus })),
  vitrines, alternatives: [], reportedPlacements: []
};

// Current physical state comes from the ledger reader, never the captured packet's currentLocation.
export function projectDattaGuide(current: Parameters<typeof projectStarterDisplayTiers>[1], physical: PhysicalState) {
  return projectScopedMoveGuide(dattaMoveGuide, current, physical);
}

export function projectScopedMoveGuide(captured: StarterMoveGuide, current: Parameters<typeof projectStarterDisplayTiers>[1], physical: PhysicalState) {
  const guide = projectStarterDisplayTiers(captured, current);
  const grouped = new Map<string, CompanionRow[]>();
  for (const row of physical.rows) grouped.set(row.sourceId, [...(grouped.get(row.sourceId) ?? []), row]);
  return { ...guide, entries: guide.entries.map(entry => {
    const rows = grouped.get(entry.sourceId) ?? [];
    const row = rows.length === 1 ? rows[0] : null;
    const identityMatches = row && !row.identityChanged && row.saintId === entry.saintId;
    return { ...entry, currentLocation: identityMatches ? row.current : null,
      currentLocationBasis: identityMatches ? row.currentBasis : "unknown",
      movementBlockedReason: entry.movementBlockedReason || (identityMatches ? row.movementBlockedReason ?? undefined : "Reload and review this source identity before moving it.") };
  }) };
}

export function assertGuidePhysicalScope(guide: GuideDefinition, records: { sourceId: string; to: { kind: string; code: string } }[], clearedVitrines: string[] = []) {
  if (!guide.physicalScope) return;
  if (!guide.physicalScope.allowClear && clearedVitrines.length) throw new MuseumMoveSessionError(409, "This phase does not clear whole vitrines. Keep outgoing placements separate.");
  for (const row of records) if (row.to.kind !== "vitrine" || guide.physicalScope.destinations[row.sourceId] !== row.to.code)
    throw new MuseumMoveSessionError(409, "Choose a source and destination from this locked phase. Staging and alternative targets are unavailable.");
}
