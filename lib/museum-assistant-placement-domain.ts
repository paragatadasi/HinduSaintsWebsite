import {MuseumMoveSessionError} from "./museum-move-session-domain";
import {z} from "zod";
import type {GuideDefinition} from "./spn-starter-guide-registry";
import type {CompanionAddition} from "./museum-companion-additions-state";

export const savedAdditionReference=z.object({sourceId:z.string().min(1).max(200),version:z.number().int().positive()}).strict();
type PlacementRequest={guideContext?:{guideVersion:string;contentDigest:string;assignmentDigest:string};records:{sourceId:string;saintId:string|null;to:{kind:string;code:string;shelf?:string|null}}[];clearedVitrines?:string[];initialCaseClearAcknowledged?:true;componentStagingAcknowledgements?:unknown;retainedCaseClearanceAcknowledgement?:unknown;caseContentsStaging?:unknown;alternativeDecision?:unknown;curatorAddition?:unknown};
export function assertAssistantGuidePlacement(input:PlacementRequest,guide?:Pick<GuideDefinition,"context"|"readOnly"|"physicalScope">){
 const addition=input.curatorAddition===undefined?null:savedAdditionReference.safeParse(input.curatorAddition);
 if(!input.guideContext||input.records.length!==1||input.records[0].to.kind!=="vitrine"||(!addition&&input.records[0].to.shelf)||input.clearedVitrines?.length||input.initialCaseClearAcknowledged!==undefined||input.componentStagingAcknowledgements!==undefined||input.retainedCaseClearanceAcknowledgement!==undefined||input.caseContentsStaging!==undefined||input.alternativeDecision!==undefined||addition&&!addition.success)
  throw new MuseumMoveSessionError(403,"Confirm one placement from the current move guide. A curator must change destinations or clear vitrines.");
 if(!guide?.physicalScope||guide.readOnly)throw new MuseumMoveSessionError(403,"Open a current move guide before confirming this placement.");
 if(guide.context.guideVersion!==input.guideContext.guideVersion||guide.context.contentDigest!==input.guideContext.contentDigest||guide.context.assignmentDigest!==input.guideContext.assignmentDigest)
  throw new MuseumMoveSessionError(409,"The move guide changed. Reload before confirming the placement.");
 const record=input.records[0];
 if(addition?.success){
  if(addition.data.sourceId!==record.sourceId||!Object.values(guide.physicalScope.destinations).includes(record.to.code))
   throw new MuseumMoveSessionError(403,"Confirm only the saved destination in its current receiving guide.");
 }else if(guide.physicalScope.destinations[record.sourceId]!==record.to.code)
  throw new MuseumMoveSessionError(403,"Confirm only the destination shown in this move guide.");
}

type SavedAdditionBinding=Pick<CompanionAddition,"sourceId"|"saintId"|"sourceRevision"|"vitrine"|"shelf"|"version">;
export function assertSavedAdditionPlacement(reference:{sourceId:string;version:number},record:{sourceId:string;saintId:string|null;expectedSourceRevision:string;to:{kind:string;code:string;shelf?:string|null}},addition?:SavedAdditionBinding):asserts addition is SavedAdditionBinding{
 if(!addition||addition.version!==reference.version||addition.sourceId!==reference.sourceId||addition.sourceId!==record.sourceId||addition.saintId!==record.saintId||addition.sourceRevision!==record.expectedSourceRevision||record.to.kind!=="vitrine"||record.to.code!==addition.vitrine||(record.to.shelf??null)!==addition.shelf)
  throw new MuseumMoveSessionError(409,"The added destination changed. Reload it before recording the move.");
}

export function assertAssistantEffectiveDestination(input:PlacementRequest,rows:{sourceId:string;saintId:string|null;effectiveVitrine:string}[]){
 const record=input.records[0],matches=rows.filter(row=>row.sourceId===record.sourceId);
 if(matches.length!==1||matches[0].saintId!==record.saintId||matches[0].effectiveVitrine!==record.to.code)
  throw new MuseumMoveSessionError(409,"The proposed destination changed or needs review. Ask a curator to review it, then reload the move guide.");
}
