import type {FinalReviewRecord,FinalReviewSnapshot} from "./museum-final-review-domain";

export function mergeFinalReviewRecords(current:FinalReviewRecord[],incoming:FinalReviewRecord[]){
  const records=new Map(current.map(record=>[record.sourceId,record]));
  for(const record of incoming){
    const previous=records.get(record.sourceId);
    if(previous&&(record.reviewVersion<previous.reviewVersion||record.physical.currentVersion<previous.physical.currentVersion))continue;
    records.set(record.sourceId,record);
  }
  return [...records.values()];
}

export function mergeFinalReviewSnapshot(current:FinalReviewSnapshot|null,incoming:FinalReviewSnapshot){
  if(!current)return incoming;
  const present=new Set(incoming.records.map(record=>record.sourceId));
  const removed=new Set(incoming.removedSourceIds??[]);
  const kept=current.records.filter(record=>!removed.has(record.sourceId)&&(incoming.complete===false||present.has(record.sourceId)));
  return {...incoming,records:mergeFinalReviewRecords(kept,incoming.records)};
}
