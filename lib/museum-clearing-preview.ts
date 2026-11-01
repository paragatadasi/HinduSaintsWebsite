import type {CompanionRow} from "./spn-move-guide";

export function clearingPreview(rows: CompanionRow[], destinations: {sourceId:string; destination:string}[], vitrine:string) {
 const targets=new Map(destinations.map(entry=>[entry.sourceId,entry.destination]));
 const occupants=rows.filter(row=>row.current?.kind==="vitrine"&&row.current.code===vitrine);
 const preserved=occupants.filter(row=>row.currentBasis==="confirmed"&&(!targets.get(row.sourceId)||targets.get(row.sourceId)===vitrine));
 const preservedIds=new Set(preserved.map(row=>row.sourceId));
 return {preserved,remaining:occupants.filter(row=>!preservedIds.has(row.sourceId))};
}

export function clearingSavedMessage(summary:{stagedCount:number;preservedCount:number}) {
 return `${summary.stagedCount} staged · ${summary.preservedCount} placements preserved.`;
}
