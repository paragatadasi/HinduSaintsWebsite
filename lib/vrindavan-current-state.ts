import {createHash} from "node:crypto";
import {db} from "@/lib/db";
import type {Prisma} from "@/lib/generated/prisma/client";
import {readMuseumData} from "./museum-working-data";
import {readVrindavanWorkingData} from "./vrindavan-working-data";
import {readVrindavanIdentityReview} from "./vrindavan-identity-review";
import {buildVrindavanReviewBatches} from "./vrindavan-review-batches";
import {stableCollectionJson} from "./museum-collection-domain";
import plan from "../data/museum/vrindavan-region-parent-plan.json";
type Client=Prisma.TransactionClient;
// Private read-only export; callers enforce museum access and full-catalogue access.
// A family record or suggested grouping is not evidence that its membership was reviewed.
export async function readVrindavanCurrentState(client:Client=db){
 const working=await readVrindavanWorkingData(client);
 const ids=[...new Set(working.placements.flatMap(p=>p.saintId?[p.saintId]:[]))].sort();
 const [canonical,curator,arrangements,identity,spn]=await Promise.all([
  client.saint.findMany({where:{id:{in:ids},status:{not:"archived"}},select:{id:true,slug:true,displayName:true,canonicalName:true,status:true,publicationStatus:true,teamVisibility:true,version:true,aliases:{select:{alias:true},orderBy:{id:"asc"}},places:{include:{place:true},orderBy:{id:"asc"}},traditions:{include:{tradition:true},orderBy:{id:"asc"}},familyMemberships:{include:{family:true},orderBy:{id:"asc"}}},orderBy:{id:"asc"}}),
  client.museumCuratorProposal.findMany({where:{museumId:"museum-vrindavan"},orderBy:{saintId:"asc"}}),
  client.museumArrangement.findMany({where:{museumId:"museum-vrindavan"},orderBy:{placementId:"asc"}}),
  readVrindavanIdentityReview(client),readMuseumData(client)
 ]);
 const review=buildVrindavanReviewBatches(identity.rows,working.audit.snapshotHash??undefined);
 const rows=canonical.map(saint=>{
  const current=working.placements.find(p=>p.saintId===saint.id)!;
  const inherited=working.audit.rows.find(p=>p.saintId===saint.id);
  const override=curator.find(p=>p.saintId===saint.id)??null;
  const inheritedSubgroups=[...new Set(inherited?.proposals.map(p=>p.section)||[])];
  return {saintId:saint.id,name:saint.displayName,slug:saint.slug,status:saint.status,publicationStatus:saint.publicationStatus,version:saint.version,aliases:saint.aliases.map(a=>a.alias),sourceRows:inherited?.sourceRows||[],sourcePackaging:current.sourcePackaging??[],
   current:{section:current.section,tier:current.tier,familyKey:current.familyId,familyLabel:current.groupLabel||current.curatorialFamily,proposalRevision:current.curatorProposalRevision,confidence:current.confidence,rationale:current.rationale,note:current.note,alternatives:current.alternatives,needsResearch:current.needsResearch,arrangement:current.arrangement,arrangementNeedsReview:Boolean(current.arrangementNeedsReview)},
   curatorOverride:override,inheritedSubgroups,inheritedProposals:inherited?.proposals||[],
   originalSubgroups:[...new Set(spn.original.placements.filter(p=>p.saintId===saint.id).map(p=>p.section))],
   spnDisplayContext:spn.placements.filter(p=>p.saintId===saint.id).map(p=>({section:p.section,tier:p.tier,familyKey:p.curatorialFamily||p.familyId,familyLabel:p.groupLabel||p.curatorialFamily,placementState:p.placementState,sourceRecordId:p.sourceRecordId,displayMembership:p.displayMembership})),
   traditions:saint.traditions.map(t=>({id:t.tradition.id,name:t.tradition.name,slug:t.tradition.slug,status:t.tradition.status,isPrimary:t.isPrimary})),
   places:saint.places.map(p=>({id:p.id,placeId:p.placeId,name:p.place.name,placeType:p.placeType,keyLocalityOrder:p.keyLocalityOrder,region:p.place.region,country:p.place.country,placeKind:p.place.placeKind,routeOrder:p.routeOrder})),
   canonicalFamilies:saint.familyMemberships.map(m=>({membershipId:m.id,familyId:m.familyId,familySlug:m.family.slug,familyLabel:m.family.displayName,familyStatus:m.family.status,computedFrom:m.family.computedFrom,graphVersion:m.family.graphVersion,sourceExternalId:m.family.sourceExternalId,externalRecordId:m.externalRecordId,role:m.role,tier:m.tier,sortOrder:m.sortOrder,notes:m.notes,updatedAt:m.updatedAt,reviewedMembershipNotEstablishedByThisExport:true})),
   savedArrangement:arrangements.find(a=>a.placementId===current.id)??null};
 });
 const families=working.families.map(f=>{
  const members=rows.filter(r=>r.current.familyKey===f.key);
  const reviewedMemberIds=members.filter(r=>r.curatorOverride?.groupKey===f.key).map(r=>r.saintId);
  return {key:f.key,label:f.label,revision:f.revision,memberIds:members.map(r=>r.saintId),reviewedMemberIds,suggestedMemberIds:members.filter(r=>!reviewedMemberIds.includes(r.saintId)).map(r=>r.saintId),subgroups:[...new Set(members.flatMap(r=>r.inheritedSubgroups))],sections:[...new Set(members.map(r=>r.current.section))],arrangement:f.arrangement};
 });
 const content={version:2,museum:"vrindavan",snapshotHash:working.audit.snapshotHash,policyVersion:plan.version,sectionCatalogue:working.sections,rows,families,
  unrepresentedCuratorOverrides:curator.filter(c=>!ids.includes(c.saintId)),
  summary:{uniqueConfirmedSaints:rows.length,confirmedSourceRows:review.summary.confirmedRows,excludedPendingSourceRows:review.summary.remainingRows,confirmedIdentityAlerts:review.summary.confirmedLinkAlerts,curatorProtectedSaints:rows.filter(r=>r.curatorOverride).length,currentDisplayFamilies:families.length,familiesWithReviewedMembers:families.filter(f=>f.reviewedMemberIds.length>0).length}};
 return {...content,generatedAt:new Date().toISOString(),revision:createHash("sha256").update(stableCollectionJson(JSON.parse(JSON.stringify(content)))).digest("hex"),policy:"Read-only current Vrindavan state. Current display families, explicit curator overrides and inherited suggestions are distinguished. Canonical family/graph records do not establish reviewed display membership. No identity, geography, SPN, publication or physical placement writes."};
}
