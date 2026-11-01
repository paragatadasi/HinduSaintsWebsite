import {applyWesternGuideRefinements} from "./spn-western-guide-refinements";
import type {StarterMoveGuide,GuideEntry,GuideGroup} from "./spn-move-guide";
import type {CompanionAddition} from "./museum-companion-additions-state";
import {projectSourceFamilyReunion,projectGajananDisplayRelationship,projectVitthalVedanandaFamily} from "./spn-source-family-reunion";
const phaseOrder=["starter","datta","ram-bhakti","gosaiji-sai","east2","vraj","vraj2","north","west45","west46","west47","saurashtra","west40-44","west1","south"];
export function companionVitrineOwner<T extends string>(guides:Record<T,StarterMoveGuide>,code:string):T|undefined{
 const keys=Object.keys(guides) as T[];
 const rank=(key:string)=>{const index=phaseOrder.indexOf(key);return index<0?phaseOrder.length:index;};
 return keys.sort((a,b)=>rank(a)-rank(b)).find(key=>guides[key].vitrines.some(v=>v.code===code));
}
export function projectCompanionAdditions<T extends string>(guides:Record<T,StarterMoveGuide>,additions:CompanionAddition[],catalog:GuideEntry[]):Record<T,StarterMoveGuide>{
 const entries=new Map(catalog.map(e=>[e.sourceId,e]));
 const pending=new Set(catalog.filter(e=>e.proposalTransfer?.state==="approved_case_pending").map(e=>e.sourceId));
 const byId=new Map(additions.filter(a=>entries.has(a.sourceId)&&!pending.has(a.sourceId)).map(a=>[a.sourceId,a]));
 const owners=new Map(additions.map(a=>[a.sourceId,companionVitrineOwner(guides,a.vitrine)]));
 return Object.fromEntries((Object.keys(guides) as T[]).map(key=>{
  const guide=guides[key];
  const reviewOnly=new Set(guide.entries.filter(e=>e.reviewOnly).map(e=>e.sourceId));
  const phaseAdditions=new Map([...byId].filter(([id])=>!reviewOnly.has(id)));
  const trimGroup=(group:GuideGroup,code:string):GuideGroup=>{
   const sourceIds=group.sourceIds.filter(id=>!pending.has(id)&&(!phaseAdditions.has(id)||(phaseAdditions.get(id)!.vitrine===code&&owners.get(id)===key)));
   return {...group,sourceIds,edges:group.edges?.filter(edge=>sourceIds.includes(edge.fromSourceId)&&sourceIds.includes(edge.toSourceId)),...(sourceIds.length!==group.sourceIds.length?{saintCount:undefined,spaceEstimate:undefined}:{} )};
  };
  const vitrines=guide.vitrines.map(v=>({...v,families:v.families.map(g=>trimGroup(g,v.code)).filter(g=>g.sourceIds.length),cityGroups:v.cityGroups.map(g=>trimGroup(g,v.code)).filter(g=>g.sourceIds.length)}));
  const updated=new Map(guide.entries.filter(e=>!pending.has(e.sourceId)).map(e=>[e.sourceId,phaseAdditions.has(e.sourceId)?{...e,destination:phaseAdditions.get(e.sourceId)!.vitrine}:e]));
  for(const addition of phaseAdditions.values()){
   if(owners.get(addition.sourceId)!==key)continue;
   const target=vitrines.find(v=>v.code===addition.vitrine)!;
   updated.set(addition.sourceId,{...entries.get(addition.sourceId)!,...updated.get(addition.sourceId),destination:addition.vitrine});
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
  const alternatives=guide.alternatives.map(group=>{
   const sourceIds=group.sourceIds.filter(id=>!pending.has(id));
   return sourceIds.length===group.sourceIds.length?group:{...group,sourceIds,edges:group.edges?.filter(edge=>sourceIds.includes(edge.fromSourceId)&&sourceIds.includes(edge.toSourceId)),saintCount:undefined,spaceEstimate:undefined};
  }).filter(group=>group.sourceIds.length);
  return [key,applyWesternGuideRefinements(projectVitthalVedanandaFamily(projectGajananDisplayRelationship(projectSourceFamilyReunion({...guide,vitrines:visibleVitrines,alternatives,entries:[...updated.values()].map(entry=>{
   const livingDatta=(entry.sourceId==="recyokcxEvhxvtyPk"&&entry.saintId==="cms0w7jvq09a707qiha1bb3et")||(entry.sourceId==="rec6IMLj9eDVWGP71"&&entry.saintId==="cms0w7d42015d07qieuyk6nfb");
   if(!livingDatta||entry.lifeStatus?.tag!=="Living")return entry;
   const note="Living: use the bottom shelf. Keep related saints in the same vitrine where possible.";
   return {...entry,reviewNotes:[...new Set([...(entry.reviewNotes??[]),note])]};
  })}))))];
 })) as Record<T,StarterMoveGuide>;
}
