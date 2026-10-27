import alternatives from "@/data/museum/spn-city-alternative-metadata-v1.json";
import {registeredStarterGuide as packet} from "./spn-starter-guide-registry";
import type {StarterMoveGuide,GuideGroup} from "./spn-move-guide";

export const starterMoveGuide:StarterMoveGuide={
 version:packet.version,contentDigest:packet.contentDigest,proposalVersion:packet.proposalVersion,assignmentDigest:packet.assignmentDigest,title:packet.title,
 reportedPlacements:packet.physicalConfirmations.moves.map(row=>({sourceId:row.sourceId,destination:row.currentLocation.vitrine,date:row.confirmedDate})),
 entries:[...alternatives.rows.filter(a=>!packet.rows.some(r=>r.sourceId===a.sourceId)).map(row=>({sourceId:row.sourceId,saintId:row.saintId,name:row.name,tier:row.tier,city:row.city,relicDescription:row.relicDescription??"",destination:row.currentlySuggestedVitrine,section:row.section,family:"",rationale:"Current reviewed city-group placement."})),...packet.rows.map(row=>({sourceId:row.sourceId,saintId:row.saintId,name:row.name,tier:row.tier,city:row.planningCity||row.city,relicDescription:row.relicDescription??"",destination:row.vitrine,section:row.section,family:row.family??"",rationale:row.placementReason.text}))],
 vitrines:packet.vitrines.map(v=>({code:v.code,summary:v.summary,
  families:v.families.map(g=>({...g,suggestedVitrines:[v.code]})),
  cityGroups:v.cityGroups.map(g=>({...g,title:g.city}))})),
 alternatives:packet.cityAlternatives.map((g,index):GuideGroup=>({id:g.id,suggestionIdsByTarget:g.suggestionIdsByTarget,title:g.city,sourceIds:g.sourceIds,rationale:g.rationale,suggestedVitrines:[g.currentlySuggestedVitrine],saintCount:g.saintCount,unmatchedEntryCount:g.unmatchedEntryCount,relationshipReviewRequired:g.alternativeRequiresFamilyCheck,
 spaceEstimate:{label:`About ${g.knownShelfEstimate.toFixed(2)} source-shelf equivalents${g.unknownFootprintCount?` + ${g.unknownFootprintCount} unknown`:""}`,basis:g.spaceBasis,confidence:"Planning estimate"}}))
};

