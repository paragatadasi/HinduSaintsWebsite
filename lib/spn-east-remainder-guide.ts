import {canPlacePagalComponent,isPagalComponentPlaced} from "./spn-pagal-component-placement";
import {createHash} from "node:crypto";
import packet from "../data/museum/spn-puri-odisha-approved-v4.json";
import {eastRemainderMoveGuide as priorGuide, eastRemainderGuideContext as priorContext, projectEastRemainderGuide as projectPriorGuide} from "./spn-east-remainder-guide-v1";
import {projectScopedMoveGuide} from "./spn-datta-guide";
import {spnMovementBlockedReason} from "./spn-movement-holds";
import {MuseumMoveSessionError} from "./museum-move-session-domain";
import type {MuseumSaintPlacement} from "./museum-proposals";
import type {ShelfPlanningContext} from "./museum-shelf-planning-context";
import type {GuideDefinition} from "./spn-starter-guide-registry";
import type {GuideGroup, PhysicalState, StarterMoveGuide} from "./spn-move-guide";

const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const preserved = priorGuide.entries.filter(row => row.destination === "24");
const contextIds = new Set(packet.rows.filter(row => row.contextOnlyUntilHoldingConfirmed).map(row => row.sourceId));
if (packet.rows.length !== 37 || new Set(packet.rows.map(row => row.sourceId)).size !== 37 || packet.rows.filter(row => row.proposedVitrine === "25").length !== 17 || packet.rows.some(row => row.suggestedShelfIndex !== null)) throw new Error("The approved Puri/Odisha roster changed.");

