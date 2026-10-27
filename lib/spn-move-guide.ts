export type GuideEntry = {
 sourceId:string;saintId:string|null;name:string;tier:string;city:string;relicDescription:string;
 destination:string;section:string;family:string;rationale:string;
};
export type GuideGroup = {
 id:string;title:string;sourceIds:string[];rationale:string;suggestedVitrines:string[];
 saintCount?:number;unmatchedEntryCount?:number;relationshipReviewRequired?:boolean;
 spaceEstimate?:{label:string;basis:string;confidence:string};
 edges?:{fromSourceId:string;toSourceId:string;label:string}[];
};
export type StarterMoveGuide = {
 version:string;contentDigest:string;proposalVersion:string;assignmentDigest:string;title:string;entries:GuideEntry[];
 vitrines:{code:string;summary:string;families:GuideGroup[];cityGroups:GuideGroup[]}[];
 alternatives:GuideGroup[];reportedPlacements:{sourceId:string;destination:string;date:string}[];
};
export type PhysicalLocation={kind:"vitrine"|"table";code:string;label:string;shelf?:string|null};
export type CompanionRow={
 sourceId:string;name:string;saintId:string|null;original:PhysicalLocation|null;current:PhysicalLocation|null;
 currentBasis:string;currentVersion:number;currentRevision:string;sourceRevision:string;
 fixedHousing:boolean;verifiedItemIds:string[];identityChanged:boolean;
};
export type PhysicalState={rows:CompanionRow[];unmappedCurrentLocations:{sourceId:string;location:PhysicalLocation;version:number}[]};
export function isPlaced(row:CompanionRow,destination:string){return row.currentBasis==="confirmed"&&row.current?.kind==="vitrine"&&row.current.code===destination;}
export function currentLocationLabel(location:PhysicalLocation|null){return location?location.label+(location.shelf?` · Shelf ${location.shelf}`:""):"Location not recorded";}

export type GuideDecision={suggestionId:string;decision:"pending"|"deferred"|"declined";note:string|null;version:number};
