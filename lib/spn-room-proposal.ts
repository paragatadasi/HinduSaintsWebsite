import type {MuseumSaintPlacement} from './museum-proposals';

export type ProposalObservation={sourceId:string;saintId:string|null;name:string;vitrine:string;tier:string;section:string;
 sourceVitrine:string;sourceShelf:string;unresolved:boolean;allocationKind:string;share:number|null;state:string;
 baseline:{placementId:string;section:string;tier:string;familyKey:string;regionTags:string[];revision:string;proposalRevision:string}|null};
export type ExplorerObservation=ProposalObservation&{currentVitrine:string;currentShelf:string;currentStatus:string;regions:string[];reviewReason:string;effectiveVitrine:string};
const sameTags=(a:string[],b:string[])=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());

// The baseline is read-only. Current curator arrangements take precedence without writing any records.
export function reconcileSpnRoomProposal(proposed:ProposalObservation[],current:MuseumSaintPlacement[]):ExplorerObservation[]{
 const bySaint=new Map<string,MuseumSaintPlacement[]>();
 for(const row of current)if(row.saintId)bySaint.set(row.saintId,[...(bySaint.get(row.saintId)??[]),row]);
 return proposed.map(row=>{
  const candidates=row.saintId?bySaint.get(row.saintId)??[]:[];
  const live=candidates.find(p=>p.id===row.baseline?.placementId);
  let reviewReason='';
  if(row.saintId&&row.baseline&&!live)reviewReason='Current record needs reconciliation';
  if(live?.linkIssue||live?.placementState?.startsWith('Conflicting'))reviewReason='Identity or placement conflict';
  if(live&&row.baseline){
   const base=row.baseline;
   if(live.section!==base.section||live.tier!==(base.tier==='Primary'?'Featured':base.tier)||
      (live.curatorialFamily||live.familyId||'')!==base.familyKey||!sameTags(live.spnRegionTags??[],base.regionTags)||
      (live.arrangement?.proposalRevision??'')!==base.proposalRevision)reviewReason='Curator record changed since this proposal';
   if(live.arrangementNeedsReview)reviewReason='Saved arrangement needs review';
  }
  const saved=live?.arrangement;
  const currentVitrine=saved?.vitrine??'';
  const retained=!!currentVitrine&&(saved?.status==='Planned'||saved?.status==='Implemented');
  if(retained&&currentVitrine!==row.vitrine)reviewReason='Current curator destination retained';
  return {...row,name:live?.name??row.name,tier:live?.tier==='Featured'?'Primary':live?.tier??row.tier,
   section:live?.section??row.section,regions:live?.spnRegionTags??[],currentVitrine,currentShelf:saved?.shelf??'',
   currentStatus:saved?.status??'Proposed',reviewReason,
   effectiveVitrine:retained?currentVitrine:row.vitrine};
 });
}

export const flexibleSpaceExclusions=new Set(['23','30','31','64','68','69','83','84','85']);
export function showFlexibleSpace(vitrine:string,potential:boolean,hasCurrentChanges:boolean){
 return potential&&!hasCurrentChanges&&!flexibleSpaceExclusions.has(vitrine);
}


