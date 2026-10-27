
import {db} from "./db";
import {buildRoomMoveDisplays,vitrineLocation,type MoveConfirmation} from "./spn-room-move-domain";
import type {ExplorerObservation} from "./spn-room-proposal";

// Protected route only. Read historical physical confirmations independently of proposal revisions.
export async function readRoomMoveDisplays(rows:ExplorerObservation[]){
 const events=await db.auditEvent.findMany({where:{action:"museum.arrangement.updated",entityId:{in:rows.map(r=>r.sourceId)}},select:{afterJson:true,createdAt:true}});
 const confirmations:MoveConfirmation[]=[];
 for(const event of events){
  const value=event.afterJson;
  if(!value||typeof value!=="object"||Array.isArray(value))continue;
  if(value.museumId!=="museum-spn"||value.status!=="Implemented"||typeof value.placementId!=="string"||typeof value.vitrine!=="string"||!value.confirmedAt)continue;
  const location=vitrineLocation(value.vitrine,typeof value.shelf==="string"?value.shelf:"");
  if(location)confirmations.push({sourceId:value.placementId,location,at:event.createdAt.toISOString()});
 }
 return buildRoomMoveDisplays(rows,confirmations);
}


export async function readSpnMoveSnapshot(proposalVersion:string){
 const [{default:rawProposal},{default:designData},{correctSpnProposal},{reconcileSpnRoomProposal},{readMuseumData}]=await Promise.all([
  import("../data/museum/spn-room-proposal-final-v8.json"),import("../data/museum/spn-room-explorer-final-v8-design.json"),import("./spn-proposal-corrections"),import("./spn-room-proposal"),import("./museum-working-data")
 ]);
 const {proposal}=correctSpnProposal({proposal:rawProposal,designData});
 if(proposalVersion!==proposal.version)throw new Error("This proposal version is not available for the move companion.");
 const data=await readMuseumData();
 const rows=await readRoomMoveDisplays(reconcileSpnRoomProposal([...proposal.rows,...proposal.namedOnly],data.placements));
 return {proposalVersion:proposal.version,title:proposal.title,rows};
}
