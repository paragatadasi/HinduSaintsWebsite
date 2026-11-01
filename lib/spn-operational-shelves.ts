import hingeShelves from "../data/museum/spn-hinge-reviewed-shelves-v2.json";
import northern from "../data/museum/spn-northern-shelves-v1.json";
import kriya from "../data/museum/spn-vitrine5-shelves-v1.json";
import delta from "../data/museum/spn-source-shelf-coverage-delta-v1.json";
import {appendReviewedShelfSupplements} from "./museum-shelf-supplements";
import reviewedShelves from "../data/museum/spn-datta-odisha-reviewed-shelves-v2.json";
import receivingShelves from "../data/museum/spn-missing-receivers-shelves-v2.json";
import {spnDeferredShelfCases} from "./spn-deferred-shelf-cases";
import westSouth from "../data/museum/spn-west-south-shelves-v1.json";
import junagadh from "../data/museum/spn-junagadh-saurashtra-shelves-v1.json";
import {operationalSpnShelfPacket} from "./spn-east-remainder-shelves";
import westV46 from "../data/museum/spn-west-v46-shelves-v1.json";
import type {ShelfPlanningPacket} from "./museum-shelf-planning-context";

const revisedShelves=[...reviewedShelves.vitrines,...hingeShelves.vitrines];
const latestReviewedIds=new Set(revisedShelves.flatMap(v=>v.allocations.map(a=>a.sourceId)));
const receivingIds=new Set([...receivingShelves.vitrines,...revisedShelves].flatMap(v=>v.allocations.map(a=>a.sourceId)));
function retainOtherAllocations(plan:ShelfPlanningPacket["vitrines"][number]){
 const allocations=plan.allocations.filter(a=>!receivingIds.has(a.sourceId));
 return {...plan,allocations};
}
const refreshedCodes=new Set([...westSouth.vitrines,...receivingShelves.vitrines,...revisedShelves].map(v=>v.code));

const reviewedOperationalShelves:ShelfPlanningPacket={
 ...operationalSpnShelfPacket,version:"reviewed-shelves:"+operationalSpnShelfPacket.version+":"+westV46.version+":"+junagadh.version+":"+westSouth.version+":"+receivingShelves.version+":"+reviewedShelves.version+":"+hingeShelves.version,
 exceptions:[...[...revisedShelves,...receivingShelves.vitrines].flatMap(v=>Object.entries(v.conceptualAssignedLoads).filter(([,load])=>load>1).map(([band,knownLoad])=>({code:v.code,band:Number(band),knownLoad,warning:"Reference-space estimate exceeds one band; check actual fit on site."}))),...(operationalSpnShelfPacket.exceptions??[]),...westSouth.vitrines.flatMap(v=>v.conceptualAssignedLoads.filter(b=>b.knownLoad>1).map(b=>({code:v.code,band:b.shelfIndex,knownLoad:b.knownLoad,warning:"Reference-space estimate exceeds one band; check actual fit on site."})))],
 vitrines:[...revisedShelves,...receivingShelves.vitrines.map(v=>({...v,allocations:v.allocations.filter(a=>!latestReviewedIds.has(a.sourceId))})),...[...operationalSpnShelfPacket.vitrines,...westV46.vitrines,...junagadh.vitrines].filter(v=>!refreshedCodes.has(v.code)&&!spnDeferredShelfCases.has(v.code)).map(retainOtherAllocations),...westSouth.vitrines.map(v=>({...v,conceptualAssignedLoads:Object.fromEntries(v.conceptualAssignedLoads.map(b=>[String(b.shelfIndex),b.knownLoad]))})).map(retainOtherAllocations)]
};

export const allOperationalSpnShelves=appendReviewedShelfSupplements(reviewedOperationalShelves,[...northern.vitrines,...kriya.vitrines],delta);
