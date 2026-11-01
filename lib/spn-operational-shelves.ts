import receivingShelves from "../data/museum/spn-missing-receivers-shelves-v1.json";
import {spnDeferredShelfCases} from "./spn-deferred-shelf-cases";
import westSouth from "../data/museum/spn-west-south-shelves-v1.json";
import junagadh from "../data/museum/spn-junagadh-saurashtra-shelves-v1.json";
import {operationalSpnShelfPacket} from "./spn-east-remainder-shelves";
import westV46 from "../data/museum/spn-west-v46-shelves-v1.json";
import type {ShelfPlanningPacket} from "./museum-shelf-planning-context";

const receivingIds=new Set(receivingShelves.vitrines.flatMap(v=>v.allocations.map(a=>a.sourceId)));
function retainOtherAllocations(plan:ShelfPlanningPacket["vitrines"][number]){
 const allocations=plan.allocations.filter(a=>!receivingIds.has(a.sourceId));
 return {...plan,allocations};
}
const refreshedCodes=new Set([...westSouth.vitrines,...receivingShelves.vitrines].map(v=>v.code));

export const allOperationalSpnShelves:ShelfPlanningPacket={
 ...operationalSpnShelfPacket,version:"puri-odisha-shelves-deferred:"+operationalSpnShelfPacket.version+":"+westV46.version+":"+junagadh.version+":"+westSouth.version+":"+receivingShelves.version,
 exceptions:[...receivingShelves.vitrines.flatMap(v=>Object.entries(v.conceptualAssignedLoads).filter(([,load])=>load>1).map(([band,knownLoad])=>({code:v.code,band:Number(band),knownLoad,warning:"Reference-space estimate exceeds one band; check actual fit on site."}))),...(operationalSpnShelfPacket.exceptions??[]),...westSouth.vitrines.flatMap(v=>v.conceptualAssignedLoads.filter(b=>b.knownLoad>1).map(b=>({code:v.code,band:b.shelfIndex,knownLoad:b.knownLoad,warning:"Reference-space estimate exceeds one band; check actual fit on site."})))],
 vitrines:[...receivingShelves.vitrines,...[...operationalSpnShelfPacket.vitrines,...westV46.vitrines,...junagadh.vitrines].filter(v=>!refreshedCodes.has(v.code)&&!spnDeferredShelfCases.has(v.code)).map(retainOtherAllocations),...westSouth.vitrines.map(v=>({...v,conceptualAssignedLoads:Object.fromEntries(v.conceptualAssignedLoads.map(b=>[String(b.shelfIndex),b.knownLoad]))})).map(retainOtherAllocations)]
};
