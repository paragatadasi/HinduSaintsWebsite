import {db} from "./db";
import {SPN_WEBSITE_AIRTABLE_BASE_ID as base} from "./museum-vitrine-source";
import type {ShuffleMissingRecord} from "./museum-shuffle-missing-types";

export function attachmentIds(value:unknown):string[]{
 return Array.isArray(value)?value.flatMap(item=>item&&typeof item==="object"&&"id" in item&&typeof item.id==="string"&&/^att[a-zA-Z0-9]+$/.test(item.id)?[item.id]:[]):[];
}
export async function shuffleRelicPhotos(sourceIds:string[]){
 if(!sourceIds.length)return new Map<string,ShuffleMissingRecord["photos"]>();
 const mirrors=await db.airtableMirrorRecord.findMany({where:{baseId:base,OR:[{tableIdOrName:"Saints",recordId:{in:sourceIds}},...sourceIds.map(id=>({tableIdOrName:"Relics",rawFieldsJson:{path:["Saint"],array_contains:[id]}}))]},select:{recordId:true,tableIdOrName:true,rawFieldsJson:true}});
 const photos=new Map<string,ShuffleMissingRecord["photos"]>();
 for(const sourceId of sourceIds){
  const saint=mirrors.find(row=>row.tableIdOrName==="Saints"&&row.recordId===sourceId);
  const fields=saint?.rawFieldsJson as Record<string,unknown>|undefined;
  const candidates=mirrors.filter(row=>row.tableIdOrName==="Relics"&&Array.isArray((row.rawFieldsJson as Record<string,unknown>).Saint)&&((row.rawFieldsJson as Record<string,unknown>).Saint as unknown[]).includes(sourceId));
  const refs=candidates.flatMap(row=>attachmentIds((row.rawFieldsJson as Record<string,unknown>)["Relic picture"]).map(id=>({id,recordId:row.recordId,table:"Relics"})));
  if(!refs.length)refs.push(...attachmentIds(fields?.["Relics Pictures (move to other table)"]).map(id=>({id,recordId:sourceId,table:"Saints"})));
  photos.set(sourceId,refs.map(ref=>({kind:"relic",url:`/api/museum/shuffle-guide/missing/photo?sourceId=${encodeURIComponent(sourceId)}&table=${ref.table}&recordId=${encodeURIComponent(ref.recordId)}&attachmentId=${encodeURIComponent(ref.id)}`,alt:ref.table==="Saints"?"Relic photo from this inventory entry":"Relic photo"})));
 }
 return photos;
}
