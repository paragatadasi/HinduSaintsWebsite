import {db} from "@/lib/db";
import type {Prisma} from "@/lib/generated/prisma/client";
import {readVrindavanWorkingData} from "./vrindavan-working-data";
import {guideConnections,guideSections,guideMetadata,projectGuideConnections} from "./vrindavan-guide-connections-domain";
// Private read-only service. Every caller must require access_museum AND view_full_saint_catalog.
export async function readVrindavanGuideConnections(client:Prisma.TransactionClient=db){
 const ids=[...new Set(guideConnections.flatMap(c=>[c.from,c.to].flatMap(e=>e.kind==="saint"?[e.saintId]:[])))];
 const [people,claims,working]=await Promise.all([
  client.saint.findMany({where:{id:{in:ids},status:{not:"archived"}},select:{id:true,displayName:true,slug:true,status:true,birthYear:true,samadhiYear:true}}),
  client.saintRelationship.findMany({where:{fromSaintId:{in:ids},toSaintId:{in:ids}},select:{id:true,fromSaintId:true,toSaintId:true,relationshipType:true,status:true,evidenceStatus:true,confidence:true,notes:true},orderBy:{id:"asc"}}),
  readVrindavanWorkingData(client)
 ]);
 const placements=working.placements.flatMap(p=>p.saintId?[{saintId:p.saintId,section:p.section,tier:p.tier,familyKey:p.familyId,familyLabel:p.groupLabel||p.curatorialFamily||"",proposalRevision:p.curatorProposalRevision??"",arrangement:p.arrangement?{status:p.arrangement.status,vitrine:p.arrangement.vitrine??"",shelf:p.arrangement.shelf??""}:null}]:[]);
 const connections=projectGuideConnections(people.map(p=>({...p,name:p.displayName})),claims,placements);
 return {...guideMetadata,sections:guideSections,connections,counts:Object.fromEntries(["reviewed_match","unreviewed_match","missing","type_conflict","context_only","unavailable_identity"].map(s=>[s,connections.filter(c=>c.canonicalState===s).length])),retrievedAt:new Date().toISOString()};
}
export type VrindavanGuideConnections=Awaited<ReturnType<typeof readVrindavanGuideConnections>>;
