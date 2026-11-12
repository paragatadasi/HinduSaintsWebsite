import {intakeApi} from "@/lib/museum-intake-api";
import {MuseumIntakeError} from "@/lib/museum-intake-domain";
import {hasCapability} from "@/lib/permissions";
import {readFinalReviewSnapshot} from "@/lib/museum-final-review";
import {shuffleMissingRecords} from "@/lib/museum-shuffle-missing";
import {shuffleRelicPhotos} from "@/lib/museum-shuffle-photos";
import {db} from "@/lib/db";
import {currentLocationLabel} from "@/lib/spn-move-guide";
import type {ShuffleMissingRecord} from "@/lib/museum-shuffle-missing-types";

export const runtime="nodejs";
export async function GET(request:Request){
 return intakeApi(request,async actor=>{
  if(!hasCapability(actor.roles,"view_museum_catalog"))throw new MuseumIntakeError(403,"Museum access is required.");
  const snapshot=await readFinalReviewSnapshot();
  const missing=shuffleMissingRecords(snapshot.records);
  const ids=[...new Set(missing.flatMap(record=>record.saintId?[record.saintId]:[]))];
  const saints=ids.length?await db.saint.findMany({where:{id:{in:ids},status:{not:"archived"}},select:{id:true,primaryImage:{select:{url:true,altText:true}}}}):[];
  const relicPhotos=await shuffleRelicPhotos(missing.map(record=>record.sourceId));
  const portraits=new Map(saints.map(saint=>[saint.id,saint.primaryImage]));
  const records:ShuffleMissingRecord[]=missing.map(record=>{
   const portrait=record.saintId?portraits.get(record.saintId):null;
   return {sourceId:record.sourceId,name:record.name,description:record.relicDescription,location:currentLocationLabel(record.physical.componentPlacement?.location??record.physical.current),note:record.flag?.note??null,
    photos:[...(portrait?[{kind:"saint" as const,url:portrait.url,alt:portrait.altText||record.name}]:[]),...(relicPhotos.get(record.sourceId)??[])]};
  });
  return {records,revision:snapshot.revision};
 });
}
