import type {ProposalObservation} from './spn-room-proposal';
import {showFlexibleSpace} from './spn-room-proposal';
import type {ExplorerOption,ExplorerPlacement} from './spn-room-explorer';

export const sankaranyaColocation={
 id:'sankaranya-radharaman-2026-10-26',
 saintId:'cms0w7d9l01c207qil0n62o19',
 sourceId:'rec7cV8OOW6dYau1K',
 targetSaintId:'cms0w7h3c068907qi1ajzanag',
 rationale:'Place Sankaranya Puri Goswami (Yogendranath Goswami) with Radharaman Charan Das, following the curator-approved correction of 26 October 2026. This record is distinct from Chaitanya’s brother Vishvarupa.',
};

type CorrectableRelease={
 proposal:{rows:ProposalObservation[];namedOnly:ProposalObservation[];indicators:{vitrine:string;totalObservedShelfShares:number;referenceShelfShares:number;comparisonHeadroomShelfShares:number|null;potentialFlexibleSpace:boolean;flexibleSpaceLabel:string|null;flexibleSpaceExclusion:string|null}[]};
 designData:{options:ExplorerOption[];placements:ExplorerPlacement[]};
};

// Apply accepted corrections to a copy; keep the original research packets and live curator state intact.
export function correctSpnProposal<T extends CorrectableRelease>(release:T):T{
 const correction=sankaranyaColocation;
 const sources=release.proposal.rows.filter(r=>r.saintId===correction.saintId);
 if(!sources.length)return release;
 if(sources.length!==1||sources[0].sourceId!==correction.sourceId)throw new Error('Sankaranya correction requires review of the changed source set');
 const destinations=new Set([...release.proposal.rows,...release.proposal.namedOnly].filter(r=>r.saintId===correction.targetSaintId).map(r=>r.vitrine));
 if(destinations.size!==1)throw new Error('Radharaman needs one proposed destination for the approved co-location');
 const destination=[...destinations][0],origin=sources[0].vitrine;
 const result=structuredClone(release);
 const row=result.proposal.rows.find(r=>r.sourceId===correction.sourceId)!;
 row.vitrine=destination;
 for(const placement of result.designData.placements){
  if(placement.saintId===correction.saintId){placement.vitrine=destination;placement.rationale=correction.rationale;}
 }
 const targetName=result.proposal.rows.find(r=>r.saintId===correction.targetSaintId)?.name??result.proposal.namedOnly.find(r=>r.saintId===correction.targetSaintId)!.name;
 for(const option of result.designData.options){
  for(const [number,anchor] of Object.entries(option.primeAnchors)){
   if(number!==destination){
    anchor.people=anchor.people.split(' · ').filter(name=>name!==row.name).join(' · ');
    if(!anchor.people)delete option.primeAnchors[number];
   }
  }
  option.primeAnchors[destination]={people:option.primeAnchors[destination]?.people.includes(row.name)?option.primeAnchors[destination].people:[option.primeAnchors[destination]?.people||targetName,row.name].join(' · '),reason:correction.rationale};
 }
 for(const indicator of result.proposal.indicators.filter(i=>i.vitrine===origin||i.vitrine===destination)){
  const total=result.proposal.rows.filter(r=>r.vitrine===indicator.vitrine).reduce((n,r)=>n+(r.share??0),0);
  indicator.totalObservedShelfShares=Number(total.toFixed(4));
  indicator.comparisonHeadroomShelfShares=Number((indicator.referenceShelfShares-total).toFixed(4));
  indicator.potentialFlexibleSpace=showFlexibleSpace(indicator.vitrine,!indicator.flexibleSpaceExclusion&&indicator.referenceShelfShares-total>=1,false);
  indicator.flexibleSpaceLabel=indicator.potentialFlexibleSpace?'Potential flexible space':null;
 }
 return result;
}
