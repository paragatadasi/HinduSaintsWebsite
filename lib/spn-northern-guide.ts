import addon from "../data/museum/spn-vitrine5-addon-v1.json";
import shelfAddon from "../data/museum/spn-vitrine5-shelves-v1.json";
import {northernGuideContext as priorContext} from "./spn-northern-guide-v1";
import type {MuseumSaintPlacement} from "./museum-proposals";
import {createHash} from "node:crypto";
import cardsPacket from "../data/museum/spn-northern-guide-cards-v1.json";
import east from "../data/museum/spn-east-fill-reviewed-baseline-v1.json";
import {northernVoyage} from "./spn-northern-voyage";
import {projectScopedMoveGuide} from "./spn-datta-guide";
import {spnMovementBlockedReason} from "./spn-movement-holds";
import type {GuideDefinition} from "./spn-starter-guide-registry";
import type {StarterMoveGuide,PhysicalState,GuideEntry,GuideGroup} from "./spn-move-guide";
const codes=["74","72","68","36","11","21","22","19","20","5"];
const clearCodes=["19","20","21","22","5"];
const captured=new Map([...east.assignments,...northernVoyage.assignments,...addon.rows].map(row=>[row.sourceId,row]));
const originalEntries:GuideEntry[]=cardsPacket.cards.flatMap(card=>card.rows.map(row=>{
 const source=captured.get(row.id);
 if(!source||source.saintId!==row.saintId||source.destination!==card.vitrine||!source.destination)throw new Error("A Northern guide source needs reconciliation.");
 return {sourceId:row.id,saintId:source.saintId,name:source.name,tier:source.capturedTier,city:row.locality??"",relicDescription:row.description??"",destination:source.destination,section:source.capturedBaseline.section,family:card.title,rationale:card.note,reviewNotes:[card.note,row.relationshipBasis].filter(Boolean),movementBlockedReason:source.saintId?spnMovementBlockedReason(row.id):"Resolve this source identity before recording a move."};
}));
if(originalEntries.length!==111||new Set(originalEntries.map(row=>row.sourceId)).size!==111||cardsPacket.assignmentPacketVersion!==northernVoyage.researchPacketVersion)throw new Error("The Northern guide coverage changed.");
const entries:GuideEntry[]=[...originalEntries,...addon.rows.map(row=>({sourceId:row.sourceId,saintId:row.saintId,name:row.name,tier:row.capturedTier,city:row.city,relicDescription:row.description,destination:"5",section:row.capturedBaseline.section,family:addon.summary,rationale:"Keep the Kriya branches together; shelf positions are provisional.",movementBlockedReason:spnMovementBlockedReason(row.sourceId)}))];
if(entries.length!==126||new Set(entries.map(row=>row.sourceId)).size!==126)throw new Error("Vitrine 5 must add exactly 15 distinct holdings.");
const hash=(value:unknown)=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
export const northernGuideContext={guideVersion:"spn-northern-guide-2026-10-30-v2",contentDigest:hash([northernVoyage,cardsPacket,addon,shelfAddon]),assignmentDigest:hash(entries.map(row=>[row.sourceId,row.destination]).sort((a,b)=>a[0].localeCompare(b[0])))};
const group=(card:typeof cardsPacket.cards[number]):GuideGroup=>({id:"northern:"+card.id,title:card.title,sourceIds:card.rows.map(row=>row.id),rationale:card.note,edges:card.edges,suggestedVitrines:[card.vitrine]});
export const northernMoveGuide:StarterMoveGuide={...northernGuideContext,version:northernGuideContext.guideVersion,proposalVersion:northernVoyage.version,title:"Northern journey",phaseLabel:"Northern journey",proposalLabel:"East–North connections",allowClear:true,clearancePerDestination:true,requiredClearVitrines:clearCodes,clearanceRequiredDestinations:clearCodes,preparationVitrines:codes,optionalClearVitrines:["11","36"],previousClearanceVersions:[priorContext.guideVersion],entries,
 vitrines:codes.filter(code=>code!=="5").map(code=>({code,summary:northernVoyage.caseStories[code as keyof typeof northernVoyage.caseStories]??northernVoyage.receivingDestinationNotes[code as keyof typeof northernVoyage.receivingDestinationNotes],families:cardsPacket.cards.filter(card=>card.vitrine===code&&card.type==="story").map(group),cityGroups:cardsPacket.cards.filter(card=>card.vitrine===code&&card.type!=="story").map(group)})),alternatives:[],reportedPlacements:[]};
