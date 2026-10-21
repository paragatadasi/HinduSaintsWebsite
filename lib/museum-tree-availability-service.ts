import {db} from "./db";
import type {Prisma} from "./generated/prisma/client";
import {getMuseumProposalData} from "./museum-proposals";
import {guideConnections} from "./vrindavan-guide-connections-domain";
import {treeAvailability} from "./museum-tree-availability";
// Batched private read: no per-card tree traversal, layout, portraits or inventory reads.
export async function readVrindavanTreeAvailability(familyKeys:string[],tx:Prisma.TransactionClient=db){
 const [people,claims,links]=await Promise.all([
  tx.saint.findMany({where:{status:{not:"archived"}},select:{id:true,displayName:true,birthYear:true,samadhiYear:true}}),
  tx.saintRelationship.findMany({select:{id:true,fromSaintId:true,toSaintId:true,relationshipType:true,status:true,evidenceStatus:true,confidence:true}}),
  tx.externalRecord.findMany({where:{sourceType:"airtable",entityType:"Saint"},select:{id:true,externalId:true,entityId:true}})
 ]);
 const wanted=new Set(familyKeys.map(k=>k.replace(/^suggested:/,"")));
 const original=getMuseumProposalData(),families=new Map<string,Record<string,string>[]>();
 for(const family of original.sections.flatMap(s=>s.families))if(wanted.has(family.key)){
  const rows=family.rows.flatMap(r=>{const row=original.membersById.get(r.sourceRecordId||r.id);return row?[row]:[];});
  families.set(family.key,[...new Map([...(families.get(family.key)??[]),...rows].map(r=>[r.RecordId,r])).values()]);
 }
 return treeAvailability(people.map(p=>({...p,name:p.displayName})),claims,guideConnections,families,links);
}
