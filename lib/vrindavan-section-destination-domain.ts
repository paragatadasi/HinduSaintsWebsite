import {planningVitrineAllowed} from "./museum-planning-constraints";
import {vitrineNumber} from "./museum-move-planner-domain";
export type DestinationRow={id:string;saintId?:string|null;name:string;section:string;familyId?:string;arrangement?:{status:string;vitrine:string;shelf:string}};
export type DestinationArea={section:string;vitrines:string[]};
export type SectionDestination={saintId:string;name:string;fromSection:string;toSection:string;mode:"exact"|"flexible"|"unassigned";vitrines:string[];shelf:string;message:string};
export function sectionDestination(row:DestinationRow,section:string,areas:DestinationArea[]):SectionDestination{
 const raw=areas.find(area=>area.section===section)?.vitrines??[];
 const valid=[...new Set(raw.map(vitrineNumber).filter((v):v is string=>v!==null))];
 // Invalid or fixed-location-incompatible saved areas are not automatic targets.
 const vitrines=raw.length===valid.length&&valid.every(v=>planningVitrineAllowed("museum-vrindavan",section,v))?valid:[];
 const previous=row.arrangement;
 const retained=previous?.status==="Planned"&&vitrines.includes(previous.vitrine)?previous.vitrine:null;
 const mode=retained||vitrines.length===1?"exact":vitrines.length>1?"flexible":"unassigned";
 const target=retained??vitrines[0];
 return {saintId:row.saintId!,name:row.name,fromSection:row.section,toSection:section,mode,vitrines:mode==="exact"?[target]:vitrines,shelf:mode==="exact"&&previous?.vitrine===target?previous.shelf:"",message:mode==="exact"?`Plan Vitrine ${target}.`:mode==="flexible"?`Plan within Vitrines ${vitrines.join(", ")}; choose the exact vitrine when moving.`:"No valid saved section area: destination will be unassigned."};
}
export function sectionDestinationGuard(rows:DestinationRow[],moving:DestinationRow[],section:string,areas:DestinationArea[],shared:{saintIds:string[]}[],groupKey?:string){
 const ids=new Set(moving.map(row=>row.saintId));
 for(const row of moving){
  if(!row.saintId)return "Resolve the saint identity before changing its destination.";
  const family=groupKey??row.familyId;
  if(family&&rows.some(peer=>peer.familyId===family&&!ids.has(peer.saintId)&&peer.section!==section))return "Move the whole display family, or explicitly detach this saint before changing its section.";
  const target=sectionDestination(row,section,areas);
  for(const entry of shared.filter(entry=>entry.saintIds.includes(row.saintId!))){
   for(const saintId of entry.saintIds.filter(id=>!ids.has(id))){
    const peer=rows.find(peer=>peer.saintId===saintId);
    if(!peer||peer.section!==section)return "This source entry is shared with another saint. Review their section and destination together before saving.";
    if(peer.arrangement?.status==="Planned"&&(target.mode==="unassigned"||!target.vitrines.includes(peer.arrangement.vitrine)))return "This shared source entry has a different planned destination. Review the shared entry before saving.";
   }
  }
 }
 const plans=moving.map(row=>sectionDestination(row,section,areas));
 for(const entry of shared){const linked=plans.filter(plan=>entry.saintIds.includes(plan.saintId));if(linked.length>1&&linked.some(plan=>plan.mode!=="unassigned")&&!linked[0].vitrines.some(v=>linked.every(plan=>plan.vitrines.includes(v))))return "Shared source entries need a common destination before this section move can be saved.";}
 return undefined;
}