import { createHash } from "node:crypto";
import packet from "../data/museum/spn-ram-bhakti-core-guide-v1.json";
import { projectScopedMoveGuide } from "./spn-datta-guide";
import { spnMovementBlockedReason } from "./spn-movement-holds";
import type { GuideDefinition } from "./spn-starter-guide-registry";
import type { StarterMoveGuide, PhysicalState } from "./spn-move-guide";

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}
const { contentDigest: _digest, ...content } = packet;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const pairs = packet.rows.map(row => [row.sourceId, row.destination]).sort((a,b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
const members = packet.groups.flatMap(group => group.sourceIds);
if (packet.contentDigest !== "7523006abcec85d26c6d2238d7e110b880c86ae78ca5fbf6f9dbadcda4c1c905" || hash(canonical(content)) !== packet.contentDigest || hash(JSON.stringify(pairs)) !== packet.assignmentDigest ||
  packet.version !== "spn-ram-bhakti-core-guide-2026-10-28-v1" || packet.rows.length !== 7 ||
  new Set(members).size !== 7 || members.length !== 7 ||
  packet.rows.some(row => row.destination !== "80" || !members.includes(row.sourceId))) throw new Error("The approved Ram Bhakti core changed.");

export const ramBhaktiGuideContext = { guideVersion: packet.version, contentDigest: packet.contentDigest, assignmentDigest: packet.assignmentDigest };
export const ramBhaktiGuideDefinition: GuideDefinition = { context: ramBhaktiGuideContext,
  suggestions: [...packet.groups.map(group => ({ id: group.id, kind: "family" as const, sourceIds: group.sourceIds, targetVitrine: "80" })),
    ...packet.rows.map(row => ({ id: `row:${row.sourceId}`, kind: "row" as const, sourceIds: [row.sourceId], targetVitrine: row.destination }))],
  physicalScope: { allowClear: false, destinations: Object.fromEntries(pairs) } };
export const ramBhaktiMoveGuide: StarterMoveGuide = {
  version: packet.version, contentDigest: packet.contentDigest, assignmentDigest: packet.assignmentDigest,
  proposalVersion: packet.proposalVersion, title: packet.title, proposalLabel: packet.proposalLabel,
  phaseLabel: "Ram bhakti · 80", allowClear: false,
  entries: packet.rows.map(row => ({ ...row, family: packet.groups.find(group => group.sourceIds.includes(row.sourceId))?.title ?? "",
    movementBlockedReason: spnMovementBlockedReason(row.sourceId) })),
  vitrines: [{ code: "80", summary: "Ram bhakti core: distinct traditions and historical associations", families: packet.groups, cityGroups: [] }],
  alternatives: [], reportedPlacements: [], outgoingDependencies: packet.outgoingDependencies.map(row => ({ ...row, previousProposedVitrine: row.baselineDestination,
    proposedDestination: null, state: "Outside this phase; no relocation or cleared-space claim" }))
};
export function projectRamBhaktiGuide(current: Parameters<typeof projectScopedMoveGuide>[1], physical: PhysicalState) {
  return projectScopedMoveGuide(ramBhaktiMoveGuide, current, physical);
}
