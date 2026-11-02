import type {StarterMoveGuide} from "./spn-move-guide";

export function activeSearchRoster(guides:StarterMoveGuide[]){
 const targets=new Map<string,Set<string>>();
 for(const guide of guides){
  const entries=new Map(guide.entries.map(entry=>[entry.sourceId,entry]));
  for(const vitrine of guide.vitrines)for(const group of [...vitrine.families,...vitrine.cityGroups])for(const sourceId of group.sourceIds){
   const entry=entries.get(sourceId);
   if(!entry||entry.destination!==vitrine.code)continue;
   const cases=targets.get(sourceId)??new Set<string>();cases.add(vitrine.code);targets.set(sourceId,cases);
  }
 }
 return targets;
}
export function resolveSearchRoster(sourceId:string,historicalDestination:string,roster:Map<string,Set<string>>|undefined){
 if(!roster)return {destination:"",state:"loading" as const,historicalDestination};
 const targets=roster.get(sourceId);
 if(targets?.size===1)return {destination:[...targets][0],state:"active" as const,historicalDestination};
 return {destination:"",state:targets?.size?"conflict" as const:"unallocated" as const,historicalDestination};
}
