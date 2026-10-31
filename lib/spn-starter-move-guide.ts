import treeBase from "@/data/museum/spn-starter-move-guide-v3.json";
import treeOverlay from "@/data/museum/spn-vitrine-two-tree-v1.json";
import { starterAmendedProposal as proposal } from "./spn-starter-amended-proposal";
import { registeredStarterGuide as packet } from "./spn-starter-guide-registry";
import { spnMovementBlockedReason } from "./spn-movement-holds";
import { currentSpnConceptLabel } from "./spn-proposal-labels";
import type { StarterMoveGuide, GuideGroup } from "./spn-move-guide";

const overlayBaseVitrine = treeBase.vitrines.find(vitrine => vitrine.code === treeOverlay.vitrine);
const overlayCurrentVitrine = packet.vitrines.find(vitrine => vitrine.code === treeOverlay.vitrine);
if (treeOverlay.baseGuideVersion !== treeBase.version || treeOverlay.baseContentDigest !== treeBase.contentDigest ||
 !overlayBaseVitrine || !overlayCurrentVitrine) {
 throw new Error("The Vitrine 2 tree needs review against the changed guide scope.");
}

const transitions = packet.transitionRowsOutsideStarter.map(transition => {
 const row = proposal.rows.find(row => row.sourceId === transition.sourceId);
 if (!row || row.vitrine !== transition.destination.vitrine) throw new Error("A transition no longer matches the reviewed proposal.");
 return row;
});
const primaryIds = new Set([...packet.rows, ...transitions].map(row => row.sourceId));
const references = packet.cityAlternatives.flatMap(cohort => cohort.sourceIds.filter(id => !primaryIds.has(id)).map(id => {
 const row = proposal.rows.find(row => row.sourceId === id);
 if (!row) throw new Error("A locality reference is missing from the reviewed proposal.");
 return { sourceId: row.sourceId, saintId: row.saintId, name: row.name, tier: row.tier, city: cohort.city,
  relicDescription: "", destination: row.vitrine, section: row.section, family: "", rationale: cohort.rationale,
  reviewNotes: row.reviewNotes, movementBlockedReason: row.movementBlockedReason || spnMovementBlockedReason(row.sourceId) };
}));

export const starterMoveGuide: StarterMoveGuide = {
 optionalClearVitrines:["36"],
 version: packet.version, contentDigest: packet.contentDigest, proposalVersion: packet.proposalVersion,
 assignmentDigest: packet.assignmentDigest, title: packet.title, proposalLabel: currentSpnConceptLabel,
 transitionSourceIds: transitions.map(row => row.sourceId),
 reportedPlacements: packet.physicalConfirmations.moves.map(row => ({ sourceId: row.sourceId, destination: row.currentLocation.vitrine, date: row.confirmedDate })),
 entries: [...references, ...transitions.map(row => ({ sourceId: row.sourceId, saintId: row.saintId, name: row.name,
  tier: row.tier, city: "", relicDescription: "", destination: row.vitrine, section: row.section, family: "",
  rationale: "Revised proposal destination; the recorded physical placement remains separate.", reviewNotes: row.reviewNotes,
  movementBlockedReason: row.movementBlockedReason || spnMovementBlockedReason(row.sourceId) })),
  ...packet.rows.map(row => ({ sourceId: row.sourceId, saintId: row.saintId, name: row.name, tier: row.tier,
   city: row.planningCity || row.city, relicDescription: row.relicDescription ?? "", destination: row.vitrine,
   lifeStatus: row.lifeStatus, section: row.section, family: row.family ?? "", rationale: row.placementReason.text,
   reviewNotes: row.reviewNotes, movementBlockedReason: row.movementBlockedReason || spnMovementBlockedReason(row.sourceId) }))],
 vitrines: packet.vitrines.map(v => ({ code: v.code, summary: v.summary,
  families: v.families.map(g => ({ ...g, edges:"edges" in g?g.edges.map(edge=>({fromSourceId:edge.fromSourceId,toSourceId:edge.toSourceId,label:edge.evidenceStatus.includes("probable identity")?`${edge.label} · identity uncertain`:edge.evidenceStatus.includes("source")||edge.evidenceStatus.includes("collection")?`${edge.label} · source-recorded`:edge.label})):undefined, suggestedVitrines: [v.code], ...(v.code === treeOverlay.vitrine ? {edges: treeOverlay.familyTrees.flatMap(tree => tree.edges.flatMap(edge => edge.fromSourceIds.flatMap(fromSourceId => edge.toSourceIds.filter(toSourceId => g.sourceIds.includes(fromSourceId) && g.sourceIds.includes(toSourceId)).map(toSourceId => ({fromSourceId, toSourceId, label: edge.relationship})))))} : {}) })),
  cityGroups: v.cityGroups.map(g => ({ ...g, title: g.city, suggestedVitrines: [v.code] })) })),
 alternatives: packet.cityAlternatives.map((g): GuideGroup => ({ id: g.id, suggestionIdsByTarget: g.suggestionIdsByTarget,
  title: g.city, sourceIds: g.sourceIds, rationale: g.rationale, suggestedVitrines: [g.currentlySuggestedVitrine],
  allowedTargetVitrines: g.allowedTargetVitrines, saintCount: g.saintCount, unmatchedEntryCount: g.unmatchedEntryCount,
  relationshipReviewRequired: g.alternativeRequiresFamilyCheck,
  spaceEstimate: { label: `About ${g.knownShelfEstimate.toFixed(2)} source-shelf equivalents${g.unknownFootprintCount ? ` + ${g.unknownFootprintCount} unknown` : ""}`,
   basis: g.spaceBasis, confidence: "Planning estimate" } }))
};
