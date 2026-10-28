import { z } from "zod";
import { MuseumMoveSessionError } from "./museum-move-session-domain";
export const preparationInput = z.object({
  action: z.literal("preparation.update"), museumId: z.literal("museum-spn"), clientRequestId: z.string().uuid(),
  vitrine: z.string().trim().min(1).max(100), prepared: z.boolean(), expectedVersion: z.number().int().nonnegative()
}).strict();
export function assertSafeCaseClear(codes: string[], rows: {currentBasis:string;current:{kind:string;code:string}|null}[]) {
  if (rows.some(row => row.currentBasis === "confirmed" && row.current?.kind === "vitrine" && codes.includes(row.current.code)))
    throw new MuseumMoveSessionError(409,"This vitrine has confirmed placements. Record preparation separately; review individual moves before clearing it.");
}
export type VitrinePreparation = {vitrine:string;prepared:boolean;version:number;recordedAt:string;receiptId:string;basis:"preparation"|"legacy_clear"};
export function projectPreparations(events: {id:string;createdAt:Date;afterJson:unknown}[]): VitrinePreparation[] {
  const latest = new Map<string,VitrinePreparation>();
  for (const event of [...events].sort((a,b)=>a.createdAt.getTime()-b.createdAt.getTime() || a.id.localeCompare(b.id))) {
    const data = event.afterJson as Record<string,unknown>|null;
    if (!data || data.museumId !== "museum-spn") continue;
    if (typeof data.vitrine === "string" && typeof data.prepared === "boolean" && typeof data.version === "number")
      latest.set(data.vitrine,{vitrine:data.vitrine,prepared:data.prepared,version:data.version,recordedAt:event.createdAt.toISOString(),receiptId:event.id,basis:"preparation"});
    else if(Array.isArray(data.clearedVitrines)) for(const vitrine of data.clearedVitrines) if(typeof vitrine === "string") {
      const prior=latest.get(vitrine);
      latest.set(vitrine,{vitrine,prepared:true,version:prior ? prior.version + 1 : 0,recordedAt:event.createdAt.toISOString(),receiptId:event.id,basis:"legacy_clear"});
    }
  }
  return [...latest.values()].sort((a,b)=>a.vitrine.localeCompare(b.vitrine,undefined,{numeric:true}));
}

export type PhaseClearance = {guideVersion:string;vitrine:string;receiptId:string;recordedAt:string};
export function projectPhaseClearances(events:{id:string;createdAt:Date;afterJson:unknown}[]):PhaseClearance[]{
 return events.flatMap(event=>{
  const data=event.afterJson as {museumId?:unknown;guideContext?:{guideVersion?:unknown};clearedVitrines?:unknown}|null;
  const version=data?.guideContext?.guideVersion;
  if(data?.museumId!=="museum-spn" || typeof version!=="string" || !Array.isArray(data.clearedVitrines))return [];
  return data.clearedVitrines.flatMap(code=>typeof code==="string" ? [{guideVersion:version,vitrine:code,receiptId:event.id,recordedAt:event.createdAt.toISOString()}] : []);
 });
}
export function assertPhaseClearance(input:{clearedVitrines?:string[];initialCaseClearAcknowledged?:true},required:string[],guideVersion:string,
 clearances:PhaseClearance[],rows:{sourceId:string;current:{kind:string;code:string}|null}[],records:{sourceId:string}[]){
 if(input.clearedVitrines?.length){
  if(!input.initialCaseClearAcknowledged)throw new MuseumMoveSessionError(400,"Confirm that this initial clearing physically moves the listed contents to staging.");
  if(clearances.some(c=>c.guideVersion===guideVersion && input.clearedVitrines!.includes(c.vitrine)))throw new MuseumMoveSessionError(409,"This phase already recorded its initial clearing. Review individual moves instead.");
  if(records.some(record=>!rows.some(row=>row.sourceId===record.sourceId && row.current?.kind==="vitrine" && input.clearedVitrines!.includes(row.current.code))))
   throw new MuseumMoveSessionError(409,"The clearing list changed. Include only the current occupants of the selected vitrine.");
 }else if(required.some(code=>!clearances.some(c=>c.guideVersion===guideVersion && c.vitrine===code)))
  throw new MuseumMoveSessionError(409,"Complete this phase's initial vitrine clearing before recording placements.");
}
