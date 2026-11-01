import {db} from "./db";
import {readMuseumCompanionRevision} from "./museum-companion-read-revision";
import {RevisionSnapshotCache} from "./museum-revision-snapshot-cache";
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
async function buildSnapshot(){
 return db.$transaction(tx=>withMuseumTransactionReads(tx,async()=>{
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
 }),{isolationLevel:"RepeatableRead",timeout:60000});
}
export type MuseumCompanionReadSnapshot=Awaited<ReturnType<typeof buildSnapshot>>;
const globalReads=globalThis as typeof globalThis&{museumCompanionReadState?:{cache:RevisionSnapshotCache<MuseumCompanionReadSnapshot>;revisionRead:Promise<string>|null}};
const state=globalReads.museumCompanionReadState??={cache:new RevisionSnapshotCache<MuseumCompanionReadSnapshot>(),revisionRead:null};
export async function readSharedMuseumCompanionRevision(){
 const pending=state.revisionRead??=readMuseumCompanionRevision();
 try{return await pending;}finally{if(state.revisionRead===pending)state.revisionRead=null;}
}
export function readSharedMuseumCompanionSnapshot(revision:string){return state.cache.read(revision,buildSnapshot);}
