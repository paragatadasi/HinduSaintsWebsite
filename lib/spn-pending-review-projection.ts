import packet from "../data/museum/spn-northern-voyage-approved-v19.json";
import type {ExplorerObservation} from "./spn-room-proposal";
import type {MuseumSaintPlacement} from "./museum-proposals";

export function projectNorthernPendingReview(rows:ExplorerObservation[],current:MuseumSaintPlacement[],overrides:{sourceId:string;vitrine:string}[]=[]){
 const pendingIds=new Set(packet.pendingReceiverSourceIds);
 const explicit=new Set(overrides.filter(row=>row.vitrine.trim()).map(row=>row.sourceId));
 const pendingPlacements:{sourceId:string;name:string;previousVitrine:string;reason:string}[]=[];
 const retained=rows.filter(row=>{
  if(!pendingIds.has(row.sourceId)||explicit.has(row.sourceId))return true;
  const baseline=packet.assignments.find(item=>item.sourceId===row.sourceId)?.capturedBaseline??row.baseline;
  const live=current.find(item=>item.saintId===row.saintId&&(baseline?item.id===baseline.placementId:item.sourceRecordId===row.sourceId));
  const saved=live?.arrangement;
  if(saved?.vitrine&&["Planned","Implemented"].includes(saved.status)&&(!baseline||saved.revision!==baseline.revision))return true;
  pendingPlacements.push({sourceId:row.sourceId,name:row.name,previousVitrine:row.effectiveVitrine,reason:"Destination pending until the main displays are settled"});
  return false;
 });
 return {rows:retained,pendingPlacements};
}
