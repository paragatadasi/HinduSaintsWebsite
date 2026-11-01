import {spnDeferredShelfCases} from "./spn-deferred-shelf-cases";
import westSouth from "../data/museum/spn-west-south-shelves-v1.json";
import junagadh from "../data/museum/spn-junagadh-saurashtra-shelves-v1.json";
import {operationalSpnShelfPacket} from "./spn-east-remainder-shelves";
import westV46 from "../data/museum/spn-west-v46-shelves-v1.json";
import type {ShelfPlanningPacket} from "./museum-shelf-planning-context";

const refreshedCodes=new Set(westSouth.vitrines.map(v=>v.code));

export const allOperationalSpnShelves:ShelfPlanningPacket={
 ...operationalSpnShelfPacket,version:"puri-odisha-shelves-deferred:"+operationalSpnShelfPacket.version+":"+westV46.version+":"+junagadh.version+":"+westSouth.version,
 exceptions:[...(operationalSpnShelfPacket.exceptions??[]),...westSouth.vitrines.flatMap(v=>v.conceptualAssignedLoads.filter(b=>b.knownLoad>1).map(b=>({code:v.code,band:b.shelfIndex,knownLoad:b.knownLoad,warning:"Reference-space estimate exceeds one band; check actual fit on site."})))],
 vitrines:[...[...operationalSpnShelfPacket.vitrines,...westV46.vitrines,...junagadh.vitrines].filter(v=>!refreshedCodes.has(v.code)&&!spnDeferredShelfCases.has(v.code)),...westSouth.vitrines.map(v=>({...v,conceptualAssignedLoads:Object.fromEntries(v.conceptualAssignedLoads.map(b=>[String(b.shelfIndex),b.knownLoad]))}))]
};
