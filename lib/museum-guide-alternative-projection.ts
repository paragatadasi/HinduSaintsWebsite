import type {StarterMoveGuide} from "./spn-move-guide";
export type GuideAlternative={sourceId:string;vitrine:string;shelf:string|null};
export function projectGuideAlternatives(guide:StarterMoveGuide,alternatives:GuideAlternative[]):StarterMoveGuide{
 const byId=new Map(alternatives.map(a=>[a.sourceId,a]));
 const members=new Set(guide.vitrines.flatMap(v=>[...v.families,...v.cityGroups].flatMap(g=>g.sourceIds)));
 const entries=guide.entries.map(e=>byId.has(e.sourceId)?{...e,destination:byId.get(e.sourceId)!.vitrine}:e);
 const vitrines=guide.vitrines.map(v=>({...v,families:v.families.map(g=>({...g,...(g.sourceIds.some(id=>byId.has(id)&&byId.get(id)!.vitrine!==v.code)?{saintCount:undefined,spaceEstimate:undefined}:{}),sourceIds:g.sourceIds.filter(id=>!byId.has(id)||byId.get(id)!.vitrine===v.code),edges:g.edges?.filter(e=>(!byId.has(e.fromSourceId)||byId.get(e.fromSourceId)!.vitrine===v.code)&&(!byId.has(e.toSourceId)||byId.get(e.toSourceId)!.vitrine===v.code))})).filter(g=>g.sourceIds.length),
 cityGroups:v.cityGroups.map(g=>({...g,...(g.sourceIds.some(id=>byId.has(id)&&byId.get(id)!.vitrine!==v.code)?{saintCount:undefined,spaceEstimate:undefined}:{}),sourceIds:g.sourceIds.filter(id=>!byId.has(id)||byId.get(id)!.vitrine===v.code)})).filter(g=>g.sourceIds.length)}));
 for(const a of alternatives){
  if(!members.has(a.sourceId))continue;
  let target=vitrines.find(v=>v.code===a.vitrine);
  if(!target){target={code:a.vitrine,summary:"Curator destinations",families:[],cityGroups:[]};vitrines.push(target);}
  if([...target.families,...target.cityGroups].some(g=>g.sourceIds.includes(a.sourceId)))continue;
  let group=target.cityGroups.find(g=>g.id==="curator-alternatives:"+a.vitrine);
  if(!group){group={id:"curator-alternatives:"+a.vitrine,title:"Curator destinations",sourceIds:[],rationale:"",suggestedVitrines:[a.vitrine]};target.cityGroups.push(group);}
  group.sourceIds.push(a.sourceId);
 }
 return {...guide,entries,vitrines};
}
