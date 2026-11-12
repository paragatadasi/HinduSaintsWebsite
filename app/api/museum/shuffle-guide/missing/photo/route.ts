import {db} from "@/lib/db";
import sharp from "sharp";
import {shuffleAttachmentUrl} from "@/lib/museum-shuffle-photo-access";
import {intakeApi} from "@/lib/museum-intake-api";
import {MuseumIntakeError} from "@/lib/museum-intake-domain";
import {hasCapability} from "@/lib/permissions";
import {readFinalReviewSnapshot} from "@/lib/museum-final-review";
import {shuffleMissingRecords} from "@/lib/museum-shuffle-missing";
import {SPN_WEBSITE_AIRTABLE_BASE_ID as base} from "@/lib/museum-vitrine-source";

export const runtime="nodejs";
const cache=new Map<string,{expires:number;bytes:Uint8Array}>();
const inFlight=new Map<string,Promise<Uint8Array>>();
async function loadPhoto(table:string,recordId:string,sourceId:string,attachmentId:string){
 const token=process.env.AIRTABLE_ACCESS_TOKEN??process.env.AIRTABLE_PAT;
 if(!token||process.env.AIRTABLE_BASE_ID!==base)throw new MuseumIntakeError(503,"Relic photos are not connected yet.");
 const response=await fetch(`https://api.airtable.com/v0/${base}/${table}/${recordId}`,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(10000),cache:"no-store"});
 if(!response.ok)throw new MuseumIntakeError(502,"The relic photo could not be refreshed.");
 const row=await response.json();
 const url=shuffleAttachmentUrl(row,table,recordId,sourceId,attachmentId);
 const image=await fetch(url,{redirect:"error",signal:AbortSignal.timeout(15000),cache:"no-store"});
 if(!image.ok||!image.body)throw new MuseumIntakeError(502,"Photo unavailable.");
 const reader=image.body.getReader(),chunks:Uint8Array[]=[];let size=0;
 try{while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.byteLength;if(size>10*1024*1024){await reader.cancel();throw new MuseumIntakeError(413,"Photo is too large.");}chunks.push(chunk.value);}}finally{reader.releaseLock();}
 try{return new Uint8Array(await sharp(Buffer.concat(chunks),{limitInputPixels:40_000_000,failOn:"error"}).rotate().resize({width:1200,height:1200,fit:"inside",withoutEnlargement:true}).jpeg({quality:85}).toBuffer());}
 catch{throw new MuseumIntakeError(422,"Photo could not be opened.");}
}
export async function GET(request:Request){
 return intakeApi(request,async actor=>{
  if(!hasCapability(actor.roles,"view_museum_catalog"))throw new MuseumIntakeError(403,"Museum access is required.");
  const query=new URL(request.url).searchParams;
  const sourceId=query.get("sourceId")??"",recordId=query.get("recordId")??"",attachmentId=query.get("attachmentId")??"",table=query.get("table")??"";
  if(!/^rec[a-zA-Z0-9]+$/.test(sourceId)||!/^rec[a-zA-Z0-9]+$/.test(recordId)||!/^att[a-zA-Z0-9]+$/.test(attachmentId)||!["Saints","Relics"].includes(table))throw new MuseumIntakeError(400,"Invalid photo request.");
  const snapshot=await readFinalReviewSnapshot({sourceId});
  const record=shuffleMissingRecords(snapshot.records).find(record=>record.sourceId===sourceId);
  const binding=await db.externalRecord.findUnique({where:{sourceType_externalId:{sourceType:"airtable",externalId:`${base}:Saints:${sourceId}`}},select:{entityId:true,entityType:true}});
  if(!record||!binding||binding.entityType!=="Saint"||binding.entityId!==record.saintId)throw new MuseumIntakeError(404,"This record is no longer on the missing board.");
  const key=[sourceId,table,recordId,attachmentId].join(":");let bytes=cache.get(key);
  if(!bytes||bytes.expires<Date.now()){
   let pending=inFlight.get(key);
   if(!pending){pending=loadPhoto(table,recordId,sourceId,attachmentId);inFlight.set(key,pending);}
   try{bytes={bytes:await pending,expires:Date.now()+60000};if(cache.size>=40)cache.delete(cache.keys().next().value!);cache.set(key,bytes);}finally{inFlight.delete(key);}
  }
  return new Response(new Uint8Array(bytes.bytes).buffer,{headers:{"Content-Type":"image/jpeg","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
 });
}