northernMoveGuide.vitrines.push({code:"5",summary:addon.summary,families:[{id:"northern:v5-kriya",title:addon.summary,sourceIds:addon.rows.map(row=>row.sourceId),rationale:"",suggestedVitrines:["5"],edges:shelfAddon.vitrines[0].relationships.filter(e=>e.direction!=="none"&&addon.rows.some(r=>r.sourceId===e.fromSourceId)&&addon.rows.some(r=>r.sourceId===e.toSourceId)).map(e=>({...e,basis:e.uncertain?"source":"reviewed"}))}],cityGroups:[]});
export const northernGuideDefinition:GuideDefinition={context:northernGuideContext,previousVersions:[priorContext.guideVersion],suggestions:[...northernMoveGuide.vitrines.flatMap(v=>[...v.families.map(g=>({id:g.id,kind:"family" as const,sourceIds:g.sourceIds,targetVitrine:v.code})),...v.cityGroups.map(g=>({id:g.id,kind:"city" as const,sourceIds:g.sourceIds,targetVitrine:v.code}))]),...entries.map(row=>({id:"row:"+row.sourceId,kind:"row" as const,sourceIds:[row.sourceId],targetVitrine:row.destination}))],physicalScope:{allowClear:true,clearancePerDestination:true,clearVitrines:clearCodes,clearanceRequiredDestinations:clearCodes,preparationVitrines:codes,previousClearanceVersions:[priorContext.guideVersion],destinations:Object.fromEntries(entries.map(row=>[row.sourceId,row.destination]))}};
export function projectNorthernGuide(current:MuseumSaintPlacement[],physical:PhysicalState){
 const guide=projectScopedMoveGuide(northernMoveGuide,current,physical);
 const changed=new Map<string,string>();
 for(const entry of entries){const baseline=captured.get(entry.sourceId)!.capturedBaseline;const live=current.find(row=>row.id===baseline.placementId&&row.saintId===entry.saintId);const saved=live?.arrangement;if(saved?.vitrine&&["Planned","Implemented"].includes(saved.status)&&saved.revision!==baseline.revision&&saved.vitrine!==entry.destination)changed.set(entry.sourceId,saved.vitrine);}
 return {...guide,vitrines:guide.vitrines.map(v=>({...v,families:v.families.map(g=>({...g,sourceIds:g.sourceIds.filter(id=>!changed.has(id))})).filter(g=>g.sourceIds.length),cityGroups:v.cityGroups.map(g=>({...g,sourceIds:g.sourceIds.filter(id=>!changed.has(id))})).filter(g=>g.sourceIds.length)})),outgoingDependencies:entries.filter(entry=>changed.has(entry.sourceId)).map(entry=>({sourceId:entry.sourceId,name:entry.name,previousProposedVitrine:entry.destination,proposedDestination:changed.get(entry.sourceId)!,state:"Newer curator destination retained"}))};
}

export function removeSupersededNorthernSuggestions(guide:StarterMoveGuide):StarterMoveGuide{
 const superseded=new Set([...northernVoyage.assignments,...addon.rows].map(row=>row.sourceId));
 const retain=(id:string)=>!superseded.has(id);
 return {...guide,entries:guide.entries.filter(row=>retain(row.sourceId)),
  vitrines:guide.vitrines.map(v=>({...v,families:v.families.map(g=>({...g,sourceIds:g.sourceIds.filter(retain),edges:g.edges?.filter(e=>retain(e.fromSourceId)&&retain(e.toSourceId))})).filter(g=>g.sourceIds.length),cityGroups:v.cityGroups.map(g=>({...g,sourceIds:g.sourceIds.filter(retain)})).filter(g=>g.sourceIds.length)})),
  alternatives:guide.alternatives.map(g=>({...g,sourceIds:g.sourceIds.filter(retain)})).filter(g=>g.sourceIds.length)};
}
