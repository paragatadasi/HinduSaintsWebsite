import captured from "../data/museum/spn-vraj-east-shelves-v1.json";
import packet from "../data/museum/spn-east-remainder-guide-v1.json";
import {paramanandObjectReview} from "./spn-paramanand-reviewed-object";
import type {ShelfPlanningPacket} from "./museum-shelf-planning-context";

const extra=packet.supplementalShelfAllocations[0];
const puriSources=captured.vitrines.find(v=>v.code===extra.code)?.groups.find(g=>g.id===extra.groupId)?.sourceIds;
if(!puriSources||packet.sourceShelfVersion!==captured.version||packet.sourceShelfRevision!==captured.draftRevision||
 packet.reviewedObjectVersion!==paramanandObjectReview.version||extra.sourceId!==paramanandObjectReview.sourceId||
 extra.saintId!==paramanandObjectReview.saintId||extra.sourceRevision!==paramanandObjectReview.sourceRevision||
 extra.code!==paramanandObjectReview.destination||extra.suggestedShelfIndex!==5||extra.knownFootprint!==null||
 captured.vitrines.some(v=>v.allocations.some(a=>a.sourceId===extra.sourceId)))
 throw new Error("The reviewed Eastern shelf supplement changed.");

// Keep the captured 347-source packet intact; the reviewed arm-support is a later, scoped recommendation.
export const operationalSpnShelfPacket:ShelfPlanningPacket={...captured,version:"spn-vraj-east-shelves-2026-10-31-v2",vitrines:captured.vitrines.map(v=>v.code!==extra.code?v:{...v,
 groups:v.groups.map(g=>g.id!==extra.groupId?g:{...g,sourceIds:[...puriSources,extra.sourceId]}),
 allocations:[...v.allocations,extra],notes:[...(v.notes??[]),extra.reviewAlerts[0].message]})};
export const eastRemainderShelfPacket:ShelfPlanningPacket={...operationalSpnShelfPacket,
 vitrines:operationalSpnShelfPacket.vitrines.filter(v=>packet.vitrines.includes(v.code))};
