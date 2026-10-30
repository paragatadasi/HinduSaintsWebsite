import {db} from "./db";
import {readMuseumData} from "./museum-working-data";
import {SPN_WEBSITE_AIRTABLE_BASE_ID} from "./museum-vitrine-source";
import {buildSpnTierAudit} from "./spn-tier-audit-domain";

// Callers require museum, Source Data and full-catalogue access.
export async function readSpnTierAudit() {
 return db.$transaction(async tx=>{
  const baseline=await readMuseumData(tx,{reconcileFamilies:false});
  const bindings=await tx.externalRecord.findMany({where:{sourceType:"airtable",externalId:{startsWith:SPN_WEBSITE_AIRTABLE_BASE_ID+":Saints:"}},select:{externalId:true,entityId:true,entityType:true},orderBy:{externalId:"asc"}});
  const sources=bindings.filter(binding=>binding.entityType==="Saint");
  const ids=[...new Set([...baseline.placements.flatMap(row=>row.saintId?[row.saintId]:[]),...sources.flatMap(source=>source.entityId?[source.entityId]:[])])];
  const [identities,relationships,mirrors,decisions,familyMoves,memberships,storedArrangements,duplicateCandidates]=await Promise.all([
   tx.saint.findMany({where:{id:{in:ids},status:{not:"archived"}},select:{id:true,slug:true,displayName:true,status:true,publicationStatus:true,birthYear:true,birthDateRaw:true,samadhiYear:true,samadhiDateRaw:true,shortDescription:true,biographySummary:true,aliases:{select:{alias:true}},biographies:{where:{status:"published"},select:{id:true,title:true,bodyMarkdown:true,status:true}}},orderBy:{id:"asc"}}),
   tx.saintRelationship.findMany({where:{status:{not:"archived"},fromSaint:{status:{not:"archived"}},toSaint:{status:{not:"archived"}}},select:{id:true,fromSaintId:true,toSaintId:true,relationshipType:true,status:true,evidenceStatus:true,confidence:true,publicNote:true,sourceId:true},orderBy:{id:"asc"}}),
   tx.airtableMirrorRecord.findMany({where:{baseId:SPN_WEBSITE_AIRTABLE_BASE_ID,tableIdOrName:"Saints"},select:{recordId:true,rawFieldsJson:true,importedAt:true,lastSeenAt:true},orderBy:{recordId:"asc"}}),
   tx.auditEvent.findMany({where:{entityType:"Saint",entityId:{in:ids},action:{in:["museum.placement.saved","museum.proposal.accept","museum.proposal.ignore","museum.spn_proposal.saved"]}},select:{id:true,action:true,entityId:true,createdAt:true,beforeJson:true,afterJson:true},orderBy:[{createdAt:"asc"},{id:"asc"}]}),
   tx.museumFamilyProposalMove.findMany({orderBy:{familyKey:"asc"}}),
   tx.museumDisplayMembership.findMany({where:{museumId:"museum-spn"},orderBy:{placementId:"asc"}}),
   tx.museumArrangement.findMany({where:{museumId:"museum-spn"},orderBy:{placementId:"asc"}}),
   tx.duplicateCandidate.findMany({where:{entityType:"Saint",OR:[{entityId:{in:ids}},{candidateEntityId:{in:ids}}]},select:{id:true,entityId:true,candidateEntityId:true,status:true,confidence:true,message:true,resolutionAction:true,resolutionNotes:true},orderBy:{id:"asc"}}),
  ]);
  const effective=(await readMuseumData(tx)).placements;
  const evidenceFields=["Name","Place","Normalized places","Sampradaya","Birth (YYYY-MM-DD)","Samadhi (YYYY-MM-DD)","Primary Museum Section","Museum Section Tier","Vitrine #","Shelf","Relics Description (move to other table)"];
  const activeIds=new Set(identities.map(saint=>saint.id));
  const sourceObservations=mirrors.map(mirror=>{
   const sourceKey=SPN_WEBSITE_AIRTABLE_BASE_ID+":Saints:"+mirror.recordId;
   const binding=bindings.find(row=>row.externalId===sourceKey);
   const validFields=Boolean(mirror.rawFieldsJson&&typeof mirror.rawFieldsJson==="object"&&!Array.isArray(mirror.rawFieldsJson));
   const fields=validFields?mirror.rawFieldsJson as Record<string,unknown>:{};
   return {sourceKey,sourceRecordId:mirror.recordId,linkedEntityType:binding?.entityType??null,linkedEntityId:binding?.entityId??null,
    hasActiveCanonicalIdentity:binding?.entityType==="Saint"&&Boolean(binding.entityId&&activeIds.has(binding.entityId)),rawFieldIssue:validFields?null:"Source fields are not an object",
    importedAt:mirror.importedAt,lastSeenAt:mirror.lastSeenAt,rawSourceFields:Object.fromEntries(evidenceFields.filter(key=>Object.hasOwn(fields,key)).map(key=>[key,fields[key]]))};
  });
  return {...buildSpnTierAudit(baseline.placements,effective,identities,sources),generatedAt:new Date().toISOString(),
   canonicalLifeEvidence:identities.map(person=>({saintId:person.id,birthYear:person.birthYear,birthDateRaw:person.birthDateRaw,samadhiYear:person.samadhiYear,samadhiDateRaw:person.samadhiDateRaw})),
   sourceObservations,sourceCoverage:{mirroredRows:sourceObservations.length,withoutActiveCanonicalIdentity:sourceObservations.filter(row=>!row.hasActiveCanonicalIdentity).length},
   relationships,decisions,familyMoves,memberships,storedArrangements,duplicateCandidates,
   affiliationPolicy:"Research direct personal affiliation separately. The existing effective tree projection may traverse five general relationship hops and ten succession hops; that is not proof of direct affiliation. Same tradition, influence and generic association do not qualify automatically. Explicit curator decisions and physical arrangements are preserved."};
 },{isolationLevel:"RepeatableRead",maxWait:10000,timeout:60000});
}
