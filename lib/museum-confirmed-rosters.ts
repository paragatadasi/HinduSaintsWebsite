import {companionVitrineOwner} from "./museum-companion-addition-projection";
import {spnDisplayMemberships} from "./spn-display-regions";
import {isCountedSpnProgressSource} from "./spn-progress-exclusions";
import type {CompanionRow,GuideEntry,StarterMoveGuide} from "./spn-move-guide";

/** Receiving cards expose manual choices without assigning or moving any holdings. */
export function registerManualBhaktiMarga<T extends string>(guides:Record<T,StarterMoveGuide>):Record<T,StarterMoveGuide>{
 const owner=(Object.keys(guides) as T[]).find(key=>key==="hinge");
 if(!owner)return guides;
 const missing=["14","15"].filter(code=>!companionVitrineOwner(guides,code));
 if(!missing.length)return guides;
 return {...guides,[owner]:{...guides[owner],vitrines:[...guides[owner].vitrines,...missing.map(code=>({code,summary:"Bhakti Marga",families:[],cityGroups:[]}))]}};
}

/** A confirmed holding belongs in its actual case, even without a shelf recommendation. */
export function projectConfirmedRosters<T extends string>(guides:Record<T,StarterMoveGuide>,catalog:GuideEntry[],rows:CompanionRow[]):Record<T,StarterMoveGuide>{
 const current=new Map(catalog.map(entry=>[entry.sourceId,entry]));
 const confirmed=rows.flatMap(row=>{
  const entry=current.get(row.sourceId),location=row.componentPlacement?.location??row.current;
  if(row.componentPlacement&&(row.componentPlacement.sourceId!==row.sourceId||row.componentPlacement.expectedSourceRevision!==row.sourceRevision))return [];
  if(!entry||row.identityChanged||row.saintId!==entry.saintId||!isCountedSpnProgressSource(row.sourceId)||
    (!row.componentPlacement&&row.currentBasis!=="confirmed")||location?.kind!=="vitrine"||entry.destination!==location.code)return [];
  return [{entry,code:location.code}];
 });
 if(!confirmed.length)return guides;
 const result=Object.fromEntries(Object.entries<StarterMoveGuide>(guides).map(([key,guide])=>[key,{...guide,entries:[...guide.entries],vitrines:guide.vitrines.map(v=>({...v,families:[...v.families],cityGroups:[...v.cityGroups]}))}])) as Record<T,StarterMoveGuide>;
 const keys=Object.keys(result) as T[];
 const targets=new Map<string,{entry:GuideEntry;code:string;owner:T}>();
 const owners=new Map<string,T>();
 for(const key of keys)for(const vitrine of result[key].vitrines){const owner=companionVitrineOwner(result,vitrine.code);if(owner)owners.set(vitrine.code,owner);}
 const sourceOwners=new Map<string,T>();
 for(const key of keys)for(const entry of result[key].entries)if(!sourceOwners.has(entry.sourceId))sourceOwners.set(entry.sourceId,key);
 for(const {entry,code} of confirmed){
  let owner=owners.get(code);
  if(!owner){
   const regionOwner:Record<string,string>={N:"north",K:"north",B:"vraj",E:"east2",W:"west40-44",S:"south",C:"hinge"};
   owner=keys.find(key=>key===regionOwner[spnDisplayMemberships[code]?.[0]])??sourceOwners.get(entry.sourceId)??keys[0];
   if(!owner)continue;
   result[owner].vitrines.push({code,summary:"Confirmed placements",families:[],cityGroups:[]});owners.set(code,owner);
  }
  targets.set(entry.sourceId,{entry,code,owner});
 }
 for(const key of keys){
  const guide=result[key];
  guide.vitrines=guide.vitrines.map(vitrine=>{
   const trim=(groups:typeof vitrine.families)=>groups.map(group=>{
    const removed=new Set(group.sourceIds.filter(id=>{const target=targets.get(id);return target&&(target.owner!==key||target.code!==vitrine.code);}));
    return removed.size?{...group,sourceIds:group.sourceIds.filter(id=>!removed.has(id)),edges:group.edges?.filter(edge=>!removed.has(edge.fromSourceId)&&!removed.has(edge.toSourceId)),saintCount:undefined,spaceEstimate:undefined}:group;
   });
   return {...vitrine,families:trim(vitrine.families),cityGroups:trim(vitrine.cityGroups)};
  });
  const indexes=new Map(guide.entries.map((entry,index)=>[entry.sourceId,index]));
  const cases=new Map(guide.vitrines.map(v=>[v.code,v]));
  const members=new Map(guide.vitrines.map(v=>[v.code,new Set([...v.families,...v.cityGroups].flatMap(g=>g.sourceIds))]));
  const added=new Map<string,string[]>();
  for(const {entry,code,owner} of targets.values()){
   if(owner!==key)continue;
   const existing=indexes.get(entry.sourceId);
   const resolved={...entry,...(existing===undefined?{}:guide.entries[existing]),tier:entry.tier,city:entry.city,lifeStatus:entry.lifeStatus,destination:code,allocationPending:null,proposalTransfer:null};
   if(existing===undefined)guide.entries.push(resolved);else guide.entries[existing]=resolved;
   if(members.get(code)!.has(entry.sourceId))continue;
   const ids=added.get(code)??[];ids.push(entry.sourceId);added.set(code,ids);
  }
  for(const [code,sourceIds] of added){
   const groups=cases.get(code)!.cityGroups,index=groups.findIndex(group=>group.id===`confirmed:${code}`);
   if(index<0)groups.push({id:`confirmed:${code}`,title:"Confirmed placements",sourceIds,rationale:"",suggestedVitrines:[code]});
   else groups[index]={...groups[index],sourceIds:[...groups[index].sourceIds,...sourceIds]};
  }
 }
 return result;
}
