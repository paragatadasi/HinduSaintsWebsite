import {db} from "./db";
import {readPhysicalLocationView} from "./museum-physical-locations";
import {readMuseumMoveSessionSource,registeredMoveProposal} from "./museum-move-session-source";
import {regionalPendingSourceIds} from "./spn-regional-pending-transfers";

export async function readRegionalPendingSources(){
 return db.$transaction(async tx=>{
  const view=await readPhysicalLocationView(sourceTx=>readMuseumMoveSessionSource(registeredMoveProposal.version,sourceTx),tx,undefined,false);
  return view.rows.filter(row=>regionalPendingSourceIds.includes(row.sourceId));
 },{isolationLevel:"RepeatableRead",timeout:60000});
}
