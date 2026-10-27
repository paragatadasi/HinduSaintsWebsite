
import type {ExplorerObservation} from "./spn-room-proposal";

export type MoveLocation = {kind:"vitrine"|"table";code:string;label:string;shelf?:string};
export type RoomMoveDisplay = {
 id:string;sourceId:string;saintId:string|null;name:string;tier:string;section:string;region:string;family:string;
 original:MoveLocation|null;current:MoveLocation|null;currentBasis:"confirmed"|"source"|"unknown";
 history:MoveLocation[];destination:string;holdReason:string;
};
export type MoveConfirmation = {sourceId:string;location:MoveLocation;at:string};
export function vitrineLocation(code:string,shelf=""):MoveLocation|null {
 return code ? {kind:"vitrine",code,label:`Vitrine ${code}${shelf ? " · Shelf "+shelf : ""}`,shelf} : null;
}
export function buildRoomMoveDisplays(rows:ExplorerObservation[], confirmations:MoveConfirmation[]):RoomMoveDisplay[] {
 return rows.map(row=>{
  const history=confirmations.filter(c=>c.sourceId===row.sourceId).sort((a,b)=>b.at.localeCompare(a.at));
  const original=vitrineLocation(row.sourceVitrine,row.sourceShelf);
  return {id:row.sourceId,sourceId:row.sourceId,saintId:row.saintId,name:row.name,tier:row.tier,section:row.section,
   region:row.regions.join(" · "),family:row.baseline?.familyKey??"",original,
   current:history[0]?.location??original,currentBasis:history.length?"confirmed":original?"source":"unknown",
   history:history.map(c=>c.location),destination:row.effectiveVitrine,
   holdReason:row.unresolved?"Identity needs review":row.reviewReason};
 });
}
export type MoveFilters={query:string;start:string;current:string;destination:string;region:string;section:string;tier:string;status:string;sort:string};
export const emptyMoveFilters:MoveFilters={query:"",start:"",current:"",destination:"",region:"",section:"",tier:"",status:"",sort:"tier"};
export function displayMoveStatus(row:RoomMoveDisplay){
 if(row.holdReason)return "Needs review";
 if(row.current?.kind==="table")return "In staging area";
 if(row.current?.code===row.destination)return row.currentBasis==="confirmed"?"Confirmed here":"Recorded here";
 return "Still to bring";
}
export function filterRoomMoveDisplays(rows:RoomMoveDisplay[],f:MoveFilters){
 const rank:Record<string,number>={Primary:0,Featured:0,Secondary:1,Tertiary:2};
 return rows.filter(r=>(!f.query||[r.name,r.family,r.sourceId].join(" ").toLowerCase().includes(f.query.trim().toLowerCase()))
 &&(!f.start||r.original?.code===f.start)&&(!f.current||r.current?.code===f.current)
 &&(!f.destination||r.destination===f.destination)&&(!f.region||r.region===f.region)
 &&(!f.section||r.section===f.section)&&(!f.tier||r.tier===f.tier)&&(!f.status||displayMoveStatus(r)===f.status))
 .sort((a,b)=>f.sort==="name"?a.name.localeCompare(b.name):f.sort==="current"?(a.current?.label??"").localeCompare(b.current?.label??"",undefined,{numeric:true})||a.name.localeCompare(b.name):(rank[a.tier]??3)-(rank[b.tier]??3)||a.name.localeCompare(b.name));
}


export const starterRowVitrines = ["2","78","36","29","76","28","27"] as const;
export function starterRowSummary(rows:RoomMoveDisplay[]){
 return starterRowVitrines.map(vitrine=>{
  const recorded=rows.filter(row=>row.current?.kind==="vitrine"&&row.current.code===vitrine);
  const incoming=rows.filter(row=>row.destination===vitrine);
  return {vitrine,recorded:recorded.length,incoming:incoming.length,
   staying:recorded.filter(row=>row.destination===vitrine).length,
   toBring:incoming.filter(row=>row.current?.kind!=="vitrine"||row.current.code!==vitrine).length,
   outgoing:recorded.filter(row=>row.destination!==vitrine).length,
   needsReview:incoming.filter(row=>row.holdReason).length};
 });
}
