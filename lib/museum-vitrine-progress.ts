import {isCountedSpnProgressSource} from "./spn-progress-exclusions";
import {isPlaced,type CompanionRow,type GuideDecision,type GuideGroup} from "./spn-move-guide";
export type FinalReviewDecision = {sourceId:string;finallyReviewed?:boolean;decision:"pending"|"declined"|"not_on_display"|"deferred"};
export function vitrineProgress(code:string,groups:GuideGroup[],rows:CompanionRow[],decisions:GuideDecision[],reviewDecisions:FinalReviewDecision[]=[]){
 const ids=[...new Set(groups.flatMap(g=>g.sourceIds).filter(isCountedSpnProgressSource))];
 let addressed=0,deferred=0;
 for(const id of ids){
  if(reviewDecisions.some(review=>review.sourceId===id&&review.finallyReviewed)){addressed++;continue;}
  const row=rows.find(r=>r.sourceId===id);
  if(row&&isPlaced(row,code)){addressed++;continue;}
  const own=decisions.find(d=>d.suggestionId==="row:"+id);
  const inherited=groups.filter(g=>g.sourceIds.includes(id)).map(g=>decisions.find(d=>d.suggestionId===g.id)?.decision);
  const decision=reviewDecisions.find(d=>d.sourceId===id)?.decision??own?.decision??(inherited.includes("declined")?"declined":inherited.includes("deferred")?"deferred":"pending");
  if(decision==="declined"||decision==="not_on_display")addressed++;
  else if(decision==="deferred")deferred++;
 }
 return {total:ids.length,addressed,deferred};
}
