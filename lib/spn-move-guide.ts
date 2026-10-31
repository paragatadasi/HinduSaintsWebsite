import type {ComponentPlacement} from "./museum-component-clearance-domain";
export type GuideEntry = {
 proposalTransfer?:import("./spn-regional-pending-transfers").RegionalPendingTransfer|null;
 optionalAddition?:boolean;displayRoleTier?:string|null;
 sourceId:string;saintId:string|null;name:string;tier:string;city:string;relicDescription:string;
 destination:string;section:string;family:string;rationale:string;
 reviewNotes?:string[];movementBlockedReason?:string;reportedOrigin?:string|null;
 lifeStatus?:{tag:string|null;basis:string};currentLocation?:PhysicalLocation|null;currentLocationBasis?:string;
};
export type GuideGroup = {
 id:string;title:string;sourceIds:string[];rationale:string;suggestedVitrines:string[];
 suggestionIdsByTarget?:Record<string,string>;saintCount?:number;unmatchedEntryCount?:number;relationshipReviewRequired?:boolean;
 allowedTargetVitrines?:string[];
 spaceEstimate?:{label:string;basis:string;confidence:string};
 edges?:{fromSourceId:string;toSourceId:string;label:string;basis?:string}[];
};
export type StarterMoveGuide = {
 optionalClearVitrines?:string[];
 contextAnchors?:{sourceId:string;name:string;destination:string;rationale:string;reviewNotes:string[]}[];
 bilashFollowup?:{sourceId:string;saintId:string;destination:string|null;status:"provisional"|"newer_curator_destination_retained"|"needs_review";reason:string;qualifier:string};
 version:string;contentDigest:string;proposalVersion:string;assignmentDigest:string;title:string;entries:GuideEntry[];
 proposalLabel?:string;allowClear?:boolean;clearancePerDestination?:boolean;phaseLabel?:string;requiredClearVitrines?:string[];clearanceRequiredDestinations?:string[];preparationVitrines?:string[];previousClearanceVersions?:string[];
 preparatoryTransfers?:{sourceId:string;name:string;fromVitrine:string;toVitrine:string;finalDestination:string;requiredBefore:string[]}[];
 outgoingDependencies?:{sourceId:string;name:string;previousProposedVitrine:string;proposedDestination:null|string;state:string}[];
 transitionSourceIds?:string[];
 vitrines:{code:string;summary:string;families:GuideGroup[];cityGroups:GuideGroup[]}[];
 alternatives:GuideGroup[];reportedPlacements:{sourceId:string;destination:string;date:string}[];
};
export type PhysicalLocation={kind:"vitrine"|"table";code:string;label:string;shelf?:string|null};
export type CompanionRow={
 reviewedHousing?:{classification:string;reviewedDate:string;fitNote:string};
 housingEvidenceRevision?:string;
 componentPlacement?:ComponentPlacement|null;
 undo?:{available:boolean;receiptId?:string|null;previous:PhysicalLocation|null;previousBasis:string|null;previousConfirmedAt?:string|null;reason?:string|null};
 sourceId:string;name:string;saintId:string|null;original:PhysicalLocation|null;current:PhysicalLocation|null;
 currentBasis:string;currentVersion:number;currentRevision:string;sourceRevision:string;
 fixedHousing:boolean;verifiedItemIds:string[];identityChanged:boolean;
 movementBlockedReason?:string|null;
};
export type VitrinePreparation={vitrine:string;prepared:boolean;version:number;recordedAt:string;receiptId:string;basis:"preparation"|"legacy_clear"};
export type ClearCorrection={receiptId:string;vitrine:string;excludedCount:number;records:{sourceId:string;saintId:string|null;name:string;expectedCurrentRevision:string;expectedSourceRevision:string;expectedLocationVersion:number;previous:PhysicalLocation;previousConfirmedAt:string}[]};
export type PhysicalState={phaseClearances?:{guideVersion:string;vitrine:string;receiptId:string;recordedAt:string}[];clearCorrections?:ClearCorrection[];preparations?:VitrinePreparation[];reportedPlacementReceipts?:{guideContext:{guideVersion:string;contentDigest:string;assignmentDigest:string};complete:boolean};confirmationHistory?:{afterJson:unknown}[];rows:CompanionRow[];unmappedCurrentLocations:{sourceId:string;location:PhysicalLocation;version:number}[]};
export function isPlaced(row:CompanionRow,destination:string){return row.currentBasis==="confirmed"&&row.current?.kind==="vitrine"&&row.current.code===destination;}
export function currentLocationLabel(location:PhysicalLocation|null){return location?location.label+(location.shelf?` · Shelf ${location.shelf}`:""):"Location not recorded";}

export function companionLocationLabel(row?:(Pick<CompanionRow,"current"|"componentPlacement"> & Partial<Pick<CompanionRow,"original">>)|null){
 if(row?.componentPlacement)return `Staging area · Vitrine ${row.componentPlacement.origin.code} pieces only`;
 const label=currentLocationLabel(row?.current??null);
 return row?.current?.kind==="table"&&row.original?.kind==="vitrine"?`${label} · originally Vitrine ${row.original.code}`:label;
}

export type GuideDecision={suggestionId:string;decision:"pending"|"deferred"|"declined"|"not_on_display";note:string|null;version:number;alternativeVitrine?:string|null;alternativeShelf?:string|null};

export function reportedPlacementsRecorded(state:PhysicalState,reported:StarterMoveGuide["reportedPlacements"]){
 const saved=new Set<string>();
 for(const event of state.confirmationHistory??[]){
  const value=event.afterJson;if(!value||typeof value!=="object"||!("moves" in value)||!Array.isArray(value.moves))continue;
  for(const move of value.moves){
   if(!move||typeof move!=="object")continue;
   const location=move.location;
   if(typeof move.sourceId==="string"&&location?.kind==="vitrine"&&typeof location.code==="string")saved.add(move.sourceId+":"+location.code);
  }
 }
 return reported.every(p=>saved.has(p.sourceId+":"+p.destination));
}

export function cityFitsStarterCase(group:GuideGroup,code:string){
 return group.allowedTargetVitrines?.includes(code)===true;
}
