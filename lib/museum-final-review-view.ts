import type {CompanionRow} from "./spn-move-guide";

export type ReviewFlag = {type:"missing"|"other";note:string|null};
export type FinalReviewRecord = {
  sourceId:string;
  name:string;
  tier:string;
  section:string;
  region:string;
  city:string;
  description:string;
  row:CompanionRow;
  destination:string;
  destinationShelf:string|null;
  addressed:boolean;
  finallyReviewed?:boolean;
  flag:ReviewFlag|null;
  version:number;
  hasFinalProposal?:boolean;
};
export type ReviewFilters = {query:string;starting:string;proposed:string;current:string};
export const emptyReviewFilters:ReviewFilters={query:"",starting:"",proposed:"",current:""};

function locationMatches(value:CompanionRow["current"],filter:string){
  if(!filter)return true;
  if(filter==="unknown")return !value;
  if(filter==="staging")return value?.kind==="table";
  return value?.kind==="vitrine"&&value.code===filter;
}
export function filterReviewRecords(records:FinalReviewRecord[],filters:ReviewFilters){
  const query=filters.query.trim().toLocaleLowerCase();
  return records.filter(record=>(!query||[record.name,record.city,record.section].some(value=>value.toLocaleLowerCase().includes(query)))
    &&locationMatches(record.row.original,filters.starting)
    &&(!filters.proposed||(filters.proposed==="unknown"?!record.destination:record.destination===filters.proposed))
    &&locationMatches(record.row.componentPlacement?.location??record.row.current,filters.current));
}
export function partitionReviewRecords(records:FinalReviewRecord[]){
  return {flagged:records.filter(record=>record.flag),unaddressed:records.filter(record=>!record.flag&&!record.addressed)};
}
export function sortReviewRecords(records:FinalReviewRecord[]){
  const tiers:Record<string,number>={primary:0,secondary:1,tertiary:2};
  return [...records].sort((a,b)=>(tiers[a.tier.toLowerCase()]??3)-(tiers[b.tier.toLowerCase()]??3)||a.name.localeCompare(b.name));
}
