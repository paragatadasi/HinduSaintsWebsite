import {MuseumMoveSessionError} from "./museum-move-session-domain";
import type {GuideDefinition} from "./spn-starter-guide-registry";

type PlacementRequest={guideContext?:{guideVersion:string;contentDigest:string;assignmentDigest:string};records:{sourceId:string;saintId:string|null;to:{kind:string;code:string;shelf?:string|null}}[];clearedVitrines?:string[];initialCaseClearAcknowledged?:true;componentStagingAcknowledgements?:unknown;retainedCaseClearanceAcknowledgement?:unknown;alternativeDecision?:unknown;curatorAddition?:unknown};
export function assertAssistantGuidePlacement(input:PlacementRequest,guide?:Pick<GuideDefinition,"context"|"readOnly"|"physicalScope">){
 if(!input.guideContext||input.records.length!==1||input.records[0].to.kind!=="vitrine"||input.records[0].to.shelf||input.clearedVitrines?.length||input.initialCaseClearAcknowledged!==undefined||input.componentStagingAcknowledgements!==undefined||input.retainedCaseClearanceAcknowledgement!==undefined||input.alternativeDecision!==undefined||input.curatorAddition!==undefined)
  throw new MuseumMoveSessionError(403,"Confirm one placement from the current move guide. A curator must change destinations or clear vitrines.");
 if(!guide?.physicalScope||guide.readOnly)throw new MuseumMoveSessionError(403,"Open a current move guide before confirming this placement.");
 if(guide.context.guideVersion!==input.guideContext.guideVersion||guide.context.contentDigest!==input.guideContext.contentDigest||guide.context.assignmentDigest!==input.guideContext.assignmentDigest)
  throw new MuseumMoveSessionError(409,"The move guide changed. Reload before confirming the placement.");
 const record=input.records[0];
 if(guide.physicalScope.destinations[record.sourceId]!==record.to.code)
  throw new MuseumMoveSessionError(403,"Confirm only the destination shown in this move guide.");
}

export function assertAssistantEffectiveDestination(input:PlacementRequest,rows:{sourceId:string;saintId:string|null;effectiveVitrine:string}[]){
 const record=input.records[0],matches=rows.filter(row=>row.sourceId===record.sourceId);
 if(matches.length!==1||matches[0].saintId!==record.saintId||matches[0].effectiveVitrine!==record.to.code)
  throw new MuseumMoveSessionError(409,"The proposed destination changed or needs review. Ask a curator to review it, then reload the move guide.");
}