function groups(code: "25" | "26") {
  const headline = packet.headlineStories[code];
  const storyIds = code === "25" ? headline.sourceIds : packet.rows.filter(row => row.proposedVitrine === code && row.group === "Bhubaneswar").map(row => row.sourceId);
  const families: GuideGroup[] = [{id: `puri-odisha:${code}:headline`, title: headline.title, sourceIds: storyIds, rationale: headline.relationship, suggestedVitrines: [code], edges: []}];
  const cities = new Map<string, string[]>();
  for (const row of packet.rows.filter(row => row.proposedVitrine === code && !contextIds.has(row.sourceId) && !storyIds.includes(row.sourceId))) cities.set(row.group, [...(cities.get(row.group) ?? []), row.sourceId]);
  const cityGroups: GuideGroup[] = [];
  for (const [title, sourceIds] of cities) {
    const group: GuideGroup = {id: `puri-odisha:${code}:${sourceIds[0]}`, title, sourceIds, rationale: "", suggestedVitrines: [code], edges: []};
    if (title === "Baya Baba & Pagal Baba" || sourceIds.includes("recIktBD8n1j13qh9")) families.push({...group, rationale: "Recorded display group; identity and object qualifications remain attached to each record."});
    else cityGroups.push(group);
  }
  return {families, cityGroups};
}
export const eastRemainderGuideContext = {
  guideVersion: "spn-east-puri-odisha-2026-11-01-v2",
  contentDigest: hash([packet, priorContext.contentDigest]),
  assignmentDigest: hash([...preserved.map(row => [row.sourceId, row.destination]), ...packet.rows.map(row => [row.sourceId, row.proposedVitrine])].sort()),
};
export const eastRemainderMoveGuide: StarterMoveGuide = {
  ...eastRemainderGuideContext, version: eastRemainderGuideContext.guideVersion,
  proposalVersion: packet.version, title: "East", phaseLabel: "East",
  allowClear: true, clearancePerDestination: true,
  requiredClearVitrines: ["25", "26", "24"], clearanceRequiredDestinations: ["25", "26", "24"], preparationVitrines: ["25", "26", "24"], previousClearanceVersions: [priorContext.guideVersion],
  entries: [...preserved, ...packet.rows.map(row => ({sourceId: row.sourceId, saintId: row.saintId, name: row.name, tier: row.tier, city: row.city, relicDescription: row.relicDescription ?? "", destination: row.proposedVitrine,
    section: "Jagannath-Puri & Odisha", family: "", rationale: "", reviewOnly: row.contextOnlyUntilHoldingConfirmed,
    reviewNotes: row.alerts, reviewNotesCollapsible: true,
    movementBlockedReason: row.executionReviewRequired ? row.alerts.join(" ") || "Confirm this holding before recording a move." : undefined,
    lifeStatus: {tag: row.lifeTag, basis: "Reviewed collection evidence; current saint status takes precedence."}}))],
  vitrines: [
    ...(["25", "26"] as const).map(code => ({code, summary: packet.headlineStories[code].title, fitGuidance: code === "26" ? "Durgaprasad's large display and the arm support remain unmeasured. Shelf recommendations will follow a separate review." : "Shelf recommendations will follow a separate review.", ...groups(code)})),
    ...priorGuide.vitrines.filter(v => v.code === "24"),
  ],
  contextAnchors: packet.rows.filter(row => contextIds.has(row.sourceId)).map(row => ({sourceId: row.sourceId, name: row.name, destination: row.proposedVitrine, rationale: "Context only · holding to confirm", reviewNotes: row.alerts})),
  alternatives: [], reportedPlacements: [],
};
export const eastRemainderGuideDefinition: GuideDefinition = {
  context: eastRemainderGuideContext, previousVersions: [priorContext.guideVersion],
  suggestions: [
    ...eastRemainderMoveGuide.vitrines.flatMap(v => [...v.families.map(g => ({id: g.id, kind: "family" as const, sourceIds: g.sourceIds, targetVitrine: v.code})), ...v.cityGroups.map(g => ({id: g.id, kind: "city" as const, sourceIds: g.sourceIds, targetVitrine: v.code}))]),
    ...eastRemainderMoveGuide.entries.filter(row => !row.reviewOnly).map(row => ({id: `row:${row.sourceId}`, kind: "row" as const, sourceIds: [row.sourceId], targetVitrine: row.destination})),
  ],
  physicalScope: {allowClear: true, clearVitrines: ["25", "26", "24"], clearanceRequiredDestinations: ["25", "26", "24"], clearancePerDestination: true, preparationVitrines: ["25", "26", "24"], previousClearanceVersions: [priorContext.guideVersion], destinations: Object.fromEntries(eastRemainderMoveGuide.entries.filter(row => !row.reviewOnly).map(row => [row.sourceId, row.destination]))},
};
type Review = {rows: {sourceId: string; saintId: string | null; effectiveVitrine: string | null}[]; proposal: {pendingPlacements: {sourceId: string; reason: string}[]}};
export function projectEastRemainderGuide(current: MuseumSaintPlacement[], physical: PhysicalState, context: ShelfPlanningContext, review: Review): StarterMoveGuide {
  const old = projectPriorGuide(current, physical, context);
  const projected = projectScopedMoveGuide(eastRemainderMoveGuide, current, physical);
  const outgoing: NonNullable<StarterMoveGuide["outgoingDependencies"]> = [];
  const entries = projected.entries.flatMap(entry => {
    if (entry.destination === "24") return old.entries.filter(row => row.sourceId === entry.sourceId);
    const captured = packet.rows.find(row => row.sourceId === entry.sourceId)!;
    if (entry.reviewOnly) return [entry];
    const live = review.rows.filter(row => row.sourceId === entry.sourceId);
    const scoped = physical.rows.find(row => row.sourceId === entry.sourceId);
    if (scoped && (canPlacePagalComponent(scoped, entry.destination) || isPagalComponentPlaced(scoped, entry.destination)) && live.length === 1 && live[0].saintId === entry.saintId && ["25", "26"].includes(live[0].effectiveVitrine ?? "")) return [{...entry, reviewOnly: false, componentScope: "vitrine_19_contents_only" as const, movementBlockedReason: undefined, reviewNotes: [...(entry.reviewNotes ?? []), "Move only the non-stick contents cleared from Vitrine 19. Walking sticks remain excluded; their location is unverified."]}];
    if (entry.sourceId === "rec7GxgNvmubmTvMM" && live.length === 1 && live[0].effectiveVitrine === "26") return [{...entry, reviewOnly: true, movementBlockedReason: `Approved Vitrine 25 story; the native destination remains ${live[0].effectiveVitrine ?? "pending"} until the ordinary relics and separate stick housing are reviewed.`, reviewNotes: [...(entry.reviewNotes ?? []), "No physical move is authorized by this story allocation."]}];
    if (live.length === 1 && live[0].effectiveVitrine !== entry.destination) {
      outgoing.push({sourceId: entry.sourceId, name: entry.name, previousProposedVitrine: entry.destination, proposedDestination: live[0].effectiveVitrine, state: "Newer curator destination retained"}); return [];
    }
    const source = physical.rows.filter(row => row.sourceId === entry.sourceId);
    const pending = review.proposal.pendingPlacements.find(row => row.sourceId === entry.sourceId);
    const reason = entry.movementBlockedReason || spnMovementBlockedReason(entry.sourceId, source[0]) ||
      (source.length !== 1 || source[0].identityChanged || source[0].saintId !== entry.saintId || source[0].sourceRevision !== captured.sourceRevision ? "Source evidence changed. Review this entry before recording a move." :
      source[0].verifiedItemIds.length ? "Use the verified inventory item workflow to preserve its history." : source[0].fixedHousing ? "Review this fixed display before recording a move." :
      live.length !== 1 || live[0].saintId !== entry.saintId || pending ? pending?.reason || "Review the current proposal before recording a move." : undefined);
    return [{...entry, movementBlockedReason: reason}];
  });
  const ids = new Set(entries.map(row => row.sourceId));
  const filter = (groups: GuideGroup[]) => groups.map(group => ({...group, sourceIds: group.sourceIds.filter(id => ids.has(id))})).filter(group => group.sourceIds.length);
  return {...projected, entries, vitrines: projected.vitrines.map(v => v.code === "24" ? old.vitrines.find(row => row.code === "24")! : {...v, families: filter(v.families), cityGroups: filter(v.cityGroups)}), outgoingDependencies: [...(old.outgoingDependencies ?? []).filter(row => row.previousProposedVitrine === "24"), ...outgoing]};
}
export function assertEastRemainderRecords(records: {sourceId: string; to: {kind: string; code: string}}[], guide: StarterMoveGuide) {
  for (const record of records) {
    const entry = guide.entries.find(row => row.sourceId === record.sourceId);
    if (!entry || entry.reviewOnly || entry.movementBlockedReason || record.to.kind !== "vitrine" || record.to.code !== entry.destination) throw new MuseumMoveSessionError(409, "This Eastern source or assignment changed. Reload the current guide before recording a move.");
  }
}
