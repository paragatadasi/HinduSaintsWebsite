import type {StarterMoveGuide,GuideEntry,GuideGroup} from "./spn-move-guide";
import type {CompanionAddition} from "./museum-companion-additions-state";
const phaseOrder=["starter","datta","ram-bhakti","gosaiji-sai","vraj","vraj2","north"];
export function companionVitrineOwner<T extends string>(guides:Record<T,StarterMoveGuide>,code:string):T|undefined{
 const keys=Object.keys(guides) as T[];
 const rank=(key:string)=>{const index=phaseOrder.indexOf(key);return index<0?phaseOrder.length:index;};
 return keys.sort((a,b)=>rank(a)-rank(b)).find(key=>guides[key].vitrines.some(v=>v.code===code));
}
export function projectCompanionAdditions<T extends string>(guides:Record<T,StarterMoveGuide>,additions:CompanionAddition[],catalog:GuideEntry[]):Record<T,StarterMoveGuide>{
 const entries=new Map(catalog.map(e=>[e.sourceId,e]));
 const byId=new Map(additions.filter(a=>entries.has(a.sourceId)).map(a=>[a.sourceId,a]));
 const owners=new Map(additions.map(a=>[a.sourceId,companionVitrineOwner(guides,a.vitrine)]));
 return Object.fromEntries((Object.keys(guides) as T[]).map(key=>{
  const guide=guides[key];
  const trimGroup=(group:GuideGroup,code:string):GuideGroup=>{
   const sourceIds=group.sourceIds.filter(id=>!byId.has(id)||(byId.get(id)!.vitrine===code&&owners.get(id)===key));
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
  const visibleVitrines=vitrines.filter(v=>{
   if(v.families.length||v.cityGroups.length)return true;
   const original=guide.vitrines.find(old=>old.code===v.code)!;
   const transferred=[...original.families,...original.cityGroups].some(group=>group.sourceIds.some(id=>byId.get(id)?.vitrine===v.code&&owners.get(id)!==key));
   return !transferred;
  });
  return [key,{...guide,vitrines:visibleVitrines,entries:[...updated.values()]}];
 })) as Record<T,StarterMoveGuide>;
}
