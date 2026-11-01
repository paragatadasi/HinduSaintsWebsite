import type {GuideEntry,GuideGroup,StarterMoveGuide} from "./spn-move-guide";

type CurrentEntry=GuideEntry & {identityChanged?:boolean};
/** Remove superseded allocations; never manufacture a receiving guide from catalog fallbacks. */
export function reconcileCompanionMembership<T extends string>(guides:Record<T,StarterMoveGuide>,catalog:CurrentEntry[]):Record<T,StarterMoveGuide>{
 const current=new Map(catalog.map(entry=>[entry.sourceId,entry]));
 return Object.fromEntries(Object.entries<StarterMoveGuide>(guides).map(([key,guide])=>{
  const eligible=new Map(guide.entries.flatMap(entry=>{
   const live=current.get(entry.sourceId);
   return live?.destination&&!live.identityChanged&&live.saintId===entry.saintId&&!entry.reviewOnly&&!entry.componentScope
    ?[[entry.sourceId,live.destination] as const]:[];
  }));
  const trim=(group:GuideGroup,code:string):GuideGroup=>{
   const removed=new Set(group.sourceIds.filter(id=>eligible.has(id)&&eligible.get(id)!==code));
   if(!removed.size)return group;
   return {...group,sourceIds:group.sourceIds.filter(id=>!removed.has(id)),
    edges:group.edges?.filter(edge=>!removed.has(edge.fromSourceId)&&!removed.has(edge.toSourceId)),
    saintCount:undefined,spaceEstimate:undefined};
  };
  return [key,{...guide,entries:guide.entries.map(entry=>eligible.has(entry.sourceId)?{...entry,destination:eligible.get(entry.sourceId)!}:entry),
   vitrines:guide.vitrines.map(vitrine=>({...vitrine,
    families:vitrine.families.map(group=>trim(group,vitrine.code)).filter(group=>group.sourceIds.length),
    cityGroups:vitrine.cityGroups.map(group=>trim(group,vitrine.code)).filter(group=>group.sourceIds.length)}))}];
 })) as Record<T,StarterMoveGuide>;
}
