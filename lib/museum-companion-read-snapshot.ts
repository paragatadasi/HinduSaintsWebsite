import {db} from "./db";
import {readMuseumCompanionRevision} from "./museum-companion-read-revision";
import {cachedByMuseumRevision} from "./museum-snapshot-cache";
import type {Prisma} from "./generated/prisma/client";
import {withMuseumTransactionReads} from "./museum-transaction-reads";
import {readMuseumData} from "./museum-working-data";
import {readPhysicalLocationView} from "./museum-physical-locations";
import {readMuseumMoveSessionSource,registeredMoveProposal} from "./museum-move-session-source";
import {readCompanionAdditions,readEffectiveCompanionAdditions} from "./museum-companion-additions-state";
import {readGuideAlternativeDestinations} from "./museum-guide-alternatives";
import {currentCompanionAdditions} from "./museum-companion-addition-validation";
import {buildLatestSpnReview} from "./spn-reviewed-proposal";

// Private GET read model only. Mutation services continue to use their fresh
// transaction readers; callers must perform authorization before consulting it.
async function buildSnapshot(tx:Prisma.TransactionClient){
 return withMuseumTransactionReads(tx,async()=>{
  const revision=await readMuseumCompanionRevision(tx);
  const [current,physical,additions,alternatives]=await Promise.all([
   readMuseumData(tx),readPhysicalLocationView(client=>readMuseumMoveSessionSource(registeredMoveProposal.version,client),tx,undefined,false),
   readCompanionAdditions(tx),readGuideAlternativeDestinations(tx)
  ]);
  const effective=await readEffectiveCompanionAdditions(tx,{additions,alternatives});
  const valid=currentCompanionAdditions(effective,physical.rows);
  const destinations=[...valid,...alternatives.filter(row=>!valid.some(addition=>addition.sourceId===row.sourceId))];
  const shelfReview=buildLatestSpnReview(current.placements,alternatives,physical.rows);
  const review=valid.length?buildLatestSpnReview(current.placements,destinations,physical.rows):shelfReview;
  return {revision,current,physical,additions,alternatives,valid,destinations,review,shelfReview};
 });
}
export type MuseumCompanionReadSnapshot=Awaited<ReturnType<typeof buildSnapshot>>;
const globalReads=globalThis as typeof globalThis&{museumCompanionRevisionState?:{revisionRead:Promise<string>|null}};
const state=globalReads.museumCompanionRevisionState??={revisionRead:null};
export async function readSharedMuseumCompanionRevision(){
 const pending=state.revisionRead??=readMuseumCompanionRevision();
 try{return await pending;}finally{if(state.revisionRead===pending)state.revisionRead=null;}
}
export function readSharedMuseumCompanionSnapshot(){return cachedByMuseumRevision("museum-companion-read-snapshot",new Date().toISOString().slice(0,10),db,buildSnapshot);}
