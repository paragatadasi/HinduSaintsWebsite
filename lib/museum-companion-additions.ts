import {currentCompanionAdditions} from "./museum-companion-addition-validation";
import proposalOverlay from "../data/museum/spn-approved-proposal-overlay-v1.json";
import {z} from "zod";
import {db} from "./db";
import {readPhysicalLocationView} from "./museum-physical-locations";
import {readMuseumMoveSessionSource,registeredMoveProposal} from "./museum-move-session-source";
import {MuseumMoveSessionError} from "./museum-move-session-domain";
import {availableDeclineAlternatives} from "./museum-guide-decision-domain";
import {currentSpnProposalRelease} from "./spn-current-proposal";
import {isActiveSpnObservation} from "./spn-observation-suppression";
import {readCompanionAdditions,readEffectiveCompanionAdditions,type CompanionAddition} from "./museum-companion-additions-state";
export {readCompanionAdditions} from "./museum-companion-additions-state";
export type {CompanionAddition} from "./museum-companion-additions-state";
const action="museum.companion.addition.planned";
export const additionInput=z.object({museumId:z.literal("museum-spn"),sourceId:z.string().min(1).max(200),expectedSourceRevision:z.string().min(1),expectedVersion:z.number().int().nonnegative(),vitrine:z.string().min(1).max(20),shelf:z.string().trim().max(100).default(""),clientRequestId:z.string().uuid()}).strict();
export async function saveCompanionAddition(raw:unknown,actorId:string){
 const input=additionInput.parse(raw);
 if(proposalOverlay.excludedFromMuseumDisplay.some(row=>row.sourceId===input.sourceId))throw new MuseumMoveSessionError(409,"This holding is excluded from the museum display.");
 if(!availableDeclineAlternatives(currentSpnProposalRelease.proposal.layout.vitrines).includes(input.vitrine))throw new MuseumMoveSessionError(400,"Choose an available display vitrine.");
 return db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT true FROM pg_advisory_xact_lock(hashtext('museum-move-session:spn'))`;
  await tx.$queryRaw`SELECT true FROM pg_advisory_xact_lock(hashtext('museum-companion-additions:spn'))`;
  const additions=await readCompanionAdditions(tx),previous=additions.find(item=>item.sourceId===input.sourceId);
  if(previous?.clientRequestId===input.clientRequestId){if(previous.vitrine!==input.vitrine||(previous.shelf??"")!==input.shelf)throw new MuseumMoveSessionError(409,"This request already saved a different destination.");return previous;}
  if((previous?.version??0)!==input.expectedVersion)throw new MuseumMoveSessionError(409,"Another curator changed this destination. Reload the result before saving.");
  const state=await readPhysicalLocationView(tx=>readMuseumMoveSessionSource(registeredMoveProposal.version,tx),tx,[input.sourceId],false);
  const row=state.rows[0];
  if(!row||!row.saintId||row.identityChanged||row.sourceRevision!==input.expectedSourceRevision||!isActiveSpnObservation(input.sourceId))throw new MuseumMoveSessionError(409,"The source identity changed or needs review. Reload before adding this record.");
  if(row.fixedHousing||row.verifiedItemIds.length||row.movementBlockedReason)throw new MuseumMoveSessionError(409,"This record needs its existing item or fixed-display workflow.");
  const addition:CompanionAddition={sourceId:input.sourceId,saintId:row.saintId,sourceRevision:row.sourceRevision,vitrine:input.vitrine,shelf:input.shelf||null,version:(previous?.version??0)+1,updatedAt:new Date().toISOString(),clientRequestId:input.clientRequestId};
  await tx.auditEvent.create({data:{userId:actorId,action,entityType:"MuseumCompanionAddition",entityId:"museum-spn:"+input.sourceId,afterJson:addition}});
  return addition;
 },{isolationLevel:"Serializable",timeout:60000});
}

export async function readCurrentCompanionAdditions(){
 const additions=await readEffectiveCompanionAdditions();
 if(!additions.length)return [];
 const view=await readPhysicalLocationView(tx=>readMuseumMoveSessionSource(registeredMoveProposal.version,tx),db,undefined,false);
 return currentCompanionAdditions(additions,view.rows);
}
