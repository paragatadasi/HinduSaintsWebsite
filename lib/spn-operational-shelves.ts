import {operationalSpnShelfPacket} from "./spn-east-remainder-shelves";
import westV46 from "../data/museum/spn-west-v46-shelves-v1.json";
import type {ShelfPlanningPacket} from "./museum-shelf-planning-context";

export const allOperationalSpnShelves:ShelfPlanningPacket={
 ...operationalSpnShelfPacket,version:operationalSpnShelfPacket.version+":"+westV46.version,
 vitrines:[...operationalSpnShelfPacket.vitrines,...westV46.vitrines]
};
