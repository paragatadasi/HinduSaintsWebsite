export type GuideEntry = {
 sourceId:string;saintId:string|null;name:string;tier:string;city:string;relicDescription:string;
 destination:string;section:string;family:string;rationale:string;
 reviewNotes?:string[];movementBlockedReason?:string;
};
export type GuideGroup = {
 id:string;title:string;sourceIds:string[];rationale:string;suggestedVitrines:string[];
 suggestionIdsByTarget?:Record<string,string>;saintCount?:number;unmatchedEntryCount?:number;relationshipReviewRequired?:boolean;
 allowedTargetVitrines?:string[];
 spaceEstimate?:{label:string;basis:string;confidence:string};
 edges?:{fromSourceId:string;toSourceId:string;label:string}[];
};
export type StarterMoveGuide = {
 version:string;contentDigest:string;proposalVersion:string;assignmentDigest:string;title:string;entries:GuideEntry[];
 proposalLabel?:string;
 transitionSourceIds?:string[];
 vitrines:{code:string;summary:string;families:GuideGroup[];cityGroups:GuideGroup[]}[];
 alternatives:GuideGroup[];reportedPlacements:{sourceId:string;destination:string;date:string}[];
};
export type PhysicalLocation={kind:"vitrine"|"table";code:string;label:string;shelf?:string|null};
export type CompanionRow={
 sourceId:string;name:string;saintId:string|null;original:PhysicalLocation|null;current:PhysicalLocation|null;
 currentBasis:string;currentVersion:number;currentRevision:string;sourceRevision:string;
 fixedHousing:boolean;verifiedItemIds:string[];identityChanged:boolean;
 movementBlockedReason?:string|null;
};
export type PhysicalState={reportedPlacementReceipts?:{guideContext:{guideVersion:string;contentDigest:string;assignmentDigest:string};complete:boolean};confirmationHistory?:{afterJson:unknown}[];rows:CompanionRow[];unmappedCurrentLocations:{sourceId:string;location:PhysicalLocation;version:number}[]};
export function isPlaced(row:CompanionRow,destination:string){return row.currentBasis==="confirmed"&&row.current?.kind==="vitrine"&&row.current.code===destination;}
export function currentLocationLabel(location:PhysicalLocation|null){return location?location.label+(location.shelf?` · Shelf ${location.shelf}`:""):"Location not recorded";}

export type GuideDecision={suggestionId:string;decision:"pending"|"deferred"|"declined";note:string|null;version:number};

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
