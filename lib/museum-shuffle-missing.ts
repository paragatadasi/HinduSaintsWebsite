import type {FinalReviewRecord} from "./museum-final-review-domain";

const islandVitrines=new Set(Array.from({length:12},(_,index)=>String(index+51)));
export function shuffleMissingRecords(records:FinalReviewRecord[]){
 return records.filter(record=>{
  if(record.flag?.status!=="open"||record.flag.kind!=="missing"||record.preliminaryNote?.trim()||record.sourceId==="recnN6SjH1pOAAXtj")return false;
  const location=record.physical.componentPlacement?.location??record.physical.current;
  const vitrine=location?.kind==="vitrine"?location.code:record.effectiveDestination?.vitrine??(record.physical.original?.kind==="vitrine"?record.physical.original.code:null);
  return !!vitrine&&islandVitrines.has(vitrine);
 }).sort((a,b)=>a.name.localeCompare(b.name));
}
