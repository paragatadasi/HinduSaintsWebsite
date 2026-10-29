import {availableDeclineAlternatives} from "./museum-guide-decision-domain";
import {planningVitrineAllowed} from "./museum-planning-constraints";
import type {Prisma} from "./generated/prisma/client";
import {MuseumMoveSessionError} from "./museum-move-session-domain";
import {currentSpnProposalRelease} from "./spn-current-proposal";
import {db} from "./db";
import {readStarterGuideDefinition} from "./spn-starter-guide-registry";
import {isActiveSpnObservation} from "./spn-observation-suppression";

export type AlternativeDestination = {sourceId:string;vitrine:string;shelf:string|null;guideVersion:string;suggestionId:string;version:number;updatedAt:string};

// Existing declines are planning preferences, never evidence of a physical move.
export async function readGuideAlternativeDestinations(client:Prisma.TransactionClient=db){
 const decisions=await client.museumGuideSuggestionDecision.findMany({where:{museumId:"museum-spn"},orderBy:[{updatedAt:"desc"},{suggestionId:"desc"}]});
 const allowed=new Set(availableDeclineAlternatives(currentSpnProposalRelease.proposal.layout.vitrines));
 const proposalRows=[...currentSpnProposalRelease.proposal.rows,...currentSpnProposalRelease.proposal.namedOnly];
 const latest=new Map<string,AlternativeDestination|null>();
 for(const decision of decisions){
  let guide;
  try{guide=readStarterGuideDefinition(decision.guideVersion);}catch(error){if(error instanceof MuseumMoveSessionError&&error.status===409)continue;throw error;}
  const suggestion=guide.suggestions.find(s=>s.id===decision.suggestionId);
  if(!suggestion)continue;
  for(const sourceId of suggestion.sourceIds){
   if(latest.has(sourceId)||!isActiveSpnObservation(sourceId))continue;
   latest.set(sourceId,decision.decision==="declined"&&decision.alternativeVitrine&&allowed.has(decision.alternativeVitrine)&&planningVitrineAllowed("museum-spn",proposalRows.find(r=>r.sourceId===sourceId)?.section??"",decision.alternativeVitrine)?{
    sourceId,vitrine:decision.alternativeVitrine,shelf:decision.alternativeShelf,
    guideVersion:decision.guideVersion,suggestionId:decision.suggestionId,version:decision.version,updatedAt:decision.updatedAt.toISOString()
   }:null);
  }
 }
 const alternatives=[...latest.values()].filter((row):row is AlternativeDestination=>row!==null);
 const baseline=new Map(currentSpnProposalRelease.proposal.rows.map(r=>[r.sourceId,r.baseline?.placementId]));
 const events=await client.auditEvent.findMany({where:{action:"museum.arrangement.updated",entityType:"MuseumArrangement",afterJson:{path:["museumId"],equals:"museum-spn"},entityId:{in:alternatives.flatMap(a=>[a.sourceId,baseline.get(a.sourceId)].filter((v):v is string=>!!v))}},select:{entityId:true,createdAt:true}});
 return alternatives.filter(a=>!events.some(e=>(e.entityId===a.sourceId||e.entityId===baseline.get(a.sourceId))&&e.createdAt.getTime()>=Date.parse(a.updatedAt)));
}

