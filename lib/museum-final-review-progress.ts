import type {FinalReviewRecord} from "./museum-final-review-view";
import {isCountedSpnProgressSource} from "./spn-progress-exclusions";
import {spnDisplayLabel} from "./spn-display-regions";

export function finalReviewProgress(records:FinalReviewRecord[]){
 const seen=new Set<string>();
 const cases=new Map<string,{code:string;total:number;complete:number;addressed:number;flagged:number}>();
 for(const record of records){
  if(seen.has(record.sourceId)||record.decision==="not_on_display"||!isCountedSpnProgressSource(record.sourceId))continue;
  seen.add(record.sourceId);
  const code=record.destination;
  const counts=cases.get(code)??{code,total:0,complete:0,addressed:0,flagged:0};
  counts.total++;if(record.finallyReviewed)counts.complete++;
  if(record.finallyReviewed||record.flag)counts.addressed++;
  if(record.flag)counts.flagged++;
  cases.set(code,counts);
 }
 const regions=new Map<string,{label:string;total:number;complete:number;vitrines:{code:string;total:number;complete:number}[]}>();
 for(const vitrine of [...cases.values()].sort((a,b)=>a.code.localeCompare(b.code,undefined,{numeric:true}))){
  const label=vitrine.code?spnDisplayLabel(vitrine.code)||"Other vitrines":"No destination";
  const region=regions.get(label)??{label,total:0,complete:0,vitrines:[]};
  region.total+=vitrine.total;region.complete+=vitrine.complete;region.vitrines.push(vitrine);regions.set(label,region);
 }
 return {total:seen.size,complete:[...cases.values()].reduce((sum,v)=>sum+v.complete,0),regions:[...regions.values()],vitrines:Object.fromEntries(cases)};
}
