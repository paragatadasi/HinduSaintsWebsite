import type {StarterMoveGuide,GuideEntry,GuideGroup} from "./spn-move-guide";
import type {CompanionAddition} from "./museum-companion-additions-state";
export function projectCompanionAdditions<T extends string>(guides:Record<T,StarterMoveGuide>,additions:CompanionAddition[],catalog:GuideEntry[]):Record<T,StarterMoveGuide>{
 const entries=new Map(catalog.map(e=>[e.sourceId,e]));
 const byId=new Map(additions.filter(a=>entries.has(a.sourceId)).map(a=>[a.sourceId,a]));
 const owners=new Map(additions.map(a=>[a.sourceId,(Object.keys(guides) as T[]).find(key=>guides[key].vitrines.some(v=>v.code===a.vitrine))]));
 return Object.fromEntries((Object.keys(guides) as T[]).map(key=>{
  const guide=guides[key];
  const trimGroup=(group:GuideGroup,code:string):GuideGroup=>{
   const sourceIds=group.sourceIds.filter(id=>!byId.has(id)||byId.get(id)!.vitrine===code);
   return {...group,sourceIds,edges:group.edges?.filter(edge=>sourceIds.includes(edge.fromSourceId)&&sourceIds.includes(edge.toSourceId)),...(sourceIds.length!==group.sourceIds.length?{saintCount:undefined,spaceEstimate:undefined}:{} )};
  };
  const vitrines=guide.vitrines.map(v=>({...v,families:v.families.map(g=>trimGroup(g,v.code)).filter(g=>g.sourceIds.length),cityGroups:v.cityGroups.map(g=>trimGroup(g,v.code)).filter(g=>g.sourceIds.length)}));
  const updated=new Map(guide.entries.map(e=>[e.sourceId,byId.has(e.sourceId)?{...e,destination:byId.get(e.sourceId)!.vitrine}:e]));
  for(const addition of byId.values()){
   if(owners.get(addition.sourceId)!==key)continue;
   const target=vitrines.find(v=>v.code===addition.vitrine)!;
   updated.set(addition.sourceId,{...entries.get(addition.sourceId)!,destination:addition.vitrine});
   if([...target.families,...target.cityGroups].some(g=>g.sourceIds.includes(addition.sourceId)))continue;
   let group=target.cityGroups.find(g=>g.id==="curator-additions:"+target.code);
   if(!group){group={id:"curator-additions:"+target.code,title:"Curator additions",sourceIds:[],rationale:"",suggestedVitrines:[target.code]};target.cityGroups.push(group);}
   group.sourceIds.push(addition.sourceId);
  }
  return [key,{...guide,vitrines,entries:[...updated.values()]}];
 })) as Record<T,StarterMoveGuide>;
}
